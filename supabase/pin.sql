-- ============================================================
-- SGO-Fuel · PIN com hash (pgcrypto) + bloqueio por tentativas
-- ============================================================
-- Rode DEPOIS de rules.sql. Idempotente. Retrocompatível:
--  - PINs em texto (legados) continuam validando;
--  - novos/alterados são salvos com hash bcrypt automaticamente (trigger);
--  - 5 erros de PIN bloqueiam o cartão por 15 min.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

alter table fleet_cards add column if not exists failed_pin_attempts int not null default 0;
alter table fleet_cards add column if not exists pin_locked_until timestamptz;

-- ---- Hash transparente do PIN (o app continua mandando texto) ----
create or replace function fn_hash_card_pin() returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  -- Hasheia qualquer PIN que ainda não seja bcrypt ($2...), inclusive migrando legados.
  if new.pin is not null and new.pin <> '' and left(new.pin, 2) <> '$2' then
    new.pin := crypt(new.pin, gen_salt('bf'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hash_card_pin on fleet_cards;
create trigger trg_hash_card_pin before insert or update on fleet_cards
  for each row execute function fn_hash_card_pin();

-- ============================================================
-- fn_authorize_card — versão FINAL (regras + saldo + PIN com hash/lock)
-- ============================================================
create or replace function fn_authorize_card(
  p_card_number text,
  p_pin text default null,
  p_liters numeric default 0,
  p_price numeric default 0,
  p_pump_id uuid default null
)
returns jsonb
language plpgsql
set search_path = public, extensions
as $$
declare
  v_card fleet_cards%rowtype;
  v_amount numeric(12,2);
  v_before numeric(12,2);
  v_after numeric(12,2);
  v_txid uuid;
  v_reason text;
  v_ok boolean := true;
  v_pin_wrong boolean := false;
  v_attempts int;
  v_local timestamp;
  v_dow int;
  v_hour int;
  v_day_start timestamptz;
  v_today numeric(12,2);
begin
  v_amount := round(coalesce(p_liters, 0) * coalesce(p_price, 0), 2);
  v_local := now() at time zone 'America/Sao_Paulo';
  v_dow := extract(dow from v_local);
  v_hour := extract(hour from v_local);
  v_day_start := date_trunc('day', v_local) at time zone 'America/Sao_Paulo';

  select * into v_card
    from fleet_cards
    where card_number = regexp_replace(coalesce(p_card_number, ''), '\s', '', 'g')
    limit 1;

  if v_card.id is null then
    return jsonb_build_object('ok', false, 'reason', 'Cartão não reconhecido nesta rede.');
  end if;

  v_before := v_card.balance_brl;

  if v_card.status <> 'ACTIVE' then
    v_ok := false; v_reason := 'Cartão ' || lower(v_card.status::text) || '.';
  elsif v_card.pin_locked_until is not null and now() < v_card.pin_locked_until then
    v_ok := false;
    v_reason := 'Cartão bloqueado por tentativas de PIN até ' ||
                to_char(timezone('America/Sao_Paulo', v_card.pin_locked_until), 'HH24:MI') || '.';
  elsif v_card.pin is not null and coalesce(p_pin, '') = '' then
    v_ok := false; v_reason := 'PIN obrigatório para este cartão.';
  elsif v_card.pin is not null and not (
          case when left(v_card.pin, 2) = '$2' then crypt(p_pin, v_card.pin) = v_card.pin
               else v_card.pin = p_pin end
        ) then
    v_ok := false; v_pin_wrong := true;
  elsif v_amount <= 0 then
    v_ok := false; v_reason := 'Valor inválido.';
  elsif v_card.allowed_weekdays is not null and array_length(v_card.allowed_weekdays, 1) is not null
        and not (v_dow = any(v_card.allowed_weekdays)) then
    v_ok := false; v_reason := 'Cartão não liberado para hoje.';
  elsif v_card.allowed_hour_start is not null and v_card.allowed_hour_end is not null
        and not (v_hour >= v_card.allowed_hour_start and v_hour < v_card.allowed_hour_end) then
    v_ok := false;
    v_reason := 'Fora do horário permitido (' || v_card.allowed_hour_start || 'h–' || v_card.allowed_hour_end || 'h).';
  elsif v_card.max_liters_per_tx is not null and p_liters > v_card.max_liters_per_tx then
    v_ok := false;
    v_reason := 'Acima do limite por abastecimento (' || trim(to_char(v_card.max_liters_per_tx, 'FM999990')) || ' L).';
  elsif v_card.balance_brl < v_amount then
    v_ok := false;
    v_reason := 'Saldo insuficiente. Disponível R$ ' || to_char(v_card.balance_brl, 'FM999G999G990D00');
  elsif v_card.daily_limit_brl is not null then
    select coalesce(sum(amount_brl), 0) into v_today
      from card_transactions
      where card_id = v_card.id and status = 'APPROVED' and created_at >= v_day_start;
    if v_today + v_amount > v_card.daily_limit_brl then
      v_ok := false;
      v_reason := 'Limite diário excedido (R$ ' || to_char(v_card.daily_limit_brl, 'FM999G999G990D00') || ').';
    end if;
  end if;

  -- Efeito colateral do PIN: conta tentativas e bloqueia após 5
  if v_pin_wrong then
    v_attempts := coalesce(v_card.failed_pin_attempts, 0) + 1;
    if v_attempts >= 5 then
      update fleet_cards set failed_pin_attempts = 0, pin_locked_until = now() + interval '15 minutes'
        where id = v_card.id;
      v_reason := 'PIN incorreto. Cartão bloqueado por 15 min após 5 tentativas.';
    else
      update fleet_cards set failed_pin_attempts = v_attempts where id = v_card.id;
      v_reason := 'PIN incorreto (' || v_attempts || '/5).';
    end if;
  end if;

  if v_ok then
    -- sucesso: debita e zera contador de tentativas
    update fleet_cards
      set balance_brl = balance_brl - v_amount,
          failed_pin_attempts = 0,
          pin_locked_until = null
      where id = v_card.id
      returning balance_brl into v_after;

    insert into card_transactions
      (tenant_id, card_id, card_number, pump_id, driver_id, vehicle_id, liters, price_per_l, amount_brl, status)
      values (v_card.tenant_id, v_card.id, v_card.card_number, p_pump_id, v_card.driver_id, v_card.vehicle_id,
              p_liters, p_price, v_amount, 'APPROVED')
      returning id into v_txid;

    if v_card.driver_id is not null and v_card.vehicle_id is not null and p_pump_id is not null then
      insert into fuelings (tenant_id, pump_id, vehicle_id, driver_id, quota_l, delivered_l, status, cost_brl)
        values (v_card.tenant_id, p_pump_id, v_card.vehicle_id, v_card.driver_id, p_liters, p_liters, 'COMPLETED', v_amount);
    end if;

    return jsonb_build_object(
      'ok', true, 'tx_id', v_txid, 'holder', v_card.holder_name,
      'amount', v_amount, 'balance_before', v_before, 'balance_after', v_after
    );
  else
    insert into card_transactions
      (tenant_id, card_id, card_number, pump_id, driver_id, vehicle_id, liters, price_per_l, amount_brl, status, decline_reason)
      values (v_card.tenant_id, v_card.id, v_card.card_number, p_pump_id, v_card.driver_id, v_card.vehicle_id,
              p_liters, p_price, v_amount, 'DECLINED', v_reason)
      returning id into v_txid;

    return jsonb_build_object(
      'ok', false, 'reason', v_reason, 'tx_id', v_txid, 'holder', v_card.holder_name,
      'amount', v_amount, 'balance_before', v_before, 'balance_after', v_before
    );
  end if;
end;
$$;

-- ============================================================
-- Fim. PINs agora ficam com hash; 5 erros bloqueiam por 15 min.
-- ============================================================

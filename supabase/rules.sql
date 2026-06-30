-- ============================================================
-- SGO-Fuel · Regras de uso do cartão + estorno/ajuste de saldo
-- ============================================================
-- Rode DEPOIS de wallet.sql. Idempotente.
--  #1 Regras de uso: limite por abastecimento, limite diário (R$),
--     dias da semana e janela de horário permitidos.
--  #2 Estorno/ajuste: fn_adjust_card (permite negativo, nunca < 0).
-- ============================================================

-- ---- #1 Colunas de regra (todas opcionais; null = sem restrição) ----
alter table fleet_cards add column if not exists max_liters_per_tx numeric(10,2);
alter table fleet_cards add column if not exists daily_limit_brl numeric(12,2);
alter table fleet_cards add column if not exists allowed_weekdays int[];      -- 0=Dom .. 6=Sáb
alter table fleet_cards add column if not exists allowed_hour_start int;       -- 0..23
alter table fleet_cards add column if not exists allowed_hour_end int;         -- 1..24 (exclusivo)

-- ---- #2 Método de ajuste/estorno ----
alter type recharge_method add value if not exists 'ESTORNO';

-- ============================================================
-- fn_authorize_card — agora com REGRAS DE USO (redefine a de wallet.sql)
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
as $$
declare
  v_card fleet_cards%rowtype;
  v_amount numeric(12,2);
  v_before numeric(12,2);
  v_after numeric(12,2);
  v_txid uuid;
  v_reason text;
  v_ok boolean := true;
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
  elsif v_card.pin is not null and coalesce(p_pin, '') = '' then
    v_ok := false; v_reason := 'PIN obrigatório para este cartão.';
  elsif v_card.pin is not null and v_card.pin <> p_pin then
    v_ok := false; v_reason := 'PIN incorreto.';
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

  if v_ok then
    update fleet_cards set balance_brl = balance_brl - v_amount
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
-- #2 fn_adjust_card — estorno (negativo) ou ajuste (positivo), nunca < 0
-- ============================================================
create or replace function fn_adjust_card(
  p_card_id uuid,
  p_amount numeric,
  p_reason text default null
)
returns numeric
language plpgsql
as $$
declare
  v_tenant uuid;
  v_cur numeric(12,2);
  v_new numeric(12,2);
begin
  if p_amount is null or p_amount = 0 then
    raise exception 'Valor de ajuste inválido.';
  end if;
  select tenant_id, balance_brl into v_tenant, v_cur from fleet_cards where id = p_card_id;
  if v_tenant is null then
    raise exception 'Cartão não encontrado.';
  end if;
  if v_cur + p_amount < 0 then
    raise exception 'Ajuste deixaria o saldo negativo (saldo atual R$ %).', v_cur;
  end if;
  update fleet_cards set balance_brl = balance_brl + p_amount
    where id = p_card_id
    returning balance_brl into v_new;
  insert into card_recharges (tenant_id, card_id, amount_brl, method, note, balance_after, created_by)
    values (v_tenant, p_card_id, p_amount, 'ESTORNO', coalesce(nullif(trim(p_reason), ''), 'Ajuste manual'), v_new, auth.uid());
  return v_new;
end;
$$;

-- ============================================================
-- Fim. Regras valem em /maquininha, /totem e /app. Estorno em /cartoes/[id].
-- ============================================================

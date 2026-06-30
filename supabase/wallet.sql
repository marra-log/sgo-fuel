-- ============================================================
-- SGO-Fuel · Carteira PRÉ-PAGA do cartão (saldo em R$)
-- ============================================================
-- Rode DEPOIS de schema.sql e cards.sql no SQL Editor do Supabase.
-- Modelo: o cliente RECARREGA saldo (R$) no cartão branco NFC.
-- O motorista passa na Smart POS -> o sistema DEBITA o saldo de
-- forma atômica e gera o comprovante. Idempotente: pode rodar de novo.
-- ============================================================

-- Saldo atual do cartão (carteira pré-paga)
alter table fleet_cards add column if not exists balance_brl numeric(12,2) not null default 0;

-- Método da recarga
do $$ begin
  create type recharge_method as enum ('MANUAL', 'PIX', 'BOLETO', 'TED');
exception when duplicate_object then null; end $$;

-- Histórico de recargas (entradas de saldo)
create table if not exists card_recharges (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  card_id uuid not null references fleet_cards(id) on delete cascade,
  amount_brl numeric(12,2) not null,
  method recharge_method not null default 'MANUAL',
  note text,
  balance_after numeric(12,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists card_recharges_card_idx on card_recharges(card_id, created_at desc);
create index if not exists card_recharges_tenant_idx on card_recharges(tenant_id, created_at desc);

alter table card_recharges enable row level security;
do $$ begin
  drop policy if exists card_recharges_all on card_recharges;
  create policy card_recharges_all on card_recharges
    for all to authenticated
    using (tenant_id in (select user_tenant_ids()))
    with check (tenant_id in (select user_tenant_ids()));
end $$;

-- ============================================================
-- RPC: recarregar saldo (creditar)
-- SECURITY INVOKER (padrão) => RLS garante que o cartão é do tenant do usuário.
-- ============================================================
create or replace function fn_recharge_card(
  p_card_id uuid,
  p_amount numeric,
  p_method text default 'MANUAL',
  p_note text default null
)
returns numeric
language plpgsql
as $$
declare
  v_tenant uuid;
  v_new numeric(12,2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor de recarga inválido.';
  end if;

  -- RLS: só retorna se o cartão for do tenant do usuário autenticado
  select tenant_id into v_tenant from fleet_cards where id = p_card_id;
  if v_tenant is null then
    raise exception 'Cartão não encontrado.';
  end if;

  update fleet_cards
    set balance_brl = balance_brl + p_amount
    where id = p_card_id
    returning balance_brl into v_new;

  insert into card_recharges (tenant_id, card_id, amount_brl, method, note, balance_after, created_by)
    values (v_tenant, p_card_id, p_amount, coalesce(p_method, 'MANUAL')::recharge_method, p_note, v_new, auth.uid());

  return v_new;
end;
$$;

-- ============================================================
-- RPC: autorizar e DEBITAR o cartão (passada na Smart POS)
-- Valida status, PIN e saldo; debita de forma atômica; registra a
-- transação (aprovada ou negada) e gera o abastecimento se houver vínculo.
-- Retorna um JSON com o resultado para o terminal montar o comprovante.
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
begin
  v_amount := round(coalesce(p_liters, 0) * coalesce(p_price, 0), 2);

  -- RLS limita a busca aos cartões do tenant do usuário
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
  elsif v_card.balance_brl < v_amount then
    v_ok := false;
    v_reason := 'Saldo insuficiente. Disponível R$ ' || to_char(v_card.balance_brl, 'FM999G999G990D00');
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
-- Fim. Recarga em /cartoes/[id] e débito real em /maquininha.
-- ============================================================

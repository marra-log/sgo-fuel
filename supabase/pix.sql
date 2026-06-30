-- ============================================================
-- SGO-Fuel · PIX automático (cobrança + confirmação por webhook)
-- ============================================================
-- Rode DEPOIS de wallet.sql. Estrutura pronta para conectar um PSP
-- (Asaas, Efí/Gerencianet, Mercado Pago…): o app cria a cobrança PENDENTE,
-- o provedor confirma o pagamento e chama nosso webhook, que credita o saldo.
-- Idempotente.
-- ============================================================

create table if not exists pix_charges (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  card_id uuid not null references fleet_cards(id) on delete cascade,
  txid text not null unique,
  amount_brl numeric(12,2) not null,
  provider text,
  status text not null default 'PENDING',     -- PENDING | PAID | CANCELED
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists pix_charges_tenant_idx on pix_charges(tenant_id, created_at desc);
create index if not exists pix_charges_card_idx on pix_charges(card_id, created_at desc);

alter table pix_charges enable row level security;
do $$ begin
  drop policy if exists pix_charges_all on pix_charges;
  create policy pix_charges_all on pix_charges
    for all to authenticated
    using (tenant_id in (select user_tenant_ids()))
    with check (tenant_id in (select user_tenant_ids()));
end $$;

-- App (autenticado) cria a cobrança pendente com o txid do QR PIX.
create or replace function fn_create_pix_charge(
  p_card_id uuid,
  p_amount numeric,
  p_txid text,
  p_provider text default null
)
returns text
language plpgsql
as $$
declare
  v_tenant uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor inválido.';
  end if;
  select tenant_id into v_tenant from fleet_cards where id = p_card_id;
  if v_tenant is null then
    raise exception 'Cartão não encontrado.';
  end if;
  insert into pix_charges (tenant_id, card_id, txid, amount_brl, provider, status)
    values (v_tenant, p_card_id, p_txid, p_amount, p_provider, 'PENDING')
    on conflict (txid) do nothing;
  return p_txid;
end;
$$;

-- Webhook (service role) confirma o pagamento: credita o saldo + registra a
-- recarga e marca a cobrança como PAID. SECURITY DEFINER + idempotente.
create or replace function fn_confirm_pix(p_txid text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge pix_charges%rowtype;
  v_new numeric(12,2);
begin
  select * into v_charge from pix_charges where txid = p_txid;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'Cobrança não encontrada');
  end if;
  if v_charge.status = 'PAID' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  update fleet_cards set balance_brl = balance_brl + v_charge.amount_brl
    where id = v_charge.card_id
    returning balance_brl into v_new;

  insert into card_recharges (tenant_id, card_id, amount_brl, method, note, balance_after)
    values (v_charge.tenant_id, v_charge.card_id, v_charge.amount_brl, 'PIX',
            'PIX confirmado (' || p_txid || ')', v_new);

  update pix_charges set status = 'PAID', paid_at = now() where id = v_charge.id;

  return jsonb_build_object('ok', true, 'amount', v_charge.amount_brl, 'balance', v_new);
end;
$$;

-- ============================================================
-- Webhook: POST /api/webhooks/pix?secret=...  (configure no PSP)
-- ============================================================

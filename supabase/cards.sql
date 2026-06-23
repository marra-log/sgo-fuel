-- ============================================================
-- SGO-Fuel · Cartão de frota + transações (módulo de pagamento)
-- ============================================================
-- Rode DEPOIS de schema.sql no SQL Editor do Supabase.
-- Modelo: cartão private label FECHADO (só vale na rede da empresa),
-- identificado por número + NFC/QR, com cota mensal em litros.
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

do $$ begin
  create type card_status as enum ('ACTIVE', 'BLOCKED', 'LOST');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_tx_status as enum ('APPROVED', 'DECLINED');
exception when duplicate_object then null; end $$;

-- Cartões de frota
create table if not exists fleet_cards (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  card_number text not null,                 -- ex: 7000123456789010
  nfc_uid text,                              -- UID da tag NFC (opcional)
  holder_name text,                          -- nome impresso
  driver_id uuid references drivers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  status card_status not null default 'ACTIVE',
  monthly_limit_l numeric(10,2) not null default 1000,  -- cota mensal em litros
  pin text,                                  -- PIN curto (demo: texto; produção: hash)
  created_at timestamptz not null default now(),
  unique (tenant_id, card_number)
);
create index if not exists fleet_cards_tenant_idx on fleet_cards(tenant_id);
create index if not exists fleet_cards_number_idx on fleet_cards(tenant_id, card_number);

-- Transações do cartão (cada passada na máquina)
create table if not exists card_transactions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  card_id uuid references fleet_cards(id) on delete set null,
  card_number text,                          -- snapshot (caso o cartão seja apagado)
  pump_id uuid references pumps(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  liters numeric(10,2) not null default 0,
  price_per_l numeric(10,3) not null default 0,
  amount_brl numeric(12,2) not null default 0,
  status card_tx_status not null,
  decline_reason text,
  created_at timestamptz not null default now()
);
create index if not exists card_tx_tenant_idx on card_transactions(tenant_id, created_at desc);
create index if not exists card_tx_card_idx on card_transactions(card_id, created_at desc);

-- ===== RLS =====
alter table fleet_cards enable row level security;
alter table card_transactions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['fleet_cards','card_transactions']
  loop
    execute format('drop policy if exists %1$I_all on %1$I', t);
    execute format(
      'create policy %1$I_all on %1$I
        for all to authenticated
        using (tenant_id in (select user_tenant_ids()))
        with check (tenant_id in (select user_tenant_ids()))',
      t
    );
  end loop;
end $$;

-- ============================================================
-- Fim. /cartoes e /maquininha já funcionam após este script.
-- ============================================================

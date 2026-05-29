-- ============================================================
-- SGO-Fuel · Schema inicial (Bloco A1)
-- ============================================================
-- Como aplicar:
-- 1. Abra https://supabase.com/dashboard/project/jozeyczhxdcfvtvumiph/sql/new
-- 2. Cole TUDO abaixo
-- 3. Clique em "Run"
-- 4. Verifique em Database → Tables que apareceram as tabelas
-- ============================================================

-- ===== Helpers ==============================================

create extension if not exists "uuid-ossp";

-- ===== Tipos enumerados =====================================

do $$ begin
  create type plan as enum ('STARTER', 'PRO', 'ENTERPRISE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('OWNER', 'MANAGER', 'VIEWER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fuel_type as enum ('DIESEL_S10', 'DIESEL_S500', 'ARLA32', 'GASOLINE', 'ETHANOL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pump_status as enum ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'BLOCKED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fueling_status as enum ('AUTHORIZED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type anomaly_type as enum (
    'CONTAINER_PATTERN', 'PLATE_MISMATCH', 'QUOTA_EXCEEDED',
    'OFFHOURS', 'TANK_DRAIN', 'COMM_LOSS'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type anomaly_severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
exception when duplicate_object then null; end $$;

-- ===== Tabelas ==============================================

-- Tenant = empresa frotista
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cnpj text unique,
  plan plan not null default 'STARTER',
  created_at timestamptz not null default now()
);

-- Liga usuário do Supabase Auth ao tenant + papel
create table if not exists tenant_members (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role user_role not null default 'MANAGER',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists tenant_members_user_idx on tenant_members(user_id);
create index if not exists tenant_members_tenant_idx on tenant_members(tenant_id);

create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  cpf text,
  phone text,
  cnh text,
  score int not null default 100,
  active boolean not null default true,
  nfc_tag_uid text,
  created_at timestamptz not null default now()
);
create index if not exists drivers_tenant_idx on drivers(tenant_id);

create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plate text not null,
  model text,
  fuel_type fuel_type not null default 'DIESEL_S10',
  tank_capacity_l int,
  avg_consumption numeric(5,2),
  current_odometer int default 0,
  current_driver_id uuid references drivers(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, plate)
);
create index if not exists vehicles_tenant_idx on vehicles(tenant_id);

create table if not exists yards (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  lat numeric(10,6),
  lng numeric(10,6),
  created_at timestamptz not null default now()
);
create index if not exists yards_tenant_idx on yards(tenant_id);

create table if not exists tanks (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  yard_id uuid not null references yards(id) on delete cascade,
  name text not null,
  fuel_type fuel_type not null,
  capacity_l int not null,
  created_at timestamptz not null default now()
);
create index if not exists tanks_tenant_idx on tanks(tenant_id);

create table if not exists pumps (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  yard_id uuid references yards(id) on delete set null,
  partner_station text,
  tank_id uuid references tanks(id) on delete set null,
  serial_number text not null,
  iot_device_id text,
  device_version text,
  status pump_status not null default 'OFFLINE',
  last_heartbeat timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, serial_number)
);
create index if not exists pumps_tenant_idx on pumps(tenant_id);

create table if not exists routes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  origin text,
  destination text,
  distance_km numeric(8,2),
  fuel_type fuel_type not null default 'DIESEL_S10',
  quota_l numeric(8,2),
  valid_until timestamptz,
  driver_id uuid references drivers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists routes_tenant_idx on routes(tenant_id);

create table if not exists fuelings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  pump_id uuid not null references pumps(id) on delete restrict,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  driver_id uuid not null references drivers(id) on delete restrict,
  route_id uuid references routes(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  quota_l numeric(8,2) not null,
  delivered_l numeric(8,2),
  odometer int,
  status fueling_status not null default 'AUTHORIZED',
  alpr_plate text,
  alpr_confidence numeric(4,3),
  video_url text,
  cost_brl numeric(10,2)
);
create index if not exists fuelings_tenant_started_idx on fuelings(tenant_id, started_at desc);

create table if not exists anomalies (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  fueling_id uuid references fuelings(id) on delete set null,
  pump_id uuid not null references pumps(id) on delete cascade,
  type anomaly_type not null,
  severity anomaly_severity not null default 'MEDIUM',
  video_url text,
  snapshot_url text,
  description text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);
create index if not exists anomalies_tenant_open_idx on anomalies(tenant_id, detected_at desc) where resolved_at is null;

create table if not exists fiscal_invoices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tank_id uuid references tanks(id) on delete set null,
  access_key text not null,
  supplier text,
  volume_l numeric(10,2),
  value_brl numeric(12,2),
  issued_at timestamptz,
  xml_blob_url text,
  unique (tenant_id, access_key)
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_type text not null,
  actor_id text,
  action text not null,
  target text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_tenant_idx on audit_logs(tenant_id, created_at desc);

-- ===== RLS (Row Level Security) =============================
-- Cada tenant só vê seus próprios dados.
-- A regra é: o user_id autenticado precisa ser membro do tenant da linha.

alter table tenants enable row level security;
alter table tenant_members enable row level security;
alter table drivers enable row level security;
alter table vehicles enable row level security;
alter table yards enable row level security;
alter table tanks enable row level security;
alter table pumps enable row level security;
alter table routes enable row level security;
alter table fuelings enable row level security;
alter table anomalies enable row level security;
alter table fiscal_invoices enable row level security;
alter table audit_logs enable row level security;

-- Helper: tenants do usuário logado
create or replace function user_tenant_ids() returns setof uuid
language sql security definer stable as $$
  select tenant_id from tenant_members where user_id = auth.uid()
$$;

-- Policy padrão: SELECT/INSERT/UPDATE/DELETE liberado se o tenant_id da linha
-- estiver entre os tenants do usuário logado.
do $$
declare t text;
begin
  foreach t in array array[
    'drivers','vehicles','yards','tanks','pumps','routes',
    'fuelings','anomalies','fiscal_invoices','audit_logs'
  ]
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

-- tenants: usuário vê tenants em que é membro
drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants
  for select to authenticated
  using (id in (select user_tenant_ids()));

-- Usuário autenticado pode criar tenant (vira OWNER via trigger)
drop policy if exists tenants_insert on tenants;
create policy tenants_insert on tenants
  for insert to authenticated
  with check (true);

-- tenants: OWNER pode atualizar dados
drop policy if exists tenants_update on tenants;
create policy tenants_update on tenants
  for update to authenticated
  using (
    id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role = 'OWNER'
    )
  );

-- tenant_members: usuário vê seus próprios membros do tenant
drop policy if exists tenant_members_select on tenant_members;
create policy tenant_members_select on tenant_members
  for select to authenticated
  using (tenant_id in (select user_tenant_ids()) or user_id = auth.uid());

drop policy if exists tenant_members_insert on tenant_members;
create policy tenant_members_insert on tenant_members
  for insert to authenticated
  with check (
    -- Permite criar a primeira ligação (signup) E quando o user é OWNER
    user_id = auth.uid()
    or tenant_id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role = 'OWNER'
    )
  );

-- ===== Trigger: ao criar tenant, dono vira OWNER ==============

create or replace function on_tenant_created() returns trigger
language plpgsql security definer as $$
begin
  insert into tenant_members (tenant_id, user_id, role)
  values (new.id, auth.uid(), 'OWNER')
  on conflict (tenant_id, user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_tenant_created on tenants;
create trigger trg_on_tenant_created
  after insert on tenants
  for each row execute function on_tenant_created();

-- ============================================================
-- Fim do schema. Próximo bloco (A2) adiciona CRUDs via UI.
-- ============================================================

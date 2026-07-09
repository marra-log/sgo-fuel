-- ============================================================
-- SGO-Fuel · CORREÇÃO de RLS (criar empresa / cadastros voltam a funcionar)
-- ============================================================
-- Sintoma: "Criar empresa" retornava 403 (new row violates row-level security
-- policy for table "tenants"). Faltava/estava quebrada a policy de INSERT.
-- Este script RE-ASSERTA todas as policies de RLS de forma idempotente.
-- Rode no Supabase → SQL Editor → Run. Não apaga dados.
-- ============================================================

-- Helper: tenants do usuário logado
create or replace function user_tenant_ids() returns setof uuid
language sql security definer stable as $$
  select tenant_id from tenant_members where user_id = auth.uid()
$$;

-- Policies padrão (tenant_id-scoped) para todas as tabelas de negócio que existirem
do $$
declare t text;
begin
  foreach t in array array[
    'drivers','vehicles','yards','tanks','pumps','routes',
    'fuelings','anomalies','fiscal_invoices','audit_logs',
    'fleet_cards','card_transactions','card_recharges','pix_charges'
  ]
  loop
    if to_regclass(t) is null then continue; end if;
    execute format('alter table %I enable row level security', t);
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

-- ===== tenants =====
alter table tenants enable row level security;

drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants
  for select to authenticated
  using (id in (select user_tenant_ids()));

drop policy if exists tenants_insert on tenants;
create policy tenants_insert on tenants
  for insert to authenticated
  with check (true);

drop policy if exists tenants_update on tenants;
create policy tenants_update on tenants
  for update to authenticated
  using (id in (
    select tenant_id from tenant_members
    where user_id = auth.uid() and role = 'OWNER'
  ));

-- ===== tenant_members =====
alter table tenant_members enable row level security;

drop policy if exists tenant_members_select on tenant_members;
create policy tenant_members_select on tenant_members
  for select to authenticated
  using (tenant_id in (select user_tenant_ids()) or user_id = auth.uid());

drop policy if exists tenant_members_insert on tenant_members;
create policy tenant_members_insert on tenant_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or tenant_id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role = 'OWNER'
    )
  );

-- ===== trigger: ao criar empresa, o criador vira OWNER =====
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
-- Fim. Agora "Criar empresa" e os cadastros funcionam.
-- ============================================================

-- ============================================================
-- SGO-Fuel · CORREÇÃO (criar empresa / cadastros voltam a funcionar)
-- ============================================================
-- Rode no SQL Editor do PROJETO CERTO:
--   https://supabase.com/dashboard/project/jozeyczhxdcfvtvumiph/sql/new
-- Idempotente, não apaga dados. Se aparecer "PROJETO ERRADO", você está
-- no Supabase errado — use o link acima.
-- ============================================================

do $$
begin
  if to_regclass('public.tenant_members') is null then
    raise exception 'PROJETO ERRADO — abra o SQL Editor de jozeyczhxdcfvtvumiph';
  end if;
end $$;

-- 1) A policy que FALTAVA (libera qualquer conta autenticada a criar a empresa)
alter table public.tenants enable row level security;
drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants
  for insert to authenticated with check (true);

-- 2) Trigger resiliente: cria o OWNER quando há usuário; ignora quando não há
--    (evita erro de user_id nulo em operações administrativas).
create or replace function public.on_tenant_created() returns trigger
language plpgsql security definer as $$
begin
  if auth.uid() is not null then
    insert into public.tenant_members (tenant_id, user_id, role)
    values (new.id, auth.uid(), 'OWNER')
    on conflict (tenant_id, user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_on_tenant_created on public.tenants;
create trigger trg_on_tenant_created
  after insert on public.tenants
  for each row execute function public.on_tenant_created();

-- ============================================================
-- Fim. Agora "Criar empresa" funciona em qualquer conta.
-- ============================================================

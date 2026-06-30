-- ============================================================
-- SGO-Fuel · Auditoria automática (Bloco A7)
-- ============================================================
-- Rode DEPOIS do schema.sql, no mesmo SQL Editor.
-- Cria triggers que gravam em audit_logs toda criação, edição e exclusão
-- nas tabelas principais — sem o app precisar lembrar de logar.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

create or replace function fn_audit() returns trigger
language plpgsql security definer as $$
declare
  v_tenant uuid;
  v_action text;
  v_target text;
  v_row jsonb;
begin
  if (tg_op = 'DELETE') then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_tenant := (v_row ->> 'tenant_id')::uuid;
  if v_tenant is null then
    return coalesce(new, old);
  end if;

  v_action := tg_op;                 -- INSERT | UPDATE | DELETE
  v_target := tg_table_name || ':' || coalesce(v_row ->> 'id', '?');

  insert into audit_logs (tenant_id, actor_type, actor_id, action, target, meta)
  values (
    v_tenant,
    'USER',
    coalesce(auth.uid()::text, 'system'),
    v_action,
    v_target,
    jsonb_build_object(
      'table', tg_table_name,
      'op', tg_op,
      'row', case when tg_op = 'DELETE' then null else v_row end
    )
  );

  return coalesce(new, old);
end $$;

-- Aplica o trigger em todas as tabelas de negócio (não em audit_logs)
do $$
declare t text;
begin
  foreach t in array array[
    'drivers','vehicles','yards','tanks','pumps','routes',
    'fuelings','anomalies','fiscal_invoices','tenants',
    'fleet_cards','card_recharges'
  ]
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s', t);
    execute format(
      'create trigger trg_audit_%1$s
         after insert or update or delete on %1$s
         for each row execute function fn_audit()',
      t
    );
  end loop;
end $$;

-- ============================================================
-- Fim. A partir daqui, /auditoria mostra o histórico real.
-- ============================================================

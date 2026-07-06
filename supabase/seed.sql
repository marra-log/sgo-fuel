-- ============================================================
-- SGO-Fuel · SEED de demonstração (dados fictícios TransCargo)
-- ============================================================
-- Popula o banco com motoristas, veículos, pátios, tanques, bombas,
-- cartões, abastecimentos e anomalias — vinculados à SUA empresa.
--
-- Pré-requisitos: empresa criada em /cadastros/empresa E os SQLs
--   wallet.sql + rules.sql + pin.sql já aplicados (o seed usa saldo/PIN/regras).
-- Como aplicar: cole tudo no SQL Editor do Supabase e clique em Run.
-- Idempotente: se já houver motoristas, o seed é ignorado.
-- ============================================================

do $$
declare
  v_tenant uuid;
  v_drivers uuid[];
  v_vehicles uuid[];
  v_pumps uuid[];
  v_cards uuid[];
  v_yard1 uuid; v_yard2 uuid;
  v_tank1 uuid; v_tank2 uuid; v_tank3 uuid;
  i int;
  v_driver uuid; v_vehicle uuid; v_pump uuid;
  v_liters numeric; v_price numeric; v_status fueling_status; v_fid uuid;
begin
  -- 1) Resolve a empresa (primeiro tenant)
  select id into v_tenant from tenants order by created_at limit 1;
  if v_tenant is null then
    raise exception 'Nenhuma empresa encontrada. Crie em /cadastros/empresa antes de rodar o seed.';
  end if;

  -- Idempotência: se já tem motoristas, não duplica.
  if (select count(*) from drivers where tenant_id = v_tenant) > 0 then
    raise notice 'Já existem cadastros para este tenant — seed ignorado.';
    return;
  end if;

  -- 2) Motoristas (8)
  insert into drivers (tenant_id, name, cpf, phone, cnh, score, active) values
    (v_tenant, 'João Pereira',    '111.111.111-11', '(31) 99000-0001', '11111111111', 98, true),
    (v_tenant, 'Carlos Santos',   '222.222.222-22', '(31) 99000-0002', '22222222222', 96, true),
    (v_tenant, 'Marcos Oliveira', '333.333.333-33', '(31) 99000-0003', '33333333333', 93, true),
    (v_tenant, 'Paulo Ribeiro',   '444.444.444-44', '(31) 99000-0004', '44444444444', 88, true),
    (v_tenant, 'Antônio Costa',   '555.555.555-55', '(31) 99000-0005', '55555555555', 80, true),
    (v_tenant, 'Rafael Lima',     '666.666.666-66', '(31) 99000-0006', '66666666666', 91, true),
    (v_tenant, 'Bruno Alves',     '777.777.777-77', '(31) 99000-0007', '77777777777', 85, true),
    (v_tenant, 'Felipe Souza',    '888.888.888-88', '(31) 99000-0008', '88888888888', 90, true);
  select array_agg(id order by name) into v_drivers from drivers where tenant_id = v_tenant;

  -- 3) Pátios (2)
  insert into yards (tenant_id, name, address, lat, lng)
    values (v_tenant, 'Pátio Central BH', 'Av. Industrial, 1500 - Betim/MG', -19.916670, -43.941670)
    returning id into v_yard1;
  insert into yards (tenant_id, name, address, lat, lng)
    values (v_tenant, 'Filial Sul', 'Rod. Fernão Dias km 40 - Pouso Alegre/MG', -22.230000, -45.936000)
    returning id into v_yard2;

  -- 4) Tanques (3)
  insert into tanks (tenant_id, yard_id, name, fuel_type, capacity_l)
    values (v_tenant, v_yard1, 'Diesel S10 — Tanque 1', 'DIESEL_S10', 30000) returning id into v_tank1;
  insert into tanks (tenant_id, yard_id, name, fuel_type, capacity_l)
    values (v_tenant, v_yard1, 'Diesel S500 — Tanque 2', 'DIESEL_S500', 15000) returning id into v_tank2;
  insert into tanks (tenant_id, yard_id, name, fuel_type, capacity_l)
    values (v_tenant, v_yard2, 'Arla 32 — Tanque 3', 'ARLA32', 4000) returning id into v_tank3;

  -- 5) Bombas (4)
  insert into pumps (tenant_id, yard_id, tank_id, serial_number, device_version, status) values
    (v_tenant, v_yard1, v_tank1, 'SGOF-TC-0001', 'v2.4.1', 'ONLINE'),
    (v_tenant, v_yard1, v_tank2, 'SGOF-TC-0002', 'v2.4.1', 'ONLINE'),
    (v_tenant, v_yard2, v_tank3, 'SGOF-TC-0003', 'v2.4.1', 'OFFLINE'),
    (v_tenant, v_yard2, v_tank1, 'SGOF-TC-0004', 'v2.4.1', 'ONLINE');
  select array_agg(id order by serial_number) into v_pumps from pumps where tenant_id = v_tenant;

  -- 6) Veículos (8) vinculados a motoristas
  insert into vehicles (tenant_id, plate, model, fuel_type, tank_capacity_l, avg_consumption, current_odometer, current_driver_id) values
    (v_tenant, 'RDA-1A01', 'Scania R450 6x4',          'DIESEL_S10', 600, 3.10, 412880, v_drivers[1]),
    (v_tenant, 'RDB-2B02', 'Volvo FH 540 6x4',         'DIESEL_S10', 600, 3.04, 305120, v_drivers[2]),
    (v_tenant, 'RDC-3C03', 'Mercedes Axor 2544 6x2',   'DIESEL_S10', 500, 2.97, 198450, v_drivers[3]),
    (v_tenant, 'RDD-4D04', 'Scania P-360 6x2',         'DIESEL_S500', 400, 2.42, 489310, v_drivers[4]),
    (v_tenant, 'RDE-5E05', 'Iveco Tector 240E28',      'DIESEL_S10', 300, 2.85, 142300, v_drivers[5]),
    (v_tenant, 'RDF-6F06', 'Volvo VM 330 4x2',         'DIESEL_S10', 400, 2.71, 233900, v_drivers[6]),
    (v_tenant, 'RDG-7G07', 'DAF XF 480 6x2',           'DIESEL_S10', 600, 3.12, 87600,  v_drivers[7]),
    (v_tenant, 'RDH-8H08', 'VW Constellation 24.280',  'DIESEL_S10', 450, 2.66, 321400, v_drivers[8]);
  select array_agg(id order by plate) into v_vehicles from vehicles where tenant_id = v_tenant;

  -- 7) Cartões de frota (8) — com SALDO pré-pago, PIN e regras (dados reais)
  --    Requer wallet.sql + rules.sql + pin.sql aplicados antes.
  insert into fleet_cards (tenant_id, card_number, nfc_uid, holder_name, driver_id, vehicle_id, status, monthly_limit_l, balance_brl, pin) values
    (v_tenant, '7000000000000001', '04A1B2C301', 'João Pereira',    v_drivers[1], v_vehicles[1], 'ACTIVE',  1200, 2500.00, '1234'),
    (v_tenant, '7000000000000002', '04A1B2C302', 'Carlos Santos',   v_drivers[2], v_vehicles[2], 'ACTIVE',  1200, 1800.00, null),
    (v_tenant, '7000000000000003', '04A1B2C303', 'Marcos Oliveira', v_drivers[3], v_vehicles[3], 'ACTIVE',  1000, 1500.00, null),
    (v_tenant, '7000000000000004', '04A1B2C304', 'Paulo Ribeiro',   v_drivers[4], v_vehicles[4], 'ACTIVE',  1000, 1500.00, null),
    (v_tenant, '7000000000000005', '04A1B2C305', 'Antônio Costa',   v_drivers[5], v_vehicles[5], 'BLOCKED',  800,  800.00, null),
    (v_tenant, '7000000000000006', '04A1B2C306', 'Rafael Lima',     v_drivers[6], v_vehicles[6], 'ACTIVE',  1000,   90.00, null),
    (v_tenant, '7000000000000007', '04A1B2C307', 'Bruno Alves',     v_drivers[7], v_vehicles[7], 'ACTIVE',  1500, 4200.00, '9999'),
    (v_tenant, '7000000000000008', '04A1B2C308', 'Felipe Souza',    v_drivers[8], v_vehicles[8], 'ACTIVE',  1000, 1200.00, null);
  select array_agg(id) into v_cards from fleet_cards where tenant_id = v_tenant;

  -- 7b) Regras de uso de exemplo no cartão do Marcos (limite/dia/horário)
  update fleet_cards
    set max_liters_per_tx = 200, daily_limit_brl = 800, allowed_hour_start = 6, allowed_hour_end = 20
    where tenant_id = v_tenant and card_number = '7000000000000003';

  -- 7c) Histórico de recargas coerente com o saldo (carga inicial)
  insert into card_recharges (tenant_id, card_id, amount_brl, method, note, balance_after)
    select tenant_id, id, balance_brl, 'MANUAL', 'Carga inicial (demonstração)', balance_brl
    from fleet_cards where tenant_id = v_tenant and balance_brl > 0;

  -- 8) Abastecimentos (30) — distribuídos nas últimas 30h, alguns bloqueados
  for i in 1..30 loop
    v_driver  := v_drivers[1 + (i % 8)];
    v_vehicle := v_vehicles[1 + (i % 8)];
    v_pump    := v_pumps[1 + (i % array_length(v_pumps, 1))];
    v_liters  := 80 + (random() * 220);
    v_price   := 6.90 + random() * 0.40;
    if i % 9 = 0 then v_status := 'BLOCKED'; else v_status := 'COMPLETED'; end if;

    insert into fuelings (tenant_id, pump_id, vehicle_id, driver_id, quota_l, delivered_l, odometer, status, alpr_confidence, cost_brl, started_at)
    values (
      v_tenant, v_pump, v_vehicle, v_driver,
      round(v_liters),
      case when v_status = 'BLOCKED' then 0 else round(v_liters, 1) end,
      100000 + i * 500, v_status, 0.940,
      case when v_status = 'BLOCKED' then 0 else round(v_liters * v_price, 2) end,
      now() - (i || ' hours')::interval
    )
    returning id into v_fid;

    if v_status = 'BLOCKED' then
      insert into anomalies (tenant_id, fueling_id, pump_id, type, severity, description)
      values (
        v_tenant, v_fid, v_pump,
        (array['CONTAINER_PATTERN','PLATE_MISMATCH','QUOTA_EXCEEDED','OFFHOURS'])[1 + (i % 4)]::anomaly_type,
        'HIGH',
        'Anomalia detectada pela IA durante o abastecimento (dado de demonstração).'
      );
    end if;
  end loop;

  -- 9) Transações de cartão aprovadas (16) — alimentam o /faturamento
  for i in 1..16 loop
    v_liters := 60 + random() * 180;
    v_price  := 6.90 + random() * 0.40;
    insert into card_transactions (tenant_id, card_id, card_number, pump_id, driver_id, vehicle_id, liters, price_per_l, amount_brl, status, created_at)
    select
      v_tenant, fc.id, fc.card_number,
      v_pumps[1 + (i % array_length(v_pumps, 1))], fc.driver_id, fc.vehicle_id,
      round(v_liters, 1), round(v_price, 3), round(v_liters * v_price, 2), 'APPROVED',
      now() - (i || ' hours')::interval
    from fleet_cards fc
    where fc.id = v_cards[1 + (i % 8)];
  end loop;

  raise notice 'Seed concluído com sucesso para o tenant %.', v_tenant;
end $$;

-- ============================================================
-- Pronto. Agora /cadastros, /dashboard, /cartoes, /anomalias,
-- /ranking e /faturamento mostram dados REAIS do banco.
-- ============================================================

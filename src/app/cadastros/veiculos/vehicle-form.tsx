"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type VehicleFormData = {
  id?: string;
  plate?: string | null;
  model?: string | null;
  fuel_type?: string | null;
  tank_capacity_l?: number | null;
  avg_consumption?: number | null;
  current_odometer?: number | null;
  current_driver_id?: string | null;
};

export function VehicleForm({ initial }: { initial?: VehicleFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [fuelType, setFuelType] = useState(initial?.fuel_type ?? "DIESEL_S10");
  const [capacity, setCapacity] = useState<string>(
    initial?.tank_capacity_l != null ? String(initial.tank_capacity_l) : ""
  );
  const [avg, setAvg] = useState<string>(
    initial?.avg_consumption != null ? String(initial.avg_consumption) : ""
  );
  const [odom, setOdom] = useState<string>(
    initial?.current_odometer != null ? String(initial.current_odometer) : ""
  );
  const [driverId, setDriverId] = useState<string>(initial?.current_driver_id ?? "");

  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const { data } = await supabase
        .from("drivers")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setDrivers(data ?? []);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1)
      .maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setMsg({ kind: "err", text: "Sua conta ainda não tem empresa." });
      setSaving(false);
      return;
    }

    const payload = {
      plate: plate.trim().toUpperCase(),
      model: model || null,
      fuel_type: fuelType,
      tank_capacity_l: capacity ? Number(capacity) : null,
      avg_consumption: avg ? Number(avg) : null,
      current_odometer: odom ? Number(odom) : 0,
      current_driver_id: driverId || null,
    };

    if (editing && initial?.id) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", initial.id);
      if (error) {
        setMsg({ kind: "err", text: error.message });
        setSaving(false);
        return;
      }
      setMsg({ kind: "ok", text: "Veículo atualizado." });
      router.refresh();
    } else {
      const { error } = await supabase.from("vehicles").insert({ ...payload, tenant_id: tenantId });
      if (error) {
        setMsg({ kind: "err", text: error.message });
        setSaving(false);
        return;
      }
      router.push("/cadastros/veiculos");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Placa" required hint="Mercosul ou antigo. Vamos normalizar pra maiúsculas.">
          <Input value={plate} onChange={(e) => setPlate(e.target.value)} required placeholder="BRA-2E19" />
        </FormField>
        <FormField label="Modelo">
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Scania R450" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Combustível" required>
          <Select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
            <option value="DIESEL_S10">Diesel S10</option>
            <option value="DIESEL_S500">Diesel S500</option>
            <option value="ARLA32">Arla 32</option>
            <option value="GASOLINE">Gasolina</option>
            <option value="ETHANOL">Etanol</option>
          </Select>
        </FormField>
        <FormField label="Tanque (L)">
          <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="600" />
        </FormField>
        <FormField label="Consumo (km/L)">
          <Input type="number" min={0} step="0.01" value={avg} onChange={(e) => setAvg(e.target.value)} placeholder="3.10" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Hodômetro atual (km)">
          <Input type="number" min={0} value={odom} onChange={(e) => setOdom(e.target.value)} placeholder="412880" />
        </FormField>
        <FormField label="Motorista atual" hint="Apenas motoristas ativos aparecem aqui.">
          <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">— sem vínculo —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="vehicles" id={initial.id} redirectTo="/cadastros/veiculos" />
        ) : (
          <span />
        )}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar veículo"}
        </Button>
      </div>
    </form>
  );
}

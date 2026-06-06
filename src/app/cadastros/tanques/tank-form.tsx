"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type TankFormData = {
  id?: string;
  yard_id?: string | null;
  name?: string | null;
  fuel_type?: string | null;
  capacity_l?: number | null;
};

export function TankForm({ initial }: { initial?: TankFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [yardId, setYardId] = useState(initial?.yard_id ?? "");
  const [fuelType, setFuelType] = useState(initial?.fuel_type ?? "DIESEL_S10");
  const [capacity, setCapacity] = useState<string>(initial?.capacity_l != null ? String(initial.capacity_l) : "");
  const [yards, setYards] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const { data } = await supabase.from("yards").select("id, name").order("name");
      setYards(data ?? []);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    const { data: member } = await supabase.from("tenant_members").select("tenant_id").limit(1).maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setMsg({ kind: "err", text: "Sua conta ainda não tem empresa." });
      setSaving(false);
      return;
    }
    if (!yardId) {
      setMsg({ kind: "err", text: "Selecione um pátio. Cadastre primeiro se não houver." });
      setSaving(false);
      return;
    }

    const payload = {
      name,
      yard_id: yardId,
      fuel_type: fuelType,
      capacity_l: Number(capacity),
    };

    if (editing && initial?.id) {
      const { error } = await supabase.from("tanks").update(payload).eq("id", initial.id);
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      setMsg({ kind: "ok", text: "Tanque atualizado." });
      router.refresh();
    } else {
      const { error } = await supabase.from("tanks").insert({ ...payload, tenant_id: tenantId });
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      router.push("/cadastros/tanques");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Nome do tanque" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Diesel S10 — Tanque 1" />
      </FormField>
      <FormField label="Pátio" required>
        <Select value={yardId} onChange={(e) => setYardId(e.target.value)}>
          <option value="">— selecione —</option>
          {yards.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </Select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Combustível" required>
          <Select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
            <option value="DIESEL_S10">Diesel S10</option>
            <option value="DIESEL_S500">Diesel S500</option>
            <option value="ARLA32">Arla 32</option>
            <option value="GASOLINE">Gasolina</option>
            <option value="ETHANOL">Etanol</option>
          </Select>
        </FormField>
        <FormField label="Capacidade (L)" required>
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required placeholder="30000" />
        </FormField>
      </div>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="tanks" id={initial.id} redirectTo="/cadastros/tanques" />
        ) : <span />}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar tanque"}
        </Button>
      </div>
    </form>
  );
}

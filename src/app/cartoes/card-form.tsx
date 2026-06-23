"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Save, Shuffle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type CardFormData = {
  id?: string;
  card_number?: string | null;
  nfc_uid?: string | null;
  holder_name?: string | null;
  status?: string | null;
  monthly_limit_l?: number | null;
  pin?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
};

// Gera número fictício no padrão private label (BIN 7000 + 12 dígitos)
function genCardNumber() {
  let n = "7000";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10);
  return n;
}
function genNfc() {
  const hex = "0123456789ABCDEF";
  let s = "";
  for (let i = 0; i < 8; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

export function CardForm({ initial }: { initial?: CardFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [cardNumber, setCardNumber] = useState(initial?.card_number ?? genCardNumber());
  const [nfc, setNfc] = useState(initial?.nfc_uid ?? genNfc());
  const [holder, setHolder] = useState(initial?.holder_name ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [limit, setLimit] = useState<string>(initial?.monthly_limit_l != null ? String(initial.monthly_limit_l) : "1000");
  const [pin, setPin] = useState(initial?.pin ?? "");
  const [driverId, setDriverId] = useState(initial?.driver_id ?? "");
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? "");

  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const [d, v] = await Promise.all([
        supabase.from("drivers").select("id, name").eq("active", true).order("name"),
        supabase.from("vehicles").select("id, plate").order("plate"),
      ]);
      setDrivers(d.data ?? []);
      setVehicles(v.data ?? []);
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

    const payload = {
      card_number: cardNumber.replace(/\s/g, ""),
      nfc_uid: nfc || null,
      holder_name: holder || null,
      status,
      monthly_limit_l: Number(limit || 0),
      pin: pin || null,
      driver_id: driverId || null,
      vehicle_id: vehicleId || null,
    };

    if (editing && initial?.id) {
      const { error } = await supabase.from("fleet_cards").update(payload).eq("id", initial.id);
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      setMsg({ kind: "ok", text: "Cartão atualizado." });
      router.refresh();
    } else {
      const { error } = await supabase.from("fleet_cards").insert({ ...payload, tenant_id: tenantId });
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      router.push("/cartoes");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Visual do cartão */}
      <div className="rounded-2xl bg-gradient-to-br from-[#14171d] to-[#0e1014] p-5 ring-1 ring-[color:var(--color-border)]">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-[color:var(--color-muted)]">SGO-Fuel · Frota</span>
          <CreditCard className="h-5 w-5 text-[color:var(--color-brand)]" />
        </div>
        <div className="mt-6 font-mono text-lg tracking-widest text-white">
          {cardNumber.replace(/(.{4})/g, "$1 ").trim()}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--color-muted)]">
          <span>{holder || "TITULAR"}</span>
          <span>NFC {nfc}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Número do cartão" required>
          <div className="flex gap-2">
            <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required className="font-mono" />
            {!editing ? (
              <Button type="button" variant="outline" size="icon" onClick={() => setCardNumber(genCardNumber())} title="Gerar">
                <Shuffle className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </FormField>
        <FormField label="UID NFC" hint="Tag física (opcional).">
          <div className="flex gap-2">
            <Input value={nfc} onChange={(e) => setNfc(e.target.value)} className="font-mono" />
            {!editing ? (
              <Button type="button" variant="outline" size="icon" onClick={() => setNfc(genNfc())} title="Gerar">
                <Shuffle className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </FormField>
      </div>

      <FormField label="Nome impresso (titular)">
        <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="MARRALOG TRANSPORTES" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Cota mensal (L)" required>
          <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} required />
        </FormField>
        <FormField label="PIN (4 dígitos)" hint="Opcional.">
          <Input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} className="font-mono" placeholder="••••" />
        </FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Ativo</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="LOST">Perdido</option>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Motorista vinculado">
          <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">— sem vínculo —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Veículo vinculado">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">— sem vínculo —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="fleet_cards" id={initial.id} redirectTo="/cartoes" label="Cancelar cartão" />
        ) : <span />}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Emitir cartão"}
        </Button>
      </div>
    </form>
  );
}

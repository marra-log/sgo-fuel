"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type PumpFormData = {
  id?: string;
  serial_number?: string | null;
  iot_device_id?: string | null;
  device_version?: string | null;
  status?: string | null;
  yard_id?: string | null;
  tank_id?: string | null;
  partner_station?: string | null;
};

export function PumpForm({ initial }: { initial?: PumpFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [serial, setSerial] = useState(initial?.serial_number ?? "");
  const [deviceId, setDeviceId] = useState(initial?.iot_device_id ?? "");
  const [deviceVersion, setDeviceVersion] = useState(initial?.device_version ?? "");
  const [status, setStatus] = useState(initial?.status ?? "OFFLINE");
  const [scope, setScope] = useState<"YARD" | "PARTNER">(
    initial?.yard_id ? "YARD" : initial?.partner_station ? "PARTNER" : "YARD"
  );
  const [yardId, setYardId] = useState(initial?.yard_id ?? "");
  const [tankId, setTankId] = useState(initial?.tank_id ?? "");
  const [partner, setPartner] = useState(initial?.partner_station ?? "");

  const [yards, setYards] = useState<Array<{ id: string; name: string }>>([]);
  const [tanks, setTanks] = useState<Array<{ id: string; name: string; yard_id: string }>>([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const [y, t] = await Promise.all([
        supabase.from("yards").select("id, name").order("name"),
        supabase.from("tanks").select("id, name, yard_id").order("name"),
      ]);
      setYards(y.data ?? []);
      setTanks(t.data ?? []);
    })();
  }, []);

  const tanksOfYard = yardId ? tanks.filter((t) => t.yard_id === yardId) : tanks;

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
      serial_number: serial.trim().toUpperCase(),
      iot_device_id: deviceId || null,
      device_version: deviceVersion || null,
      status,
      yard_id: scope === "YARD" ? yardId || null : null,
      tank_id: scope === "YARD" ? tankId || null : null,
      partner_station: scope === "PARTNER" ? partner || null : null,
    };

    if (editing && initial?.id) {
      const { error } = await supabase.from("pumps").update(payload).eq("id", initial.id);
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      setMsg({ kind: "ok", text: "Bomba atualizada." });
      router.refresh();
    } else {
      const { error } = await supabase.from("pumps").insert({ ...payload, tenant_id: tenantId });
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      router.push("/cadastros/bombas");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Serial" required hint="Etiqueta interna. Será normalizada em maiúsculas.">
          <Input value={serial} onChange={(e) => setSerial(e.target.value)} required placeholder="SGOF-MRL-0014" />
        </FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="OFFLINE">Offline</option>
            <option value="ONLINE">Online</option>
            <option value="MAINTENANCE">Em manutenção</option>
            <option value="BLOCKED">Bloqueada</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Tipo de bomba">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScope("YARD")}
            className={
              "flex-1 rounded-lg border px-3 py-2 text-xs " +
              (scope === "YARD"
                ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]")
            }
          >
            Pátio interno
          </button>
          <button
            type="button"
            onClick={() => setScope("PARTNER")}
            className={
              "flex-1 rounded-lg border px-3 py-2 text-xs " +
              (scope === "PARTNER"
                ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]")
            }
          >
            Posto parceiro (rodovia)
          </button>
        </div>
      </FormField>

      {scope === "YARD" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pátio">
            <Select value={yardId} onChange={(e) => { setYardId(e.target.value); setTankId(""); }}>
              <option value="">— selecione —</option>
              {yards.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tanque conectado">
            <Select value={tankId} onChange={(e) => setTankId(e.target.value)}>
              <option value="">— sem vínculo —</option>
              {tanksOfYard.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>
        </div>
      ) : (
        <FormField label="Posto parceiro" hint="Nome do posto na rodovia (ex.: Trevão BR-381).">
          <Input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Trevão BR-381" />
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="IoT Device ID" hint="Preenchido quando o totem físico se registrar (B1).">
          <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="—" />
        </FormField>
        <FormField label="Versão do firmware">
          <Input value={deviceVersion} onChange={(e) => setDeviceVersion(e.target.value)} placeholder="v2.4.1" />
        </FormField>
      </div>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="pumps" id={initial.id} redirectTo="/cadastros/bombas" />
        ) : <span />}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar bomba"}
        </Button>
      </div>
    </form>
  );
}

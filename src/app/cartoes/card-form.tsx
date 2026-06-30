"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Save, Shuffle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { normalizeUid } from "@/lib/web-nfc";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";
import { NfcReaderButton } from "@/components/nfc-reader-button";

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
  max_liters_per_tx?: number | null;
  daily_limit_brl?: number | null;
  allowed_weekdays?: number[] | null;
  allowed_hour_start?: number | null;
  allowed_hour_end?: number | null;
};

const WEEKDAYS = [
  { n: 1, l: "Seg" },
  { n: 2, l: "Ter" },
  { n: 3, l: "Qua" },
  { n: 4, l: "Qui" },
  { n: 5, l: "Sex" },
  { n: 6, l: "Sáb" },
  { n: 0, l: "Dom" },
];

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

  // Regras de uso (opcionais)
  const [maxLitersTx, setMaxLitersTx] = useState(initial?.max_liters_per_tx != null ? String(initial.max_liters_per_tx) : "");
  const [dailyLimit, setDailyLimit] = useState(initial?.daily_limit_brl != null ? String(initial.daily_limit_brl) : "");
  const [weekdays, setWeekdays] = useState<number[]>(initial?.allowed_weekdays ?? []);
  const [hourStart, setHourStart] = useState(initial?.allowed_hour_start != null ? String(initial.allowed_hour_start) : "");
  const [hourEnd, setHourEnd] = useState(initial?.allowed_hour_end != null ? String(initial.allowed_hour_end) : "");

  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loadHint, setLoadHint] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadHint("Sessão expirada — faça login novamente para listar motoristas e veículos.");
          return;
        }
        const [d, v] = await Promise.all([
          supabase.from("drivers").select("id, name").eq("active", true).order("name"),
          supabase.from("vehicles").select("id, plate").order("plate"),
        ]);
        setDrivers(d.data ?? []);
        setVehicles(v.data ?? []);
        if (d.error || v.error) {
          setLoadHint("Não consegui carregar motoristas/veículos: " + (d.error?.message ?? v.error?.message));
        } else if ((d.data?.length ?? 0) === 0 && (v.data?.length ?? 0) === 0) {
          setLoadHint("Nenhum motorista/veículo cadastrado ainda — você pode emitir o cartão sem vínculo e ligar depois.");
        }
      } catch (e) {
        setLoadHint("Falha ao carregar dados: " + (e instanceof Error ? e.message : String(e)));
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMsg({ kind: "err", text: "Sessão expirada. Faça login novamente e tente outra vez." });
        return;
      }

      const { data: member, error: memberErr } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (memberErr) {
        setMsg({ kind: "err", text: traduzSupabaseError(memberErr.message) });
        return;
      }
      const tenantId = member?.tenant_id;
      if (!tenantId) {
        setMsg({ kind: "err", text: "Sua conta ainda não tem empresa vinculada. Crie a empresa em Cadastros." });
        return;
      }

      // Regra: um motorista pode ter apenas UM cartão.
      if (driverId) {
        let dupQuery = supabase.from("fleet_cards").select("card_number").eq("driver_id", driverId);
        if (editing && initial?.id) dupQuery = dupQuery.neq("id", initial.id);
        const { data: dup } = await dupQuery.limit(1).maybeSingle();
        if (dup) {
          setMsg({
            kind: "err",
            text: `Esse motorista já tem o cartão ••••${dup.card_number.slice(-4)}. Cada motorista pode ter só um cartão — desvincule o outro antes.`,
          });
          return;
        }
      }

      const payload = {
        card_number: cardNumber.replace(/\s/g, ""),
        nfc_uid: nfc ? normalizeUid(nfc) : null,
        holder_name: holder || null,
        status,
        monthly_limit_l: Number(limit || 0),
        pin: pin || null,
        driver_id: driverId || null,
        vehicle_id: vehicleId || null,
        max_liters_per_tx: maxLitersTx ? Number(maxLitersTx) : null,
        daily_limit_brl: dailyLimit ? Number(dailyLimit) : null,
        allowed_weekdays: weekdays.length > 0 ? weekdays : null,
        allowed_hour_start: hourStart !== "" ? Number(hourStart) : null,
        allowed_hour_end: hourEnd !== "" ? Number(hourEnd) : null,
      };

      if (editing && initial?.id) {
        const { error } = await supabase.from("fleet_cards").update(payload).eq("id", initial.id);
        if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); return; }
        setMsg({ kind: "ok", text: "Cartão atualizado." });
        router.refresh();
      } else {
        const { error } = await supabase.from("fleet_cards").insert({ ...payload, tenant_id: tenantId });
        if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); return; }
        setMsg({ kind: "ok", text: "Cartão emitido com sucesso. Redirecionando…" });
        router.push("/cartoes");
        router.refresh();
      }
    } catch (e) {
      setMsg({ kind: "err", text: "Erro inesperado: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setSaving(false);
    }
  }

  // Atribui o cartão a um único motorista e já sugere o nome impresso.
  function onDriverChange(id: string) {
    setDriverId(id);
    const d = drivers.find((x) => x.id === id);
    if (d && !holder.trim()) setHolder(d.name.toUpperCase());
  }

  function toggleWeekday(n: number) {
    setWeekdays((w) => (w.includes(n) ? w.filter((x) => x !== n) : [...w, n]));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Visual do cartão */}
      <div className="surface-dark rounded-2xl bg-gradient-to-br from-[#14171d] to-[#0e1014] p-5 ring-1 ring-[color:var(--color-border)]">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-[color:var(--color-muted)]">SGO-Fuel · Frota</span>
          <CreditCard className="h-5 w-5 text-[color:var(--color-brand)]" />
        </div>
        <div className="mt-6 font-mono text-lg tracking-widest text-[color:var(--color-text-strong)]">
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
        <FormField label="UID NFC" hint="Aproxime a tag física no Android ou gere um UID.">
          <div className="flex gap-2">
            <Input value={nfc} onChange={(e) => setNfc(e.target.value)} className="font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={() => setNfc(genNfc())} title="Gerar">
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2">
            <NfcReaderButton onRead={(uid) => setNfc(uid)} label="Ler tag física (NFC)" />
          </div>
        </FormField>
      </div>

      <FormField label="Nome impresso (titular)">
        <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="TRANSCARGO LOGÍSTICA" />
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
        <FormField label="Motorista vinculado" hint="Cada motorista pode ter só um cartão.">
          <Select value={driverId} onChange={(e) => onDriverChange(e.target.value)}>
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

      {/* Regras de uso (opcional) */}
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
        <div className="text-sm font-medium text-[color:var(--color-text-strong)]">Regras de uso</div>
        <p className="text-xs text-[color:var(--color-muted)]">Limites e janelas aplicados na hora de autorizar. Em branco = sem restrição.</p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <FormField label="Limite por abastecimento (L)" hint="Recusa acima disso.">
            <Input type="number" min={0} value={maxLitersTx} onChange={(e) => setMaxLitersTx(e.target.value)} placeholder="ex.: 200" />
          </FormField>
          <FormField label="Limite diário (R$)" hint="Soma do dia.">
            <Input type="number" min={0} step="0.01" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} placeholder="ex.: 800" />
          </FormField>
        </div>

        <div className="mt-3">
          <span className="mb-1.5 block text-xs font-medium text-[color:var(--color-text)]">Dias permitidos</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const on = weekdays.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => toggleWeekday(d.n)}
                  className={
                    "rounded-md border px-2.5 py-1.5 text-xs transition-colors " +
                    (on
                      ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]")
                  }
                >
                  {d.l}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">Nenhum selecionado = todos os dias.</p>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <FormField label="Hora início" hint="0–23. Vazio = sem janela.">
            <Input type="number" min={0} max={23} value={hourStart} onChange={(e) => setHourStart(e.target.value)} placeholder="ex.: 6" />
          </FormField>
          <FormField label="Hora fim" hint="1–24, exclusivo.">
            <Input type="number" min={1} max={24} value={hourEnd} onChange={(e) => setHourEnd(e.target.value)} placeholder="ex.: 20" />
          </FormField>
        </div>
      </div>

      {loadHint ? (
        <p className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
          {loadHint}
        </p>
      ) : null}

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

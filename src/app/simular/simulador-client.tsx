"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, FormMessage, Input, Select } from "@/components/ui/input";

type Driver = { id: string; name: string };
type Vehicle = { id: string; plate: string; model: string | null };
type Pump = {
  id: string;
  serial_number: string;
  yards: { name: string } | null;
  partner_station: string | null;
};

type Outcome =
  | "AUTHORIZED_OK"        // gera Fueling COMPLETED ok
  | "BLOCKED_CONTAINER"    // gera Fueling BLOCKED + Anomaly CONTAINER_PATTERN
  | "BLOCKED_PLATE"        // gera Fueling BLOCKED + Anomaly PLATE_MISMATCH
  | "BLOCKED_QUOTA"        // gera Fueling BLOCKED + Anomaly QUOTA_EXCEEDED
  | "BLOCKED_OFFHOURS";    // gera Fueling BLOCKED + Anomaly OFFHOURS

const OUTCOMES: Array<{ value: Outcome; label: string; desc: string; tone: "success" | "danger" | "warning" | "info" }> = [
  { value: "AUTHORIZED_OK", label: "Autorizado · concluído", desc: "Tudo conforme — bomba liberou e cota foi entregue.", tone: "success" },
  { value: "BLOCKED_CONTAINER", label: "Bloqueio · recipiente fora do padrão", desc: "IA detectou balde/galão no bico — bomba cortada.", tone: "danger" },
  { value: "BLOCKED_PLATE", label: "Bloqueio · placa divergente", desc: "ALPR leu placa diferente da autorizada.", tone: "warning" },
  { value: "BLOCKED_QUOTA", label: "Bloqueio · cota excedida", desc: "Motorista tentou volume além da cota da rota.", tone: "info" },
  { value: "BLOCKED_OFFHOURS", label: "Bloqueio · fora do horário", desc: "Tentativa fora da janela operacional.", tone: "info" },
];

export function SimuladorClient({
  drivers,
  vehicles,
  pumps,
}: {
  drivers: Driver[];
  vehicles: Vehicle[];
  pumps: Pump[];
}) {
  const router = useRouter();

  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [pumpId, setPumpId] = useState(pumps[0]?.id ?? "");
  const [outcome, setOutcome] = useState<Outcome>("AUTHORIZED_OK");
  const [quota, setQuota] = useState<string>("180");
  const [delivered, setDelivered] = useState<string>("178.4");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; href?: string } | null>(null);

  const hasFleet = drivers.length > 0 && vehicles.length > 0 && pumps.length > 0;

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
      setMsg({ kind: "err", text: "Conta sem empresa. Crie em Cadastros → Empresa." });
      setSaving(false);
      return;
    }

    const isBlocked = outcome !== "AUTHORIZED_OK";
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const quotaL = Number(quota || 0);
    const deliveredL = isBlocked ? 0 : Number(delivered || 0);
    const startedAt = new Date().toISOString();

    // 1) Cria Fueling
    const { data: fueling, error: fErr } = await supabase
      .from("fuelings")
      .insert({
        tenant_id: tenantId,
        pump_id: pumpId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        started_at: startedAt,
        ended_at: startedAt,
        quota_l: quotaL,
        delivered_l: deliveredL,
        status: isBlocked ? "BLOCKED" : "COMPLETED",
        alpr_plate: vehicle?.plate ?? null,
        alpr_confidence: 0.92,
        cost_brl: deliveredL ? Math.round(deliveredL * 562) / 100 : 0,
      })
      .select("id")
      .single();

    if (fErr || !fueling) {
      setMsg({ kind: "err", text: traduzSupabaseError(fErr?.message ?? "Falha ao criar evento.") });
      setSaving(false);
      return;
    }

    // 2) Se bloqueio, cria Anomaly
    if (isBlocked) {
      const map: Record<Outcome, { type: string; severity: string; description: string }> = {
        AUTHORIZED_OK: { type: "COMM_LOSS", severity: "LOW", description: "" },
        BLOCKED_CONTAINER: {
          type: "CONTAINER_PATTERN",
          severity: "CRITICAL",
          description: "IA detectou recipiente fora do padrão (balde ou galão) no bico da bomba. Corte imediato.",
        },
        BLOCKED_PLATE: {
          type: "PLATE_MISMATCH",
          severity: "HIGH",
          description: "Placa lida pelo ALPR não corresponde à placa autorizada na sessão do motorista.",
        },
        BLOCKED_QUOTA: {
          type: "QUOTA_EXCEEDED",
          severity: "MEDIUM",
          description: "Solicitação de volume acima da cota dinâmica calculada para a rota.",
        },
        BLOCKED_OFFHOURS: {
          type: "OFFHOURS",
          severity: "LOW",
          description: "Tentativa fora da janela operacional. Token expirado.",
        },
      };
      const a = map[outcome];

      const { error: aErr } = await supabase.from("anomalies").insert({
        tenant_id: tenantId,
        fueling_id: fueling.id,
        pump_id: pumpId,
        type: a.type,
        severity: a.severity,
        description: a.description,
      });
      if (aErr) {
        setMsg({ kind: "err", text: "Evento criado, mas anomalia falhou: " + traduzSupabaseError(aErr.message) });
        setSaving(false);
        return;
      }
    }

    setMsg({
      kind: "ok",
      text: isBlocked
        ? "Bloqueio registrado e anomalia criada. Veja em /anomalias."
        : "Abastecimento concluído. Veja em /dashboard.",
      href: isBlocked ? "/anomalias" : "/dashboard",
    });
    router.refresh();
    setSaving(false);
  }

  if (!hasFleet) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Faltam cadastros para simular
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Você precisa de pelo menos 1 motorista ativo, 1 veículo e 1 bomba cadastrados.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {drivers.length === 0 && (
            <Link href="/cadastros/motoristas/novo" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
              Cadastrar motorista <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {vehicles.length === 0 && (
            <Link href="/cadastros/veiculos/novo" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
              Cadastrar veículo <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {pumps.length === 0 && (
            <Link href="/cadastros/bombas/novo" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
              Cadastrar bomba <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[color:var(--color-brand)]" />
          <h2 className="text-base font-semibold text-white">Disparar evento</h2>
        </div>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Tudo o que você criar aqui vira linha real no banco, com RLS isolando por empresa.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Motorista" required>
              <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Veículo" required>
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate}{v.model ? ` · ${v.model}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Bomba" required>
              <Select value={pumpId} onChange={(e) => setPumpId(e.target.value)}>
                {pumps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.serial_number} · {p.yards?.name ?? p.partner_station ?? "—"}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cota (L)" required>
              <Input type="number" min={0} step="0.01" value={quota} onChange={(e) => setQuota(e.target.value)} required />
            </FormField>
            <FormField label="Litros entregues" hint="Ignorado em bloqueios.">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={delivered}
                onChange={(e) => setDelivered(e.target.value)}
                disabled={outcome !== "AUTHORIZED_OK"}
              />
            </FormField>
          </div>

          <FormField label="Resultado do evento">
            <div className="grid gap-2 sm:grid-cols-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className={
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors " +
                    (outcome === o.value
                      ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:bg-[color:var(--color-surface)]")
                  }
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={o.tone}>{o.label}</Badge>
                  </div>
                  <span className="text-[11px] text-[color:var(--color-muted)]">{o.desc}</span>
                </button>
              ))}
            </div>
          </FormField>

          {msg ? (
            <FormMessage kind={msg.kind}>
              {msg.text}
              {msg.href ? (
                <>
                  {" "}
                  <Link href={msg.href} className="underline">Abrir agora</Link>
                </>
              ) : null}
            </FormMessage>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Activity className="h-4 w-4" />
              {saving ? "Registrando…" : "Registrar evento"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-white">Atalhos</h3>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          O simulador é o substituto temporário do Totem IoT (Bloco B1). Quando o hardware
          entrar, os mesmos campos virão preenchidos pela câmera e relé.
        </p>
        <div className="mt-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
            Ver eventos no Dashboard
          </Link>
          <Link href="/anomalias" className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
            <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--color-danger)]" />
            Ver anomalias abertas
          </Link>
          <Link href="/ranking" className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
            Ver ranking de motoristas
          </Link>
        </div>
      </Card>
    </div>
  );
}

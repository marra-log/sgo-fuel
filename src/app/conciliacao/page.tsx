import { FileText, ShieldCheck, Upload } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBRL, formatNumber } from "@/lib/utils";
import { XmlUpload } from "./xml-upload";

export const dynamic = "force-dynamic";

const FUEL: Record<string, string> = {
  DIESEL_S10: "Diesel S10",
  DIESEL_S500: "Diesel S500",
  ARLA32: "Arla 32",
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
};

type Tank = { id: string; name: string; fuel_type: string };
type Invoice = {
  id: string;
  tank_id: string | null;
  access_key: string;
  supplier: string | null;
  volume_l: number | null;
  value_brl: number | null;
  issued_at: string | null;
};

export default async function ConciliacaoPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: tanksData }, { data: invoicesData }, { data: pumpsData }] = await Promise.all([
    supabase.from("tanks").select("id, name, fuel_type").order("name"),
    supabase
      .from("fiscal_invoices")
      .select("id, tank_id, access_key, supplier, volume_l, value_brl, issued_at")
      .order("issued_at", { ascending: false }),
    supabase.from("pumps").select("id, tank_id"),
  ]);

  const tanks = (tanksData ?? []) as Tank[];
  const invoices = (invoicesData ?? []) as Invoice[];
  const pumps = (pumpsData ?? []) as Array<{ id: string; tank_id: string | null }>;

  // Saída por tanque = soma de delivered_l dos fuelings das bombas ligadas ao tanque (mês corrente)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const pumpToTank = new Map<string, string>();
  for (const p of pumps) if (p.tank_id) pumpToTank.set(p.id, p.tank_id);

  const { data: fuelingsData } = await supabase
    .from("fuelings")
    .select("pump_id, delivered_l, status, started_at")
    .gte("started_at", monthStart.toISOString());

  const saidaPorTanque = new Map<string, number>();
  for (const f of (fuelingsData ?? []) as Array<{ pump_id: string; delivered_l: number | null; status: string }>) {
    if (f.status === "BLOCKED") continue;
    const tid = pumpToTank.get(f.pump_id);
    if (!tid) continue;
    saidaPorTanque.set(tid, (saidaPorTanque.get(tid) ?? 0) + Number(f.delivered_l ?? 0));
  }

  // Entrada por tanque = soma de volume das NFes vinculadas
  const entradaPorTanque = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.tank_id) continue;
    entradaPorTanque.set(inv.tank_id, (entradaPorTanque.get(inv.tank_id) ?? 0) + Number(inv.volume_l ?? 0));
  }

  const tankById = new Map(tanks.map((t) => [t.id, t]));
  const hasData = invoices.length > 0 || tanks.length > 0;

  return (
    <SectionShell
      badge="Conciliação SEFAZ"
      title="XML de compra × Saída efetiva"
      description="Importe a NFe do combustível: o sistema extrai chave, volume e valor e cruza com os litros liberados pelo IoT por tanque — sem sondas físicas."
    >
      {/* Upload */}
      <Card className="mb-6 p-5">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-[color:var(--color-brand)]" />
          <h2 className="text-base font-semibold text-white">Importar NFe (XML)</h2>
        </div>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Aceita o XML da NFe modelo 55. O parser identifica diesel, gasolina, etanol e arla
          automaticamente e sugere o tanque compatível.
        </p>
        <div className="mt-4">
          <XmlUpload tanks={tanks} />
        </div>
      </Card>

      {/* Conciliação por tanque */}
      <Card className="mb-6">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Tanques físicos</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Entrada (NFe) × Saída (IoT, mês corrente). Diferença técnica esperada: até 0,8%.
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="h-3 w-3" />
            {tanks.length} tanque{tanks.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {tanks.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[color:var(--color-muted)]">
            Nenhum tanque cadastrado.{" "}
            <a href="/cadastros/tanques/novo" className="text-[color:var(--color-brand)] hover:underline">
              Cadastrar tanque
            </a>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--color-border)]">
            {tanks.map((t) => {
              const entrada = entradaPorTanque.get(t.id) ?? 0;
              const saida = saidaPorTanque.get(t.id) ?? 0;
              const diff = entrada - saida;
              const pct = entrada > 0 ? (diff / entrada) * 100 : 0;
              const tone = pct > 1.5 ? "danger" : pct > 0.8 ? "warning" : "success";
              const fill = entrada > 0 ? Math.min(100, (saida / entrada) * 100) : 0;
              return (
                <div key={t.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium text-white">{t.name}</span>
                      <span className="ml-2 text-xs text-[color:var(--color-muted)]">
                        {FUEL[t.fuel_type] ?? t.fuel_type}
                      </span>
                    </div>
                    {entrada > 0 ? (
                      <Badge variant={tone}>{pct.toFixed(2)}% diferença</Badge>
                    ) : (
                      <Badge variant="outline">sem NFe</Badge>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-[color:var(--color-muted)] sm:grid-cols-3 sm:gap-3">
                    <span>
                      Entrada (NFe):{" "}
                      <span className="font-mono text-white">{formatNumber(Math.round(entrada))} L</span>
                    </span>
                    <span>
                      Saída (IoT):{" "}
                      <span className="font-mono text-white">{formatNumber(Math.round(saida))} L</span>
                    </span>
                    <span className="sm:text-right">
                      Diferença:{" "}
                      <span className="font-mono text-white">{formatNumber(Math.round(diff))} L</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                    <div className="h-full bg-[color:var(--color-brand)]" style={{ width: `${fill}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* NFes importadas */}
      <Card>
        <div className="border-b border-[color:var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-white">NFes de compra importadas</h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            {invoices.length} nota{invoices.length === 1 ? "" : "s"} no sistema.
          </p>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText className="mx-auto h-7 w-7 text-[color:var(--color-muted)]" />
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Nenhuma NFe importada. Use o botão acima para subir o primeiro XML.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Chave</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Fornecedor</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tanque</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3 font-mono text-[11px] text-[color:var(--color-muted)]">
                      …{inv.access_key.slice(-12)}
                    </td>
                    <td className="px-5 py-3 text-white">{inv.supplier ?? "—"}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">
                      {inv.tank_id ? tankById.get(inv.tank_id)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatNumber(Math.round(Number(inv.volume_l ?? 0)))} L
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatBRL(Number(inv.value_brl ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!hasData ? null : null}
    </SectionShell>
  );
}

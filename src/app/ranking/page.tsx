import Link from "next/link";
import { Award, Medal, Trophy, Zap } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DriverAgg = {
  id: string;
  nome: string;
  placa: string | null;
  abastecimentos: number;
  litros: number;
  anomalias: number;
};

async function loadRanking(): Promise<DriverAgg[]> {
  const supabase = await createSupabaseServerClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, vehicles(plate)");

  if (!drivers) return [];

  const { data: fuelings } = await supabase
    .from("fuelings")
    .select("driver_id, status, delivered_l")
    .gte("started_at", monthStart.toISOString());

  const { data: anomalies } = await supabase
    .from("anomalies")
    .select("fueling_id, fuelings(driver_id)")
    .gte("detected_at", monthStart.toISOString());

  const fuelMap = new Map<string, { abastecimentos: number; litros: number }>();
  for (const f of (fuelings ?? []) as Array<{ driver_id: string; status: string; delivered_l: number | null }>) {
    if (!f.driver_id || f.status === "BLOCKED") continue;
    const prev = fuelMap.get(f.driver_id) ?? { abastecimentos: 0, litros: 0 };
    prev.abastecimentos += 1;
    prev.litros += Number(f.delivered_l ?? 0);
    fuelMap.set(f.driver_id, prev);
  }

  const anomMap = new Map<string, number>();
  for (const a of (anomalies ?? []) as unknown as Array<{ fuelings: { driver_id: string } | null }>) {
    const did = a.fuelings?.driver_id;
    if (did) anomMap.set(did, (anomMap.get(did) ?? 0) + 1);
  }

  type DriverWithVehicle = { id: string; name: string; vehicles: Array<{ plate: string }> };
  const rows: DriverAgg[] = (drivers as unknown as DriverWithVehicle[]).map((d) => {
    const fuel = fuelMap.get(d.id) ?? { abastecimentos: 0, litros: 0 };
    return {
      id: d.id,
      nome: d.name,
      placa: d.vehicles?.[0]?.plate ?? null,
      abastecimentos: fuel.abastecimentos,
      litros: fuel.litros,
      anomalias: anomMap.get(d.id) ?? 0,
    };
  });

  return rows.sort((a, b) => b.abastecimentos - a.abastecimentos || b.litros - a.litros);
}

function score(r: DriverAgg) {
  // Score simples MVP: 100 - 10 por anomalia, +1 por abastecimento concluído.
  const s = 100 - r.anomalias * 10 + r.abastecimentos;
  return Math.max(0, Math.min(100, s));
}

export default async function RankingPage() {
  const drivers = await loadRanking();
  const top = drivers[0];
  const cleanCount = drivers.filter((d) => d.anomalias === 0 && d.abastecimentos > 0).length;

  return (
    <SectionShell
      badge="Ranking"
      title="Eficiência e conduta dos motoristas"
      description="Score combina abastecimentos concluídos e anomalias detectadas pela IA. Calculado em cima dos dados reais do mês."
    >
      {drivers.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <Trophy className="mx-auto h-8 w-8 text-[color:var(--color-muted)]" />
          <h3 className="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">Ranking ainda vazio</h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Cadastre motoristas e gere o primeiro abastecimento para popular o ranking.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/cadastros/motoristas/novo"
              className="rounded-md border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]"
            >
              Cadastrar motorista
            </Link>
            <Link
              href="/simular"
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-[color:var(--color-text-strong)]"
            >
              <Zap className="h-3 w-3" />
              Simular evento
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Highlight
              icon={<Trophy className="h-5 w-5" />}
              tone="warning"
              title={top?.nome ?? "—"}
              subtitle={`Líder do mês · ${top?.abastecimentos ?? 0} abastecimentos`}
            />
            <Highlight
              icon={<Medal className="h-5 w-5" />}
              tone="success"
              title={`${formatNumber(Math.round(drivers.reduce((a, r) => a + r.litros, 0)))} L`}
              subtitle="Total abastecido pela frota"
            />
            <Highlight
              icon={<Award className="h-5 w-5" />}
              tone="info"
              title={`${cleanCount} sem anomalia`}
              subtitle="Motoristas com conduta limpa"
            />
          </div>

          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">
                Ranking · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[color:var(--color-surface-2)] text-left">
                    <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">#</th>
                    <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                    <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                    <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Abastecimentos</th>
                    <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                    <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Anomalias</th>
                    <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border)]">
                  {drivers.map((d, i) => (
                    <tr key={d.id}>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-[color:var(--color-text-strong)]">{d.nome}</td>
                      <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{d.placa ?? "—"}</td>
                      <td className="px-5 py-3 text-right text-[color:var(--color-text-strong)]">{d.abastecimentos}</td>
                      <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(Math.round(d.litros))} L</td>
                      <td className="px-5 py-3 text-right">
                        {d.anomalias === 0 ? (
                          <Badge variant="success">0</Badge>
                        ) : d.anomalias < 3 ? (
                          <Badge variant="warning">{d.anomalias}</Badge>
                        ) : (
                          <Badge variant="danger">{d.anomalias}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{score(d)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </SectionShell>
  );
}

function Highlight({
  icon,
  tone,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  tone: "warning" | "success" | "info";
  title: string;
  subtitle: string;
}) {
  const map = {
    warning: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
    success: "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]",
    info: "bg-[color:var(--color-info)]/15 text-[color:var(--color-info)]",
  } as const;
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${map[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-base font-semibold text-[color:var(--color-text-strong)]">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)]">{subtitle}</div>
      </div>
    </Card>
  );
}

import { Award, Medal, Trophy } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const drivers = [
  { nome: "Reinaldo Souza", placa: "BRA-2E19", kml: 3.12, viagens: 24, litros: 4820, anomalias: 0, score: 98 },
  { nome: "Antônio Lima", placa: "BRA-7K22", kml: 3.04, viagens: 27, litros: 5610, anomalias: 0, score: 96 },
  { nome: "Júlio Andrade", placa: "BRA-5C04", kml: 2.97, viagens: 19, litros: 3920, anomalias: 0, score: 93 },
  { nome: "Marina Tavares", placa: "BRA-3R66", kml: 2.85, viagens: 21, litros: 4310, anomalias: 0, score: 91 },
  { nome: "Patrícia Veloso", placa: "BRA-8L40", kml: 2.71, viagens: 17, litros: 3540, anomalias: 0, score: 88 },
  { nome: "Edna Pacheco", placa: "RIO-1A88", kml: 2.42, viagens: 22, litros: 4900, anomalias: 1, score: 72 },
  { nome: "Cleber Marques", placa: "BRA-9X12", kml: 2.11, viagens: 18, litros: 4380, anomalias: 3, score: 54 },
];

export default function RankingPage() {
  return (
    <SectionShell
      badge="Ranking"
      title="Eficiência e conduta dos motoristas"
      description="Score combina km/L, número de viagens, anomalias detectadas pela IA e respeito à cota dinâmica."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Highlight
          icon={<Trophy className="h-5 w-5" />}
          tone="warning"
          title="Reinaldo Souza"
          subtitle="Líder do mês · 3,12 km/L"
        />
        <Highlight
          icon={<Medal className="h-5 w-5" />}
          tone="success"
          title="Marina Tavares"
          subtitle="Maior evolução: +0,42 km/L"
        />
        <Highlight
          icon={<Award className="h-5 w-5" />}
          tone="info"
          title="100% conformidade"
          subtitle="5 motoristas sem anomalia"
        />
      </div>

      <Card>
        <div className="border-b border-[color:var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-white">Ranking · Maio/2026</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[color:var(--color-surface-2)] text-left">
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">#</th>
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Viagens</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">km/L</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Anomalias</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border)]">
              {drivers.map((d, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-[color:var(--color-muted)]">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-white">{d.nome}</td>
                  <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{d.placa}</td>
                  <td className="px-5 py-3 text-right text-white">{d.viagens}</td>
                  <td className="px-5 py-3 text-right font-mono text-white">{d.litros.toLocaleString("pt-BR")} L</td>
                  <td className="px-5 py-3 text-right font-mono text-white">{d.kml.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    {d.anomalias === 0 ? (
                      <Badge variant="success">0</Badge>
                    ) : d.anomalias < 3 ? (
                      <Badge variant="warning">{d.anomalias}</Badge>
                    ) : (
                      <Badge variant="danger">{d.anomalias}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-white">{d.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)]">{subtitle}</div>
      </div>
    </Card>
  );
}

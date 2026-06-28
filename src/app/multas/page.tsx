import { AlertTriangle, ArrowLeft, FileWarning, Gauge, Wallet } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MULTAS, multasKpis } from "@/lib/multas-mock";
import { MultasTabela } from "@/components/frota/multas-tabela";
import { formatBRL } from "@/lib/utils";

export const metadata = { title: "SGO-Fuel · Multas e Infrações" };

export default function MultasPage() {
  const k = multasKpis();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/frota" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
          <ArrowLeft className="h-3 w-3" /> Plataforma Cartão Frota
        </Link>

        <div className="mt-3">
          <Badge variant="warning" className="mb-2">
            <FileWarning className="h-3 w-3" /> Multas & Infrações
          </Badge>
          <h1 className="text-xl font-semibold text-[color:var(--color-text-strong)] sm:text-2xl">Gestão de multas</h1>
          <p className="text-xs text-[color:var(--color-muted)]">
            Acompanhe notificações, prazos de pagamento e pontuação por veículo/motorista.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<FileWarning className="h-4 w-4" />} title="Total de multas" value={String(k.total)} />
          <Kpi icon={<AlertTriangle className="h-4 w-4" />} title="Pendentes / vencidas" value={`${k.pendentes} / ${k.vencidas}`} tone="warning" />
          <Kpi icon={<Wallet className="h-4 w-4" />} title="Valor a pagar" value={formatBRL(k.aPagar)} tone="danger" />
          <Kpi icon={<Gauge className="h-4 w-4" />} title="Pontos acumulados" value={String(k.pontos)} />
        </div>

        <Card className="mt-6 overflow-hidden">
          <MultasTabela rows={MULTAS} />
        </Card>

        <p className="mt-4 text-xs text-[color:var(--color-muted)]">
          A IA cruza o auto de infração com o motorista responsável no momento da ocorrência —
          eliminando a dúvida de "quem estava dirigindo". (dados de demonstração)
        </p>
      </main>
    </div>
  );
}

function Kpi({
  icon,
  title,
  value,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tone?: "warning" | "danger";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div
        className={
          "mt-3 text-2xl font-semibold " +
          (tone === "danger" ? "text-[color:var(--color-danger)]" : tone === "warning" ? "text-[color:var(--color-warning)]" : "text-[color:var(--color-text-strong)]")
        }
      >
        {value}
      </div>
    </Card>
  );
}

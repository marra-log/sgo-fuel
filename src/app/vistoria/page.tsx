import { ArrowLeft, CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VISTORIAS, vistoriaKpis } from "@/lib/multas-mock";

export const metadata = { title: "SGO-Fuel · Vistoria / Check-list" };

const STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
  Aprovado: "success",
  "Com ressalvas": "warning",
  Reprovado: "danger",
};

export default function VistoriaPage() {
  const k = vistoriaKpis();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/frota" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
          <ArrowLeft className="h-3 w-3" /> Plataforma Cartão Frota
        </Link>

        <div className="mt-3">
          <Badge variant="info" className="mb-2">
            <ClipboardCheck className="h-3 w-3" /> Vistoria & Check-list
          </Badge>
          <h1 className="text-xl font-semibold text-[color:var(--color-text-strong)] sm:text-2xl">Check-in / Check-out de veículos</h1>
          <p className="text-xs text-[color:var(--color-muted)]">
            Padronização da vistoria na saída e retorno — itens conferidos, ressalvas e reprovações.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Vistorias" value={String(k.total)} />
          <Kpi title="Aprovadas" value={String(k.aprovadas)} tone="success" />
          <Kpi title="Com ressalvas" value={String(k.ressalvas)} tone="warning" />
          <Kpi title="Reprovadas" value={String(k.reprovadas)} tone="danger" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {VISTORIAS.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[color:var(--color-muted)]">{v.id}</span>
                  <span className="font-mono text-sm font-medium text-[color:var(--color-text-strong)]">{v.placa}</span>
                  <Badge variant="outline">{v.tipo}</Badge>
                </div>
                <Badge variant={STATUS_TONE[v.status]}>{v.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                {v.motorista} · {v.data} · {v.km.toLocaleString("pt-BR")} km
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {v.itens.map((it) => (
                  <div key={it.item} className="flex items-center gap-2 text-xs">
                    {it.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-none text-[color:var(--color-brand)]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 flex-none text-[color:var(--color-danger)]" />
                    )}
                    <span className={it.ok ? "text-[color:var(--color-muted)]" : "text-[color:var(--color-danger)]"}>{it.item}</span>
                  </div>
                ))}
              </div>

              {v.observacao ? (
                <div className="mt-3 rounded-md border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-3 py-2 text-xs text-[color:var(--color-warning)]">
                  {v.observacao}
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        <p className="mt-4 text-xs text-[color:var(--color-muted)]">
          No app do motorista, o check-list é preenchido com fotos antes de liberar o abastecimento. (dados de demonstração)
        </p>
      </main>
    </div>
  );
}

function Kpi({ title, value, tone }: { title: string; value: string; tone?: "success" | "warning" | "danger" }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">{title}</div>
      <div
        className={
          "mt-2 text-2xl font-semibold " +
          (tone === "success" ? "text-[color:var(--color-brand)]" : tone === "warning" ? "text-[color:var(--color-warning)]" : tone === "danger" ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-text-strong)]")
        }
      >
        {value}
      </div>
    </Card>
  );
}

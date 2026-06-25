import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBRL, formatNumber, timeAgo } from "@/lib/utils";
import { CardForm } from "../card-form";

export const dynamic = "force-dynamic";

export default async function CartaoEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("fleet_cards").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  // Uso no mês + histórico
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: txData } = await supabase
    .from("card_transactions")
    .select("id, liters, amount_brl, status, decline_reason, created_at")
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const tx = (txData ?? []) as Array<{
    id: string;
    liters: number;
    amount_brl: number;
    status: string;
    decline_reason: string | null;
    created_at: string;
  }>;

  const usadoMes = tx
    .filter((t) => t.status === "APPROVED" && new Date(t.created_at) >= monthStart)
    .reduce((a, t) => a + Number(t.liters), 0);
  const restante = Math.max(0, Number(data.monthly_limit_l) - usadoMes);
  const pctUso = data.monthly_limit_l > 0 ? Math.min(100, (usadoMes / data.monthly_limit_l) * 100) : 0;

  return (
    <SectionShell badge="Cartões · Editar" title="Cartão de frota" description="Edite, bloqueie ou acompanhe o uso e o histórico do cartão.">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <FormShell backHref="/cartoes" title="Dados do cartão">
          <CardForm initial={data} />
        </FormShell>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Cota do mês</h3>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-[color:var(--color-text-strong)]">{formatNumber(Math.round(restante))} L</div>
                <div className="text-xs text-[color:var(--color-muted)]">restantes de {formatNumber(data.monthly_limit_l)} L</div>
              </div>
              <Badge variant={pctUso > 90 ? "danger" : pctUso > 70 ? "warning" : "success"}>
                {Math.round(pctUso)}% usado
              </Badge>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
              <div className="h-full bg-[color:var(--color-brand)]" style={{ width: `${pctUso}%` }} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-[color:var(--color-border)] px-5 py-3">
              <h3 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Últimas transações</h3>
            </div>
            <div className="divide-y divide-[color:var(--color-border)]">
              {tx.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-[color:var(--color-muted)]">
                  Sem transações. Use a Maquininha para validar.
                </div>
              ) : (
                tx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {t.status === "APPROVED" ? (
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--color-brand)]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[color:var(--color-danger)]" />
                      )}
                      <div>
                        <div className="text-[color:var(--color-text-strong)]">
                          {t.status === "APPROVED" ? `${formatNumber(t.liters)} L` : "Negado"}
                        </div>
                        <div className="text-[11px] text-[color:var(--color-muted)]">
                          {t.status === "APPROVED" ? formatBRL(t.amount_brl) : t.decline_reason ?? "—"}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[color:var(--color-muted)]">{timeAgo(t.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

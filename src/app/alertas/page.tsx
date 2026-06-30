import Link from "next/link";
import { Ban, Bell, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBRL, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "SGO-Fuel · Alertas" };

const SALDO_BAIXO = 100; // R$

type Alert = {
  key: string;
  severity: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  detail: string;
  href: string;
  when?: string;
};

async function computeAlerts(): Promise<Alert[]> {
  const supabase = await createSupabaseServerClient();
  const alerts: Alert[] = [];

  // Cartões bloqueados / perdidos
  const { data: blocked } = await supabase
    .from("fleet_cards")
    .select("id, card_number, holder_name, status, drivers(name)")
    .in("status", ["BLOCKED", "LOST"]);
  for (const c of (blocked ?? []) as unknown as Array<{ id: string; card_number: string; holder_name: string | null; status: string; drivers: { name: string } | null }>) {
    alerts.push({
      key: `blk-${c.id}`,
      severity: "danger",
      icon: <Ban className="h-4 w-4" />,
      title: `Cartão ${c.status === "LOST" ? "perdido" : "bloqueado"} · ••••${c.card_number.slice(-4)}`,
      detail: c.drivers?.name ?? c.holder_name ?? "sem motorista",
      href: `/cartoes/${c.id}`,
    });
  }

  // Saldo baixo (só se wallet.sql aplicado)
  const { data: low, error: lowErr } = await supabase
    .from("fleet_cards")
    .select("id, card_number, holder_name, balance_brl, drivers(name)")
    .eq("status", "ACTIVE")
    .lt("balance_brl", SALDO_BAIXO)
    .order("balance_brl", { ascending: true });
  if (!lowErr) {
    for (const c of (low ?? []) as unknown as Array<{ id: string; card_number: string; holder_name: string | null; balance_brl: number | null; drivers: { name: string } | null }>) {
      alerts.push({
        key: `low-${c.id}`,
        severity: "warning",
        icon: <Wallet className="h-4 w-4" />,
        title: `Saldo baixo · ••••${c.card_number.slice(-4)} (${formatBRL(Number(c.balance_brl ?? 0))})`,
        detail: `${c.drivers?.name ?? c.holder_name ?? "sem motorista"} — recarregue para não interromper o abastecimento`,
        href: `/cartoes/${c.id}`,
      });
    }
  }

  // Transações negadas nas últimas 48h
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: declined } = await supabase
    .from("card_transactions")
    .select("id, card_number, decline_reason, created_at, drivers(name)")
    .eq("status", "DECLINED")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);
  for (const t of (declined ?? []) as unknown as Array<{ id: string; card_number: string | null; decline_reason: string | null; created_at: string; drivers: { name: string } | null }>) {
    alerts.push({
      key: `dec-${t.id}`,
      severity: "warning",
      icon: <XCircle className="h-4 w-4" />,
      title: `Transação negada · ••••${(t.card_number ?? "----").slice(-4)}`,
      detail: `${t.decline_reason ?? "motivo não informado"}${t.drivers?.name ? ` · ${t.drivers.name}` : ""}`,
      href: "/transacoes",
      when: timeAgo(t.created_at),
    });
  }

  // ordena: danger primeiro
  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "danger" ? -1 : 1));
}

export default async function AlertasPage() {
  const alerts = await computeAlerts();
  const danger = alerts.filter((a) => a.severity === "danger").length;

  return (
    <SectionShell
      badge="Operação · Alertas"
      title="Central de alertas"
      description="Sinais que pedem ação: cartões bloqueados, saldo baixo e transações negadas recentes."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={danger ? "danger" : "success"}>
          <Bell className="h-3 w-3" /> {alerts.length} alerta{alerts.length === 1 ? "" : "s"}
        </Badge>
        {danger > 0 ? <span className="text-xs text-[color:var(--color-muted)]">{danger} crítico{danger === 1 ? "" : "s"}</span> : null}
      </div>

      {alerts.length === 0 ? (
        <Card className="p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-[color:var(--color-brand)]" />
          <p className="mt-3 text-sm text-[color:var(--color-text-strong)]">Tudo certo — nenhum alerta no momento.</p>
          <p className="text-xs text-[color:var(--color-muted)]">Saldo ok, nenhum cartão bloqueado e nenhuma transação negada nas últimas 48h.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Link key={a.key} href={a.href}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-[color:var(--color-brand)]/50">
                <span
                  className={
                    "flex h-9 w-9 flex-none items-center justify-center rounded-lg " +
                    (a.severity === "danger"
                      ? "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]"
                      : "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]")
                  }
                >
                  {a.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[color:var(--color-text-strong)]">{a.title}</div>
                  <div className="truncate text-xs text-[color:var(--color-muted)]">{a.detail}</div>
                </div>
                {a.when ? <span className="flex-none text-[11px] text-[color:var(--color-muted)]">{a.when}</span> : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

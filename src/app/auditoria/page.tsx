import { Activity, Pencil, Plus, Trash2 } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABLE_LABEL: Record<string, string> = {
  drivers: "Motorista",
  vehicles: "Veículo",
  yards: "Pátio",
  tanks: "Tanque",
  pumps: "Bomba",
  routes: "Rota",
  fuelings: "Abastecimento",
  anomalies: "Anomalia",
  fiscal_invoices: "NFe",
  tenants: "Empresa",
};

type Log = {
  id: string;
  actor_id: string | null;
  action: string;
  target: string;
  meta: { table?: string; op?: string } | null;
  created_at: string;
};

function opBadge(op: string) {
  if (op === "INSERT") return { variant: "success" as const, label: "Criou", Icon: Plus };
  if (op === "UPDATE") return { variant: "info" as const, label: "Editou", Icon: Pencil };
  if (op === "DELETE") return { variant: "danger" as const, label: "Excluiu", Icon: Trash2 };
  return { variant: "outline" as const, label: op, Icon: Activity };
}

export default async function AuditoriaPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, target, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Log[];

  return (
    <SectionShell
      badge="Auditoria"
      title="Trilha de auditoria"
      description="Todo cadastro, edição e exclusão é registrado automaticamente no banco (trigger), isolado por empresa via RLS. Compliance e rastreabilidade total."
    >
      {error ? (
        <Card className="p-6">
          <p className="text-sm text-[color:var(--color-danger)]">{error.message}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <Activity className="mx-auto h-8 w-8 text-[color:var(--color-muted)]" />
          <h3 className="mt-3 text-base font-semibold text-white">Nenhum registro de auditoria</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[color:var(--color-muted)]">
            Se você já cadastrou itens e nada aparece aqui, rode o arquivo
            <code className="mx-1 rounded bg-[color:var(--color-surface-2)] px-1 text-xs">supabase/audit.sql</code>
            no SQL Editor do Supabase para ligar os triggers de auditoria.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[color:var(--color-border)]">
            {rows.map((l) => {
              const op = opBadge(l.meta?.op ?? l.action);
              const table = l.meta?.table ?? l.target.split(":")[0];
              const { Icon } = op;
              return (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={op.variant}>{op.label}</Badge>
                      <span className="font-medium text-white">
                        {TABLE_LABEL[table] ?? table}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-[color:var(--color-muted)]">
                      {l.target}
                    </div>
                  </div>
                  <div className="flex-none text-right text-xs text-[color:var(--color-muted)]">
                    {timeAgo(l.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </SectionShell>
  );
}

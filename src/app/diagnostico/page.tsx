import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Diag = {
  ok: boolean;
  label: string;
  value: string;
  hint?: string;
};

export default async function DiagnosticoPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const checks: Diag[] = [];

  checks.push({
    ok: !!user,
    label: "Sessão Supabase",
    value: user ? `${user.email} (${user.id.slice(0, 8)}…)` : "Sem sessão",
    hint: user ? undefined : "Faça login em /login.",
  });

  let tenantId: string | null = null;
  let tenantName: string | null = null;
  let role: string | null = null;

  if (user) {
    const { data: members, error: memErr } = await supabase
      .from("tenant_members")
      .select("tenant_id, role, tenants(name)")
      .limit(5);

    if (memErr) {
      checks.push({
        ok: false,
        label: "tenant_members",
        value: "ERRO: " + memErr.message,
        hint: "Pode indicar RLS bloqueando leitura. Verifique se o schema SQL rodou completo.",
      });
    } else if (!members || members.length === 0) {
      checks.push({
        ok: false,
        label: "Empresa vinculada",
        value: "Nenhuma empresa associada ao seu usuário",
        hint: "Vá em /cadastros/empresa e crie a empresa — o trigger fará você OWNER.",
      });
    } else {
      const m = members[0];
      tenantId = m.tenant_id as string;
      role = m.role as string;
      const t = m.tenants as unknown as { name?: string } | null;
      tenantName = t?.name ?? null;
      checks.push({
        ok: true,
        label: "Empresa vinculada",
        value: `${tenantName ?? "(sem nome)"} · papel ${role}`,
      });
    }
  }

  // Tenta SELECTS pra cada tabela (vai falhar se RLS quebrar)
  type TableCheck = { table: string; label: string };
  const tables: TableCheck[] = [
    { table: "drivers", label: "Motoristas" },
    { table: "vehicles", label: "Veículos" },
    { table: "yards", label: "Pátios" },
    { table: "tanks", label: "Tanques" },
    { table: "pumps", label: "Bombas" },
    { table: "fuelings", label: "Abastecimentos" },
    { table: "anomalies", label: "Anomalias" },
  ];

  const tableChecks: Array<{ table: string; label: string; ok: boolean; count: number; err?: string }> = [];
  if (user) {
    for (const t of tables) {
      const { count, error } = await supabase.from(t.table).select("*", { count: "exact", head: true });
      tableChecks.push({
        table: t.table,
        label: t.label,
        ok: !error,
        count: count ?? 0,
        err: error?.message,
      });
    }
  }

  return (
    <SectionShell
      badge="Diagnóstico"
      title="O que o banco está respondendo"
      description="Esta página revela exatamente o que o seu usuário consegue ler/escrever no Supabase. Útil pra entender por que um cadastro falha."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Sessão e empresa</h2>
          <div className="mt-4 space-y-3">
            {checks.map((c, i) => (
              <Row key={i} ok={c.ok} label={c.label} value={c.value} hint={c.hint} />
            ))}
            {user && !tenantId ? (
              <div className="mt-4 rounded-md border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-3 text-sm">
                <strong className="text-[color:var(--color-warning)]">Ação:</strong>{" "}
                <Link href="/cadastros/empresa" className="underline">
                  Abrir /cadastros/empresa
                </Link>{" "}
                e criar sua empresa agora.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Acesso às tabelas (RLS)</h2>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            Se uma tabela aparecer com erro, o problema é a policy de RLS — o schema
            precisa ser reaplicado.
          </p>
          <div className="mt-4 space-y-2">
            {tableChecks.length === 0 ? (
              <p className="text-sm text-[color:var(--color-muted)]">Faça login pra verificar.</p>
            ) : (
              tableChecks.map((t) => (
                <div key={t.table} className="flex items-start justify-between gap-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    {t.ok ? (
                      <CheckCircle2 className="h-4 w-4 flex-none text-[color:var(--color-brand)]" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-none text-[color:var(--color-danger)]" />
                    )}
                    <div>
                      <div className="font-medium text-[color:var(--color-text-strong)]">{t.label}</div>
                      <div className="font-mono text-[10px] text-[color:var(--color-muted)]">{t.table}</div>
                      {t.err ? <div className="mt-1 text-xs text-[color:var(--color-danger)]">{t.err}</div> : null}
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-mono text-xs text-[color:var(--color-muted)]">
                    {t.ok ? `${t.count} linha${t.count === 1 ? "" : "s"}` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Como interpretar</h2>
        <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted)]">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-brand)]" />
            <span>
              <strong className="text-[color:var(--color-text-strong)]">Sessão</strong> verde + <strong className="text-[color:var(--color-text-strong)]">Empresa</strong> verde +
              todas as tabelas verdes → o cadastro deveria funcionar. Se ainda falhar, abra o
              console do navegador (F12) na hora do clique <em>Salvar</em>.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-warning)]" />
            <span>
              <strong className="text-[color:var(--color-text-strong)]">Empresa vermelha</strong> → seu signup criou usuário mas
              não criou tenant. Vá em <Link className="underline" href="/cadastros/empresa">/cadastros/empresa</Link>{" "}
              e crie. O trigger SQL te coloca como OWNER.
            </span>
          </li>
          <li className="flex gap-2">
            <XCircle className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-danger)]" />
            <span>
              <strong className="text-[color:var(--color-text-strong)]">Tabela vermelha</strong> com erro tipo{" "}
              <code className="rounded bg-[color:var(--color-surface-2)] px-1 text-xs">relation does not exist</code> → o schema SQL não rodou completo.
              Volte ao SQL Editor do Supabase e reaplique <code className="rounded bg-[color:var(--color-surface-2)] px-1 text-xs">supabase/schema.sql</code>.
            </span>
          </li>
        </ul>
      </Card>
    </SectionShell>
  );
}

function Row({ ok, label, value, hint }: Diag) {
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-[color:var(--color-brand)]" />
        ) : (
          <XCircle className="h-4 w-4 text-[color:var(--color-danger)]" />
        )}
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{label}</span>
      </div>
      <div className="mt-1 text-sm text-[color:var(--color-text-strong)]">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[color:var(--color-muted)]">{hint}</div> : null}
    </div>
  );
}

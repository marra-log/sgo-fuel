import Link from "next/link";
import { Shield, UserPlus, Users } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, { label: string; tone: "success" | "info" | "outline"; desc: string }> = {
  OWNER: { label: "Proprietário", tone: "success", desc: "Acesso total: gestão, cadastros, usuários e cobrança." },
  MANAGER: { label: "Gestor", tone: "info", desc: "Opera cadastros, cartões, relatórios e anomalias." },
  VIEWER: { label: "Visualizador", tone: "outline", desc: "Apenas leitura dos painéis e relatórios." },
};

type Member = { user_id: string; role: string; created_at: string };

export default async function UsuariosPage() {
  const supabase = await createSupabaseServerClient();
  const tenant = await getCurrentTenant();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tenant_members")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: true });

  const members = (data ?? []) as Member[];

  return (
    <SectionShell
      badge="Usuários & acessos"
      title="Equipe e permissões"
      description="Controle quem acessa o sistema da sua empresa e o nível de permissão de cada um (estilo Flagcard)."
    >
      {/* Sua conta */}
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">Você está conectado como</div>
            <div className="mt-1 text-base font-semibold text-[color:var(--color-text-strong)]">{user?.email ?? "—"}</div>
            <div className="text-xs text-[color:var(--color-muted)]">Empresa: {tenant?.name ?? "—"}</div>
          </div>
          <Badge variant={ROLE_LABEL[tenant?.role ?? "VIEWER"]?.tone ?? "outline"}>
            <Shield className="h-3 w-3" />
            {ROLE_LABEL[tenant?.role ?? "VIEWER"]?.label ?? tenant?.role}
          </Badge>
        </div>
      </Card>

      {/* Níveis de acesso */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Object.entries(ROLE_LABEL).map(([key, r]) => (
          <Card key={key} className="p-5">
            <Badge variant={r.tone}>{r.label}</Badge>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">{r.desc}</p>
          </Card>
        ))}
      </div>

      {/* Membros */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Usuários liberados</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Pessoas com acesso à empresa {tenant?.name ?? ""}.</p>
          </div>
          <Badge variant="info">
            <Users className="h-3 w-3" />
            {members.length} {members.length === 1 ? "usuário" : "usuários"}
          </Badge>
        </div>
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : members.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[color:var(--color-muted)]">
            Nenhum usuário liberado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Usuário (ID)</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Papel</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Liberado em</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {members.map((m) => {
                  const r = ROLE_LABEL[m.role] ?? { label: m.role, tone: "outline" as const };
                  const isYou = m.user_id === user?.id;
                  return (
                    <tr key={m.user_id}>
                      <td className="px-5 py-3 font-mono text-[color:var(--color-text-strong)]">
                        {m.user_id.slice(0, 8)}…{isYou ? <span className="ml-2 text-[10px] text-[color:var(--color-brand)]">(você)</span> : null}
                      </td>
                      <td className="px-5 py-3"><Badge variant={r.tone}>{r.label}</Badge></td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right"><Badge variant="success">Ativo</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Liberar novo usuário */}
      <Card className="mt-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Liberar um novo usuário</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[color:var(--color-muted)]">
              <li>Peça à pessoa para criar uma conta em <Link href="/cadastro" className="text-[color:var(--color-brand)] hover:underline">/cadastro</Link>.</li>
              <li>O proprietário (você) confirma o acesso e define o papel (Proprietário, Gestor ou Visualizador).</li>
              <li>O usuário passa a ver os painéis conforme a permissão.</li>
            </ol>
            <p className="mt-3 text-xs text-[color:var(--color-muted)]">
              Em produção, o convite por e-mail é automático. No MVP, a liberação é feita pelo proprietário.
            </p>
          </div>
        </div>
      </Card>
    </SectionShell>
  );
}

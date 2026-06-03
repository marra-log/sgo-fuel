import Link from "next/link";
import { Users } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Badge } from "@/components/ui/badge";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Driver = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  cnh: string | null;
  score: number;
  active: boolean;
  created_at: string;
};

export default async function MotoristasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (drivers ?? []) as Driver[];

  return (
    <SectionShell
      badge="Cadastros · Motoristas"
      title="Motoristas"
      description="Pessoas habilitadas a abastecer veículos da frota. Cada motorista tem score (zera quando a IA bloqueia anomalia)."
    >
      <ListShell newHref="/cadastros/motoristas/novo" newLabel="Novo motorista">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum motorista cadastrado"
            description="Cadastre o primeiro motorista da empresa pra começar a operar."
            ctaHref="/cadastros/motoristas/novo"
            ctaLabel="Cadastrar motorista"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Nome</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">CPF</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">CNH</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Telefone</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Score</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/cadastros/motoristas/${d.id}`}
                        className="flex items-center gap-2 font-medium text-white hover:text-[color:var(--color-brand)]"
                      >
                        <Users className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[color:var(--color-muted)]">{d.cpf ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[color:var(--color-muted)]">{d.cnh ?? "—"}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{d.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{d.score}</td>
                    <td className="px-5 py-3 text-right">
                      {d.active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListShell>
    </SectionShell>
  );
}

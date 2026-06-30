import Link from "next/link";
import { CreditCard, Nfc } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Badge } from "@/components/ui/badge";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBRL, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  ACTIVE: { label: "Ativo", tone: "success" },
  BLOCKED: { label: "Bloqueado", tone: "warning" },
  LOST: { label: "Perdido", tone: "danger" },
};

type Card = {
  id: string;
  card_number: string;
  nfc_uid: string | null;
  holder_name: string | null;
  status: string;
  monthly_limit_l: number;
  balance_brl: number | null;
  drivers: { name: string } | null;
  vehicles: { plate: string } | null;
};

function maskCard(n: string) {
  const clean = n.replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

export default async function CartoesPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fleet_cards")
    .select("id, card_number, nfc_uid, holder_name, status, monthly_limit_l, balance_brl, drivers(name), vehicles(plate)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Card[];

  return (
    <SectionShell
      badge="Cartões de frota"
      title="Cartão exclusivo da empresa"
      description="Cartões private label (fechados) identificados por número e NFC. Cada um tem saldo pré-pago (R$) — recarregue no cartão e o motorista debita na Smart POS. Bloqueio na hora."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/maquininha" className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
          <CreditCard className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
          Abrir a Maquininha (terminal)
        </Link>
      </div>

      <ListShell backHref="/dashboard" backLabel="Voltar ao painel" newHref="/cartoes/novo" newLabel="Emitir cartão">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">
            {error.message}
            <div className="mt-2 text-xs text-[color:var(--color-muted)]">
              Se a tabela não existe, rode <code className="rounded bg-[color:var(--color-surface-2)] px-1">supabase/cards.sql</code> no Supabase.
            </div>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum cartão emitido"
            description="Emita o primeiro cartão de frota e vincule a um motorista/veículo."
            ctaHref="/cartoes/novo"
            ctaLabel="Emitir cartão"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cartão</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Titular</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Veículo</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Saldo</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Cota/mês</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((c) => {
                  const st = STATUS[c.status] ?? { label: c.status, tone: "warning" as const };
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                      <td className="px-5 py-3">
                        <Link href={`/cartoes/${c.id}`} className="flex items-center gap-2 font-mono font-medium text-[color:var(--color-text-strong)] hover:text-[color:var(--color-brand)]">
                          <CreditCard className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                          {maskCard(c.card_number)}
                          {c.nfc_uid ? <Nfc className="h-3 w-3 text-[color:var(--color-brand)]" /> : null}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">{c.holder_name ?? "—"}</td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">{c.drivers?.name ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{c.vehicles?.plate ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-mono font-medium text-[color:var(--color-brand)]">{formatBRL(Number(c.balance_brl ?? 0))}</td>
                      <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(c.monthly_limit_l)} L</td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={st.tone}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ListShell>
    </SectionShell>
  );
}

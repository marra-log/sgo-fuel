import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Step = { label: string; hint: string; href: string; cta: string; done: boolean };

/**
 * Primeiros passos: guia o cliente recém-cadastrado até a primeira operação.
 * Some sozinho quando todas as etapas estão concluídas.
 */
export async function OnboardingChecklist() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [drivers, vehicles, pumps, cards] = await Promise.all([
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("pumps").select("*", { count: "exact", head: true }),
    supabase.from("fleet_cards").select("balance_brl"),
  ]);

  const cardRows = (cards.data ?? []) as Array<{ balance_brl: number | null }>;
  const temSaldo = cardRows.some((c) => Number(c.balance_brl ?? 0) > 0);

  const steps: Step[] = [
    {
      label: "Cadastre os motoristas",
      hint: "Quem pode autorizar abastecimento.",
      href: "/cadastros/motoristas/novo",
      cta: "Cadastrar motorista",
      done: (drivers.count ?? 0) > 0,
    },
    {
      label: "Cadastre os veículos",
      hint: "Placa, modelo e motorista atual.",
      href: "/cadastros/veiculos/novo",
      cta: "Cadastrar veículo",
      done: (vehicles.count ?? 0) > 0,
    },
    {
      label: "Cadastre pátio, tanque e bomba",
      hint: "Onde o combustível sai.",
      href: "/cadastros",
      cta: "Abrir cadastros",
      done: (pumps.count ?? 0) > 0,
    },
    {
      label: "Emita o cartão de frota",
      hint: "Um cartão por motorista, com regras de uso.",
      href: "/cartoes/novo",
      cta: "Emitir cartão",
      done: cardRows.length > 0,
    },
    {
      label: "Recarregue o saldo",
      hint: "Sem saldo, a Smart POS recusa o abastecimento.",
      href: "/cartoes/recarga",
      cta: "Recarregar",
      done: temSaldo,
    },
  ];

  const feitos = steps.filter((s) => s.done).length;
  if (feitos === steps.length) return null; // configuração concluída — some da tela

  const proximo = steps.find((s) => !s.done)!;

  return (
    <Card className="mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Primeiros passos</h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            Configure a operação para os números do painel começarem a aparecer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[color:var(--color-muted)]">
            {feitos} de {steps.length} concluídos
          </span>
          <Link
            href={proximo.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-semibold text-black hover:opacity-90"
          >
            {proximo.cta} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-full bg-[color:var(--color-brand)] transition-all"
          style={{ width: `${(feitos / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-start gap-3">
            {s.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-brand)]" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-muted)]" />
            )}
            <div className="min-w-0 flex-1">
              <div
                className={
                  "text-sm " +
                  (s.done
                    ? "text-[color:var(--color-muted)] line-through"
                    : "font-medium text-[color:var(--color-text-strong)]")
                }
              >
                {i + 1}. {s.label}
              </div>
              {!s.done ? <div className="text-xs text-[color:var(--color-muted)]">{s.hint}</div> : null}
            </div>
            {!s.done ? (
              <Link href={s.href} className="flex-none text-xs font-medium text-[color:var(--color-brand)] hover:underline">
                Ir →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

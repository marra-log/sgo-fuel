import { SectionShell } from "@/components/section-shell";
import { SectionTabs, FINANCEIRO_TABS } from "@/components/section-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TransacoesClient, type TxRow } from "./transacoes-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "SGO-Fuel · Transações do cartão" };

type Raw = {
  id: string;
  card_number: string | null;
  liters: number;
  price_per_l: number;
  amount_brl: number;
  status: string;
  decline_reason: string | null;
  created_at: string;
  drivers: { name: string } | null;
  vehicles: { plate: string } | null;
};

export default async function TransacoesPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("card_transactions")
    .select("id, card_number, liters, price_per_l, amount_brl, status, decline_reason, created_at, drivers(name), vehicles(plate)")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: TxRow[] = ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    card_number: r.card_number,
    liters: Number(r.liters),
    price_per_l: Number(r.price_per_l),
    amount_brl: Number(r.amount_brl),
    status: r.status,
    decline_reason: r.decline_reason,
    created_at: r.created_at,
    motorista: r.drivers?.name ?? null,
    placa: r.vehicles?.plate ?? null,
  }));

  // Saldo total em cartões (best-effort: só se wallet.sql foi aplicado)
  let saldoCartoes: number | null = null;
  const { data: bal, error: balErr } = await supabase.from("fleet_cards").select("balance_brl");
  if (!balErr && bal) {
    saldoCartoes = (bal as Array<{ balance_brl: number | null }>).reduce((a, c) => a + Number(c.balance_brl ?? 0), 0);
  }

  return (
    <SectionShell
      badge="Financeiro & Fiscal"
      title="Abastecimentos"
      description="Todo abastecimento autorizado ou negado nos terminais (Smart POS, Totem e celular). Filtre, audite e exporte."
    >
      <SectionTabs tabs={FINANCEIRO_TABS} />
      <TransacoesClient rows={rows} saldoCartoes={saldoCartoes} />
    </SectionShell>
  );
}

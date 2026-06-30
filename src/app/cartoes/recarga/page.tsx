import { SectionShell } from "@/components/section-shell";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecargaCentral, type RecargaCard } from "./recarga-central";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  card_number: string;
  holder_name: string | null;
  balance_brl: number | null;
  drivers: { name: string } | null;
  vehicles: { plate: string } | null;
};

export default async function RecargaPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("fleet_cards")
    .select("id, card_number, holder_name, balance_brl, drivers(name), vehicles(plate)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const cards: RecargaCard[] = rows.map((r) => ({
    id: r.id,
    card_number: r.card_number,
    holder_name: r.holder_name,
    balance_brl: r.balance_brl,
    motorista: r.drivers?.name ?? null,
    placa: r.vehicles?.plate ?? null,
  }));

  return (
    <SectionShell
      badge="Financeiro · Recarga"
      title="Adicionar saldo nos cartões"
      description="Selecione o cartão ou o motorista e insira o saldo (manual ou PIX). Esse saldo é usado tanto na Smart POS quanto no Totem IoT."
    >
      <ListShell backHref="/cartoes" backLabel="Voltar aos cartões" newHref="/cartoes/novo" newLabel="Emitir cartão">
        {cards.length === 0 ? (
          <EmptyState
            title="Nenhum cartão emitido"
            description="Emita um cartão e vincule a um motorista para poder recarregar."
            ctaHref="/cartoes/novo"
            ctaLabel="Emitir cartão"
          />
        ) : (
          <div className="p-4">
            <RecargaCentral cards={cards} />
          </div>
        )}
      </ListShell>
    </SectionShell>
  );
}

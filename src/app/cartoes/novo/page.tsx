import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { CardForm } from "../card-form";

export default function NovoCartaoPage() {
  return (
    <SectionShell badge="Cartões · Emitir" title="Emitir cartão de frota" description="Cartão private label fechado, com cota mensal e vínculo opcional a motorista/veículo.">
      <FormShell backHref="/cartoes" title="Novo cartão" subtitle="O número e o UID NFC podem ser gerados automaticamente.">
        <CardForm />
      </FormShell>
    </SectionShell>
  );
}

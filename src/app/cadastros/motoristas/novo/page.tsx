import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { DriverForm } from "../driver-form";

export default function NovoMotoristaPage() {
  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/motoristas", label: "Motoristas" }]} width="form" badge="Cadastros · Motoristas" title="Novo motorista" description="Habilite um motorista para autorizar abastecimentos.">
      <FormShell backHref="/cadastros/motoristas" title="Cadastrar motorista" subtitle="Os campos com * são obrigatórios.">
        <DriverForm />
      </FormShell>
    </SectionShell>
  );
}

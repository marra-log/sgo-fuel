import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { YardForm } from "../yard-form";

export default function NovoPatioPage() {
  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/patios", label: "Pátios" }]} width="form" badge="Cadastros · Pátios" title="Novo pátio" description="Cadastre uma base onde ficam bombas e tanques.">
      <FormShell backHref="/cadastros/patios" title="Cadastrar pátio">
        <YardForm />
      </FormShell>
    </SectionShell>
  );
}

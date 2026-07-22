import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { TankForm } from "../tank-form";

export default function NovoTanquePage() {
  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/tanques", label: "Tanques" }]} width="form" badge="Cadastros · Tanques" title="Novo tanque" description="Adicione um tanque físico em um pátio.">
      <FormShell backHref="/cadastros/tanques" title="Cadastrar tanque" subtitle="Cadastre o pátio antes se ele ainda não existir.">
        <TankForm />
      </FormShell>
    </SectionShell>
  );
}

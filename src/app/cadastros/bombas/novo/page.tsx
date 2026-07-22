import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { PumpForm } from "../pump-form";

export default function NovaBombaPage() {
  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/bombas", label: "Bombas" }]} width="form" badge="Cadastros · Bombas" title="Nova bomba" description="Cadastre uma bomba interna ou em posto parceiro.">
      <FormShell backHref="/cadastros/bombas" title="Cadastrar bomba" subtitle="Você pode cadastrar a bomba antes de instalar o totem IoT — o device_id chega depois.">
        <PumpForm />
      </FormShell>
    </SectionShell>
  );
}

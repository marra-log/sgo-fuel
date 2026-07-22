import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { VehicleForm } from "../vehicle-form";

export default function NovoVeiculoPage() {
  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/veiculos", label: "Veículos" }]} width="form" badge="Cadastros · Veículos" title="Novo veículo" description="Adicione um veículo à frota.">
      <FormShell backHref="/cadastros/veiculos" title="Cadastrar veículo" subtitle="Vincule um motorista atual se quiser já habilitar o uso.">
        <VehicleForm />
      </FormShell>
    </SectionShell>
  );
}

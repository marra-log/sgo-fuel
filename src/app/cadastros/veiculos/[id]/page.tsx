import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VehicleForm } from "../vehicle-form";

export const dynamic = "force-dynamic";

export default async function VeiculoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();

  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/veiculos", label: "Veículos" }]} width="form" badge="Cadastros · Veículos" title="Editar veículo" description="Atualize dados, troque motorista, ou exclua.">
      <FormShell backHref="/cadastros/veiculos" title={data.plate} subtitle={data.model ?? ""}>
        <VehicleForm initial={data} />
      </FormShell>
    </SectionShell>
  );
}

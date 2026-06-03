import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DriverForm } from "../driver-form";

export const dynamic = "force-dynamic";

export default async function MotoristaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("drivers").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();

  return (
    <SectionShell badge="Cadastros · Motoristas" title="Editar motorista" description="Atualize os dados ou desative o motorista.">
      <FormShell
        backHref="/cadastros/motoristas"
        title={data.name}
        subtitle={`Cadastrado em ${new Date(data.created_at).toLocaleDateString("pt-BR")}`}
      >
        <DriverForm initial={data} />
      </FormShell>
    </SectionShell>
  );
}

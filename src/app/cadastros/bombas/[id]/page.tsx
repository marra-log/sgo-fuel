import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PumpForm } from "../pump-form";

export const dynamic = "force-dynamic";

export default async function BombaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pumps").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <SectionShell badge="Cadastros · Bombas" title="Editar bomba" description="Atualize status, vínculo com tanque, ou exclua.">
      <FormShell backHref="/cadastros/bombas" title={data.serial_number}>
        <PumpForm initial={data} />
      </FormShell>
    </SectionShell>
  );
}

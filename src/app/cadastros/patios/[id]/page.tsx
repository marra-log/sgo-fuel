import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { YardForm } from "../yard-form";

export const dynamic = "force-dynamic";

export default async function PatioEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("yards").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/patios", label: "Pátios" }]} width="form" badge="Cadastros · Pátios" title="Editar pátio" description="Ajuste o endereço, coordenadas ou exclua.">
      <FormShell backHref="/cadastros/patios" title={data.name} subtitle={data.address ?? ""}>
        <YardForm initial={data} />
      </FormShell>
    </SectionShell>
  );
}

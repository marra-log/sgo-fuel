import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";
import { FormShell } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TankForm } from "../tank-form";

export const dynamic = "force-dynamic";

export default async function TanqueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("tanks").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <SectionShell crumbs={[{ href: "/cadastros", label: "Cadastros" }, { href: "/cadastros/tanques", label: "Tanques" }]} width="form" badge="Cadastros · Tanques" title="Editar tanque" description="Ajuste capacidade, combustível ou exclua.">
      <FormShell backHref="/cadastros/tanques" title={data.name}>
        <TankForm initial={data} />
      </FormShell>
    </SectionShell>
  );
}

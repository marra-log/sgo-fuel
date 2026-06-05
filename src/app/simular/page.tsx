import { SectionShell } from "@/components/section-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SimuladorClient } from "./simulador-client";

export const dynamic = "force-dynamic";

export default async function SimularPage() {
  const supabase = await createSupabaseServerClient();
  const [drivers, vehicles, pumps] = await Promise.all([
    supabase.from("drivers").select("id, name").eq("active", true).order("name"),
    supabase.from("vehicles").select("id, plate, model").order("plate"),
    supabase
      .from("pumps")
      .select("id, serial_number, yards(name), partner_station")
      .order("serial_number"),
  ]);

  return (
    <SectionShell
      badge="Simulador"
      title="Gerar evento de abastecimento"
      description="Crie eventos reais no banco — autorização, conclusão ou bloqueio com anomalia. As telas /dashboard, /anomalias e /ranking respondem na hora."
    >
      <SimuladorClient
        drivers={(drivers.data ?? []) as Array<{ id: string; name: string }>}
        vehicles={(vehicles.data ?? []) as Array<{ id: string; plate: string; model: string | null }>}
        pumps={
          (pumps.data ?? []) as unknown as Array<{
            id: string;
            serial_number: string;
            yards: { name: string } | null;
            partner_station: string | null;
          }>
        }
      />
    </SectionShell>
  );
}

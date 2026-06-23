import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MaquininhaClient } from "./maquininha-client";

export const dynamic = "force-dynamic";

export default async function MaquininhaPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: pumps }, { data: cards }] = await Promise.all([
    supabase.from("pumps").select("id, serial_number, yards(name), partner_station").order("serial_number"),
    supabase.from("fleet_cards").select("card_number, holder_name, status").order("created_at", { ascending: false }),
  ]);

  return (
    <MaquininhaClient
      pumps={(pumps ?? []) as never}
      cards={(cards ?? []) as never}
    />
  );
}

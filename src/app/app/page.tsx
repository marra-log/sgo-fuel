import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MotoristaApp } from "./motorista-app";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-brand)] text-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="SGO-Fuel" className="h-10 w-10" />
        </div>
        <h1 className="text-lg font-semibold text-white">SGO-Fuel · Motorista</h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Faça login para acessar o app do motorista.
        </p>
        <Link
          href="/login?redirect=/app"
          className="rounded-lg bg-[color:var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-black"
        >
          Entrar
        </Link>
      </div>
    );
  }

  const [drivers, vehicles, pumps, routes] = await Promise.all([
    supabase.from("drivers").select("id, name, score").eq("active", true).order("name"),
    supabase.from("vehicles").select("id, plate, model, current_driver_id, fuel_type, current_odometer"),
    supabase
      .from("pumps")
      .select("id, serial_number, yards(name), partner_station")
      .order("serial_number"),
    supabase
      .from("routes")
      .select("id, code, origin, destination, quota_l, driver_id, vehicle_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <MotoristaApp
      drivers={(drivers.data ?? []) as never}
      vehicles={(vehicles.data ?? []) as never}
      pumps={(pumps.data ?? []) as never}
      routes={(routes.data ?? []) as never}
    />
  );
}

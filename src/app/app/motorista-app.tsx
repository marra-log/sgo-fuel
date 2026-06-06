"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Fuel,
  Gauge,
  LogOut,
  MapPin,
  Navigation,
  Truck,
  User as UserIcon,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { formatNumber, timeAgo } from "@/lib/utils";

type Driver = { id: string; name: string; score: number };
type Vehicle = {
  id: string;
  plate: string;
  model: string | null;
  current_driver_id: string | null;
  fuel_type: string;
  current_odometer: number | null;
};
type Pump = {
  id: string;
  serial_number: string;
  yards: { name: string } | null;
  partner_station: string | null;
};
type Route = {
  id: string;
  code: string;
  origin: string | null;
  destination: string | null;
  quota_l: number | null;
  driver_id: string | null;
  vehicle_id: string | null;
};
type HistRow = {
  id: string;
  started_at: string;
  delivered_l: number | null;
  quota_l: number;
  status: string;
};

const DRIVER_KEY = "sgo_driver_id";

export function MotoristaApp({
  drivers,
  vehicles,
  pumps,
  routes,
}: {
  drivers: Driver[];
  vehicles: Vehicle[];
  pumps: Pump[];
  routes: Route[];
}) {
  const [driverId, setDriverId] = useState<string>("");
  const [hist, setHist] = useState<HistRow[]>([]);
  const [pumpId, setPumpId] = useState<string>(pumps[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Restaura motorista escolhido
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(DRIVER_KEY) : null;
    if (saved && drivers.some((d) => d.id === saved)) setDriverId(saved);
  }, [drivers]);

  const driver = drivers.find((d) => d.id === driverId) ?? null;
  const vehicle = useMemo(
    () => vehicles.find((v) => v.current_driver_id === driverId) ?? null,
    [vehicles, driverId]
  );
  const route = useMemo(
    () =>
      routes.find((r) => r.driver_id === driverId) ??
      (vehicle ? routes.find((r) => r.vehicle_id === vehicle.id) ?? null : null),
    [routes, driverId, vehicle]
  );
  const quota = route?.quota_l ?? 180;

  async function loadHistory(did: string) {
    if (!did) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("fuelings")
      .select("id, started_at, delivered_l, quota_l, status")
      .eq("driver_id", did)
      .order("started_at", { ascending: false })
      .limit(8);
    setHist((data ?? []) as HistRow[]);
  }

  useEffect(() => {
    if (driverId) {
      localStorage.setItem(DRIVER_KEY, driverId);
      loadHistory(driverId);
    }
  }, [driverId]);

  async function onCheckin() {
    setMsg(null);
    if (!driver) {
      setMsg({ kind: "err", text: "Selecione seu nome primeiro." });
      return;
    }
    if (!vehicle) {
      setMsg({ kind: "err", text: "Você não tem veículo vinculado. Peça ao gestor para vincular." });
      return;
    }
    if (!pumpId) {
      setMsg({ kind: "err", text: "Nenhuma bomba disponível. Peça ao gestor para cadastrar." });
      return;
    }
    setBusy(true);

    const supabase = createSupabaseBrowserClient();
    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1)
      .maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setMsg({ kind: "err", text: "Conta sem empresa." });
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("fuelings").insert({
      tenant_id: tenantId,
      pump_id: pumpId,
      vehicle_id: vehicle.id,
      driver_id: driver.id,
      route_id: route?.id ?? null,
      quota_l: quota,
      delivered_l: null,
      odometer: vehicle.current_odometer ?? null,
      status: "AUTHORIZED",
      alpr_plate: vehicle.plate,
      alpr_confidence: 0.95,
    });

    if (error) {
      setMsg({ kind: "err", text: traduzSupabaseError(error.message) });
      setBusy(false);
      return;
    }

    setMsg({ kind: "ok", text: "Check-in autorizado! Pode abastecer até a cota." });
    await loadHistory(driver.id);
    setBusy(false);
  }

  // Tela de seleção (login simplificado)
  if (!driver) {
    return (
      <div className="flex min-h-screen flex-col px-5 py-8">
        <Header />
        <div className="mt-8">
          <h2 className="text-base font-semibold text-white">Quem é você?</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Selecione seu nome para acessar sua cota e fazer check-in.
          </p>
          {drivers.length === 0 ? (
            <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-center">
              <p className="text-sm text-[color:var(--color-muted)]">
                Nenhum motorista cadastrado ainda.
              </p>
              <Link href="/cadastros/motoristas/novo" className="mt-3 inline-block text-sm font-medium text-[color:var(--color-brand)]">
                Cadastrar motorista →
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDriverId(d.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-left transition-colors hover:border-[color:var(--color-brand)]/60"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-white">{d.name}</span>
                  </span>
                  <span className="text-xs text-[color:var(--color-muted)]">score {d.score}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 py-8">
      <Header />

      {/* Saudação */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Olá, motorista
          </div>
          <div className="text-lg font-semibold text-white">{driver.name}</div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(DRIVER_KEY);
            setDriverId("");
            setHist([]);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)]"
        >
          <LogOut className="h-3 w-3" /> Trocar
        </button>
      </div>

      {/* Cota */}
      <div className="mt-5 rounded-2xl bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-brand-deep)] p-5 text-black">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
          <span>Cota da viagem</span>
          <Fuel className="h-4 w-4" />
        </div>
        <div className="mt-1 text-3xl font-semibold">{formatNumber(quota)} L</div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span>{route ? `Rota ${route.code}` : "Sem rota atribuída"}</span>
          <span className="font-medium">
            {route?.origin && route?.destination ? `${route.origin} → ${route.destination}` : "—"}
          </span>
        </div>
      </div>

      {/* Veículo */}
      <div className="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          <Truck className="h-3 w-3" /> Veículo vinculado
        </div>
        {vehicle ? (
          <div className="mt-1">
            <div className="font-mono text-sm text-white">{vehicle.plate}</div>
            <div className="text-xs text-[color:var(--color-muted)]">
              {vehicle.model ?? "—"} · {fuelLabel(vehicle.fuel_type)} ·{" "}
              {formatNumber(vehicle.current_odometer ?? 0)} km
            </div>
          </div>
        ) : (
          <div className="mt-1 text-sm text-[color:var(--color-warning)]">
            Nenhum veículo vinculado a você.
          </div>
        )}
      </div>

      {/* Bomba + check-in */}
      <div className="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          <MapPin className="h-3 w-3" /> Bomba para abastecer
        </div>
        <select
          value={pumpId}
          onChange={(e) => setPumpId(e.target.value)}
          className="mt-2 w-full appearance-none rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--color-brand)]"
        >
          {pumps.length === 0 ? <option value="">Nenhuma bomba</option> : null}
          {pumps.map((p) => (
            <option key={p.id} value={p.id}>
              {p.serial_number} · {p.yards?.name ?? p.partner_station ?? "—"}
            </option>
          ))}
        </select>

        <button
          onClick={onCheckin}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          <Gauge className="h-4 w-4" />
          {busy ? "Autorizando…" : "Fazer check-in na bomba"}
        </button>

        {msg ? (
          <div
            className={
              msg.kind === "ok"
                ? "mt-3 rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-2 text-xs text-[color:var(--color-brand)]"
                : "mt-3 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-xs text-[color:var(--color-danger)]"
            }
          >
            {msg.text}
          </div>
        ) : null}
      </div>

      {/* Histórico */}
      <div className="mt-4">
        <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          <Navigation className="h-3 w-3" /> Seus abastecimentos
        </div>
        <div className="mt-2 space-y-2">
          {hist.length === 0 ? (
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-6 text-center text-xs text-[color:var(--color-muted)]">
              Nenhum abastecimento ainda. Faça seu primeiro check-in.
            </div>
          ) : (
            hist.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
              >
                <div>
                  <div className="text-sm text-white">
                    {h.status === "BLOCKED" ? "Bloqueado" : h.status === "COMPLETED" ? "Concluído" : "Autorizado"}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">{timeAgo(h.started_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-white">
                    {h.delivered_l != null ? `${formatNumber(h.delivered_l)} L` : `cota ${formatNumber(h.quota_l)} L`}
                  </div>
                  {h.status === "COMPLETED" ? (
                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-[color:var(--color-brand)]" />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <Link href="/app" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="SGO-Fuel" className="h-8 w-8 rounded-lg" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">SGO-Fuel</div>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            App do Motorista
          </div>
        </div>
      </Link>
      <Link href="/dashboard" className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Portal →
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-auto pt-8 text-center text-[10px] text-[color:var(--color-muted)]">
      SGO-Fuel · demonstração — instale na tela inicial pelo menu do navegador
    </div>
  );
}

function fuelLabel(t: string) {
  return (
    {
      DIESEL_S10: "Diesel S10",
      DIESEL_S500: "Diesel S500",
      ARLA32: "Arla 32",
      GASOLINE: "Gasolina",
      ETHANOL: "Etanol",
    } as Record<string, string>
  )[t] ?? t;
}

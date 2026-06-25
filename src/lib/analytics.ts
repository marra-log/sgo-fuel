import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DailyPoint = { dia: string; litros: number; eventos: number; bloqueios: number };
export type StatusSlice = { name: string; value: number };
export type DriverBar = { nome: string; litros: number };

export type AnalyticsData = {
  daily: DailyPoint[];
  statusDist: StatusSlice[];
  topDrivers: DriverBar[];
  totalLitros: number;
  totalEventos: number;
  totalBloqueios: number;
  anomaliasAbertas: number;
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Concluído",
  AUTHORIZED: "Autorizado",
  IN_PROGRESS: "Em andamento",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
};

/**
 * Agrega os dados dos últimos `days` dias para alimentar os gráficos.
 * Tudo isolado por tenant via RLS (usa a sessão do usuário logado).
 */
export async function loadAnalytics(days = 14): Promise<AnalyticsData> {
  const supabase = await createSupabaseServerClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const { data: fuelings } = await supabase
    .from("fuelings")
    .select("started_at, status, delivered_l, driver_id, drivers(name)")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: true });

  const rows = (fuelings ?? []) as unknown as Array<{
    started_at: string;
    status: string;
    delivered_l: number | null;
    driver_id: string | null;
    drivers: { name: string } | null;
  }>;

  // Série diária
  const dayMap = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, {
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      litros: 0,
      eventos: 0,
      bloqueios: 0,
    });
  }
  for (const r of rows) {
    const key = new Date(r.started_at).toISOString().slice(0, 10);
    const p = dayMap.get(key);
    if (!p) continue;
    p.eventos += 1;
    if (r.status === "BLOCKED") p.bloqueios += 1;
    else p.litros += Number(r.delivered_l ?? 0);
  }
  const daily = Array.from(dayMap.values());

  // Distribuição por status
  const statusMap = new Map<string, number>();
  for (const r of rows) {
    const label = STATUS_LABEL[r.status] ?? r.status;
    statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
  }
  const statusDist = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

  // Top motoristas por litros
  const driverMap = new Map<string, { nome: string; litros: number }>();
  for (const r of rows) {
    if (!r.driver_id || r.status === "BLOCKED") continue;
    const prev = driverMap.get(r.driver_id) ?? { nome: r.drivers?.name ?? "—", litros: 0 };
    prev.litros += Number(r.delivered_l ?? 0);
    driverMap.set(r.driver_id, prev);
  }
  const topDrivers = Array.from(driverMap.values())
    .sort((a, b) => b.litros - a.litros)
    .slice(0, 5)
    .map((d) => ({ nome: d.nome.split(" ")[0], litros: Math.round(d.litros) }));

  const totalLitros = Math.round(daily.reduce((a, p) => a + p.litros, 0));
  const totalEventos = daily.reduce((a, p) => a + p.eventos, 0);
  const totalBloqueios = daily.reduce((a, p) => a + p.bloqueios, 0);

  const { count: anomaliasAbertas } = await supabase
    .from("anomalies")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  // Se o tenant ainda não tem eventos, mostra dados de DEMONSTRAÇÃO (fictícios)
  // para a apresentação não ficar com gráficos vazios.
  if (totalEventos === 0) {
    return demoAnalytics(days);
  }

  return {
    daily,
    statusDist,
    topDrivers,
    totalLitros,
    totalEventos,
    totalBloqueios,
    anomaliasAbertas: anomaliasAbertas ?? 0,
  };
}

function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dados FICTÍCIOS determinísticos — usados quando o tenant está vazio.
export function demoAnalytics(days = 14): AnalyticsData {
  const r = seeded(2026);
  const today = new Date();
  const daily: DailyPoint[] = [];
  let totalLitros = 0;
  let totalEventos = 0;
  let totalBloqueios = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const eventos = 8 + Math.floor(r() * 14);
    const bloqueios = Math.floor(r() * 3);
    const litros = Math.round((eventos - bloqueios) * (140 + r() * 90));
    daily.push({
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      litros,
      eventos,
      bloqueios,
    });
    totalLitros += litros;
    totalEventos += eventos;
    totalBloqueios += bloqueios;
  }
  const statusDist: StatusSlice[] = [
    { name: "Concluído", value: totalEventos - totalBloqueios - 6 },
    { name: "Autorizado", value: 6 },
    { name: "Bloqueado", value: totalBloqueios },
  ];
  const nomes = ["João Pereira", "Carlos Santos", "Marcos Oliveira", "Paulo Ribeiro", "Antônio Costa"];
  const topDrivers: DriverBar[] = nomes.map((nome, i) => ({
    nome: nome.split(" ")[0],
    litros: Math.round((2200 - i * 280) + r() * 200),
  }));
  return {
    daily,
    statusDist,
    topDrivers,
    totalLitros,
    totalEventos,
    totalBloqueios,
    anomaliasAbertas: totalBloqueios,
  };
}

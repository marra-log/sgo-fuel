// ============================================================
// Dados FICTÍCIOS de uma rede de postos (varejo).
// Determinístico: mesma entrada → mesma saída (sem Math.random em runtime),
// pra não dar hydration mismatch e ser estável entre server e client.
// ============================================================

export type FuelType = "GASOLINA" | "ETANOL" | "DIESEL_S10" | "DIESEL_S500" | "GNV";

export const FUEL_LABEL: Record<FuelType, string> = {
  GASOLINA: "Gasolina",
  ETANOL: "Etanol",
  DIESEL_S10: "Diesel S10",
  DIESEL_S500: "Diesel S500",
  GNV: "GNV",
};

// Preço médio de venda ao consumidor (R$/L) — fictício.
export const PRECO: Record<FuelType, number> = {
  GASOLINA: 5.89,
  ETANOL: 4.29,
  DIESEL_S10: 6.12,
  DIESEL_S500: 5.98,
  GNV: 4.49,
};

export type PostoStatus = "ATIVO" | "ATENCAO" | "INATIVO";

export type SeriePonto = { mes: string; faturamento: number; litros: number };
export type MixPonto = { tipo: FuelType; litros: number };

export type Posto = {
  id: string;
  nome: string;
  bandeira: string;
  cidade: string;
  uf: string;
  status: PostoStatus;
  gerente: string;
  bombas: number;
  abastecimentosMes: number;
  litrosMes: number;
  faturamentoMes: number;
  ticketMedio: number;
  margemPct: number;
  serie: SeriePonto[];
  mix: MixPonto[];
};

// PRNG determinístico (mulberry32)
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MESES = ["Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

type Seed = {
  nome: string;
  bandeira: string;
  cidade: string;
  uf: string;
  status: PostoStatus;
  gerente: string;
  bombas: number;
  base: number; // litros/mês base
  mixPct: Partial<Record<FuelType, number>>;
};

const SEEDS: Seed[] = [
  { nome: "Posto Trevão BR-381", bandeira: "Ipiranga", cidade: "Betim", uf: "MG", status: "ATIVO", gerente: "Carlos Menezes", bombas: 12, base: 320000, mixPct: { DIESEL_S10: 0.46, GASOLINA: 0.3, ETANOL: 0.14, DIESEL_S500: 0.1 } },
  { nome: "Auto Posto Central", bandeira: "Shell", cidade: "Contagem", uf: "MG", status: "ATIVO", gerente: "Patrícia Veloso", bombas: 8, base: 210000, mixPct: { GASOLINA: 0.44, ETANOL: 0.26, DIESEL_S10: 0.22, GNV: 0.08 } },
  { nome: "Posto Rodovia Sul", bandeira: "Vibra (BR)", cidade: "Juiz de Fora", uf: "MG", status: "ATIVO", gerente: "Anderson Pádua", bombas: 14, base: 380000, mixPct: { DIESEL_S10: 0.5, DIESEL_S500: 0.16, GASOLINA: 0.24, ETANOL: 0.1 } },
  { nome: "Posto Cidade Nova", bandeira: "Ipiranga", cidade: "Belo Horizonte", uf: "MG", status: "ATENCAO", gerente: "Júlia Andrade", bombas: 6, base: 150000, mixPct: { GASOLINA: 0.5, ETANOL: 0.3, DIESEL_S10: 0.2 } },
  { nome: "Posto Expresso 040", bandeira: "Petrobras", cidade: "Sete Lagoas", uf: "MG", status: "ATIVO", gerente: "Marcos Tavares", bombas: 10, base: 265000, mixPct: { DIESEL_S10: 0.4, GASOLINA: 0.34, ETANOL: 0.16, DIESEL_S500: 0.1 } },
  { nome: "Posto Vale Verde", bandeira: "Branca", cidade: "Uberlândia", uf: "MG", status: "ATIVO", gerente: "Renata Lopes", bombas: 9, base: 198000, mixPct: { GASOLINA: 0.4, ETANOL: 0.32, DIESEL_S10: 0.2, GNV: 0.08 } },
  { nome: "Posto Caminhão MG", bandeira: "Shell", cidade: "Pouso Alegre", uf: "MG", status: "ATIVO", gerente: "Eduardo Maia", bombas: 16, base: 420000, mixPct: { DIESEL_S10: 0.54, DIESEL_S500: 0.18, GASOLINA: 0.2, ETANOL: 0.08 } },
  { nome: "Posto Litoral Norte", bandeira: "Ipiranga", cidade: "Guarulhos", uf: "SP", status: "ATENCAO", gerente: "Beatriz Nunes", bombas: 11, base: 290000, mixPct: { GASOLINA: 0.46, ETANOL: 0.24, DIESEL_S10: 0.22, GNV: 0.08 } },
  { nome: "Posto Bandeirantes", bandeira: "Vibra (BR)", cidade: "Campinas", uf: "SP", status: "ATIVO", gerente: "Felipe Rocha", bombas: 13, base: 345000, mixPct: { DIESEL_S10: 0.42, GASOLINA: 0.32, ETANOL: 0.18, DIESEL_S500: 0.08 } },
  { nome: "Posto Serra Azul", bandeira: "Petrobras", cidade: "Goiânia", uf: "GO", status: "INATIVO", gerente: "Tânia Borges", bombas: 7, base: 0, mixPct: { GASOLINA: 0.5, ETANOL: 0.3, DIESEL_S10: 0.2 } },
];

function buildPosto(seed: Seed, i: number): Posto {
  const rand = rng(1000 + i * 97);
  const id = String(i + 1).padStart(2, "0");

  // Série de 12 meses com leve sazonalidade + ruído determinístico
  const serie: SeriePonto[] = MESES.map((mes, m) => {
    const sazonal = 1 + 0.12 * Math.sin((m / 12) * Math.PI * 2);
    const ruido = 0.92 + rand() * 0.16;
    const litros = Math.round(seed.base * sazonal * ruido);
    // faturamento = litros distribuídos pelo mix × preço
    let fat = 0;
    for (const [tipo, pct] of Object.entries(seed.mixPct) as [FuelType, number][]) {
      fat += litros * pct * PRECO[tipo];
    }
    return { mes, litros, faturamento: Math.round(fat) };
  });

  const ultimo = serie[serie.length - 1];
  const litrosMes = ultimo.litros;
  const faturamentoMes = ultimo.faturamento;
  const abastecimentosMes = Math.max(0, Math.round(litrosMes / (55 + rand() * 25)));
  const ticketMedio = abastecimentosMes > 0 ? faturamentoMes / abastecimentosMes : 0;
  const margemPct = Math.round((7 + rand() * 6) * 10) / 10;

  const mix: MixPonto[] = (Object.entries(seed.mixPct) as [FuelType, number][]).map(([tipo, pct]) => ({
    tipo,
    litros: Math.round(litrosMes * pct),
  }));

  return {
    id,
    nome: seed.nome,
    bandeira: seed.bandeira,
    cidade: seed.cidade,
    uf: seed.uf,
    status: seed.status,
    gerente: seed.gerente,
    bombas: seed.bombas,
    abastecimentosMes,
    litrosMes,
    faturamentoMes,
    ticketMedio,
    margemPct,
    serie,
    mix,
  };
}

export const POSTOS: Posto[] = SEEDS.map(buildPosto);

export function getPosto(id: string): Posto | undefined {
  return POSTOS.find((p) => p.id === id);
}

// ===== Agregações da rede =====

export function redeKpis() {
  const ativos = POSTOS.filter((p) => p.status !== "INATIVO");
  const faturamentoMes = ativos.reduce((a, p) => a + p.faturamentoMes, 0);
  const litrosMes = ativos.reduce((a, p) => a + p.litrosMes, 0);
  const abastecimentos = ativos.reduce((a, p) => a + p.abastecimentosMes, 0);
  const ticketMedio = abastecimentos > 0 ? faturamentoMes / abastecimentos : 0;
  const margemMedia =
    ativos.length > 0 ? ativos.reduce((a, p) => a + p.margemPct, 0) / ativos.length : 0;
  return {
    totalPostos: POSTOS.length,
    postosAtivos: ativos.length,
    faturamentoMes,
    litrosMes,
    abastecimentos,
    ticketMedio,
    margemMedia: Math.round(margemMedia * 10) / 10,
  };
}

// Série consolidada da rede (soma de todos os postos por mês)
export function redeSerie(): SeriePonto[] {
  return MESES.map((mes, m) => {
    let faturamento = 0;
    let litros = 0;
    for (const p of POSTOS) {
      faturamento += p.serie[m].faturamento;
      litros += p.serie[m].litros;
    }
    return { mes, faturamento, litros };
  });
}

// Mix consolidado da rede
export function redeMix(): MixPonto[] {
  const map = new Map<FuelType, number>();
  for (const p of POSTOS) {
    for (const m of p.mix) {
      map.set(m.tipo, (map.get(m.tipo) ?? 0) + m.litros);
    }
  }
  return Array.from(map.entries()).map(([tipo, litros]) => ({ tipo, litros }));
}

// Top postos por faturamento
export function topPostos(n = 6) {
  return [...POSTOS]
    .filter((p) => p.status !== "INATIVO")
    .sort((a, b) => b.faturamentoMes - a.faturamentoMes)
    .slice(0, n);
}

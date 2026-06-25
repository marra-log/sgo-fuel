// ============================================================
// Dados 100% FICTÍCIOS da plataforma de Cartão Frota.
// Empresa, placas e motoristas são INVENTADOS — sem vínculo com
// nenhum cliente real. Determinístico (sem Math.random em render).
// ============================================================

export const EMPRESA = {
  nome: "TRANSCARGO LOGÍSTICA E TRANSPORTES LTDA",
  curto: "TransCargo Logística",
  cnpj: "11.222.333/0001-44",
  creditadoMes: 420000.0,
  consumidoReais: 118420.5,
  consumidoLitros: 16380.4,
  saldo: 1485200.0,
};

// Nomes e placas fictícios (não associados a ninguém)
const NOMES = [
  "João Pereira", "Carlos Santos", "Marcos Oliveira", "Paulo Ribeiro",
  "Antônio Costa", "Rafael Lima", "Bruno Alves", "Felipe Souza",
  "Lucas Martins", "Gabriel Rocha", "Daniel Ferreira", "Rodrigo Dias",
];
const PLACAS = [
  "RDA-1A01", "RDB-2B02", "RDC-3C03", "RDD-4D04", "RDE-5E05", "RDF-6F06",
  "RDG-7G07", "RDH-8H08", "RDI-9I09", "RDJ-1J10", "RDK-2K11", "RDL-3L12",
];
const MODELOS = [
  "Volvo VM 330 4x2 (Diesel)", "Scania P-360 6x2 (Diesel)", "Mercedes Axor 2544 6x2",
  "Volvo FH 540 6x4", "Iveco Tector 240E28", "Mercedes Atego 2426",
  "Scania R450 6x4", "DAF XF 480 6x2", "Volkswagen Constellation 24.280",
  "Ford Cargo 2429", "MAN TGX 29.480", "Volvo FM 370 6x2",
];
const DEPTOS = ["Frota Pesada", "Frota Leve", "Distribuição", "Coletas"];
const CENTROS = ["Matriz BH", "Filial SP", "Filial GO", "Rota Sul"];

export type Departamento = { nome: string; consumoReais: number; veiculos: number };
export const DEPARTAMENTOS: Departamento[] = [
  { nome: "Frota Pesada", consumoReais: 67800, veiculos: 28 },
  { nome: "Distribuição", consumoReais: 31480, veiculos: 14 },
  { nome: "Coletas", consumoReais: 12420, veiculos: 9 },
  { nome: "Frota Leve", consumoReais: 6720.5, veiculos: 6 },
];

const MESES = ["Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26"];
const HIST_BASE = [55200, 69100, 64900, 70800, 72100, 56300, 71200, 71900, 45600, 64900, 103100, 118420];
export const HISTORICO = MESES.map((mes, i) => ({ mes, consumo: HIST_BASE[i] }));

function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TransacaoInvalida = {
  tipo: string;
  data: string;
  veiculo: string;
  placa: string;
  motorista: string;
  status: "Utilizado" | "Expirado para Justificação" | "Pendente";
};

export const TRANSACOES_INVALIDAS: TransacaoInvalida[] = [
  { tipo: "Quilometragem do veículo não confere (atual ≤ anterior)", data: "24/06/2026 13:39", veiculo: "Mercedes Atego 2426 (2020)", placa: "RDA-1A01", motorista: "João Pereira", status: "Utilizado" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "23/06/2026 10:52", veiculo: "Volvo VM 330 4x2 (2021)", placa: "RDB-2B02", motorista: "Carlos Santos", status: "Utilizado" },
  { tipo: "Volume de combustível solicitado maior que a capacidade do tanque", data: "20/06/2026 10:55", veiculo: "Volvo VM 330 4x2 (2020)", placa: "RDC-3C03", motorista: "Marcos Oliveira", status: "Utilizado" },
  { tipo: "Volume de combustível solicitado maior que a capacidade do tanque", data: "20/06/2026 10:49", veiculo: "Volvo VM 330 4x2 (2020)", placa: "RDC-3C03", motorista: "Marcos Oliveira", status: "Expirado para Justificação" },
  { tipo: "Quilometragem do veículo não confere (atual ≤ anterior)", data: "19/06/2026 08:24", veiculo: "Scania P-360 6x2 (2014)", placa: "RDD-4D04", motorista: "Paulo Ribeiro", status: "Expirado para Justificação" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "17/06/2026 18:20", veiculo: "Volvo VM 330 4x2 (2015)", placa: "RDE-5E05", motorista: "Antônio Costa", status: "Utilizado" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "15/06/2026 09:48", veiculo: "Mercedes Axor 2544 (2020)", placa: "RDF-6F06", motorista: "Rafael Lima", status: "Expirado para Justificação" },
];

export type PrecoPosto = {
  posto: string;
  cidade: string;
  tipo: "Desconto" | "Bomba";
  gasolina: number;
  gasolinaAditivada: number;
  etanol: number;
  dieselComum: number;
  dieselS10: number;
};

export const PRECOS_POSTOS: PrecoPosto[] = [
  { posto: "Posto Estrela", cidade: "Betim/MG", tipo: "Desconto", gasolina: 6.94, gasolinaAditivada: 7.04, etanol: 4.94, dieselComum: 7.24, dieselS10: 7.24 },
  { posto: "Posto Horizonte", cidade: "Contagem/MG", tipo: "Desconto", gasolina: 6.94, gasolinaAditivada: 7.04, etanol: 4.94, dieselComum: 6.94, dieselS10: 6.94 },
  { posto: "Posto Anel Leste", cidade: "Belo Horizonte/MG", tipo: "Bomba", gasolina: 6.99, gasolinaAditivada: 7.09, etanol: 4.99, dieselComum: 7.29, dieselS10: 7.29 },
  { posto: "Posto Parada Certa", cidade: "Sete Lagoas/MG", tipo: "Bomba", gasolina: 6.99, gasolinaAditivada: 7.09, etanol: 4.99, dieselComum: 6.99, dieselS10: 6.99 },
  { posto: "Auto Posto Turismo", cidade: "Uberlândia/MG", tipo: "Desconto", gasolina: 6.89, gasolinaAditivada: 6.99, etanol: 4.89, dieselComum: 6.98, dieselS10: 7.02 },
  { posto: "Posto Boa Viagem", cidade: "Pouso Alegre/MG", tipo: "Desconto", gasolina: 6.92, gasolinaAditivada: 7.02, etanol: 4.92, dieselComum: 6.96, dieselS10: 6.99 },
];

export type Transacao = {
  data: string;
  posto: string;
  motorista: string;
  placa: string;
  combustivel: string;
  litros: number;
  valor: number;
};

const COMB = ["Diesel S10", "Diesel Comum", "Gasolina", "Etanol", "Arla 32"];

export function transacoesRecentes(n = 30): Transacao[] {
  const r = rng(42);
  const out: Transacao[] = [];
  for (let i = 0; i < n; i++) {
    const litros = Math.round((60 + r() * 240) * 10) / 10;
    const preco = 6.8 + r() * 0.6;
    const dia = String(24 - Math.floor(i / 2)).padStart(2, "0");
    const hora = String(6 + Math.floor(r() * 16)).padStart(2, "0");
    const min = String(Math.floor(r() * 60)).padStart(2, "0");
    out.push({
      data: `${dia}/06/2026 ${hora}:${min}`,
      posto: PRECOS_POSTOS[Math.floor(r() * PRECOS_POSTOS.length)].posto,
      motorista: NOMES[Math.floor(r() * NOMES.length)],
      placa: PLACAS[Math.floor(r() * PLACAS.length)],
      combustivel: COMB[Math.floor(r() * COMB.length)],
      litros,
      valor: Math.round(litros * preco * 100) / 100,
    });
  }
  return out;
}

export type CartaoFrota = {
  numero: string;
  motorista: string;
  placa: string;
  limite: number;
  consumido: number;
  status: "Ativo" | "Bloqueado";
};

export function cartoesFrota(): CartaoFrota[] {
  const r = rng(7);
  return NOMES.map((nome, i) => {
    const limite = [3000, 4000, 5000, 6000][Math.floor(r() * 4)];
    const consumido = Math.round(limite * (0.3 + r() * 0.6));
    return {
      numero: `7000 •••• •••• ${String(1000 + i * 137).slice(-4)}`,
      motorista: nome,
      placa: PLACAS[i % PLACAS.length],
      limite,
      consumido,
      status: i === 6 ? "Bloqueado" : "Ativo",
    };
  });
}

// ===== Relatórios estilo Flagcard =====

export type DebitoRow = {
  placa: string;
  motorista: string;
  km: number;
  consumoMedio: number;
  estabelecimento: string;
  data: string;
  quantidade: number;
  valor: number;
  desconto: number;
  total: number;
};

export function relatorioDebitos(n = 24): DebitoRow[] {
  const r = rng(11);
  const out: DebitoRow[] = [];
  for (let i = 0; i < n; i++) {
    const litros = Math.round((70 + r() * 600) * 100) / 100;
    const preco = 6.9 + r() * 0.5;
    const valor = Math.round(litros * preco * 100) / 100;
    const desconto = Math.round(valor * (0.005 + r() * 0.01) * 100) / 100;
    const dia = String(24 - Math.floor(i / 3)).padStart(2, "0");
    const hora = String(6 + Math.floor(r() * 16)).padStart(2, "0");
    const min = String(Math.floor(r() * 60)).padStart(2, "0");
    out.push({
      placa: PLACAS[i % PLACAS.length],
      motorista: NOMES[i % NOMES.length],
      km: 100000 + Math.floor(r() * 400000),
      consumoMedio: Math.round((1.8 + r() * 1.6) * 100) / 100,
      estabelecimento: PRECOS_POSTOS[Math.floor(r() * PRECOS_POSTOS.length)].posto,
      data: `${dia}/06/2026 ${hora}:${min}`,
      quantidade: litros,
      valor,
      desconto,
      total: Math.round((valor - desconto) * 100) / 100,
    });
  }
  return out;
}

export type CreditoRow = { usuario: string; data: string; valor: number };
export function relatorioCreditos(): CreditoRow[] {
  return [
    { usuario: "RDD-4D04", data: "23/06/2026 19:30", valor: 300000.0 },
    { usuario: "RDC-3C03", data: "20/06/2026 10:15", valor: 30000.0 },
    { usuario: "Coringa Reboques 02", data: "17/06/2026 13:39", valor: 5000.0 },
    { usuario: "RDE-5E05", data: "02/06/2026 11:15", valor: 10000.0 },
    { usuario: "RDF-6F06", data: "02/06/2026 11:13", valor: 10000.0 },
    { usuario: "RDC-3C03", data: "02/06/2026 11:13", valor: 20000.0 },
    { usuario: "RDA-1A01", data: "01/06/2026 00:00", valor: 498.78 },
    { usuario: "RDB-2B02", data: "01/06/2026 00:00", valor: 1534.69 },
  ];
}

export type NovoCartaoRow = { usuario: string; cartao: string; data: string; hora: string };
export function novosCartoes(): NovoCartaoRow[] {
  const r = rng(99);
  return PLACAS.slice(0, 10).map((p, i) => {
    const num = `2590${String(Math.floor(r() * 1e12)).padStart(12, "0")}`;
    const dia = String(1 + Math.floor(r() * 27)).padStart(2, "0");
    const mes = String(1 + Math.floor(r() * 12)).padStart(2, "0");
    const ano = 2025 + Math.floor(r() * 2);
    const h = String(Math.floor(r() * 24)).padStart(2, "0");
    const m = String(Math.floor(r() * 60)).padStart(2, "0");
    return { usuario: p, cartao: num, data: `${dia}/${mes}/${ano}`, hora: `${h}:${m}` };
  });
}

export type SaldoRow = {
  usuario: string;
  departamento: string;
  funcao: string;
  centroCusto: string;
  saldoAtual: number;
  ultimaAtualizacao: string;
};
export function saldosUsuarios(): SaldoRow[] {
  const r = rng(5);
  return PLACAS.map((p, i) => ({
    usuario: p,
    departamento: DEPTOS[i % DEPTOS.length],
    funcao: "Motorista",
    centroCusto: CENTROS[i % CENTROS.length],
    saldoAtual: Math.round(r() * 350000 * 100) / 100,
    ultimaAtualizacao: `${String(1 + Math.floor(r() * 24)).padStart(2, "0")}/06/2026`,
  }));
}

export type RankingVeiculo = {
  placa: string;
  modelo: string;
  consumoMin: number;
  consumoMax: number;
  consumoRealizado: number;
  odometro: number;
  departamento: string;
  centroCusto: string;
  status: "Ativo" | "Inativo";
};
export function rankingVeiculos(): RankingVeiculo[] {
  const r = rng(3);
  return PLACAS.map((p, i) => {
    const min = Math.round((1.2 + r() * 1.0) * 10) / 10;
    const max = Math.round((min + 0.8 + r() * 1.4) * 10) / 10;
    const real = Math.round((min + r() * (max - min)) * 100) / 100;
    return {
      placa: p,
      modelo: MODELOS[i % MODELOS.length],
      consumoMin: min,
      consumoMax: max,
      consumoRealizado: real,
      odometro: 100000 + Math.floor(r() * 400000),
      departamento: DEPTOS[i % DEPTOS.length],
      centroCusto: CENTROS[i % CENTROS.length],
      status: "Ativo",
    };
  });
}

export const MOTORISTA = {
  nome: "João Pereira",
  cartao: "7000 1234 5678 9010",
  placa: "RDA-1A01",
  veiculo: "Scania R450 6x4 (2021)",
  limiteMensal: 6000,
  consumidoMes: 4180.5,
  saldoDisponivel: 1819.5,
  ultimos: [
    { data: "24/06 08:12", posto: "Posto Boa Viagem", litros: 178.4, valor: 1217.4, combustivel: "Diesel S10" },
    { data: "21/06 17:40", posto: "Posto Horizonte", litros: 150.0, valor: 1041.0, combustivel: "Diesel S10" },
    { data: "18/06 09:05", posto: "Posto Estrela", litros: 162.5, valor: 1176.5, combustivel: "Diesel S10" },
    { data: "14/06 14:22", posto: "Auto Posto Turismo", litros: 140.0, valor: 983.6, combustivel: "Diesel S10" },
  ],
};

export const POSTO_KPIS = {
  faturamentoMes: 1284500.0,
  litrosMes: 187300,
  transacoes: 4120,
  ticketMedio: 311.77,
  cartoesAtivos: 312,
  postosRede: PRECOS_POSTOS.length,
};

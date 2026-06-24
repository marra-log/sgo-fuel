// ============================================================
// Dados FICTÍCIOS da plataforma de Cartão Frota (estilo Flagcard).
// Determinístico — sem Math.random em runtime de render.
// Alimenta os painéis /frota/cliente, /frota/motorista, /frota/posto.
// ============================================================

export const EMPRESA = {
  nome: "MARRALOG TRANSPORTES RODOVIÁRIOS DE CARGAS LTDA",
  curto: "Marralog Transportes",
  cnpj: "12.345.678/0001-90",
  creditadoMes: 413852.0,
  consumidoReais: 117405.97,
  consumidoLitros: 16235.2,
  saldo: 1469117.1,
};

export type Departamento = { nome: string; consumoReais: number; veiculos: number };
export const DEPARTAMENTOS: Departamento[] = [
  { nome: "TEGMA", consumoReais: 66240, veiculos: 28 },
  { nome: "SADA", consumoReais: 31980, veiculos: 14 },
  { nome: "Distribuição BH", consumoReais: 12450, veiculos: 9 },
  { nome: "Logística SP", consumoReais: 6735.97, veiculos: 6 },
];

// Histórico 12 meses (R$)
const MESES = ["Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26"];
const HIST_BASE = [54200, 68900, 65100, 70300, 71800, 55400, 70200, 71300, 44900, 64100, 102300, 117406];
export const HISTORICO = MESES.map((mes, i) => ({ mes, consumo: HIST_BASE[i] }));

export type TransacaoInvalida = {
  tipo: string;
  data: string;
  veiculo: string;
  placa: string;
  motorista: string;
  status: "Utilizado" | "Expirado para Justificação" | "Pendente";
};

export const TRANSACOES_INVALIDAS: TransacaoInvalida[] = [
  { tipo: "Quilometragem do veículo não confere (atual ≤ anterior)", data: "24/06/2026 13:39", veiculo: "M.Benz 915/C (2020)", placa: "QZM-5H47", motorista: "Ewerton Bastos Ribeiro", status: "Utilizado" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "23/06/2026 10:52", veiculo: "VM 330 4x2 Diesel (2021)", placa: "QZQ-3E27", motorista: "Ewerton Bastos Ribeiro", status: "Utilizado" },
  { tipo: "Volume de combustível solicitado maior que a capacidade do tanque", data: "20/06/2026 10:55", veiculo: "VM 330 4x2 Diesel (2020)", placa: "LUM-5D14", motorista: "Josué Andrade", status: "Utilizado" },
  { tipo: "Volume de combustível solicitado maior que a capacidade do tanque", data: "20/06/2026 10:49", veiculo: "VM 330 4x2 Diesel (2020)", placa: "LUM-5D14", motorista: "Josué Andrade", status: "Expirado para Justificação" },
  { tipo: "Quilometragem do veículo não confere (atual ≤ anterior)", data: "19/06/2026 08:24", veiculo: "P-360 A 6x2 Scania (2014)", placa: "NON-5361", motorista: "Joziel Gomes da Costa", status: "Expirado para Justificação" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "17/06/2026 18:20", veiculo: "VM 330 4x2 Diesel (2015)", placa: "OXM-0823", motorista: "Antônio Bezerra Nery", status: "Utilizado" },
  { tipo: "Consumo médio do veículo diferente do esperado", data: "15/06/2026 09:48", veiculo: "Axor 2544 6x2 (2020)", placa: "QZM-5I37", motorista: "Mateus Freire Cavalcante", status: "Expirado para Justificação" },
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
  { posto: "Posto Oitis", cidade: "Betim/MG", tipo: "Desconto", gasolina: 6.94, gasolinaAditivada: 7.04, etanol: 4.94, dieselComum: 7.24, dieselS10: 7.24 },
  { posto: "Posto V8", cidade: "Contagem/MG", tipo: "Desconto", gasolina: 6.94, gasolinaAditivada: 7.04, etanol: 4.94, dieselComum: 6.94, dieselS10: 6.94 },
  { posto: "Posto Anel Leste", cidade: "Belo Horizonte/MG", tipo: "Bomba", gasolina: 6.99, gasolinaAditivada: 7.09, etanol: 4.99, dieselComum: 7.29, dieselS10: 7.29 },
  { posto: "Posto Parada Certa", cidade: "Sete Lagoas/MG", tipo: "Bomba", gasolina: 6.99, gasolinaAditivada: 7.09, etanol: 4.99, dieselComum: 6.99, dieselS10: 6.99 },
  { posto: "Auto Posto Turismo", cidade: "Uberlândia/MG", tipo: "Desconto", gasolina: 6.89, gasolinaAditivada: 6.99, etanol: 4.89, dieselComum: 6.98, dieselS10: 7.02 },
  { posto: "Posto Trevão BR-381", cidade: "Pouso Alegre/MG", tipo: "Desconto", gasolina: 6.92, gasolinaAditivada: 7.02, etanol: 4.92, dieselComum: 6.96, dieselS10: 6.99 },
];

// Transações recentes (válidas) — abastecimentos
export type Transacao = {
  data: string;
  posto: string;
  motorista: string;
  placa: string;
  combustivel: string;
  litros: number;
  valor: number;
};

const NOMES = ["Reinaldo Souza", "Antônio Lima", "Josué Andrade", "Ewerton Bastos", "Mateus Freire", "Joziel Gomes", "Cleber Marques", "Marina Tavares"];
const PLACAS = ["QZM-5H47", "QZQ-3E27", "LUM-5D14", "NON-5361", "OXM-0823", "QZM-5I37", "BRA-2E19", "BRA-7K22"];
const COMB = ["Diesel S10", "Diesel Comum", "Gasolina", "Etanol", "Arla 32"];

function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

// Cartões da frota
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

// Dados do motorista (painel do motorista)
export const MOTORISTA = {
  nome: "Reinaldo Souza",
  cartao: "7000 1234 5678 9010",
  placa: "BRA-2E19",
  veiculo: "Scania R450 (2021)",
  limiteMensal: 6000,
  consumidoMes: 4180.5,
  saldoDisponivel: 1819.5,
  ultimos: [
    { data: "24/06 08:12", posto: "Posto Trevão BR-381", litros: 178.4, valor: 1217.4, combustivel: "Diesel S10" },
    { data: "21/06 17:40", posto: "Posto V8", litros: 150.0, valor: 1041.0, combustivel: "Diesel S10" },
    { data: "18/06 09:05", posto: "Posto Oitis", litros: 162.5, valor: 1176.5, combustivel: "Diesel S10" },
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

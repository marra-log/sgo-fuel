// ============================================================
// Dados FICTÍCIOS de multas/infrações e vistorias (check-list).
// Genéricos (TransCargo) — sem vínculo com ninguém real.
// ============================================================

export type MultaStatus = "PENDENTE" | "PAGA" | "RECURSO" | "VENCIDA";

export type Multa = {
  id: string;
  placa: string;
  motorista: string;
  infracao: string;
  orgao: string;
  local: string;
  data: string;
  vencimento: string;
  pontos: number;
  valor: number;
  gravidade: "Leve" | "Média" | "Grave" | "Gravíssima";
  status: MultaStatus;
};

const PLACAS = ["RDA-1A01", "RDB-2B02", "RDC-3C03", "RDD-4D04", "RDE-5E05", "RDF-6F06", "RDG-7G07", "RDH-8H08"];
const NOMES = ["João Pereira", "Carlos Santos", "Marcos Oliveira", "Paulo Ribeiro", "Antônio Costa", "Rafael Lima", "Bruno Alves", "Felipe Souza"];

export const MULTAS: Multa[] = [
  { id: "MF-2041", placa: "RDA-1A01", motorista: "João Pereira", infracao: "Excesso de velocidade até 20%", orgao: "DER-MG", local: "BR-381 km 412", data: "22/06/2026", vencimento: "22/07/2026", pontos: 4, valor: 130.16, gravidade: "Média", status: "PENDENTE" },
  { id: "MF-2039", placa: "RDC-3C03", motorista: "Marcos Oliveira", infracao: "Avançar sinal vermelho", orgao: "PRF", local: "BR-040 km 528", data: "20/06/2026", vencimento: "20/07/2026", pontos: 7, valor: 293.47, gravidade: "Gravíssima", status: "PENDENTE" },
  { id: "MF-2035", placa: "RDB-2B02", motorista: "Carlos Santos", infracao: "Estacionar em local proibido", orgao: "BHTRANS", local: "Av. Cristiano Machado", data: "18/06/2026", vencimento: "30/06/2026", pontos: 4, valor: 195.23, gravidade: "Média", status: "VENCIDA" },
  { id: "MF-2030", placa: "RDD-4D04", motorista: "Paulo Ribeiro", infracao: "Excesso de peso por eixo", orgao: "DNIT", local: "BR-262 km 91", data: "15/06/2026", vencimento: "15/07/2026", pontos: 5, valor: 1278.5, gravidade: "Grave", status: "RECURSO" },
  { id: "MF-2026", placa: "RDE-5E05", motorista: "Antônio Costa", infracao: "Dirigir usando celular", orgao: "PRF", local: "BR-381 km 388", data: "12/06/2026", vencimento: "12/07/2026", pontos: 7, valor: 293.47, gravidade: "Gravíssima", status: "PENDENTE" },
  { id: "MF-2019", placa: "RDF-6F06", motorista: "Rafael Lima", infracao: "Não usar cinto de segurança", orgao: "DER-MG", local: "MG-050 km 12", data: "08/06/2026", vencimento: "08/07/2026", pontos: 5, valor: 195.23, gravidade: "Grave", status: "PAGA" },
  { id: "MF-2011", placa: "RDA-1A01", motorista: "João Pereira", infracao: "Excesso de velocidade 20-50%", orgao: "PRF", local: "BR-040 km 610", data: "03/06/2026", vencimento: "03/07/2026", pontos: 5, valor: 195.23, gravidade: "Grave", status: "PAGA" },
  { id: "MF-2004", placa: "RDG-7G07", motorista: "Bruno Alves", infracao: "Transitar em faixa exclusiva", orgao: "BHTRANS", local: "Av. Antônio Carlos", data: "01/06/2026", vencimento: "01/07/2026", pontos: 4, valor: 130.16, gravidade: "Média", status: "PENDENTE" },
];

export function multasKpis() {
  const pendentes = MULTAS.filter((m) => m.status === "PENDENTE");
  const vencidas = MULTAS.filter((m) => m.status === "VENCIDA");
  const aPagar = [...pendentes, ...vencidas].reduce((a, m) => a + m.valor, 0);
  const pontos = MULTAS.filter((m) => m.status !== "RECURSO").reduce((a, m) => a + m.pontos, 0);
  return {
    total: MULTAS.length,
    pendentes: pendentes.length,
    vencidas: vencidas.length,
    aPagar,
    pontos,
  };
}

// ===== Vistoria / Check-list =====

export type ItemVistoria = { item: string; ok: boolean };
export type Vistoria = {
  id: string;
  placa: string;
  motorista: string;
  tipo: "Check-in" | "Check-out";
  data: string;
  km: number;
  status: "Aprovado" | "Com ressalvas" | "Reprovado";
  itens: ItemVistoria[];
  observacao?: string;
};

const ITENS_PADRAO = (falhas: number[] = []): ItemVistoria[] =>
  ["Pneus e estepe", "Faróis e lanternas", "Freios", "Nível de óleo", "Para-brisa e palhetas", "Documentação", "Extintor", "Lataria / avarias"].map(
    (item, i) => ({ item, ok: !falhas.includes(i) })
  );

export const VISTORIAS: Vistoria[] = [
  { id: "VS-318", placa: "RDA-1A01", motorista: "João Pereira", tipo: "Check-out", data: "24/06/2026 07:40", km: 412880, status: "Aprovado", itens: ITENS_PADRAO() },
  { id: "VS-317", placa: "RDB-2B02", motorista: "Carlos Santos", tipo: "Check-in", data: "24/06/2026 06:15", km: 305120, status: "Com ressalvas", itens: ITENS_PADRAO([4]), observacao: "Palheta do limpador ressecada — trocar." },
  { id: "VS-315", placa: "RDC-3C03", motorista: "Marcos Oliveira", tipo: "Check-out", data: "23/06/2026 18:02", km: 198450, status: "Reprovado", itens: ITENS_PADRAO([2, 7]), observacao: "Freio dianteiro com folga + avaria na porta. Veículo retido." },
  { id: "VS-312", placa: "RDD-4D04", motorista: "Paulo Ribeiro", tipo: "Check-in", data: "23/06/2026 08:30", km: 489310, status: "Aprovado", itens: ITENS_PADRAO() },
  { id: "VS-309", placa: "RDE-5E05", motorista: "Antônio Costa", tipo: "Check-out", data: "22/06/2026 17:45", km: 142300, status: "Com ressalvas", itens: ITENS_PADRAO([0]), observacao: "Pneu traseiro direito careca — substituir antes da próxima viagem." },
  { id: "VS-305", placa: "RDF-6F06", motorista: "Rafael Lima", tipo: "Check-in", data: "22/06/2026 06:50", km: 233900, status: "Aprovado", itens: ITENS_PADRAO() },
];

export function vistoriaKpis() {
  return {
    total: VISTORIAS.length,
    aprovadas: VISTORIAS.filter((v) => v.status === "Aprovado").length,
    ressalvas: VISTORIAS.filter((v) => v.status === "Com ressalvas").length,
    reprovadas: VISTORIAS.filter((v) => v.status === "Reprovado").length,
  };
}

export { PLACAS as MULTAS_PLACAS, NOMES as MULTAS_NOMES };

/**
 * Parser tolerante de NFe (modelo 55) focado em combustível.
 * Não depende de libs externas — usa regex sobre o XML cru.
 * Extrai: chave de acesso, emitente, volume total (L) e valor total.
 *
 * Cobre o caso comum de NFe de combustível onde os itens têm uCom em
 * "LT"/"L" e o produto é diesel/gasolina/etanol/arla.
 */

export type NFeParsed = {
  accessKey: string | null;
  supplier: string | null;
  issuedAt: string | null; // ISO
  volumeL: number;
  valueBRL: number;
  fuelGuess: string | null; // DIESEL_S10 | DIESEL_S500 | GASOLINE | ETHANOL | ARLA32 | null
  items: Array<{ desc: string; qty: number; unit: string; total: number }>;
  warnings: string[];
};

function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function num(v: string | null): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  // NFe usa ponto decimal padrão; o replace acima quebra "1234.56" → tenta direto também
  const direct = parseFloat(v);
  if (!Number.isNaN(direct) && Math.abs(direct) >= Math.abs(n || 0)) return direct;
  return Number.isNaN(n) ? 0 : n;
}

function guessFuel(desc: string): string | null {
  const d = desc.toUpperCase();
  if (d.includes("ARLA") || d.includes("ARLA32") || d.includes("ARLA 32")) return "ARLA32";
  if (d.includes("S-10") || d.includes("S10")) return "DIESEL_S10";
  if (d.includes("S-500") || d.includes("S500")) return "DIESEL_S500";
  if (d.includes("DIESEL") || d.includes("ÓLEO DIESEL") || d.includes("OLEO DIESEL")) return "DIESEL_S500";
  if (d.includes("ETANOL") || d.includes("ALCOOL") || d.includes("ÁLCOOL")) return "ETHANOL";
  if (d.includes("GASOLINA")) return "GASOLINE";
  return null;
}

export function parseNFe(xml: string, fileName?: string): NFeParsed {
  const warnings: string[] = [];

  // Chave de acesso: atributo Id="NFe<44 dígitos>" ou tag <chNFe>
  let accessKey: string | null = null;
  const idMatch = xml.match(/Id=["']NFe(\d{44})["']/i);
  if (idMatch) accessKey = idMatch[1];
  if (!accessKey) {
    const ch = pick(xml, "chNFe");
    if (ch && /\d{44}/.test(ch)) accessKey = ch.match(/\d{44}/)![0];
  }
  if (!accessKey) {
    // fallback: qualquer sequência de 44 dígitos
    const any = xml.match(/\d{44}/);
    if (any) accessKey = any[0];
  }
  if (!accessKey) warnings.push("Chave de acesso (44 dígitos) não encontrada.");

  // Emitente: <emit><xNome>
  let supplier: string | null = null;
  const emitBlock = pick(xml, "emit");
  if (emitBlock) supplier = pick(emitBlock, "xNome");
  if (!supplier) supplier = pick(xml, "xNome");

  // Data de emissão: <dhEmi> ou <dEmi>
  let issuedAt: string | null = null;
  const dh = pick(xml, "dhEmi") || pick(xml, "dEmi");
  if (dh) {
    const d = new Date(dh);
    issuedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Itens: cada <det> tem <prod> com <xProd>, <uCom>, <qCom>, <vProd>
  const dets = pickAll(xml, "det");
  const items: NFeParsed["items"] = [];
  let volumeL = 0;
  let fuelGuess: string | null = null;

  for (const det of dets) {
    const desc = pick(det, "xProd") ?? "";
    const unit = (pick(det, "uCom") ?? "").toUpperCase();
    const qty = num(pick(det, "qCom"));
    const total = num(pick(det, "vProd"));
    items.push({ desc, qty, unit, total });

    const isLiters = unit === "LT" || unit === "L" || unit === "LITRO" || unit.startsWith("LT");
    const fg = guessFuel(desc);
    if (fg && !fuelGuess) fuelGuess = fg;
    // Soma litros apenas de itens que parecem combustível medido em litros
    if (isLiters || fg) volumeL += qty;
  }

  // Valor total: <ICMSTot><vNF> ou <vNF>
  let valueBRL = num(pick(xml, "vNF"));
  if (!valueBRL) {
    valueBRL = items.reduce((acc, it) => acc + it.total, 0);
  }

  if (items.length === 0) warnings.push("Nenhum item (<det>) encontrado no XML.");
  if (volumeL === 0) warnings.push("Volume em litros não identificado — confira a unidade (uCom) dos itens.");

  return {
    accessKey,
    supplier: supplier ?? (fileName ? `(${fileName})` : null),
    issuedAt,
    volumeL: Math.round(volumeL * 100) / 100,
    valueBRL: Math.round(valueBRL * 100) / 100,
    fuelGuess,
    items,
    warnings,
  };
}

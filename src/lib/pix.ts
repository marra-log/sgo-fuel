// Gera o "PIX Copia e Cola" (BR Code estático, padrão EMV do Banco Central).
// Puro JS — não depende de gateway, adquirente nem internet. O recebedor é a
// conta da própria empresa (chave Pix). Funciona hoje para cobrança real.

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// CRC16-CCITT (0x1021, init 0xFFFF) — exigido pelo padrão Pix.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acento
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

export type PixInput = {
  chave: string; // chave Pix (cpf/cnpj/email/telefone/aleatória)
  nome: string; // nome do recebedor
  cidade: string; // cidade do recebedor
  valor?: number; // opcional; se ausente, QR aberto
  txid?: string; // identificador (até 25 alfanum)
};

export function gerarPixCopiaECola({ chave, nome, cidade, valor, txid }: PixInput): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const key = tlv("01", chave.trim());
  const merchantAccount = tlv("26", gui + key);

  const amount = valor != null && valor > 0 ? tlv("54", valor.toFixed(2)) : "";
  const txidClean = sanitize(txid || "***", 25) || "***";
  const additional = tlv("62", tlv("05", txidClean));

  let payload =
    tlv("00", "01") + // payload format
    merchantAccount +
    tlv("52", "0000") + // MCC
    tlv("53", "986") + // BRL
    amount +
    tlv("58", "BR") +
    tlv("59", sanitize(nome, 25) || "RECEBEDOR") +
    tlv("60", sanitize(cidade, 15) || "CIDADE") +
    additional +
    "6304"; // placeholder do CRC

  payload += crc16(payload);
  return payload;
}

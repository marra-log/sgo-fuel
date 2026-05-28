import { FileText, ShieldCheck, Upload } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, formatNumber } from "@/lib/utils";

const tanques = [
  {
    nome: "Diesel S10 — Tanque 1",
    entrada: 28000,
    saida: 27640,
    valor: 28 * 5.62,
  },
  {
    nome: "Diesel S500 — Tanque 2",
    entrada: 15000,
    saida: 14910,
    valor: 15 * 5.41,
  },
  {
    nome: "Arla 32 — Tanque 3",
    entrada: 4000,
    saida: 3994,
    valor: 4 * 4.2,
  },
];

const xmls = [
  { chave: "31250503...0001-87", fornecedor: "Vibra Energia", litros: 12000, valor: 67440, data: "12/05/26" },
  { chave: "31250503...0010-14", fornecedor: "Raízen Combustíveis", litros: 16000, valor: 89920, data: "18/05/26" },
  { chave: "31250503...0027-50", fornecedor: "Vibra Energia", litros: 15000, valor: 81150, data: "22/05/26" },
  { chave: "31250503...0044-93", fornecedor: "Petrobras BR", litros: 4000, valor: 16800, data: "25/05/26" },
];

export default function ConciliacaoPage() {
  return (
    <SectionShell
      badge="Conciliação SEFAZ"
      title="XML de compra × Saída efetiva"
      description="Cruzamos automaticamente as NFes do combustível com os litros liberados pelo IoT — sem precisar de sondas físicas no tanque."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">
            <ShieldCheck className="h-3 w-3" />
            Compliance OK
          </Badge>
          <Badge variant="info">Janela: maio/2026</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-3.5 w-3.5" />
            Importar XML
          </Button>
          <Button size="sm">
            <FileText className="h-3.5 w-3.5" />
            Gerar relatório
          </Button>
        </div>
      </div>

      {/* Tanques */}
      <Card className="mb-6">
        <div className="border-b border-[color:var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-white">Tanques físicos</h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            Diferença esperada por evaporação técnica: até 0,8% (referência ANP).
          </p>
        </div>
        <div className="divide-y divide-[color:var(--color-border)]">
          {tanques.map((t, i) => {
            const diff = t.entrada - t.saida;
            const pct = (diff / t.entrada) * 100;
            const tone = pct > 1.5 ? "danger" : pct > 0.8 ? "warning" : "success";
            return (
              <div key={i} className="grid grid-cols-12 items-center gap-3 px-5 py-4">
                <div className="col-span-4 text-sm font-medium text-white">{t.nome}</div>
                <div className="col-span-2 text-xs">
                  <div className="text-[color:var(--color-muted)]">Entrada (XML)</div>
                  <div className="font-mono text-white">{formatNumber(t.entrada)} L</div>
                </div>
                <div className="col-span-2 text-xs">
                  <div className="text-[color:var(--color-muted)]">Saída (IoT)</div>
                  <div className="font-mono text-white">{formatNumber(t.saida)} L</div>
                </div>
                <div className="col-span-2 text-xs">
                  <div className="text-[color:var(--color-muted)]">Diferença</div>
                  <div className="font-mono text-white">{formatNumber(diff)} L</div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <Badge variant={tone}>{pct.toFixed(2)}% perda</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* XMLs */}
      <Card>
        <div className="border-b border-[color:var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-white">NFes de compra (XML)</h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            Importadas direto da SEFAZ via certificado A1.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[color:var(--color-surface-2)] text-left">
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Chave</th>
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Fornecedor</th>
                <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border)]">
              {xmls.map((x, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-mono text-xs text-[color:var(--color-muted)]">
                    {x.chave}
                  </td>
                  <td className="px-5 py-3 text-white">{x.fornecedor}</td>
                  <td className="px-5 py-3 text-[color:var(--color-muted)]">{x.data}</td>
                  <td className="px-5 py-3 text-right font-mono text-white">
                    {formatNumber(x.litros)} L
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(x.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </SectionShell>
  );
}

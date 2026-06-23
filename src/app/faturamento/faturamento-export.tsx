"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FaturaLinha = {
  cartao: string;
  titular: string;
  motorista: string;
  transacoes: number;
  litros: number;
  valor: number;
};

export function FaturamentoExport({ linhas, periodo }: { linhas: FaturaLinha[]; periodo: string }) {
  function exportCsv() {
    const head = ["cartao", "titular", "motorista", "transacoes", "litros", "valor_brl"];
    const body = linhas.map((l) =>
      [l.cartao, l.titular, l.motorista, l.transacoes, l.litros.toFixed(2), l.valor.toFixed(2)]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const total = linhas.reduce((a, l) => a + l.valor, 0);
    body.push(["", "", "", "", "TOTAL", total.toFixed(2)].map((c) => `"${c}"`).join(","));
    const csv = [head.join(","), ...body].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faturamento-${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={linhas.length === 0} className="print:hidden">
      <Download className="h-3.5 w-3.5" />
      Exportar CSV
    </Button>
  );
}

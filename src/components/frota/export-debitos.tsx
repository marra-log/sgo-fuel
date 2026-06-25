"use client";

import { Download, Printer } from "lucide-react";
import type { DebitoRow } from "@/lib/frota-mock";

export function ExportDebitos({ rows }: { rows: DebitoRow[] }) {
  function exportCsv() {
    const head = ["placa", "motorista", "km", "consumo_medio", "estabelecimento", "data", "litros", "valor", "desconto", "total"];
    const body = rows.map((d) =>
      [d.placa, d.motorista, d.km, d.consumoMedio, d.estabelecimento, d.data, d.quantidade, d.valor.toFixed(2), d.desconto.toFixed(2), d.total.toFixed(2)]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-debitos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
        <Download className="h-3 w-3" /> Excel/CSV
      </button>
      <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
        <Printer className="h-3 w-3" /> PDF
      </button>
    </div>
  );
}

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

/** Cartão de indicador do topo do Portal. */
export function Kpi({
  title,
  value,
  delta,
  deltaUp,
  icon,
  sublabel,
}: {
  title: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon: React.ReactNode;
  sublabel: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{title}</div>
        <div className="text-[color:var(--color-muted)]">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[color:var(--color-text-strong)]">{value}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span
          className={
            deltaUp
              ? "inline-flex items-center gap-1 text-[color:var(--color-brand)]"
              : "inline-flex items-center gap-1 text-[color:var(--color-warning)]"
          }
        >
          {deltaUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {delta}
        </span>
        <span className="text-[color:var(--color-muted)]">{sublabel}</span>
      </div>
    </Card>
  );
}

/** Célula do bloco "Carteira da frota". */
export function WalletStat({
  title,
  value,
  icon,
  brand,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  brand?: boolean;
}) {
  return (
    <div className="bg-[color:var(--color-surface)] px-5 py-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {icon} {title}
      </div>
      <div
        className={
          "mt-1.5 text-xl font-semibold " +
          (brand ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-text-strong)]")
        }
      >
        {value}
      </div>
    </div>
  );
}

/** Linha de conciliação por tanque: entrada (NFe) × saída (IoT). */
export function ConcilRow({ label, entrada, saida }: { label: string; entrada: number; saida: number }) {
  const diff = entrada - saida;
  const pct = entrada > 0 ? (diff / entrada) * 100 : 0;
  const tone = pct > 1.5 ? "danger" : pct > 0.8 ? "warning" : "success";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[color:var(--color-text-strong)]">{label}</span>
        <Badge variant={tone}>{pct.toFixed(2)}% perda</Badge>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-[color:var(--color-muted)] sm:grid-cols-3 sm:gap-3">
        <span>
          Entrada (XML): <span className="font-mono text-[color:var(--color-text-strong)]">{formatNumber(entrada)} L</span>
        </span>
        <span>
          Saída (IoT): <span className="font-mono text-[color:var(--color-text-strong)]">{formatNumber(saida)} L</span>
        </span>
        <span className="sm:text-right">
          Diferença: <span className="font-mono text-[color:var(--color-text-strong)]">{formatNumber(diff)} L</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-full bg-[color:var(--color-brand)]"
          style={{ width: `${entrada > 0 ? Math.min(100, (saida / entrada) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

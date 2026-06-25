import { MapPin } from "lucide-react";
import { PRECOS_POSTOS } from "@/lib/frota-mock";

// Mapa estilizado (SVG) com pins fictícios dos postos — sem API de mapa paga.
// Posições aproximadas em coordenadas relativas (demonstração).
const PINS = [
  { x: 38, y: 46 }, { x: 52, y: 40 }, { x: 46, y: 55 },
  { x: 62, y: 58 }, { x: 30, y: 64 }, { x: 70, y: 44 },
];

export function MapaPostos() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[#0b1220]">
        <svg viewBox="0 0 100 70" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          {/* fundo tipo mapa */}
          <rect width="100" height="70" fill="#0b1220" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 9} x2="100" y2={i * 9} stroke="#16203a" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 9} y1="0" x2={i * 9} y2="70" stroke="#16203a" strokeWidth="0.3" />
          ))}
          {/* "rodovias" */}
          <path d="M5 60 Q 40 30 95 25" stroke="#2f6df6" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M10 10 Q 50 50 90 65" stroke="#2f6df6" strokeWidth="0.8" fill="none" opacity="0.5" />
          {/* pins */}
          {PINS.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="2.6" fill="#19c37d" opacity="0.25" />
              <circle cx={p.x} cy={p.y} r="1.3" fill="#19c37d" />
            </g>
          ))}
        </svg>
        <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white">
          {PRECOS_POSTOS.length} postos credenciados · MG/SP
        </div>
      </div>

      <div className="space-y-2">
        {PRECOS_POSTOS.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2">
            <span className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
              <span className="text-white">{p.posto}</span>
            </span>
            <span className="text-[11px] text-[color:var(--color-muted)]">{p.cidade}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

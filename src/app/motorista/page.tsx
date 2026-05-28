import {
  Battery,
  CheckCircle2,
  Fuel,
  MapPin,
  Navigation,
  Signal,
  Truck,
  Wifi,
} from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MotoristaPage() {
  return (
    <SectionShell
      badge="App do Motorista"
      title="Rotas, saldos e check-in na bomba"
      description="Interface enxuta para o condutor: cota da viagem, status do tanque, abastecimentos e localização do pátio mais próximo."
    >
      <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
        {/* Phone mockup */}
        <div className="mx-auto w-full max-w-[290px]">
          <div className="rounded-[42px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
            <div className="overflow-hidden rounded-[34px] bg-black">
              {/* Status bar */}
              <div className="flex items-center justify-between px-5 pt-3 text-[10px] text-white">
                <span>09:48</span>
                <div className="flex items-center gap-1">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3 w-3" />
                </div>
              </div>

              {/* Header */}
              <div className="px-5 pt-4">
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  Olá, motorista
                </div>
                <div className="text-base font-semibold text-white">Reinaldo Souza</div>
              </div>

              {/* Cota card */}
              <div className="mx-5 mt-4 rounded-2xl bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-brand-deep)] p-4 text-black">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                  <span>Cota da viagem</span>
                  <Fuel className="h-3.5 w-3.5" />
                </div>
                <div className="mt-1 text-2xl font-semibold">180,00 L</div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span>Rota MRL-1184</span>
                  <span className="font-medium">BH → Vitória</span>
                </div>
              </div>

              {/* Próximo abastecimento */}
              <div className="mx-5 mt-4 rounded-xl border border-white/10 bg-[color:var(--color-surface)] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  <Navigation className="h-3 w-3" />
                  Próximo ponto autorizado
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Posto Trevão · BR-381 km 412
                </div>
                <div className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
                  18 km · Diesel S10 · Tag NFC habilitada
                </div>
              </div>

              {/* Checklist */}
              <div className="mx-5 mt-4">
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  Antes de abastecer
                </div>
                <div className="mt-2 space-y-1.5">
                  <Check label="Veículo: BRA-2E19" />
                  <Check label="KM: 412.880" />
                  <Check label="Cota não excedida" />
                </div>
              </div>

              {/* CTA */}
              <button className="mx-5 mt-4 mb-5 w-[calc(100%-2.5rem)] rounded-xl bg-white py-3 text-sm font-semibold text-black">
                Iniciar check-in
              </button>
            </div>
          </div>
        </div>

        {/* Direita */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-white">Recursos do app</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Feature icon={<Fuel className="h-4 w-4" />} title="Cota dinâmica" desc="Volume exato calculado por rota e carga." />
              <Feature icon={<MapPin className="h-4 w-4" />} title="Postos parceiros" desc="Mapa com pontos compatíveis no trajeto." />
              <Feature icon={<Truck className="h-4 w-4" />} title="Veículo amarrado" desc="Placa do app cruza com leitura ALPR." />
              <Feature icon={<Navigation className="h-4 w-4" />} title="Roteirização" desc="Integração com o Portal do Gestor." />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-white">Tela de check-in (passo a passo)</h3>
            <ol className="mt-3 space-y-3 text-sm text-[color:var(--color-text)]">
              <Step n={1} title="Selecionar bomba" desc="QR Code do totem ou tag NFC do posto parceiro." />
              <Step n={2} title="Confirmar KM atual" desc="App pré-preenche com base em telemetria, se houver." />
              <Step n={3} title="Confirmar cota" desc="Volume já calculado pela IA — motorista só confirma." />
              <Step n={4} title="Aguardar liberação" desc="A IA cruza ALPR + cota + bico antes de energizar." />
            </ol>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                Histórico transparente
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              O motorista enxerga todo seu histórico de abastecimentos, score de eficiência e
              colocação no ranking. Premiação por desempenho é parte do design.
            </p>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-white">
      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
      {label}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-center gap-2 text-[color:var(--color-brand)]">
        {icon}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <div className="mt-1 text-xs text-[color:var(--color-muted)]">{desc}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-medium text-[color:var(--color-brand)]">
        {n}
      </span>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)]">{desc}</div>
      </div>
    </li>
  );
}

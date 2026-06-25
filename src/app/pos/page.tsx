import { CheckCircle2, Fuel, Nfc, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function POSPage() {
  return (
    <SectionShell
      badge="Smart POS"
      title="App nativo em terminais Pax / Gertec"
      description="Postos parceiros validam frotas direto pelo POS — sem cartão plástico clonável, com auditoria fim-a-fim."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* POS mockup */}
        <div className="mx-auto w-full max-w-[320px]">
          <div className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
            <div className="flex items-center justify-between px-3 pt-1">
              <span className="text-[10px] text-[color:var(--color-muted)]">PAX A920 PRO</span>
              <Wifi className="h-3 w-3 text-[color:var(--color-muted)]" />
            </div>

            <div className="mt-2 overflow-hidden rounded-[16px] bg-black p-4">
              <div className="flex items-center justify-between text-[10px] text-[color:var(--color-text-strong)]">
                <span className="font-semibold text-[color:var(--color-brand)]">SGO-FUEL</span>
                <span>14:22</span>
              </div>

              <div className="mt-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  Frota autorizada
                </div>
                <div className="mt-1 font-mono text-sm text-[color:var(--color-text-strong)]">RDB-2B02</div>
                <div className="text-xs text-[color:var(--color-muted)]">Volvo FH 540 · Antônio L.</div>
              </div>

              <div className="mt-3 rounded-lg border border-[color:var(--color-brand)]/50 bg-[color:var(--color-brand-soft)] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-brand)]">
                  Cota dinâmica liberada
                </div>
                <div className="mt-1 text-xl font-semibold text-[color:var(--color-text-strong)]">240,00 L</div>
                <div className="text-[10px] text-[color:var(--color-muted)]">
                  Rota RTA-1184 · 1.180 km
                </div>
              </div>

              <div className="mt-3 space-y-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-[11px]">
                <Row label="KM atual" value="412.880 km" />
                <Row label="Combustível" value="Diesel S10" />
                <Row label="Posto" value="Trevão BR-381" />
              </div>

              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-brand)] py-3 text-sm font-semibold text-black">
                <Nfc className="h-4 w-4" />
                Aproximar tag NFC
              </button>

              <div className="mt-3 text-center text-[10px] text-[color:var(--color-muted)]">
                ou aprovar pelo app do motorista
              </div>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">Por que substituir o cartão?</h3>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted)]">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 flex-none text-[color:var(--color-brand)]" />
                <span>
                  Cartões plásticos são <span className="text-[color:var(--color-text-strong)]">clonáveis</span> e geralmente compartilhados
                  entre motoristas — sem cadeia de custódia.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 flex-none text-[color:var(--color-brand)]" />
                <span>
                  Tag NFC é <span className="text-[color:var(--color-text-strong)]">amarrada à placa</span> e ao app do motorista; sem ambos,
                  não há autorização.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 flex-none text-[color:var(--color-brand)]" />
                <span>
                  Posto recebe pagamento via{" "}
                  <span className="text-[color:var(--color-text-strong)]">conciliação automática</span> — sem dependência de adquirente.
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">Compatibilidade</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Pos title="PAX A920 Pro" />
              <Pos title="Gertec GPOS720" />
              <Pos title="Sunmi P2 Pro" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                Auditoria total
              </Badge>
              <span className="text-xs text-[color:var(--color-muted)]">
                Cada transação gera um pacote auditável.
              </span>
            </div>
            <ul className="mt-3 grid gap-2 text-xs text-[color:var(--color-muted)] sm:grid-cols-2">
              <li>· Placa lida + foto do veículo no posto</li>
              <li>· Cota dinâmica calculada por rota</li>
              <li>· Hodômetro coerente com a fatura</li>
              <li>· Comprovante eletrônico assinado</li>
            </ul>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="text-[color:var(--color-text-strong)]">{value}</span>
    </div>
  );
}

function Pos({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <Smartphone className="h-4 w-4 text-[color:var(--color-brand)]" />
      <span className="text-sm text-[color:var(--color-text-strong)]">{title}</span>
    </div>
  );
}

import { Camera, Cpu, Plug, Power, ShieldCheck, Wifi } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TotemPage() {
  return (
    <SectionShell
      badge="Totem IoT"
      title="Hardware compacto, instalado direto na elétrica da bomba"
      description="Edge Computing local + câmera ALPR + Relé SSR. Bomba permanece inoperante até a IA autorizar."
    >
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Totem mockup */}
        <div>
          <div className="mx-auto w-full max-w-[380px] rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
            <div className="relative aspect-[3/5] overflow-hidden rounded-[18px] bg-black">
              {/* "Screen" */}
              <div className="absolute inset-0 grid-backdrop opacity-90" />
              <div className="relative flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-white">
                    <Cpu className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
                    Aether IA · v2.4
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[color:var(--color-muted)]">
                    <Wifi className="h-3 w-3" /> 4G
                  </div>
                </div>

                <div className="mt-5 flex-1 rounded-md border border-white/10 bg-black/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Câmera frontal
                  </div>
                  <div className="relative mt-2 aspect-video overflow-hidden rounded bg-black">
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-25">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-white/10" />
                      ))}
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-[color:var(--color-brand)] px-2 py-1">
                      <div className="text-[8px] uppercase tracking-wider text-[color:var(--color-brand)]">
                        Placa
                      </div>
                      <div className="font-mono text-xs text-white">BRA-2E19</div>
                    </div>
                    <div className="absolute inset-x-0 h-8 scanline" />
                  </div>

                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <Row label="Motorista" value="Reinaldo S." ok />
                    <Row label="Cota autorizada" value="180 L" ok />
                    <Row label="Rota" value="MRL-1184 · BH→Vitória" ok />
                    <Row label="Recipiente" value="Padrão OK" ok />
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[color:var(--color-brand)]">
                    <Power className="h-4 w-4" />
                    <span className="text-sm font-semibold">BOMBA LIBERADA</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                    SSR energizado · IA monitorando bico
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1 text-[10px] text-[color:var(--color-muted)]">
              <span>SGO-Fuel · Totem v2</span>
              <span>S/N · SGOF-MRL-0014</span>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-white">O que tem dentro</h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Componentes de prateleira coordenados por backend robusto em Node.js — preço pulverizado.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Spec icon={<Cpu className="h-4 w-4" />} title="Raspberry Pi 5" desc="Modelo com 4GB. Roda inferência ALPR em Edge." />
              <Spec icon={<Camera className="h-4 w-4" />} title="Câmera 1080p IR" desc="Captura placa e bico mesmo à noite." />
              <Spec icon={<Plug className="h-4 w-4" />} title="Relé SSR 25A" desc="Corta a fase da bomba em < 200 ms." />
              <Spec icon={<Wifi className="h-4 w-4" />} title="Modem 4G + WiFi" desc="Pátio offline? O Edge decide local." />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-white">Fluxo de autorização</h3>
            <ol className="mt-3 space-y-3 text-sm text-[color:var(--color-text)]">
              <Step n={1} title="Motorista faz check-in no app" desc="Envia placa, rota e cota dinâmica calculada pela IA." />
              <Step n={2} title="Câmera lê a placa (ALPR)" desc="Cruza com a placa cadastrada para o motorista no momento." />
              <Step n={3} title="IA valida o bico" desc="Detecta recipiente padrão. Balde ou galão = bloqueio imediato." />
              <Step n={4} title="SSR energiza a bomba" desc="Apenas para o volume exato da cota. Excedente = corte." />
              <Step n={5} title="Evento auditado" desc="Vídeo, KM e placa vão para o Portal do Gestor." />
            </ol>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                Tempero
              </Badge>
              <span className="text-xs text-[color:var(--color-muted)]">
                Custo total de implantação por bomba
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Cost label="Hardware" value="R$ 1.180" />
              <Cost label="Instalação" value="R$ 280" />
              <Cost label="Plataforma (mensal)" value="R$ 89 / bomba" />
            </div>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className={ok ? "text-[color:var(--color-brand)]" : "text-white"}>{value}</span>
    </div>
  );
}

function Spec({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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

function Cost({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

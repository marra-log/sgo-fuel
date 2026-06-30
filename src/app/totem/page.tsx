import { Camera, Cpu, Plug, ShieldCheck, Wifi } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TotemTerminal } from "./totem-terminal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "SGO-Fuel Totem · IoT",
  manifest: "/totem.webmanifest",
};

export default async function TotemPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: pumps }, { data: cards }] = await Promise.all([
    supabase.from("pumps").select("id, serial_number, yards(name), partner_station").order("serial_number"),
    supabase.from("fleet_cards").select("card_number, holder_name, status").order("created_at", { ascending: false }),
  ]);

  return (
    <SectionShell
      badge="Totem IoT"
      title="Hardware compacto, instalado direto na elétrica da bomba"
      description="Dois modos validados: cartão private label (lê NFC e debita o saldo) e IA por câmera/ALPR. Bomba inoperante até autorizar."
    >
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Totem real (terminal interativo) */}
        <div>
          <TotemTerminal pumps={(pumps ?? []) as never} cards={(cards ?? []) as never} />
        </div>

        {/* Specs */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">O que tem dentro</h3>
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
            <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">Fluxo de autorização</h3>
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
                Vantagens
              </Badge>
              <span className="text-xs text-[color:var(--color-muted)]">
                Por que o Totem IoT muda o jogo
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Vantagem titulo="Prevenção ativa" desc="Corta a bomba em tempo real, não no fim do mês." />
              <Vantagem titulo="Sem digitação" desc="A IA lê a placa e cruza o KM automaticamente." />
              <Vantagem titulo="Implantação simples" desc="Instala na elétrica existente, sem obra." />
            </div>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

function Spec({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-center gap-2 text-[color:var(--color-brand)]">
        {icon}
        <span className="text-sm font-medium text-[color:var(--color-text-strong)]">{title}</span>
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
        <div className="text-sm font-medium text-[color:var(--color-text-strong)]">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)]">{desc}</div>
      </div>
    </li>
  );
}

function Vantagem({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="text-sm font-semibold text-[color:var(--color-brand)]">{titulo}</div>
      <div className="mt-1 text-xs text-[color:var(--color-muted)]">{desc}</div>
    </div>
  );
}

import { Cpu, Download, Smartphone } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "SGO-Fuel · Instalar nas máquinas (APK)" };

const SITE = "https://sgo-fuel.vercel.app";

const APPS = [
  {
    nome: "Smart POS",
    icon: <Smartphone className="h-6 w-6" />,
    desc: "Terminal de mão: lê o cartão NFC e debita o saldo. Instale numa Smart POS Android desbloqueada (Sunmi, PAX, Gertec).",
    rota: "/maquininha",
    manifest: "/pos.webmanifest",
  },
  {
    nome: "Totem IoT",
    icon: <Cpu className="h-6 w-6" />,
    desc: "Autoatendimento na bomba: modo cartão/NFC (debita saldo) e modo IA/placa. Instale no totem/tablet Android.",
    rota: "/totem",
    manifest: "/totem.webmanifest",
  },
];

function pwabuilder(rota: string) {
  return `https://www.pwabuilder.com/?site=${encodeURIComponent(SITE + rota)}`;
}

export default function InstalarPage() {
  return (
    <SectionShell
      badge="Instalação · APK"
      title="Gerar o APK das máquinas"
      description="O SGO-Fuel é um PWA. Para virar app nativo (tela cheia + NFC + impressora), empacote num APK TWA. Cada botão abre o PWABuilder já com o app certo."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {APPS.map((a) => (
          <Card key={a.nome} className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                {a.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">{a.nome}</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{a.desc}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={pwabuilder(a.rota)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-semibold text-black hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> Gerar APK (PWABuilder)
              </a>
              <a
                href={a.rota}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]"
              >
                Abrir no navegador
              </a>
            </div>

            <div className="mt-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-muted)]">
              <div>Manifest: <code className="text-[color:var(--color-text-strong)]">{SITE}{a.manifest}</code></div>
              <div className="mt-1">Início do app: <code className="text-[color:var(--color-text-strong)]">{a.rota}</code></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-6">
        <div className="flex items-center gap-2">
          <Badge variant="info">Passo a passo</Badge>
          <span className="text-xs text-[color:var(--color-muted)]">3 passos para o app abrir em tela cheia</span>
        </div>
        <ol className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]">
          <li><b>1.</b> Clique em <b>Gerar APK</b> → no PWABuilder, <b>Package For Stores → Android → Generate</b> e baixe o <code>.apk</code>.</li>
          <li><b>2.</b> Copie o <b>SHA-256</b> do <code>assetlinks.json</code> gerado para o nosso <code>public/.well-known/assetlinks.json</code> (commit + deploy) — é o que tira a barra de URL.</li>
          <li><b>3.</b> Na máquina: habilite <b>fontes desconhecidas</b> e instale o <code>.apk</code> (ou <code>adb install</code>). Defina como app de quiosque, se houver.</li>
        </ol>
        <p className="mt-3 text-xs text-[color:var(--color-muted)]">
          Alternativa sem APK: abra a rota no Chrome do aparelho e use “Adicionar à tela inicial”. Detalhes em <code>docs/APK-SMARTPOS-TOTEM.md</code>.
        </p>
      </Card>
    </SectionShell>
  );
}

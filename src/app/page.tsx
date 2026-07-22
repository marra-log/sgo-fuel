import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  Cpu,
  Eye,
  Fuel,
  Gauge,
  PiggyBank,
  Plug,
  Radar,
  Scan,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing-header";
import { formatBRL } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />

      {/* HERO */}
      <section className="grid-backdrop relative overflow-hidden border-b border-[color:var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <Badge variant="success" className="mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand)]" />
                Aether IA · Ecossistema de Abastecimento
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight text-[color:var(--color-text-strong)] sm:text-4xl lg:text-5xl">
                Revolucionando o controle de frotas com
                <span className="ml-2 bg-gradient-to-r from-[color:var(--color-brand)] to-[#7ee7b4] bg-clip-text text-transparent">
                  IoT de baixo custo
                </span>{" "}
                e Visão Computacional.
              </h1>
              <p className="mt-6 max-w-xl text-base text-[color:var(--color-muted)]">
                O combustível representa <span className="text-[color:var(--color-text-strong)]">40% a 50%</span> dos custos
                operacionais de uma transportadora. O <span className="text-[color:var(--color-text-strong)]">SGO-Fuel</span>{" "}
                substitui telemetria mecânica cara por <span className="text-[color:var(--color-text-strong)]">software, IoT
                acessível e IA</span> que corta a bomba em tempo real diante de qualquer anomalia.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button size="lg">
                    Abrir Portal do Gestor
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/maquininha">
                  <Button size="lg" variant="outline">
                    Maquininha POS
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <KpiHero label="Setup IoT por bomba" value="< R$ 1.500" />
                <KpiHero label="Redução de fraudes" value="5–8%" />
                <KpiHero label="Tempo de bloqueio" value="< 200ms" />
              </div>
            </div>

            {/* Pump visual */}
            <PumpVisual />
          </div>
        </div>
      </section>

      {/* DESAFIO */}
      <Section
        kicker="01 · O Desafio"
        title="O ralo invisível das frotas"
        description="Sistemas baseados em confiança e digitação manual abrem brechas. Telemetria tradicional custa caro e age tarde demais."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconBox tone="danger">
                <AlertTriangle className="h-5 w-5" />
              </IconBox>
              <h3 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Fraude humana</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-muted)]">
              <li className="flex gap-2">
                <span className="text-[color:var(--color-danger)]">•</span>
                Hodômetro digitado e adulterado para liberar volume extra.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-danger)]">•</span>
                Abastecimento em galões e venda paralela na estrada.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-danger)]">•</span>
                Drenagem de tanques em paradas não planejadas.
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconBox tone="warning">
                <PiggyBank className="h-5 w-5" />
              </IconBox>
              <h3 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Automação inacessível</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-muted)]">
              <li className="flex gap-2">
                <span className="text-[color:var(--color-warning)]">•</span>
                Telemetria de bombas e sondas custam{" "}
                <span className="text-[color:var(--color-text-strong)]">R$ 15k a R$ 30k</span> por ponto.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-warning)]">•</span>
                Frotistas descobrem desvios só no fechamento da fatura.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-warning)]">•</span>
                Investimento alto = tecnologia restrita a grandes players.
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* SOLUÇÃO */}
      <Section
        kicker="02 · Nossa Solução"
        title="Prevenção ativa com tecnologia híbrida"
        description="Uma única plataforma para Postos Parceiros (rodovia) e Pátios Internos (base) — IoT + visão computacional + cota dinâmica."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <Badge variant="info">Rodovia</Badge>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--color-text-strong)]">Postos Parceiros</h3>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Validação via <span className="text-[color:var(--color-text-strong)]">Smart POS</span> (terminais Android).
              Eliminamos cartões plásticos clonáveis — autorização por tag NFC ou pelo próprio app
              do motorista, com auditoria fim-a-fim.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill icon={<Smartphone className="h-3.5 w-3.5" />}>Pax / Gertec</Pill>
              <Pill icon={<Scan className="h-3.5 w-3.5" />}>NFC / QR</Pill>
              <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />}>Anti-clonagem</Pill>
            </div>
          </Card>

          <Card className="p-6">
            <Badge variant="success">Pátio Interno</Badge>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--color-text-strong)]">Bases &amp; Transportadoras</h3>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Hardware IoT proprietário instalado na <span className="text-[color:var(--color-text-strong)]">parte elétrica
              da bomba</span>. A bomba fica permanentemente inoperante e só é energizada quando
              o sistema cruza todas as variáveis e autoriza.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill icon={<Plug className="h-3.5 w-3.5" />}>Relé SSR</Pill>
              <Pill icon={<Cpu className="h-3.5 w-3.5" />}>Raspberry Pi</Pill>
              <Pill icon={<Radar className="h-3.5 w-3.5" />}>Edge Computing</Pill>
            </div>
          </Card>
        </div>
      </Section>

      {/* MOTOR IA */}
      <Section
        kicker="03 · Motor Aether IA"
        title="A bomba vira um auditor implacável"
        description="Decisões em tempo real cruzando vídeo, placa, hodômetro, rota e cota."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Eye className="h-5 w-5" />}
            title="Validação visual de placas"
            desc="ALPR em Edge Computing: se a placa lida não bate com a autorizada no app, a bomba não destrava."
          />
          <FeatureCard
            icon={<Camera className="h-5 w-5" />}
            title="Detecção de fraude no bico"
            desc="Algoritmos identificam balde, galão ou recipiente não padrão e cortam a energia instantaneamente."
          />
          <FeatureCard
            icon={<Gauge className="h-5 w-5" />}
            title="Cota dinâmica por roteirização"
            desc="A IA cruza rota, carga e dados de embarcadores e libera só o volume preciso para a viagem."
          />
        </div>
      </Section>

      {/* COMPARATIVO */}
      <Section
        kicker="04 · Comparativo"
        title="Por que somos diferentes"
        description="Software + IoT acessível altera a dinâmica financeira e de segurança do abastecimento."
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-text-strong)]">Funcionalidade / Impacto</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">
                    Sistemas Tradicionais
                  </th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-brand)]">
                    SGO-Fuel · Aether IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                <Row
                  label="Custo de implantação (pátio)"
                  bad="R$ 15.000 a R$ 30.000 por bomba"
                  good="Menos de R$ 1.500 por bomba (Setup IoT)"
                />
                <Row
                  label="Prevenção de fraude"
                  bad="Reativa (relatório no fim do mês)"
                  good="Ativa — corta a bomba em tempo real"
                />
                <Row
                  label="Digitação de KM e placa"
                  bad="Frentista digita (erros e acordos)"
                  good="IA lê a placa e cruza KM com histórico"
                />
                <Row
                  label="Identificação de desvios (balde)"
                  bad="Inexistente"
                  good="Câmera detecta anomalia visual"
                />
                <Row
                  label="Auditoria do tanque físico"
                  bad="Exige sondas ultrassônicas caras"
                  good="Conciliação XML SEFAZ vs. saída"
                />
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* ROI */}
      <Section
        kicker="05 · ROI"
        title="A economia paga o investimento no primeiro mês"
        description="Frotas sem controle rígido perdem 5% a 8% em fraudes de pequenos volumes. A IA zera essa margem."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <RoiCard
            label="Frota consumindo 50.000 L/mês"
            value={formatBRL(23000)}
            sublabel="ralo mensal estimado"
          />
          <RoiCard
            label="Setup IoT por bomba"
            value={formatBRL(1500)}
            sublabel="vs. R$ 15k–30k da telemetria mecânica"
          />
          <RoiCard
            label="Compliance SEFAZ"
            value="XML × Saída"
            sublabel="conciliação automática sem sondas"
          />
        </div>
      </Section>

      {/* ARQUITETURA */}
      <Section
        kicker="06 · Produto"
        title="O que entregamos"
        description="Quatro pontos de contato em um único ecossistema, com IA cruzando tudo em tempo real."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ProductCard
            href="/totem"
            icon={<Cpu className="h-5 w-5" />}
            title="Totem IoT"
            desc="Módulo compacto de liberação com câmeras para Edge Computing."
            cta="Visualizar"
          />
          <ProductCard
            href="/pos"
            icon={<Smartphone className="h-5 w-5" />}
            title="App Smart POS"
            desc="Aplicativo nativo em Pax / Gertec para frotas em rodovia."
            cta="Visualizar"
          />
          <ProductCard
            href="/dashboard"
            icon={<BarChart3 className="h-5 w-5" />}
            title="Portal do Gestor"
            desc="Faturamento, alertas em vídeo, conciliação e ranking."
            cta="Entrar"
          />
          <ProductCard
            href="/app"
            icon={<Truck className="h-5 w-5" />}
            title="App do Motorista"
            desc="Rotas, saldos e check-in na bomba."
            cta="Visualizar"
          />
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="border-t border-[color:var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text-strong)] sm:text-3xl">
            Pronto para ver o ecossistema em operação?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Navegue pelas telas do gestor, anomalias, conciliação SEFAZ e ranking de motoristas —
            todas calculadas em cima dos dados reais da sua operação.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Abrir Portal do Gestor
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/anomalias">
              <Button size="lg" variant="outline">
                Ver alertas de anomalia
                <Activity className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-[color:var(--color-muted)]">
          <div className="flex items-center gap-2">
            <Fuel className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
            <span>SGO-Fuel · Powered by Aether IA</span>
          </div>
          <span>Gestão de abastecimento com dados reais da operação</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-brand)]">
          {kicker}
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)] sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted)]">{description}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function KpiHero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 sm:p-4">
      <div className="text-base font-semibold leading-tight text-[color:var(--color-text-strong)] sm:text-xl">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)] sm:text-[11px]">
        {label}
      </div>
    </div>
  );
}

function IconBox({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "success" | "info";
}) {
  const map = {
    default: "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-strong)]",
    danger: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
    warning: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
    success: "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]",
    info: "bg-[color:var(--color-info)]/15 text-[color:var(--color-info)]",
  } as const;
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[tone]}`}>
      {children}
    </div>
  );
}

function Pill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1 text-xs text-[color:var(--color-text)]">
      {icon}
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-6">
      <IconBox tone="success">{icon}</IconBox>
      <h3 className="mt-4 text-base font-semibold text-[color:var(--color-text-strong)]">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">{desc}</p>
    </Card>
  );
}

function Row({ label, bad, good }: { label: string; bad: string; good: string }) {
  return (
    <tr>
      <td className="px-5 py-3 font-medium text-[color:var(--color-text-strong)]">{label}</td>
      <td className="px-5 py-3 text-[color:var(--color-muted)]">{bad}</td>
      <td className="px-5 py-3 text-[color:var(--color-text)]">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[color:var(--color-brand)]" />
          {good}
        </span>
      </td>
    </tr>
  );
}

function RoiCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[color:var(--color-text-strong)]">{value}</div>
      <div className="mt-2 text-sm text-[color:var(--color-muted)]">{sublabel}</div>
    </Card>
  );
}

function ProductCard({
  href,
  icon,
  title,
  desc,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition-colors hover:border-[color:var(--color-brand)]/60"
    >
      <IconBox tone="success">{icon}</IconBox>
      <h3 className="mt-4 text-base font-semibold text-[color:var(--color-text-strong)]">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">{desc}</p>
      <div className="mt-4 text-xs font-medium text-[color:var(--color-brand)] group-hover:underline">
        {cta} →
      </div>
    </Link>
  );
}

function PumpVisual() {
  return (
    <div className="relative aspect-[5/6] w-full overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <div className="absolute inset-0 opacity-60 grid-backdrop" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
              Pátio TransCargo · Bomba 02
            </div>
            <div className="text-sm font-medium text-[color:var(--color-text-strong)]">Diesel S10 — 12.450 L em tanque</div>
          </div>
          <Badge variant="success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
            Online
          </Badge>
        </div>

        {/* Camera feed mock */}
        <div className="relative mt-5 flex-1 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-black">
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-25">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-b border-white/10"
                style={{
                  gridColumn: `${(i % 12) + 1}`,
                  gridRow: `${Math.floor(i / 12) + 1}`,
                }}
              />
            ))}
          </div>

          {/* Truck silhouette */}
          <div className="absolute inset-x-4 bottom-6 flex items-end justify-center">
            <Truck className="h-32 w-32 text-[color:var(--color-text-strong)]/30" />
          </div>

          {/* Plate detection box */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-[color:var(--color-brand)] px-3 py-1.5">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand)]">
              Placa detectada
            </div>
            <div className="font-mono text-sm text-[color:var(--color-text-strong)]">BRA · 2E19</div>
          </div>

          {/* Scanline */}
          <div className="absolute inset-x-0 h-12 scanline" />

          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[11px] text-[color:var(--color-text-strong)]">
            <Camera className="h-3 w-3 text-[color:var(--color-brand)]" />
            ALPR · Edge
          </div>
        </div>

        {/* Live readings */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Cota liberada
            </div>
            <div className="mt-0.5 font-mono text-sm text-[color:var(--color-brand)]">
              180.00 L
            </div>
          </div>
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Bico
            </div>
            <div className="mt-0.5 font-mono text-sm text-[color:var(--color-text-strong)]">Conforme</div>
          </div>
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Status SSR
            </div>
            <div className="mt-0.5 font-mono text-sm text-[color:var(--color-brand)]">
              ENERGIZADO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Building2, CreditCard, Store, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "SGO-Fuel · Plataforma Cartão Frota" };

const PAINEIS = [
  {
    href: "/frota/cliente",
    icon: <Building2 className="h-6 w-6" />,
    title: "Painel do Cliente",
    desc: "A transportadora acompanha crédito, consumo, saldo, transações suspeitas e preços por posto.",
    bullets: ["Saldo e crédito do mês", "Consumo por departamento", "Transações inválidas", "Preços por estabelecimento"],
  },
  {
    href: "/frota/motorista",
    icon: <Truck className="h-6 w-6" />,
    title: "Painel do Motorista",
    desc: "O condutor vê o saldo do cartão, limite, últimos abastecimentos e postos credenciados.",
    bullets: ["Saldo e limite do cartão", "Últimos abastecimentos", "Postos credenciados", "Status do cartão"],
  },
  {
    href: "/frota/posto",
    icon: <Store className="h-6 w-6" />,
    title: "Gestão do Posto",
    desc: "O posto/rede gerencia métricas, cadastro de postos e cartões, preços e transações.",
    bullets: ["Métricas e faturamento", "Cadastro de postos", "Cadastro de cartões", "Tabela de preços"],
  },
];

export default function FrotaHubPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <Badge variant="info" className="mb-3">
            <CreditCard className="h-3 w-3" />
            Plataforma Cartão Frota
          </Badge>
          <h1 className="text-3xl font-semibold text-white">Três painéis, uma plataforma</h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Estrutura completa de cartão de combustível para frotas — cliente, motorista e posto, cada
            um com seu painel e funcionalidades. <span className="text-[color:var(--color-muted)]">(dados de demonstração)</span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PAINEIS.map((p) => (
            <Link key={p.href} href={p.href} className="group">
              <Card className="h-full p-6 transition-colors hover:border-[color:var(--color-brand)]/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                  {p.icon}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{p.title}</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{p.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
                      <span className="h-1 w-1 rounded-full bg-[color:var(--color-brand)]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-brand)] group-hover:underline">
                  Abrir painel <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

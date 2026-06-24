import Link from "next/link";
import { ArrowLeft, CreditCard, Fuel, MapPin, Truck, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOTORISTA, PRECOS_POSTOS } from "@/lib/frota-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

export const metadata = { title: "SGO-Fuel · Painel do Motorista" };

export default function PainelMotoristaPage() {
  const pctUso = Math.min(100, (MOTORISTA.consumidoMes / MOTORISTA.limiteMensal) * 100);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/frota" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Plataforma Cartão Frota
        </Link>

        <div className="mt-3">
          <Badge variant="info" className="mb-2">Painel do Motorista</Badge>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Olá, {MOTORISTA.nome}</h1>
          <p className="text-xs text-[color:var(--color-muted)]">{MOTORISTA.veiculo} · {MOTORISTA.placa}</p>
        </div>

        {/* Cartão */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#2f6df6] to-[#16306e] p-5 text-white shadow-[0_20px_40px_-20px_rgba(47,109,246,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-white/80">SGO-Fuel · Cartão Frota</span>
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="mt-6 font-mono text-lg tracking-widest">{MOTORISTA.cartao}</div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/80">
            <span>{MOTORISTA.nome}</span>
            <Badge variant="success">Ativo</Badge>
          </div>
        </div>

        {/* Saldo / limite */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              <Wallet className="h-3.5 w-3.5" /> Saldo disponível
            </div>
            <div className="mt-2 text-2xl font-semibold text-[color:var(--color-brand)]">{formatBRL(MOTORISTA.saldoDisponivel)}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              <Fuel className="h-3.5 w-3.5" /> Consumido no mês
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatBRL(MOTORISTA.consumidoMes)}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
              <CreditCard className="h-3.5 w-3.5" /> Limite mensal
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatBRL(MOTORISTA.limiteMensal)}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
              <div className="h-full bg-[color:var(--color-brand)]" style={{ width: `${pctUso}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">{Math.round(pctUso)}% utilizado</div>
          </Card>
        </div>

        {/* Últimos abastecimentos */}
        <Card className="mt-4 overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Últimos abastecimentos</h2>
          </div>
          <div className="divide-y divide-[color:var(--color-border)]">
            {MOTORISTA.ultimos.map((u, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-white">{u.posto}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">{u.data} · {u.combustivel} · {formatNumber(u.litros)} L</div>
                </div>
                <div className="font-mono text-white">{formatBRL(u.valor)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Postos credenciados */}
        <Card className="mt-4 overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Postos credenciados</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Onde seu cartão é aceito, com o preço negociado.</p>
          </div>
          <div className="divide-y divide-[color:var(--color-border)]">
            {PRECOS_POSTOS.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                  <div>
                    <div className="font-medium text-white">{p.posto}</div>
                    <div className="text-xs text-[color:var(--color-muted)]">{p.cidade}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-white">{formatBRL(p.dieselS10)}</div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">Diesel S-10</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center">
          <Truck className="mx-auto h-5 w-5 text-[color:var(--color-brand)]" />
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            No app real, o motorista faz check-in e abastece pelo celular — veja em{" "}
            <Link href="/app" className="text-[color:var(--color-brand)] hover:underline">/app</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

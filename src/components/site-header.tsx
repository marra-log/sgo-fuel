"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  FileText,
  FileWarning,
  Fuel,
  Gauge,
  MapPin,
  Menu,
  Receipt,
  Scan,
  Shield,
  Smartphone,
  Store,
  Trophy,
  Truck,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

type NavItem = { href: string; label: string; icon: LucideIcon; desc?: string };

// Links principais mostrados inline no desktop
const primary = [
  { href: "/dashboard", label: "Portal" },
  { href: "/frota", label: "Cartão Frota" },
  { href: "/postos", label: "Rede de Postos" },
  { href: "/cadastros", label: "Cadastros" },
  { href: "/maquininha", label: "Maquininha" },
  { href: "/relatorios", label: "Relatórios" },
];

// Menu completo agrupado por categoria (drawer)
const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Visão Geral", icon: Gauge, desc: "Página inicial / pitch" },
      { href: "/dashboard", label: "Portal do Gestor", icon: BarChart3, desc: "Faturamento e alertas" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/cartoes", label: "Gestão dos Cartões", icon: CreditCard, desc: "Emitir, bloquear e limites" },
      { href: "/cartoes/recarga", label: "Recarregar saldo", icon: Wallet, desc: "Adicionar saldo por cartão/motorista" },
      { href: "/maquininha", label: "Maquininha", icon: Smartphone, desc: "Terminal de autorização" },
      { href: "/faturamento", label: "Faturamento", icon: Receipt, desc: "Fechamento e cobrança" },
      { href: "/conciliacao", label: "Conciliação SEFAZ", icon: FileText, desc: "Notas x abastecimentos" },
      { href: "/relatorios", label: "Relatórios & Débitos", icon: DollarSign, desc: "Gerencial e exportação" },
    ],
  },
  {
    title: "Cartão Frota",
    items: [
      { href: "/frota", label: "Plataforma (hub)", icon: CreditCard, desc: "Três painéis em um lugar" },
      { href: "/frota/cliente", label: "Painel do Cliente", icon: Building2, desc: "Transportadora / gestor" },
      { href: "/frota/motorista", label: "Painel do Motorista", icon: Truck, desc: "Saldo e abastecimentos" },
      { href: "/frota/posto", label: "Gestão do Posto", icon: Store, desc: "Rede credenciada" },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/simular", label: "Simular abastecimento", icon: Zap, desc: "Gerar evento de teste" },
      { href: "/anomalias", label: "Anomalias", icon: AlertTriangle, desc: "Transações suspeitas" },
      { href: "/multas", label: "Multas & Infrações", icon: FileWarning, desc: "Prazos e pontuação" },
      { href: "/vistoria", label: "Vistoria / Check-list", icon: ClipboardCheck, desc: "Check-in e check-out" },
      { href: "/ranking", label: "Ranking", icon: Trophy, desc: "Eficiência por motorista" },
      { href: "/auditoria", label: "Auditoria", icon: Shield, desc: "Trilha de alterações" },
      { href: "/diagnostico", label: "Diagnóstico", icon: Activity, desc: "Saúde do cadastro" },
    ],
  },
  {
    title: "Cadastros & Equipe",
    items: [
      { href: "/cadastros", label: "Cadastros da frota", icon: Database, desc: "Motoristas, veículos, bombas" },
      { href: "/usuarios", label: "Usuários & acessos", icon: Users, desc: "Liberar e definir papéis" },
    ],
  },
  {
    title: "Rede & Apps",
    items: [
      { href: "/postos", label: "Rede de Postos", icon: MapPin, desc: "Mapa e preços" },
      { href: "/app", label: "App do Motorista (PWA)", icon: Smartphone, desc: "Check-in pelo celular" },
      { href: "/totem", label: "Totem IoT", icon: Cpu, desc: "Autoatendimento no posto" },
      { href: "/pos", label: "Smart POS", icon: Scan, desc: "Maquininha inteligente" },
      { href: "/instalar", label: "Instalar (APK)", icon: Download, desc: "Gerar APK da POS e do Totem" },
      { href: "/motorista", label: "Vitrine", icon: Store, desc: "Página de demonstração" },
    ],
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex flex-none items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</span>
            <span className="hidden text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] sm:block">
              Aether IA · Abastecimento
            </span>
          </div>
        </Link>

        {/* Desktop: principais */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {primary.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-strong)]"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-strong)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-none items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 text-xs font-medium text-[color:var(--color-text-strong)] transition-colors hover:bg-[color:var(--color-surface-2)]"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>

      {/* Drawer completo (mobile e desktop) */}
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[92%] max-w-md flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl">
            {/* Cabeçalho do drawer */}
            <div className="flex flex-none items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
                  <Fuel className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</div>
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Todas as funcionalidades
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Lista rolável */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {groups.map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="mb-2 flex items-center gap-2 px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
                      {g.title}
                    </span>
                    <span className="h-px flex-1 bg-[color:var(--color-border)]" />
                  </div>
                  <ul className="space-y-1">
                    {g.items.map((l) => {
                      const active = pathname === l.href;
                      const Icon = l.icon;
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                              active
                                ? "bg-[color:var(--color-brand-soft)]"
                                : "hover:bg-[color:var(--color-surface-2)]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 flex-none items-center justify-center rounded-lg border",
                                active
                                  ? "border-transparent bg-[color:var(--color-brand)] text-black"
                                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span
                                className={cn(
                                  "block truncate text-sm font-medium",
                                  active ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-text-strong)]"
                                )}
                              >
                                {l.label}
                              </span>
                              {l.desc ? (
                                <span className="block truncate text-[11px] text-[color:var(--color-muted)]">
                                  {l.desc}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}

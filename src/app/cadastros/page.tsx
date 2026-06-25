import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Cpu,
  Fuel,
  MapPin,
  Truck,
  Users,
} from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Stats = Record<string, number>;

async function loadStats(): Promise<Stats> {
  const supabase = await createSupabaseServerClient();
  const [members, drivers, vehicles, yards, pumps, tanks] = await Promise.all([
    supabase.from("tenant_members").select("tenant_id").limit(1).maybeSingle(),
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("yards").select("*", { count: "exact", head: true }),
    supabase.from("pumps").select("*", { count: "exact", head: true }),
    supabase.from("tanks").select("*", { count: "exact", head: true }),
  ]);

  return {
    hasTenant: members.data ? 1 : 0,
    drivers: drivers.count ?? 0,
    vehicles: vehicles.count ?? 0,
    yards: yards.count ?? 0,
    pumps: pumps.count ?? 0,
    tanks: tanks.count ?? 0,
  };
}

export default async function CadastrosPage() {
  const stats = await loadStats();
  const hasTenant = stats.hasTenant === 1;

  const blocks = [
    {
      href: "/cadastros/empresa",
      icon: <Building2 className="h-5 w-5" />,
      title: "Empresa",
      desc: "Razão social, CNPJ e dados de cobrança.",
      count: hasTenant ? 1 : 0,
      ready: true,
      cta: hasTenant ? "Editar" : "Criar",
    },
    {
      href: "/cadastros/motoristas",
      icon: <Users className="h-5 w-5" />,
      title: "Motoristas",
      desc: "CPF, CNH, contato. Quem está habilitado a abastecer.",
      count: stats.drivers,
      ready: true,
      cta: "Gerenciar",
    },
    {
      href: "/cadastros/veiculos",
      icon: <Truck className="h-5 w-5" />,
      title: "Veículos",
      desc: "Placa, modelo, consumo médio, hodômetro atual.",
      count: stats.vehicles,
      ready: true,
      cta: "Gerenciar",
    },
    {
      href: "/cadastros/patios",
      icon: <MapPin className="h-5 w-5" />,
      title: "Pátios",
      desc: "Bases onde ficam as bombas e tanques.",
      count: stats.yards,
      ready: true,
      cta: "Gerenciar",
    },
    {
      href: "/cadastros/tanques",
      icon: <Fuel className="h-5 w-5" />,
      title: "Tanques",
      desc: "Tipo de combustível, capacidade, pátio onde está.",
      count: stats.tanks,
      ready: true,
      cta: "Gerenciar",
    },
    {
      href: "/cadastros/bombas",
      icon: <Cpu className="h-5 w-5" />,
      title: "Bombas",
      desc: "Bombas físicas (com ou sem Totem IoT instalado).",
      count: stats.pumps,
      ready: true,
      cta: "Gerenciar",
    },
  ];

  return (
    <SectionShell
      badge="Cadastros"
      title="Configurar a frota"
      description="Cadastre empresa, frota e infraestrutura. Os dados ficam salvos no Supabase e alimentam todas as telas do portal."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => (
          <Card key={b.href} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                {b.icon}
              </div>
              {b.ready ? (
                <Badge variant={b.count > 0 ? "success" : "outline"}>
                  {b.count > 0 ? `${b.count} ativo` : "0 cadastrado"}
                </Badge>
              ) : (
                <Badge variant="warning">A2</Badge>
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-[color:var(--color-text-strong)]">{b.title}</h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">{b.desc}</p>

            {b.ready ? (
              <Link
                href={b.href}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-brand)] hover:underline"
              >
                {b.cta} <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <div className="mt-4 text-xs text-[color:var(--color-muted)]">{b.cta}</div>
            )}
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}

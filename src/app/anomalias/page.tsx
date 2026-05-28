import { AlertTriangle, Camera, Eye, Filter, Video } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const cases = [
  {
    id: "ANM-2418",
    when: "Hoje · 14h22",
    pump: "Pátio MRL · Bomba 01",
    placa: "RIO-1A88",
    motorista: "Edna Pacheco",
    tipo: "Recipiente fora do padrão",
    descricao:
      "A IA identificou um balde plástico no enquadramento do bico. A bomba foi cortada antes de iniciar o fluxo.",
    severidade: "Crítica",
    tone: "danger" as const,
  },
  {
    id: "ANM-2417",
    when: "Hoje · 09h08",
    pump: "Pátio MRL · Bomba 03",
    placa: "BRA-9X12",
    motorista: "Cleber Marques",
    tipo: "Placa divergente",
    descricao:
      "Placa lida pelo ALPR (BRA-9X12) não corresponde à autorizada no app (BRA-9X21). Liberação negada.",
    severidade: "Alta",
    tone: "warning" as const,
  },
  {
    id: "ANM-2415",
    when: "Ontem · 22h41",
    pump: "Posto Parceiro · BR-381",
    placa: "BRA-5C04",
    motorista: "Júlio Andrade",
    tipo: "Volume acima da cota",
    descricao:
      "Solicitação de 320L em rota cuja cota dinâmica era 240L. Autorização rejeitada pelo Smart POS.",
    severidade: "Média",
    tone: "info" as const,
  },
  {
    id: "ANM-2412",
    when: "Ontem · 17h05",
    pump: "Pátio MRL · Bomba 02",
    placa: "BRA-7K22",
    motorista: "Antônio Lima",
    tipo: "Tentativa fora do horário",
    descricao:
      "Acesso solicitado às 02h17, fora da janela operacional. Token expirado e bomba desenergizada.",
    severidade: "Baixa",
    tone: "default" as const,
  },
];

export default function AnomaliasPage() {
  return (
    <SectionShell
      badge="Anomalias"
      title="Alertas em vídeo & auditoria"
      description="Cada caso é registrado com o trecho de vídeo, motorista, placa e parâmetros lidos pela IA no instante do bloqueio."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Badge variant="danger">
            <AlertTriangle className="h-3 w-3" />
            2 críticas hoje
          </Badge>
          <Badge variant="warning">3 médias / altas</Badge>
        </div>
        <span className="text-xs text-[color:var(--color-muted)]">
          Total no mês: <span className="text-white">37 bloqueios</span>
        </span>
      </div>

      <div className="grid gap-4">
        {cases.map((c) => (
          <Card key={c.id} className="grid gap-0 md:grid-cols-[280px_1fr]">
            {/* Vídeo mock */}
            <div className="relative aspect-video md:aspect-auto border-b border-[color:var(--color-border)] bg-black md:border-b-0 md:border-r">
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-25">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-white/10" />
                ))}
              </div>
              <Video className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/30" />
              <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white">
                <Camera className="h-3 w-3 text-[color:var(--color-brand)]" />
                ALPR
              </div>
              <div className="absolute left-2 bottom-2 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
                {c.placa}
              </div>
            </div>

            {/* Detalhes */}
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[color:var(--color-muted)]">{c.id}</span>
                  <Badge variant={c.tone}>{c.severidade}</Badge>
                </div>
                <span className="text-xs text-[color:var(--color-muted)]">{c.when}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">{c.tipo}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">{c.descricao}</p>

              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <Field label="Local" value={c.pump} />
                <Field label="Placa" value={c.placa} mono />
                <Field label="Motorista" value={c.motorista} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-3.5 w-3.5" />
                  Ver vídeo completo
                </Button>
                <Button size="sm" variant="outline">
                  Exportar evidência
                </Button>
                <Button size="sm" variant="danger">
                  Abrir ocorrência
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={`mt-0.5 text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

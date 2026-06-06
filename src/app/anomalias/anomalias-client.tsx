"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, Download, Eye, Filter, Video, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { timeAgo } from "@/lib/utils";
import { ResolveButton } from "./resolve-button";

const TIPO_LABEL: Record<string, string> = {
  CONTAINER_PATTERN: "Recipiente fora do padrão",
  PLATE_MISMATCH: "Placa divergente",
  QUOTA_EXCEEDED: "Volume acima da cota",
  OFFHOURS: "Fora do horário",
  TANK_DRAIN: "Drenagem de tanque",
  COMM_LOSS: "Perda de comunicação",
};

const SEV_TONE: Record<string, "danger" | "warning" | "info" | "outline"> = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

export type AnomalyRow = {
  id: string;
  type: string;
  severity: string;
  description: string | null;
  detected_at: string;
  resolved_at: string | null;
  local: string;
  motorista: string;
  placa: string;
};

export function AnomaliasClient({ rows }: { rows: AnomalyRow[] }) {
  const [sev, setSev] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [tipo, setTipo] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (sev !== "ALL" && r.severity !== sev) return false;
      if (status === "OPEN" && r.resolved_at) return false;
      if (status === "RESOLVED" && !r.resolved_at) return false;
      if (tipo !== "ALL" && r.type !== tipo) return false;
      return true;
    });
  }, [rows, sev, status, tipo]);

  function exportCsv() {
    const head = ["id", "tipo", "severidade", "local", "placa", "motorista", "detectado_em", "resolvido_em", "descricao"];
    const lines = filtered.map((r) =>
      [
        r.id,
        TIPO_LABEL[r.type] ?? r.type,
        r.severity,
        r.local,
        r.placa,
        r.motorista,
        new Date(r.detected_at).toLocaleString("pt-BR"),
        r.resolved_at ? new Date(r.resolved_at).toLocaleString("pt-BR") : "",
        (r.description ?? "").replace(/"/g, "'"),
      ]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anomalias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const critOpen = filtered.filter((r) => r.severity === "CRITICAL" && !r.resolved_at).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)]">
            <Filter className="h-3.5 w-3.5" /> Filtros:
          </span>
          <Select value={sev} onChange={(e) => setSev(e.target.value)} className="h-8 w-auto py-1 text-xs">
            <option value="ALL">Toda severidade</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-auto py-1 text-xs">
            <option value="ALL">Todos status</option>
            <option value="OPEN">Abertas</option>
            <option value="RESOLVED">Resolvidas</option>
          </Select>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-8 w-auto py-1 text-xs">
            <option value="ALL">Todo tipo</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          {critOpen > 0 ? (
            <Badge variant="danger">
              <AlertTriangle className="h-3 w-3" />
              {critOpen} crítica{critOpen === 1 ? "" : "s"} aberta{critOpen === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[color:var(--color-muted)]">
            {filtered.length} de {rows.length}
          </span>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] p-3 text-[color:var(--color-brand)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">
            {rows.length === 0 ? "Sem anomalias registradas" : "Nenhuma anomalia com esses filtros"}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {rows.length === 0
              ? "Quando a IA bloquear uma tentativa, ela aparece aqui automaticamente."
              : "Ajuste os filtros acima para ver mais resultados."}
          </p>
          {rows.length === 0 ? (
            <Link
              href="/simular"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white"
            >
              <Zap className="h-3 w-3" />
              Simular um bloqueio
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => {
            const tone = SEV_TONE[c.severity] ?? "outline";
            const resolved = Boolean(c.resolved_at);
            return (
              <Card key={c.id} className="grid gap-0 md:grid-cols-[280px_1fr]">
                <div className="relative aspect-video border-b border-[color:var(--color-border)] bg-black md:aspect-auto md:border-b-0 md:border-r">
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

                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[color:var(--color-muted)]">
                        ANM-{c.id.slice(0, 4).toUpperCase()}
                      </span>
                      <Badge variant={tone}>{c.severity}</Badge>
                      {resolved ? <Badge variant="success">Resolvida</Badge> : null}
                    </div>
                    <span className="text-xs text-[color:var(--color-muted)]">{timeAgo(c.detected_at)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{TIPO_LABEL[c.type] ?? c.type}</h3>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">{c.description ?? "Sem descrição."}</p>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <Field label="Local" value={c.local} />
                    <Field label="Placa" value={c.placa} mono />
                    <Field label="Motorista" value={c.motorista} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled title="Disponível quando o Totem IoT estiver instalado (Fase B)">
                      <Eye className="h-3.5 w-3.5" />
                      Vídeo completo (Fase B)
                    </Button>
                    {!resolved ? <ResolveButton id={c.id} /> : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">{label}</div>
      <div className={`mt-0.5 text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

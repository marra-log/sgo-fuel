"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { parseNFe } from "@/lib/nfe";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber } from "@/lib/utils";

type Tank = { id: string; name: string; fuel_type: string };

type Preview = {
  fileName: string;
  accessKey: string | null;
  supplier: string | null;
  issuedAt: string | null;
  volumeL: number;
  valueBRL: number;
  fuelGuess: string | null;
  warnings: string[];
};

export function XmlUpload({ tanks }: { tanks: Tank[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [tankId, setTankId] = useState<string>(tanks[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    const text = await file.text();
    const parsed = parseNFe(text, file.name);
    setPreview({
      fileName: file.name,
      accessKey: parsed.accessKey,
      supplier: parsed.supplier,
      issuedAt: parsed.issuedAt,
      volumeL: parsed.volumeL,
      valueBRL: parsed.valueBRL,
      fuelGuess: parsed.fuelGuess,
      warnings: parsed.warnings,
    });
    // auto-seleciona tanque com combustível compatível
    if (parsed.fuelGuess) {
      const match = tanks.find((t) => t.fuel_type === parsed.fuelGuess);
      if (match) setTankId(match.id);
    }
  }

  async function onSave() {
    if (!preview) return;
    if (!preview.accessKey) {
      setMsg({ kind: "err", text: "XML sem chave de acesso válida (44 dígitos). Confira o arquivo." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1)
      .maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setMsg({ kind: "err", text: "Sua conta ainda não tem empresa." });
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("fiscal_invoices").insert({
      tenant_id: tenantId,
      tank_id: tankId || null,
      access_key: preview.accessKey,
      supplier: preview.supplier,
      volume_l: preview.volumeL,
      value_brl: preview.valueBRL,
      issued_at: preview.issuedAt,
    });

    if (error) {
      setMsg({ kind: "err", text: traduzSupabaseError(error.message) });
      setBusy(false);
      return;
    }

    setMsg({ kind: "ok", text: "NFe importada e conciliada." });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={onFile}
          className="hidden"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Selecionar XML da NFe
        </Button>
        {tanks.length === 0 ? (
          <span className="text-xs text-[color:var(--color-warning)]">
            Cadastre um tanque antes para vincular a nota.
          </span>
        ) : null}
      </div>

      {preview ? (
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[color:var(--color-brand)]" />
            <span className="text-sm font-medium text-white">{preview.fileName}</span>
            {preview.fuelGuess ? <Badge variant="info">{preview.fuelGuess}</Badge> : null}
          </div>

          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Fornecedor" value={preview.supplier ?? "—"} />
            <Info label="Volume" value={`${formatNumber(preview.volumeL)} L`} mono />
            <Info label="Valor" value={formatBRL(preview.valueBRL)} mono />
            <Info
              label="Emissão"
              value={preview.issuedAt ? new Date(preview.issuedAt).toLocaleDateString("pt-BR") : "—"}
            />
            <Info label="Chave" value={preview.accessKey ?? "—"} mono className="sm:col-span-2 lg:col-span-4" />
          </div>

          {preview.warnings.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[11px] text-[color:var(--color-warning)]">
              {preview.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Vincular ao tanque
              </span>
              <Select value={tankId} onChange={(e) => setTankId(e.target.value)} className="min-w-[220px]">
                <option value="">— sem vínculo —</option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </label>
            <Button type="button" onClick={onSave} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? "Importando…" : "Importar NFe"}
            </Button>
          </div>
        </div>
      ) : null}

      {msg ? (
        <div
          className={
            msg.kind === "ok"
              ? "rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-2 text-sm text-[color:var(--color-brand)]"
              : "rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]"
          }
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">{label}</div>
      <div className={`mt-0.5 break-all text-white ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</div>
    </div>
  );
}

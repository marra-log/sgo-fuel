"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { resolveTenantId } from "@/lib/supabase/tenant-client";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type DriverFormData = {
  id?: string;
  name?: string | null;
  cpf?: string | null;
  phone?: string | null;
  cnh?: string | null;
  score?: number | null;
  active?: boolean | null;
};

export function DriverForm({ initial }: { initial?: DriverFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [cpf, setCpf] = useState(initial?.cpf ?? "");
  const [cnh, setCnh] = useState(initial?.cnh ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [active, setActive] = useState<boolean>(initial?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    try {
      const payload = {
        name,
        cpf: cpf || null,
        cnh: cnh || null,
        phone: phone || null,
        active,
      };

      if (editing && initial?.id) {
        const { error } = await supabase.from("drivers").update(payload).eq("id", initial.id);
        if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); return; }
        setMsg({ kind: "ok", text: "Motorista atualizado." });
        router.refresh();
      } else {
        const { tenantId, error: terr } = await resolveTenantId(supabase);
        if (!tenantId) { setMsg({ kind: "err", text: terr ?? "Empresa não encontrada." }); return; }
        const { error } = await supabase.from("drivers").insert({ ...payload, tenant_id: tenantId });
        if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); return; }
        router.push("/cadastros/motoristas");
        router.refresh();
      }
    } catch (err) {
      setMsg({ kind: "err", text: "Erro inesperado: " + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Nome completo" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="João da Silva" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="CPF">
          <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
        </FormField>
        <FormField label="CNH">
          <Input value={cnh} onChange={(e) => setCnh(e.target.value)} placeholder="12345678901" />
        </FormField>
      </div>
      <FormField label="Telefone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(31) 99999-9999" />
      </FormField>
      <FormField label="Status">
        <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-strong)]">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-brand)]"
          />
          Motorista ativo (pode autorizar abastecimentos)
        </label>
      </FormField>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="drivers" id={initial.id} redirectTo="/cadastros/motoristas" />
        ) : (
          <span />
        )}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar motorista"}
        </Button>
      </div>
    </form>
  );
}

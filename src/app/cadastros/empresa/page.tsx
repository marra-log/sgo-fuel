"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";

type TenantRow = {
  id: string;
  name: string;
  cnpj: string | null;
  plan: string;
  created_at: string;
};

export default function EmpresaPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        // A rota é protegida pelo middleware — se chegou aqui, está logado.
        // Consultamos direto (a sessão via cookie autentica o RLS).
        const { data, error } = await supabase
          .from("tenants")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (error) {
          setMsg({ kind: "err", text: traduzSupabaseError(error.message) });
        } else if (data) {
          setTenant(data);
          setName(data.name);
          setCnpj(data.cnpj ?? "");
        }
      } catch (e) {
        setMsg({ kind: "err", text: "Falha ao carregar: " + (e instanceof Error ? e.message : String(e)) });
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    try {
      if (tenant) {
        const { error } = await supabase
          .from("tenants")
          .update({ name, cnpj: cnpj || null })
          .eq("id", tenant.id);
        if (error) {
          setMsg({ kind: "err", text: traduzSupabaseError(error.message) });
          return;
        }
        setMsg({ kind: "ok", text: "Empresa atualizada." });
        setTenant({ ...tenant, name, cnpj: cnpj || null });
      } else {
        const { data, error } = await supabase
          .from("tenants")
          .insert({ name, cnpj: cnpj || null })
          .select()
          .single();
        if (error) {
          const isRls = /row-level security|violates row-level/i.test(error.message);
          setMsg({
            kind: "err",
            text: isRls
              ? "O banco está bloqueando a criação de empresas (falta a policy tenants_insert). " +
                "Correção: abra o SQL Editor do Supabase (projeto jozeyczhxdcfvtvumiph) e rode o arquivo supabase/fix-rls.sql do repositório. " +
                "Depois volte aqui e clique em Criar empresa de novo."
              : traduzSupabaseError(error.message),
          });
          return;
        }
        setTenant(data);
        setMsg({ kind: "ok", text: "Empresa criada — você é o OWNER. Redirecionando…" });
        router.refresh();
        router.push("/dashboard");
      }
    } catch (e) {
      setMsg({ kind: "err", text: "Erro inesperado: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell
      badge="Cadastros · Empresa"
      title="Dados da sua empresa"
      description="A empresa (tenant) é o nó raiz dos seus dados. Tudo no portal — motoristas, veículos, eventos — pertence a ela."
    >
      <div className="mb-4">
        <Link
          href="/cadastros"
          className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para cadastros
        </Link>
      </div>

      <Card className="max-w-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">
              {tenant ? "Editar empresa" : "Criar empresa"}
            </h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              {tenant
                ? `Criada em ${new Date(tenant.created_at).toLocaleDateString("pt-BR")}`
                : "Primeira vez aqui — vamos criar sua conta corporativa"}
            </p>
          </div>
          {tenant ? (
            <Badge variant="success" className="ml-auto">
              Plano {tenant.plan}
            </Badge>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-[color:var(--color-muted)]">Carregando…</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field
              label="Nome da empresa"
              value={name}
              onChange={setName}
              required
              placeholder="TransCargo Logística Ltda"
            />
            <Field
              label="CNPJ"
              value={cnpj}
              onChange={setCnpj}
              placeholder="00.000.000/0001-00"
            />

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

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Salvando…" : tenant ? "Salvar alterações" : "Criar empresa"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </SectionShell>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-brand)]"
      />
    </label>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Fuel, Lock, Mail, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function CadastroPage() {
  const router = useRouter();

  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    // 1) Cria o usuário
    const { data: signupData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nome },
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      },
    });

    if (signUpError) {
      setError(traduzErro(signUpError.message));
      setLoading(false);
      return;
    }

    // Se a confirmação por e-mail estiver ativa no Supabase, não vamos ter sessão ainda.
    // Nesse caso, mostramos a tela de "confirme seu e-mail" e o tenant será criado no
    // primeiro login. (Pra MVP é mais simples desabilitar a confirmação em Auth → Settings.)
    if (!signupData.session) {
      setDone(true);
      setLoading(false);
      return;
    }

    // 2) Cria o tenant — o trigger SQL transforma o usuário em OWNER automaticamente
    const { error: tenantError } = await supabase
      .from("tenants")
      .insert({ name: empresa, cnpj: cnpj || null });

    if (tenantError) {
      setError("Conta criada, mas falhou ao criar empresa: " + tenantError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (done) {
    return (
      <div className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-white">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            Enviamos um link de confirmação para <span className="text-white">{email}</span>.
            Após confirmar, faça login para criar sua empresa.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-[color:var(--color-brand)] hover:underline">
            Ir para o login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-white">SGO-Fuel</div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Cadastrar empresa
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <h1 className="text-xl font-semibold text-white">Criar conta</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Cadastre sua transportadora e comece a operar.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field
              icon={<Building2 className="h-4 w-4" />}
              label="Nome da empresa"
              value={empresa}
              onChange={setEmpresa}
              required
            />
            <Field
              icon={<Building2 className="h-4 w-4" />}
              label="CNPJ (opcional)"
              value={cnpj}
              onChange={setCnpj}
              placeholder="00.000.000/0001-00"
            />
            <Field
              icon={<User className="h-4 w-4" />}
              label="Seu nome"
              value={nome}
              onChange={setNome}
              autoComplete="name"
              required
            />
            <Field
              icon={<Mail className="h-4 w-4" />}
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Senha (mín. 8 caracteres)"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              required
            />

            {error ? (
              <div className="rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Criando conta…" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4 text-center text-sm">
            <span className="text-[color:var(--color-muted)]">Já tem conta? </span>
            <Link
              href="/login"
              className="font-medium text-[color:var(--color-brand)] hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 focus-within:border-[color:var(--color-brand)]">
        <span className="text-[color:var(--color-muted)]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[color:var(--color-muted)]"
        />
      </div>
    </label>
  );
}

function traduzErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Este e-mail já está cadastrado. Tente fazer login.";
  if (m.includes("password should be at least"))
    return "Senha deve ter pelo menos 8 caracteres.";
  if (m.includes("invalid email")) return "E-mail inválido.";
  return msg;
}

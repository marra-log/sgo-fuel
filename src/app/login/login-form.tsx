"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(traduzErro(error.message));
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field
        icon={<Mail className="h-4 w-4" />}
        label="E-mail"
        type="email"
        value={email}
        onChange={(v) => setEmail(v)}
        autoComplete="email"
        required
      />
      <Field
        icon={<Lock className="h-4 w-4" />}
        label="Senha"
        type="password"
        value={password}
        onChange={(v) => setPassword(v)}
        autoComplete="current-password"
        required
      />

      {error ? (
        <div className="rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
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
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
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
          className="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)]"
        />
      </div>
    </label>
  );
}

function traduzErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos. Se acabou de cadastrar, confira no Supabase se 'Confirm email' está desligado (Auth → Providers → Email).";
  if (m.includes("email not confirmed"))
    return "E-mail não confirmado. Verifique sua caixa de entrada OU desligue 'Confirm email' no Supabase (Auth → Providers → Email).";
  if (m.includes("rate limit")) return "Muitas tentativas. Tente novamente em alguns minutos.";
  return msg;
}

import { Suspense } from "react";
import Link from "next/link";
import { Fuel } from "lucide-react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Aether IA · Portal do Gestor
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <h1 className="text-xl font-semibold text-[color:var(--color-text-strong)]">Entrar</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Acesse o painel da sua empresa.
          </p>

          <Suspense
            fallback={
              <div className="mt-6 text-sm text-[color:var(--color-muted)]">Carregando…</div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4 text-center text-sm">
            <span className="text-[color:var(--color-muted)]">Não tem conta? </span>
            <Link
              href="/cadastro"
              className="font-medium text-[color:var(--color-brand)] hover:underline"
            >
              Cadastre sua empresa
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[color:var(--color-muted)]">
          <Link href="/" className="hover:underline">
            ← Voltar para a apresentação do produto
          </Link>
        </div>
      </div>
    </div>
  );
}

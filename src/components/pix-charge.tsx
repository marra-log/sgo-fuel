"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode, Settings } from "lucide-react";
import { gerarPixCopiaECola } from "@/lib/pix";

type PixConfig = { chave: string; nome: string; cidade: string };
const STORE = "sgo_pix_config";

function loadConfig(): PixConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as PixConfig) : null;
  } catch {
    return null;
  }
}

export function PixCharge({ valor, txid }: { valor: number; txid?: string }) {
  const [cfg, setCfg] = useState<PixConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [chave, setChave] = useState("");
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = loadConfig();
    if (c) {
      setCfg(c);
      setChave(c.chave);
      setNome(c.nome);
      setCidade(c.cidade);
    } else {
      setEditing(true);
    }
  }, []);

  function save() {
    const c = { chave: chave.trim(), nome: nome.trim(), cidade: cidade.trim() };
    localStorage.setItem(STORE, JSON.stringify(c));
    setCfg(c);
    setEditing(false);
  }

  if (editing || !cfg) {
    return (
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-text-strong)]">
          <Settings className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
          Configurar chave Pix (recebedor)
        </div>
        <div className="mt-2 space-y-2">
          <input value={chave} onChange={(e) => setChave(e.target.value)} placeholder="Chave Pix (CNPJ, e-mail, telefone…)"
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" />
          <div className="grid grid-cols-2 gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do recebedor"
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" />
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade"
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" />
          </div>
          <button onClick={save} disabled={!chave || !nome || !cidade}
            className="w-full rounded-md bg-[color:var(--color-brand)] py-1.5 text-xs font-semibold text-black disabled:opacity-50">
            Salvar e gerar Pix
          </button>
        </div>
      </div>
    );
  }

  const code = gerarPixCopiaECola({ chave: cfg.chave, nome: cfg.nome, cidade: cfg.cidade, valor, txid });

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-brand)]">
          <QrCode className="h-3.5 w-3.5" />
          Cobrar via Pix · {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        <button onClick={() => setEditing(true)} className="text-[10px] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
          trocar chave
        </button>
      </div>
      <div className="mt-3 flex flex-col items-center gap-3">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={code} size={150} />
        </div>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs text-[color:var(--color-text-strong)]">
          {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--color-brand)]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado!" : "Copiar Pix Copia e Cola"}
        </button>
        <div className="text-center text-[10px] text-[color:var(--color-muted)]">
          Recebedor: {cfg.nome} · {cfg.cidade}
        </div>
      </div>
    </div>
  );
}

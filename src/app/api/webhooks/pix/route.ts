import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Status que diferentes PSPs usam para "pago"
const PAID = new Set([
  "PAID",
  "CONFIRMED",
  "RECEIVED",
  "COMPLETED",
  "CONCLUIDA",
  "APPROVED",
]);
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "pix.received"]);

type Payload = Record<string, unknown> & {
  txid?: string;
  externalReference?: string;
  status?: string;
  event?: string;
  payment?: { externalReference?: string; status?: string };
  pix?: Array<{ txid?: string; status?: string }>;
};

function pick(body: Payload) {
  const txid =
    body.txid ||
    body.externalReference ||
    body.payment?.externalReference ||
    body.pix?.[0]?.txid ||
    null;
  const status = String(body.status || body.payment?.status || body.pix?.[0]?.status || "").toUpperCase();
  const event = String(body.event || "");
  const paid = PAID.has(status) || PAID_EVENTS.has(event) || PAID_EVENTS.has(body.event ?? "");
  return { txid, paid };
}

export async function POST(req: Request) {
  // Autenticação simples por segredo compartilhado (header ou query).
  const secret = process.env.PIX_WEBHOOK_SECRET;
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-webhook-secret") || req.headers.get("asaas-access-token");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY não configurada — adicione no Vercel para ativar o crédito automático." },
      { status: 503 }
    );
  }

  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const { txid, paid } = pick(body);
  if (!txid) return NextResponse.json({ error: "txid ausente" }, { status: 400 });
  if (!paid) return NextResponse.json({ ok: true, ignored: true, reason: "status não é pago" });

  const { data, error } = await admin.rpc("fn_confirm_pix", { p_txid: txid });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, result: data });
}

// Alguns PSPs validam o endpoint com GET.
export async function GET() {
  return NextResponse.json({ ok: true, service: "sgo-fuel pix webhook" });
}

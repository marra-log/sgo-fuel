import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Identifica a versão publicada (commit do deploy na Vercel).
export async function GET() {
  const v =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    "dev";
  return NextResponse.json({ v }, { headers: { "Cache-Control": "no-store" } });
}

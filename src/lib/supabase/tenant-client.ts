"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve o tenant do usuário logado no client, de forma robusta:
 * nunca lança — devolve { tenantId } ou { error } com mensagem acionável.
 * Usado por todos os formulários de cadastro antes de um INSERT.
 */
export async function resolveTenantId(
  supabase: SupabaseClient
): Promise<{ tenantId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      return { tenantId: null, error: "Falha ao identificar sua empresa: " + error.message };
    }
    if (!data?.tenant_id) {
      return {
        tenantId: null,
        error:
          "Sua conta ainda não tem empresa vinculada. Vá em Cadastros → Empresa e crie a sua (ou peça ao dono para te liberar em /usuarios).",
      };
    }
    return { tenantId: data.tenant_id, error: null };
  } catch (e) {
    return {
      tenantId: null,
      error: "Erro de conexão ao identificar a empresa: " + (e instanceof Error ? e.message : String(e)),
    };
  }
}

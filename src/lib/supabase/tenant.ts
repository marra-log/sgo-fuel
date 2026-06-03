import { createSupabaseServerClient } from "./server";

/**
 * Resolve o tenant atual do usuário logado.
 * Para o MVP cada usuário tem 1 tenant. Quando houver múltiplos,
 * trocar pra ler de cookie/header o tenant selecionado.
 */
export async function getCurrentTenant() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, name)")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const tenant = data.tenants as unknown as { id: string; name: string } | null;
  return {
    tenantId: data.tenant_id as string,
    role: data.role as string,
    name: tenant?.name ?? "—",
    user,
  };
}

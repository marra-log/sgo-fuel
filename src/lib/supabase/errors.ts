/**
 * Traduz mensagens de erro do Supabase pra português, com ações claras.
 */
export function traduzSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("row-level security") || m.includes("violates row-level")) {
    return (
      "Permissão negada (RLS). Sua conta provavelmente ainda não tem empresa vinculada. " +
      "Vá em /cadastros/empresa, crie a empresa, depois tente de novo. " +
      "Se já criou, abra /diagnostico para ver o que está acontecendo."
    );
  }
  if (m.includes("duplicate key") && m.includes("plate")) {
    return "Já existe um veículo com essa placa nesta empresa.";
  }
  if (m.includes("duplicate key") && m.includes("serial")) {
    return "Já existe uma bomba com esse serial nesta empresa.";
  }
  if (m.includes("duplicate key") && m.includes("cnpj")) {
    return "Já existe uma empresa cadastrada com esse CNPJ.";
  }
  if (m.includes("duplicate key")) {
    return "Já existe um registro igual.";
  }
  if (m.includes("not null") || m.includes("null value")) {
    return "Faltou preencher algum campo obrigatório.";
  }
  if (m.includes("foreign key")) {
    return "Falha de vínculo: confira se os itens relacionados (pátio, tanque, motorista) ainda existem.";
  }
  return msg;
}

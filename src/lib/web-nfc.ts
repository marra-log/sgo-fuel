// Helper da Web NFC API. Funciona em Chrome para Android (HTTPS + gesto do usuário).
// Em iOS/desktop não existe — o componente cai no modo manual.

export function isWebNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Normaliza o UID pra casar entre leitura (vem com ":") e cadastro.
export function normalizeUid(uid: string): string {
  return uid.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export type NfcScan = {
  stop: () => void;
};

/**
 * Inicia o scan e chama onRead com o UID da primeira tag aproximada, depois para.
 * Retorna um controle para cancelar manualmente.
 */
export async function scanNfcOnce(
  onRead: (uid: string) => void,
  onError?: (msg: string) => void
): Promise<NfcScan> {
  if (!isWebNfcSupported() || !window.NDEFReader) {
    onError?.("Este aparelho/navegador não suporta NFC web. Use o Chrome no Android.");
    return { stop: () => {} };
  }

  const controller = new AbortController();
  try {
    const reader = new window.NDEFReader();
    await reader.scan({ signal: controller.signal });

    reader.addEventListener("reading", (ev) => {
      const uid = normalizeUid(ev.serialNumber || "");
      onRead(uid);
      controller.abort(); // para após a primeira leitura
    });
    reader.addEventListener("readingerror", () => {
      onError?.("Não consegui ler a tag. Tente aproximar de novo.");
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao iniciar o NFC.";
    if (msg.toLowerCase().includes("permission")) {
      onError?.("Permissão de NFC negada. Habilite o NFC e permita o acesso.");
    } else {
      onError?.(msg);
    }
    return { stop: () => controller.abort() };
  }

  return { stop: () => controller.abort() };
}

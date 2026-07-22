"use client";

/**
 * Último recurso: erro no próprio layout raiz. Precisa renderizar <html>/<body>
 * porque substitui o documento inteiro. Sem dependências de tema/CSS.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090b",
          color: "#e6e8ea",
          fontFamily: "ui-sans-serif, system-ui, Arial, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#19c37d",
              margin: "0 auto 16px",
            }}
          />
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>SGO-Fuel indisponível no momento</h1>
          <p style={{ fontSize: 14, color: "#9aa3ad", margin: "0 0 20px" }}>
            Ocorreu uma falha inesperada ao carregar o sistema. Nenhum dado foi alterado.
            {error?.digest ? ` (ref: ${error.digest})` : ""}
          </p>
          <button
            onClick={reset}
            style={{
              background: "#19c37d",
              color: "#000",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}

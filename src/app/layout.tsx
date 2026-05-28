import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGO-Fuel — Gestão Inteligente de Abastecimento",
  description:
    "Ecossistema com IoT + Visão Computacional para prevenção ativa de fraudes de combustível em frotas e pátios.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

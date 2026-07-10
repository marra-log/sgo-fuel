import type { Metadata } from "next";
import "./globals.css";
import { UpdateWatchdog } from "@/components/update-watchdog";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('sgo_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        {children}
        <UpdateWatchdog />
      </body>
    </html>
  );
}

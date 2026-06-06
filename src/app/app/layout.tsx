import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "SGO-Fuel · Motorista",
  description: "Cota, check-in e histórico de abastecimento.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SGO-Fuel",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[color:var(--color-background)]">
      <PwaRegister />
      {children}
    </div>
  );
}

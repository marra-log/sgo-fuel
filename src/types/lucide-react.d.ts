// Fallback ambient module declaration.
// A versão atual de lucide-react publicada não traz o .d.ts no path declarado
// no package.json. Como usamos os ícones como componentes, basta tipá-los como
// componentes React que aceitam SVG props.
declare module "lucide-react" {
  import * as React from "react";
  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  };
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Ícones usados no projeto. Acrescente novos aqui caso o build reclame.
  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Award: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Battery: LucideIcon;
  export const Building2: LucideIcon;
  export const Camera: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Cpu: LucideIcon;
  export const Database: LucideIcon;
  export const Eye: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Fuel: LucideIcon;
  export const Gauge: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const Medal: LucideIcon;
  export const Menu: LucideIcon;
  export const Navigation: LucideIcon;
  export const Nfc: LucideIcon;
  export const PiggyBank: LucideIcon;
  export const Plug: LucideIcon;
  export const Power: LucideIcon;
  export const Radar: LucideIcon;
  export const Save: LucideIcon;
  export const Scan: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Signal: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Trophy: LucideIcon;
  export const Truck: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const Video: LucideIcon;
  export const Wifi: LucideIcon;
  export const X: LucideIcon;
}

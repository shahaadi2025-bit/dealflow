import {
  Cloud, CreditCard, Zap, HeartPulse, ShieldCheck, Server, ShoppingBag, Clapperboard, Cpu, Building2,
  Factory, Flame, Rocket, RadioTower, Sun, Landmark, Truck, Store, Stethoscope, Dna, Mountain, Plane,
  Apple, Umbrella, Plug, Car, Gamepad2, GraduationCap, Sprout, CircleDot, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  saas: Cloud, fintech: CreditCard, ev: Zap, healthcare: HeartPulse, cyber: ShieldCheck, cloud_infra: Server,
  consumer: ShoppingBag, media: Clapperboard, semis: Cpu, real_estate: Building2, industrials: Factory,
  energy: Flame, aerospace_defense: Rocket, telecom: RadioTower, renewables: Sun, financials: Landmark,
  logistics: Truck, ecommerce: Store, medtech: Stethoscope, biotech: Dna, materials: Mountain, travel: Plane,
  staples: Apple, insurance: Umbrella, utilities: Plug, autos: Car, gaming: Gamepad2, edtech: GraduationCap,
  agriculture: Sprout,
};

/** Stable, distinct hue per sector so tiles, chips and charts agree. */
export function sectorHue(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360;
  return (h * 7 + 200) % 360;
}

export function SectorIcon({ sector, size = 18, className = "" }: { sector: string; size?: number; className?: string }) {
  const Icon = ICONS[sector] || CircleDot;
  return <Icon size={size} className={className} />;
}

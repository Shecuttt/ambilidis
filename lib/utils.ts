import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Geographic distance (Haversine formula, km) ───────────────
// Dipakai di: app/page.tsx (discovery) dan app/checkout/page.tsx (ongkir)
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Rupiah formatter ─────────────────────────────────────────
// Contoh: formatRp(15000) → "Rp 15.000"
export function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ── Distance label ───────────────────────────────────────────
// Contoh: distanceLabel(0.5) → "500 m", distanceLabel(2.3) → "2.3 km"
export function distanceLabel(km: number): string {
  return km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toFixed(1)} km`;
}

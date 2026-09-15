import { Platform } from "react-native";

// Values that live outside Tailwind's class world: gradient stop arrays for
// expo-linear-gradient, navigation chrome, and layout metrics shared between
// the floating tab bar and the screens that must clear it. Everything here
// mirrors tailwind.config.js — change both together, nowhere else.

export const COLORS = {
  ink: "#08050F",
  surface: "#0C0817",
  card: "#17112A",
  cardElevated: "#241A3D",
  line: "rgba(255,255,255,0.09)",
  lineStrong: "rgba(255,255,255,0.16)",

  textPrimary: "#F7F5FF",
  textSecondary: "#AC9FC9",
  textTertiary: "#726690",

  brandDeep: "#2A0A45",
  brandViolet: "#5B21C9",
  brand: "#7B3FE4",
  brandOcean: "#2E7CDF",

  coral: "#FF6B81",
  success: "#3ECF8E",
  warn: "#F5A623",
  danger: "#E5484D",
} as const;

/** The signature header gradient — deep plum bleeding into azure. */
export const BRAND_GRADIENT = ["#2A0A45", "#5B21C9", "#2E7CDF"] as const;

/** Same family, tighter — used for fills (FAB, active pills, rings). */
export const BRAND_GRADIENT_VIVID = ["#7B3FE4", "#2E7CDF"] as const;

/** Cover-art scrim so overlaid captions stay legible on any artwork. */
export const ART_SCRIM = [
  "transparent",
  "rgba(8,5,15,0.15)",
  "rgba(8,5,15,0.80)",
] as const;

/** Deterministic placeholder gradients, keyed by a stable seed (title/slug). */
export const COVER_TONES: ReadonlyArray<readonly [string, string]> = [
  ["#3A1060", "#7B3FE4"],
  ["#12376B", "#2E7CDF"],
  ["#4A1050", "#B23FD8"],
  ["#0E2F55", "#3E9BE0"],
  ["#5A1A3C", "#E0517B"],
  ["#1B3A2F", "#3ECF8E"],
];

export const FONTS = {
  display: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" }),
} as const;

/** Metric contract for the floating pill tab bar. Screens clear it with TAB_BAR_CLEARANCE. */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_MARGIN = 16;
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 28;

/** Stable hash so a drama's placeholder art is identical on every device. */
export function seedIndex(seed: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return h % buckets;
}

export function coverTone(seed: string): readonly [string, string] {
  return COVER_TONES[seedIndex(seed, COVER_TONES.length)]!;
}

/**
 * Hallyu design tokens — the single source of visual truth for the prototype.
 *
 * Language: "Ink & Rose". A near-black neutral ink canvas (never purple-tinted)
 * so drama art and fan content are the brightest things on screen; one confident
 * rose accent for identity and action; warm hanji-paper light mode that is drawn,
 * not inverted. Type is Inter with heavy weight contrast and tight display
 * tracking; Korean set in Noto Sans KR. 4pt spacing grid, 20pt card radius,
 * hairlines only where lists need them.
 *
 * Every screen and component imports from here. Retuning the product's look is a
 * change to this file alone.
 */

export type ThemeName = "dark" | "light";

export interface Palette {
  /** App canvas. */
  canvas: string;
  /** Cards, sheets, tab bar. */
  surface: string;
  /** Inputs, elevated cards, pressed fills. */
  surfaceHigh: string;
  /** Subtle fill for chips / hover / skeletons. */
  fill: string;
  /** Hairline separators. */
  line: string;
  lineStrong: string;
  /** Scrim over artwork. */
  scrim: string;

  text: string;
  textDim: string;
  textFaint: string;
  /** Text guaranteed legible on `accent` fills. */
  onAccent: string;

  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentGlow: string;
  /** Deep ink-blue, the second stop of the rare brand gradient (taegeuk duo). */
  ink: string;

  success: string;
  warn: string;
  danger: string;
  dangerSoft: string;

  /** Skeleton shimmer base / highlight. */
  shimmer: string;
  shimmerHigh: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    canvas: "#0A0A0C",
    surface: "#141417",
    surfaceHigh: "#1C1C21",
    fill: "rgba(255,255,255,0.06)",
    line: "rgba(255,255,255,0.08)",
    lineStrong: "rgba(255,255,255,0.16)",
    scrim: "rgba(6,6,8,0.62)",
    text: "#F4F3F1",
    textDim: "#A8A6B0",
    textFaint: "#6F6D78",
    onAccent: "#FFFFFF",
    accent: "#E8465A",
    accentPressed: "#C22F44",
    accentSoft: "rgba(232,70,90,0.16)",
    accentGlow: "rgba(232,70,90,0.38)",
    ink: "#16233F",
    success: "#3ECF8E",
    warn: "#F5A623",
    danger: "#FF6B6B",
    dangerSoft: "rgba(255,107,107,0.14)",
    shimmer: "rgba(255,255,255,0.07)",
    shimmerHigh: "rgba(255,255,255,0.13)",
  },
  light: {
    canvas: "#F7F5F2",
    surface: "#FFFFFF",
    surfaceHigh: "#F0EDE8",
    fill: "rgba(24,20,16,0.05)",
    line: "rgba(24,20,16,0.10)",
    lineStrong: "rgba(24,20,16,0.18)",
    scrim: "rgba(20,16,14,0.55)",
    text: "#191619",
    textDim: "#5D5963",
    textFaint: "#8B8791",
    onAccent: "#FFFFFF",
    accent: "#C22F44",
    accentPressed: "#9E2236",
    accentSoft: "rgba(194,47,68,0.10)",
    accentGlow: "rgba(194,47,68,0.25)",
    ink: "#22335C",
    success: "#1F9D6B",
    warn: "#B9770E",
    danger: "#D33B3B",
    dangerSoft: "rgba(211,59,59,0.10)",
    shimmer: "rgba(24,20,16,0.06)",
    shimmerHigh: "rgba(24,20,16,0.11)",
  },
};

/** The rare brand gradient (wave moments: splash, hero art edges). */
export function brandGradient(p: Palette): [string, string, string] {
  return [p.ink, "#5A2233", p.accent];
}

/* ------------------------------- typography ------------------------------ */

/** Registered (expo-font) family names per weight, for React Native. */
export const RN_FAMILY: Record<string, string> = {
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  "800": "Inter_800ExtraBold",
};

export const RN_FAMILY_KR: Record<string, string> = {
  "500": "NotoSansKR_500Medium",
  "700": "NotoSansKR_700Bold",
};

/** Resolve a type token's weight (+ optional Korean flag) to a usable family. */
export function familyFor(weight: string, kr = false): string {
  return (kr ? RN_FAMILY_KR[weight] : RN_FAMILY[weight]) ?? RN_FAMILY["400"]!;
}

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  letterSpacing: number;
  /** Korean script flag — resolves to Noto Sans KR. */
  kr?: boolean;
}

const TYPE_DEF = {
  /** Splash wordmark, empty-state headlines. */
  displayXL: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1.1 },
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.9 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.6 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "700", letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400", letterSpacing: 0 },
  bodyEmph: { fontSize: 15, lineHeight: 22, fontWeight: "600", letterSpacing: -0.1 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400", letterSpacing: 0 },
  captionEmph: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0 },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600", letterSpacing: 0.6 },
  /** Korean display accents (한류). */
  krDisplay: { fontSize: 28, lineHeight: 36, fontWeight: "700", letterSpacing: 0, kr: true },
  krBody: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: 0, kr: true },
} as const satisfies Record<string, TypeStyle>;

export type TypeToken = keyof typeof TYPE_DEF;

/** Resolved table (optional keys present on every entry). */
export const TYPE: Record<TypeToken, TypeStyle> = TYPE_DEF;

/* --------------------------------- layout -------------------------------- */

export const SPACE = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
  max: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

/** Device metrics the prototype designs against (iPhone-class). */
export const DEVICE = {
  width: 390,
  height: 844,
  statusBar: 54,
  tabBar: 84,
  gutter: 16,
} as const;

/* --------------------------------- motion -------------------------------- */
/* Documented here and implemented in PrototypeApp / primitives. Previews are
 * static frames; these values are the contract for the production build. */

export const MOTION = {
  /** Pressed feedback: scale + quick spring back. */
  press: { scale: 0.97, duration: 120 },
  /** Screen enter: fade + rise. */
  screenEnter: { translateY: 12, duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  /** Reaction pop. */
  pop: { scale: 1.25, duration: 220, easing: "spring(300, 24)" },
  /** Skeleton sweep. */
  shimmer: { duration: 1400, easing: "linear" },
  /** Brand wave on splash / pull-to-refresh. */
  wave: { duration: 1800, easing: "ease-in-out" },
} as const;

/* ------------------------------- elevations ------------------------------ */

export const SHADOW = {
  card: { shadowColor: "#000000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  bar: { shadowColor: "#000000", shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: -4 } },
  fab: { shadowColor: "#000000", shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
} as const;

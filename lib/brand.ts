// Brand + runtime configuration (D-20): renaming or retuning is a one-file change.
export const BRAND = {
  name: "Hallyu",
  koreanName: "한류",
  tagline: "Where the Wave Lives",
  scheme: "hallyu",
  version: "0.1.0",
} as const;

export const EXPO_PUBLIC_CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

export const CONFIG_STATUS = {
  convex: EXPO_PUBLIC_CONVEX_URL.length > 0,
  tmdb: process.env.EXPO_PUBLIC_TMDB_CONFIGURED === "1",
  push: process.env.EXPO_PUBLIC_PUSH_CONFIGURED === "1",
  email: process.env.EXPO_PUBLIC_EMAIL_CONFIGURED === "1",
} as const;

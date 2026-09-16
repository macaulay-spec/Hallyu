import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./theme";

export type IconName = keyof typeof Ionicons.glyphMap;

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

/**
 * The product's iconography: Ionicons outline set at a consistent optical
 * weight, sized on a 4pt ladder. Filled variants only for active/selected
 * states so "on" reads instantly.
 */
export function Icon({
  name,
  size = "md",
  color,
  filled = false,
}: {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  filled?: boolean;
}) {
  const { p } = useTheme();
  const px = typeof size === "number" ? size : ICON_SIZE[size];
  return (
    <Ionicons
      name={filled ? ((`${name}`.replace("-outline", "") as IconName) ?? name) : name}
      size={px}
      color={color ?? p.text}
    />
  );
}

/** Curated set used across the product — keeps stroke weight consistent. */
export const IC = {
  home: "home-outline",
  homeActive: "home",
  discover: "compass-outline",
  discoverActive: "compass",
  create: "add",
  bell: "notifications-outline",
  bellActive: "notifications",
  person: "person-outline",
  personActive: "person",
  search: "search-outline",
  heart: "heart-outline",
  heartActive: "heart",
  comment: "chatbubble-outline",
  commentActive: "chatbubble",
  repost: "repeat-outline",
  repostActive: "repeat",
  bookmark: "bookmark-outline",
  bookmarkActive: "bookmark",
  share: "share-outline",
  more: "ellipsis-horizontal",
  back: "chevron-back",
  forward: "chevron-forward",
  down: "chevron-down",
  close: "close",
  check: "checkmark",
  checkCircle: "checkmark-circle",
  lock: "lock-closed-outline",
  lockSolid: "lock-closed",
  eye: "eye-outline",
  eyeOff: "eye-off-outline",
  play: "play",
  playCircle: "play-circle-outline",
  calendar: "calendar-outline",
  time: "time-outline",
  flame: "flame-outline",
  flameActive: "flame",
  sparkles: "sparkles-outline",
  star: "star-outline",
  people: "people-outline",
  personAdd: "person-add-outline",
  settings: "settings-outline",
  logout: "log-out-outline",
  moon: "moon-outline",
  sun: "sunny-outline",
  shield: "shield-checkmark-outline",
  flag: "flag-outline",
  mute: "volume-mute-outline",
  image: "image-outline",
  video: "videocam-outline",
  edit: "create-outline",
  trash: "trash-outline",
  pin: "pin-outline",
  pinActive: "pin",
  alert: "alert-circle-outline",
  info: "information-circle-outline",
  offline: "cloud-offline-outline",
  refresh: "refresh-outline",
  trending: "trending-up-outline",
  tv: "tv-outline",
  film: "film-outline",
  verified: "shield-checkmark",
  stats: "stats-chart-outline",
} as const satisfies Record<string, IconName>;

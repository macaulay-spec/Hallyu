import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  PressableProps,
  ScrollView,
  Text,
  TextProps,
  View,
  ViewProps,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ART_SCRIM, BRAND_GRADIENT, BRAND_GRADIENT_VIVID, COLORS, coverTone, FONTS } from "@/lib/theme";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(clsx(classes));
}

// ---------- Text ----------
const TEXT_VARIANTS = {
  h1: "text-text-primary text-[28px] font-bold tracking-tight",
  h2: "text-text-primary text-[22px] font-bold tracking-tight",
  h3: "text-text-primary text-[17px] font-semibold",
  body: "text-text-primary text-[15px]",
  secondary: "text-text-secondary text-[13px]",
  tertiary: "text-text-tertiary text-[12px]",
  coral: "text-coral text-[13px] font-semibold",
  brand: "text-brand-soft text-[13px] font-semibold",
  display: "text-white text-[34px] font-bold",
  hero: "text-text-primary text-[24px] font-bold",
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;

export function T({
  variant = "body",
  className,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; className?: string }) {
  return (
    <Text
      className={cn(TEXT_VARIANTS[variant], variant === "display" && "font-display", className)}
      style={variant === "display" ? { fontFamily: FONTS.display, ...(style as object) } : style}
      {...rest}
    />
  );
}

// ---------- Surfaces ----------
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-2xl bg-card border border-line overflow-hidden", className)}
      {...rest}
    />
  );
}

/** Glassy surface that sits on top of the header gradient. */
export function GlassCard({ className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-white/15 bg-white/10",
        className
      )}
      {...rest}
    />
  );
}

export function Row({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cn("flex-row items-center", className)} {...rest} />;
}

export function Screen({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cn("flex-1 bg-surface", className)} {...rest} />;
}

// ---------- Wave edge (the brand's flowing horizon) ----------
// A scalloped edge built from overlapping circles in the color of whatever
// section follows — cheap, resolution-independent, no native SVG dependency.
export function WaveEdge({
  color = COLORS.surface,
  height = 26,
  className,
}: {
  color?: string;
  height?: number;
  className?: string;
}) {
  const [w, setW] = useState(0);
  const bump = 46;
  const count = w > 0 ? Math.ceil(w / bump) + 1 : 0;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height, overflow: "hidden" }}
      className={cn("w-full", className)}
      pointerEvents="none"
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: i * bump - bump / 2,
            width: bump,
            height: bump,
            borderRadius: bump / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

// ---------- Brand hero (gradient header + serif wordmark + wave) ----------
export function BrandHero({
  title = "Hallyu",
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  /** Actions rendered top-right (search, bell...). */
  right?: React.ReactNode;
  /** Extra content inside the gradient, above the wave (rails, chips...). */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={className}>
      <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="px-4 pt-14 pb-1">
          <Row className="justify-between">
            <View>
              <T variant="display">{title}</T>
              {subtitle ? (
                <T className="text-white/70 mt-0.5">{subtitle}</T>
              ) : null}
            </View>
            <Row>{right}</Row>
          </Row>
          {children}
        </View>
        <WaveEdge color={COLORS.surface} height={28} />
      </LinearGradient>
    </View>
  );
}

/** Circular icon action used in hero headers (search, bell). */
export function HeroAction({
  glyph,
  label,
  badge,
  onPress,
}: {
  glyph: string;
  label: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full bg-white/15 border border-white/20 ml-2"
    >
      <Text style={{ fontSize: 17, color: "#FFFFFF" }}>{glyph}</Text>
      {badge && badge > 0 ? (
        <View className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-coral border border-white/40" />
      ) : null}
    </Pressable>
  );
}

// ---------- Art (real image when present, honest gradient when not) ----------
// Until TMDB art is synced (or the owner uploads art), every artwork surface
// renders a deterministic brand gradient seeded by the drama slug + a serif
// initial. No broken images, no fabricated photos (Spec §39).
export function ArtImage({
  uri,
  seed,
  label,
  ratio = 1,
  radius = 0,
  scrim = true,
  children,
  className,
}: {
  uri?: string | null;
  seed: string;
  label?: string;
  ratio?: number;
  radius?: number;
  scrim?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const [toneA, toneB] = coverTone(seed);
  return (
    <View
      className={cn("overflow-hidden bg-card", className)}
      style={{ aspectRatio: ratio, borderRadius: radius }}
    >
      {uri ? (
        <Image source={{ uri }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
      ) : (
        <LinearGradient colors={[toneA, toneB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
          <View className="items-center justify-center flex-1">
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 44,
                color: "rgba(255,255,255,0.9)",
                fontWeight: "700",
              }}
            >
              {(label ?? seed).replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || "H"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 2, marginTop: 2 }}>
              HALLYU
            </Text>
          </View>
        </LinearGradient>
      )}
      {scrim && (children || uri) ? (
        <LinearGradient
          colors={[...ART_SCRIM]}
          locations={[0.45, 0.7, 1]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0 }}
          pointerEvents="none"
        />
      ) : null}
      {children ? (
        <View className="absolute left-0 right-0 bottom-0" pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

// ---------- Drama cover (the home rail's circular art) ----------
export function DramaCover({
  title,
  updates,
  uri,
  seed,
  following,
  onPress,
}: {
  title: string;
  updates?: string;
  uri?: string | null;
  seed: string;
  following?: boolean;
  onPress?: () => void;
}) {
  const size = 78;
  const inner = size - 6;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${updates ? `, ${updates}` : ""}`}
      className="mr-3.5 w-[92px] items-center"
    >
      <View
        className="items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: following ? COLORS.brandOcean : "rgba(255,255,255,0.35)",
        }}
      >
        <ArtImage uri={uri} seed={seed} label={title} ratio={1} radius={inner / 2} scrim={false} />
      </View>
      <T variant="secondary" numberOfLines={1} className="mt-1.5 text-[11px] text-text-primary">
        {title}
      </T>
      {updates ? <T variant="tertiary" className="text-[10px]">{updates}</T> : null}
    </Pressable>
  );
}

// ---------- WaveProgress (brand loading motif, Spec §35A) ----------
export function WaveProgress({ className }: { className?: string }) {
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const p3 = useSharedValue(0);

  useEffect(() => {
    const dur = 900;
    p1.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }), -1, true);
    p2.value = withRepeat(withTiming(1, { duration: dur + 150, easing: Easing.inOut(Easing.ease) }), -1, true);
    p3.value = withRepeat(withTiming(1, { duration: dur + 300, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p1, p2, p3]);

  const s1 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p3.value }));
  const bar = { width: 56, height: 4, borderRadius: 999, marginHorizontal: 4 };

  return (
    <View className={cn("items-center justify-center", className)}>
      <View className="flex-row items-center">
        <Animated.View style={[bar, s1, { backgroundColor: COLORS.brandDeep }]} />
        <Animated.View style={[bar, s2, { backgroundColor: COLORS.brand }]} />
        <Animated.View style={[bar, s3, { backgroundColor: COLORS.brandOcean }]} />
      </View>
    </View>
  );
}

// ---------- Button ----------
const BUTTON_VARIANTS = {
  primary: "bg-brand rounded-[14px] items-center justify-center",
  gradient: "rounded-[14px] items-center justify-center overflow-hidden",
  secondary: "border border-line bg-card rounded-[14px] items-center justify-center",
  ghost: "items-center justify-center",
  coral: "bg-coral rounded-[14px] items-center justify-center",
} as const;

const BUTTON_SIZES = {
  sm: "h-9 px-4",
  md: "h-11 px-5",
  lg: "h-[52px] px-6",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  label,
  className,
  disabled,
  ...rest
}: PressableProps & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  label: string;
  className?: string;
}) {
  const disabledCls = disabled ? " opacity-50" : "";
  const labelCls =
    variant === "primary" || variant === "gradient" || variant === "coral"
      ? "text-white text-[15px] font-semibold"
      : "text-text-primary text-[15px] font-semibold";

  if (variant === "gradient") {
    return (
      <Pressable
        disabled={disabled}
        className={cn(BUTTON_VARIANTS[variant], BUTTON_SIZES[size], disabledCls, className)}
        {...rest}
      >
        <LinearGradient colors={[...BRAND_GRADIENT_VIVID]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        <Text className={labelCls}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      className={cn(BUTTON_VARIANTS[variant], BUTTON_SIZES[size], disabledCls, className)}
      {...rest}
    >
      <Text className={labelCls}>{label}</Text>
    </Pressable>
  );
}

// ---------- States ----------
export function EmptyState({
  copy,
  cta,
  onCta,
  className,
}: {
  copy: string;
  cta?: string;
  onCta?: () => void;
  className?: string;
}) {
  return (
    <View className={cn("items-center justify-center px-8 py-14", className)}>
      <WaveProgress className="mb-5 opacity-60" />
      <T variant="h3" className="text-center mb-1.5">
        {copy}
      </T>
      {cta ? (
        <Button variant="secondary" size="sm" label={cta} onPress={onCta} className="mt-3" />
      ) : null}
    </View>
  );
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <View className="items-center justify-center px-8 py-14">
      <WaveProgress className="mb-4 opacity-50" />
      <T variant="h3" className="text-center">
        Couldn't load this right now.
      </T>
      <T variant="secondary" className="text-center mt-1.5">
        Check your connection and try again.
      </T>
      {retry ? (
        <Button variant="secondary" size="sm" label="Retry" onPress={retry} className="mt-4" />
      ) : null}
    </View>
  );
}

// ---------- Shimmer skeleton ----------
export function ShimmerCard({ height = 96 }: { height?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [p]);
  const s = useAnimatedStyle(() => ({ opacity: 0.25 + 0.3 * p.value }));

  return (
    <Animated.View
      style={[{ height, borderRadius: 16, backgroundColor: COLORS.card }, s]}
      className="mb-3"
    />
  );
}

export function ShimmerList({ rows = 4 }: { rows?: number }) {
  return (
    <View className="px-4 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerCard key={i} height={i % 2 === 0 ? 96 : 72} />
      ))}
    </View>
  );
}

// ---------- Spoiler overlay card (Spec §9 presentation) ----------
export function SpoilerOverlay({
  drama,
  episode,
  watchedThrough,
  note,
  onReveal,
  onDismiss,
}: {
  drama: string;
  episode?: number | null;
  watchedThrough?: number | null;
  /** Why the engine guarded this — the §9 explanation line. */
  note?: string;
  onReveal: () => void;
  onDismiss?: () => void;
}) {
  return (
    <View className="rounded-2xl bg-card border border-line overflow-hidden">
      <LinearGradient colors={[...BRAND_GRADIENT_VIVID]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View className="h-1" />
      </LinearGradient>
      <View className="p-4">
        <T variant="coral">Spoiler ahead</T>
        <T variant="secondary" className="mt-1">
          {drama}
          {episode != null ? ` · Ep ${episode}` : ""}
          {note ? ` — ${note}` : ""}
        </T>
        {watchedThrough != null ? (
          <T variant="tertiary" className="mt-1">
            You've watched through Ep {watchedThrough} of this drama.
          </T>
        ) : null}
        <Row className="mt-3">
          <Button size="sm" variant="gradient" label="Show anyway" onPress={onReveal} />
          {onDismiss ? (
            <Button size="sm" variant="secondary" label="Not now" onPress={onDismiss} className="ml-2" />
          ) : null}
        </Row>
      </View>
    </View>
  );
}

// ---------- Avatar (initials tile — no fake photos, Spec §39) ----------
const AVATAR_TONES = ["#4A1C6E", "#2E7CDF", "#7B3FE4", "#1F5F8B", "#6B2E7A"];

export function Avatar({
  name,
  size = 40,
  badge,
  uri,
}: {
  name: string;
  size?: number;
  badge?: string | null;
  uri?: string | null;
}) {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length]!;
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone }}
          className="items-center justify-center"
        >
          <Text style={{ color: "#F5F5F5", fontSize: size * 0.38, fontWeight: "700" }}>
            {initials || "?"}
          </Text>
        </View>
      )}
      {badge ? (
        <View className="absolute -right-1 -bottom-1 rounded-full bg-brand-ocean px-1.5 py-0.5">
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------- Segmented control (For You / Following, profile tabs) ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; badge?: number }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View className={cn("flex-row rounded-full bg-white/10 border border-white/15 p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn("flex-1 rounded-full py-2 items-center justify-center", active ? "" : "")}
          >
            {active ? (
              <LinearGradient
                colors={[...BRAND_GRADIENT_VIVID]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 999 }}
              />
            ) : null}
            <Text
              className={cn(
                "text-[13px] font-semibold",
                active ? "text-white" : "text-text-secondary"
              )}
            >
              {opt.label}
              {opt.badge ? ` ${opt.badge}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Chip (genre / filter / tag) ----------
export function Chip({
  label,
  active,
  onPress,
  className,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={cn(
        "rounded-full px-3.5 py-1.5 mr-2 mb-2 border",
        active ? "bg-brand border-brand" : "bg-card border-line",
        className
      )}
    >
      <Text className={cn("text-[12px]", active ? "text-white font-semibold" : "text-text-secondary")}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- Section header + horizontal rail ----------
export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Row className="px-4 mb-2 justify-between">
      <View className="flex-1 pr-3">
        <T variant="h3">{title}</T>
        {subtitle ? <T variant="tertiary">{subtitle}</T> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <T variant="brand">{action}</T>
        </Pressable>
      ) : null}
    </Row>
  );
}

export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      className="flex-grow-0"
    >
      {children}
    </ScrollView>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={cn("h-px bg-line", className)} />;
}

// ---------- Badge (status, spoiler level, official) ----------
const BADGE_TONES = {
  brand: "bg-brand",
  coral: "bg-coral",
  success: "bg-success",
  warn: "bg-warn",
  muted: "bg-card-elevated",
  danger: "bg-danger",
} as const;

export function Badge({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: keyof typeof BADGE_TONES;
  className?: string;
}) {
  return (
    <View className={cn("rounded-full px-2 py-0.5", BADGE_TONES[tone], className)}>
      <Text
        style={{ color: tone === "muted" ? "#AC9FC9" : "#FFFFFF", fontSize: 10, fontWeight: "700" }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Translucent pill used for engagement counts sitting on artwork. */
export function ArtStat({
  glyph,
  count,
  active,
  onPress,
  onLongPress,
  label,
}: {
  glyph: string;
  count?: string | number;
  active?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${count != null ? `, ${count}` : ""}`}
      className="flex-row items-center rounded-full bg-black/35 border border-white/15 px-2.5 py-1"
    >
      <Text style={{ fontSize: 12, color: active ? COLORS.coral : "#FFFFFF" }}>{glyph}</Text>
      {count != null && count !== "" ? (
        <Text style={{ fontSize: 11, color: "#FFFFFF", marginLeft: 4, fontWeight: "600" }}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ---------- Progress bar (watching progress, upload) ----------
export function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View className={cn("h-1.5 rounded-full bg-card-elevated overflow-hidden", className)}>
      <LinearGradient
        colors={[...BRAND_GRADIENT_VIVID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: "100%", width: `${pct * 100}%` }}
      />
    </View>
  );
}

// ---------- Tappable list row ----------
export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  className,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={cn("flex-row items-center px-4 py-3.5", className)}
    >
      <View className="flex-1 pr-3">
        <T variant="h3">{title}</T>
        {subtitle ? <T variant="tertiary">{subtitle}</T> : null}
      </View>
      {right ?? <T variant="tertiary">›</T>}
    </Pressable>
  );
}

// ---------- Tag (inline, tappable entity) ----------
export function Tag({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="rounded-full bg-card-elevated px-3 py-1 mr-2 mb-1.5"
    >
      <T variant="tertiary">{label}</T>
    </Pressable>
  );
}

// ---------- Brand banner (layered wave arcs — community header) ----------
export function BrandBanner({ height = 180 }: { height?: number }) {
  const [w, setW] = useState(0);
  return (
    <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height, overflow: "hidden" }}
      >
        {w > 0
          ? Array.from({ length: 9 }).map((_, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  top: height * 0.08,
                  left: (i / 9) * w - w * 0.4,
                  width: w * 0.8,
                  height: height * 0.84,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor:
                    i % 2 === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)",
                }}
              />
            ))
          : null}
        <WaveEdge color={COLORS.surface} height={24} />
      </View>
    </LinearGradient>
  );
}

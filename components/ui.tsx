import React, { useEffect, useState } from "react";
import { Pressable, PressableProps, Text, TextProps, View, ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(clsx(classes));
}

// ---------- Text ----------
const TEXT_VARIANTS = {
  h1: "text-text-primary text-[28px] font-bold",
  h2: "text-text-primary text-[22px] font-bold",
  h3: "text-text-primary text-[17px] font-semibold",
  body: "text-text-primary text-[15px]",
  secondary: "text-text-secondary text-[13px]",
  tertiary: "text-text-tertiary text-[12px]",
  coral: "text-coral text-[13px] font-semibold",
  brand: "text-brand text-[13px] font-semibold",
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;

export function T({
  variant = "body",
  className,
  ...rest
}: TextProps & { variant?: TextVariant; className?: string }) {
  return <Text className={cn(TEXT_VARIANTS[variant], className)} {...rest} />;
}

// ---------- Surfaces ----------
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-[12px] bg-card border border-line", className)} {...rest} />;
}

export function Row({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cn("flex-row items-center", className)} {...rest} />;
}

export function Screen({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cn("flex-1 bg-surface", className)} {...rest} />;
}

// ---------- Brand banner (layered wave arcs, purple → blue) ----------
export function BrandBanner({ height = 180 }: { height?: number }) {
  const [w, setW] = useState(0);
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height, overflow: "hidden", backgroundColor: "#150A20" }}
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
                borderColor: i % 2 === 0 ? "rgba(74,28,110,0.85)" : "rgba(45,108,223,0.8)",
              }}
            />
          ))
        : null}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15,15,15,0.45)",
        }}
      />
    </View>
  );
}

// ---------- WaveProgress (brand loading motif, Spec §35A) ----------
export function WaveProgress({ className }: { className?: string }) {
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const p3 = useSharedValue(0);

  useEffect(() => {
    const dur = 900;
    p1.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    p2.value = withRepeat(
      withTiming(1, { duration: dur + 150, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    p3.value = withRepeat(
      withTiming(1, { duration: dur + 300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [p1, p2, p3]);

  const s1 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p3.value }));
  const bar = { width: 56, height: 4, borderRadius: 999, marginHorizontal: 4 };

  return (
    <View className={cn("items-center justify-center", className)}>
      <View className="flex-row items-center">
        <Animated.View style={[bar, s1, { backgroundColor: "#4A1C6E" }]} />
        <Animated.View style={[bar, s2, { backgroundColor: "#7B4FD8" }]} />
        <Animated.View style={[bar, s3, { backgroundColor: "#2D6CDF" }]} />
      </View>
    </View>
  );
}

// ---------- Button ----------
const BUTTON_VARIANTS = {
  primary: "bg-brand rounded-[12px] items-center justify-center",
  secondary: "border border-line bg-card rounded-[12px] items-center justify-center",
  ghost: "items-center justify-center",
  coral: "bg-coral rounded-[12px] items-center justify-center",
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
    variant === "primary" || variant === "coral"
      ? "text-white text-[15px] font-semibold"
      : "text-text-primary text-[15px] font-semibold";

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
      style={[{ height, borderRadius: 12, backgroundColor: "#1A1A1A" }, s]}
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
  onReveal,
  onDismiss,
}: {
  drama: string;
  episode?: number | null;
  watchedThrough?: number | null;
  onReveal: () => void;
  onDismiss?: () => void;
}) {
  return (
    <View className="rounded-[12px] bg-card border border-line overflow-hidden">
      <View className="flex-row h-1">
        <View className="flex-1 bg-[#4A1C6E]" />
        <View className="flex-1 bg-[#7B4FD8]" />
        <View className="flex-1 bg-[#2D6CDF]" />
      </View>
      <View className="p-4">
        <T variant="coral">Spoiler ahead</T>
        <T variant="secondary" className="mt-1">
          {drama}
          {episode != null ? ` · Ep ${episode}` : ""}
          {watchedThrough != null ? ` · you've watched through Ep ${watchedThrough}` : ""}
        </T>
        <Row className="mt-3">
          <Button size="sm" label="Show anyway" onPress={onReveal} />
          {onDismiss ? (
            <Button
              size="sm"
              variant="secondary"
              label="Not now"
              onPress={onDismiss}
              className="ml-2"
            />
          ) : null}
        </Row>
      </View>
    </View>
  );
}

import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DEVICE, RADIUS, SHADOW, SPACE, TYPE, TypeToken, brandGradient, familyFor } from "./tokens";
import { useTheme } from "./theme";
import { IC, Icon, IconName } from "./icons";
import { Art, fmtCount } from "./data";

export type Nav = (screen: string, params?: Record<string, string>) => void;

/* ---------------------------------- text ---------------------------------- */

export function T({
  t = "body",
  color,
  children,
  style,
  numberOfLines,
  align,
}: {
  t?: TypeToken;
  color?: string;
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  align?: "left" | "center" | "right";
}) {
  const { p } = useTheme();
  const s = TYPE[t];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          fontWeight: s.fontWeight,
          letterSpacing: s.letterSpacing,
          color: color ?? p.text,
          fontFamily: familyFor(s.fontWeight, s.kr),
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  const { p } = useTheme();
  return (
    <T t="micro" color={color ?? p.textFaint} style={{ textTransform: "uppercase" }}>
      {children}
    </T>
  );
}

/* --------------------------------- layout --------------------------------- */

export function Screen({ children, pad = true, style }: { children: React.ReactNode; pad?: boolean; style?: StyleProp<ViewStyle> }) {
  const { p } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: p.canvas }, style]}>
      <StatusBar />
      <View style={{ flex: 1, paddingHorizontal: pad ? DEVICE.gutter : 0 }}>{children}</View>
    </View>
  );
}

/** Device status bar — drawn, so previews read as real screens. */
export function StatusBar() {
  const { p } = useTheme();
  return (
    <View style={{ height: DEVICE.statusBar, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 8 }}>
      <Text style={{ color: p.text, fontSize: 15, fontWeight: "600", letterSpacing: 0.2 }}>9:41</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="cellular-outline" size={15} color={p.text} />
        <Icon name="wifi" size={15} color={p.text} />
        <Icon name="battery-full" size={20} color={p.text} />
      </View>
    </View>
  );
}

export function Row({ children, gap = SPACE.xs, style, align = "center" }: { children?: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; align?: "center" | "flex-start" | "space-between" }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Col({ children, gap = SPACE.xs, style }: { children?: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "column", gap }, style]}>{children}</View>;
}

export function Fill({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

export function Divider({ inset = 0 }) {
  const { p } = useTheme();
  return <View style={{ height: 1, backgroundColor: p.line, marginLeft: inset }} />;
}

export function Scroll({ children, style, pad = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: boolean }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[{ flex: 1 }, style]}
      contentContainerStyle={{ paddingHorizontal: pad ? DEVICE.gutter : 0, paddingBottom: DEVICE.tabBar + 24 }}
    >
      {children}
    </ScrollView>
  );
}

export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: DEVICE.gutter, gap: SPACE.sm }}
      style={{ flexGrow: 0, marginHorizontal: -DEVICE.gutter }}
    >
      {children}
    </ScrollView>
  );
}

/* -------------------------------- surfaces -------------------------------- */

export function Card({ children, style, elevated = false }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; elevated?: boolean }) {
  const { p } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: p.surface, borderRadius: RADIUS.card, overflow: "hidden" },
        elevated ? { ...SHADOW.card, elevation: 4 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type GradientDir = "diag" | "down" | "right";

export function Gradient({ colors, style, children, dir = "diag" }: { colors: readonly [string, string, ...string[]]; style?: StyleProp<ViewStyle>; children?: React.ReactNode; dir?: GradientDir }) {
  const startEnd: Record<GradientDir, [{ x: number; y: number }, { x: number; y: number }]> = {
    diag: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    down: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }],
    right: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }],
  };
  const [start, end] = startEnd[dir];
  return (
    <LinearGradient colors={[...colors]} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}

/* -------------------------------- controls -------------------------------- */

export function Press({ onPress, children, style, disabled, accessibilityLabel }: { onPress?: () => void; children?: React.ReactNode; style?: StyleProp<ViewStyle>; disabled?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        style,
        { opacity: disabled ? 0.4 : pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "soft" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { p } = useTheme();
  const h = size === "lg" ? 52 : size === "sm" ? 36 : 44;
  const px = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  const fill = variant === "primary" ? p.accent : variant === "soft" ? p.fill : variant === "danger" ? p.dangerSoft : "transparent";
  const fg = variant === "primary" ? p.onAccent : variant === "danger" ? p.danger : variant === "soft" ? p.text : p.text;
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityLabel={label} style={style}>
      <View
        style={{
          height: h,
          paddingHorizontal: px,
          borderRadius: RADIUS.md,
          backgroundColor: fill,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: p.lineStrong,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {icon ? <Icon name={icon} size={16} color={fg} /> : null}
        <Text style={{ color: fg, fontSize: size === "sm" ? 13 : 15, fontWeight: "600", letterSpacing: -0.1 }}>{label}</Text>
      </View>
    </Press>
  );
}

export function IconButton({ name, onPress, size = "md", tone = "default", badge }: { name: IconName; onPress?: () => void; size?: IconSizeLike; tone?: "default" | "accent" | "surface"; badge?: number }) {
  const { p } = useTheme();
  const px = size === "lg" ? 44 : 36;
  return (
    <Press onPress={onPress} accessibilityLabel={String(name)}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tone === "surface" ? p.fill : "transparent",
        }}
      >
        <Icon name={name} size={size === "lg" ? 22 : 20} color={tone === "accent" ? p.accent : p.text} />
        {badge ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: p.accent,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: p.onAccent, fontSize: 9, fontWeight: "700" }}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
      </View>
    </Press>
  );
}

type IconSizeLike = "sm" | "md" | "lg";

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress} accessibilityLabel={label}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          height: 34,
          paddingHorizontal: 14,
          borderRadius: RADIUS.pill,
          backgroundColor: selected ? p.accent : p.fill,
        }}
      >
        {icon ? <Icon name={icon} size={14} color={selected ? p.onAccent : p.textDim} /> : null}
        <Text style={{ color: selected ? p.onAccent : p.textDim, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      </View>
    </Press>
  );
}

export function Badge({ label, tone = "neutral", icon }: { label: string; tone?: "neutral" | "accent" | "success" | "warn" | "official"; icon?: IconName }) {
  const { p } = useTheme();
  const bg = tone === "accent" ? p.accentSoft : tone === "success" ? "rgba(62,207,142,0.14)" : tone === "warn" ? "rgba(245,166,35,0.14)" : tone === "official" ? p.ink : p.fill;
  const fg = tone === "accent" ? p.accent : tone === "success" ? p.success : tone === "warn" ? p.warn : tone === "official" ? "#8FB3F5" : p.textDim;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 20, paddingHorizontal: 8, borderRadius: RADIUS.pill, backgroundColor: bg }}>
      {icon ? <Icon name={icon} size={11} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 10, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</Text>
    </View>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={() => onChange?.(!on)} accessibilityLabel="toggle">
      <View style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: on ? p.accent : p.fill, justifyContent: "center", paddingHorizontal: 3 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFFFFF", alignSelf: on ? "flex-end" : "flex-start" }} />
      </View>
    </Press>
  );
}

export function TextField({ placeholder, value, onChangeText, icon, multiline, height }: { placeholder: string; value?: string; onChangeText?: (v: string) => void; icon?: IconName; multiline?: boolean; height?: number }) {
  const { p } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        gap: 10,
        backgroundColor: p.surfaceHigh,
        borderRadius: RADIUS.md,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
        height: multiline ? height ?? 96 : 48,
        borderWidth: 1,
        borderColor: p.line,
      }}
    >
      {icon ? <Icon name={icon} size={18} color={p.textFaint} /> : null}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={p.textFaint}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{ flex: 1, color: p.text, fontSize: 15, lineHeight: 22, paddingVertical: multiline ? 0 : 12 }}
      />
    </View>
  );
}

/* --------------------------------- imagery -------------------------------- */

/** Avatar: procedural two-tone disc with initials — never a real face. */
export function Avatar({ art, name, size = 40, official }: { art: Art; name: string; size?: number; official?: boolean }) {
  const { p } = useTheme();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
      <Gradient colors={[art.from, art.to]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: size * 0.34, fontWeight: "700", letterSpacing: 0.2 }}>{initials}</Text>
      </Gradient>
      {official ? (
        <View style={{ position: "absolute", right: -1, bottom: -1, width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21, backgroundColor: p.canvas, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, backgroundColor: "#3E63DD", alignItems: "center", justifyContent: "center" }}>
            <Icon name={IC.check} size={size * 0.18} color="#fff" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MotifArt({ art, w, h }: { art: Art; w: number; h: number }) {
  const dot = "rgba(255,255,255,0.85)";
  switch (art.motif) {
    case "moon":
      return <View style={{ position: "absolute", right: w * 0.18, top: h * 0.16, width: w * 0.22, height: w * 0.22, borderRadius: w * 0.11, backgroundColor: dot, opacity: 0.9 }} />;
    case "city":
      return (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.42, flexDirection: "row", alignItems: "flex-end", gap: 4, paddingHorizontal: 8 }}>
          {[0.5, 0.8, 0.62, 1, 0.7, 0.88, 0.55].map((f, i) => (
            <View key={i} style={{ flex: 1, height: h * 0.42 * f, backgroundColor: "rgba(8,8,12,0.55)", borderRadius: 2 }} />
          ))}
        </View>
      );
    case "wave":
    case "tide":
      return (
        <>
          <View style={{ position: "absolute", left: -w * 0.2, right: -w * 0.2, bottom: h * 0.28, height: h * 0.3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)" }} />
          <View style={{ position: "absolute", left: -w * 0.3, right: -w * 0.1, bottom: h * 0.12, height: h * 0.3, borderRadius: 999, backgroundColor: "rgba(8,8,12,0.30)" }} />
        </>
      );
    case "blossom":
      return (
        <>
          {[
            [0.2, 0.24, 0.1],
            [0.62, 0.14, 0.07],
            [0.78, 0.4, 0.05],
            [0.36, 0.52, 0.06],
          ].map(([x, y, r], i) => (
            <View key={i} style={{ position: "absolute", left: w * x!, top: h * y!, width: w * r! * 2, height: w * r! * 2, borderRadius: w * r!, backgroundColor: "rgba(255,255,255,0.35)" }} />
          ))}
        </>
      );
    case "rain":
      return (
        <View style={{ position: "absolute", inset: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: w * 0.12, paddingTop: h * 0.1 }}>
          {[0.5, 0.7, 0.4, 0.8, 0.55].map((f, i) => (
            <View key={i} style={{ width: 1.5, height: h * 0.5 * f, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 1 }} />
          ))}
        </View>
      );
    case "ridge":
      return (
        <>
          <View style={{ position: "absolute", left: -w * 0.1, bottom: -h * 0.2, width: w * 0.9, height: h * 0.7, borderRadius: 999, backgroundColor: "rgba(8,8,12,0.35)", transform: [{ rotate: "12deg" }] }} />
          <View style={{ position: "absolute", right: -w * 0.2, bottom: -h * 0.3, width: w * 1.1, height: h * 0.8, borderRadius: 999, backgroundColor: "rgba(8,8,12,0.5)", transform: [{ rotate: "-8deg" }] }} />
        </>
      );
    case "lantern":
      return (
        <>
          {[0.22, 0.5, 0.76].map((x, i) => (
            <View key={i} style={{ position: "absolute", left: w * x, top: h * (0.16 + i * 0.08), width: w * 0.1, height: w * 0.14, borderRadius: w * 0.05, backgroundColor: "rgba(255,214,140,0.85)" }} />
          ))}
        </>
      );
  }
}

/** Procedural key art: gradient field + motif + optional title lockup. */
/** Final app icon asset (AI-generated render of the coded ㅎ mark). */
export function AppIcon({ size }: { size: number }) {
  const src = require("./assets/icon/hallyu-icon.png");
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.225, overflow: "hidden", backgroundColor: "#0A0A0C" }}>
      <Image
        source={typeof src === "string" ? { uri: src } : (src as never)}
        style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

/* -------------------------------- brand mark ------------------------------- */

/**
 * The Hallyu app icon, coded: Hangul ㅎ (hieut) reduced to three strokes —
 * tick, bar, ring — on a 100u grid inside a 22.5% squircle. No image assets.
 */
export function HallyuMark({
  size,
  variant = "ink",
  boxed = true,
}: {
  size: number;
  variant?: "ink" | "rose" | "light" | "mono";
  boxed?: boolean;
}) {
  const u = size / 100;
  const mark = variant === "ink" ? "#E8465A" : variant === "light" ? "#17171B" : "#FFFFFF";
  const glyph = (
    <View style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      <View style={{ position: "absolute", left: 45.5 * u, top: 14 * u, width: 9 * u, height: 14 * u, borderRadius: 4.5 * u, backgroundColor: mark }} />
      <View style={{ position: "absolute", left: 27 * u, top: 32 * u, width: 46 * u, height: 9 * u, borderRadius: 4.5 * u, backgroundColor: mark }} />
      <View style={{ position: "absolute", left: 29 * u, top: 46 * u, width: 42 * u, height: 42 * u, borderRadius: 21 * u, borderWidth: 9 * u, borderColor: mark }} />
    </View>
  );
  if (!boxed) return glyph;
  const bg: [string, string] =
    variant === "rose" ? ["#F0566A", "#C22F44"] : variant === "light" ? ["#FBFAF8", "#E7E3DB"] : ["#202027", "#0A0A0C"];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.225, overflow: "hidden", backgroundColor: bg[1] }}>
      <Gradient colors={bg} dir="down" style={{ position: "absolute", left: 0, top: 0, width: size, height: size }} />
      {glyph}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size * 0.225,
          borderWidth: 1,
          borderColor: variant === "light" ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)",
        }}
      />
    </View>
  );
}

export function Poster({ art, width, height, title, titleKr, rounded = RADIUS.lg, children }: { art: Art; width: number; height: number; title?: string; titleKr?: string; rounded?: number; children?: React.ReactNode }) {
  return (
    <View style={{ width, height, borderRadius: rounded, overflow: "hidden" }}>
      <Gradient colors={[art.from, art.to]} dir="down" style={{ flex: 1 }}>
        {art.file ? (
          <Image
            source={typeof art.file === "string" ? { uri: art.file } : (art.file as never)}
            style={{ position: "absolute", top: 0, left: 0, width, height }}
            resizeMode="cover"
          />
        ) : (
          <MotifArt art={art} w={width} h={height} />
        )}
        <Gradient colors={["rgba(0,0,0,0)", "rgba(6,6,8,0.55)"]} dir="down" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.62 }} />
        {title ? (
          <View style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
            {titleKr ? <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "600", fontFamily: "NotoSansKR_500Medium" }}>{titleKr}</Text> : null}
            <Text style={{ color: "#FFFFFF", fontSize: width > 140 ? 15 : 12, fontWeight: "700", letterSpacing: -0.2 }} numberOfLines={2}>
              {title}
            </Text>
          </View>
        ) : null}
        {children}
      </Gradient>
    </View>
  );
}

/* ---------------------------------- states -------------------------------- */

export function Skeleton({ width, height, radius = 8, style }: { width?: DimensionValue; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { p } = useTheme();
  return <View style={[{ width: width ?? "100%", height, borderRadius: radius, backgroundColor: p.shimmer }, style]} />;
}

export function SkeletonPost() {
  return (
    <Card style={{ padding: 16, gap: 12 }}>
      <Row gap={10}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton width="45%" height={12} radius={6} />
          <Skeleton width="28%" height={10} radius={5} />
        </View>
      </Row>
      <Skeleton height={12} radius={6} />
      <Skeleton width="82%" height={12} radius={6} />
      <Skeleton height={180} radius={RADIUS.lg} />
    </Card>
  );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const { p } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: p.fill, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={26} color={p.textFaint} />
      </View>
      <T t="heading" align="center">
        {title}
      </T>
      <T t="caption" color={p.textDim} align="center">
        {body}
      </T>
      {action ? (
        <Button label={action} variant="soft" size="sm" onPress={onAction} style={{ marginTop: 6 }} />
      ) : null}
    </View>
  );
}

export function ErrorState({ onRetry, title = "Couldn't load this right now.", body = "Check your connection and try again." }: { onRetry?: () => void; title?: string; body?: string }) {
  const { p } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: p.dangerSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={IC.offline} size={26} color={p.danger} />
      </View>
      <T t="heading" align="center">
        {title}
      </T>
      <T t="caption" color={p.textDim} align="center">
        {body}
      </T>
      <Button label="Retry" variant="soft" size="sm" icon={IC.refresh} onPress={onRetry} style={{ marginTop: 6 }} />
    </View>
  );
}

export function OfflineBanner() {
  const { p } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.dangerSoft, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}>
      <Icon name={IC.offline} size={16} color={p.danger} />
      <T t="caption" color={p.danger}>
        You're offline — showing the last synced feed.
      </T>
    </View>
  );
}

/* ------------------------------ product pieces ---------------------------- */

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { p } = useTheme();
  return (
    <Row style={{ justifyContent: "space-between", marginBottom: 12, marginTop: 4 }}>
      <T t="heading">{title}</T>
      {action ? (
        <Press onPress={onAction}>
          <Row gap={2}>
            <T t="captionEmph" color={p.textDim}>
              {action}
            </T>
            <Icon name={IC.forward} size={14} color={p.textDim} />
          </Row>
        </Press>
      ) : null}
    </Row>
  );
}

export function Segmented<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { p } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 24, borderBottomWidth: 1, borderBottomColor: p.line }}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <Press key={t.id} onPress={() => onChange(t.id)} style={{ paddingBottom: 10, position: "relative" }}>
            <T t={active ? "bodyEmph" : "body"} color={active ? p.text : p.textFaint}>
              {t.label}
            </T>
            {active ? <View style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 1, backgroundColor: p.accent }} /> : null}
          </Press>
        );
      })}
    </View>
  );
}

export function Progress({ value, max, color }: { value: number; max: number; color?: string }) {
  const { p } = useTheme();
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: p.fill, overflow: "hidden" }}>
      <View style={{ width: `${pct * 100}%`, height: 4, borderRadius: 2, backgroundColor: color ?? p.accent }} />
    </View>
  );
}

export function SpoilerGuard({ level, reason, onReveal }: { level: string; reason: string; onReveal?: () => void }) {
  const { p } = useTheme();
  return (
    <Card style={{ padding: 16, gap: 12, borderWidth: 1, borderColor: p.line }}>
      <Row gap={12}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name={IC.lockSolid} size={17} color={p.accent} />
        </View>
        <Fill>
          <Row gap={6}>
            <T t="bodyEmph">Spoiler ahead — {level}</T>
          </Row>
          <T t="caption" color={p.textDim} style={{ marginTop: 2 }}>
            {reason}. Protected by your watch progress.
          </T>
        </Fill>
      </Row>
      <Row gap={10}>
        <Button label="Reveal anyway" variant="primary" size="sm" icon={IC.eye} onPress={onReveal} style={{ flex: 1 }} />
        <Button label="Keep hidden" variant="soft" size="sm" style={{ flex: 1 }} />
      </Row>
    </Card>
  );
}

export function TopBar({ title, onBack, right, subtitle }: { title?: string; onBack?: () => void; right?: React.ReactNode; subtitle?: string }) {
  const { p } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 52, marginBottom: 4 }}>
      {onBack ? <IconButton name={IC.back} onPress={onBack} /> : null}
      <Fill>
        {title ? (
          <T t="heading" numberOfLines={1}>
            {title}
          </T>
        ) : null}
        {subtitle ? (
          <T t="caption" color={p.textDim} numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
      </Fill>
      {right}
    </View>
  );
}

export interface TabDef {
  id: string;
  icon: IconName;
  activeIcon: IconName;
  label: string;
}

export const TABS: TabDef[] = [
  { id: "home", icon: IC.home, activeIcon: IC.homeActive, label: "Home" },
  { id: "discover", icon: IC.discover, activeIcon: IC.discoverActive, label: "Discover" },
  { id: "create", icon: IC.create, activeIcon: IC.create, label: "Create" },
  { id: "notifications", icon: IC.bell, activeIcon: IC.bellActive, label: "Inbox" },
  { id: "profile", icon: IC.person, activeIcon: IC.personActive, label: "You" },
];

/** Floating pill tab bar with a raised compose button. */
export function TabBar({ active, onTab, unread = 0 }: { active: string; onTab: (id: string) => void; unread?: number }) {
  const { p } = useTheme();
  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 20,
        height: 64,
        borderRadius: 32,
        backgroundColor: p.surface,
        ...SHADOW.bar,
        elevation: 8,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        if (t.id === "create") {
          return (
            <Press key={t.id} onPress={() => onTab(t.id)} style={{ flex: 1, alignItems: "center" }} accessibilityLabel="Create">
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  marginTop: -26,
                  ...SHADOW.fab,
                  elevation: 6,
                  overflow: "hidden",
                }}
              >
                <Gradient colors={brandGradient(p)} dir="diag" style={{ flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: p.canvas, borderRadius: 26 }}>
                  <Icon name={IC.create} size={24} color="#FFFFFF" />
                </Gradient>
              </View>
            </Press>
          );
        }
        return (
          <Press key={t.id} onPress={() => onTab(t.id)} style={{ flex: 1, alignItems: "center", gap: 3 }} accessibilityLabel={t.label}>
            <View style={{ position: "relative" }}>
              <Icon name={isActive ? t.activeIcon : t.icon} size={21} color={isActive ? p.accent : p.textFaint} />
              {t.id === "notifications" && unread > 0 ? (
                <View style={{ position: "absolute", top: -3, right: -5, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: p.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 2, borderColor: p.surface }}>
                  <Text style={{ color: p.onAccent, fontSize: 8, fontWeight: "700" }}>{unread > 9 ? "9+" : unread}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 10, fontWeight: "600", color: isActive ? p.text : p.textFaint }}>{t.label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

/* --------------------------------- helpers -------------------------------- */

export function count(n?: number): string {
  return n === undefined ? "" : fmtCount(n);
}

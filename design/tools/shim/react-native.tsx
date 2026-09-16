/**
 * React Native shim for the static design renderer.
 *
 * The renderer renders the REAL prototype components (the same source the app
 * runs) through react-test-renderer, but swaps `react-native` for these tiny
 * host-element stand-ins so the tree can be walked and translated to SVG.
 * Layout semantics mirror RN defaults (View = column flex container).
 */
import React from "react";

export function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, s) => Object.assign(acc, flattenStyle(s)), {});
  }
  if (typeof style === "function") return flattenStyle(style({ pressed: false, focused: false, selected: false }));
  return style as Record<string, unknown>;
}

function host(type: string, props: Record<string, unknown>, children?: React.ReactNode) {
  const { style, ...rest } = props;
  return React.createElement(type, { ...rest, style: flattenStyle(style) }, children);
}

export const View = (props: any) => host("hv", props, props.children);
export const Text = (props: any) => host("ht", props, props.children);
export const Image = (props: any) => host("him", props, null);
export const ScrollView = (props: any) => {
  const inner: Record<string, unknown> = { ...(props.horizontal ? { flexDirection: "row" } : {}) };
  return host("hv", { style: props.style }, [
    host("hvcc", { style: Object.assign(inner, flattenStyle(props.contentContainerStyle)) }, props.children),
  ]);
};
export const Pressable = (props: any) => {
  const style = typeof props.style === "function" ? props.style({ pressed: false }) : props.style;
  return host("hv", { ...props, style }, props.children);
};
export const TextInput = (props: any) =>
  host("hv", { style: props.style }, [
    React.createElement("ht", { style: { color: props.placeholderTextColor, fontSize: 15 } }, props.placeholder ?? ""),
  ]);

export const StyleSheet = {
  create: <T,>(s: T): T => s,
  flatten: flattenStyle,
  absoluteFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  hairlineWidth: 1,
};

export const Platform = { OS: "ios", select: (o: any) => o.ios ?? o.default };
export const useWindowDimensions = () => ({ width: 390, height: 844, scale: 1, fontScale: 1 });
export const Dimensions = { get: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }) };
export const PixelRatio = { get: () => 3, roundToNearestPixel: (n: number) => n };
export const AccessibilityInfo = { addEventListener: () => ({ remove: () => {} }) };
export const useColorScheme = () => "dark";
export const AppState = { currentState: "active", addEventListener: () => ({ remove: () => {} }) };
export const Keyboard = { dismiss: () => {}, addListener: () => ({ remove: () => {} }) };
export const Linking = { openURL: async () => {}, addEventListener: () => ({ remove: () => {} }) };

export default {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  PixelRatio,
  useWindowDimensions,
};

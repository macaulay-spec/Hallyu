import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { ThemeProvider, useTheme } from "./theme";
import { PALETTES, DEVICE, RADIUS } from "./tokens";
import { GROUPS, SCREENS } from "./registry";
import { IC, Icon } from "./icons";
import { Row, T } from "./ui";

/**
 * Interactive prototype shell (live preview only).
 *
 * A tiny in-memory navigator so the whole design can be clicked through without
 * touching the production router: `nav(id)` pushes a screen, hardware-style back
 * pops, tab ids swap the root. Production implementation will replace this shell
 * with Expo Router routes; the screens themselves are the deliverable.
 */

function Shell() {
  const { p, name, toggle } = useTheme();
  const { width } = useWindowDimensions();
  const [stack, setStack] = useState<string[]>(["06-home-foryou"]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const currentId = stack[stack.length - 1]!;
  const current = SCREENS.find((s) => s.id === currentId) ?? SCREENS[0]!;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [currentId, fade]);

  const nav = useMemo(
    () => (id: string) => {
      if (id === "back") return setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      const tabRoots: Record<string, string> = {
        home: "06-home-foryou",
        discover: "09-discover",
        create: "16-composer",
        notifications: "18-notifications",
        profile: "19-profile",
      };
      const target = tabRoots[id] ?? id;
      setStack((s) => (s[s.length - 1] === target ? s : [...s, target]));
    },
    []
  );

  const isWide = width > 520;
  const frame = (
    <Animated.View
      style={{
        width: DEVICE.width,
        height: DEVICE.height,
        overflow: "hidden",
        opacity: fade,
        backgroundColor: p.canvas,
        borderRadius: isWide ? 44 : 0,
        borderWidth: isWide ? 8 : 0,
        borderColor: "#1F1F24",
      }}
    >
      {current.make(nav)}
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isWide ? "#050507" : p.canvas, alignItems: isWide ? "center" : "stretch", justifyContent: isWide ? "center" : "flex-start" }}>
      {frame}

      {/* prototype chrome: screen switcher + theme toggle */}
      <View style={{ position: "absolute", right: 16, bottom: 16, flexDirection: "row", gap: 8 }}>
        <Pressable onPress={toggle} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: PALETTES.dark.surface, alignItems: "center", justifyContent: "center" }}>
          <Icon name={name === "dark" ? IC.sun : IC.moon} size={18} color="#F4F3F1" />
        </Pressable>
        <Pressable onPress={() => setPickerOpen((v) => !v)} style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: PALETTES.dark.accent, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{pickerOpen ? "Close" : "Screens"}</Text>
        </Pressable>
      </View>

      {pickerOpen ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 72, top: 0, backgroundColor: "rgba(5,5,7,0.86)", paddingHorizontal: 24, paddingTop: 40 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <T t="title" color="#F4F3F1" style={{ marginBottom: 12 }}>
              Prototype screens
            </T>
            {GROUPS.map((g) => (
              <View key={g} style={{ marginBottom: 18 }}>
                <Text style={{ color: "#6F6D78", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>{g.toUpperCase()}</Text>
                {SCREENS.filter((s) => s.group === g).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setStack([s.id]);
                      setPickerOpen(false);
                    }}
                    style={{ paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.id === currentId ? PALETTES.dark.accent : "#3A3A41" }} />
                    <Text style={{ color: s.id === currentId ? "#F4F3F1" : "#A8A6B0", fontSize: 14, fontWeight: s.id === currentId ? "600" : "400" }}>
                      {s.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function PrototypeApp() {
  return (
    <ThemeProvider initial="dark">
      <Shell />
    </ThemeProvider>
  );
}

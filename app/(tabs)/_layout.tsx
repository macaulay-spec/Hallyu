import { Tabs } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BRAND, EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { COLORS, TAB_BAR_HEIGHT } from "@/lib/theme";
import { SessionGate } from "../_layout";

// 5-tab root per Spec §4 (Home · Explore · Create · Notifications · Profile),
// auth-gated: unauthenticated users are redirected by SessionGate before any
// tab renders. The bar is a floating pill (reference design): rounded, inset
// from the screen edges, with the Create tab rendered as a raised gradient FAB.
// The Notifications tab carries a real unread badge from the inbox.

function TabIcon({
  glyph,
  focused,
  badge,
}: {
  glyph: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 20,
          color: focused ? "#8B5CF6" : "#726690",
          fontWeight: focused ? "700" : "400",
        }}
      >
        {glyph}
      </Text>
      {badge && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: COLORS.coral,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.4)",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Raised gradient FAB for the Create tab (reference design's centre pill). */
function CreateFab({ focused }: { focused: boolean }) {
  return (
    <View style={{ transform: [{ translateY: -14 }] }}>
      <LinearGradient
        colors={["#7B3FE4", "#2E7CDF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.25)",
          shadowColor: "#7B3FE4",
          shadowOpacity: 0.55,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "400", marginTop: -2 }}>+</Text>
      </LinearGradient>
      <Text
        style={{
          fontSize: 11,
          color: focused ? "#8B5CF6" : "#726690",
          textAlign: "center",
          marginTop: 2,
        }}
      >
        Create
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const unread = useQuery(api.notifications.unreadCount, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");

  return (
    <SessionGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            left: 16,
            right: 16,
            bottom: Platform.select({ ios: 20, default: 14 }),
            height: TAB_BAR_HEIGHT,
            borderRadius: 999,
            paddingTop: 8,
            paddingBottom: 6,
            backgroundColor: "rgba(23,17,42,0.96)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.12)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            shadowColor: "#000000",
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
          tabBarActiveTintColor: "#8B5CF6",
          tabBarInactiveTintColor: "#726690",
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: BRAND.name,
            tabBarIcon: ({ focused }) => <TabIcon glyph="⌂" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="explore/index"
          options={{
            title: "Explore",
            tabBarIcon: ({ focused }) => <TabIcon glyph="⌕" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            // The composer renders as a full-screen sheet and closes with its own
            // ✕ (Expo Router tab screens have no stack to present modally from).
            tabBarIcon: ({ focused }) => <CreateFab focused={focused} />,
            tabBarLabel: () => null,
          }}
        />
        <Tabs.Screen
          name="notifications/index"
          options={{
            title: "Notifications",
            tabBarIcon: ({ focused }) => (
              <TabIcon glyph="◔" focused={focused} badge={unread ?? 0} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => <TabIcon glyph="◯" focused={focused} />,
          }}
        />
      </Tabs>
    </SessionGate>
  );
}

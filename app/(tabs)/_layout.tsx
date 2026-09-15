import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BRAND, EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { SessionGate } from "../_layout";

// 5-tab root per Spec §4 (Home · Explore · Create · Notifications · Profile),
// auth-gated: unauthenticated users are redirected by SessionGate before any tab
// renders. The Notifications tab carries a real unread badge from the inbox.

function TabIcon({ glyph, focused, badge }: { glyph: string; focused: boolean; badge?: number }) {
  return (
    <View>
      <Text style={{ fontSize: 20, color: focused ? "#7B4FD8" : "#6B6B6B" }}>{glyph}</Text>
      {badge && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#FF6B6B",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
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

export default function TabsLayout() {
  const unread = useQuery(api.notifications.unreadCount, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");

  return (
    <SessionGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#1A1A1A",
            borderTopColor: "#2A2A2A",
            height: Platform.select({ ios: 84, default: 64 }),
            paddingTop: 6,
          },
          tabBarActiveTintColor: "#7B4FD8",
          tabBarInactiveTintColor: "#6B6B6B",
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
            tabBarIcon: ({ focused }) => <TabIcon glyph="＋" focused={focused} />,
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
            tabBarIcon: ({ focused }) => <TabIcon glyph="○" focused={focused} />,
          }}
        />
      </Tabs>
    </SessionGate>
  );
}

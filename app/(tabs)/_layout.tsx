import { Tabs } from "expo-router";
import { Text } from "react-native";
import { BRAND } from "@/lib/brand";
import { SessionGate } from "../_layout";

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, color: focused ? "#7B4FD8" : "#6B6B6B" }}>{glyph}</Text>
  );
}

// 5-tab root per Spec §4, auth-gated: unauthenticated users are redirected
// to /(auth)/welcome by SessionGate before any tab renders.
export default function TabsLayout() {
  return (
    <SessionGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#1A1A1A",
            borderTopColor: "#2A2A2A",
          },
          tabBarActiveTintColor: "#7B4FD8",
          tabBarInactiveTintColor: "#6B6B6B",
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
            tabBarIcon: ({ focused }) => <TabIcon glyph="＋" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="notifications/index"
          options={{
            title: "Notifications",
            tabBarIcon: ({ focused }) => <TabIcon glyph="◔" focused={focused} />,
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

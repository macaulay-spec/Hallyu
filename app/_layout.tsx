import "../global.css";
import React from "react";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { secureStorage } from "@/lib/secure-storage";
import { useEnsureProfile } from "@/lib/useEnsureProfile";

// Tolerant backend wiring (M0 heritage): when EXPO_PUBLIC_CONVEX_URL is
// absent the UI still boots with honest states; M1 ships with the local
// deployment URL in .env.local so real auth + data work.
function Providers({ children }: { children: React.ReactNode }) {
  if (!EXPO_PUBLIC_CONVEX_URL) {
    return <>{children}</>;
  }
  const client = new ConvexReactClient(EXPO_PUBLIC_CONVEX_URL);
  return (
    <ConvexAuthProvider client={client} storage={secureStorage}>
      {children}
    </ConvexAuthProvider>
  );
}

// SessionGate (SCREEN_NAVIGATION_MAP #1): splash auto-routes on session state.
function SessionGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  useEnsureProfile(isAuthenticated && !!EXPO_PUBLIC_CONVEX_URL);

  if (!EXPO_PUBLIC_CONVEX_URL) {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (isLoading) {
    return <Redirect href="/splash-loading" />;
  }
  return (
    <>
      {isAuthenticated ? children : <Redirect href="/(auth)/welcome" />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0F0F0F" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="splash-loading" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="drama/[slug]" />
            <Stack.Screen name="episode/[id]" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="community/[slug]" />
            <Stack.Screen name="user/[handle]" />
            <Stack.Screen name="hashtag/[tag]" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Gate is applied at the (tabs) layout level (authed area) rather than the
// root, so auth screens render without a redirect loop.
export { SessionGate };

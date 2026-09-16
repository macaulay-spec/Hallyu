import { ActivityIndicator, View } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { NotoSansKR_500Medium, NotoSansKR_700Bold } from "@expo-google-fonts/noto-sans-kr";
import PrototypeApp from "@/design/PrototypeApp";

/**
 * PROTOTYPE MOUNT — design review only (see /design/README.md).
 *
 * This single additive route exposes the coded Hallyu UI/UX prototype at
 * `/design` in the dev/preview build. It does not replace, link from, or alter
 * the production navigation tree, and the prototype never talks to Supabase,
 * Convex, TMDB or production auth. Remove this file when the approved design is
 * implemented into `app/` for real.
 */
export default function DesignRoute() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0C", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8465A" />
      </View>
    );
  }
  return <PrototypeApp />;
}

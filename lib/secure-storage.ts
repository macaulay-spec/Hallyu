import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Convex Auth TokenStorage backed by expo-secure-store (Keychain on iOS,
// EncryptedSharedPreferences on Android) per ARCHITECTURE §6 security rules.
// Web export falls back to localStorage inside ConvexAuthProvider (default).
const IS_WEB = Platform.OS === "web";

export const secureStorage = IS_WEB
  ? undefined
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Small platform-aware key/value store for NON-secret client preferences
// (recent searches, composer drafts). Not for credentials — auth tokens go
// through lib/secure-storage.ts. No new dependency is added: native uses the
// already-installed expo-secure-store (encrypted, overkill but correct), web
// uses localStorage. Nothing here ever reaches the server.
const IS_WEB = Platform.OS === "web";

export async function localGet(key: string): Promise<string | null> {
  try {
    if (IS_WEB) return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function localSet(key: string, value: string): Promise<void> {
  try {
    if (IS_WEB) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Best-effort local persistence: a failure never blocks the user action.
  }
}

export async function localList(key: string): Promise<string[]> {
  const raw = await localGet(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function localPush(key: string, value: string, max = 8): Promise<string[]> {
  const current = await localList(key);
  const next = [value, ...current.filter((v) => v !== value)].slice(0, max);
  await localSet(key, JSON.stringify(next));
  return next;
}

export async function localClear(key: string): Promise<void> {
  await localSet(key, JSON.stringify([]));
}

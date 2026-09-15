import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Screen, T, Row, Card, Button, Badge, ShimmerList } from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Edit profile (SCREEN_NAVIGATION_MAP #30). Handle validation and the uniqueness
// check run on the server; the client only mirrors the same regex for instant
// feedback. Nothing here fakes a save — errors surface verbatim.
export default function EditProfile() {
  const router = useRouter();
  const me = useQuery(api.users.me, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const updateProfile = useMutation(api.users.updateProfile);

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setHandle(me.handle);
      setBio(me.bio ?? "");
      setIsPrivate(me.isPrivate);
    }
  }, [me]);

  const handleValid = /^[a-z0-9_]{3,24}$/.test(handle);

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      await updateProfile({ displayName, bio, handle, isPrivate });
      setNotice({ tone: "ok", text: "Profile saved." });
    } catch (e) {
      const code = e instanceof Error ? e.message : "UNKNOWN";
      setNotice({
        tone: "bad",
        text: code.includes("HANDLE_TAKEN")
          ? "That handle is already taken."
          : code.includes("HANDLE_INVALID")
            ? "Handles can use a–z, 0–9 and _ between 3 and 24 characters."
            : "Couldn't save your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <T variant="h1">Edit profile</T>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
            >
              <T variant="secondary">‹</T>
            </Pressable>
          </Row>
        </View>

        {me === undefined ? (
          <ShimmerList rows={4} />
        ) : (
          <View className="px-4 mt-5">
            <T variant="h3">Display name</T>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              className="mt-2 h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
            />

            <Row className="mt-5 justify-between">
              <T variant="h3">Handle</T>
              {handleValid ? <Badge label="VALID" tone="success" /> : <Badge label="INVALID" tone="danger" />}
            </Row>
            <TextInput
              value={handle}
              onChangeText={(t) => setHandle(t.toLowerCase())}
              autoCapitalize="none"
              className="mt-2 h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
            />
            <T variant="tertiary" className="mt-1">
              a–z, 0–9 and _ · 3–24 characters · uniqueness is enforced server-side
            </T>

            <T variant="h3" className="mt-5">
              Bio
            </T>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={500}
              placeholder="What are you watching?"
              placeholderTextColor="#6B6B6B"
              className="mt-2 min-h-[96px] rounded-[12px] bg-card border border-line px-4 py-3 text-[15px] text-text-primary"
            />
            <T variant="tertiary" className="mt-1">
              {bio.length}/500
            </T>

            <Card className="mt-5 p-4">
              <Row className="justify-between">
                <View className="flex-1 pr-3">
                  <T variant="h3">Private account</T>
                  <T variant="secondary" className="mt-1">
                    Only approved followers can read your posts.
                  </T>
                </View>
                <Button
                  size="sm"
                  variant={isPrivate ? "primary" : "secondary"}
                  label={isPrivate ? "On" : "Off"}
                  onPress={() => setIsPrivate((v) => !v)}
                />
              </Row>
            </Card>

            {notice ? (
              <Card className="mt-4 p-3">
                <T variant={notice.tone === "ok" ? "secondary" : "coral"}>{notice.text}</T>
              </Card>
            ) : null}

            <Button
              label={saving ? "Saving…" : "Save profile"}
              disabled={saving || !handleValid || displayName.trim().length === 0}
              className="mt-5"
              onPress={save}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

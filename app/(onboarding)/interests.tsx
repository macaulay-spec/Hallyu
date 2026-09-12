import { useMemo, useState } from "react";
import { Stack, Link } from "expo-router";
import { Pressable, View } from "react-native";
import { Screen, T, Button } from "@/components/ui";
import { INTEREST_OPTIONS } from "@/lib/interests";

// Onboarding step 1 (Spec §34): genre/theme multi-select, min 3, guidance
// state when under 3 — never a long questionnaire.
export default function Interests() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canContinue = selected.length >= 3;
  const hint = useMemo(
    () => (canContinue ? `${selected.length} selected` : `Pick ${3 - selected.length} more to continue`),
    [canContinue, selected.length]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        What do you love?
      </T>
      <T variant="secondary" className="px-6 mt-2">
        {hint}
      </T>
      <View className="px-6 mt-6 flex-row flex-wrap gap-2">
        {INTEREST_OPTIONS.map((tag) => {
          const on = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggle(tag)}
              className={`rounded-full border px-4 py-2 ${on ? "border-brand bg-brand" : "border-line bg-card"}`}
            >
              <T variant="body" className={on ? "text-white" : ""}>
                {tag}
              </T>
            </Pressable>
          );
        })}
      </View>
      <View className="px-6 mt-8">
        <Link
          href={{
            pathname: "/(onboarding)/dramas",
            params: { interests: selected.join(",") },
          }}
          asChild
          disabled={!canContinue}
        >
          <Button label="Continue" disabled={!canContinue} />
        </Link>
      </View>
    </Screen>
  );
}

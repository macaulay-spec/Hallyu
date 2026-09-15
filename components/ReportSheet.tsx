import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Screen, T, Row, Button, Chip, cn } from "@/components/ui";
import { errorCopy } from "@/lib/copy";

// ReportSheet (Spec §27 / SCREEN_NAVIGATION_MAP "ReportSheet"). Reports go to
// the real pipeline — classification and severity come back from the server, so
// the UI can tell the user honestly what happened (including when a spam-flood
// auto-action kicked in) rather than pretending everything is "under review".

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate" },
  { value: "spoiler_misuse", label: "Spoiler misuse" },
  { value: "copyright", label: "Copyright" },
  { value: "misinformation", label: "Misinformation" },
  { value: "off_topic", label: "Off topic" },
  { value: "other", label: "Other" },
] as const;

export type ReportTarget = {
  targetType: "post" | "comment" | "user" | "community";
  targetId: string;
  label: string;
};

export function ReportSheet({
  target,
  onClose,
}: {
  target: ReportTarget | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ severity: string; autoAction: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createReport = useMutation(api.moderation.createReport);

  async function submit() {
    if (!target) return;
    setSending(true);
    setError(null);
    try {
      const res = await createReport({
        targetType: target.targetType,
        targetId: target.targetId,
        reason,
        details: details.trim() || undefined,
      });
      setResult({ severity: res.severity, autoAction: res.autoAction });
    } catch (e) {
      const code = e instanceof Error ? e.message : "UNKNOWN";
      setError(errorCopy(code.includes("RATE") ? "RATE_LIMITED" : "UNKNOWN").title);
    } finally {
      setSending(false);
    }
  }

  function close() {
    setResult(null);
    setDetails("");
    setError(null);
    onClose();
  }

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 bg-black/60" onPress={close} accessibilityLabel="Dismiss" />
      <View className="absolute bottom-0 left-0 right-0 rounded-t-[20px] border border-line bg-surface pb-8">
        <View className="px-4 pt-5">
          {result ? (
            <>
              <T variant="h2">Report received</T>
              <T variant="secondary" className="mt-1">
                {result.severity === "high"
                  ? "Our moderation team reviews high-severity reports first."
                  : "Our moderation team will review this."}
              </T>
              {result.autoAction ? (
                <T variant="tertiary" className="mt-2">
                  Content was automatically hidden pending human review (documented
                  spam-threshold action, reversible).
                </T>
              ) : null}
              <Button label="Done" className="mt-5" onPress={close} />
            </>
          ) : (
            <>
              <T variant="h2">Report {target?.label}</T>
              <T variant="secondary" className="mt-1">
                Reports are confidential. The author is never told who reported them.
              </T>
              <View className="flex-row flex-wrap mt-4">
                {REASONS.map((r) => (
                  <Chip
                    key={r.value}
                    label={r.label}
                    active={reason === r.value}
                    onPress={() => setReason(r.value)}
                  />
                ))}
              </View>
              <TextInput
                value={details}
                onChangeText={setDetails}
                multiline
                placeholder="Add context (optional)"
                placeholderTextColor="#6B6B6B"
                className="mt-2 min-h-[80px] rounded-[12px] bg-card border border-line px-4 py-3 text-[15px] text-text-primary"
              />
              {error ? (
                <T variant="coral" className="mt-2">
                  {error}
                </T>
              ) : null}
              <Row className="mt-4">
                <Button
                  label={sending ? "Sending…" : "Submit report"}
                  disabled={sending}
                  onPress={submit}
                  className="flex-1"
                />
                <Button variant="secondary" label="Cancel" onPress={close} className="ml-2" />
              </Row>
              <T variant="tertiary" className={cn("mt-3 text-center")}>
                You can appeal a moderation decision about your own content.
              </T>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

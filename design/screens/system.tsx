import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Badge, Button, Card, Col, Divider, Eyebrow, Fill, IconButton, Press, Row, Screen, Scroll, SkeletonPost, SpoilerGuard, T, TextField, TopBar, type Nav } from "../ui";
import { PostCard } from "../cards";
import { POSTS } from "../data";

/* ------------------------------ states sheet ------------------------------ */

export function StatesSheet() {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <Col gap={24} style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
          <View>
            <T t="display">States</T>
            <T t="caption" color={p.textDim}>
              Every surface ships with loading, empty, error and offline states — same copy, same rhythm.
            </T>
          </View>

          <View style={{ gap: 10 }}>
            <Eyebrow color={p.accent}>Loading</Eyebrow>
            <SkeletonPost />
          </View>

          <View style={{ gap: 10 }}>
            <Eyebrow color={p.accent}>Empty</Eyebrow>
            <Card style={{ padding: 8 }}>
              <View style={{ alignItems: "center", gap: 10, paddingVertical: 28, paddingHorizontal: 24 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: p.fill, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={IC.people} size={24} color={p.textFaint} />
                </View>
                <T t="heading" align="center">
                  Your fandom is quiet here.
                </T>
                <T t="caption" color={p.textDim} align="center">
                  Follow a few dramas or communities to get things moving.
                </T>
                <Button label="Find your people" variant="soft" size="sm" />
              </View>
            </Card>
          </View>

          <View style={{ gap: 10 }}>
            <Eyebrow color={p.accent}>Error</Eyebrow>
            <Card style={{ padding: 8 }}>
              <View style={{ alignItems: "center", gap: 10, paddingVertical: 28, paddingHorizontal: 24 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: p.dangerSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={IC.offline} size={24} color={p.danger} />
                </View>
                <T t="heading" align="center">
                  Couldn't load this right now.
                </T>
                <T t="caption" color={p.textDim} align="center">
                  Check your connection and try again.
                </T>
                <Button label="Retry" variant="soft" size="sm" icon={IC.refresh} />
              </View>
            </Card>
          </View>

          <View style={{ gap: 10 }}>
            <Eyebrow color={p.accent}>Offline</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.dangerSoft, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Icon name={IC.offline} size={16} color={p.danger} />
              <T t="caption" color={p.danger}>
                You're offline — showing the last synced feed.
              </T>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Eyebrow color={p.accent}>Spoiler guard</Eyebrow>
            <SpoilerGuard level="Episode 8" reason="You've watched through Ep 6" />
          </View>

          <View style={{ gap: 10, marginBottom: 16 }}>
            <Eyebrow color={p.accent}>Removed content</Eyebrow>
            <Card style={{ padding: 16, gap: 8 }}>
              <Row gap={8}>
                <Icon name={IC.alert} size={16} color={p.warn} />
                <T t="bodyEmph">This post was removed by moderators</T>
              </Row>
              <T t="caption" color={p.textDim}>
                It broke the community rule “tag spoilers by episode”. The author was notified and can appeal.
              </T>
            </Card>
          </View>
        </Col>
      </Scroll>
    </Screen>
  );
}

/* ------------------------------ report sheet ------------------------------ */

export function ReportSheet({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const reasons = ["Spoiler not tagged", "Harassment or hate", "Spam or scam", "Misinformation", "Something else"];
  const [picked] = React.useState(0);
  return (
    <Screen pad={false}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(6,6,8,0.55)" }}>
        <View style={{ backgroundColor: p.surface, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingTop: 10, paddingBottom: 28, paddingHorizontal: SPACE.md, gap: 16 }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: p.lineStrong }} />
          </View>
          <Row style={{ justifyContent: "space-between" }}>
            <T t="title">Report post</T>
            <IconButton name={IC.close} onPress={() => nav?.("post", {})} />
          </Row>
          <T t="caption" color={p.textDim}>
            Reports are anonymous. A human moderator reviews every case — automated actions only ever hide, never punish.
          </T>
          <Col gap={4}>
            {reasons.map((r, i) => (
              <Press key={r}>
                <Row gap={12} style={{ paddingVertical: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: i === picked ? p.accent : p.lineStrong, alignItems: "center", justifyContent: "center" }}>
                    {i === picked ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.accent }} /> : null}
                  </View>
                  <T t={i === picked ? "bodyEmph" : "body"} color={i === picked ? p.text : p.textDim}>
                    {r}
                  </T>
                </Row>
                {i < reasons.length - 1 ? <Divider inset={32} /> : null}
              </Press>
            ))}
          </Col>
          <TextField placeholder="Add detail (optional) — what did you see?" multiline height={72} />
          <Button label="Send report" size="lg" icon={IC.flag} />
        </View>
      </View>
    </Screen>
  );
}

/* ----------------------------- moderation queue --------------------------- */

export function ModerationQueue({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const item = POSTS[1]!;
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
        <TopBar title="Moderation queue" subtitle="Midnight Letters Theories · moderator" onBack={() => nav?.("profile")} right={<Badge label="Mod" tone="warn" icon={IC.shield} />} />
      </View>
      <Scroll pad={false} style={{ marginTop: 8 }}>
        <Col gap={14} style={{ paddingHorizontal: SPACE.md }}>
          <Row gap={8}>
            <Badge label="3 open" tone="accent" />
            <Badge label="1 appeal" tone="warn" />
            <Badge label="Auto-hidden: 0 today" />
          </Row>

          <Card style={{ padding: 16, gap: 12, borderWidth: 1, borderColor: p.line }}>
            <Row gap={8}>
              <Badge label="Spoiler misuse" tone="accent" icon={IC.lock} />
              <Badge label="Severity · medium" tone="warn" />
              <Fill />
              <T t="micro" color={p.textFaint}>
                12M AGO
              </T>
            </Row>
            <PostCard post={item} compact />
            <View style={{ backgroundColor: p.fill, borderRadius: RADIUS.md, padding: 12, gap: 6 }}>
              <T t="captionEmph">Reporter note</T>
              <T t="caption" color={p.textDim}>
                “Thread discusses Ep 9 beats under an Ep 8 tag. Three fans spoiled before Monday's broadcast.”
              </T>
              <T t="caption" color={p.textFaint}>
                Rule 2 · tag spoilers by episode · 2 prior warnings on author
              </T>
            </View>
            <Row gap={8}>
              <Button label="Approve" variant="soft" size="sm" icon={IC.check} style={{ flex: 1 }} />
              <Button label="Re-tag Ep 9" variant="soft" size="sm" icon={IC.edit} style={{ flex: 1 }} />
              <Button label="Hide" variant="soft" size="sm" icon={IC.eyeOff} style={{ flex: 1 }} />
            </Row>
            <Row gap={6}>
              <Icon name={IC.info} size={13} color={p.textFaint} />
              <T t="micro" color={p.textFaint}>
                EVERY DECISION IS LOGGED AND NOTIFIES THE AUTHOR WITH AN APPEAL PATH
              </T>
            </Row>
          </Card>

          <Card style={{ padding: 16, gap: 10 }}>
            <Row gap={8}>
              <Badge label="Appeal" tone="warn" icon={IC.refresh} />
              <Fill />
              <T t="micro" color={p.textFaint}>
                1D AGO
              </T>
            </Row>
            <T t="bodyEmph">Author appeal: hidden post from 12 Sep</T>
            <T t="caption" color={p.textDim}>
              “I tagged it Ep 8 because the theory only uses Ep 8 frames. Happy to re-tag if the stamp detail counts as Ep 9.”
            </T>
            <Row gap={8}>
              <Button label="Uphold" variant="soft" size="sm" style={{ flex: 1 }} />
              <Button label="Restore post" variant="soft" size="sm" icon={IC.check} style={{ flex: 1 }} />
            </Row>
          </Card>
        </Col>
      </Scroll>
    </Screen>
  );
}

import React from "react";
import { View } from "react-native";
import { MOTION, RADIUS, SPACE, TYPE } from "../tokens";
import { ThemeProvider, useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Avatar, Badge, Button, Card, Chip, Col, Divider, Eyebrow, Fill, IconButton, Press, Row, Screen, Scroll, T, TextField, type Nav } from "../ui";
import { PostCard } from "../cards";
import { ME, POSTS, USERS } from "../data";

function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  const { p } = useTheme();
  return (
    <View style={{ width: 104, gap: 6 }}>
      <View style={{ height: 64, borderRadius: 14, backgroundColor: color, borderWidth: 1, borderColor: p.line }} />
      <T t="micro" color={p.text}>
        {name.toUpperCase()}
      </T>
      <T t="micro" color={p.textFaint}>
        {hex.toUpperCase()}
      </T>
    </View>
  );
}

export function DesignSystemSheet() {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <Col gap={26} style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
          <View style={{ gap: 6 }}>
            <Eyebrow color={p.accent}>Foundations · Ink &amp; Rose</Eyebrow>
            <T t="display">Design system</T>
            <T t="caption" color={p.textDim}>
              One token file drives every screen: neutral ink canvas, a single rose accent, Inter with heavy weight contrast, 4pt grid, 20pt cards.
            </T>
          </View>

          <View style={{ gap: 12 }}>
            <T t="heading">Colour</T>
            <Row gap={12}>
              <Swatch color={p.canvas} name="canvas" hex="#0A0A0C" />
              <Swatch color={p.surface} name="surface" hex="#141417" />
              <Swatch color={p.surfaceHigh} name="elevated" hex="#1C1C21" />
            </Row>
            <Row gap={12}>
              <Swatch color={p.accent} name="accent" hex="#E8465A" />
              <Swatch color={p.ink} name="ink duo" hex="#16233F" />
              <Swatch color={p.success} name="success" hex="#3ECF8E" />
            </Row>
            <Row gap={12}>
              <Swatch color={p.text} name="text" hex="#F4F3F1" />
              <Swatch color={p.textDim} name="text dim" hex="#A8A6B0" />
              <Swatch color={p.textFaint} name="faint" hex="#6F6D78" />
            </Row>
          </View>

          <View style={{ gap: 10 }}>
            <T t="heading">Type scale</T>
            <Card style={{ padding: 16, gap: 12 }}>
              <T t="displayXL">Display XL 34/40</T>
              <T t="display">Display 28/34</T>
              <T t="title">Title 22/28</T>
              <T t="heading">Heading 17/24</T>
              <T t="body">Body 15/22 — the feed voice.</T>
              <T t="caption" color={p.textDim}>
                Caption 13/18 — metadata, timestamps.
              </T>
              <T t="micro" color={p.textFaint}>
                MICRO 11/14 — EYEBROWS, COUNTERS
              </T>
              <T t="krDisplay" color={p.textDim}>
                한류 28/36
              </T>
            </Card>
          </View>

          <View style={{ gap: 10 }}>
            <T t="heading">Controls</T>
            <Card style={{ padding: 16, gap: 12 }}>
              <Row gap={10}>
                <Button label="Primary" style={{ flex: 1 }} />
                <Button label="Soft" variant="soft" style={{ flex: 1 }} />
                <Button label="Outline" variant="outline" style={{ flex: 1 }} />
              </Row>
              <Row gap={10}>
                <Button label="Danger" variant="danger" style={{ flex: 1 }} />
                <Button label="Disabled" disabled style={{ flex: 1 }} />
                <Button label="Small" size="sm" style={{ flex: 1 }} />
              </Row>
              <Row gap={8}>
                <Chip label="Selected" selected />
                <Chip label="Chip" />
                <Badge label="Official" tone="official" icon={IC.verified} />
                <Badge label="Live" tone="accent" />
                <Badge label="Warn" tone="warn" />
              </Row>
              <TextField placeholder="Input · 48pt, 12pt radius" icon={IC.search} />
              <Row gap={16}>
                <IconButton name={IC.heart} />
                <IconButton name={IC.bell} badge={3} />
                <IconButton name={IC.settings} tone="surface" />
                <Avatar art={ME.art} name={ME.name} size={40} official />
                <Avatar art={USERS.daran!.art} name={USERS.daran!.name} size={40} />
              </Row>
            </Card>
          </View>

          <View style={{ gap: 10 }}>
            <T t="heading">Iconography</T>
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
                {Object.values(IC)
                  .slice(0, 24)
                  .map((n) => (
                    <Icon key={n} name={n} size={20} color={p.textDim} />
                  ))}
              </View>
              <T t="caption" color={p.textDim} style={{ marginTop: 12 }}>
                Ionicons outline, 14–28pt ladder. Filled only for active states.
              </T>
            </Card>
          </View>

          <View style={{ gap: 10 }}>
            <T t="heading">Space · radius · motion</T>
            <Card style={{ padding: 16, gap: 12 }}>
              <Row gap={6} align="flex-start">
                {[4, 8, 12, 16, 20, 24, 32].map((s) => (
                  <Col key={s} gap={6} style={{ alignItems: "center" }}>
                    <View style={{ width: s, height: s, backgroundColor: p.accentSoft, borderRadius: 3 }} />
                    <T t="micro" color={p.textFaint}>
                      {s}
                    </T>
                  </Col>
                ))}
              </Row>
              <Row gap={10}>
                {[RADIUS.sm, RADIUS.md, RADIUS.lg, RADIUS.card].map((r) => (
                  <View key={r} style={{ width: 52, height: 40, borderRadius: r, backgroundColor: p.surfaceHigh, borderWidth: 1, borderColor: p.line }} />
                ))}
              </Row>
              <T t="caption" color={p.textDim}>
                Radii 8 / 12 / 16 / 20 · pill 999. Cards 20, controls 12, media 16.
              </T>
              <Divider />
              <Col gap={6}>
                <T t="captionEmph">Motion contract</T>
                <T t="caption" color={p.textDim}>
                  press {MOTION.press.scale} @ {MOTION.press.duration}ms · screen enter rise {MOTION.screenEnter.translateY}px @ {MOTION.screenEnter.duration}ms · reaction pop {MOTION.pop.duration}ms · shimmer {MOTION.shimmer.duration}ms · brand wave {MOTION.wave.duration}ms
                </T>
              </Col>
            </Card>
          </View>

          <View style={{ gap: 10, marginBottom: 16 }}>
            <T t="heading">Principles</T>
            <Card style={{ padding: 16, gap: 10 }}>
              {[
                ["Content first", "Chrome never out-shines a fan's post or a drama's art."],
                ["Thumb first", "Primary actions live in the bottom third, inside the pill bar."],
                ["Quiet surfaces", "No borders by default; elevation and hairlines only where lists need them."],
                ["Honest states", "Loading, empty, error, offline and spoiler states are designed, not appended."],
              ].map(([t, b]) => (
                <Row key={t} gap={10} align="flex-start">
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.accent, marginTop: 7 }} />
                  <Fill>
                    <T t="bodyEmph">{t}</T>
                    <T t="caption" color={p.textDim}>
                      {b}
                    </T>
                  </Fill>
                </Row>
              ))}
            </Card>
          </View>
        </Col>
      </Scroll>
    </Screen>
  );
}

/* -------------------------------- light mode ------------------------------ */

function LightFragment({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <Col gap={16} style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View>
              <T t="display" style={{ fontSize: 30, lineHeight: 34 }}>
                Hallyu
              </T>
              <T t="micro" color={p.textFaint}>
                한류 · LIGHT, NOT INVERTED
              </T>
            </View>
            <Row gap={4}>
              <IconButton name={IC.search} />
              <IconButton name={IC.bell} badge={3} />
            </Row>
          </Row>
          <Row gap={8}>
            <Chip label="For You" selected />
            <Chip label="Following" />
            <Chip label="Airing" />
          </Row>
          <PostCard post={POSTS[0]!} onOpen={() => nav?.("post", {})} />
          <Row gap={10}>
            <Button label="Follow" icon={IC.personAdd} style={{ flex: 1 }} />
            <Button label="Soft" variant="soft" style={{ flex: 1 }} />
          </Row>
          <Card style={{ padding: 16, gap: 8 }}>
            <T t="bodyEmph">Hanji paper light</T>
            <T t="caption" color={p.textDim}>
              Warm paper canvas, true white cards, deeper rose accent for AA contrast — drawn from the same token file, not a colour flip.
            </T>
          </Card>
        </Col>
      </Scroll>
    </Screen>
  );
}

export function LightModeSheet({ nav }: { nav?: Nav }) {
  return (
    <ThemeProvider initial="light">
      <LightFragment nav={nav} />
    </ThemeProvider>
  );
}

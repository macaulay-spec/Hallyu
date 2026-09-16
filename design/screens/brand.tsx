import React from "react";
import { View } from "react-native";
import { SPACE, brandGradient } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { AppIcon, Card, Col, Eyebrow, Gradient, HallyuMark, Row, Scroll, Screen, T } from "../ui";

/** Brand sheet: the app icon, its variants, size ladder and in-context mocks. */
export function IconSheet() {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <Col gap={24} style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
          <View style={{ gap: 6 }}>
            <Eyebrow color={p.accent}>Foundations · Brand</Eyebrow>
            <T t="display">The Hallyu mark</T>
            <T t="caption" color={p.textDim}>
              Hangul ㅎ (hieut) reduced to three strokes — tick, bar, ring — on the Ink &amp; Rose grid. The shipped icon is a generated render of this coded mark; rose on ink is the primary pair.
            </T>
          </View>

          <Card style={{ padding: 20 }}>
            <Row gap={20} align="center">
              <AppIcon size={120} />
              <Col gap={10}>
                <Row gap={10} align="center">
                  <HallyuMark size={48} variant="rose" />
                  <HallyuMark size={48} variant="light" />
                  <View style={{ width: 48, height: 48, borderRadius: 10.8, backgroundColor: "#23232A", alignItems: "center", justifyContent: "center" }}>
                    <HallyuMark size={30} variant="mono" boxed={false} />
                  </View>
                </Row>
                <T t="caption" color={p.textDim}>rose · light · mono</T>
              </Col>
            </Row>
          </Card>

          <View style={{ gap: 12 }}>
            <T t="heading">Size ladder</T>
            <Card style={{ padding: 20 }}>
              <Row gap={14} align="flex-start">
                {[88, 60, 44, 32, 24].map((s) => (
                  <Col key={s} gap={8} style={{ alignItems: "center" }}>
                    <HallyuMark size={s} />
                    <T t="caption" color={p.textDim}>{s}</T>
                  </Col>
                ))}
              </Row>
              <T t="caption" color={p.textDim} style={{ marginTop: 14 }}>
                Legible to 24dp. Below 32dp the ring stroke holds at 9u — never thinned.
              </T>
            </Card>
          </View>

          <View style={{ gap: 12 }}>
            <T t="heading">In context</T>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Gradient colors={["#1C2536", "#0B0B0E"]} dir="diag" style={{ padding: 22, gap: 16 }}>
                <Row gap={20} align="flex-start">
                  <Col gap={6} style={{ alignItems: "center" }}>
                    <AppIcon size={60} />
                    <T t="caption" color="#FFFFFF">Hallyu</T>
                  </Col>
                  {[IC.tv, IC.heart, IC.image].map((ic, i) => (
                    <Col key={i} gap={6} style={{ alignItems: "center" }}>
                      <View style={{ width: 60, height: 60, borderRadius: 13.5, backgroundColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={ic} size={24} color="rgba(255,255,255,0.55)" />
                      </View>
                      <T t="caption" color="rgba(255,255,255,0.55)">···</T>
                    </Col>
                  ))}
                </Row>
                <T t="caption" color="rgba(255,255,255,0.45)">Home screen · the rose ring carries at a glance</T>
              </Gradient>
            </Card>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Gradient colors={brandGradient(p)} dir="diag" style={{ alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 30, paddingBottom: 30 }}>
                <AppIcon size={68} />
                <T t="displayXL" color="#FFFFFF" style={{ fontSize: 34, lineHeight: 40, marginTop: 6 }}>Hallyu</T>
                <T t="krDisplay" color="rgba(255,255,255,0.82)">한류</T>
              </Gradient>
            </Card>
          </View>

          <View style={{ gap: 12 }}>
            <T t="heading">Construction</T>
            <Card style={{ padding: 18, gap: 6 }}>
              <T t="caption" color={p.textDim}>Grid 100u · tick 9×14 @ y14 · bar 46×9 @ y32 · ring 42u, 9u stroke @ y46</T>
              <T t="caption" color={p.textDim}>Squircle radius 22.5% · rose #E8465A on ink #0A0A0C · hairline rgba(255,255,255,0.10)</T>
              <T t="caption" color={p.textDim}>Mono only over photography or brand gradient · never outline, never bevel, never gradient-fill the glyph</T>
            </Card>
          </View>
        </Col>
      </Scroll>
    </Screen>
  );
}

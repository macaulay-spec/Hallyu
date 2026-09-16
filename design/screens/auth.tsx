import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE, brandGradient } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Button, Col, Eyebrow, Fill, Gradient, HallyuMark, Press, Row, Screen, T, TextField, TopBar, type Nav } from "../ui";

/* ---------------------------------- splash -------------------------------- */

export function Splash() {
  const { p } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Gradient colors={brandGradient(p)} dir="diag" style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
        <HallyuMark size={78} />
        <T t="displayXL" color="#FFFFFF" style={{ fontSize: 44, lineHeight: 50, marginTop: 8 }}>
          Hallyu
        </T>
        <T t="krDisplay" color="rgba(255,255,255,0.82)">
          한류
        </T>
        <T t="caption" color="rgba(255,255,255,0.66)" style={{ marginTop: 6 }}>
          Where the wave lives
        </T>
        <View style={{ position: "absolute", bottom: 56, width: 120, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <View style={{ width: "42%", height: 3, borderRadius: 2, backgroundColor: "#FFFFFF" }} />
        </View>
      </Gradient>
    </View>
  );
}

/* --------------------------------- welcome -------------------------------- */

export function Welcome({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const props = [
    { icon: IC.tv, title: "Every drama, alive", body: "Episode hubs that open the second the credits roll." },
    { icon: IC.lock, title: "Spoilers, contained", body: "Your watch progress guards every feed and thread." },
    { icon: IC.people, title: "Your fandom, gathered", body: "Communities, theories and edits in one home." },
  ];
  return (
    <Screen>
      <Fill style={{ justifyContent: "center", gap: 6 }}>
        <Eyebrow color={p.accent}>The social home of K-drama</Eyebrow>
        <T t="displayXL" style={{ marginTop: 4 }}>
          Where the
          {"\n"}
          wave lives.
        </T>
        <T t="krBody" color={p.textDim} style={{ marginTop: 2 }}>
          한류 — 드라마와 팬덤이 만나는 곳
        </T>
        <Col gap={14} style={{ marginTop: 28 }}>
          {props.map((f) => (
            <Row key={f.title} gap={14}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: p.surface, alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} size={20} color={p.accent} />
              </View>
              <Fill>
                <T t="bodyEmph">{f.title}</T>
                <T t="caption" color={p.textDim}>
                  {f.body}
                </T>
              </Fill>
            </Row>
          ))}
        </Col>
      </Fill>
      <Col gap={10} style={{ paddingBottom: 28 }}>
        <Button label="Create your account" size="lg" onPress={() => nav?.("signup")} />
        <Button label="I already have an account" variant="ghost" size="lg" onPress={() => nav?.("signin")} />
        <T t="micro" color={p.textFaint} align="center" style={{ marginTop: 6 }}>
          BY CONTINUING YOU AGREE TO THE TERMS AND PRIVACY POLICY
        </T>
      </Col>
    </Screen>
  );
}

/* ---------------------------------- sign in ------------------------------- */

function GoogleButton() {
  const { p } = useTheme();
  return (
    <Press>
      <View style={{ height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: p.lineStrong, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: p.text, borderLeftColor: "transparent", transform: [{ rotate: "-45deg" }] }} />
        <T t="bodyEmph">Continue with Google</T>
      </View>
    </Press>
  );
}

export function SignIn({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen>
      <TopBar title="Welcome back" onBack={() => nav?.("welcome")} />
      <Col gap={14} style={{ marginTop: 12 }}>
        <TextField placeholder="Email" icon={IC.person} />
        <TextField placeholder="Password" icon={IC.lock} />
        <Row style={{ justifyContent: "flex-end" }}>
          <Press>
            <T t="captionEmph" color={p.accent}>
              Forgot password?
            </T>
          </Press>
        </Row>
        <Button label="Log in" size="lg" style={{ marginTop: 4 }} onPress={() => nav?.("home")} />
        <Row gap={12} style={{ marginVertical: 6 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: p.line }} />
          <T t="micro" color={p.textFaint}>
            OR
          </T>
          <View style={{ flex: 1, height: 1, backgroundColor: p.line }} />
        </Row>
        <GoogleButton />
        <Row gap={6} style={{ justifyContent: "center", marginTop: 10 }}>
          <T t="caption" color={p.textDim}>
            New here?
          </T>
          <Press onPress={() => nav?.("signup")}>
            <T t="captionEmph" color={p.accent}>
              Create an account
            </T>
          </Press>
        </Row>
      </Col>
    </Screen>
  );
}

/* ---------------------------------- sign up ------------------------------- */

export function SignUp({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen>
      <TopBar title="Create your account" onBack={() => nav?.("welcome")} />
      <T t="caption" color={p.textDim}>
        Join the wave — follow dramas, discuss episodes safely.
      </T>
      <Col gap={14} style={{ marginTop: 16 }}>
        <TextField placeholder="Display name" icon={IC.person} />
        <Row gap={10}>
          <Fill>
            <TextField placeholder="Handle" icon={IC.sparkles} />
          </Fill>
          <View style={{ height: 48, justifyContent: "center", backgroundColor: p.surfaceHigh, borderRadius: RADIUS.md, paddingHorizontal: 12 }}>
            <T t="captionEmph" color={p.success}>
              @seoulights ✓
            </T>
          </View>
        </Row>
        <TextField placeholder="Email" icon={IC.person} />
        <View style={{ gap: 8 }}>
          <TextField placeholder="Password · 8+ characters" icon={IC.lock} />
          <Row gap={4}>
            {[1, 1, 1, 0].map((on, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: on ? p.success : p.fill }} />
            ))}
          </Row>
          <T t="micro" color={p.success}>
            STRONG — ADD A SYMBOL FOR EXTRA SAFETY
          </T>
        </View>
        <Button label="Create account" size="lg" onPress={() => nav?.("onboarding")} style={{ marginTop: 4 }} />
        <Row gap={12} style={{ marginVertical: 2 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: p.line }} />
          <T t="micro" color={p.textFaint}>
            OR
          </T>
          <View style={{ flex: 1, height: 1, backgroundColor: p.line }} />
        </Row>
        <GoogleButton />
      </Col>
    </Screen>
  );
}

/* -------------------------------- onboarding ------------------------------ */

export function Onboarding({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const genres = ["Romance", "Thriller", "Sageuk", "Comedy", "Melodrama", "Fantasy", "Healing", "Mystery", "Youth", "Webtoon adaptations"];
  const picked = new Set(["Melodrama", "Sageuk", "Healing"]);
  return (
    <Screen>
      <TopBar title="" onBack={() => nav?.("signup")} right={<T t="captionEmph" color={p.textDim}>Skip</T>} />
      <Row gap={4} style={{ marginBottom: 18 }}>
        {[1, 0, 0, 0].map((on, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: on ? p.accent : p.fill }} />
        ))}
      </Row>
      <Eyebrow color={p.accent}>Step 1 of 4</Eyebrow>
      <T t="display" style={{ marginTop: 6 }}>
        What do you
        {"\n"}
        love to feel?
      </T>
      <T t="caption" color={p.textDim} style={{ marginTop: 8 }}>
        Pick at least three. This shapes For You — you can change it anytime.
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {genres.map((g) => {
          const on = picked.has(g);
          return (
            <Press key={g}>
              <View style={{ height: 38, paddingHorizontal: 16, borderRadius: RADIUS.pill, backgroundColor: on ? p.accent : p.surface, borderWidth: on ? 0 : 1, borderColor: p.line, justifyContent: "center" }}>
                <T t="captionEmph" color={on ? p.onAccent : p.textDim}>
                  {g}
                </T>
              </View>
            </Press>
          );
        })}
      </View>
      <Fill />
      <Col gap={10} style={{ paddingBottom: 28 }}>
        <Button label="Continue" size="lg" />
        <T t="micro" color={p.textFaint} align="center">
          3 OF 3 SELECTED · NEXT: DRAMAS YOU ALREADY LOVE
        </T>
      </Col>
    </Screen>
  );
}

import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Avatar, Badge, Button, Chip, Col, Divider, Fill, IconButton, Poster, Press, Row, Screen, Scroll, Switch, T, TopBar, type Nav } from "../ui";
import { CommentRow, ReactionPicker } from "../cards";
import { COMMENTS, DRAMAS, ME, POSTS, USERS } from "../data";

/* -------------------------------- post detail ----------------------------- */

export function PostDetail({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const post = POSTS[1]!;
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md }}>
        <TopBar title="Post" onBack={() => nav?.("home")} right={<IconButton name={IC.more} />} />
      </View>
      <Scroll pad={false}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 14 }}>
          <Row gap={12}>
            <Avatar art={post.author.art} name={post.author.name} size={44} />
            <Fill>
              <T t="bodyEmph">{post.author.name}</T>
              <T t="caption" color={p.textDim}>
                @{post.author.handle} · {post.ago}
              </T>
            </Fill>
            <Button label="Follow" variant="soft" size="sm" />
          </Row>

          <Press onPress={() => nav?.("drama", { id: post.drama?.id ?? "" })}>
            <View style={{ flexDirection: "row", alignSelf: "flex-start", gap: 6, alignItems: "center", backgroundColor: p.fill, borderRadius: RADIUS.pill, paddingHorizontal: 10, height: 28 }}>
              <Poster art={post.drama!.art} width={16} height={16} rounded={5} />
              <T t="captionEmph" color={p.textDim}>
                {post.drama!.title} · Ep {post.episode}
              </T>
              <Badge label={post.category} tone="accent" />
            </View>
          </Press>

          <T t="body" style={{ fontSize: 16, lineHeight: 24 }}>
            {post.body}
          </T>

          {post.art ? (
            <View style={{ position: "relative" }}>
              <Poster art={post.art} width={358} height={240} rounded={RADIUS.lg} />
            </View>
          ) : null}

          {/* reaction summary */}
          <Row gap={8}>
            <Row gap={0}>
              {[USERS.jiwoo!, USERS.daran!, USERS.aria!].map((u) => (
                <View key={u.id} style={{ marginLeft: -6, borderWidth: 2, borderColor: p.canvas, borderRadius: 14 }}>
                  <Avatar art={u.art} name={u.name} size={24} />
                </View>
              ))}
            </Row>
            <T t="caption" color={p.textDim}>
              714 reacted · 141 comments · 74 reposts
            </T>
          </Row>

          <Divider />

          {/* action bar */}
          <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
            <Row gap={22}>
              <Row gap={6}>
                <Icon name={IC.heartActive} size={21} color={p.accent} />
                <T t="captionEmph" color={p.accent}>
                  714
                </T>
              </Row>
              <Row gap={6}>
                <Icon name={IC.comment} size={20} color={p.textDim} />
                <T t="captionEmph" color={p.textDim}>
                  141
                </T>
              </Row>
              <Row gap={6}>
                <Icon name={IC.repost} size={20} color={p.textDim} />
                <T t="captionEmph" color={p.textDim}>
                  74
                </T>
              </Row>
            </Row>
            <Row gap={22}>
              <Icon name={IC.bookmark} size={20} color={p.textDim} />
              <Icon name={IC.share} size={20} color={p.textDim} />
            </Row>
          </Row>

          {/* reaction picker (long-press the heart) */}
          <ReactionPicker />

          <Divider />

          <Row style={{ justifyContent: "space-between" }}>
            <T t="heading">141 comments</T>
            <Row gap={6}>
              <Icon name={IC.sparkles} size={14} color={p.textFaint} />
              <T t="caption" color={p.textDim}>
                Most relevant
              </T>
            </Row>
          </Row>

          {COMMENTS.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
          <View style={{ height: 8 }} />
        </View>
      </Scroll>

      {/* reply composer */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Avatar art={ME.art} name={ME.name} size={36} />
        <Fill>
          <View style={{ backgroundColor: p.surfaceHigh, borderRadius: RADIUS.pill, height: 40, justifyContent: "center", paddingHorizontal: 16 }}>
            <T t="body" color={p.textFaint}>
              Reply to @haneul_reads…
            </T>
          </View>
        </Fill>
        <IconButton name={IC.image} />
        <View style={{ backgroundColor: p.accent, borderRadius: RADIUS.pill, width: 40, height: 40, alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
          <Icon name="paper-plane" size={17} color={p.onAccent} />
        </View>
      </View>
    </Screen>
  );
}

/* --------------------------------- composer ------------------------------- */

export function Composer({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      {/* sheet chrome */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: p.lineStrong }} />
      </View>
      <View style={{ paddingHorizontal: SPACE.md, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <IconButton name={IC.close} onPress={() => nav?.("home")} />
        <Fill>
          <T t="heading">New post</T>
        </Fill>
        <Button label="Post" size="sm" disabled={false} />
      </View>

      <Scroll pad={false} style={{ marginTop: 8 }}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 16 }}>
          <Row gap={10}>
            <Avatar art={ME.art} name={ME.name} size={40} />
            <Fill>
              <T t="bodyEmph">{ME.name}</T>
              <T t="caption" color={p.textDim}>
                @{ME.handle} · Public
              </T>
            </Fill>
            <Icon name={IC.down} size={16} color={p.textFaint} />
          </Row>

          <Row gap={8}>
            {["Reaction", "Discussion", "Theory", "Meme", "Question", "Fan content"].map((c, i) => (
              <Chip key={c} label={c} selected={i === 2} />
            ))}
          </Row>

          <T t="body" style={{ fontSize: 16, lineHeight: 24, minHeight: 96 }}>
            Okay so the stamp colour in ep 8 matches the 1986 print run, which means the letters aren't coming from the future at all — they're coming from the timeline where Ji-an opened the door. The postmark town proves it.
          </T>

          {/* context */}
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, padding: 14, gap: 12 }}>
            <Row gap={8}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: p.fill, borderRadius: RADIUS.pill, paddingHorizontal: 10, height: 30 }}>
                <Poster art={DRAMAS.midnight!.art} width={16} height={16} rounded={5} />
                <T t="captionEmph">Midnight Letters</T>
                <Icon name={IC.close} size={12} color={p.textFaint} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: p.fill, borderRadius: RADIUS.pill, paddingHorizontal: 10, height: 30 }}>
                <T t="captionEmph">Ep 8</T>
                <Icon name={IC.down} size={12} color={p.textFaint} />
              </View>
              <Fill />
              <T t="caption" color={p.textFaint}>
                Context
              </T>
            </Row>
            <Divider />
            <Row gap={10}>
              <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.lockSolid} size={15} color={p.accent} />
              </View>
              <Fill>
                <T t="bodyEmph">Spoiler protection</T>
                <T t="caption" color={p.textDim}>
                  Hidden from fans behind Ep 8
                </T>
              </Fill>
              <Switch on />
            </Row>
          </View>

          {/* media */}
          <Row gap={10}>
            <Poster art={{ from: "#131C33", to: "#4C6FB8", motif: "moon" }} width={92} height={92} rounded={14}>
              <View style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(6,6,8,0.7)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.close} size={11} color="#fff" />
              </View>
            </Poster>
            <View style={{ width: 92, height: 92, borderRadius: 14, borderWidth: 1, borderColor: p.lineStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Icon name={IC.image} size={20} color={p.textFaint} />
              <T t="micro" color={p.textFaint}>
                ADD · 3 LEFT
              </T>
            </View>
          </Row>

          {/* hashtags */}
          <View style={{ gap: 8 }}>
            <T t="captionEmph" color={p.textDim}>
              Suggested tags
            </T>
            <Row gap={8}>
              <Chip label="#stamptheory" selected icon={IC.check} />
              <Chip label="#midnightletters" icon={IC.sparkles} />
              <Chip label="#ep8" icon={IC.sparkles} />
            </Row>
          </View>

          <Row style={{ justifyContent: "space-between", paddingBottom: 12 }}>
            <Row gap={14}>
              <Icon name={IC.image} size={20} color={p.textDim} />
              <Row gap={4}>
                <Icon name={IC.video} size={20} color={p.textFaint} />
                <Badge label="v1.1" />
              </Row>
              <Row gap={4}>
                <Icon name="bar-chart-outline" size={20} color={p.textFaint} />
                <Badge label="v1.1" />
              </Row>
            </Row>
            <T t="captionEmph" color={p.textFaint}>
              312 / 5,000
            </T>
          </Row>
        </View>
      </Scroll>
    </Screen>
  );
}

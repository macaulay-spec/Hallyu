import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Avatar, Badge, Button, Chip, Col, Divider, Fill, IconButton, Poster, Press, Progress, Rail, Row, Screen, Scroll, SectionHeader, Segmented, T, TopBar, type Nav } from "../ui";
import { ActorCard, EpisodeRow, PostCard } from "../cards";
import { ACTORS, CAST, DRAMAS, EPISODES, ME, POSTS } from "../data";

export function DramaHub({ nav, id = "midnight" }: { nav?: Nav; id?: string }) {
  const { p } = useTheme();
  const d = DRAMAS[id] ?? DRAMAS.midnight!;
  const cast = CAST[d.id] ?? [{ actor: ACTORS.sooyeon!, role: "Lead" }];

  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        {/* hero */}
        <View style={{ position: "relative" }}>
          <Poster art={d.art} width={390} height={300} rounded={0}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: 54, paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,6,8,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.back} size={20} color="#fff" />
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,6,8,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.share} size={17} color="#fff" />
              </View>
            </View>
            <View style={{ position: "absolute", left: 16, right: 16, bottom: 16, gap: 6 }}>
              <T t="krBody" color="rgba(255,255,255,0.78)">
                {d.titleKr}
              </T>
              <T t="display" color="#FFFFFF">
                {d.title}
              </T>
              <Row gap={6}>
                <Badge label={d.status === "airing" ? "Airing" : d.status === "upcoming" ? "Upcoming" : "Completed"} tone={d.status === "airing" ? "accent" : "neutral"} />
                <Badge label={`★ ${d.rating || "NEW"}`} />
                <Badge label={`${d.totalEpisodes} EP`} />
              </Row>
            </View>
          </Poster>
        </View>

        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 16, gap: 16 }}>
          {/* meta */}
          <Col gap={8}>
            <Row gap={8}>
              {d.genres.map((g) => (
                <Chip key={g} label={g} />
              ))}
            </Row>
            <Row gap={8}>
              <Icon name={IC.calendar} size={14} color={p.textFaint} />
              <T t="caption" color={p.textDim}>
                {d.network} · {d.year}
                {d.schedule ? ` · ${d.schedule}` : ""}
              </T>
            </Row>
            <T t="caption" color={p.textDim}>
              {d.synopsis}
            </T>
          </Col>

          {/* actions */}
          <Row gap={10}>
            <Button label="Follow" icon={IC.personAdd} style={{ flex: 1 }} size="lg" />
            <Button label="Watching · Ep 6" variant="soft" icon={IC.tv} size="lg" style={{ flex: 1 }} onPress={() => nav?.("watchlist")} />
          </Row>

          {/* stats */}
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, padding: 14, gap: 10 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Col gap={2} style={{ flex: 1 }}>
                <T t="heading">{d.followers}</T>
                <T t="micro" color={p.textFaint}>
                  FOLLOWERS
                </T>
              </Col>
              <Col gap={2} style={{ flex: 1 }}>
                <T t="heading">4.8K</T>
                <T t="micro" color={p.textFaint}>
                  POSTS TONIGHT
                </T>
              </Col>
              <Col gap={2} style={{ flex: 1 }}>
                <T t="heading" color={p.accent}>
                  Ep 6
                </T>
                <T t="micro" color={p.textFaint}>
                  YOUR PROGRESS
                </T>
              </Col>
            </Row>
            <Progress value={6} max={d.totalEpisodes} />
          </View>

          <Segmented
            tabs={[
              { id: "ep", label: "Episodes" },
              { id: "disc", label: "Discussion" },
              { id: "about", label: "About" },
            ]}
            value="ep"
            onChange={() => {}}
          />

          {/* episodes */}
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14, marginTop: 4 }}>
            {EPISODES.map((e, i) => (
              <View key={e.number}>
                {i > 0 ? <Divider /> : null}
                <EpisodeRow episode={e} onPress={() => nav?.("episode", { n: String(e.number) })} />
              </View>
            ))}
          </View>

          {/* cast */}
          <View style={{ marginTop: 8 }}>
            <SectionHeader title="Cast" action="All" />
            <Rail>
              {cast.map((c) => (
                <View key={c.actor.id} style={{ alignItems: "center", gap: 4 }}>
                  <ActorCard actor={c.actor} onPress={() => nav?.("actor", { id: c.actor.id })} />
                  <T t="micro" color={p.textFaint}>
                    {c.role.toUpperCase()}
                  </T>
                </View>
              ))}
            </Rail>
          </View>

          {/* community teaser */}
          <View style={{ marginTop: 16, marginBottom: 8 }}>
            <SectionHeader title="Where the fans are" />
            <Press onPress={() => nav?.("community", { id: "c1" })}>
              <Row gap={12} style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, padding: 14 }}>
                <Poster art={{ from: "#131C33", to: "#4C6FB8", motif: "moon" }} width={44} height={44} rounded={14} />
                <Fill>
                  <T t="bodyEmph">Midnight Letters Theories</T>
                  <T t="caption" color={p.textDim}>
                    12.4K members · 312 posts in the last hour
                  </T>
                </Fill>
                <Icon name={IC.forward} size={16} color={p.textFaint} />
              </Row>
            </Press>
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}

/* --------------------------------- episode -------------------------------- */

export function EpisodePage({ nav, n = 8 }: { nav?: Nav; n?: number }) {
  const { p } = useTheme();
  const d = DRAMAS.midnight!;
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md }}>
        <TopBar title={`Episode ${n}`} subtitle={`${d.title} · Forty Years of Ink`} onBack={() => nav?.("drama", { id: d.id })} right={<IconButton name={IC.more} />} />
      </View>

      <Scroll pad={false}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 14 }}>
          {/* spoiler boundary */}
          <View style={{ backgroundColor: p.accentSoft, borderRadius: RADIUS.card, padding: 14, gap: 10 }}>
            <Row gap={10}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.accent, alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.lockSolid} size={16} color={p.onAccent} />
              </View>
              <Fill>
                <T t="bodyEmph" color={p.accent}>
                  Spoiler boundary · Episode {n}
                </T>
                <T t="caption" color={p.textDim}>
                  You've watched through Ep 6. Posts beyond your progress stay hidden until you reveal or update progress.
                </T>
              </Fill>
            </Row>
            <Row gap={8}>
              <Button label="Update progress" variant="soft" size="sm" icon={IC.check} style={{ flex: 1 }} />
              <Button label="Reveal all" variant="soft" size="sm" icon={IC.eye} style={{ flex: 1 }} />
            </Row>
          </View>

          {/* live strip */}
          <Row style={{ justifyContent: "space-between" }}>
            <Row gap={8}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.accent }} />
              <T t="captionEmph" color={p.accent}>
                Live discussion · 4,820 posts
              </T>
            </Row>
            <T t="caption" color={p.textDim}>
              aired Sat 12 Sep
            </T>
          </Row>

          {POSTS.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => nav?.("post", { id: post.id })} />
          ))}
        </View>
      </Scroll>

      {/* composer bar */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: p.surface, borderRadius: RADIUS.pill, height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 8, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
        <Avatar art={ME.art} name={ME.name} size={36} />
        <Fill>
          <T t="body" color={p.textFaint}>
            React to Episode {n}…
          </T>
        </Fill>
        <IconButton name={IC.image} />
        <IconButton name={IC.lock} />
        <View style={{ backgroundColor: p.accent, borderRadius: RADIUS.pill, height: 36, paddingHorizontal: 14, justifyContent: "center" }}>
          <T t="captionEmph" color={p.onAccent}>
            Post
          </T>
        </View>
      </View>
    </Screen>
  );
}

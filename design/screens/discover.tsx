import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Badge, Chip, Divider, Fill, IconButton, Press, Rail, Row, Screen, Scroll, SectionHeader, T, TabBar, TextField, type Nav } from "../ui";
import { ActorCard, CommunityRow, DramaRailCard, PostCard, UserRow } from "../cards";
import { ACTORS, COMMUNITIES, DRAMAS, HASHTAGS, POSTS, RECENT_SEARCHES, TRENDING_SEARCHES, USERS } from "../data";

const GENRES = ["All", "Romance", "Thriller", "Sageuk", "Comedy", "Melodrama", "Fantasy", "Healing", "Youth"];

export function Discover({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const trending = [
    { label: "#stamptheory", sub: "4.2K posts · Midnight Letters", delta: "+312%" },
    { label: "Echoes of Seoul · Ep 7", sub: "3.1K posts in 6h", delta: "+180%" },
    { label: "Our Summer Again OST", sub: "1.9K posts", delta: "+96%" },
    { label: "Baek Soo-yeon", sub: "actor · 1.2M followers", delta: "+44%" },
    { label: "Healing Drama Club", sub: "community · 612 new members", delta: "+31%" },
  ];
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8, gap: 4 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <T t="display">Discover</T>
            <IconButton name={IC.search} onPress={() => nav?.("search")} />
          </Row>

          <Press onPress={() => nav?.("search")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: p.surface, borderRadius: RADIUS.md, height: 46, paddingHorizontal: 14 }}>
              <Icon name={IC.search} size={18} color={p.textFaint} />
              <T t="body" color={p.textFaint}>
                Dramas, actors, fans, communities…
              </T>
            </View>
          </Press>

          <Scroll pad={false} style={{ flexGrow: 0, maxHeight: 40, marginTop: 14, marginBottom: 6 }}>
            <Row gap={8}>
              {GENRES.map((g, i) => (
                <Chip key={g} label={g} selected={i === 0} />
              ))}
            </Row>
          </Scroll>

          <View style={{ marginTop: 10 }}>
            <SectionHeader title="Trending now" action="Why these?" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, overflow: "hidden" }}>
              {trending.map((t, i) => (
                <View key={t.label}>
                  {i > 0 ? <Divider inset={16} /> : null}
                  <Press>
                    <Row gap={12} style={{ padding: 14 }}>
                      <T t="title" color={i === 0 ? p.accent : p.textFaint} style={{ width: 22 }}>
                        {i + 1}
                      </T>
                      <Fill>
                        <T t="bodyEmph" numberOfLines={1}>
                          {t.label}
                        </T>
                        <T t="caption" color={p.textDim}>
                          {t.sub}
                        </T>
                      </Fill>
                      <Row gap={4}>
                        <Icon name={IC.trending} size={13} color={p.success} />
                        <T t="micro" color={p.success}>
                          {t.delta}
                        </T>
                      </Row>
                    </Row>
                  </Press>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Airing this week" action="Calendar" />
            <Rail>
              {[DRAMAS.midnight!, DRAMAS.summer!, DRAMAS.echoes!, DRAMAS.lantern!].map((d) => (
                <DramaRailCard key={d.id} drama={d} onPress={() => nav?.("drama", { id: d.id })} />
              ))}
            </Rail>
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Coming soon" />
            <Rail>
              {[DRAMAS.quiettide!].map((d) => (
                <DramaRailCard key={d.id} drama={d} onPress={() => nav?.("drama", { id: d.id })} />
              ))}
              <View style={{ width: 180, backgroundColor: p.surface, borderRadius: RADIUS.lg, padding: 14, gap: 6 }}>
                <Badge label="Premiere" tone="warn" icon={IC.sparkles} />
                <T t="captionEmph">The Quiet Tide</T>
                <T t="caption" color={p.textDim}>
                  Drops in 3 weeks — follow to get the episode-one ping.
                </T>
              </View>
            </Rail>
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Faces of the week" action="All" />
            <Rail>
              {Object.values(ACTORS).map((a) => (
                <ActorCard key={a.id} actor={a} onPress={() => nav?.("actor", { id: a.id })} />
              ))}
            </Rail>
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Communities for you" action="Browse" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              {COMMUNITIES.slice(0, 3).map((c, i) => (
                <View key={c.id}>
                  {i > 0 ? <Divider /> : null}
                  <CommunityRow community={c} onPress={() => nav?.("community", { id: c.id })} />
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <SectionHeader title="Topics" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {HASHTAGS.map((h) => (
                <Chip key={h.tag} label={`#${h.tag}`} />
              ))}
            </View>
          </View>
        </View>
      </Scroll>
      <TabBar active="discover" onTab={(id) => nav?.(id)} unread={3} />
    </Screen>
  );
}

/* ---------------------------------- search -------------------------------- */

export function Search({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8, gap: 12 }}>
        <Row gap={10}>
          <Fill>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: p.surface, borderRadius: RADIUS.md, height: 46, paddingHorizontal: 14 }}>
              <Icon name={IC.search} size={18} color={p.textFaint} />
              <T t="bodyEmph">midnight</T>
              <Fill />
              <Icon name={IC.close} size={16} color={p.textFaint} />
            </View>
          </Fill>
          <Press onPress={() => nav?.("discover")}>
            <T t="captionEmph" color={p.accent} style={{ lineHeight: 46 }}>
              Cancel
            </T>
          </Press>
        </Row>
        <Row gap={8}>
          {["All", "Dramas", "People", "Communities", "Posts", "Tags"].map((c, i) => (
            <Chip key={c} label={c} selected={i === 0} />
          ))}
        </Row>
      </View>

      <Scroll pad={false} style={{ marginTop: 8 }}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 20 }}>
          <View>
            <SectionHeader title="Dramas" />
            <Row gap={12}>
              <DramaRailCard drama={DRAMAS.midnight!} onPress={() => nav?.("drama", { id: "midnight" })} />
              <View style={{ flex: 1, gap: 6 }}>
                <T t="caption" color={p.textDim}>
                  {DRAMAS.midnight!.synopsis}
                </T>
                <Row gap={6}>
                  <Badge label="Airing" tone="accent" />
                  <Badge label="★ 9.1" />
                </Row>
              </View>
            </Row>
          </View>

          <View>
            <SectionHeader title="People" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              <UserRow user={USERS.jiwoo!} note="posts about Midnight Letters" />
              <Divider />
              <UserRow user={USERS.official!} note="official production account" />
            </View>
          </View>

          <View>
            <SectionHeader title="Communities" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              <CommunityRow community={COMMUNITIES[0]!} onPress={() => nav?.("community", { id: "c1" })} />
            </View>
          </View>

          <View>
            <SectionHeader title="Posts" />
            <PostCard post={POSTS[0]!} compact onOpen={() => nav?.("post", { id: "p1" })} />
          </View>

          <View style={{ marginBottom: 8 }}>
            <SectionHeader title="Tags" />
            <Row gap={8}>
              <Chip label="#midnightletters" selected />
              <Chip label="#stamptheory" />
            </Row>
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}

export function SearchIdle({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
        <Row gap={10}>
          <Fill>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: p.surface, borderRadius: RADIUS.md, height: 46, paddingHorizontal: 14 }}>
              <Icon name={IC.search} size={18} color={p.textFaint} />
              <T t="body" color={p.textFaint}>
                Search Hallyu
              </T>
            </View>
          </Fill>
        </Row>
      </View>
      <Scroll pad={false} style={{ marginTop: 20 }}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 22 }}>
          <View>
            <SectionHeader title="Recent" action="Clear" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {RECENT_SEARCHES.map((r) => (
                <Chip key={r} label={r} icon={IC.time} />
              ))}
            </View>
          </View>
          <View>
            <SectionHeader title="Trending searches" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, overflow: "hidden" }}>
              {TRENDING_SEARCHES.map((t, i) => (
                <View key={t}>
                  {i > 0 ? <Divider inset={16} /> : null}
                  <Row gap={12} style={{ padding: 14 }}>
                    <T t="captionEmph" color={p.textFaint} style={{ width: 16 }}>
                      {i + 1}
                    </T>
                    <Fill>
                      <T t="bodyEmph">{t}</T>
                    </Fill>
                    <Icon name={IC.trending} size={14} color={p.textFaint} />
                  </Row>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}

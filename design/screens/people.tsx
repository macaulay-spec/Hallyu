import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Avatar, Badge, Button, Chip, Col, Divider, Fill, IconButton, Poster, Press, Rail, Row, Screen, Scroll, SectionHeader, Segmented, T, TabBar, TopBar, type Nav } from "../ui";
import { CommunityRow, DramaRailCard, PostCard, WatchingRow } from "../cards";
import { ACTORS, COMMUNITIES, DRAMAS, ME, POSTS, USERS, WATCHLIST } from "../data";

/* ---------------------------------- actor --------------------------------- */

export function ActorPage({ nav, id = "sooyeon" }: { nav?: Nav; id?: string }) {
  const { p } = useTheme();
  const a = ACTORS[id] ?? ACTORS.sooyeon!;
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <View style={{ position: "relative" }}>
          <Poster art={a.art} width={390} height={280} rounded={0}>
            <View style={{ position: "absolute", top: 54, left: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,6,8,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.back} size={20} color="#fff" />
              </View>
            </View>
          </Poster>
        </View>
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 16, gap: 16 }}>
          <Row gap={14} align="flex-start">
            <Fill>
              <T t="display">{a.name}</T>
              <T t="krBody" color={p.textDim} style={{ marginTop: 2 }}>
                {a.nameKr}
              </T>
              <Row gap={10} style={{ marginTop: 8 }}>
                <T t="captionEmph">{a.followers} followers</T>
                <T t="caption" color={p.textFaint}>
                  · known for {a.knownFor}
                </T>
              </Row>
            </Fill>
            <Button label="Follow" icon={IC.personAdd} />
          </Row>

          <View>
            <SectionHeader title="Credits" action="All" />
            <Rail>
              {[DRAMAS.midnight!, DRAMAS.stillwithyou!, DRAMAS.echoes!].map((d, i) => (
                <View key={d.id} style={{ gap: 4 }}>
                  <DramaRailCard drama={d} onPress={() => nav?.("drama", { id: d.id })} />
                  <T t="micro" color={p.textFaint}>
                    {["Seo Ji-an", "Young Ji-an", "Guest · Ep 4"][i]?.toUpperCase()}
                  </T>
                </View>
              ))}
            </Rail>
          </View>

          <View style={{ marginTop: 8 }}>
            <SectionHeader title="Fan communities" />
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              <CommunityRow community={COMMUNITIES[0]!} />
              <Divider />
              <CommunityRow community={COMMUNITIES[3]!} />
            </View>
          </View>

          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <SectionHeader title="Fans are posting" />
            <PostCard post={POSTS[0]!} compact onOpen={() => nav?.("post", { id: "p1" })} />
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}

/* -------------------------------- community ------------------------------- */

export function CommunityPage({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const c = COMMUNITIES[0]!;
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <View style={{ position: "relative" }}>
          <Poster art={c.art} width={390} height={180} rounded={0}>
            <View style={{ position: "absolute", top: 54, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,6,8,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.back} size={20} color="#fff" />
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,6,8,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.more} size={18} color="#fff" />
              </View>
            </View>
          </Poster>
        </View>
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 16, gap: 16 }}>
          <Row gap={14} align="flex-start">
            <View style={{ marginTop: -46 }}>
              <Poster art={c.art} width={76} height={76} rounded={22} />
            </View>
            <Fill>
              <T t="title">{c.name}</T>
              <T t="caption" color={p.textDim} style={{ marginTop: 2 }}>
                {c.members} members · {c.blurb}
              </T>
            </Fill>
            <Button label="Joined" variant="soft" icon={IC.check} />
          </Row>

          <Segmented
            tabs={[
              { id: "feed", label: "Feed" },
              { id: "members", label: "Members" },
              { id: "rules", label: "Rules" },
            ]}
            value="feed"
            onChange={() => {}}
          />

          {/* pinned */}
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, padding: 14, gap: 8, borderWidth: 1, borderColor: p.line }}>
            <Row gap={6}>
              <Icon name={IC.pinActive} size={14} color={p.accent} />
              <T t="micro" color={p.accent}>
                PINNED BY MODERATORS
              </T>
            </Row>
            <T t="bodyEmph">Weekly theory thread — Ep 9 live reactions</T>
            <T t="caption" color={p.textDim}>
              Tag everything past Ep 8. Un-tagged spoilers get hidden automatically and kindly.
            </T>
          </View>

          {POSTS.slice(0, 2).map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => nav?.("post", { id: post.id })} />
          ))}
        </View>
      </Scroll>
    </Screen>
  );
}

/* --------------------------------- profile -------------------------------- */

export function Profile({ nav, self = true }: { nav?: Nav; self?: boolean }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8, gap: 16 }}>
          <Row style={{ justifyContent: "flex-end", gap: 4 }}>
            <IconButton name={IC.edit} onPress={() => nav?.("settings")} />
            <IconButton name={IC.settings} onPress={() => nav?.("settings")} />
          </Row>

          <Row gap={16} align="flex-start">
            <Avatar art={ME.art} name={ME.name} size={84} />
            <Fill style={{ gap: 2 }}>
              <T t="title">{ME.name}</T>
              <T t="caption" color={p.textDim}>
                @{ME.handle}
              </T>
              <T t="caption" color={p.textDim} style={{ marginTop: 6 }}>
                {ME.bio}
              </T>
            </Fill>
          </Row>

          <Row gap={20}>
            <Row gap={5}>
              <T t="bodyEmph">86</T>
              <T t="caption" color={p.textDim}>
                posts
              </T>
            </Row>
            <Row gap={5}>
              <T t="bodyEmph">{ME.followers}</T>
              <T t="caption" color={p.textDim}>
                followers
              </T>
            </Row>
            <Row gap={5}>
              <T t="bodyEmph">{ME.following}</T>
              <T t="caption" color={p.textDim}>
                following
              </T>
            </Row>
            <Fill />
            <Button label="Edit profile" variant="soft" size="sm" />
          </Row>

          {/* watching rail */}
          <View>
            <SectionHeader title="Currently watching" action="All" onAction={() => nav?.("watchlist")} />
            <Rail>
              {WATCHLIST.slice(0, 3).map((w) => (
                <View key={w.drama.id} style={{ width: 120, gap: 6 }}>
                  <Poster art={w.drama.art} width={120} height={70} rounded={12} />
                  <T t="captionEmph" numberOfLines={1}>
                    {w.drama.title}
                  </T>
                  <T t="micro" color={p.textFaint}>
                    EP {w.progress}/{w.drama.totalEpisodes}
                  </T>
                </View>
              ))}
            </Rail>
          </View>

          <Segmented
            tabs={[
              { id: "posts", label: "Posts" },
              { id: "saved", label: "Saved" },
              { id: "communities", label: "Communities" },
            ]}
            value="posts"
            onChange={() => {}}
          />

          {POSTS.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={{ ...post, author: ME }} onOpen={() => nav?.("post", { id: post.id })} />
          ))}
        </View>
      </Scroll>
      <TabBar active="profile" onTab={(id) => nav?.(id)} unread={3} />
    </Screen>
  );
}

export function OtherProfile({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const u = USERS.jiwoo!;
  return (
    <Screen pad={false}>
      <Scroll pad={false}>
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8, gap: 16 }}>
          <TopBar title="" onBack={() => nav?.("home")} right={<IconButton name={IC.more} />} />
          <Row gap={16} align="flex-start">
            <Avatar art={u.art} name={u.name} size={84} />
            <Fill style={{ gap: 2 }}>
              <T t="title">{u.name}</T>
              <T t="caption" color={p.textDim}>
                @{u.handle}
              </T>
              <T t="caption" color={p.textDim} style={{ marginTop: 6 }}>
                {u.bio}
              </T>
            </Fill>
          </Row>
          <Row gap={10}>
            <Button label="Follow" icon={IC.personAdd} style={{ flex: 1 }} />
            <Button label="Message" variant="soft" style={{ flex: 1 }} disabled />
          </Row>
          <Row gap={20}>
            <Row gap={5}>
              <T t="bodyEmph">312</T>
              <T t="caption" color={p.textDim}>
                posts
              </T>
            </Row>
            <Row gap={5}>
              <T t="bodyEmph">{u.followers}</T>
              <T t="caption" color={p.textDim}>
                followers
              </T>
            </Row>
            <Row gap={5}>
              <T t="bodyEmph">Mutual: 4</T>
            </Row>
          </Row>
          {POSTS.slice(0, 2).map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => nav?.("post", { id: post.id })} />
          ))}
        </View>
      </Scroll>
    </Screen>
  );
}

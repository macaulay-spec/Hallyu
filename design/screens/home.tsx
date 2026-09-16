import React from "react";
import { View } from "react-native";
import { SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon } from "../icons";
import { Badge, Col, EmptyState, Fill, IconButton, Rail, Row, Screen, Scroll, SectionHeader, Segmented, T, TabBar, type Nav } from "../ui";
import { DramaRailCard, PostCard } from "../cards";
import { DRAMAS, FOLLOWING_POSTS, POSTS } from "../data";

function HomeHeader({ nav, unread }: { nav?: Nav; unread: number }) {
  const { p } = useTheme();
  return (
    <Row style={{ justifyContent: "space-between", marginBottom: 14 }}>
      <View>
        <T t="display" style={{ fontSize: 30, lineHeight: 34 }}>
          Hallyu
        </T>
        <T t="micro" color={p.textFaint}>
          한류 · WHERE THE WAVE LIVES
        </T>
      </View>
      <Row gap={4}>
        <IconButton name={IC.search} onPress={() => nav?.("search")} />
        <IconButton name={IC.bell} badge={unread} onPress={() => nav?.("notifications")} />
      </Row>
    </Row>
  );
}

export function Home({ nav, feed = "foryou" }: { nav?: Nav; feed?: "foryou" | "following" }) {
  const { p } = useTheme();
  const airing = [DRAMAS.midnight!, DRAMAS.summer!, DRAMAS.echoes!, DRAMAS.lantern!, DRAMAS.stillwithyou!];

  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md }}>
        <HomeHeader nav={nav} unread={3} />
        <Segmented
          tabs={[
            { id: "foryou", label: "For You" },
            { id: "following", label: "Following" },
          ]}
          value={feed}
          onChange={() => {}}
        />
      </View>

      <Scroll pad={false} style={{ paddingTop: 16 }}>
        <View style={{ paddingBottom: 8 }}>
        {feed === "foryou" ? (
          <>
            <View style={{ paddingHorizontal: SPACE.md, marginBottom: 18 }}>
              <SectionHeader title="Airing tonight" action="See all" onAction={() => nav?.("discover")} />
              <Rail>
                {airing.map((d) => (
                  <DramaRailCard key={d.id} drama={d} onPress={() => nav?.("drama", { id: d.id })} />
                ))}
              </Rail>
            </View>
            <View style={{ paddingHorizontal: SPACE.md }}>
              {POSTS.map((post) => (
                <PostCard key={post.id} post={post} onOpen={() => nav?.("post", { id: post.id })} onDrama={() => nav?.("drama", { id: post.drama?.id ?? "" })} />
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: SPACE.md }}>
            <Row gap={6} style={{ marginBottom: 14 }}>
              <Icon name={IC.people} size={14} color={p.textFaint} />
              <T t="caption" color={p.textDim}>
                Newest first from people, dramas and communities you follow.
              </T>
            </Row>
            {FOLLOWING_POSTS.map((post) => (
              <PostCard key={post.id} post={post} onOpen={() => nav?.("post", { id: post.id })} />
            ))}
          </View>
        )}
        </View>
      </Scroll>

      <TabBar active="home" onTab={(id) => nav?.(id)} unread={3} />
    </Screen>
  );
}

export function HomeEmpty({ nav }: { nav?: Nav }) {
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md }}>
        <HomeHeader nav={nav} unread={0} />
        <Segmented tabs={[{ id: "f", label: "For You" }, { id: "g", label: "Following" }]} value="g" onChange={() => {}} />
      </View>
      <Fill>
        <EmptyState
          icon={IC.people}
          title="Your fandom is quiet here."
          body="Follow a few dramas or communities to get things moving."
          action="Find your people"
          onAction={() => nav?.("discover")}
        />
      </Fill>
      <TabBar active="home" onTab={(id) => nav?.(id)} />
    </Screen>
  );
}

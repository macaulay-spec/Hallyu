import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "./tokens";
import { useTheme } from "./theme";
import { IC, Icon } from "./icons";
import { Avatar, Badge, Card, Fill, Press, Poster, Progress, Rail, Row, T, count } from "./ui";
import { Actor, Comment, Community, Drama, Episode, Notification, Post, User, REACTIONS, fmtCount } from "./data";

/* --------------------------------- post card ------------------------------ */

export function PostCard({ post, onOpen, onDrama, compact }: { post: Post; onOpen?: () => void; onDrama?: () => void; compact?: boolean }) {
  const { p } = useTheme();
  const mine = post.mine;
  const total = Object.values(post.reactions).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <Card style={{ marginBottom: SPACE.sm }}>
      <Press onPress={onOpen}>
        <View style={{ padding: SPACE.md, gap: 12 }}>
          {/* header */}
          <Row gap={10}>
            <Avatar art={post.author.art} name={post.author.name} size={40} official={post.author.official} />
            <Fill>
              <Row gap={6}>
                <T t="bodyEmph" numberOfLines={1}>
                  {post.author.name}
                </T>
                {post.official ? <Badge label="Official" tone="official" icon={IC.verified} /> : null}
              </Row>
              <T t="caption" color={p.textFaint} numberOfLines={1}>
                @{post.author.handle} · {post.ago}
              </T>
            </Fill>
            <Icon name={IC.more} size={18} color={p.textFaint} />
          </Row>

          {/* context */}
          {post.drama ? (
            <Press onPress={onDrama}>
              <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, backgroundColor: p.fill, borderRadius: RADIUS.pill, paddingHorizontal: 10, height: 26 }}>
                <Poster art={post.drama.art} width={14} height={14} rounded={4} />
                <T t="captionEmph" color={p.textDim} numberOfLines={1}>
                  {post.drama.title}
                  {post.episode ? ` · Ep ${post.episode}` : ""}
                </T>
                <Icon name={IC.forward} size={12} color={p.textFaint} />
              </View>
            </Press>
          ) : null}

          {/* body / spoiler */}
          {post.spoiler ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.accentSoft, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10 }}>
                <Icon name={IC.lockSolid} size={15} color={p.accent} />
                <Fill>
                  <T t="caption" color={p.accent}>
                    Spoiler ahead — {post.spoiler.level}. {post.spoiler.reason}.
                  </T>
                </Fill>
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ height: 12, borderRadius: 6, backgroundColor: p.shimmer, width: "96%" }} />
                <View style={{ height: 12, borderRadius: 6, backgroundColor: p.shimmer, width: "88%" }} />
                <View style={{ height: 12, borderRadius: 6, backgroundColor: p.shimmer, width: "61%" }} />
              </View>
              <Row gap={8}>
                <Press>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: p.accent, borderRadius: RADIUS.md, height: 32, paddingHorizontal: 12 }}>
                    <Icon name={IC.eye} size={14} color={p.onAccent} />
                    <T t="captionEmph" color={p.onAccent}>
                      Reveal
                    </T>
                  </View>
                </Press>
                <Press>
                  <View style={{ backgroundColor: p.fill, borderRadius: RADIUS.md, height: 32, paddingHorizontal: 12, justifyContent: "center" }}>
                    <T t="captionEmph" color={p.textDim}>
                      Not now
                    </T>
                  </View>
                </Press>
              </Row>
            </View>
          ) : (
            <T t="body" color={p.text}>
              {post.body}
            </T>
          )}

          {/* media */}
          {post.art && !post.spoiler ? (
            <View style={{ position: "relative" }}>
              <Poster art={post.art} width={326} height={compact ? 160 : 210} rounded={RADIUS.lg} />
              {post.artCaption ? (
                <View style={{ position: "absolute", left: 10, bottom: 10, right: 10 }}>
                  <T t="captionEmph" color="rgba(255,255,255,0.92)" numberOfLines={1}>
                    {post.artCaption}
                  </T>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* actions */}
          <Row style={{ justifyContent: "space-between" }}>
            <Row gap={18}>
              <Row gap={6}>
                <Icon name={mine ? IC.heartActive : IC.heart} size={19} color={mine ? p.accent : p.textDim} filled={!!mine} />
                <T t="captionEmph" color={mine ? p.accent : p.textDim}>
                  {count(total)}
                </T>
              </Row>
              <Row gap={6}>
                <Icon name={IC.comment} size={18} color={p.textDim} />
                <T t="captionEmph" color={p.textDim}>
                  {count(post.comments)}
                </T>
              </Row>
              <Row gap={6}>
                <Icon name={IC.repost} size={18} color={p.textDim} />
                <T t="captionEmph" color={p.textDim}>
                  {count(post.reposts)}
                </T>
              </Row>
            </Row>
            <Row gap={18}>
              <Icon name={post.saved ? IC.bookmarkActive : IC.bookmark} size={18} color={post.saved ? p.accent : p.textDim} />
              <Icon name={IC.share} size={18} color={p.textDim} />
            </Row>
          </Row>

          {/* explainability */}
          {post.reason ? (
            <Row gap={6}>
              <Icon name={IC.sparkles} size={12} color={p.textFaint} />
              <T t="micro" color={p.textFaint}>
                {post.reason.toUpperCase()}
              </T>
            </Row>
          ) : null}
        </View>
      </Press>
    </Card>
  );
}

export function ReactionPicker({ onPick }: { onPick?: (k: string) => void }) {
  const { p } = useTheme();
  return (
    <Card elevated style={{ flexDirection: "row", gap: 4, padding: 8, alignSelf: "flex-start" }}>
      {REACTIONS.map((r) => (
        <Press key={r.kind} onPress={() => onPick?.(r.kind)}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: p.fill }}>
            <Icon name={r.icon as never} size={18} color={p.text} />
          </View>
        </Press>
      ))}
    </Card>
  );
}

/* --------------------------------- comments ------------------------------- */

export function CommentRow({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const { p } = useTheme();
  return (
    <View style={{ marginLeft: depth * 28, gap: 10, marginTop: depth ? 12 : 0 }}>
      <Row gap={10} align="flex-start">
        <Avatar art={comment.author.art} name={comment.author.name} size={32} />
        <Fill>
          <Row gap={6}>
            <T t="captionEmph">{comment.author.name}</T>
            <T t="caption" color={p.textFaint}>
              {comment.ago}
            </T>
          </Row>
          {comment.spoiler ? (
            <View style={{ marginTop: 4, flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: p.accentSoft, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 6 }}>
              <Icon name={IC.lockSolid} size={12} color={p.accent} />
              <T t="caption" color={p.accent}>
                Spoiler · tap to reveal
              </T>
            </View>
          ) : (
            <T t="caption" color={p.text} style={{ marginTop: 2, fontSize: 14, lineHeight: 20 }}>
              {comment.body}
            </T>
          )}
          <Row gap={16} style={{ marginTop: 6 }}>
            <Row gap={5}>
              <Icon name={comment.mine ? IC.heartActive : IC.heart} size={14} color={comment.mine ? p.accent : p.textFaint} />
              <T t="micro" color={comment.mine ? p.accent : p.textFaint}>
                {comment.likes}
              </T>
            </Row>
            <T t="micro" color={p.textFaint}>
              REPLY
            </T>
            <T t="micro" color={p.textFaint}>
              REPORT
            </T>
          </Row>
        </Fill>
      </Row>
      {comment.replies?.map((r) => (
        <CommentRow key={r.id} comment={r} depth={Math.min(depth + 1, 2)} />
      ))}
    </View>
  );
}

/* ------------------------------- discover cards --------------------------- */

export function DramaRailCard({ drama, onPress }: { drama: Drama; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <View style={{ width: 132, gap: 6 }}>
        <View style={{ position: "relative" }}>
          <Poster art={drama.art} width={132} height={186} />
          {drama.status === "airing" && drama.nextEpisodeIn ? (
            <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: "rgba(6,6,8,0.72)", borderRadius: RADIUS.pill, paddingHorizontal: 8, height: 20, justifyContent: "center" }}>
              <T t="micro" color="#FFFFFF">
                EP {drama.episode} · {drama.nextEpisodeIn.toUpperCase()}
              </T>
            </View>
          ) : null}
        </View>
        <T t="captionEmph" numberOfLines={1}>
          {drama.title}
        </T>
        <T t="micro" color={p.textFaint}>
          {drama.titleKr} · ★ {drama.rating || "NEW"}
        </T>
      </View>
    </Press>
  );
}

export function ActorCard({ actor, onPress }: { actor: Actor; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <View style={{ width: 96, alignItems: "center", gap: 6 }}>
        <Poster art={actor.art} width={96} height={96} rounded={48} />
        <T t="captionEmph" numberOfLines={1} align="center">
          {actor.name}
        </T>
        <T t="micro" color={p.textFaint} align="center">
          {actor.followers} FOLLOWERS
        </T>
      </View>
    </Press>
  );
}

export function CommunityRow({ community, onPress }: { community: Community; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Poster art={community.art} width={44} height={44} rounded={14} />
        <Fill>
          <Row gap={6}>
            <T t="bodyEmph" numberOfLines={1}>
              {community.name}
            </T>
            {community.private ? <Icon name={IC.lock} size={13} color={p.textFaint} /> : null}
          </Row>
          <T t="caption" color={p.textDim} numberOfLines={1}>
            {community.members} members · {community.blurb}
          </T>
        </Fill>
        <View style={{ backgroundColor: community.joined ? p.fill : p.accent, borderRadius: RADIUS.md, height: 32, paddingHorizontal: 12, justifyContent: "center" }}>
          <T t="captionEmph" color={community.joined ? p.textDim : p.onAccent}>
            {community.joined ? "Joined" : community.private ? "Request" : "Join"}
          </T>
        </View>
      </Row>
    </Press>
  );
}

export function UserRow({ user, note, onPress }: { user: User; note?: string; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Avatar art={user.art} name={user.name} size={44} official={user.official} />
        <Fill>
          <T t="bodyEmph" numberOfLines={1}>
            {user.name}
          </T>
          <T t="caption" color={p.textDim} numberOfLines={1}>
            @{user.handle}
            {note ? ` · ${note}` : ""}
          </T>
        </Fill>
        <View style={{ backgroundColor: p.fill, borderRadius: RADIUS.md, height: 32, width: 32, alignItems: "center", justifyContent: "center" }}>
          <Icon name={IC.personAdd} size={16} color={p.text} />
        </View>
      </Row>
    </Press>
  );
}

export function EpisodeRow({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: episode.live ? p.accentSoft : p.fill, alignItems: "center", justifyContent: "center" }}>
          <T t="captionEmph" color={episode.live ? p.accent : p.textDim}>
            {episode.number}
          </T>
        </View>
        <Fill>
          <Row gap={6}>
            <T t="bodyEmph" numberOfLines={1}>
              {episode.title}
            </T>
            {episode.live ? <Badge label="Live now" tone="accent" /> : null}
          </Row>
          <T t="caption" color={p.textDim}>
            {episode.airDate}
            {episode.posts ? ` · ${fmtCount(episode.posts)} posts` : " · discussion opens at air time"}
          </T>
        </Fill>
        {episode.watched ? <Icon name={IC.checkCircle} size={18} color={p.success} /> : <Icon name={IC.forward} size={16} color={p.textFaint} />}
      </Row>
    </Press>
  );
}

export function NotificationRow({ n, onPress }: { n: Notification; onPress?: () => void }) {
  const { p } = useTheme();
  const icon: Record<string, string> = {
    episode: IC.tv,
    reply: IC.comment,
    mention: IC.sparkles,
    reaction: IC.heart,
    follow: IC.personAdd,
    community: IC.people,
    official: IC.verified,
    milestone: IC.trending,
  };
  return (
    <Press onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.kind === "episode" ? p.accentSoft : p.fill, alignItems: "center", justifyContent: "center" }}>
          {n.actor ? <Avatar art={n.actor.art} name={n.actor.name} size={40} official={n.actor.official} /> : <Icon name={(icon[n.kind] as never) ?? IC.bell} size={18} color={p.accent} />}
        </View>
        <Fill>
          <T t={n.unread ? "bodyEmph" : "body"} numberOfLines={1}>
            {n.title}
          </T>
          <T t="caption" color={p.textDim} numberOfLines={2}>
            {n.body}
          </T>
        </Fill>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <T t="micro" color={p.textFaint}>
            {n.ago.toUpperCase()}
          </T>
          {n.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.accent }} /> : null}
        </View>
      </Row>
    </Press>
  );
}

export function WatchingRow({ drama, progress, status, onPress }: { drama: Drama; progress: number; status: string; onPress?: () => void }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Poster art={drama.art} width={52} height={74} rounded={10} />
        <Fill style={{ gap: 6 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <T t="bodyEmph" numberOfLines={1}>
              {drama.title}
            </T>
            <T t="micro" color={p.textFaint}>
              {progress}/{drama.totalEpisodes}
            </T>
          </Row>
          <Progress value={progress} max={drama.totalEpisodes} />
          <T t="caption" color={p.textDim}>
            {status === "watching" ? `Watched through Ep ${progress}` : status === "completed" ? "Completed" : status === "planning" ? "Planning to watch" : "On hold"}
            {drama.status === "airing" && status === "watching" ? ` · Ep ${drama.episode} airs ${drama.nextEpisodeIn}` : ""}
          </T>
        </Fill>
      </Row>
    </Press>
  );
}

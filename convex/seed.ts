import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Demo seed dataset — FICTIONAL ONLY (DECISIONS.md D-05): fictional dramas,
// fictional actors, fictional official accounts. No real people's likenesses,
// no real broadcasters' branding. Clearly demo data, never production content.
//
// Idempotent: no-ops when dramas already exist. Exposed as an exported
// mutation (callable when signed in) + internal for cron/bootstrap use.

type DramaSeed = {
  slug: string;
  title: string;
  titleKr: string;
  genres: string[];
  status: "airing" | "upcoming" | "completed";
  network: string;
  schedule?: string;
  nextEpisodeAt?: number;
  year: number;
  episodes: number;
};

const DRAMAS: DramaSeed[] = [
  { slug: "midnight-letters", title: "Midnight Letters", titleKr: "자정의 편지", genres: ["Romance", "Fantasy"], status: "airing", network: "Wave One", schedule: "Sat & Sun 21:00", nextEpisodeAt: Date.now() + 86_400_000, year: 2026, episodes: 12 },
  { slug: "the-quiet-tide", title: "The Quiet Tide", titleKr: "고요한 파도", genres: ["Melodrama"], status: "airing", network: "Hanul TV", schedule: "Mon & Tue 21:30", nextEpisodeAt: Date.now() + 172_800_000, year: 2026, episodes: 10 },
  { slug: "hearts-in-seoul", title: "Hearts in Seoul", titleKr: "서울의 마음", genres: ["Romance", "Comedy"], status: "airing", network: "Wave One", schedule: "Wed & Thu 21:00", nextEpisodeAt: Date.now() + 259_200_000, year: 2026, episodes: 14 },
  { slug: "signal-bloom", title: "Signal Bloom", titleKr: "신호 블룸", genres: ["Thriller", "Mystery"], status: "airing", network: "Vera+", schedule: "Fri 22:00", nextEpisodeAt: Date.now() + 345_600_000, year: 2026, episodes: 8 },
  { slug: "paper-crowns", title: "Paper Crowns", titleKr: "종이 왕관", genres: ["Sageuk"], status: "completed", network: "Hanul TV", year: 2025, episodes: 16 },
  { slug: "cafe-andromeda", title: "Café Andromeda", titleKr: "안드로메다 카페", genres: ["Healing", "Fantasy Romance"], status: "airing", network: "Wave One", schedule: "Sat 22:30", nextEpisodeAt: Date.now() + 200_000_000, year: 2026, episodes: 10 },
  { slug: "the-prosecutors-garden", title: "The Prosecutor's Garden", titleKr: "검사의 정원", genres: ["Law", "Office"], status: "completed", network: "Vera+", year: 2025, episodes: 12 },
  { slug: "monsoon-youth", title: "Monsoon Youth", titleKr: "장마 청춘", genres: ["Youth"], status: "completed", network: "Hanul TV", year: 2024, episodes: 12 },
  { slug: "glass-harbor", title: "Glass Harbor", titleKr: "유리 항구", genres: ["Melodrama", "Family"], status: "airing", network: "Wave One", schedule: "Sat & Sun 22:00", nextEpisodeAt: Date.now() + 240_000_000, year: 2026, episodes: 12 },
  { slug: "nine-lives-of-inspector-baek", title: "Nine Lives of Inspector Baek", titleKr: "백순경의 아홉 삶", genres: ["Crime", "Comedy"], status: "completed", network: "Hanul TV", year: 2025, episodes: 10 },
  { slug: "second-lead-energy", title: "Second Lead Energy", titleKr: "서브남 에너지", genres: ["Romance", "Comedy", "Webtoon"], status: "upcoming", network: "Vera+", year: 2026, episodes: 12 },
  { slug: "winter-sansin", title: "Winter Sansin", titleKr: "겨울 산신", genres: ["Action", "Sageuk", "Fantasy"], status: "upcoming", network: "Wave One", year: 2027, episodes: 14 },
  { slug: "the-dubbing-club", title: "The Dubbing Club", titleKr: "더빙 클럽", genres: ["Youth", "Comedy"], status: "completed", network: "Vera+", year: 2025, episodes: 8 },
  { slug: "the-marigold-files", title: "The Marigold Files", titleKr: "메리골드 파일", genres: ["Mystery", "Medical"], status: "airing", network: "Hanul TV", schedule: "Tue 22:00", nextEpisodeAt: Date.now() + 130_000_000, year: 2026, episodes: 10 },
  { slug: "streetlight-confessions", title: "Streetlight Confessions", titleKr: "가로등의 고백", genres: ["Romance", "Youth"], status: "completed", network: "Wave One", year: 2024, episodes: 12 },
];

const ACTORS = [
  { slug: "han-ji-woo", name: "Han Ji-woo", nameKr: "한지우" },
  { slug: "seo-yeon-ho", name: "Seo Yeon-ho", nameKr: "서연호" },
  { slug: "choi-min-seung", name: "Choi Min-seung", nameKr: "최민승" },
  { slug: "park-da-eun", name: "Park Da-eun", nameKr: "박다은" },
  { slug: "kang-ha-yun", name: "Kang Ha-yun", nameKr: "강하윤" },
  { slug: "yoon-chae-won", name: "Yoon Chae-won", nameKr: "윤채원" },
  { slug: "im-na-ri", name: "Im Na-ri", nameKr: "임나리" },
  { slug: "oh-seung-min", name: "Oh Seung-min", nameKr: "오승민" },
  { slug: "jang-tae-hwa", name: "Jang Tae-hwa", nameKr: "장태화" },
  { slug: "bae-su-ah", name: "Bae Su-ah", nameKr: "배수아" },
];

// drama slug → [actor slug, character name]
const CAST: Record<string, Array<[string, string]>> = {
  "midnight-letters": [["han-ji-woo", "Yeo Reum"], ["seo-yeon-ho", "Postman Ko"], ["yoon-chae-won", "Hae Won"]],
  "the-quiet-tide": [["park-da-eun", "Mi Young"], ["jang-tae-hwa", "Captain Ryu"]],
  "hearts-in-seoul": [["im-na-ri", "Ha Neul"], ["oh-seung-min", "Jae Pil"], ["kang-ha-yun", "Studio Boss Kang"]],
  "signal-bloom": [["choi-min-seung", "Det. Seo"], ["bae-su-ah", "Dr. Im"]],
  "paper-crowns": [["jang-tae-hwa", "King Gyeong"], ["yoon-chae-won", "Crown Servant Ae Ra"]],
  "cafe-andromeda": [["bae-su-ah", "Owner Byul"], ["oh-seung-min", "Part-timer Woojin"]],
  "the-prosecutors-garden": [["choi-min-seung", "Prosecutor Cha"], ["im-na-ri", "Investigator Bori"]],
  "monsoon-youth": [["kang-ha-yun", "Tae Yang"], ["park-da-eun", "Yu Jin"]],
  "glass-harbor": [["han-ji-woo", "Sae Byuk"], ["jang-tae-hwa", "Father Gu"]],
  "nine-lives-of-inspector-baek": [["oh-seung-min", "Inspector Baek"], ["im-na-ri", "Rookie Nari"]],
  "second-lead-energy": [["seo-yeon-ho", "Second Lead Minjae"], ["yoon-chae-won", "Webtoonist Hari"]],
  "winter-sansin": [["choi-min-seung", "Sansin"], ["bae-su-ah", "Shaman Mok"]],
  "the-dubbing-club": [["park-da-eun", "Club President Da Eun"], ["oh-seung-min", "Sound Guy Hyun"]],
  "the-marigold-files": [["bae-su-ah", "Dr. Marigold"], ["kang-ha-yun", "Pathologist Yu"]],
  "streetlight-confessions": [["im-na-ri", "Bit Na"], ["seo-yeon-ho", "Streetlight Hyun"]],
};

const COMMUNITIES = [
  { slug: "romance-kdrama-fans", name: "Romance K-drama Fans", isPrivate: false, description: "All the butterflies, all the second-lead pain." },
  { slug: "thriller-theories", name: "Thriller Theories", isPrivate: false, description: "Evidence boards welcome. Spoiler discipline enforced." },
  { slug: "sageuk-society", name: "Sageuk Society", isPrivate: false, description: "Historical dramas, royal politics, gorgeous hanbok." },
  { slug: "kdrama-memes", name: "K-Drama Memes", isPrivate: false, description: "The funniest corner of the wave." },
  { slug: "webtoon-adaptations", name: "Webtoon Adaptations", isPrivate: false, description: "Panel-to-screen comparisons and source-readers." },
  { slug: "ost-and-soundtracks", name: "OST & Soundtracks", isPrivate: false, description: "The songs that wreck us." },
  { slug: "currently-airing-club", name: "Currently Airing Club", isPrivate: false, description: "Live reactions, week by week." },
  { slug: "bad-ending-support", name: "Bad Ending Support Group", isPrivate: false, description: "For those who needed more tissues." },
];

const INTEREST_TAGS = ["Romance", "Thriller", "Sageuk", "Comedy", "Melodrama", "Fantasy", "Healing", "Law", "Action", "Mystery", "Youth", "Webtoon"];

export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const sample = await ctx.db.query("dramas").first();
    return { seeded: sample !== null };
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("dramas").first();
    if (existing) return { seeded: false, reason: "already-seeded" } as const;
    return await runSeed(ctx);
  },
});

export const internalSeed = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx),
});

async function runSeed(
  ctx: { db: any; scheduler: any }
): Promise<{ seeded: boolean; dramas: number; posts: number }> {
  const now = Date.now();
  let postCount = 0;

  // Fictional official accounts (D-05): demo profiles that cannot log in —
  // bare users rows with no credentials, purely to anchor profiles.
  const officialDefs = [
    { handle: "waveoneofficial", name: "Wave One Official", kind: "broadcaster" as const, org: "Wave One" },
    { handle: "wave-weekly", name: "Wave Weekly", kind: "publication" as const, org: "Wave Weekly" },
    { handle: "veraplus", name: "Vera+", kind: "streamer" as const, org: "Vera+" },
  ];
  const officialProfileIds: Record<string, Id<"profiles">> = {};
  for (const def of officialDefs) {
    const userId = await ctx.db.insert("users", {});
    const profileId = await ctx.db.insert("profiles", {
      userId,
      handle: def.handle,
      displayName: def.name,
      isPrivate: false,
      isOfficial: true,
      verified: true,
      interests: [],
      spoilerPreference: "relaxed",
      onboardingComplete: true,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    });
    await ctx.db.insert("officialAccounts", {
      profileId,
      orgName: def.org,
      kind: def.kind,
      verifiedBy: profileId,
    });
    officialProfileIds[def.handle] = profileId;
  }

  // Actors
  const actorIds: Record<string, Id<"actors">> = {};
  for (const a of ACTORS) {
    actorIds[a.slug] = await ctx.db.insert("actors", { ...a, followerCount: 0 });
  }

  // Dramas + episodes + cast + discussions
  const dramaIds: Record<string, Id<"dramas">> = {};
  const episodeIds: Record<string, Id<"episodes">[]> = {};
  for (const d of DRAMAS) {
    const dramaId = await ctx.db.insert("dramas", {
      slug: d.slug,
      title: d.title,
      titleKr: d.titleKr,
      status: d.status,
      genres: d.genres,
      network: d.network,
      releaseSchedule: d.schedule,
      nextEpisodeAt: d.nextEpisodeAt,
      year: d.year,
      followerCount: 0,
      synopsis: `${d.title} (${d.titleKr}) — a fictional ${d.genres.join("/").toLowerCase()} series from the demo dataset.`,
    });
    dramaIds[d.slug] = dramaId;
    episodeIds[d.slug] = [];

    for (let n = 1; n <= d.episodes; n++) {
      const episodeId = await ctx.db.insert("episodes", {
        dramaId,
        number: n,
        title: `Episode ${n}`,
        airAt: d.status === "upcoming" ? undefined : now - (d.episodes - n) * 7 * 86_400_000,
        runtimeMinutes: 62 + (n % 3) * 2,
      });
      const discussionId = await ctx.db.insert("episodeDiscussions", {
        episodeId,
        postCount: 0,
        lastActivityAt: now,
      });
      await ctx.db.patch(episodeId, { discussionId });
      episodeIds[d.slug]!.push(episodeId);
    }

    for (const [actorSlug, character] of CAST[d.slug] ?? []) {
      const actorId = actorIds[actorSlug];
      if (!actorId) continue;
      await ctx.db.insert("dramaCast", {
        dramaId,
        actorId,
        characterName: character,
        order: 0,
      });
    }
  }

  // Communities (all owner = wave-weekly demo profile; honest zero-ish state)
  const communityIds: Record<string, Id<"communities">> = {};
  for (const c of COMMUNITIES) {
    const owner = officialProfileIds["wave-weekly"];
    const communityId = await ctx.db.insert("communities", {
      slug: c.slug,
      name: c.name,
      description: c.description,
      isPrivate: c.isPrivate,
      memberCount: 0,
      createdBy: owner,
      createdAt: now,
    });
    communityIds[c.slug] = communityId;
    await ctx.db.insert("communityMembers", {
      communityId,
      profileId: owner,
      role: "owner",
      state: "active",
      joinedAt: now,
    });
    await ctx.db.insert("communityRules", {
      communityId,
      position: 1,
      rule: "Use spoiler tags for anything past the latest aired episode.",
    });
  }

  // Demo posts: episode reactions + community content, spoiler-tagged where apt
  const airing = DRAMAS.filter((d) => d.status === "airing");
  const bodies = [
    { cat: "reaction" as const, text: "The way this scene was shot… I had to pause and just sit there. 🌊" },
    { cat: "theory" as const, text: "Hear me out: the letters aren't from who we think. Re-read episode 3.", spoiler: true },
    { cat: "discussion" as const, text: "Is anyone else rooting for the second lead? Just me? Okay." },
    { cat: "question" as const, text: "Where can I watch this with good subtitles? Asking for a friend." },
    { cat: "meme" as const, text: "Me: one more episode. Also me at 3am: one more episode.", spoiler: false },
    { cat: "recommendation" as const, text: "If you loved the quiet episodes of Paper Crowns, this one's for you." },
  ];
  for (const d of airing) {
    const eps = episodeIds[d.slug] ?? [];
    for (let i = 0; i < 2 && i < eps.length; i++) {
      const epIdx = eps.length - 1 - i; // latest episodes
      const body = bodies[(d.slug.length + i) % bodies.length]!;
      const dramaId = dramaIds[d.slug];
      const post = await ctx.db.insert("posts", {
        authorId: officialProfileIds["waveoneofficial"],
        category: body.cat,
        body: `[${d.title}] ${body.text}`,
        spoilerLevel: "spoiler" in body && body.spoiler ? "episode" : "none",
        dramaId,
        episodeNumber: epIdx + 1,
        moderationState: "visible",
        official: true,
        reactionCount: 0,
        commentCount: 0,
        repostCount: 0,
        bookmarkCount: 0,
        createdAt: now - (i + 1) * 3_600_000,
      });
      postCount++;
      await ctx.db.insert("postHashtags", {
        postId: post,
        hashtagId: await ensureHashtag(ctx, INTEREST_TAGS[i % INTEREST_TAGS.length]!),
      });
    }
  }

  // Seed community posts (non-official demo content authored by wave-weekly)
  for (const c of COMMUNITIES.slice(0, 4)) {
    await ctx.db.insert("posts", {
      authorId: officialProfileIds["wave-weekly"],
      category: "discussion",
      body: `Welcome to ${c.name}! Introduce yourself and your current watch.`,
      spoilerLevel: "none",
      communityId: communityIds[c.slug],
      moderationState: "visible",
      official: false,
      reactionCount: 0,
      commentCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      createdAt: now - 86_400_000,
    });
    postCount++;
  }

  return { seeded: true, dramas: DRAMAS.length, posts: postCount };
}

async function ensureHashtag(ctx: { db: any }, tag: string): Promise<Id<"hashtags">> {
  const existing = await ctx.db.query("hashtags").withIndex("by_tag", (q: any) => q.eq("tag", tag)).first();
  if (existing) return existing._id;
  return await ctx.db.insert("hashtags", { tag, useCount: 0 });
}

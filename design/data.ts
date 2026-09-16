/**
 * Fictional sample dataset for the design prototype ONLY.
 *
 * Every person, drama, community and post here is invented. No real titles,
 * actors, broadcasters or likenesses (repo policy D-05 and the blueprint audit
 * §3). Key art is procedural (`Poster`) — two-tone gradients with a motif — so
 * previews never depend on network imagery or licensed assets.
 */

export type Motif = "moon" | "city" | "wave" | "blossom" | "rain" | "ridge" | "lantern" | "tide";

export interface Art {
  from: string;
  to: string;
  motif: Motif;
}

export interface Drama {
  id: string;
  title: string;
  titleKr: string;
  year: number;
  network: string;
  status: "airing" | "upcoming" | "completed";
  genres: string[];
  schedule?: string;
  nextEpisodeIn?: string;
  episode?: number;
  totalEpisodes: number;
  rating: number;
  followers: string;
  art: Art;
  synopsis: string;
}

export interface Actor {
  id: string;
  name: string;
  nameKr: string;
  followers: string;
  knownFor: string;
  art: Art;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  art: Art;
  verified?: boolean;
  official?: boolean;
  followers?: string;
  following?: string;
}

export type ReactionKind = "heart" | "fire" | "tears" | "laugh" | "gasp" | "soft";

export interface Post {
  id: string;
  author: User;
  ago: string;
  category: "Reaction" | "Discussion" | "Theory" | "Recommendation" | "Meme" | "News" | "Question" | "Fan content";
  body: string;
  drama?: Drama;
  episode?: number;
  community?: string;
  spoiler?: { level: string; reason: string };
  art?: Art;
  artCaption?: string;
  reactions: Partial<Record<ReactionKind, number>>;
  mine?: ReactionKind;
  comments: number;
  reposts: number;
  saved?: boolean;
  reason?: string;
  official?: boolean;
  pinned?: boolean;
}

export interface Comment {
  id: string;
  author: User;
  ago: string;
  body: string;
  likes: number;
  mine?: boolean;
  replies?: Comment[];
  spoiler?: boolean;
}

export interface Community {
  id: string;
  name: string;
  members: string;
  blurb: string;
  art: Art;
  joined?: boolean;
  private?: boolean;
}

export interface Episode {
  number: number;
  title: string;
  airDate: string;
  posts: number;
  watched?: boolean;
  live?: boolean;
}

export interface Notification {
  id: string;
  kind: "episode" | "reply" | "mention" | "reaction" | "follow" | "community" | "official" | "milestone";
  title: string;
  body: string;
  ago: string;
  unread?: boolean;
  actor?: User;
  drama?: Drama;
}

/* ---------------------------------- people -------------------------------- */

export const ME: User = {
  id: "me",
  handle: "seoulights",
  name: "Mina Park",
  bio: "Weekend theorist. Sageuk apologist. Currently not okay about episode 10.",
  art: { from: "#31456E", to: "#7FA6D9", motif: "moon" },
  followers: "412",
  following: "188",
};

export const USERS: Record<string, User> = {
  jiwoo: { id: "jiwoo", handle: "jiwoo.watches", name: "Jiwoo Han", bio: "Reaction posts, zero spoilers before Monday.", art: { from: "#5A2233", to: "#C96A7B", motif: "blossom" }, followers: "2.4K", following: "310" },
  daran: { id: "daran", handle: "daraneditz", name: "Daran Kim", bio: "Fan edits · 4K · no watermarks, ask first.", art: { from: "#1E3A34", to: "#5FA88F", motif: "tide" }, followers: "18.1K", following: "92" },
  haneul: { id: "haneul", handle: "haneul_reads", name: "Haneul Seo", bio: "I read the webtoon so you don't have to. I will not be discussing it.", art: { from: "#3B2E52", to: "#8C7BB0", motif: "rain" }, followers: "6.9K", following: "401" },
  marco: { id: "marco", handle: "marco.rewatches", name: "Marco V.", bio: "Fifth rewatch. Still finding new details.", art: { from: "#4A3418", to: "#C99A4E", motif: "lantern" }, followers: "980", following: "245" },
  aria: { id: "aria", handle: "aria OST", name: "Aria", bio: "OST playlists for every mood.", art: { from: "#22404A", to: "#6FB3C0", motif: "wave" }, followers: "3.2K", following: "150" },
  official: { id: "official", handle: "midnightletters.official", name: "Midnight Letters", official: true, verified: true, bio: "Official production account.", art: { from: "#16233F", to: "#4C6FB8", motif: "city" }, followers: "412K", following: "0" },
};

/* ---------------------------------- dramas -------------------------------- */

export const DRAMAS: Record<string, Drama> = {
  midnight: {
    id: "midnight",
    title: "Midnight Letters",
    titleKr: "자정의 편지",
    year: 2026,
    network: "MBN",
    status: "airing",
    genres: ["Melodrama", "Mystery"],
    schedule: "Fri & Sat · 21:20 KST",
    nextEpisodeIn: "2h 40m",
    episode: 9,
    totalEpisodes: 16,
    rating: 9.1,
    followers: "128K",
    art: { from: "#131C33", to: "#4C6FB8", motif: "moon" },
    synopsis: "A night-shift postman begins receiving letters dated forty years in the future — each one addressed to someone who has not died yet.",
  },
  summer: {
    id: "summer",
    title: "Our Summer Again",
    titleKr: "다시, 우리의 여름",
    year: 2026,
    network: "tvN",
    status: "airing",
    genres: ["Romance", "Healing"],
    schedule: "Sat & Sun · 21:10 KST",
    nextEpisodeIn: "1d 3h",
    episode: 10,
    totalEpisodes: 12,
    rating: 8.7,
    followers: "96K",
    art: { from: "#123B3A", to: "#5FA88F", motif: "tide" },
    synopsis: "Ten years after a promise made on a ferry platform, two ex-best friends keep almost-meeting in the same seaside town.",
  },
  echoes: {
    id: "echoes",
    title: "Echoes of Seoul",
    titleKr: "서울의 메아리",
    year: 2026,
    network: "JTBC",
    status: "airing",
    genres: ["Thriller", "Action"],
    schedule: "Mon & Tue · 22:00 KST",
    nextEpisodeIn: "3d",
    episode: 7,
    totalEpisodes: 12,
    rating: 8.9,
    followers: "74K",
    art: { from: "#1A1A20", to: "#6E6C78", motif: "city" },
    synopsis: "A sound forensic analyst hears a kidnapping in a nine-year-old recording — and recognises her own voice in it.",
  },
  stillwithyou: {
    id: "stillwithyou",
    title: "Still, With You",
    titleKr: "그래도, 너와",
    year: 2025,
    network: "KBS2",
    status: "completed",
    genres: ["Romance", "Fantasy"],
    totalEpisodes: 16,
    rating: 9.4,
    followers: "203K",
    art: { from: "#4A2233", to: "#C96A7B", motif: "blossom" },
    synopsis: "A grief counsellor who can see the last memory of the dead meets a man whose last memory is her.",
  },
  quiettide: {
    id: "quiettide",
    title: "The Quiet Tide",
    titleKr: "조용한 조수",
    year: 2026,
    network: "Netflix",
    status: "upcoming",
    genres: ["Sageuk", "Political"],
    totalEpisodes: 10,
    rating: 0,
    followers: "41K",
    art: { from: "#1E2A22", to: "#7C9A6B", motif: "ridge" },
    synopsis: "In a court that drowns dissent in ceremony, a junior scribe keeps the only honest record of a king who never speaks.",
  },
  lantern: {
    id: "lantern",
    title: "Lantern District",
    titleKr: "등롱골목",
    year: 2026,
    network: "ENA",
    status: "airing",
    genres: ["Comedy", "Youth"],
    schedule: "Wed · 21:00 KST",
    nextEpisodeIn: "5d",
    episode: 12,
    totalEpisodes: 14,
    rating: 8.2,
    followers: "38K",
    art: { from: "#4A3418", to: "#C99A4E", motif: "lantern" },
    synopsis: "Five friends inherit a failing alley of lantern shops and one very opinionated neighbourhood cat.",
  },
};

/* ---------------------------------- actors -------------------------------- */

export const ACTORS: Record<string, Actor> = {
  sooyeon: { id: "sooyeon", name: "Baek Soo-yeon", nameKr: "백수연", followers: "1.2M", knownFor: "Midnight Letters", art: { from: "#31456E", to: "#7FA6D9", motif: "moon" } },
  junho: { id: "junho", name: "Cha Jun-ho", nameKr: "차준호", followers: "860K", knownFor: "Echoes of Seoul", art: { from: "#1A1A20", to: "#6E6C78", motif: "city" } },
  minseo: { id: "minseo", name: "Yoon Min-seo", nameKr: "윤민서", followers: "640K", knownFor: "Our Summer Again", art: { from: "#123B3A", to: "#5FA88F", motif: "tide" } },
  haerin: { id: "haerin", name: "Do Hae-rin", nameKr: "도해린", followers: "2.1M", knownFor: "Still, With You", art: { from: "#4A2233", to: "#C96A7B", motif: "blossom" } },
};

export const CAST: Record<string, { actor: Actor; role: string }[]> = {
  midnight: [
    { actor: ACTORS.sooyeon!, role: "Seo Ji-an" },
    { actor: ACTORS.junho!, role: "Postman Han Do-yun" },
    { actor: ACTORS.minseo!, role: "Editor Choi Yu-na" },
  ],
};

/* -------------------------------- communities ----------------------------- */

export const COMMUNITIES: Community[] = [
  { id: "c1", name: "Midnight Letters Theories", members: "12.4K", blurb: "Weekly theory threads, strictly spoiler-tagged by episode.", art: { from: "#131C33", to: "#4C6FB8", motif: "moon" }, joined: true },
  { id: "c2", name: "Sageuk Society", members: "48.2K", blurb: "Historical drama, hanbok details and court politics nerds.", art: { from: "#1E2A22", to: "#7C9A6B", motif: "ridge" } },
  { id: "c3", name: "Healing Drama Club", members: "21.7K", blurb: "Low stakes, warm blankets, zero cliffhangers.", art: { from: "#123B3A", to: "#5FA88F", motif: "tide" }, joined: true },
  { id: "c4", name: "OST Obsessives", members: "9.8K", blurb: "Tracklists, live versions, and that one chord change in ep 6.", art: { from: "#22404A", to: "#6FB3C0", motif: "wave" } },
  { id: "c5", name: "Thriller Thursdays", members: "15.3K", blurb: "If you guessed the twist in act one, this is your home.", art: { from: "#1A1A20", to: "#6E6C78", motif: "city" }, private: true },
];

/* ---------------------------------- posts --------------------------------- */

export const POSTS: Post[] = [
  {
    id: "p1",
    author: USERS.jiwoo!,
    ago: "2h",
    category: "Reaction",
    body: "Episode 8 broke me in the best way possible. The acting, the silence, the everything. I'm not okay but I'm so here for it.",
    drama: DRAMAS.midnight,
    episode: 8,
    art: { from: "#131C33", to: "#4C6FB8", motif: "moon" },
    artCaption: "the rooftop scene, but make it a painting",
    reactions: { heart: 342, tears: 128, fire: 96 },
    mine: "heart",
    comments: 56,
    reposts: 12,
    reason: "Because you follow Midnight Letters",
  },
  {
    id: "p2",
    author: USERS.haneul!,
    ago: "4h",
    category: "Theory",
    body: "The letters aren't from the future. They're from the parallel timeline where Ji-an answered the door in episode 2. The stamp colour is the tell — every 'future' letter uses the 1986 print run.",
    drama: DRAMAS.midnight,
    episode: 8,
    spoiler: { level: "Episode 8", reason: "goes past your watch progress (Ep 6)" },
    reactions: { gasp: 511, fire: 203, heart: 88 },
    comments: 141,
    reposts: 74,
    reason: "Trending in Midnight Letters Theories",
  },
  {
    id: "p3",
    author: USERS.daran!,
    ago: "6h",
    category: "Fan content",
    body: "60 seconds of every glance between them in eps 1–10, cut to the OST piano theme. No dialogue. You're welcome.",
    drama: DRAMAS.summer,
    episode: 10,
    art: { from: "#123B3A", to: "#5FA88F", motif: "tide" },
    artCaption: "4K edit · 0:60 · sound on",
    reactions: { heart: 1204, tears: 402, soft: 233 },
    comments: 98,
    reposts: 316,
    saved: true,
    reason: "Because you follow @daraneditz",
  },
  {
    id: "p4",
    author: USERS.official!,
    ago: "9h",
    category: "News",
    official: true,
    body: "Episode 9 airs tonight at 21:20 KST. A letter arrives that was never posted. #MidnightLetters",
    drama: DRAMAS.midnight,
    episode: 9,
    art: { from: "#16233F", to: "#4C6FB8", motif: "city" },
    artCaption: "Tonight · 21:20 KST",
    reactions: { fire: 890, heart: 640 },
    comments: 210,
    reposts: 154,
    reason: "Official account you follow",
  },
  {
    id: "p5",
    author: USERS.marco!,
    ago: "12h",
    category: "Discussion",
    body: "Fifth rewatch of Still, With You. The counsellor's office plant is dead in every scene until episode 14. It regrows the same episode she finally grieves. Nobody talks about the plant. I will not stop talking about the plant.",
    drama: DRAMAS.stillwithyou,
    reactions: { laugh: 764, heart: 350 },
    comments: 87,
    reposts: 41,
    reason: "Popular in Healing Drama Club",
  },
];

export const FOLLOWING_POSTS: Post[] = [POSTS[3]!, POSTS[0]!, POSTS[2]!, POSTS[4]!];

/* --------------------------------- comments ------------------------------- */

export const COMMENTS: Comment[] = [
  {
    id: "cm1",
    author: USERS.marco!,
    ago: "1h",
    body: "The stamp detail!! I paused at 41:12 and it's the 1986 print, you're absolutely right. This rewrites the whole finale theory.",
    likes: 214,
    mine: true,
    replies: [
      {
        id: "cm1a",
        author: USERS.haneul!,
        ago: "52m",
        body: "Right? And notice the postmark town — it's the one from Ji-an's childhood, not Seoul.",
        likes: 96,
        replies: [{ id: "cm1a1", author: USERS.aria!, ago: "30m", body: "Okay I need a rewatch thread, tonight, who's in.", likes: 41 }],
      },
    ],
  },
  {
    id: "cm2",
    author: USERS.aria!,
    ago: "44m",
    body: "Posting the piano theme that plays under this reveal, for anyone who wants to feel worse: 'Letter, Unsent' — track 7.",
    likes: 132,
  },
  {
    id: "cm3",
    author: USERS.jiwoo!,
    ago: "20m",
    body: "Gentle heads-up: this thread is drifting into ep 9 preview territory, tagging my next comment accordingly.",
    likes: 58,
    spoiler: true,
  },
];

/* -------------------------------- episodes -------------------------------- */

export const EPISODES: Episode[] = [
  { number: 9, title: "The Unposted Letter", airDate: "Tonight · 21:20 KST", posts: 0, live: true },
  { number: 8, title: "Forty Years of Ink", airDate: "Sat 12 Sep", posts: 4820, watched: true },
  { number: 7, title: "Return to Sender", airDate: "Fri 11 Sep", posts: 3110, watched: true },
  { number: 6, title: "The Night Shift", airDate: "Sat 5 Sep", posts: 2890, watched: true },
  { number: 5, title: "Postmark, 1986", airDate: "Fri 4 Sep", posts: 2210 },
  { number: 4, title: "Address Unknown", airDate: "Sat 29 Aug", posts: 1980 },
];

/* ------------------------------ notifications ----------------------------- */

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "episode", title: "Midnight Letters · Ep 9 is live", body: "The Unposted Letter just aired. Discussion is open.", ago: "12m", unread: true, drama: DRAMAS.midnight },
  { id: "n2", kind: "reply", title: "Haneul Seo replied to you", body: "“Right? And notice the postmark town…”", ago: "52m", unread: true, actor: USERS.haneul },
  { id: "n3", kind: "mention", title: "Daran Kim mentioned you", body: "“@seoulights called the stamp colour in June, crediting her now.”", ago: "2h", unread: true, actor: USERS.daran },
  { id: "n4", kind: "reaction", title: "342 people reacted to your comment", body: "Mostly ❤️ and 😭, honestly fair.", ago: "3h", actor: USERS.jiwoo },
  { id: "n5", kind: "community", title: "Midnight Letters Theories", body: "Weekly theory thread is pinned. Spoilers tagged to Ep 8.", ago: "5h", actor: USERS.haneul },
  { id: "n6", kind: "official", title: "Midnight Letters (official)", body: "Episode 9 airs tonight at 21:20 KST.", ago: "9h", actor: USERS.official },
  { id: "n7", kind: "follow", title: "Aria started following you", body: "OST playlists for every mood.", ago: "1d", actor: USERS.aria },
  { id: "n8", kind: "milestone", title: "Your theory reached 500 reactions", body: "“The letters aren't from the future…” — wait, that was Haneul. Yours reached 500 too.", ago: "2d" },
];

/* -------------------------------- watchlist ------------------------------- */

export interface WatchingItem {
  drama: Drama;
  status: "watching" | "planning" | "completed" | "on_hold";
  progress: number;
}

export const WATCHLIST: WatchingItem[] = [
  { drama: DRAMAS.midnight!, status: "watching", progress: 6 },
  { drama: DRAMAS.summer!, status: "watching", progress: 10 },
  { drama: DRAMAS.stillwithyou!, status: "completed", progress: 16 },
  { drama: DRAMAS.quiettide!, status: "planning", progress: 0 },
  { drama: DRAMAS.lantern!, status: "on_hold", progress: 4 },
];

/* --------------------------------- search --------------------------------- */

export const RECENT_SEARCHES = ["Midnight Letters", "Baek Soo-yeon", "sageuk with female lead", "#stamptheory"];
export const TRENDING_SEARCHES = ["#stamptheory", "Echoes of Seoul ep 7", "Our Summer Again OST", "Healing Drama Club", "Baek Soo-yeon"];

export const HASHTAGS = [
  { tag: "stamptheory", posts: "4.2K" },
  { tag: "midnightletters", posts: "38.1K" },
  { tag: "oursummeragain", posts: "22.7K" },
  { tag: "sageuk", posts: "61.4K" },
  { tag: "ostcovers", posts: "8.9K" },
];

/* ------------------------------ reactions meta ---------------------------- */

/** Icon-first reactions (emoji kept for parity with platform keyboards). */
export const REACTIONS: { kind: ReactionKind; emoji: string; icon: string; label: string }[] = [
  { kind: "heart", emoji: "❤️", icon: "heart", label: "Love" },
  { kind: "fire", emoji: "🔥", icon: "flame", label: "Fire" },
  { kind: "tears", emoji: "😭", icon: "rainy", label: "Crying" },
  { kind: "laugh", emoji: "😂", icon: "happy", label: "Laughing" },
  { kind: "gasp", emoji: "😱", icon: "flash", label: "Shocked" },
  { kind: "soft", emoji: "🤍", icon: "heart-outline", label: "Soft" },
];

export function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

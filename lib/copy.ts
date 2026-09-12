import { BRAND } from "@/lib/brand";

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  AUTH_INVALID: { title: "Couldn't sign you in", body: "Check your email and password, then try again." },
  SPOILER_BLOCKED: { title: "Spoiler ahead", body: "Reveal guarded content only if you're ready." },
  RATE_LIMITED: { title: "Slow down a moment", body: "Too many requests. Try again shortly." },
  COMMUNITY_PRIVATE: { title: "This community is private", body: "Request to join and a moderator will review it." },
  NOT_MEMBER: { title: "Members only", body: "Join the community to see this content." },
  NOT_FOUND: { title: "Not found", body: "This content may have been removed." },
  NETWORK: { title: "Couldn't load this right now.", body: "Check your connection and try again." },
  UNKNOWN: { title: "Couldn't load this right now.", body: "Something went wrong. Try again." },
};

export function errorCopy(code: string): { title: string; body: string } {
  return ERROR_COPY[code] ?? ERROR_COPY.UNKNOWN!;
}

export const EMPTY_COPY = {
  feed: "Your fandom is quiet here. Follow a few dramas or communities to get things moving.",
  search: "No matching dramas, actors, users, or communities found.",
  notifications: "You're caught up.",
  saved: "Nothing saved yet.",
  watching: "Not watching anything yet — find your next obsession in Explore.",
  credits: "No credits yet.",
  hashtag: "Nothing under this tag yet.",
  discussion: "No posts yet — be the first reaction.",
  comments: "No comments yet — start the conversation.",
} as const;

export const statesMeta = {
  app: `${BRAND.name} ${BRAND.koreanName}`,
};

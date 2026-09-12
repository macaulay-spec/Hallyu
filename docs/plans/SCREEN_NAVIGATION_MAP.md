# Hallyu — Screen & Navigation Map

> **Status:** Phase 2 deliverable — Revision 2 retargeted to Expo Router (React Native + Expo, D-07). For review before implementation.
> **Basis:** Spec §4 (navigation), §37 (required screens), §38 (states), §34 (onboarding), §18 (notifications deep-link), §7–§19 (screen content requirements), §51 (research-derived UX details).
> **Companion:** `../blueprints/` images implement this map visually; `IMPLEMENTATION_PLAN.md` §7 maps screens to feature hooks/Convex functions/tables.

---

## 1. Navigation tree (Expo Router — file-based, `app/` directory)

```
app/                                   # Expo Router root — mirrors the tree below 1:1
├── _layout.tsx                        # ConvexProvider, auth/session gate, theme — routes like SessionGate
├── index.tsx                          # Splash: session valid? → /(tabs) : /(auth)/welcome
├── (auth)/                            # AuthStack
│   ├── welcome.tsx
│   ├── sign-up.tsx
│   ├── login.tsx
│   └── account-recovery.tsx           # + recovery-sent state
├── (onboarding)/                      # OnboardingStack
│   ├── interests.tsx
│   ├── dramas.tsx
│   ├── actors.tsx
│   ├── communities.tsx
│   └── done.tsx
└── (tabs)/                            # MainTabs — 5 tabs (Spec §4); _layout renders the tab bar
     ├── home/                          # Tab 1: ForYou | Following
     ├── explore/                       # Tab 2: Explore → SearchOverlay → results
     ├── create.tsx                     # Tab 3: modal presentation, not a destination stack
     ├── notifications/                 # Tab 4
     └── profile/                       # Tab 5: profile → subpages
app/drama/[slug].tsx                   # Drama hub (pushed from anywhere, deep-link target)
app/episode/[id].tsx                   # Episode + first-class discussion
app/post/[id].tsx                      # Post detail + 3-level comments
app/community/[slug].tsx
app/user/[handle].tsx
app/hashtag/[tag].tsx
app/+not-found.tsx
```
Expo Router groups (`(auth)`, `(onboarding)`, `(tabs)`) give the same stack/tab structure the tree describes, with typed routes. Deep links (`hallyu://` scheme + universal links) are native to Expo Router: `drama/{slug}` · `episode/{id}` · `post/{id}` · `community/{slug}` · `user/{handle}` · `hashtag/{tag}` · `notifications` · `watching` — resolved by the router from both a running app and cold start (Spec §18/§54); notification payloads carry the route path directly.

## 2. Screen catalog (state machine per screen: Loading → Content | Empty | Error(+Retry))

For every screen: **[L]** loading (shimmer/wave animation), **[E]** empty (curated copy per Spec §38), **[X]** error with retry, **[A]** accessibility annotations (labels, dynamic type), **[N]** analytics events (Spec §33).

### Authentication screens
| # | Screen | Contents | Key states/edge behaviors |
|---|---|---|---|
| 1 | Splash | Brand mark, wave shimmer; session restore attempt | auto-routes in ≤1.5s; [X] offline → Welcome with banner |
| 2 | Welcome | Brand, tagline "Where the Wave Lives", value props, Sign up / Log in buttons, policy links | [E] none; [A] full labels |
| 3 | SignUp | email, password (+strength meter), handle suggestion, display name, legal consent | inline validation; duplicate email/handle → field errors; [X] network → inline |
| 4 | Login | email + password, forgot link, (config-gated OAuth buttons — hidden when unconfigured) | invalid creds → `AUTH_INVALID_CREDENTIALS` humane message; [X] offline banner |
| 5 | AccountRecovery | email → send reset | always confirms (no account enumeration); sent-state screen |
| 6 | RecoverySent | explanation + resend cooldown | [N] `recovery_requested` |

### Onboarding (Spec §34)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 7 | Interests | "What do you love?" genre/theme chips (Romance, Thriller, Sageuk, Comedy, Melodrama, Fantasy, Healing, Law/Office, Action, Mystery, Youth, Fantasy Romance, Thriller Romance, Webtoon adaptations…) multi-select; progress dots | min 3 to continue (guidance state); skip → drama step |
| 8 | OnboardingDramas | search + currently-airing + "for your interests" cards; follow buttons | [E] no results copy; searchable; can skip |
| 9 | OnboardingActors | "Faces you love" actor cards with drama affinity | searchable; can skip |
| 10 | OnboardingCommunities | recommended communities (derived from interests+follows) + official accounts to follow | join/follow inline; can skip |
| 11 | OnboardingDone | "Your feed is ready" + confetti-wave; CTA to Home | [N] `onboarding_completed` |

### Main — Home (Tab 1)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 12 | Home | Sticky segmented control **For You / Following**; top modules: **Airing Now** rail (currently airing followed+global dramas with next-episode countdown), **Drama Updates** rail (followed dramas' latest activity/official posts), **Episode Activity** rail (live episode discussions), **Communities for you** rail; then feed; pull-to-refresh; infinite scroll; post cards with avatar/handle/time/context tag (drama·ep)/spoiler overlay/reaction bar | [L] shimmer; [E] "Your fandom is quiet here. Follow a few dramas or communities to get things moving." + Explore CTA; [X] retry; For You [E] pre-onboarding → seeded suggestion cards; Following [E] if no follows → suggestion rail; [N] feed events |

### Main — Explore (Tab 2)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 13 | Explore | Search bar (persistent, tappable → SearchOverlay); sections: Trending (posts+topics), Currently Airing, Upcoming, Popular Dramas, Actors, Communities, Official Accounts, Topics/Hashtags, Fan Edits & Memes (curated rails), Episode Activity | [L] section shimmers; [X] per-section retry; rails horizontal cards; [N] `drama_viewed` etc. |
| 14 | SearchOverlay | Search field w/ debounce; entity-typed results grouped (Dramas / Actors / Users / Communities / Hashtags / Posts); recent searches (local); trending searches | [L] typing-state skeletons; [E] "No matching dramas, actors, users, or communities found." + suggestion chips; [N] `search_performed` |
| 15 | SearchResults | full grouped list, filter chips by type | [E] copy above; recent queries; clear-all |

### Content screens
| # | Screen | Contents | Key states |
|---|---|---|---|
| 16 | DramaHub | Header: poster + gradient backdrop, titles (EN+KR), genres/status badges, release schedule, Follow button (primary CTA), Watching status selector; Cast carousel (→ Actor); **Episode list** (each row: number, air date, discussion live indicator, watched checkmark, "new" badge if unaired→aired since last visit); Community area tabs: Discussions / Trending / Theories / Memes / Edits / Official; spoiler-safe presentation | [L] skeleton; [X] retry; follow → optimistic; status sheet (Watching/Planning/Completed/Dropped/On Hold); [N] `drama_viewed`, `drama_followed` |
| 17 | EpisodePage | Episode header (number, title, air time), **Discussion** (live fan posts), Reactions rail, Theories, Memes, spoiler boundary banner ("Beyond here: Ep 8 — you've watched through Ep 6"), watched-toggle | [L] skeleton; [E] "No posts yet — be the first reaction."; spoiler-guard cards; [N] `episode_opened`, `episode_discussion_opened` |
| 18 | ActorPage | Photo header, name EN+KR, bio, credits carousel (Dramas with roles), Follow button, fan communities rail | [L]/[X]/[E] "No credits yet" |
| 19 | CommunityPage | Banner + avatar, name, members count, Join/Leave, About/rules sheet, tabs: Feed / Members / Rules(mobile-optimized); moderator actions (pin/lock/hide/remove/ban) contextual on posts | [E] private → Join request state (or "This community is private"); [L]; [X]; [N] `community_joined` |
| 20 | HashtagPage | tag header, post stream (sp | [L]; [E] "Nothing under #tag yet" |
| 21 | PostDetail | Full post, context tag, media viewer, action bar, engagement counts, author card (→ profile), nested comments (3 levels, Spec §11), reply composer, reactions on comments | [L]; [X] deleted → "This post was removed"; spoiler reveal second-fetch; [N] post/comment events |
| 22 | Comments (within PostDetail) | grouped threads, mention links, spoiler-guarded comments, report/block context menus | [E] "No comments yet — start the conversation" |

### Create (Tab 3 — modal)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 23 | CreateHub (sheet) | Post / Image (Video, Poll disabled with "coming soon" chips — honest, non-functional labels marked as future, not fake buttons) | entry points per Spec §19 |
| 24 | Composer | body (5,000 char counter), category selector (Reaction/Discussion/Theory/Recommendation/Meme/News/Question/Fan content), drama tag picker (search), episode context picker (enabled when drama tagged), hashtag input with AI suggestion chips (editable), @mention autocomplete, spoiler toggle + level selector, media attach (Photo Picker ≤4 images, alt-text field), **Preview** step, Publish | [E] empty body disabled publish; media upload progress w/ retry; AI suggestions opt-in, editable; [X] upload failure → per-image retry; [N] `post_created` |

### Main — Notifications (Tab 4)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 25 | Notifications | Grouped list: Critical (episode release, replies, mentions) / Important (community announcements, actor updates, official announcements) / Optional (trending, recommendations, milestones); unread indicators; each row: icon, human text, source avatar, timestamp; tap → deep link | [L] shimmer; [E] "You're caught up."; [X]; mark-all-read; settings shortcut |

### Main — Profile (Tab 5)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 26 | Profile | Header: avatar, display name, handle, bio, follower/following counts, Currently Watching rail, stats; tabs: Posts / Saved / Communities / About; own vs other-user variants (Edit profile / Follow button) | [L]; [E] per-tab curated copies; [N] `user_followed` |
| 27 | CurrentlyWatching | full list with per-drama progress bars, statuses, "jump to discussion" shortcuts | [E] "Not watching anything yet — find your next obsession in Explore" |
| 28 | SavedPosts | bookmarks grid/list | [E] "Nothing saved yet" |
| 29 | Followers / Following | user lists with follow buttons | [E] copies; pagination |
| 30 | EditProfile | avatar picker, display name, handle (validated), bio, private-account toggle | [X] handle taken |
| 31 | Settings | Account (email, password, logout, delete, data export), Privacy (private account, blocked users, muted users/dramas/communities), Notifications (per-category, per-drama, quiet hours, push toggle), Spoilers (preference: strict/balanced/relaxed; mute drama list), Appearance (theme follows system: dark default), About (version, licenses, acknowledgements, research provenance) | every toggle persists to `/v1/me/*`; [N] preference events |

### Moderation (permission-gated — Spec §37)
| # | Screen | Contents | Key states |
|---|---|---|---|
| 32 | ModerationQueue | open reports grouped by severity/type; report detail: content preview, reporter context, AI classification, history; actions: dismiss / warn / hide content / remove content / ban user / escalate; appeal handling | hidden for non-moderators (403 → not rendered); [E] "Queue is clear"; every action → audit log + notification to affected user |
| 33 | AdminConsole (platform admin) | stats dashboard (DAU/WAU/MAU, retention cohorts, participation metrics per Spec §33), verification requests review, official account management, platform configuration, audit log viewer | role-gated; not shipped as a primary surface — permission-gated internal mobile/tablet screens |

### Shared states & system components (all screens)
| Component | Behavior |
|---|---|
| PostCard | avatar, handle, time (relative), context tag row (drama · episode chip, tappable), body (clamped, expandable), image carousel (1–4, tap→viewer), spoiler overlay card (drama/episode info + "Show anyway" — second fetch), ReactionBar (❤🔥😭😂😱🤍 + counts, optimistic, rollback on error), comment count, repost, bookmark (toggle fills), share (system sheet with deep link), overflow menu (report, block author, mute author, copy link), official-account badge rendering, community chip |
| SpoilerOverlay | per Spec §9/§38: "Spoiler ahead — Ep 8 · you've watched through Ep 6" + Show anyway / Not now |
| ErrorState | wave icon + "Couldn't load this right now." + Retry — Spec §38 copy verbatim |
| EmptyState | per-screen curated copy (§38) + optional CTA |
| WaveProgress | brand loading motif (three waves, subtle) |
| Shimmer | skeleton placeholders shaped like content (no fake data, just structure) |
| OfflineBanner | appears on network loss; queues optimistic actions honestly (disables writes with explanation) |
| Banner messages | community rules reminder on join; moderation outcome notices |

## 3. Navigation edge list (major)

Welcome→SignUp→(Onboarding|Login) ; Login→Onboarding|MainTabs ; Onboarding chain → MainTabs ; Home→DramaHub (context tag / airing rail / post context) ; Home→EpisodePage (episode activity) ; Home→PostDetail (post tap) ; Home→UserProfile ; Explore→SearchOverlay→SearchResults→(DramaHub|ActorPage|CommunityPage|HashtagPage|UserProfile) ; Explore rails → same targets ; DramaHub→EpisodePage (episode row) ; DramaHub→ActorPage (cast) ; DramaHub→CommunityPage (fan community) ; DramaHub→PostDetail ; EpisodePage→PostDetail ; ActorPage→DramaHub (credits) ; ActorPage→CommunityPage ; CommunityPage→PostDetail ; CommunityPage→Rules sheet ; PostDetail→Comments (inline) ; PostDetail→UserProfile (mention/author) ; CreateSheet→Composer→(Home with new post toast) ; Notifications→(deep link target for each type) ; Profile→CurrentlyWatching→DramaHub/EpisodePage ; Profile→SavedPosts→PostDetail ; Profile→Followers/Following→UserProfile ; Profile→Settings (all settings subscreens) ; Profile→EditProfile ; moderation entries via overflow menu→ReportSheet ; Moderator role → ModerationQueue accessible from Settings or notification deep link.

## 4. Platform chrome

Android: Material back-gesture support, edge-to-edge with insets, predictive back where available, splash screen API brand mark. iOS: safe areas, swipe-back per stack, pull-to-refresh haptics, context menus long-press (report/copy link/share). Both: haptic feedback on reaction/follow, dark-first design (light theme also implemented from tokens — theme is centralized), dynamic type scaling honoring OS settings (Spec §32), reduced-motion honoring OS setting (shimmer→static, parallax off). Navigation implementation notes (Expo Router): tab bar shown only inside `(tabs)`; detail screens push onto the root stack so the tab bar hides on push; Create uses `presentation: "modal"` in the tab layout; `+not-found.tsx` catches bad deep links.

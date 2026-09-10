# HALLYU --- K-Drama Community Platform

## Rebuilt Product Strategy, Architecture & Master Build Specification

### Version 2.0 --- Build-Ready Edition

------------------------------------------------------------------------

## 0. Purpose of This Document

This document is a rebuilt and tightened version of the supplied K-drama
social-platform strategy.

The original document has a strong product thesis: the community is the
product, while drama metadata provides context. It also identifies a
fragmented ecosystem across X, TikTok, Reddit, Discord, MyDramaList,
AsianWiki, WhatsApp/Telegram, and streaming/community platforms.

This version keeps that thesis but resolves scope contradictions,
separates launch requirements from later features, strengthens the
episode/spoiler model, simplifies infrastructure, and makes the
specification harder for an AI coding agent to misinterpret.

The product is a **mobile application**, not a website.

The future public website is out of scope for the initial build.

------------------------------------------------------------------------

# 1. PRODUCT NORTH STAR

## Product

A mobile-first social network built specifically for K-drama culture.

It combines:

-   real-time fandom discussion
-   personalized discovery
-   drama and episode context
-   fan-created content
-   communities
-   official entertainment updates
-   social identity
-   spoiler-aware conversations

It is NOT:

-   a streaming service
-   a movie-rating website
-   merely a drama database
-   a generic social-media clone

## Core principle

**The community is the product.**

Drama metadata exists to give the community context.

A drama page should feel alive because people are discussing it,
reacting to it, creating theories, posting memes, sharing edits, and
following developments.

## North-star question

> Why would a K-drama fan open this app every day?

Because the app should answer:

> **What is happening in K-drama right now, and who is talking about
> it?**

------------------------------------------------------------------------

# 2. THE CORE DAILY LOOP

The primary product loop is:

**Discover → Follow → Watch → Discuss → React → Connect → Return**

Example:

1.  User discovers a currently airing drama.
2.  User follows the drama.
3.  User receives an episode-release notification.
4.  User opens the episode hub.
5.  User enters the spoiler-aware discussion.
6.  User posts a reaction or theory.
7.  Other fans react and reply.
8.  User discovers related posts and creators.
9.  User follows a community or another fan.
10. User returns when the next episode drops.

Every major feature should strengthen this loop.

Features that do not strengthen discovery, fandom, conversation,
creation, identity, or retention should not be allowed to dominate the
MVP.

------------------------------------------------------------------------

# 3. PRODUCT DIFFERENTIATION

The platform should combine the strongest relevant mechanics identified
in the supplied research:

  -----------------------------------------------------------------------
  Platform Pattern        Keep                    Improve
  ----------------------- ----------------------- -----------------------
  X                       real-time conversation, spoiler safety,
                          hashtags, breaking news structured context,
                                                  healthier discussions

  TikTok                  fast visual discovery,  connect content
                          short-form video        directly to dramas and
                                                  episodes

  Reddit                  threaded discussion,    modern mobile UX and
                          communities, moderation faster real-time
                                                  interaction

  Discord                 belonging and community persistent discovery
                                                  and unified feed

  MyDramaList             structured drama        modern social
                          metadata and tracking   experience and dynamic
                                                  recommendations

  WhatsApp/Telegram       direct updates and      two-way interaction and
  Channels                notifications           richer context

  AsianWiki               cast/drama reference    turn reference pages
                          information             into living community
                                                  hubs
  -----------------------------------------------------------------------

The white-space opportunity is therefore:

**Real-time K-drama culture + structured drama context + social
community + spoiler-aware conversation.**

------------------------------------------------------------------------

# 4. INFORMATION ARCHITECTURE

## Primary navigation

Use five destinations:

1.  **Home**
2.  **Explore**
3.  **Create**
4.  **Notifications**
5.  **Profile**

Do not create a separate primary tab for every content type.

## Home

Home contains:

-   For You
-   Following
-   current activity/trending modules
-   episode activity
-   recommended communities
-   drama updates

Primary default:

**For You**

Secondary:

**Following**

Trending should primarily live inside Explore rather than becoming
another competing home feed.

------------------------------------------------------------------------

# 5. HOME EXPERIENCE

The home feed should feel like a living fandom timeline.

## Top area

Show:

-   current drama/episode activity
-   followed-drama updates
-   important community activity
-   optional story/update rings where useful

## Feed types

### For You

Personalized ranking based on:

-   followed dramas
-   followed users
-   followed actors
-   followed communities
-   watching history
-   episode progress
-   likes
-   comments
-   saves
-   shares
-   recent views
-   interests
-   freshness
-   trending momentum

### Following

Chronological or near-chronological content from:

-   followed users
-   followed dramas
-   followed actors
-   joined communities
-   followed official accounts

Do not hide the user's social graph behind an opaque ranking system.

------------------------------------------------------------------------

# 6. EXPLORE

Explore is the discovery engine.

Sections:

-   Search
-   Trending
-   Currently Airing
-   Upcoming
-   Popular Dramas
-   Actors
-   Communities
-   Official Accounts
-   Topics/Hashtags
-   Fan Edits and Memes
-   Episode Activity

## Trending

Trending should not simply mean "most likes."

Use a combination of:

-   velocity
-   unique participants
-   comments
-   reactions
-   reposts
-   freshness
-   drama/episode activity
-   community spread

Prevent one viral post from permanently dominating the platform.

------------------------------------------------------------------------

# 7. DRAMA HUBS

Drama hubs are a major differentiator.

A drama hub must NOT look like a static database page.

Structure:

### Header

-   poster/backdrop
-   title
-   Korean title where available
-   genres
-   status
-   release schedule
-   cast
-   follow button
-   watching status

### Community area

-   latest discussions
-   trending posts
-   episode discussions
-   theories
-   memes
-   fan edits
-   recommendations
-   official updates

### Episodes

Every episode is a first-class object.

For each episode:

-   air date/time
-   episode number
-   discussion
-   reactions
-   fan posts
-   theories
-   spoiler boundary
-   episode progress

### Cast

Tap an actor to open their actor page.

------------------------------------------------------------------------

# 8. EPISODE-FIRST SOCIAL MODEL

The original strategy strongly emphasizes episode discussions. This
rebuilt architecture makes them first-class rather than treating them as
ordinary posts with an episode tag.

Relationships:

**Drama → Episodes → Discussion → Posts → Users → Reactions**

An episode discussion can contain:

-   live reactions
-   theories
-   questions
-   memes
-   favorite moments
-   character debates
-   post-episode analysis

This is the platform's strongest recurring engagement mechanism.

------------------------------------------------------------------------

# 9. SPOILER SYSTEM

Spoiler handling must be more than a manual blur button.

## User watch progress

Allow users to maintain:

**Watched through Episode X**

This can be changed manually from:

-   Currently Watching
-   Drama Hub
-   Episode page

## Spoiler levels

A post can be associated with:

-   drama
-   episode
-   spoiler status

Example:

> Drama: Queen of Tears\
> Episode context: 8\
> Spoiler level: Episode 8

A user who has only watched through Episode 6 should not be casually
exposed to Episode 8 discussion.

## Manual controls

Users can:

-   reveal spoiler
-   hide spoiler
-   mute a drama
-   adjust spoiler preferences

## AI assistance

AI may detect likely spoilers from text/images and suggest or
automatically apply a spoiler label according to configured moderation
rules.

AI must not be treated as infallible.

------------------------------------------------------------------------

# 10. POSTS

MVP post types:

-   text
-   image
-   link/reference
-   repost

Post capabilities:

-   up to 5,000 characters
-   multiple images
-   drama tagging
-   episode tagging
-   hashtags
-   mentions
-   spoiler warning
-   reactions
-   comments
-   reposts
-   bookmarks
-   share

Post categories:

-   Reaction
-   Discussion
-   Theory
-   Recommendation
-   Meme
-   News
-   Question
-   Fan content

Categories should assist discovery and moderation, not make posting
cumbersome.

------------------------------------------------------------------------

# 11. COMMENTS

Support:

-   nested replies
-   mentions
-   reactions
-   spoiler protection
-   report
-   block/mute actions

Recommended depth for MVP:

**3 levels**

Avoid infinitely nested comment trees that turn mobile UI into
archaeological excavation.

------------------------------------------------------------------------

# 12. SOCIAL GRAPH

Core relationships:

-   User follows User
-   User follows Drama
-   User follows Actor
-   User joins Community
-   User watches Drama
-   User watches Episode
-   User likes Post
-   User reacts to Post
-   User comments on Post
-   User bookmarks Post
-   User reposts Post
-   User blocks User
-   User mutes User

This graph is critical for both feed ranking and recommendations.

------------------------------------------------------------------------

# 13. CURRENTLY WATCHING

Keep this lightweight.

Users should be able to:

-   add a drama
-   mark episode progress
-   mark completed
-   jump to discussion
-   receive drama updates
-   remove a drama

Do not force users to write reviews or ratings.

Tracking should feel like a personal fandom utility, not homework.

------------------------------------------------------------------------

# 14. COMMUNITIES

Communities are user-created spaces.

Examples:

-   Romance K-drama Fans
-   Thriller Fans
-   Historical Drama Fans
-   Specific drama fandoms
-   Actor fandoms
-   Theory communities
-   Meme communities

Each community has:

-   name
-   description
-   avatar/banner
-   rules
-   public/private status
-   members
-   posts
-   moderators

Moderators can:

-   pin
-   lock
-   hide
-   remove
-   ban
-   approve members
-   edit rules

Community moderation must not automatically grant platform-wide admin
privileges.

------------------------------------------------------------------------

# 15. OFFICIAL CONTENT LAYER

Official accounts may include:

-   broadcasters
-   production companies
-   legitimate entertainment publications
-   authorized streaming platforms
-   verified creators

Official posts can cover:

-   casting
-   trailers
-   teasers
-   episode reminders
-   announcements
-   interviews
-   featured fan content
-   polls later

Official content should be visually identifiable but must not overwhelm
the community feed.

Users must be able to mute official accounts.

Verification and moderation are separate permission systems.

------------------------------------------------------------------------

# 16. SEARCH

Search should support:

-   dramas
-   episodes
-   actors
-   users
-   communities
-   hashtags
-   posts

Start with PostgreSQL full-text/search indexes and structured filtering.

Search ranking can later incorporate:

-   popularity
-   freshness
-   personalization
-   semantic relevance

Do not introduce a complicated search infrastructure before actual usage
requires it.

------------------------------------------------------------------------

# 17. RECOMMENDATIONS

## MVP recommendation system

Do NOT begin with an unnecessarily complex machine-learning platform.

Use explainable signals:

-   selected interests
-   followed dramas
-   followed actors
-   followed users
-   joined communities
-   watched episodes
-   liked posts
-   commented posts
-   saved posts
-   recent activity
-   trending content
-   freshness

## Later

Add:

-   embeddings
-   semantic similarity
-   collaborative filtering
-   personalized ranking models

The architecture should leave room for this without requiring it on day
one.

------------------------------------------------------------------------

# 18. NOTIFICATIONS

Notification categories:

### Critical

-   episode release for followed drama
-   direct reply
-   mention

### Important

-   community announcement
-   followed actor update
-   official drama announcement

### Optional

-   trending post
-   recommended drama
-   engagement milestone

Controls:

-   per-category settings
-   per-drama settings
-   push/in-app
-   quiet hours
-   mute drama
-   mute community

All notifications should deep-link directly to the relevant content.

------------------------------------------------------------------------

# 19. CREATE EXPERIENCE

Create should be extremely fast.

Entry points:

-   Post
-   Image
-   later: Video
-   later: Poll

Post flow:

1.  Tap Create.
2.  Select Post.
3.  Write.
4.  Tag drama/episode.
5.  Add media.
6.  Add hashtags/mentions.
7.  Select spoiler status.
8.  Preview.
9.  Publish.

AI may assist with:

-   hashtag suggestions
-   spoiler detection
-   toxicity detection
-   accessibility descriptions

AI suggestions must be editable.

------------------------------------------------------------------------

# 20. MVP BOUNDARY

## Build in MVP

### Identity

-   email/social authentication
-   profile
-   avatar
-   bio
-   follows/followers
-   privacy settings

### Community

-   posts
-   images
-   comments
-   replies
-   reactions
-   reposts
-   bookmarks
-   hashtags
-   mentions
-   communities

### K-drama layer

-   dramas
-   episodes
-   actors
-   drama hubs
-   episode discussions
-   currently watching
-   drama follows
-   actor follows

### Discovery

-   Explore
-   search
-   trending
-   For You
-   Following

### Trust

-   report
-   block
-   mute
-   moderation
-   verified accounts
-   basic AI moderation
-   spoiler system

### Retention

-   notifications
-   followed-drama updates
-   episode reminders

------------------------------------------------------------------------

# 21. EXPLICITLY OUT OF MVP

Do NOT allow the coding agent to quietly add these because it thinks
they would be "nice":

-   direct messaging
-   group messaging
-   live streaming
-   creator monetization
-   subscription monetization
-   community events
-   advanced video editor
-   large OST licensing system
-   third-party public API
-   web application
-   marketplace
-   integrated drama streaming
-   AR filters
-   podcast integration

These belong to later phases.

------------------------------------------------------------------------

# 22. VIDEO STRATEGY

Short-form video is strategically important but operationally expensive.

Therefore:

### MVP

Support the data model so video can be added cleanly later, but do not
make video infrastructure a launch blocker.

### v1.1

Introduce:

-   vertical video
-   15--60 seconds
-   thumbnails
-   compression
-   processing pipeline
-   moderation
-   playback analytics
-   fan edits
-   trailers/BTS where rights permit

A future media pipeline can become:

**Upload → validate → moderate → process → transcode → store → CDN →
playback**

Do not build a fake HLS system that only works in a demo.

------------------------------------------------------------------------

# 0A. INTEGRATION NOTE: WHAT WAS IMPORTED FROM THE RESEARCH DOCUMENT

The supplied 52-page research document remains the evidence and design
reference behind this specification. Its strongest contributions are
intentionally preserved here:

-   competitor/community findings across X, TikTok, Reddit, Discord,
    MyDramaList, AsianWiki, WhatsApp/Telegram, Viki and K-drama
    communities;
-   the research-backed insight that fans currently move between
    multiple platforms for real-time discussion, discovery, metadata,
    community and updates;
-   the three recurring fan motivations: emotional connection, creative
    expression and community belonging;
-   concrete mobile UX guidance such as five-tab navigation,
    thumb-friendly actions, pull-to-refresh, visible gesture
    alternatives, deep linking, deliberate loading/empty/error states;
-   the Hallyu brand direction, including the wave concept, purple/blue
    palette and typography direction;
-   the original SQL as a reference starting point;
-   the original 60-source research register.

The rebuilt architecture remains the controlling specification because
it resolves contradictions in the original document. The research is
evidence, not a license to reintroduce every feature into v1.

# 23. DATA & API SOURCES

Use external services for structured metadata where appropriate.

The supplied strategy identifies TMDB as the primary structured source
for:

-   titles
-   synopsis
-   posters
-   cast
-   genres
-   episodes
-   release information

The community should remain internally owned.

Do NOT build the product around scraping:

-   MyDramaList
-   AsianWiki
-   protected third-party sources

Use legitimate APIs, licensed feeds, official links, manual editorial
curation, and user-generated content.

------------------------------------------------------------------------

# 24. COPYRIGHT & CONTENT POLICY

The application must not become an unauthorized streaming or
redistribution platform.

Do NOT implement:

-   full-episode uploads
-   unauthorized drama streaming
-   copyrighted OST redistribution
-   ripping/downloading protected media
-   unauthorized copying of third-party databases

Permitted product direction:

-   metadata
-   official links
-   authorized embeds
-   user-generated discussion
-   user-generated content subject to policy
-   licensed media
-   copyright reporting/takedown workflows

Build reporting infrastructure for copyright complaints before
large-scale media expansion.

------------------------------------------------------------------------

# 25. DATABASE ARCHITECTURE

Recommended core entities:

``` text
users
profiles
user_preferences
follows
blocks
mutes

dramas
episodes
actors
drama_cast
drama_genres

watching_status
watched_episodes

posts
post_media
post_drama_tags
post_episode_tags
hashtags
post_hashtags
mentions

comments
comment_reactions
post_reactions
reposts
bookmarks

communities
community_members
community_roles
community_rules

episode_discussions

official_accounts
verification_requests

notifications
notification_preferences

reports
moderation_actions
moderation_logs

audit_logs
```

Use foreign keys and indexes deliberately.

Important indexes include:

-   user_id
-   drama_id
-   episode_id
-   community_id
-   post_id
-   created_at
-   follower relationships
-   notification recipient
-   report status

------------------------------------------------------------------------

# 25A. DATABASE IMPLEMENTATION RULES

The research document included a simplified schema. The final build must
improve it rather than copy it blindly.

Rules:

-   Use Supabase Auth for authentication identity and credentials.
-   Keep application profile data in `profiles` rather than duplicating
    passwords or auth secrets.
-   Prefer explicit relational join tables where referential integrity
    matters.
-   Represent drama/episode/post relationships explicitly.
-   Represent watch progress explicitly because it drives spoiler
    safety.
-   Represent episode discussions explicitly because they are a
    first-class product object.
-   Store media metadata separately from posts.
-   Use timestamps consistently with timezone-aware types.
-   Add unique constraints for relationships such as follows, bookmarks,
    reactions and watched episodes.
-   Add indexes based on actual access patterns.
-   Use soft deletion or moderation-state fields where product policy
    requires preserving audit history.
-   Design RLS before exposing tables to the mobile client.

The SQL in the appendix is a reference starting point. The coding agent
must generate reproducible migrations and validate them against the
final application flows.

# 26. PERMISSIONS

Use clear roles.

### User

Normal social participation.

### Community Moderator

Moderates assigned communities.

### Official Account

Publishes verified official content.

### Platform Moderator

Handles platform-level moderation.

### Admin

Manages platform configuration, roles, policies, and infrastructure.

Never infer platform privileges from verification alone.

------------------------------------------------------------------------

# 27. MODERATION PIPELINE

Recommended flow:

**User report → classification → severity → automated safety action if
appropriate → moderator queue → decision → notification → appeal where
applicable → audit log**

AI can assist with:

-   spam
-   harassment
-   toxicity
-   likely spoilers
-   duplicate content
-   unsafe content
-   categorization

AI should recommend or apply narrowly defined automated actions
according to explicit policy thresholds.

Human moderators retain final authority for serious cases.

------------------------------------------------------------------------

# 28. PRIVACY & ACCOUNT SECURITY

Implement:

-   secure authentication
-   session management
-   row-level security
-   private profiles where supported
-   block/mute
-   account deletion
-   data export where required
-   consent/privacy controls
-   rate limiting
-   abuse prevention
-   secure secrets management
-   audit logs for privileged actions

Do not hard-code assumptions about third-party pricing or service
limits.

Use provider documentation and current production limits when deploying.

------------------------------------------------------------------------

# 29. TECHNOLOGY STACK

Recommended initial stack:

### Mobile

**React Native + Expo + TypeScript**

### Backend

**Supabase**

Use:

-   PostgreSQL
-   Auth
-   Storage
-   Realtime
-   Edge Functions where appropriate

### Notifications

FCM/APNs through the appropriate Expo/native notification architecture.

### Monitoring

Sentry and provider logs.

### CI/CD

GitHub Actions + Expo EAS.

### State management

Use a predictable client state/data-fetching architecture. Avoid
introducing multiple overlapping state libraries without a reason.

------------------------------------------------------------------------

# 30. INFRASTRUCTURE PRINCIPLE

Keep the first production architecture simple.

Do NOT add:

-   Redis
-   microservices
-   separate API gateways
-   custom Kubernetes infrastructure
-   unnecessary queues
-   multiple databases

unless measurements demonstrate that they are required.

Start with a modular monolith/serverless architecture that can later
split into services.

------------------------------------------------------------------------

# 31. PERFORMANCE

Targets:

-   fast initial screen
-   smooth scrolling
-   responsive interactions
-   lazy-loaded feeds
-   optimized images
-   efficient database queries
-   pagination/infinite scrolling
-   optimistic reactions where safe
-   cached drama metadata
-   background notification handling

Do not promise arbitrary absolute performance numbers before testing on
real devices and networks.

Performance must be measured on representative low-end Android devices
and constrained mobile networks, not only developer hardware.

------------------------------------------------------------------------

# 32. ACCESSIBILITY

Design toward WCAG 2.1 AA principles.

Support:

-   screen readers
-   TalkBack
-   VoiceOver
-   accessible labels
-   dynamic text sizing
-   sufficient contrast
-   meaningful touch targets
-   captions for video
-   descriptive media text
-   reduced-motion considerations

Accessibility is part of the design system, not a final checklist.

------------------------------------------------------------------------

# 33. ANALYTICS

Track product health rather than vanity metrics.

Core events:

-   app_opened
-   onboarding_completed
-   drama_viewed
-   drama_followed
-   episode_opened
-   episode_discussion_opened
-   post_created
-   comment_created
-   reaction_added
-   repost_created
-   bookmark_created
-   community_joined
-   user_followed
-   notification_opened
-   search_performed
-   post_shared

Core metrics:

-   DAU
-   WAU
-   MAU
-   D1/D7/D30 retention
-   posts per active user
-   comments per post
-   episode-discussion participation
-   drama follows
-   notification engagement
-   onboarding completion
-   feed engagement
-   churn

The most important metric should eventually be:

**How often do active users participate in meaningful K-drama
conversation?**

------------------------------------------------------------------------

# 34. ONBOARDING

Goal:

**Get the user to an interesting feed quickly.**

Recommended flow:

1.  Sign up.
2.  Select several interests.
3.  Select favorite dramas/actors.
4.  Follow a few recommended communities/accounts.
5.  Enter populated Home feed.

Do not create a long questionnaire.

Personalization should continue learning from behavior.

------------------------------------------------------------------------

# 35. DESIGN SYSTEM

Visual direction:

-   cinematic
-   premium
-   modern
-   social
-   emotional
-   fast
-   polished

Avoid directly copying:

-   Apple
-   X
-   TikTok
-   Netflix
-   Reddit

Use the inspiration to understand interaction patterns, not to reproduce
their visual identity.

## Working brand

**Hallyu (한류)**

Working positioning:

**Where the Wave Lives**

Brand implementation must remain configurable until
trademark/name/store/domain checks are complete.

------------------------------------------------------------------------

# 35A. CONCRETE VISUAL BASELINE FROM THE RESEARCH

The following values are the initial visual baseline from the research
document, refined by the product architecture:

-   Primary gradient: `#4A1C6E` → `#2D6CDF`
-   Accent: `#FF6B6B`
-   Dark surface baseline: `#0F0F0F`
-   UI typography: Inter or equivalent modern sans-serif
-   Headline/logo direction: distinctive Korean-inspired display
    treatment used sparingly
-   Card baseline: approximately 12px corner radius with restrained
    elevation
-   Internal card spacing baseline: approximately 16px
-   Primary actions: strong brand treatment with accessible contrast
-   Loading language: restrained wave-inspired animation
-   Motion language: fluid, cinematic and subtle

These are design tokens, not immutable laws. The coding agent must
centralize them so the visual system can be tuned globally without
rewriting components.

Do not apply the gradient to every surface. Brand color should establish
identity while content remains dominant.

# 36. DESIGN PRINCIPLES

### 1. Content first

The UI should frame community content rather than compete with it.

### 2. Thumb first

Important actions belong within comfortable mobile reach.

### 3. Fast

Avoid unnecessary screens, confirmations, and animations.

### 4. Cinematic without becoming cluttered

Drama imagery should feel rich without turning every screen into a
poster wall.

### 5. Identity matters

Users should feel like members of a fandom, not anonymous database
visitors.

### 6. Context matters

A post about an episode should know which drama and episode it belongs
to.

------------------------------------------------------------------------

# 37. REQUIRED SCREENS

## Authentication

-   splash
-   welcome
-   sign up
-   login
-   account recovery

## Onboarding

-   interests
-   dramas
-   actors
-   communities/accounts
-   completion

## Main

-   Home
-   Explore
-   Create
-   Notifications
-   Profile

## Content

-   Post detail
-   Comments
-   Drama hub
-   Episode page
-   Actor page
-   Community page
-   Search results
-   Hashtag page

## Profile

-   posts
-   saved
-   followers
-   following
-   currently watching
-   communities
-   settings

## Moderation

Moderator/admin screens should be permission-gated and can initially be
optimized for mobile/tablet internal use.

------------------------------------------------------------------------

# 38. EMPTY, LOADING & ERROR STATES

Every important screen needs deliberate states.

Examples:

### No posts

"Your fandom is quiet here. Follow a few dramas or communities to get
things moving."

### No search results

"No matching dramas, actors, users, or communities found."

### Network failure

"Couldn't load this right now."

Provide retry.

### Empty notifications

"You're caught up."

Never leave blank white space and expect the user to interpret it as a
philosophical statement.

------------------------------------------------------------------------

# 39. PRODUCT SAFETY RULES FOR THE CODING AGENT

The coding agent must:

1.  Never invent backend capabilities.
2.  Never place secret API keys in the mobile bundle.
3.  Never bypass database security rules.
4.  Never trust client-side permissions.
5.  Never expose privileged admin operations to ordinary users.
6.  Never build unauthorized streaming/download functionality.
7.  Never silently expand MVP scope.
8.  Never replace real backend functionality with fake local mock data
    once integration is required.
9.  Never claim a feature is complete when its end-to-end flow is
    broken.
10. Never create placeholder buttons that pretend to work.
11. Never use hard-coded fake counts in production UI.
12. Never create fake verification badges.
13. Never make AI moderation the sole authority for serious enforcement.
14. Never scrape prohibited third-party services.

------------------------------------------------------------------------

# 40. IMPLEMENTATION PHASES

## Phase 0 --- Foundation

-   project setup
-   TypeScript
-   navigation
-   Supabase
-   authentication
-   environment configuration
-   database schema
-   RLS
-   design system
-   error handling
-   analytics foundation

## Phase 1 --- Core social

-   profiles
-   follows
-   posts
-   images
-   comments
-   reactions
-   reposts
-   bookmarks
-   mentions
-   hashtags

## Phase 2 --- K-drama graph

-   dramas
-   actors
-   episodes
-   drama hubs
-   episode discussions
-   watching progress
-   follows
-   metadata synchronization

## Phase 3 --- Discovery

-   Explore
-   search
-   Trending
-   For You
-   Following
-   recommendation rules

## Phase 4 --- Communities

-   create
-   join
-   private/public
-   moderators
-   rules
-   community feeds

## Phase 5 --- Trust & retention

-   reports
-   blocks
-   mutes
-   moderation
-   verification
-   spoiler engine
-   notifications
-   deep links

## Phase 6 --- Production hardening

-   performance
-   accessibility
-   analytics
-   crash reporting
-   tests
-   security review
-   edge cases
-   release builds

Only after these phases should the application be considered an MVP
candidate.

------------------------------------------------------------------------

# 41. V1.1

Add:

-   vertical short-form video
-   fan edits
-   polls
-   richer creator tools
-   direct messaging
-   community events/watch parties
-   stronger recommendations
-   multilingual support
-   richer media tooling

------------------------------------------------------------------------

# 42. V2

Potentially add:

-   live streaming
-   creator monetization
-   advanced moderation dashboard
-   web application
-   third-party API
-   integrations

------------------------------------------------------------------------

# 43. LONG-TERM ECOSYSTEM

Potential future directions:

-   licensed streaming partnerships
-   virtual fan meetings
-   official merchandise
-   podcasts
-   AR experiences
-   offline fandom events
-   broader Korean entertainment categories

These are strategic possibilities, not MVP requirements.

------------------------------------------------------------------------

# 44. TESTING REQUIREMENTS

The build is not complete when screens render.

Test:

### Authentication

-   signup
-   login
-   logout
-   session recovery
-   invalid credentials

### Social

-   create
-   edit/delete where allowed
-   comment
-   reply
-   react
-   repost
-   bookmark
-   follow/unfollow

### Drama

-   browse
-   search
-   follow
-   episode navigation
-   discussion
-   watching progress

### Communities

-   create
-   join
-   leave
-   post
-   moderation
-   private access

### Notifications

-   trigger
-   receive
-   deep link
-   preference filtering

### Security

-   unauthorized database access
-   privilege escalation
-   blocked-user behavior
-   private-content leakage
-   rate limits

### Offline/network

-   slow network
-   failed uploads
-   retry
-   partial loading
-   interrupted sessions

------------------------------------------------------------------------

# 45. DEFINITION OF DONE

A feature is complete only when:

-   UI exists
-   database exists
-   permissions exist
-   backend logic exists
-   loading state exists
-   error state exists
-   empty state exists
-   analytics exists where appropriate
-   accessibility is addressed
-   security is addressed
-   real device testing passes
-   end-to-end flow works

A button that opens nothing is not a feature.

A beautiful screen backed by fake JSON is not a production application.

------------------------------------------------------------------------

# 46. MASTER BUILD INSTRUCTION FOR THE AI CODING AGENT

Build the **Hallyu mobile application** as a production-quality,
mobile-first social platform for K-drama fans.

Use the architecture and requirements in this document as the source of
truth.

## Non-negotiable principles

### Community first

The platform must feel like a living fandom.

### Drama context second

Drama and episode metadata should enrich conversations.

### Mobile first

Design specifically for touch, thumb reach, mobile performance,
notifications, deep links, media and intermittent networks.

### Real backend

Use Supabase/PostgreSQL for actual persistent application data.

### Secure by default

Use proper authentication, authorization and row-level security.

### No fake functionality

Do not simulate completed backend features with static local data when
the feature is required to work end-to-end.

### No unauthorized media

Do not implement piracy, unauthorized streaming, ripping, or
copyrighted-content redistribution.

### No scope creep

Build the MVP defined in this document before implementing v1.1 or v2.

------------------------------------------------------------------------

# 47. CODING AGENT EXECUTION RULES

Before writing application code:

1.  Inspect the repository/project.
2.  Determine what already exists.
3.  Identify reusable components.
4.  Audit existing dependencies.
5.  Identify environment variables and secrets.
6.  Produce an implementation plan.
7.  Identify blockers.
8.  Verify database architecture.
9.  Verify authentication architecture.
10. Verify navigation architecture.

Then implement in phases.

After each major phase:

-   run type checks
-   run linting
-   run tests
-   verify navigation
-   verify database queries
-   verify permissions
-   verify error handling
-   verify mobile layout

Do not continue blindly after a failed foundation.

Fix the underlying problem.

------------------------------------------------------------------------

# 48. FINAL PRODUCT TEST

Before release, answer these questions:

### Can a new user...

-   sign up?
-   choose interests?
-   immediately see relevant content?
-   discover a drama?
-   follow it?
-   see its episodes?
-   enter an episode discussion?
-   post a reaction?
-   receive replies?
-   follow another fan?
-   join a community?
-   receive a drama update?
-   manage spoilers?
-   block/report someone?
-   return to the app and immediately see what's happening?

If the answer to these is not yes, the product is not ready.

------------------------------------------------------------------------

# 49. THE PRODUCT IN ONE SENTENCE

> **Hallyu is the social home for K-drama fandom, where every drama,
> episode, actor, conversation, community and breaking moment connects
> into one living fan experience.**

------------------------------------------------------------------------

# 50. FINAL STRATEGIC RULE

Do not build a giant application because the feature list is long.

Build the smallest system that makes the fandom loop addictive:

**Something happens → fans react → fans discuss → fans discover each
other → the conversation grows → the next thing happens.**

Everything else exists to strengthen that loop.

That is the product.

------------------------------------------------------------------------

# 51. RESEARCH-DERIVED UX DETAILS TO PRESERVE

The original research provided several useful screen-level details that
should not be lost during implementation.

## Home feed

A feed item may contain:

-   avatar;
-   username;
-   timestamp;
-   drama/episode context;
-   text;
-   image carousel where applicable;
-   spoiler overlay where applicable;
-   reaction/comment/repost/bookmark actions.

## Explore

Include:

-   global search;
-   trending topics;
-   currently airing dramas;
-   upcoming dramas;
-   genre browsing;
-   actor discovery;
-   community discovery;
-   official account discovery.

## Drama hub

Keep the original research's strong visual reference pattern:

-   poster/backdrop;
-   title;
-   year/status/genre;
-   follow action;
-   cast carousel;
-   episode list;
-   community activity.

The final architecture adds the crucial distinction that episodes lead
into first-class discussions.

## Create

The original research suggested:

-   text composition;
-   image selection;
-   drama/actor tagging;
-   hashtag suggestions;
-   spoiler controls;
-   preview before publishing.

The final MVP keeps the lightweight post flow and postpones the
expensive video editor/poll system.

## Notifications

Notification items should contain:

-   event icon;
-   human-readable description;
-   timestamp;
-   source avatar where relevant;
-   direct navigation to the relevant object.

------------------------------------------------------------------------

# 52. RESEARCH-TO-BUILD DECISION LOG

## Kept directly

-   community-first positioning;
-   mobile-first product;
-   five-destination navigation;
-   Hallyu working brand;
-   purple-to-blue visual direction;
-   episode discussions;
-   currently watching;
-   drama/actor discovery;
-   official content layer;
-   notifications;
-   moderation;
-   Supabase/PostgreSQL direction;
-   React Native + Expo direction;
-   research source register.

## Kept but deferred

-   short-form video;
-   polls;
-   direct messaging;
-   community events;
-   advanced recommendations;
-   creator monetization;
-   live streaming;
-   public web application;
-   third-party API;
-   marketplace;
-   licensed streaming.

## Deliberately rejected as MVP requirements

-   embedding-based recommendation infrastructure;
-   Redis before measured need;
-   absolute performance promises;
-   fake HLS processing;
-   hard-coded provider pricing/limits;
-   scraping restricted databases;
-   client-only authorization;
-   four competing Home feeds;
-   fake backend data presented as finished functionality.

------------------------------------------------------------------------

# 53. ORIGINAL RESEARCH SOURCE REGISTER

The supplied research document contained 60 source references. They are
retained as a provenance register. Because sources and third-party terms
change, the coding agent must verify any source, licensing condition,
API availability, pricing, and technical limitation before production
use.

1.  https://journal.uitm.edu.my/index.php/JIKM/article/view/9060
2.  https://www.tandfonline.com/doi/abs/10.1080/01296612.2025.2480451
3.  https://ir.uitm.edu.my/id/eprint/135008/
4.  https://www.reddit.com/r/kdramas/comments/1owrbjd/what_cool_features_would_you_want_in_a_better/
5.  https://www.reddit.com/r/kdramas/comments/1vp0tl7/my_dramalist_vs_asianwiki_which_do_you_prefer/
6.  https://redpulse.io/subreddit-search/r/kdrama/
7.  https://junglemonster.org/en/how-to-join-kpop-fandom-online-11/
8.  https://peakbot.pro/blog/best-discord-shows-2026
9.  https://www.reddit.com/r/kdramas/comments/1tr1tii/pls_list_kdrama_discord_servers/
10. https://link-media.co.id/blog/linkmedia-blog/new-kdramas-taking-over-social-media-whats-viral-why
11. https://www.adobe.com/express/learn/blog/social-media-news-september-2025
12. https://theblue.social/articles/engagement-trends-x-threads-bluesky
13. https://thesociallights.com/threads-vs-x-whos-winning-the-feed-in-2025/
14. https://www.dojeonmedia.com/post/2025-k-entertainment-social-media-trends-that-shocked-us
15. https://mwm.ai/apps/mydramalist-asian-drama-db/1463129320
16. https://inviter.co/blog/discord-vs-telegram-whatsapp-slack
17. https://www.yahoo.com/lifestyle/articles/best-streaming-services-asian-dramas-140016477.html
18. https://www.itechguides.com/14-best-websites-to-watch-korean-dramas-in-2026/
19. https://ottratings.com/best-ott-platforms-for-korean-dramas-in-india/
20. https://kculturelog.com/k-drama/where-to-watch-kdramas-2026/
21. https://ottasia.com/blog/best-platforms-for-korean-dramas-abroad-2026
22. https://codefronts.com/navigation/css-mobile-navigation/
23. https://www.designstudiouiux.com/blog/mobile-navigation-ux/
24. https://artofstyleframe.com/blog/mobile-navigation-patterns-tab-bars-drawers-gestures/
25. https://saassoftware.org/blog/mobile-navigation-patterns-pwas/
26. https://medium.com/@secuodsoft/the-complete-guide-to-creating-user-friendly-mobile-navigation-in-2025-59c9dd620c1d
27. https://mkamil.com/blog/navigation-patterns-in-mobile-app-design/
28. https://calmops.com/web/mobile-app-navigation-patterns-ux/
29. https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/
30. https://www.thealien.design/insights/mobile-app-navigation-best-practices
31. https://techcrunch.com/2025/10/02/threads-takes-on-x-with-new-communities-feature/
32. https://www.heyorca.com/blog/social-news
33. https://www.heyorca.com/blog/social-news
34. https://sparkum.net/blog/what-you-need-to-know-about-threads-in-2025
35. https://www.webpronews.com/metas-threads-tests-communities-for-niche-user-discussions/
36. https://keywordseverywhere.com/news/social-algorithm-updates/
37. https://www.socialmediatoday.com/news/instagram-linkedin-and-threads-engagement-declined-in-2025/814141/
38. https://almcorp.com/blog/social-media-engagement-decline-2025-instagram-linkedin-threads/
39. https://docs.expo.dev/develop/database/
40. https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
41. https://startupa.ge/blog/best-tech-stack-mobile-app-2026
42. https://boilerplatehub.com/blog/best-mobile-app-boilerplates
43. https://medium.com/@flutter-app/flutter-backend-choosing-between-rest-graphql-firebase-supabase-730df387bddb
44. https://react-news.com/the-modern-mobile-stack-combining-react-native-and-supabase-for-full-stack-development
45. https://www.shipnative.dev/blog/supabase-vs-firebase-react-native-2026
46. https://ejournal.unitomo.ac.id/index.php/jsk/article/view/10118
47. https://zipdo.co/korean-tv-industry-statistics/
48. https://www.wenotift.com/insights/2026-kpop-fandom-trend-forecast
49. https://www.reddit.com/r/planhub/comments/1rr54da/instagram_linkedin_and_threads_engagement_dropped/
50. https://www.linos.ai/technology/threads-vs-x-2026/
51. https://marketingagent.blog/2026/01/11/the-complete-threads-marketing-strategy-for-2026-from-x-alternative-to-metas-co
52. https://www.reddit.com/r/kdramas/comments/1npn63t/best_complimentary_app_to_viki_for_koreanasian/
53. https://todayblessings.com/korea-opsites-for-kdramas-and-movies-your-ultimate-streaming-guide-2025/
54. https://www.oreateai.com/blog/the-ultimate-guide-to-streaming-kdramas-top-sites-you-need-to-know/eda63860c3db279bcd05e1a27d46541d
55. https://www.linkedin.com/pulse/app-navigation-patterns-whats-trending-2025-appsunify-rgfzc
56. https://www.layoutscene.com/mobile-navigation-beyond-hamburger-2026/
57. https://www.linkedin.com/pulse/mobile-ui-patterns-from-todays-top-apps-appsunify-2myec
58. https://www.reddit.com/r/kpop_uncensored/comments/1pxzudj/what_are_things_that_need_to_stay_in_2025/
59. https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026
60. https://gendesigns.ai/blog/mobile-ui-patterns-2026

------------------------------------------------------------------------

# 54. FINAL BUILD COMMAND

Build the application described in this document as a real mobile
product.

Do not merely produce screens.

Do not merely produce a database.

Do not merely produce a clickable prototype.

Implement the complete connected product loop:

**Discover → Follow → Watch → Discuss → React → Connect → Return**

The implementation must use real persistence, real authorization, real
loading/error states, real notification flows where configured, and real
end-to-end interactions.

If an external dependency cannot be configured in the current
environment, isolate it behind a clean adapter and clearly document the
exact remaining configuration. Do not fake successful production
behavior.

Build in the defined phases, validate each phase, and do not expand MVP
scope without an explicit product decision.

The final test is simple:

> **Can a K-drama fan open the app, immediately understand what is
> happening, join the conversation safely, find people who care about
> the same drama, and have a reason to return for the next episode or
> breaking moment?**

If not, keep building the product rather than polishing the corpse. 🗿

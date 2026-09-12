-- Hallyu V1 schema — implements Spec §25 (data model), §9 (spoiler system), §14 (communities),
-- §39 (moderation/safety), §16 (notifications), §17 (media) on PostgreSQL 15.
-- Conventions: TEXT + CHECK constraints (easier migrations than ENUMs), bigserial ids,
-- (created_at DESC, id DESC) cursor pagination pairs, soft deletes for user content,
-- generated tsvector columns + GIN for search, counters denormalized where hot.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ IDENTITY ============

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    handle              TEXT NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_.]{3,24}$'),
    display_name        TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
    bio                 TEXT CHECK (char_length(bio) <= 500),
    avatar_media_id     BIGINT,
    banner_media_id     BIGINT,
    verification_level  TEXT NOT NULL DEFAULT 'none' CHECK (verification_level IN ('none','verified','official')),
    is_private          BOOLEAN NOT NULL DEFAULT FALSE,
    follower_count      INTEGER NOT NULL DEFAULT 0,
    following_count     INTEGER NOT NULL DEFAULT 0,
    post_count          INTEGER NOT NULL DEFAULT 0,
    spoiler_preference  TEXT NOT NULL DEFAULT 'balanced' CHECK (spoiler_preference IN ('open','balanced','strict')),
    ask_before_reveal   BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start   SMALLINT,   -- hour 0-23, NULL = off
    quiet_hours_end     SMALLINT,
    onboarded           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    family_id   UUID NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    replaced_by BIGINT,
    user_agent  TEXT,
    ip          TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Unified follows: subject_type = user | drama | actor | community
CREATE TABLE follows (
    id            BIGSERIAL PRIMARY KEY,
    follower_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_type  TEXT NOT NULL CHECK (subject_type IN ('user','drama','actor','community')),
    subject_id    BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (follower_id, subject_type, subject_id)
);
CREATE INDEX idx_follows_subject ON follows(subject_type, subject_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);

CREATE TABLE blocks (
    id          BIGSERIAL PRIMARY KEY,
    blocker_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE mutes (
    id          BIGSERIAL PRIMARY KEY,
    muter_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (muter_id, muted_id),
    CHECK (muter_id <> muted_id)
);

-- ============ DRAMA GRAPH ============

CREATE TABLE dramas (
    id              BIGSERIAL PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    title_kr        TEXT,
    year            INTEGER CHECK (year BETWEEN 1980 AND 2100),
    network         TEXT,
    country         TEXT NOT NULL DEFAULT 'South Korea',
    genres          TEXT NOT NULL DEFAULT '', -- comma-separated genre tags (Exposed-friendly)
    synopsis        TEXT,
    poster_media_id BIGINT,
    backdrop_media_id BIGINT,
    status          TEXT NOT NULL DEFAULT 'airing' CHECK (status IN ('upcoming','airing','completed')),
    episode_count   INTEGER NOT NULL DEFAULT 0,
    air_start       DATE,
    air_end         DATE,
    follower_count  INTEGER NOT NULL DEFAULT 0,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    tmdb_id         INTEGER UNIQUE,
    search_text     TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(title_kr,'') || ' ' || coalesce(network,''))) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dramas_search ON dramas USING GIN (search_text);

CREATE INDEX idx_dramas_trending ON dramas (follower_count DESC, id DESC) WHERE status = 'airing';

CREATE TABLE episodes (
    id          BIGSERIAL PRIMARY KEY,
    drama_id    BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    number      INTEGER NOT NULL,
    title       TEXT,
    air_date    DATE,
    synopsis    TEXT,
    tmdb_id     INTEGER UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (drama_id, number)
);
CREATE INDEX idx_episodes_drama ON episodes(drama_id, number);

CREATE TABLE actors (
    id          BIGSERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    name_kr     TEXT,
    bio         TEXT,
    photo_media_id BIGINT,
    birthday    DATE,
    nationality TEXT NOT NULL DEFAULT 'South Korean',
    follower_count INTEGER NOT NULL DEFAULT 0,
    tmdb_id     INTEGER UNIQUE,
    search_text TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(name_kr,''))) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_actors_search ON actors USING GIN (search_text);

CREATE TABLE credits (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    drama_id    BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    role_name   TEXT,
    role_type   TEXT NOT NULL DEFAULT 'support' CHECK (role_type IN ('main','support','guest','cameo')),
    credit_order INTEGER NOT NULL DEFAULT 100,
    UNIQUE (actor_id, drama_id)
);
CREATE INDEX idx_credits_drama ON credits(drama_id, credit_order);
CREATE INDEX idx_credits_actor ON credits(actor_id);

-- Watch progress: the engine of the spoiler system (Spec §9)
CREATE TABLE watch_progress (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id        BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    last_episode    INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching','completed','dropped','planned')),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, drama_id)
);
CREATE INDEX idx_watch_progress_user ON watch_progress(user_id, updated_at DESC);

-- Dramas a user has muted spoilers for entirely (Spec §9: muted dramas)
CREATE TABLE spoiler_mutes (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id    BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, drama_id)
);

-- ============ MEDIA ============

CREATE TABLE media_assets (
    id          BIGSERIAL PRIMARY KEY,
    owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN ('image','video')),
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','rejected')),
    mime        TEXT NOT NULL,
    size_bytes  BIGINT NOT NULL,
    width       INTEGER,
    height      INTEGER,
    storage_key TEXT NOT NULL,
    thumb_key   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_owner ON media_assets(owner_id);
ALTER TABLE profiles ADD CONSTRAINT fk_profile_avatar FOREIGN KEY (avatar_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD CONSTRAINT fk_profile_banner FOREIGN KEY (banner_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE dramas ADD CONSTRAINT fk_drama_poster FOREIGN KEY (poster_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE dramas ADD CONSTRAINT fk_drama_backdrop FOREIGN KEY (backdrop_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE actors ADD CONSTRAINT fk_actor_photo FOREIGN KEY (photo_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- ============ CONTENT ============

CREATE TABLE posts (
    id                  BIGSERIAL PRIMARY KEY,
    author_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
    -- context anchors (community FK added after communities table exists, below)
    community_id        BIGINT,
    drama_id            BIGINT REFERENCES dramas(id) ON DELETE CASCADE,
    episode_id          BIGINT REFERENCES episodes(id) ON DELETE CASCADE,
    -- spoiler metadata (Spec §9)
    spoiler_level       TEXT NOT NULL DEFAULT 'none' CHECK (spoiler_level IN ('none','light','heavy')),
    spoiler_drama_id    BIGINT REFERENCES dramas(id) ON DELETE CASCADE,
    spoiler_episode     INTEGER,
    -- reposts
    repost_of_id        BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    -- state
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    comment_count       INTEGER NOT NULL DEFAULT 0,
    reaction_count      INTEGER NOT NULL DEFAULT 0,
    repost_count        INTEGER NOT NULL DEFAULT 0,
    deleted_at          TIMESTAMPTZ,
    edited_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_text         TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(content,''))) STORED
);
-- NOTE: communities FK is created after communities table below.
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_episode ON posts(episode_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_community ON posts(community_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_drama ON posts(drama_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_feed ON posts(created_at DESC, id DESC) WHERE deleted_at IS NULL AND is_locked = FALSE;
CREATE INDEX idx_posts_search ON posts USING GIN (search_text);

CREATE TABLE comments (
    id                  BIGSERIAL PRIMARY KEY,
    post_id             BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    root_comment_id     BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    depth               SMALLINT NOT NULL DEFAULT 1 CHECK (depth BETWEEN 1 AND 3),
    author_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    spoiler_level       TEXT NOT NULL DEFAULT 'none' CHECK (spoiler_level IN ('none','light','heavy')),
    reaction_count      INTEGER NOT NULL DEFAULT 0,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_root ON comments(root_comment_id, created_at);
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);

CREATE TABLE reactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
    target_id   BIGINT NOT NULL,
    emoji       TEXT NOT NULL CHECK (emoji IN ('like','heart','sob','fire','clap')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id, emoji);

CREATE TABLE bookmarks (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);

CREATE TABLE hashtags (
    id      BIGSERIAL PRIMARY KEY,
    tag     TEXT NOT NULL UNIQUE CHECK (tag ~ '^[a-z0-9_]{1,64}$'),
    use_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE post_hashtags (
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id  BIGINT NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);
CREATE INDEX idx_post_hashtags_tag ON post_hashtags(hashtag_id);

CREATE TABLE mentions (
    id              BIGSERIAL PRIMARY KEY,
    author_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioned_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     TEXT NOT NULL CHECK (target_type IN ('post','comment')),
    target_id       BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mentions_target ON mentions(target_type, target_id);
CREATE INDEX idx_mentions_user ON mentions(mentioned_id, created_at DESC);

CREATE TABLE post_media (
    post_id  BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id BIGINT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, media_id)
);

-- ============ COMMUNITIES (Spec §14) ============

CREATE TABLE communities (
    id          BIGSERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,40}$'),
    name        TEXT NOT NULL,
    description TEXT,
    banner_media_id BIGINT,
    avatar_media_id BIGINT,
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    created_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    member_count INTEGER NOT NULL DEFAULT 0,
    post_count  INTEGER NOT NULL DEFAULT 0,
    search_text TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_communities_search ON communities USING GIN (search_text);

ALTER TABLE posts ADD CONSTRAINT fk_posts_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE communities ADD CONSTRAINT fk_community_banner FOREIGN KEY (banner_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE communities ADD CONSTRAINT fk_community_avatar FOREIGN KEY (avatar_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE TABLE community_members (
    community_id    BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (community_id, user_id)
);
CREATE INDEX idx_community_members_user ON community_members(user_id);

CREATE TABLE community_rules (
    id          BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL DEFAULT 0,
    rule_text   TEXT NOT NULL
);
CREATE INDEX idx_community_rules ON community_rules(community_id, position);

-- ============ SAFETY / MODERATION (Spec §39) ============

CREATE TABLE reports (
    id          BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','user','community')),
    target_id   BIGINT NOT NULL,
    reason      TEXT NOT NULL CHECK (reason IN ('spoiler_abuse','harassment','hate','spam','nsfw','violence','other')),
    details     TEXT,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);

CREATE TABLE moderation_actions (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL CHECK (action IN ('lock_post','unlock_post','delete_post','delete_comment','suspend_user','reinstate_user','resolve_report','dismiss_report','grant_verified','grant_official','pin_post','unpin_post')),
    target_type TEXT NOT NULL,
    target_id   BIGINT NOT NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_actions_target ON moderation_actions(target_type, target_id);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   BIGINT,
    details     TEXT, -- JSON string
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, created_at DESC);

CREATE TABLE spoiler_reveals (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
    target_id   BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_spoiler_reveals_user ON spoiler_reveals(user_id, created_at DESC);

-- ============ NOTIFICATIONS (Spec §16) ============

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('reply','mention','reaction','repost','follow','episode_release','community_announcement','moderation','system')),
    actor_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT,
    entity_id   BIGINT,
    payload     TEXT, -- JSON string
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

CREATE TABLE devices (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform    TEXT NOT NULL CHECK (platform IN ('android','ios')),
    push_token  TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, push_token)
);

-- ============ TRENDING (Spec §12) ============

CREATE TABLE trending_snapshots (
    id          BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('drama','episode','post','hashtag','community')),
    entity_id   BIGINT NOT NULL,
    score       DOUBLE PRECISION NOT NULL,
    bucket      DATE NOT NULL DEFAULT current_date,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_id, bucket)
);
CREATE INDEX idx_trending_top ON trending_snapshots(entity_type, bucket, score DESC);

-- ============ FTS HELPERS ============

-- profiles search (handle/display_name) needs a trigger-maintained vector since generated
-- columns cannot reference other tables; keep it simple with a trigram index instead:
CREATE INDEX idx_profiles_handle_trgm ON profiles USING GIN (handle gin_trgm_ops);
CREATE INDEX idx_profiles_display_trgm ON profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX idx_hashtags_tag_trgm ON hashtags USING GIN (tag gin_trgm_ops);

COMMIT;

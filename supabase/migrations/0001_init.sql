-- Hallyu — initial schema + row-level security (spec §25, §25A, §26, §28)
-- Reproducible migration; apply with `supabase db push` or the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'ADMIN'
  );
$$;

create or replace function public.is_moderator()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('ADMIN','MODERATOR')
  );
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text default '',
  bio text default '',
  avatar_url text,
  role text not null default 'USER' check (role in ('USER','COMMUNITY_MODERATOR','OFFICIAL','MODERATOR','ADMIN')),
  is_verified boolean not null default false,
  is_official boolean not null default false,
  follower_count int not null default 0,
  following_count int not null default 0,
  post_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'fan_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- follows: a user can follow users, dramas, or actors
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  followed_user_id uuid references public.profiles(id) on delete cascade,
  drama_id uuid references public.dramas(id) on delete cascade,
  actor_id uuid references public.actors(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (followed_user_id is not null)::int + (drama_id is not null)::int + (actor_id is not null)::int = 1
  ),
  unique (user_id, followed_user_id),
  unique (user_id, drama_id),
  unique (user_id, actor_id)
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_user_id)
);

create table public.mutes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, muted_user_id)
);

-- ---------------------------------------------------------------------------
-- K-drama graph
-- ---------------------------------------------------------------------------

create table public.dramas (
  id uuid primary key default gen_random_uuid(),
  tmdb_id bigint unique,
  title text not null,
  korean_title text,
  synopsis text default '',
  poster_url text,
  backdrop_url text,
  status text not null default 'AIRING' check (status in ('AIRING','UPCOMING','COMPLETED')),
  year int,
  genres text[] not null default '{}',
  airs_on text,
  network text,
  episode_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.actors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  korean_name text,
  photo_url text,
  bio text default '',
  follower_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.drama_cast (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid not null references public.dramas(id) on delete cascade,
  actor_id uuid not null references public.actors(id) on delete cascade,
  role text,
  position int not null default 0,
  unique (drama_id, actor_id)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid not null references public.dramas(id) on delete cascade,
  number int not null,
  title text,
  synopsis text default '',
  air_date date,
  thumbnail_url text,
  discussion_count int not null default 0,
  unique (drama_id, number)
);

create table public.watching_status (
  user_id uuid not null references public.profiles(id) on delete cascade,
  drama_id uuid not null references public.dramas(id) on delete cascade,
  status text not null default 'WATCHING' check (status in ('WATCHING','COMPLETED','PLAN_TO_WATCH','DROPPED')),
  watched_through_episode int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, drama_id)
);

create table public.watched_episodes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '',
  category text check (category in ('REACTION','DISCUSSION','THEORY','RECOMMENDATION','MEME','NEWS','QUESTION','FAN_CONTENT')),
  drama_id uuid references public.dramas(id) on delete set null,
  episode_number int,
  spoiler_level int,
  image_urls jsonb not null default '[]'::jsonb,
  community_id uuid references public.communities(id) on delete cascade,
  like_count int not null default 0,
  comment_count int not null default 0,
  repost_count int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_posts_created on public.posts (created_at desc);
create index idx_posts_author on public.posts (author_id);
create index idx_posts_drama_episode on public.posts (drama_id, episode_number);
create index idx_posts_community on public.posts (community_id);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text unique not null,
  post_count int not null default 0
);

create table public.post_hashtags (
  post_id uuid not null references public.posts(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key (post_id, hashtag_id)
);

create table public.mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_comments_post on public.comments (post_id, created_at);

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.reposts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Communities
-- ---------------------------------------------------------------------------

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  avatar_url text,
  banner_url text,
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','PRIVATE')),
  member_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('MEMBER','MODERATOR')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.community_rules (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  rule_text text not null,
  position int not null default 0
);

-- ---------------------------------------------------------------------------
-- Episode discussions (first-class object — spec §8, §25A)
-- ---------------------------------------------------------------------------

create table public.episode_discussions (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid not null references public.dramas(id) on delete cascade,
  episode_number int not null,
  title text not null default '',
  created_at timestamptz not null default now(),
  unique (drama_id, episode_number)
);

-- ---------------------------------------------------------------------------
-- Official content
-- ---------------------------------------------------------------------------

create table public.official_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  org_name text not null,
  verified_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('EPISODE_RELEASE','REPLY','MENTION','COMMUNITY_ANNOUNCEMENT','ACTOR_UPDATE','OFFICIAL_ANNOUNCEMENT','TRENDING_POST','SYSTEM')),
  title text not null,
  body text default '',
  actor_id uuid references public.profiles(id) on delete set null,
  drama_id uuid references public.dramas(id) on delete cascade,
  episode_number int,
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  enabled boolean not null default true,
  primary key (user_id, category)
);

-- ---------------------------------------------------------------------------
-- Trust & safety
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('POST','COMMENT','USER','COMMUNITY')),
  target_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('SPAM','HARASSMENT','SPOILER','UNSAFE','COPYRIGHT','OTHER')),
  note text default '',
  status text not null default 'OPEN' check (status in ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  preview text default '',
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  action text not null check (action in ('REMOVED','HIDDEN','BANNED','APPROVED')),
  reason text default '',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Count maintenance triggers
-- ---------------------------------------------------------------------------

create or replace function public.incr_post_counter(column_name text, delta int)
returns trigger language plpgsql as $$
begin
  execute format('update public.posts set %I = greatest(%I + $1, 0) where id = $2', column_name, column_name)
  using delta, new.post_id;
  return new;
end $$;

create trigger trg_post_reactions_incr after insert on public.post_reactions
for each row execute function public.incr_post_counter('like_count', 1);
create trigger trg_post_reactions_decr after delete on public.post_reactions
for each row execute function public.incr_post_counter('like_count', -1);

create trigger trg_comments_incr after insert on public.comments
for each row execute function public.incr_post_counter('comment_count', 1);
create trigger trg_comments_decr after delete on public.comments
for each row execute function public.incr_post_counter('comment_count', -1);

create trigger trg_reposts_incr after insert on public.reposts
for each row execute function public.incr_post_counter('repost_count', 1);
create trigger trg_reposts_decr after delete on public.reposts
for each row execute function public.incr_post_counter('repost_count', -1);

create or replace function public.bump_member_count(delta int)
returns trigger language plpgsql as $$
begin
  update public.communities set member_count = greatest(member_count + delta, 0)
  where id = coalesce(new.community_id, old.community_id);
  return coalesce(new, old);
end $$;

create trigger trg_members_incr after insert on public.community_members
for each row execute function public.bump_member_count(1);
create trigger trg_members_decr after delete on public.community_members
for each row execute function public.bump_member_count(-1);

create or replace function public.bump_follower_count(delta int)
returns trigger language plpgsql as $$
begin
  if coalesce(new.followed_user_id, old.followed_user_id) is not null then
    update public.profiles set follower_count = greatest(follower_count + delta, 0)
    where id = coalesce(new.followed_user_id, old.followed_user_id);
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_followers_incr after insert on public.follows
for each row execute function public.bump_follower_count(1);
create trigger trg_followers_decr after delete on public.follows
for each row execute function public.bump_follower_count(-1);

-- ---------------------------------------------------------------------------
-- Row-level security (RLS before any client exposure — spec §25A, §28)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.mutes enable row level security;
alter table public.dramas enable row level security;
alter table public.actors enable row level security;
alter table public.drama_cast enable row level security;
alter table public.episodes enable row level security;
alter table public.watching_status enable row level security;
alter table public.watched_episodes enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.mentions enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.reposts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_rules enable row level security;
alter table public.episode_discussions enable row level security;
alter table public.official_accounts enable row level security;
alter table public.verification_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: public read, owner update
create policy "profiles are readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

-- catalog: read by all
create policy "dramas readable" on public.dramas for select using (true);
create policy "actors readable" on public.actors for select using (true);
create policy "cast readable" on public.drama_cast for select using (true);
create policy "episodes readable" on public.episodes for select using (true);

-- follows/blocks/mutes: owner only
create policy "follows owner" on public.follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "blocks owner" on public.blocks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mutes owner" on public.mutes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- watching: owner only
create policy "watching owner" on public.watching_status for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watched owner" on public.watched_episodes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- posts: read all non-deleted; write own
create policy "posts readable" on public.posts for select using (deleted_at is null);
create policy "users create posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "users delete own posts" on public.posts for delete using (auth.uid() = author_id);

create policy "comments readable" on public.comments for select using (deleted_at is null);
create policy "users create comments" on public.comments for insert with check (auth.uid() = author_id);
create policy "users update own comments" on public.comments for update using (auth.uid() = author_id);

create policy "reactions owner" on public.post_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comment reactions owner" on public.comment_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reposts owner" on public.reposts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bookmarks owner" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- hashtags read
create policy "hashtags readable" on public.hashtags for select using (true);
create policy "post hashtags readable" on public.post_hashtags for select using (true);

-- communities: public read; members join/leave
create policy "communities readable" on public.communities for select using (visibility = 'PUBLIC');
create policy "memberships owner" on public.community_members for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rules readable" on public.community_rules for select using (true);

-- episode discussions read
create policy "discussions readable" on public.episode_discussions for select using (true);

-- notifications: recipient only
create policy "notifications recipient" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications mark read" on public.notifications for update using (auth.uid() = user_id);
create policy "notification prefs owner" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reports: users create own; moderators read/update
create policy "users create reports" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "moderators read reports" on public.reports for select using (public.is_moderator());
create policy "moderators update reports" on public.reports for update using (public.is_moderator());

-- moderation & audit: privileged only
create policy "moderators manage actions" on public.moderation_actions for all using (public.is_moderator()) with check (public.is_moderator());
create policy "admins read audit" on public.audit_logs for select using (public.is_admin());

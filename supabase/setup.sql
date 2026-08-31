-- Plary — complete database setup for a fresh Supabase project.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Idempotent: safe to re-run. Equivalent to schema.sql + migrations 00002–00014.
--
-- Existing installations: do NOT run this — keep applying migrations/ in order.
--
-- NOTE: this app has no RLS policies. All access control is application-layer,
-- using the service-role key on the server. Never expose the service-role key.

-- ── Core tables ──────────────────────────────────────────────────────────────

create table if not exists prototypes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  figma_url text,
  figma_file_key text,
  figma_node_id text,
  saved_by_figma_user_id text,
  thumbnail_url text,
  archived boolean default false,
  kind text not null default 'prototype' check (kind in ('prototype', 'screen')),
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists prototypes_user_id_idx on prototypes (user_id);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists collections_user_id_idx on collections (user_id);
create unique index if not exists collections_user_id_name_idx
  on collections (user_id, lower(name));

create table if not exists prototype_collections (
  user_id uuid references auth.users not null,
  prototype_id uuid references prototypes(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (prototype_id, collection_id)
);

create index if not exists prototype_collections_user_id_idx
  on prototype_collections (user_id);
create index if not exists prototype_collections_collection_id_idx
  on prototype_collections (collection_id);
create index if not exists prototype_collections_prototype_id_idx
  on prototype_collections (prototype_id);

-- ── Figma OAuth ──────────────────────────────────────────────────────────────

-- Tokens are encrypted at rest via FIGMA_ENCRYPTION_KEY (AES-256-GCM)
create table if not exists figma_connections (
  user_id uuid references auth.users not null primary key,
  figma_user_id text not null,
  figma_email text,
  figma_display_name text,
  figma_avatar_url text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  health text not null default 'connected'
    check (health in ('connected', 'needs_reconnect')),
  team_ids text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists figma_connections_figma_user_id_idx
  on figma_connections (figma_user_id);

-- OAuth CSRF states, single-use, 10-minute TTL (cleaned by the /start endpoint)
create table if not exists oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  state text not null unique,
  created_at timestamptz default now()
);

create index if not exists oauth_states_state_idx on oauth_states (state);
create index if not exists oauth_states_created_at_idx on oauth_states (created_at);

-- Per-user cache of team file listings for resolve-file
create table if not exists figma_file_cache (
  user_id uuid references auth.users not null primary key,
  team_ids text[] not null,
  files jsonb not null,
  fetched_at timestamptz not null
);

-- ── Sessions & plugin auth ───────────────────────────────────────────────────

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_token text not null unique,
  user_agent text,
  ip_address text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  notified_new_login boolean not null default false
);

create index if not exists user_sessions_session_token_idx
  on user_sessions (session_token);
create index if not exists user_sessions_user_id_idx
  on user_sessions (user_id);
create index if not exists user_sessions_active_idx
  on user_sessions (user_id, created_at)
  where revoked_at is null;

-- One-time auth sessions created by the Figma plugin (browser-initiated polling)
create table if not exists plugin_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id uuid references auth.users,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists plugin_auth_sessions_session_id_idx
  on plugin_auth_sessions (session_id);
create index if not exists plugin_auth_sessions_expires_at_idx
  on plugin_auth_sessions (expires_at);

-- Per-user plugin token version, for instant revocation of all prior JWTs
create table if not exists plugin_token_versions (
  user_id uuid primary key references auth.users on delete cascade,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create or replace function bump_token_version(p_user_id uuid)
returns int
language plpgsql
as $$
declare
  v_new int;
begin
  insert into plugin_token_versions (user_id, version, updated_at)
    values (p_user_id, 2, now())
    on conflict (user_id)
    do update set version = plugin_token_versions.version + 1,
                  updated_at = now()
    returning version into v_new;
  return v_new;
end;
$$;

-- ── Rate limiting ────────────────────────────────────────────────────────────

-- Postgres-backed fixed-window rate limiter (serverless functions share no memory)
create table if not exists rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, identifier, window_start)
);

create index if not exists rate_limits_window_idx on rate_limits (window_start);

create or replace function check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_window_seconds int,
  p_max int
) returns boolean
language plpgsql
as $$
declare
  v_window timestamptz;
  v_count int;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into rate_limits (bucket, identifier, window_start, count)
    values (p_bucket, p_identifier, v_window, 1)
    on conflict (bucket, identifier, window_start)
    do update set count = rate_limits.count + 1
    returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- ── Storage ──────────────────────────────────────────────────────────────────

-- Public-read bucket for prototype thumbnails. Uploads go through the server
-- with the service-role key, so no storage policies are needed.
insert into storage.buckets (id, name, public)
  values ('thumbnails', 'thumbnails', true)
  on conflict (id) do nothing;

-- ── Optional: restrict signups to your organization's email domain ───────────
-- Magic links auto-create an account for any email address. Uncomment and edit
-- the domain list to enforce an allowlist at the database level.
--
-- create or replace function enforce_email_domain()
-- returns trigger
-- language plpgsql
-- security definer
-- as $$
-- begin
--   if split_part(new.email, '@', 2) not in ('yourcompany.com') then
--     raise exception 'Signups are restricted to approved email domains';
--   end if;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists enforce_email_domain_trigger on auth.users;
-- create trigger enforce_email_domain_trigger
--   before insert on auth.users
--   for each row execute function enforce_email_domain();

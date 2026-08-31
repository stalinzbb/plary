-- Historical base schema (pre-migrations snapshot). For a fresh install, run
-- setup.sql instead — it is the complete, idempotent current state.

create table prototypes (
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

create index on prototypes (user_id);

create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create index on collections (user_id);
create unique index collections_user_id_name_idx on collections (user_id, lower(name));

create table prototype_collections (
  user_id uuid references auth.users not null,
  prototype_id uuid references prototypes(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (prototype_id, collection_id)
);

create index on prototype_collections (user_id);
create index on prototype_collections (collection_id);
create index on prototype_collections (prototype_id);

-- Phase 5: Figma OAuth connected account

create table figma_connections (
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on figma_connections (figma_user_id);

create table oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  state text not null unique,
  created_at timestamptz default now()
);

create index on oauth_states (state);
create index on oauth_states (created_at);

create table user_sessions (
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

create index on user_sessions (session_token);
create index on user_sessions (user_id);
-- 00006: Add figma_connections table for Figma OAuth token storage
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists figma_connections_figma_user_id_idx
  on figma_connections (figma_user_id);

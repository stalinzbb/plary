-- 00009: Add plugin_auth_sessions for browser-initiated polling auth
-- Each row is a one-time auth session created by the Figma plugin.
-- The plugin polls until the browser marks the session as ready.

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

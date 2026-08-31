-- 00010: Application-level user session tracking.
-- Each row is one active login session for a user.
-- session_token is an opaque random value stored in an httpOnly cookie.
-- revoked_at is set when the user explicitly signs out.
-- notified_new_login gates the "new login detected" notification.

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

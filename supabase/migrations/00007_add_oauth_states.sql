-- 00007: Add oauth_states table for OAuth CSRF protection
-- States are single-use with a 10-minute TTL (cleaned by the /start endpoint)

create table if not exists oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  state text not null unique,
  created_at timestamptz default now()
);

create index if not exists oauth_states_state_idx on oauth_states (state);
create index if not exists oauth_states_created_at_idx on oauth_states (created_at);

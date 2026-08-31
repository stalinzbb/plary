-- 00014: Per-user cache of team file listings for resolve-file (#52).
-- Same reasoning as 00013: serverless functions share no memory, so the cache
-- lives in the DB we already have. One row per user, replaced wholesale on
-- refresh; team_ids is the snapshot the listing was built from, so registering
-- a new team invalidates the row by mismatch instead of needing a delete hook.

create table if not exists figma_file_cache (
  user_id uuid references auth.users not null primary key,
  team_ids text[] not null,
  files jsonb not null,
  fetched_at timestamptz not null
);

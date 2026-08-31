-- 00012: Per-user plugin token version, for revocation.
-- Plugin JWTs carry a `v` claim = this version at mint time. Verification
-- rejects any token whose `v` no longer matches. Bumping the version
-- (via "Regenerate" in Settings) instantly invalidates every prior token.
-- No row means version 1 (the default) — rows are only written on first revoke.

create table if not exists plugin_token_versions (
  user_id uuid primary key references auth.users on delete cascade,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- Atomically bump a user's token version (first revoke: 1 -> 2). Returns the
-- new version. Avoids a racy read-then-write in app code.
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

-- 00013: Postgres-backed fixed-window rate limiter.
-- Serverless functions share no memory, so limits must live in a shared store.
-- We reuse the existing DB instead of adding Redis. One atomic upsert per check.

create table if not exists rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, identifier, window_start)
);

create index if not exists rate_limits_window_idx on rate_limits (window_start);

-- Atomically increments the current window's counter and returns true if the
-- request is within the limit. Fixed-window: cheap and good enough for abuse
-- control (not precise burst smoothing).
-- ponytail: fixed window, not sliding — swap for a sliding log only if the
-- boundary burst (up to 2x limit across a window edge) ever matters.
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

-- Opportunistic cleanup: callers may prune old windows. Kept simple — old
-- rows are tiny and harmless; a periodic delete can sweep them if needed.

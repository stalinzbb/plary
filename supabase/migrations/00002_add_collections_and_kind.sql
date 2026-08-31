-- Add kind column to distinguish screens from prototypes
alter table prototypes
  add column kind text not null default 'prototype'
  check (kind in ('prototype', 'screen'));

-- Create collections table (personal, per-user)
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

create index on collections (user_id);

-- Enforce unique collection names per user (case-insensitive)
create unique index collections_user_id_name_idx
  on collections (user_id, lower(name));

-- Add collection_id FK to prototypes
alter table prototypes
  add column collection_id uuid references collections(id) on delete set null;

create index on prototypes (collection_id);

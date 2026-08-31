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

-- Backfill existing data
insert into prototype_collections (user_id, prototype_id, collection_id)
  select p.user_id, p.id, p.collection_id
  from prototypes p
  where p.collection_id is not null;

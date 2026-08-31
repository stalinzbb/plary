-- Figma team IDs for file-key resolution (Community plugins can't read figma.fileKey;
-- the server matches the open file's name against team files via the REST API instead)
alter table figma_connections
  add column if not exists team_ids text[] not null default '{}';

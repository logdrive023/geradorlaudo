-- Sessões de login. Guarda só o resumo (SHA-256) do token: se o banco vazar, ninguém entra com ele.
create table if not exists sessoes (
  token_hash bytea primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  expira_em  timestamptz not null
);
create index if not exists sessoes_usuario on sessoes (usuario_id);
alter table sessoes enable row level security;

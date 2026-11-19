-- Gestão de obras. A obra é um documento JSON (etapas, diário de obra, financeiro, compras, laudos ligados):
-- o app edita offline e sincroniza o documento inteiro. As fotos do diário ficam no storage (só a chave aqui).
create table if not exists obras (
  id              uuid primary key,
  organizacao_id  uuid not null references organizacoes(id) on delete cascade,
  usuario_id      uuid not null references usuarios(id),
  nome            text not null,
  status          text not null default 'andamento',
  dados           jsonb not null default '{}',
  link_token      text unique,
  link_financeiro boolean not null default false,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists obras_lista on obras (organizacao_id, atualizado_em desc);

create table if not exists obra_fotos (
  id              uuid primary key,
  obra_id         uuid not null references obras(id) on delete cascade,
  imagem_chave    text not null,
  miniatura_chave text not null,
  bytes           int  not null default 0,
  criado_em       timestamptz not null default now()
);
create index if not exists obra_fotos_obra on obra_fotos (obra_id);

alter table obras      enable row level security;
alter table obra_fotos enable row level security;

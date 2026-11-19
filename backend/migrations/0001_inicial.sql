-- LaudoTech — esquema inicial (Postgres / Supabase).
-- Regra de espaço: o banco NUNCA guarda imagem. Foto, miniatura, logo e assinatura vão para o
-- Supabase Storage (ou R2); aqui fica só a chave (texto curto). Com isso 500 MB de banco
-- comportam centenas de milhares de fotos (cada linha de foto + achados ≈ 1–2 KB).

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists organizacoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  criado_em   timestamptz not null default now()
);

create table if not exists usuarios (
  id               uuid primary key default gen_random_uuid(),
  organizacao_id   uuid not null references organizacoes(id) on delete cascade,
  email            citext not null unique,
  nome             text not null,
  papel            text not null check (papel in ('admin','engenheiro')),
  senha_hash       text not null,               -- argon2id
  profissao        text not null default '',
  registro         text not null default '',    -- CREA/CAU/CRC
  telefone         text not null default '',
  endereco         text not null default '',
  cidade           text not null default '',
  uf               char(2),
  logo_chave       text,                        -- chave no storage
  assinatura_chave text,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);
create index if not exists usuarios_org on usuarios (organizacao_id);

create table if not exists modelos_texto (
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  tipo           text not null,
  objetivo       text,
  metodologia    text,
  normas         text[],
  atualizado_em  timestamptz not null default now(),
  primary key (organizacao_id, tipo)
);

-- prompts da IA editados em Ajustes › Prompts da IA (sem linha = vale o padrão do código)
-- chave: 'analise' | 'conclusao' | 'lia' | 'foco:<tipo>'
create table if not exists prompts (
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  chave          text not null,
  texto          text not null check (length(texto) <= 20000),
  atualizado_por uuid references usuarios(id),
  atualizado_em  timestamptz not null default now(),
  primary key (organizacao_id, chave)
);

create table if not exists laudos (
  id                uuid primary key default gen_random_uuid(),
  organizacao_id    uuid not null references organizacoes(id) on delete cascade,
  usuario_id        uuid not null references usuarios(id),
  tipo              text not null check (tipo in ('cautelar','entrega','locacao','inspecao','extrajudicial',
                                                  'estrutural','reforma','pericia','avaliacao','contabil')),
  titulo            text not null,
  status            text not null default 'rascunho' check (status in ('rascunho','conferencia','concluido')),
  dados             jsonb not null default '{}',
  textos            jsonb not null default '{}',
  conclusao         text not null default '',
  logo_chave        text,
  localizacao_chave text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  excluido_em       timestamptz
);
create index if not exists laudos_lista on laudos (organizacao_id, atualizado_em desc) where excluido_em is null;

create table if not exists fotos (
  id              uuid primary key default gen_random_uuid(),
  laudo_id        uuid not null references laudos(id) on delete cascade,
  ordem           int  not null,
  nome_arquivo    text not null,
  imagem_chave    text not null,                -- WebP 1280 px no storage (~100–180 KB)
  miniatura_chave text not null,                -- WebP 320 px no storage (~10 KB)
  bytes           int  not null default 0,      -- tamanho, para controlar a cota
  largura         int  not null,
  altura          int  not null,
  tirada_em       timestamptz,
  gps             point,
  status          text not null default 'pendente'
                  check (status in ('pendente','analisando','analisada','conferida','erro')),
  ambiente        text,
  elemento        text,
  legenda         text,
  sem_anomalia    boolean,
  qualidade_foto  text check (qualidade_foto in ('boa','regular','ruim')),
  contrato_ia     text,                         -- ex.: analise-foto.v1
  origem_analise  text check (origem_analise in ('gemini','claude','servidor','demo','manual')),
  analisado_em    timestamptz,
  observacao      text,
  erro            text,
  criado_em       timestamptz not null default now()
);
create index if not exists fotos_laudo on fotos (laudo_id, ordem);

create table if not exists achados (
  id             uuid primary key default gen_random_uuid(),
  foto_id        uuid not null references fotos(id) on delete cascade,
  tipo           text not null,
  sistema        text not null,
  descricao      text not null default '',
  gravidade      text not null check (gravidade in ('critico','medio','minimo')),
  prioridade     smallint not null check (prioridade between 1 and 3),
  abertura_mm    numeric(5,2),
  causa_provavel text not null default '',
  recomendacao   text not null default '',
  confianca      real not null check (confianca between 0 and 1),
  regiao         jsonb,                          -- {x,y,w,h} em %
  aceito         boolean,                        -- null = ainda não conferido
  origem         text not null check (origem in ('gemini','claude','servidor','demo','manual'))
);
create index if not exists achados_foto on achados (foto_id);

-- fila de análise (SELECT … FOR UPDATE SKIP LOCKED)
create table if not exists analises_fila (
  foto_id       uuid primary key references fotos(id) on delete cascade,
  tentativas    int not null default 0,
  disponivel_em timestamptz not null default now()
);

-- histórico: quem mudou o quê (importante em perícia). Guarda só o que mudou, não o laudo inteiro.
create table if not exists eventos (
  id         bigserial primary key,
  laudo_id   uuid not null references laudos(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  acao       text not null,
  antes      jsonb,
  depois     jsonb,
  criado_em  timestamptz not null default now()
);
create index if not exists eventos_laudo on eventos (laudo_id, criado_em desc);

-- espaço usado por organização (para avisar antes de estourar a cota do plano)
create or replace view uso_por_organizacao with (security_invoker = true) as
select l.organizacao_id,
       count(distinct l.id)            as laudos,
       count(f.id)                     as fotos,
       coalesce(sum(f.bytes), 0)::bigint as bytes_fotos
from laudos l
left join fotos f on f.laudo_id = l.id
where l.excluido_em is null
group by l.organizacao_id;

-- A API acessa com o usuário dono das tabelas (não é afetada pelo RLS).
-- RLS ligado e sem políticas: se a Data API (PostgREST) do Supabase for ligada, ninguém de fora lê nada.
alter table organizacoes  enable row level security;
alter table usuarios      enable row level security;
alter table modelos_texto enable row level security;
alter table prompts       enable row level security;
alter table laudos        enable row level security;
alter table fotos         enable row level security;
alter table achados       enable row level security;
alter table analises_fila enable row level security;
alter table eventos       enable row level security;

-- controle de versões do esquema
create table if not exists schema_migrations (
  versao      text primary key,
  aplicada_em timestamptz not null default now()
);
alter table schema_migrations enable row level security;
insert into schema_migrations (versao) values ('0001_inicial') on conflict do nothing;

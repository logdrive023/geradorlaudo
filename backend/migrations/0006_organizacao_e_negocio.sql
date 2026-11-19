-- Organização com papéis, entrega ao cliente e base do negócio.
-- Tudo aqui é aditivo: nada que já existe muda de comportamento para quem é admin (o único papel em uso hoje).
-- Desenho completo em docs/ORGANIZACAO.md.

------------------------------------------------------------------------------------------------
-- 1. Papéis: admin (gestor), engenheiro (responsável técnico), assistente (campo)
------------------------------------------------------------------------------------------------
alter table usuarios drop constraint if exists usuarios_papel_check;
alter table usuarios add constraint usuarios_papel_check check (papel in ('admin','engenheiro','assistente'));

alter table organizacoes add column if not exists cnpj      text;
alter table organizacoes add column if not exists config    jsonb not null default '{}'; -- IAs ligadas, padrões da empresa
alter table organizacoes add column if not exists logo_chave text;

-- Quem trabalha em cada laudo/obra além do dono (o admin vê tudo sem precisar estar aqui).
create table if not exists membros (
  alvo_tipo  text not null check (alvo_tipo in ('laudo','obra')),
  alvo_id    uuid not null,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  criado_por uuid references usuarios(id),
  criado_em  timestamptz not null default now(),
  primary key (alvo_tipo, alvo_id, usuario_id)
);
create index if not exists membros_usuario on membros (usuario_id, alvo_tipo);

-- Regra única de visibilidade, usada por todas as consultas: admin vê tudo da organização;
-- os demais veem o que criaram e o que foi atribuído a eles.
create or replace function pode_ver(p_tipo text, p_alvo uuid, p_dono uuid, p_usuario uuid, p_papel text)
returns boolean language sql stable as $fn$
  select p_papel = 'admin' or p_dono = p_usuario
      or exists (select 1 from membros m where m.alvo_tipo = p_tipo and m.alvo_id = p_alvo and m.usuario_id = p_usuario)
$fn$;

-- Convite: o admin gera um link; a pessoa abre e define a própria senha (ninguém mais vê a senha).
create table if not exists convites (
  token_hash     bytea primary key,                -- SHA-256 do token (o token só existe no link)
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  email          citext not null,
  nome           text not null default '',
  papel          text not null check (papel in ('admin','engenheiro','assistente')),
  criado_por     uuid references usuarios(id),
  criado_em      timestamptz not null default now(),
  expira_em      timestamptz not null,
  usado_em       timestamptz
);
create index if not exists convites_org on convites (organizacao_id, criado_em desc);

-- Registro de atividades: o admin vê quem fez o quê (emitiu, apagou, convidou, mudou papel…).
create table if not exists auditoria (
  id             bigserial primary key,
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  usuario_id     uuid references usuarios(id) on delete set null,
  acao           text not null,                    -- ex.: laudo.emitido, usuario.convidado
  alvo_tipo      text,
  alvo_id        text,
  detalhe        jsonb,
  criado_em      timestamptz not null default now()
);
create index if not exists auditoria_org on auditoria (organizacao_id, criado_em desc);

------------------------------------------------------------------------------------------------
-- 2. Laudo: responsável técnico, autenticidade (QR), vistoria de saída ligada à de entrada
------------------------------------------------------------------------------------------------
alter table laudos add column if not exists responsavel_id uuid references usuarios(id); -- quem assina (engenheiro)
alter table laudos add column if not exists codigo         text unique;                  -- código público de verificação (QR)
alter table laudos add column if not exists emitido_em     timestamptz;
alter table laudos add column if not exists hash_conteudo  text;                         -- SHA-256 do conteúdo emitido
alter table laudos add column if not exists referencia_id  uuid references laudos(id) on delete set null; -- saída → entrada

------------------------------------------------------------------------------------------------
-- 3. O cliente pelo link: aceite (assinatura eletrônica simples), comentário, contestação, pedido de reparo
------------------------------------------------------------------------------------------------
create table if not exists respostas_cliente (
  id             uuid primary key default gen_random_uuid(),
  alvo_tipo      text not null check (alvo_tipo in ('laudo','obra')),
  alvo_id        uuid not null,
  tipo           text not null check (tipo in ('aceite','comentario','contestacao','reparo','aprovacao')),
  achado_id      uuid,                              -- quando é sobre um achado
  nome           text not null check (length(nome) between 2 and 120),
  documento      text check (documento is null or length(documento) <= 20), -- CPF/CNPJ opcional
  texto          text check (texto is null or length(texto) <= 4000),
  dados          jsonb,                             -- ex.: itens do pedido de reparo
  hash_conteudo  text,                              -- o que a pessoa viu ao aceitar
  ip_hash        text,                              -- SHA-256 do IP (prova sem guardar o IP)
  agente         text,
  lido_em        timestamptz,
  criado_em      timestamptz not null default now()
);
create index if not exists respostas_alvo on respostas_cliente (alvo_tipo, alvo_id, criado_em desc);

------------------------------------------------------------------------------------------------
-- 4. Biblioteca de textos da organização (o engenheiro reaproveita o que já aprovou)
------------------------------------------------------------------------------------------------
create table if not exists biblioteca_textos (
  id             uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  criado_por     uuid references usuarios(id) on delete set null,
  tipo           text not null,
  sistema        text not null default '',
  gravidade      text not null check (gravidade in ('critico','medio','minimo')),
  descricao      text not null default '' check (length(descricao) <= 2000),
  causa          text not null default '' check (length(causa) <= 2000),
  recomendacao   text not null default '' check (length(recomendacao) <= 2000),
  usos           int  not null default 0,
  atualizado_em  timestamptz not null default now()
);
create index if not exists biblioteca_org on biblioteca_textos (organizacao_id, tipo);

------------------------------------------------------------------------------------------------
-- 5. Agenda de vistorias
------------------------------------------------------------------------------------------------
create table if not exists agendamentos (
  id              uuid primary key default gen_random_uuid(),
  organizacao_id  uuid not null references organizacoes(id) on delete cascade,
  usuario_id      uuid references usuarios(id) on delete set null,    -- quem vai
  cliente_nome    text not null default '',
  cliente_contato text not null default '',
  endereco        text not null default '',
  tipo            text not null default '',
  inicio          timestamptz not null,
  duracao_min     int not null default 60 check (duracao_min between 15 and 1440),
  status          text not null default 'marcado' check (status in ('marcado','feito','cancelado')),
  laudo_id        uuid references laudos(id) on delete set null,
  observacao      text not null default '',
  criado_em       timestamptz not null default now()
);
create index if not exists agenda_org on agendamentos (organizacao_id, inicio);

------------------------------------------------------------------------------------------------
-- 6. Plano e uso (cobrança preparada; liga quando houver gateway, ex.: Asaas)
------------------------------------------------------------------------------------------------
create table if not exists assinaturas (
  organizacao_id        uuid primary key references organizacoes(id) on delete cascade,
  plano                 text not null default 'teste' check (plano in ('teste','gratis','profissional','equipe')),
  status                text not null default 'ativa' check (status in ('ativa','pendente','inadimplente','cancelada')),
  laudos_mes            int  not null default 5,       -- limite do plano (0 = sem limite)
  usuarios_max          int  not null default 1,
  creditos              int  not null default 0,       -- laudos avulsos comprados
  gateway               text,
  gateway_cliente_id    text,
  gateway_assinatura_id text,
  periodo_fim           timestamptz,
  atualizado_em         timestamptz not null default now()
);

create table if not exists uso_ia (
  id             bigserial primary key,
  organizacao_id uuid not null references organizacoes(id) on delete cascade,
  usuario_id     uuid references usuarios(id) on delete set null,
  laudo_id       uuid,
  motor          text not null,
  evento         text not null check (evento in ('analise_foto','conclusao','lia','diario')),
  criado_em      timestamptz not null default now()
);
create index if not exists uso_ia_org on uso_ia (organizacao_id, criado_em desc);

-- Eventos do gateway: o id do evento é a chave (o mesmo aviso duas vezes não conta duas vezes).
create table if not exists pagamentos_eventos (
  id          text primary key,
  gateway     text not null,
  tipo        text not null,
  payload     jsonb not null,
  recebido_em timestamptz not null default now(),
  processado  boolean not null default false
);

------------------------------------------------------------------------------------------------
-- 7. Entradas externas (WhatsApp, e-mail): guarda o que chegou para a Lia organizar depois
------------------------------------------------------------------------------------------------
create table if not exists entradas_externas (
  id             uuid primary key default gen_random_uuid(),
  organizacao_id uuid references organizacoes(id) on delete cascade,
  canal          text not null check (canal in ('whatsapp','email')),
  remetente      text not null,
  tipo           text not null default 'texto',      -- texto, audio, imagem, documento
  texto          text,
  midia_id       text,
  processado     boolean not null default false,
  destino        jsonb,                              -- onde virou registro (obra/diário/compra…)
  recebido_em    timestamptz not null default now()
);
create index if not exists entradas_pendentes on entradas_externas (organizacao_id, processado, recebido_em desc);

-- Todas as tabelas novas ficam fechadas para a API pública do Supabase (só a nossa API acessa).
alter table membros            enable row level security;
alter table convites           enable row level security;
alter table auditoria          enable row level security;
alter table respostas_cliente  enable row level security;
alter table biblioteca_textos  enable row level security;
alter table agendamentos       enable row level security;
alter table assinaturas        enable row level security;
alter table uso_ia             enable row level security;
alter table pagamentos_eventos enable row level security;
alter table entradas_externas  enable row level security;

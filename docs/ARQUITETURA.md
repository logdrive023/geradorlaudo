# Arquitetura — backend Go + Postgres

> O código do backend agora fica no repositório privado **logdrive023/geradorlaudo-backend** (branch `feat/react-vite-ia`). Este documento é o desenho original.

Hoje o LaudoTech roda **só no navegador** (React + IndexedDB/Dexie). Este documento desenha o próximo passo:
uma API em **Go** organizada por **domínio** e um banco **Postgres**. Nada daqui foi criado ainda.

Os nomes batem com o front (`src/dominio/modelo.ts`): `Usuario`, `Laudo`, `Foto`, `Analise`, `Achado`, `ModeloTexto`.

---

## 1. Visão geral

```
navegador (React)  ──HTTPS/JSON──▶  API Go  ──▶  Postgres (dados)
      │                               │
      │  upload direto (URL assinada)  ├──▶  Storage S3/R2 (fotos)
      └──────────────────────────────▶ │
                                      └──▶  Fila (análise) ──▶ Worker Go ──▶ API Anthropic (Claude)
```

- **A chave da IA sai do navegador** e fica só no servidor.
- **Fotos não passam pela API**: o front pede uma URL assinada e envia direto ao storage.
- **Análise assíncrona**: subir a foto enfileira a análise; o worker chama o Claude, grava o resultado e
  avisa o front (SSE ou polling curto). Mantém a mesma sensação de hoje: "mandou, a Lia já analisa".
- **Offline continua possível**: o front mantém o Dexie como cache e fila de envio (padrão do VanAaki).

## 2. Estrutura do projeto Go (por domínio)

```
backend/
  cmd/
    api/main.go            # sobe HTTP
    worker/main.go         # consome a fila de análise
  internal/
    dominio/               # regras puras, sem banco nem HTTP
      laudo/               #   Laudo, Status, TipoLaudo, regras de "pronto para assinar"
      foto/                #   Foto, Analise, Achado, Gravidade, Regiao
      modelo/              #   ModeloTexto (textos padrão por tipo)
      usuario/             #   Usuario, Papel (admin/engenheiro), Organizacao
    aplicacao/             # casos de uso (orquestram domínio + portas)
      criar_laudo.go
      subir_foto.go        #   gera URL assinada + registra a foto
      analisar_foto.go     #   chamado pelo worker
      conferir_foto.go     #   aceita/descarta/edita achados
      gerar_conclusao.go
      gerar_pdf.go
    portas/                # interfaces que o domínio precisa
      repositorios.go      #   LaudoRepo, FotoRepo, UsuarioRepo…
      ia.go                #   AnalisadorDeFotos, Redator
      storage.go, fila.go
    adaptadores/           # implementações concretas
      postgres/            #   sqlc + pgx
      anthropic/           #   SDK Go oficial (anthropic-sdk-go)
      s3/                  #   R2/S3 com URL assinada
      fila/                #   Postgres (SKIP LOCKED) no início; troca por SQS/NATS depois
      http/                #   handlers, middlewares (auth, rate limit, CORS)
  migrations/              # SQL versionado (goose ou golang-migrate)
  sqlc.yaml
```

Regra: `dominio` não importa nada de fora; `aplicacao` só conhece `portas`; `adaptadores` implementam as portas.

## 3. Banco (Postgres)

```sql
-- organizações (escritório/empresa) — base para multi-usuário e cobrança
create table organizacoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  criado_em   timestamptz not null default now()
);

create table usuarios (
  id            uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes(id),
  email         citext not null unique,
  nome          text not null,
  papel         text not null check (papel in ('admin','engenheiro')),
  senha_hash    text not null,              -- argon2id
  profissao     text not null default '',
  registro      text not null default '',   -- CREA/CAU/CRC
  telefone      text not null default '',
  endereco      text not null default '',
  cidade        text not null default '',
  uf            char(2),
  logo_chave    text,                       -- chave no storage
  assinatura_chave text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

create table modelos_texto (                 -- Ajustes › Modelos (por organização)
  organizacao_id uuid not null references organizacoes(id),
  tipo          text not null,
  objetivo      text,
  metodologia   text,
  normas        text[],
  atualizado_em timestamptz not null default now(),
  primary key (organizacao_id, tipo)
);

create table laudos (
  id            uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes(id),
  usuario_id    uuid not null references usuarios(id),     -- responsável técnico
  tipo          text not null check (tipo in ('cautelar','entrega','locacao','inspecao','extrajudicial',
                                              'estrutural','reforma','pericia','avaliacao','contabil')),
  titulo        text not null,
  status        text not null default 'rascunho' check (status in ('rascunho','conferencia','concluido')),
  dados         jsonb not null default '{}',   -- campos do padrão do tipo (src/dominio/tipos.ts)
  textos        jsonb not null default '{}',   -- objetivo/metodologia só deste laudo
  conclusao     text not null default '',
  logo_chave    text,
  localizacao_chave text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  excluido_em   timestamptz                      -- exclusão lógica (dá para desfazer)
);
create index on laudos (organizacao_id, atualizado_em desc) where excluido_em is null;
create index on laudos using gin (dados jsonb_path_ops);

create table fotos (
  id            uuid primary key default gen_random_uuid(),
  laudo_id      uuid not null references laudos(id) on delete cascade,
  ordem         int  not null,
  nome_arquivo  text not null,
  imagem_chave  text not null,                -- 1600 px
  miniatura_chave text not null,              -- 360 px
  largura       int not null,
  altura        int not null,
  tirada_em     timestamptz,                  -- EXIF
  gps           point,                        -- EXIF (lng, lat)
  status        text not null default 'pendente'
                check (status in ('pendente','analisando','analisada','conferida','erro')),
  ambiente      text, elemento text, legenda text,
  sem_anomalia  boolean,
  origem_analise text check (origem_analise in ('claude','manual')),
  analisado_em  timestamptz,
  observacao    text,
  erro          text,
  criado_em     timestamptz not null default now(),
  unique (laudo_id, ordem) deferrable initially deferred
);

create table achados (
  id            uuid primary key default gen_random_uuid(),
  foto_id       uuid not null references fotos(id) on delete cascade,
  tipo          text not null,
  sistema       text not null,
  descricao     text not null default '',
  gravidade     text not null check (gravidade in ('critico','medio','minimo')),
  causa_provavel text not null default '',
  recomendacao  text not null default '',
  confianca     real not null check (confianca between 0 and 1),
  regiao        jsonb,                         -- {x,y,w,h} em %
  aceito        boolean,                       -- null = não conferido
  origem        text not null check (origem in ('claude','manual'))
);
create index on achados (foto_id);

-- fila de análise (Postgres no início: SELECT … FOR UPDATE SKIP LOCKED)
create table analises_fila (
  foto_id       uuid primary key references fotos(id) on delete cascade,
  tentativas    int not null default 0,
  disponivel_em timestamptz not null default now()
);

-- histórico: quem mudou o quê (importante em perícia)
create table eventos (
  id            bigserial primary key,
  laudo_id      uuid not null references laudos(id) on delete cascade,
  usuario_id    uuid references usuarios(id),
  acao          text not null,                -- 'achado_aceito', 'texto_editado_a4', 'status' …
  antes         jsonb, depois jsonb,
  criado_em     timestamptz not null default now()
);
```

Por que `dados jsonb`: cada um dos 10 tipos tem campos diferentes e o padrão muda com o tempo. O formulário
é gerado de `tipos.ts`; o servidor valida com o mesmo esquema (copiado para Go ou gerado a partir dele).

## 4. API (REST, JSON)

| Método | Rota | O que faz |
|---|---|---|
| POST | `/auth/entrar` · `/auth/sair` · `/auth/cadastro` | sessão em cookie httpOnly |
| GET/PATCH | `/eu` | perfil do responsável técnico |
| GET | `/laudos?tipo=&status=&busca=` | painel |
| POST | `/laudos` | novo laudo |
| GET/PATCH/DELETE | `/laudos/{id}` | dados, textos, conclusão, status |
| POST | `/laudos/{id}/duplicar` | duplica com fotos |
| POST | `/laudos/{id}/fotos` | devolve URLs assinadas para upload; cria as fotos e enfileira a análise |
| PATCH | `/fotos/{id}` | ordem, legenda, observação, confirmar conferência |
| POST | `/fotos/{id}/reanalisar` | volta para a fila |
| POST/PATCH/DELETE | `/fotos/{id}/achados[/{aid}]` | aceitar, descartar, editar, marcar região |
| GET | `/laudos/{id}/eventos` (SSE) | progresso da análise ao vivo |
| POST | `/laudos/{id}/conclusao` | a Lia redige a conclusão |
| GET | `/laudos/{id}/pdf` | PDF gerado no servidor (Chromium headless com o mesmo HTML) |
| GET/PUT | `/modelos/{tipo}` | Ajustes › Modelos |
| GET/POST/PATCH | `/usuarios` | só admin |
| POST | `/lia/perguntar` | chat de ajuda (com contexto do laudo) |

## 5. IA no servidor

- Modelo `claude-opus-5-5`, saída estruturada (mesmo esquema de `src/ia/claude.ts`), `fallbacks: "default"`.
- Limite por organização (tokens/mês) e por minuto; custo gravado por análise em `eventos`.
- Prompt e esquema versionados; cada análise grava a versão usada (dá para comparar depois).
- Nunca marca nada como aceito: a IA só sugere; o aceite é sempre do engenheiro (registrado em `eventos`).

## 6. Segurança e LGPD

- Senhas com **argon2id**; sessão em cookie `HttpOnly; Secure; SameSite=Lax`; CSRF por token.
- Toda consulta filtra por `organizacao_id` (um escritório nunca vê o outro); admin vê a organização toda.
- Fotos em bucket privado, só por URL assinada de curta duração.
- Fotos podem mostrar pessoas e placas: opção de borrar rostos antes de enviar para a IA (fase 2).
- Exclusão lógica + rotina que apaga de vez após o prazo combinado.

## 7. Migração do navegador para o servidor

O backup do front (`Ajustes › Dados › Exportar`) já tem laudos + fotos em JSON. A primeira versão da API
aceita esse arquivo em `POST /importar`, então ninguém perde o que testou no navegador.

## 8. Ordem sugerida

1. Auth + usuários + organizações.
2. Laudos e fotos (upload assinado) com o front lendo da API e o Dexie como cache.
3. Fila + worker de análise com Claude.
4. PDF no servidor, eventos/auditoria, limites de uso.
5. Cobrança e planos.

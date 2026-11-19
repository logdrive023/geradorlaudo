-- Várias IAs na mesma foto: cada achado guarda qual IA o escreveu e a foto guarda o resumo de cada IA
-- (legenda, ambiente, elemento ou erro), para a pessoa comparar e escolher na conferência.
alter table achados add column if not exists ia text check (ia is null or ia ~ '^[a-z0-9-]{1,20}$');
alter table fotos   add column if not exists analises_ia jsonb;

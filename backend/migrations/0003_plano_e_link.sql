-- Plano de ação: cada achado ganha acompanhamento (status, prazo, responsável, custo estimado).
alter table achados add column if not exists acompanhamento jsonb;

-- Link do cliente: quem tem o link vê o laudo (só leitura). Sem link = ninguém de fora vê.
alter table laudos add column if not exists link_token text unique;
alter table laudos add column if not exists link_criado_em timestamptz;

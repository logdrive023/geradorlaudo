-- Versão de cada laudo e obra: quem salva diz em qual versão se baseou. Se outra pessoa salvou antes,
-- o servidor recusa (412) em vez de sobrescrever, e o app junta ou guarda uma cópia. Nada se perde.
alter table laudos add column if not exists versao int not null default 1;
alter table obras  add column if not exists versao int not null default 1;

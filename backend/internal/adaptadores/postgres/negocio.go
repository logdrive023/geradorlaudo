package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

// Implementa portas.Negocio (organização com papéis, cliente pelo link, autenticidade, agenda, uso).

var _ portas.Negocio = (*Banco)(nil)

// ---------- organização ----------

func (b *Banco) Organizacao(ctx context.Context, u conta.Usuario) (portas.Organizacao, portas.Assinatura, portas.Uso, error) {
	var o portas.Organizacao
	var cnpj *string
	err := b.pool.QueryRow(ctx, `select id::text, nome, cnpj, config from organizacoes where id = $1`, u.OrganizacaoID).
		Scan(&o.ID, &o.Nome, &cnpj, &o.Config)
	if err != nil {
		return o, portas.Assinatura{}, portas.Uso{}, traduzir(err)
	}
	o.CNPJ = val(cnpj)

	a := portas.Assinatura{Plano: "teste", Status: "ativa", LaudosMes: 5, UsuariosMax: 1}
	err = b.pool.QueryRow(ctx, `select plano, status, laudos_mes, usuarios_max, creditos, periodo_fim from assinaturas where organizacao_id = $1`,
		u.OrganizacaoID).Scan(&a.Plano, &a.Status, &a.LaudosMes, &a.UsuariosMax, &a.Creditos, &a.PeriodoFim)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return o, a, portas.Uso{}, traduzir(err)
	}

	uso := portas.Uso{PorMotor: map[string]int{}}
	_ = b.pool.QueryRow(ctx, `select
			(select count(*) from laudos where organizacao_id = $1 and criado_em >= date_trunc('month', now())),
			(select count(*) from usuarios where organizacao_id = $1 and ativo)`, u.OrganizacaoID).Scan(&uso.LaudosMes, &uso.Usuarios)
	rows, err := b.pool.Query(ctx, `select motor, count(*) from uso_ia where organizacao_id = $1 and evento = 'analise_foto'
		and criado_em >= date_trunc('month', now()) group by motor`, u.OrganizacaoID)
	if err == nil {
		for rows.Next() {
			var m string
			var n int
			if rows.Scan(&m, &n) == nil {
				uso.PorMotor[m] = n
				uso.AnalisesIA += n
			}
		}
		rows.Close()
	}
	return o, a, uso, nil
}

func (b *Banco) SalvarOrganizacao(ctx context.Context, u conta.Usuario, nome, cnpj string, config json.RawMessage) error {
	if len(config) == 0 {
		config = json.RawMessage(`{}`)
	}
	_, err := b.pool.Exec(ctx, `update organizacoes set nome = $2, cnpj = nullif($3, ''), config = $4 where id = $1`,
		u.OrganizacaoID, nome, cnpj, []byte(config))
	return traduzir(err)
}

func (b *Banco) ListarUsuarios(ctx context.Context, u conta.Usuario) ([]conta.Usuario, error) {
	rows, err := b.pool.Query(ctx, `select `+colsUsuario+` from usuarios u where u.organizacao_id = $1 order by u.ativo desc, u.nome`, u.OrganizacaoID)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []conta.Usuario{}
	for rows.Next() {
		x, err := lerUsuario(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, x)
	}
	return out, rows.Err()
}

// AlterarUsuario muda papel e/ou ativo. A organização nunca fica sem um admin ativo.
func (b *Banco) AlterarUsuario(ctx context.Context, u conta.Usuario, id string, papel *string, ativo *bool) error {
	tx, err := b.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var atual string
	var estaAtivo bool
	if err := tx.QueryRow(ctx, `select papel, ativo from usuarios where id = $1 and organizacao_id = $2 for update`, id, u.OrganizacaoID).
		Scan(&atual, &estaAtivo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return laudo.ErrNaoEncontrado
		}
		return traduzir(err)
	}
	novoPapel, novoAtivo := atual, estaAtivo
	if papel != nil {
		novoPapel = *papel
	}
	if ativo != nil {
		novoAtivo = *ativo
	}
	if atual == "admin" && estaAtivo && (novoPapel != "admin" || !novoAtivo) {
		var outros int
		_ = tx.QueryRow(ctx, `select count(*) from usuarios where organizacao_id = $1 and papel = 'admin' and ativo and id <> $2`,
			u.OrganizacaoID, id).Scan(&outros)
		if outros == 0 {
			return &portas.ErroDados{Mensagem: "A organização precisa de pelo menos um administrador ativo."}
		}
	}
	if _, err := tx.Exec(ctx, `update usuarios set papel = $2, ativo = $3 where id = $1`, id, novoPapel, novoAtivo); err != nil {
		return traduzir(err)
	}
	if !novoAtivo { // desativado sai na hora de todos os aparelhos
		if _, err := tx.Exec(ctx, `delete from sessoes where usuario_id = $1`, id); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ---------- convites ----------

func (b *Banco) CriarConvite(ctx context.Context, u conta.Usuario, c portas.Convite, resumo []byte) error {
	var existe bool
	_ = b.pool.QueryRow(ctx, `select exists(select 1 from usuarios where email = $1)`, c.Email).Scan(&existe)
	if existe {
		return &portas.ErroDados{Mensagem: "Já existe uma conta com este e-mail."}
	}
	_, err := b.pool.Exec(ctx, `insert into convites (token_hash, organizacao_id, email, nome, papel, criado_por, expira_em)
		values ($1, $2, $3, $4, $5, $6, $7)`, resumo, u.OrganizacaoID, c.Email, c.Nome, c.Papel, u.ID, c.ExpiraEm)
	return traduzir(err)
}

func (b *Banco) ListarConvites(ctx context.Context, u conta.Usuario) ([]portas.Convite, error) {
	rows, err := b.pool.Query(ctx, `select email::text, nome, papel, criado_em, expira_em, usado_em is null and expira_em > now()
		from convites where organizacao_id = $1 order by criado_em desc limit 100`, u.OrganizacaoID)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.Convite{}
	for rows.Next() {
		var c portas.Convite
		if err := rows.Scan(&c.Email, &c.Nome, &c.Papel, &c.CriadoEm, &c.ExpiraEm, &c.Pendente); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (b *Banco) LerConvite(ctx context.Context, resumo []byte) (portas.Convite, error) {
	var c portas.Convite
	err := b.pool.QueryRow(ctx, `select c.email::text, c.nome, c.papel, o.nome, c.criado_em, c.expira_em from convites c
		join organizacoes o on o.id = c.organizacao_id where c.token_hash = $1 and c.usado_em is null and c.expira_em > now()`, resumo).
		Scan(&c.Email, &c.Nome, &c.Papel, &c.OrgNome, &c.CriadoEm, &c.ExpiraEm)
	if errors.Is(err, pgx.ErrNoRows) {
		return c, laudo.ErrNaoEncontrado
	}
	c.Pendente = err == nil
	return c, traduzir(err)
}

// AceitarConvite cria a conta com a senha que a própria pessoa escolheu e queima o convite.
func (b *Banco) AceitarConvite(ctx context.Context, resumo []byte, nome, senhaHash string) (conta.Usuario, error) {
	tx, err := b.pool.Begin(ctx)
	if err != nil {
		return conta.Usuario{}, err
	}
	defer tx.Rollback(ctx)
	var org, email, papel, nomeConvite string
	err = tx.QueryRow(ctx, `select organizacao_id::text, email::text, papel, nome from convites
		where token_hash = $1 and usado_em is null and expira_em > now() for update`, resumo).Scan(&org, &email, &papel, &nomeConvite)
	if errors.Is(err, pgx.ErrNoRows) {
		return conta.Usuario{}, laudo.ErrNaoEncontrado
	}
	if err != nil {
		return conta.Usuario{}, traduzir(err)
	}
	if strings.TrimSpace(nome) == "" {
		nome = nomeConvite
	}
	var id string
	if err := tx.QueryRow(ctx, `insert into usuarios (organizacao_id, email, nome, papel, senha_hash) values ($1, $2, $3, $4, $5) returning id::text`,
		org, email, nome, papel, senhaHash).Scan(&id); err != nil {
		return conta.Usuario{}, traduzir(err)
	}
	if _, err := tx.Exec(ctx, `update convites set usado_em = now() where token_hash = $1`, resumo); err != nil {
		return conta.Usuario{}, err
	}
	if _, err := tx.Exec(ctx, `insert into auditoria (organizacao_id, usuario_id, acao, alvo_tipo, alvo_id) values ($1, $2::uuid, 'usuario.entrou', 'usuario', $3::text)`,
		org, id, id); err != nil {
		return conta.Usuario{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return conta.Usuario{}, err
	}
	return lerUsuario(b.pool.QueryRow(ctx, `select `+colsUsuario+` from usuarios u where u.id = $1`, id))
}

// ---------- membros (atribuição) ----------

func alvoValido(tipo string) (tabela string, ok bool) {
	switch tipo {
	case "laudo":
		return "laudos", true
	case "obra":
		return "obras", true
	}
	return "", false
}

// podeVerAlvo confere se o usuário enxerga o laudo/obra e devolve quem criou.
func (b *Banco) podeVerAlvo(ctx context.Context, u conta.Usuario, tipo, id string) (dono string, err error) {
	tabela, ok := alvoValido(tipo)
	if !ok {
		return "", laudo.ErrNaoEncontrado
	}
	var ve bool
	err = b.pool.QueryRow(ctx, `select usuario_id::text, pode_ver($1, id, usuario_id, $3::uuid, $4) from `+tabela+`
		where id = $2 and organizacao_id = $5`, tipo, id, u.ID, string(u.Papel), u.OrganizacaoID).Scan(&dono, &ve)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !ve) {
		return "", laudo.ErrNaoEncontrado
	}
	return dono, traduzir(err)
}

func (b *Banco) Membros(ctx context.Context, u conta.Usuario, tipo, id string) ([]portas.Membro, error) {
	if _, err := b.podeVerAlvo(ctx, u, tipo, id); err != nil {
		return nil, err
	}
	rows, err := b.pool.Query(ctx, `select u.id::text, u.nome, u.papel from membros m join usuarios u on u.id = m.usuario_id
		where m.alvo_tipo = $1 and m.alvo_id = $2 order by u.nome`, tipo, id)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.Membro{}
	for rows.Next() {
		var m portas.Membro
		if err := rows.Scan(&m.UsuarioID, &m.Nome, &m.Papel); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

// DefinirMembros troca a lista de pessoas do laudo/obra. Admin em qualquer um; engenheiro só nos que criou.
func (b *Banco) DefinirMembros(ctx context.Context, u conta.Usuario, tipo, id string, usuarios []string) error {
	dono, err := b.podeVerAlvo(ctx, u, tipo, id)
	if err != nil {
		return err
	}
	if u.Papel != conta.Admin && dono != u.ID {
		return &portas.ErroDados{Mensagem: "Só o administrador ou quem criou pode mudar a equipe."}
	}
	tx, err := b.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `delete from membros where alvo_tipo = $1 and alvo_id = $2`, tipo, id); err != nil {
		return err
	}
	for _, uid := range usuarios {
		tag, err := tx.Exec(ctx, `insert into membros (alvo_tipo, alvo_id, usuario_id, criado_por)
			select $1, $2, id, $4 from usuarios where id = $3 and organizacao_id = $5 and ativo on conflict do nothing`,
			tipo, id, uid, u.ID, u.OrganizacaoID)
		if err != nil {
			return traduzir(err)
		}
		if tag.RowsAffected() == 0 {
			return &portas.ErroDados{Mensagem: "Pessoa não encontrada na organização."}
		}
	}
	return tx.Commit(ctx)
}

// ---------- auditoria ----------

// Auditar grava sem travar quem chamou (falha só vai para o log).
func (b *Banco) Auditar(ctx context.Context, u conta.Usuario, acao, alvoTipo, alvoID string, detalhe any) {
	var d []byte
	if detalhe != nil {
		d, _ = json.Marshal(detalhe)
	}
	if _, err := b.pool.Exec(ctx, `insert into auditoria (organizacao_id, usuario_id, acao, alvo_tipo, alvo_id, detalhe)
		values ($1, $2, $3, nullif($4, ''), nullif($5, ''), $6)`, u.OrganizacaoID, u.ID, acao, alvoTipo, alvoID, d); err != nil {
		slog.Warn("auditoria não gravou", "acao", acao, "erro", err)
	}
}

func (b *Banco) Auditoria(ctx context.Context, u conta.Usuario, limite int) ([]portas.EventoAuditoria, error) {
	if limite <= 0 || limite > 500 {
		limite = 200
	}
	rows, err := b.pool.Query(ctx, `select a.id, coalesce(a.usuario_id::text, ''), coalesce(us.nome, ''), a.acao, coalesce(a.alvo_tipo, ''),
			coalesce(a.alvo_id, ''), a.detalhe, a.criado_em
		from auditoria a left join usuarios us on us.id = a.usuario_id
		where a.organizacao_id = $1 order by a.criado_em desc limit $2`, u.OrganizacaoID, limite)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.EventoAuditoria{}
	for rows.Next() {
		var e portas.EventoAuditoria
		if err := rows.Scan(&e.ID, &e.UsuarioID, &e.Nome, &e.Acao, &e.AlvoTipo, &e.AlvoID, &e.Detalhe, &e.CriadoEm); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// ---------- cliente pelo link ----------

func (b *Banco) ResponderPorLink(ctx context.Context, tipo, token string, r portas.RespostaCliente) (portas.RespostaCliente, error) {
	tabela, ok := alvoValido(tipo)
	if !ok {
		return r, laudo.ErrNaoEncontrado
	}
	extra := ""
	if tipo == "laudo" {
		extra = " and excluido_em is null"
	}
	var alvo, org string
	err := b.pool.QueryRow(ctx, `select id::text, organizacao_id::text from `+tabela+` where link_token = $1`+extra, token).Scan(&alvo, &org)
	if errors.Is(err, pgx.ErrNoRows) {
		return r, laudo.ErrNaoEncontrado
	}
	if err != nil {
		return r, traduzir(err)
	}
	r.AlvoTipo, r.AlvoID = tipo, alvo
	err = b.pool.QueryRow(ctx, `insert into respostas_cliente (alvo_tipo, alvo_id, tipo, achado_id, nome, documento, texto, dados, hash_conteudo, ip_hash, agente)
		values ($1, $2, $3, nullif($4, '')::uuid, $5, nullif($6, ''), nullif($7, ''), $8, nullif($9, ''), $10, $11) returning id::text, criado_em`,
		tipo, alvo, r.Tipo, r.AchadoID, r.Nome, r.Documento, r.Texto, jsonOuNulo(r.Dados), r.HashConteudo, r.IPHash, r.Agente).Scan(&r.ID, &r.CriadoEm)
	if err != nil {
		return r, traduzir(err)
	}
	_, _ = b.pool.Exec(ctx, `insert into auditoria (organizacao_id, acao, alvo_tipo, alvo_id, detalhe) values ($1, $2, $3, $4, $5)`,
		org, "cliente."+r.Tipo, tipo, alvo, []byte(`{"nome":`+string(mustJSON(r.Nome))+`}`))
	return r, nil
}

func mustJSON(v any) []byte { b, _ := json.Marshal(v); return b }

func (b *Banco) Respostas(ctx context.Context, u conta.Usuario, tipo, id string) ([]portas.RespostaCliente, error) {
	if _, err := b.podeVerAlvo(ctx, u, tipo, id); err != nil {
		return nil, err
	}
	rows, err := b.pool.Query(ctx, `select id::text, alvo_tipo, alvo_id::text, tipo, coalesce(achado_id::text, ''), nome, coalesce(documento, ''),
			coalesce(texto, ''), dados, coalesce(hash_conteudo, ''), lido_em is not null, criado_em
		from respostas_cliente where alvo_tipo = $1 and alvo_id = $2 order by criado_em desc limit 300`, tipo, id)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.RespostaCliente{}
	for rows.Next() {
		var r portas.RespostaCliente
		if err := rows.Scan(&r.ID, &r.AlvoTipo, &r.AlvoID, &r.Tipo, &r.AchadoID, &r.Nome, &r.Documento, &r.Texto, &r.Dados, &r.HashConteudo, &r.Lido, &r.CriadoEm); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	_, _ = b.pool.Exec(ctx, `update respostas_cliente set lido_em = now() where alvo_tipo = $1 and alvo_id = $2 and lido_em is null`, tipo, id)
	return out, nil
}

// ---------- autenticidade ----------

func (b *Banco) Emitir(ctx context.Context, u conta.Usuario, laudoID, hash, codigoNovo string) (portas.Emissao, error) {
	var e portas.Emissao
	err := b.pool.QueryRow(ctx, `update laudos set codigo = coalesce(codigo, $3), emitido_em = now(), hash_conteudo = $4, responsavel_id = $5::uuid
		where id = $1 and organizacao_id = $2 and excluido_em is null and pode_ver('laudo', id, usuario_id, $5::uuid, $6)
		returning codigo, emitido_em`, laudoID, u.OrganizacaoID, codigoNovo, hash, u.ID, string(u.Papel)).Scan(&e.Codigo, &e.EmitidoEm)
	if errors.Is(err, pgx.ErrNoRows) {
		return e, laudo.ErrNaoEncontrado
	}
	e.HashConteudo = hash
	return e, traduzir(err)
}

func (b *Banco) Verificar(ctx context.Context, codigo string) (portas.Verificacao, error) {
	var v portas.Verificacao
	err := b.pool.QueryRow(ctx, `select l.codigo, l.titulo, l.tipo, l.emitido_em, coalesce(l.hash_conteudo, ''), u.nome, u.registro, o.nome
		from laudos l join usuarios u on u.id = coalesce(l.responsavel_id, l.usuario_id) join organizacoes o on o.id = l.organizacao_id
		where l.codigo = $1 and l.emitido_em is not null and l.excluido_em is null`, codigo).
		Scan(&v.Codigo, &v.Titulo, &v.Tipo, &v.EmitidoEm, &v.HashConteudo, &v.Responsavel, &v.Registro, &v.Organizacao)
	if errors.Is(err, pgx.ErrNoRows) {
		return v, laudo.ErrNaoEncontrado
	}
	return v, traduzir(err)
}

// ---------- biblioteca de textos ----------

func (b *Banco) Biblioteca(ctx context.Context, u conta.Usuario) ([]portas.TextoBiblioteca, error) {
	rows, err := b.pool.Query(ctx, `select id::text, tipo, sistema, gravidade, descricao, causa, recomendacao, usos, atualizado_em
		from biblioteca_textos where organizacao_id = $1 order by usos desc, atualizado_em desc limit 1000`, u.OrganizacaoID)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.TextoBiblioteca{}
	for rows.Next() {
		var t portas.TextoBiblioteca
		if err := rows.Scan(&t.ID, &t.Tipo, &t.Sistema, &t.Gravidade, &t.Descricao, &t.Causa, &t.Recomendacao, &t.Usos, &t.AtualizadoEm); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (b *Banco) SalvarTexto(ctx context.Context, u conta.Usuario, t portas.TextoBiblioteca) (portas.TextoBiblioteca, error) {
	err := b.pool.QueryRow(ctx, `insert into biblioteca_textos (id, organizacao_id, criado_por, tipo, sistema, gravidade, descricao, causa, recomendacao, usos)
		values (coalesce(nullif($1, '')::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10)
		on conflict (id) do update set tipo = excluded.tipo, sistema = excluded.sistema, gravidade = excluded.gravidade,
			descricao = excluded.descricao, causa = excluded.causa, recomendacao = excluded.recomendacao, usos = excluded.usos, atualizado_em = now()
		where biblioteca_textos.organizacao_id = excluded.organizacao_id
		returning id::text, atualizado_em`, t.ID, u.OrganizacaoID, u.ID, t.Tipo, t.Sistema, t.Gravidade, t.Descricao, t.Causa, t.Recomendacao, t.Usos).
		Scan(&t.ID, &t.AtualizadoEm)
	if errors.Is(err, pgx.ErrNoRows) {
		return t, laudo.ErrNaoEncontrado
	}
	return t, traduzir(err)
}

func (b *Banco) ApagarTexto(ctx context.Context, u conta.Usuario, id string) error {
	_, err := b.pool.Exec(ctx, `delete from biblioteca_textos where id = $1 and organizacao_id = $2`, id, u.OrganizacaoID)
	return traduzir(err)
}

// ---------- agenda ----------

// Agenda: o admin vê a de todos; os demais, só a própria.
func (b *Banco) Agenda(ctx context.Context, u conta.Usuario, de, ate time.Time) ([]portas.Agendamento, error) {
	rows, err := b.pool.Query(ctx, `select id::text, coalesce(usuario_id::text, ''), cliente_nome, cliente_contato, endereco, tipo, inicio, duracao_min,
			status, coalesce(laudo_id::text, ''), observacao
		from agendamentos where organizacao_id = $1 and inicio >= $2 and inicio < $3 and ($4 = 'admin' or usuario_id = $5::uuid)
		order by inicio limit 500`, u.OrganizacaoID, de, ate, string(u.Papel), u.ID)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []portas.Agendamento{}
	for rows.Next() {
		var a portas.Agendamento
		if err := rows.Scan(&a.ID, &a.UsuarioID, &a.ClienteNome, &a.ClienteContato, &a.Endereco, &a.Tipo, &a.Inicio, &a.DuracaoMin,
			&a.Status, &a.LaudoID, &a.Observacao); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (b *Banco) SalvarAgendamento(ctx context.Context, u conta.Usuario, a portas.Agendamento) (portas.Agendamento, error) {
	if u.Papel != conta.Admin || a.UsuarioID == "" {
		a.UsuarioID = u.ID // só o admin marca para outra pessoa
	}
	err := b.pool.QueryRow(ctx, `insert into agendamentos (id, organizacao_id, usuario_id, cliente_nome, cliente_contato, endereco, tipo, inicio,
			duracao_min, status, laudo_id, observacao)
		select coalesce(nullif($1, '')::uuid, gen_random_uuid()), $2, us.id, $4, $5, $6, $7, $8, $9, $10, nullif($11, '')::uuid, $12
		from usuarios us where us.id = $3::uuid and us.organizacao_id = $2
		on conflict (id) do update set usuario_id = excluded.usuario_id, cliente_nome = excluded.cliente_nome,
			cliente_contato = excluded.cliente_contato, endereco = excluded.endereco, tipo = excluded.tipo, inicio = excluded.inicio,
			duracao_min = excluded.duracao_min, status = excluded.status, laudo_id = excluded.laudo_id, observacao = excluded.observacao
		where agendamentos.organizacao_id = excluded.organizacao_id
		returning id::text`, a.ID, u.OrganizacaoID, a.UsuarioID, a.ClienteNome, a.ClienteContato, a.Endereco, a.Tipo, a.Inicio,
		a.DuracaoMin, a.Status, a.LaudoID, a.Observacao).Scan(&a.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		return a, laudo.ErrNaoEncontrado
	}
	return a, traduzir(err)
}

func (b *Banco) ApagarAgendamento(ctx context.Context, u conta.Usuario, id string) error {
	_, err := b.pool.Exec(ctx, `delete from agendamentos where id = $1 and organizacao_id = $2 and ($3 = 'admin' or usuario_id = $4::uuid)`,
		id, u.OrganizacaoID, string(u.Papel), u.ID)
	return traduzir(err)
}

// ---------- uso e entradas externas ----------

func (b *Banco) RegistrarUso(ctx context.Context, u conta.Usuario, laudoID, motor, evento string) {
	if _, err := b.pool.Exec(ctx, `insert into uso_ia (organizacao_id, usuario_id, laudo_id, motor, evento) values ($1, $2, nullif($3, '')::uuid, $4, $5)`,
		u.OrganizacaoID, u.ID, laudoID, motor, evento); err != nil {
		slog.Warn("uso de IA não gravou", "erro", err)
	}
}

// GuardarEventoPagamento grava o aviso do gateway uma vez só (o mesmo id repetido é ignorado).
func (b *Banco) GuardarEventoPagamento(ctx context.Context, id, gateway, tipo string, payload json.RawMessage) (bool, error) {
	tag, err := b.pool.Exec(ctx, `insert into pagamentos_eventos (id, gateway, tipo, payload) values ($1, $2, $3, $4) on conflict (id) do nothing`,
		id, gateway, tipo, []byte(payload))
	if err != nil {
		return false, traduzir(err)
	}
	return tag.RowsAffected() == 1, nil
}

func (b *Banco) GuardarEntrada(ctx context.Context, canal, remetente, tipo, texto, midiaID string) error {
	_, err := b.pool.Exec(ctx, `insert into entradas_externas (canal, remetente, tipo, texto, midia_id) values ($1, $2, $3, nullif($4, ''), nullif($5, ''))`,
		canal, remetente, tipo, texto, midiaID)
	return traduzir(err)
}

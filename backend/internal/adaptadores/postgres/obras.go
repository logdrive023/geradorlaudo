package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/obra"
)

// Gestão de obras: a obra é um documento JSON (etapas, diário, financeiro, compras); as fotos do diário
// ficam no storage e aqui só a chave.

const colsObra = `id::text, nome, status, dados, usuario_id::text, criado_em, atualizado_em`

func lerObra(r pgx.Row) (obra.Registro, error) {
	var o obra.Registro
	var criado, atualizado time.Time
	var dados []byte
	if err := r.Scan(&o.ID, &o.Nome, &o.Status, &dados, &o.UsuarioID, &criado, &atualizado); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return o, laudo.ErrNaoEncontrado
		}
		return o, traduzir(err)
	}
	o.Dados, o.CriadoEm, o.AtualizadoEm = dados, ms(criado), ms(atualizado)
	return o, nil
}

func (b *Banco) ListarObras(ctx context.Context, u conta.Usuario) ([]obra.Registro, error) {
	rows, err := b.pool.Query(ctx, `select `+colsObra+` from obras where organizacao_id = $1 order by atualizado_em desc limit 300`, u.OrganizacaoID)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	out := []obra.Registro{}
	for rows.Next() {
		o, err := lerObra(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

func (b *Banco) SalvarObra(ctx context.Context, u conta.Usuario, o obra.Registro) error {
	tag, err := b.pool.Exec(ctx, `insert into obras (id, organizacao_id, usuario_id, nome, status, dados, criado_em, atualizado_em)
		values ($1, $2, $3, $4, $5, $6, $7, $8)
		on conflict (id) do update set nome = excluded.nome, status = excluded.status, dados = excluded.dados, atualizado_em = excluded.atualizado_em
		where obras.organizacao_id = excluded.organizacao_id`,
		o.ID, u.OrganizacaoID, u.ID, o.Nome, o.Status, []byte(o.Dados), data(o.CriadoEm), data(o.AtualizadoEm))
	if err != nil {
		return traduzir(err)
	}
	if tag.RowsAffected() == 0 {
		return laudo.ErrNaoEncontrado
	}
	return nil
}

// ApagarObra apaga a obra e devolve as chaves das fotos para limpar o storage.
func (b *Banco) ApagarObra(ctx context.Context, u conta.Usuario, id string) ([]string, error) {
	chaves, err := b.chaves(ctx, `select f.imagem_chave, f.miniatura_chave from obra_fotos f join obras o on o.id = f.obra_id
		where o.id = $1 and o.organizacao_id = $2`, id, u.OrganizacaoID)
	if err != nil {
		return nil, err
	}
	if _, err := b.pool.Exec(ctx, `delete from obras where id = $1 and organizacao_id = $2`, id, u.OrganizacaoID); err != nil {
		return nil, traduzir(err)
	}
	return chaves, nil
}

type consulta interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

// obraDaOrg confere se a obra existe e é da organização do usuário.
func obraDaOrg(ctx context.Context, q consulta, u conta.Usuario, obraID string) error {
	var org string
	err := q.QueryRow(ctx, `select organizacao_id::text from obras where id = $1`, obraID).Scan(&org)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && org != u.OrganizacaoID) {
		return laudo.ErrNaoEncontrado
	}
	return traduzir(err)
}

func (b *Banco) ChavesFotoObra(ctx context.Context, u conta.Usuario, obraID, fotoID string) (string, string, error) {
	var img, mini string
	err := b.pool.QueryRow(ctx, `select f.imagem_chave, f.miniatura_chave from obra_fotos f join obras o on o.id = f.obra_id
		where f.id = $1 and o.id = $2 and o.organizacao_id = $3`, fotoID, obraID, u.OrganizacaoID).Scan(&img, &mini)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", nil
	}
	return img, mini, traduzir(err)
}

func (b *Banco) ContarFotosObra(ctx context.Context, u conta.Usuario, obraID string) (int, error) {
	if err := obraDaOrg(ctx, b.pool, u, obraID); err != nil {
		return 0, err
	}
	var n int
	err := b.pool.QueryRow(ctx, `select count(*) from obra_fotos where obra_id = $1`, obraID).Scan(&n)
	return n, traduzir(err)
}

func (b *Banco) SalvarFotoObra(ctx context.Context, u conta.Usuario, obraID, fotoID, imagem, miniatura string, bytes int) error {
	tx, err := b.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var org string
	if err := tx.QueryRow(ctx, `select organizacao_id::text from obras where id = $1 for update`, obraID).Scan(&org); err != nil || org != u.OrganizacaoID {
		return laudo.ErrNaoEncontrado
	}
	var n int
	if err := tx.QueryRow(ctx, `select count(*) from obra_fotos where obra_id = $1 and id <> $2`, obraID, fotoID).Scan(&n); err != nil {
		return traduzir(err)
	}
	if n >= obra.MaxFotosObra {
		return obra.ErrLimiteFotos
	}
	if _, err := tx.Exec(ctx, `insert into obra_fotos (id, obra_id, imagem_chave, miniatura_chave, bytes) values ($1, $2, $3, $4, $5)
		on conflict (id) do update set imagem_chave = excluded.imagem_chave, miniatura_chave = excluded.miniatura_chave, bytes = excluded.bytes
		where obra_fotos.obra_id = excluded.obra_id`, fotoID, obraID, imagem, miniatura, bytes); err != nil {
		return traduzir(err)
	}
	return tx.Commit(ctx)
}

func (b *Banco) ApagarFotoObra(ctx context.Context, u conta.Usuario, obraID, fotoID string) ([]string, error) {
	img, mini, err := b.ChavesFotoObra(ctx, u, obraID, fotoID)
	if err != nil || img == "" {
		return nil, err
	}
	if _, err := b.pool.Exec(ctx, `delete from obra_fotos where id = $1 and obra_id = $2`, fotoID, obraID); err != nil {
		return nil, traduzir(err)
	}
	return []string{img, mini}, nil
}

// ---------- link do cliente da obra ----------

func (b *Banco) CriarLinkObra(ctx context.Context, u conta.Usuario, id, novo string, financeiro bool) (string, error) {
	var token string
	err := b.pool.QueryRow(ctx, `update obras set link_token = coalesce(link_token, $3), link_financeiro = $4
		where id = $1 and organizacao_id = $2 returning link_token`, id, u.OrganizacaoID, novo, financeiro).Scan(&token)
	return token, traduzir(err)
}

func (b *Banco) ApagarLinkObra(ctx context.Context, u conta.Usuario, id string) error {
	_, err := b.pool.Exec(ctx, `update obras set link_token = null, link_financeiro = false where id = $1 and organizacao_id = $2`, id, u.OrganizacaoID)
	return traduzir(err)
}

func (b *Banco) ObraPublica(ctx context.Context, token string) (obra.Registro, bool, []string, conta.Usuario, error) {
	var fin bool
	var autor conta.Usuario
	var o obra.Registro
	var criado, atualizado time.Time
	var dados []byte
	err := b.pool.QueryRow(ctx, `select `+colsObra+`, link_financeiro from obras where link_token = $1`, token).
		Scan(&o.ID, &o.Nome, &o.Status, &dados, &o.UsuarioID, &criado, &atualizado, &fin)
	if errors.Is(err, pgx.ErrNoRows) {
		return o, false, nil, autor, laudo.ErrNaoEncontrado
	}
	if err != nil {
		return o, false, nil, autor, traduzir(err)
	}
	o.Dados, o.CriadoEm, o.AtualizadoEm = dados, ms(criado), ms(atualizado)
	_ = b.pool.QueryRow(ctx, `select nome, profissao, registro, telefone, cidade, coalesce(uf,'') from usuarios where id = $1`, o.UsuarioID).
		Scan(&autor.Nome, &autor.Profissao, &autor.Registro, &autor.Telefone, &autor.Cidade, &autor.UF)
	rows, err := b.pool.Query(ctx, `select id::text from obra_fotos where obra_id = $1`, o.ID)
	if err != nil {
		return o, fin, nil, autor, traduzir(err)
	}
	defer rows.Close()
	fotos := []string{}
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			fotos = append(fotos, id)
		}
	}
	return o, fin, fotos, autor, rows.Err()
}

func (b *Banco) ChavesFotoObraPublica(ctx context.Context, token, fotoID string) (string, string, error) {
	var img, mini string
	err := b.pool.QueryRow(ctx, `select f.imagem_chave, f.miniatura_chave from obra_fotos f join obras o on o.id = f.obra_id
		where o.link_token = $1 and f.id = $2`, token, fotoID).Scan(&img, &mini)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", laudo.ErrNaoEncontrado
	}
	return img, mini, traduzir(err)
}

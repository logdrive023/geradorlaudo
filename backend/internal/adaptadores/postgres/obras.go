package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/obra"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

// Gestão de obras: a obra é um documento JSON (etapas, diário, financeiro, compras); as fotos do diário
// ficam no storage e aqui só a chave.

const colsObra = `id::text, nome, status, dados, usuario_id::text, criado_em, atualizado_em, versao`

func lerObra(r pgx.Row) (obra.Registro, error) {
	var o obra.Registro
	var criado, atualizado time.Time
	var dados []byte
	if err := r.Scan(&o.ID, &o.Nome, &o.Status, &dados, &o.UsuarioID, &criado, &atualizado, &o.Versao); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return o, laudo.ErrNaoEncontrado
		}
		return o, traduzir(err)
	}
	o.Dados, o.CriadoEm, o.AtualizadoEm = dados, ms(criado), ms(atualizado)
	return o, nil
}

func (b *Banco) ListarObras(ctx context.Context, u conta.Usuario) ([]obra.Registro, error) {
	rows, err := b.pool.Query(ctx, `select `+colsObra+` from obras where organizacao_id = $1 and pode_ver('obra', id, usuario_id, $2::uuid, $3)
		order by atualizado_em desc limit 2000`, u.OrganizacaoID, u.ID, string(u.Papel))
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
		if !conta.Pode(u.Papel, conta.VerFinanceiro) { // assistente de campo: sem dinheiro
			o.Dados = obra.SemFinanceiro(o.Dados)
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

func (b *Banco) SalvarObra(ctx context.Context, u conta.Usuario, o obra.Registro) (int, error) {
	if !conta.Pode(u.Papel, conta.VerFinanceiro) { // o assistente não vê o financeiro: o que já está no servidor fica
		var antigo []byte
		if err := b.pool.QueryRow(ctx, `select dados from obras where id = $1 and organizacao_id = $2`, o.ID, u.OrganizacaoID).Scan(&antigo); err == nil {
			o.Dados = obra.ManterFinanceiro(o.Dados, antigo)
		}
	}
	var versao int
	err := b.pool.QueryRow(ctx, `insert into obras (id, organizacao_id, usuario_id, nome, status, dados, criado_em, atualizado_em)
		values ($1, $2, $3, $4, $5, $6, $7, $8)
		on conflict (id) do update set nome = excluded.nome, status = excluded.status, dados = excluded.dados, atualizado_em = excluded.atualizado_em,
			versao = obras.versao + 1
		where obras.organizacao_id = excluded.organizacao_id and pode_ver('obra', obras.id, obras.usuario_id, $3::uuid, $9)
			and ($10::int = 0 or obras.versao = $10::int)
		returning versao`,
		o.ID, u.OrganizacaoID, u.ID, o.Nome, o.Status, []byte(o.Dados), data(o.CriadoEm), data(o.AtualizadoEm), string(u.Papel), o.Versao).Scan(&versao)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, b.porQueNaoGravou(ctx, u, "obras", "obra", o.ID)
	}
	if err != nil {
		return 0, traduzir(err)
	}
	return versao, nil
}

// ApagarObra apaga a obra e devolve as chaves das fotos para limpar o storage.
func (b *Banco) ApagarObra(ctx context.Context, u conta.Usuario, id string) ([]string, error) {
	chaves, err := b.chaves(ctx, `select f.imagem_chave, f.miniatura_chave from obra_fotos f join obras o on o.id = f.obra_id
		where o.id = $1 and o.organizacao_id = $2 and ($3 = 'admin' or o.usuario_id = $4::uuid)`, id, u.OrganizacaoID, string(u.Papel), u.ID)
	if err != nil {
		return nil, err
	}
	tag, err := b.pool.Exec(ctx, `delete from obras where id = $1 and organizacao_id = $2 and ($3 = 'admin' or usuario_id = $4::uuid)`,
		id, u.OrganizacaoID, string(u.Papel), u.ID)
	if err != nil {
		return nil, traduzir(err)
	}
	if tag.RowsAffected() == 0 {
		var existe bool
		_ = b.pool.QueryRow(ctx, `select exists(select 1 from obras where id = $1 and organizacao_id = $2)`, id, u.OrganizacaoID).Scan(&existe)
		if existe { // existe, mas não é sua: avisa em vez de fingir que apagou
			return nil, &portas.ErroDados{Mensagem: "Só o administrador ou quem criou pode apagar esta obra."}
		}
	}
	return chaves, nil
}

type consulta interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

// obraDaOrg confere se a obra existe e é da organização do usuário.
func obraDaOrg(ctx context.Context, q consulta, u conta.Usuario, obraID string) error {
	var org string
	var ve bool
	err := q.QueryRow(ctx, `select organizacao_id::text, pode_ver('obra', id, usuario_id, $2::uuid, $3) from obras where id = $1`,
		obraID, u.ID, string(u.Papel)).Scan(&org, &ve)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && (org != u.OrganizacaoID || !ve)) {
		return laudo.ErrNaoEncontrado
	}
	return traduzir(err)
}

func (b *Banco) ChavesFotoObra(ctx context.Context, u conta.Usuario, obraID, fotoID string) (string, string, error) {
	var img, mini string
	err := b.pool.QueryRow(ctx, `select f.imagem_chave, f.miniatura_chave from obra_fotos f join obras o on o.id = f.obra_id
		where f.id = $1 and o.id = $2 and o.organizacao_id = $3 and pode_ver('obra', o.id, o.usuario_id, $4::uuid, $5)`,
		fotoID, obraID, u.OrganizacaoID, u.ID, string(u.Papel)).Scan(&img, &mini)
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
	var ve bool
	if err := tx.QueryRow(ctx, `select organizacao_id::text, pode_ver('obra', id, usuario_id, $2::uuid, $3) from obras where id = $1 for update`,
		obraID, u.ID, string(u.Papel)).Scan(&org, &ve); err != nil || org != u.OrganizacaoID || !ve {
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
		where id = $1 and organizacao_id = $2 and pode_ver('obra', id, usuario_id, $5::uuid, $6) returning link_token`,
		id, u.OrganizacaoID, novo, financeiro, u.ID, string(u.Papel)).Scan(&token)
	return token, traduzir(err)
}

func (b *Banco) ApagarLinkObra(ctx context.Context, u conta.Usuario, id string) error {
	_, err := b.pool.Exec(ctx, `update obras set link_token = null, link_financeiro = false
		where id = $1 and organizacao_id = $2 and pode_ver('obra', id, usuario_id, $3::uuid, $4)`, id, u.OrganizacaoID, u.ID, string(u.Papel))
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

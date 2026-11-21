// Package postgres implementa portas.Banco com pgx (Supabase via session pooler, porta 5432).
package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
	"github.com/logdrive023/geradorlaudo/backend/migrations"
)

type Banco struct {
	pool      *pgxpool.Pool
	auditoria bool // registro de atividades: desligado por padrão para não ocupar espaço
}

// LigarAuditoria liga o registro de atividades (AUDITORIA=ligada).
func (b *Banco) LigarAuditoria(ligada bool) { b.auditoria = ligada }

// Abrir conecta e aplica as migrations que faltam.
func Abrir(ctx context.Context, url string) (*Banco, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		// nunca repassa o erro do driver: ele repete o endereço, com a senha
		return nil, errors.New("DATABASE_URL inválida (formato: postgresql://usuario:senha@host:5432/postgres?sslmode=require — sem colchetes; caracteres especiais da senha em %XX)")
	}
	cfg.MaxConns = 5 // plano grátis: poucas conexões
	cfg.MaxConnIdleTime = 5 * time.Minute
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	b := &Banco{pool: pool}
	c, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	if err := pool.Ping(c); err != nil {
		pool.Close()
		return nil, fmt.Errorf("banco não respondeu: %w", err)
	}
	if err := b.migrar(c); err != nil {
		pool.Close()
		return nil, err
	}
	return b, nil
}

func (b *Banco) Fechar()                        { b.pool.Close() }
func (b *Banco) Ping(ctx context.Context) error { return b.pool.Ping(ctx) }

func (b *Banco) migrar(ctx context.Context) error {
	ms, err := migrations.Todas()
	if err != nil {
		return err
	}
	conn, err := b.pool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()
	pg := conn.Conn().PgConn()
	if _, err := pg.Exec(ctx, `create table if not exists schema_migrations (versao text primary key, aplicada_em timestamptz not null default now())`).ReadAll(); err != nil {
		return err
	}
	for _, m := range ms {
		var ja bool
		if err := conn.QueryRow(ctx, `select exists(select 1 from schema_migrations where versao = $1)`, m.Versao).Scan(&ja); err != nil {
			return err
		}
		if ja {
			continue
		}
		// protocolo simples: aceita vários comandos no mesmo arquivo; tudo numa transação
		sql := "begin;\n" + m.SQL + "\ninsert into schema_migrations (versao) values ('" + m.Versao + "') on conflict do nothing;\ncommit;"
		if _, err := pg.Exec(ctx, sql).ReadAll(); err != nil {
			_, _ = pg.Exec(ctx, "rollback").ReadAll()
			return fmt.Errorf("migration %s: %w", m.Versao, err)
		}
		slog.Info("migration aplicada", "versao", m.Versao)
	}
	return nil
}

// ---------- contas e sessões ----------

const colsUsuario = `u.id::text, u.organizacao_id::text, u.email::text, u.nome, u.papel, u.profissao, u.registro, u.telefone, u.endereco, u.cidade, coalesce(u.uf,''), u.ativo`

func lerUsuario(r pgx.Row, extra ...any) (conta.Usuario, error) {
	var u conta.Usuario
	var papel string
	dest := append([]any{&u.ID, &u.OrganizacaoID, &u.Email, &u.Nome, &papel, &u.Profissao, &u.Registro, &u.Telefone, &u.Endereco, &u.Cidade, &u.UF, &u.Ativo}, extra...)
	if err := r.Scan(dest...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return u, laudo.ErrNaoEncontrado
		}
		return u, err
	}
	u.Papel = conta.Papel(papel)
	return u, nil
}

func (b *Banco) UsuarioPorEmail(ctx context.Context, email string) (conta.Usuario, string, error) {
	var hash string
	u, err := lerUsuario(b.pool.QueryRow(ctx, `select `+colsUsuario+`, u.senha_hash from usuarios u where u.email = $1`, email), &hash)
	return u, hash, err
}

func (b *Banco) CriarSessao(ctx context.Context, usuarioID string, resumo []byte, expira time.Time) error {
	// aproveita para limpar sessões vencidas
	_, _ = b.pool.Exec(ctx, `delete from sessoes where expira_em < now()`)
	_, err := b.pool.Exec(ctx, `insert into sessoes (token_hash, usuario_id, expira_em) values ($1, $2, $3)`, resumo, usuarioID, expira)
	return err
}

func (b *Banco) UsuarioDaSessao(ctx context.Context, resumo []byte) (conta.Usuario, error) {
	return lerUsuario(b.pool.QueryRow(ctx, `select `+colsUsuario+` from sessoes s join usuarios u on u.id = s.usuario_id
		where s.token_hash = $1 and s.expira_em > now() and u.ativo`, resumo))
}

func (b *Banco) ApagarSessao(ctx context.Context, resumo []byte) error {
	_, err := b.pool.Exec(ctx, `delete from sessoes where token_hash = $1`, resumo)
	return err
}

// ---------- laudos ----------

func ms(t time.Time) int64 { return t.UnixMilli() }
func data(v int64) time.Time {
	if v <= 0 {
		return time.Now()
	}
	return time.UnixMilli(v)
}

func (b *Banco) ListarLaudos(ctx context.Context, u conta.Usuario) ([]laudo.Registro, error) {
	rows, err := b.pool.Query(ctx, `select l.id::text, l.tipo, l.titulo, l.status, l.dados, l.textos, l.conclusao, l.usuario_id::text,
			l.criado_em, l.atualizado_em, l.versao, (select count(*) from fotos f where f.laudo_id = l.id)
		from laudos l where l.organizacao_id = $1 and l.excluido_em is null and pode_ver('laudo', l.id, l.usuario_id, $2::uuid, $3)
		order by l.atualizado_em desc limit 5000`, u.OrganizacaoID, u.ID, string(u.Papel))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []laudo.Registro{}
	for rows.Next() {
		r, err := lerLaudo(rows, true)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func lerLaudo(r pgx.Row, comContagem bool) (laudo.Registro, error) {
	var l laudo.Registro
	var tipo string
	var dados, textos []byte
	var criado, atualizado time.Time
	dest := []any{&l.ID, &tipo, &l.Titulo, &l.Status, &dados, &textos, &l.Conclusao, &l.UsuarioID, &criado, &atualizado, &l.Versao}
	if comContagem {
		dest = append(dest, &l.Fotos)
	}
	if err := r.Scan(dest...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return l, laudo.ErrNaoEncontrado
		}
		return l, err
	}
	l.Tipo = laudo.TipoLaudo(tipo)
	l.CriadoEm, l.AtualizadoEm = ms(criado), ms(atualizado)
	_ = json.Unmarshal(dados, &l.Dados)
	if len(textos) > 2 {
		l.Textos = &laudo.Textos{}
		_ = json.Unmarshal(textos, l.Textos)
	}
	return l, nil
}

func (b *Banco) SalvarLaudo(ctx context.Context, u conta.Usuario, l laudo.Registro) (int, error) {
	dados, _ := json.Marshal(l.Dados)
	textos := []byte("{}")
	if l.Textos != nil {
		textos, _ = json.Marshal(l.Textos)
	}
	// só grava se o app partiu da versão atual (ou é app antigo, versão 0); cada gravação sobe a versão
	var versao int
	err := b.pool.QueryRow(ctx, `insert into laudos (id, organizacao_id, usuario_id, tipo, titulo, status, dados, textos, conclusao, criado_em, atualizado_em)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		on conflict (id) do update set tipo = excluded.tipo, titulo = excluded.titulo, status = excluded.status, dados = excluded.dados,
			textos = excluded.textos, conclusao = excluded.conclusao, atualizado_em = excluded.atualizado_em, excluido_em = null,
			versao = laudos.versao + 1
		where laudos.organizacao_id = excluded.organizacao_id and pode_ver('laudo', laudos.id, laudos.usuario_id, $3::uuid, $12)
			and ($13::int = 0 or laudos.versao = $13::int)
			and (laudos.status <> 'concluido' or $12 <> 'assistente')
		returning versao`,
		l.ID, u.OrganizacaoID, u.ID, string(l.Tipo), l.Titulo, l.Status, dados, textos, l.Conclusao, data(l.CriadoEm), data(l.AtualizadoEm), string(u.Papel), l.Versao).Scan(&versao)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, b.porQueNaoGravou(ctx, u, "laudos", "laudo", l.ID)
	}
	if err != nil {
		return 0, traduzir(err)
	}
	return versao, nil
}

// porQueNaoGravou: a gravação não passou. Se o registro existe e a pessoa enxerga, foi versão velha (conflito).
func (b *Banco) porQueNaoGravou(ctx context.Context, u conta.Usuario, tabela, tipo, id string) error {
	var ve bool
	var status string
	err := b.pool.QueryRow(ctx, `select pode_ver($1, id, usuario_id, $3::uuid, $4), status from `+tabela+` where id = $2 and organizacao_id = $5`,
		tipo, id, u.ID, string(u.Papel), u.OrganizacaoID).Scan(&ve, &status)
	if err == nil && ve {
		if tabela == "laudos" && status == "concluido" && u.Papel == conta.Assistente {
			return laudo.ErrConcluido
		}
		return laudo.ErrConflito
	}
	return laudo.ErrNaoEncontrado
}

func (b *Banco) LerLaudo(ctx context.Context, u conta.Usuario, id string) (laudo.Registro, []laudo.FotoRegistro, error) {
	l, err := lerLaudo(b.pool.QueryRow(ctx, `select id::text, tipo, titulo, status, dados, textos, conclusao, usuario_id::text, criado_em, atualizado_em, versao
		from laudos where id = $1 and organizacao_id = $2 and excluido_em is null and pode_ver('laudo', id, usuario_id, $3::uuid, $4)`,
		id, u.OrganizacaoID, u.ID, string(u.Papel)), false)
	if err != nil {
		return l, nil, traduzir(err)
	}
	fotos, err := b.fotosDoLaudo(ctx, id)
	return l, fotos, err
}

// fotosDoLaudo lê as fotos com análise e achados (sem conferir dono: quem chama já conferiu).
func (b *Banco) fotosDoLaudo(ctx context.Context, id string) ([]laudo.FotoRegistro, error) {
	rows, err := b.pool.Query(ctx, `select id::text, ordem, nome_arquivo, largura, altura, tirada_em, gps[0], gps[1], status,
			ambiente, elemento, legenda, sem_anomalia, qualidade_foto, contrato_ia, origem_analise, analisado_em, observacao, erro, criado_em, analises_ia
		from fotos where laudo_id = $1 order by ordem`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	fotos := []laudo.FotoRegistro{}
	idx := map[string]int{}
	for rows.Next() {
		var f laudo.FotoRegistro
		var tirada, analisado *time.Time
		var lng, lat *float64
		var amb, elem, leg, qual, contrato, origem, obs, erro *string
		var sem *bool
		var criado time.Time
		var porIA []byte
		if err := rows.Scan(&f.ID, &f.Ordem, &f.NomeArquivo, &f.Largura, &f.Altura, &tirada, &lng, &lat, &f.Status,
			&amb, &elem, &leg, &sem, &qual, &contrato, &origem, &analisado, &obs, &erro, &criado, &porIA); err != nil {
			return nil, err
		}
		f.LaudoID, f.CriadoEm = id, ms(criado)
		if tirada != nil {
			v := ms(*tirada)
			f.TiradaEm = &v
		}
		if lat != nil && lng != nil {
			f.GPS = &laudo.GPS{Lat: *lat, Lng: *lng}
		}
		f.Observacao, f.Erro = val(obs), val(erro)
		if analisado != nil {
			f.Analise = &laudo.AnaliseSalva{Ambiente: val(amb), Elemento: val(elem), Legenda: val(leg), SemAnomalia: sem != nil && *sem,
				QualidadeFoto: val(qual), Contrato: val(contrato), Origem: val(origem), AnalisadoEm: ms(*analisado), Achados: []laudo.AchadoSalvo{}, PorIA: porIA}
		}
		idx[f.ID] = len(fotos)
		fotos = append(fotos, f)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	ach, err := b.pool.Query(ctx, `select a.foto_id::text, a.id::text, a.tipo, a.sistema, a.descricao, a.gravidade, a.abertura_mm::float8,
			a.causa_provavel, a.recomendacao, a.confianca, a.regiao, a.aceito, a.origem, a.acompanhamento, coalesce(a.ia, '')
		from achados a join fotos f on f.id = a.foto_id where f.laudo_id = $1 order by a.prioridade, a.id`, id)
	if err != nil {
		return nil, err
	}
	defer ach.Close()
	for ach.Next() {
		var fotoID string
		var a laudo.AchadoSalvo
		var regiao []byte
		var conf float32
		if err := ach.Scan(&fotoID, &a.ID, &a.Tipo, &a.Sistema, &a.Descricao, &a.Gravidade, &a.AberturaMm,
			&a.CausaProvavel, &a.Recomendacao, &conf, &regiao, &a.Aceito, &a.Origem, &a.Acompanhamento, &a.IA); err != nil {
			return nil, err
		}
		a.Confianca = float64(conf)
		if len(regiao) > 0 {
			a.Regiao = &laudo.Regiao{}
			_ = json.Unmarshal(regiao, a.Regiao)
		}
		if i, ok := idx[fotoID]; ok && fotos[i].Analise != nil {
			fotos[i].Analise.Achados = append(fotos[i].Analise.Achados, a)
		}
	}
	return fotos, ach.Err()
}

func (b *Banco) ApagarLaudo(ctx context.Context, u conta.Usuario, id string) ([]string, error) {
	chaves, err := b.chaves(ctx, `select f.imagem_chave, f.miniatura_chave from fotos f join laudos l on l.id = f.laudo_id
		where l.id = $1 and l.organizacao_id = $2 and ($3 = 'admin' or l.usuario_id = $4::uuid)`, id, u.OrganizacaoID, string(u.Papel), u.ID)
	if err != nil {
		return nil, err
	}
	tag, err := b.pool.Exec(ctx, `delete from laudos where id = $1 and organizacao_id = $2 and ($3 = 'admin' or usuario_id = $4::uuid)`,
		id, u.OrganizacaoID, string(u.Papel), u.ID)
	if err != nil {
		return nil, traduzir(err)
	}
	if tag.RowsAffected() == 0 {
		var existe bool
		_ = b.pool.QueryRow(ctx, `select exists(select 1 from laudos where id = $1 and organizacao_id = $2)`, id, u.OrganizacaoID).Scan(&existe)
		if existe { // existe, mas não é seu: avisa em vez de fingir que apagou
			return nil, &portas.ErroDados{Mensagem: "Só o administrador ou quem criou pode apagar este laudo."}
		}
		return nil, laudo.ErrNaoEncontrado
	}
	return chaves, nil
}

func (b *Banco) chaves(ctx context.Context, sql string, args ...any) ([]string, error) {
	rows, err := b.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, traduzir(err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var a, m string
		if err := rows.Scan(&a, &m); err != nil {
			return nil, err
		}
		out = append(out, a, m)
	}
	return out, rows.Err()
}

// ---------- fotos ----------

func (b *Banco) ChavesDaFoto(ctx context.Context, u conta.Usuario, laudoID, fotoID string) (string, string, error) {
	var img, mini string
	err := b.pool.QueryRow(ctx, `select f.imagem_chave, f.miniatura_chave from fotos f join laudos l on l.id = f.laudo_id
		where f.id = $1 and l.id = $2 and l.organizacao_id = $3 and pode_ver('laudo', l.id, l.usuario_id, $4::uuid, $5)`,
		fotoID, laudoID, u.OrganizacaoID, u.ID, string(u.Papel)).Scan(&img, &mini)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", nil
	}
	return img, mini, traduzir(err)
}

func (b *Banco) SalvarFoto(ctx context.Context, u conta.Usuario, f laudo.FotoRegistro, imagem, miniatura string, bytes int) error {
	tx, err := b.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// trava o laudo: duas fotos chegando juntas não furam o limite
	var dono, status string
	var ve bool
	if err := tx.QueryRow(ctx, `select organizacao_id::text, pode_ver('laudo', id, usuario_id, $2::uuid, $3), status from laudos
		where id = $1 and excluido_em is null for update`, f.LaudoID, u.ID, string(u.Papel)).Scan(&dono, &ve, &status); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return laudo.ErrNaoEncontrado
		}
		return traduzir(err)
	}
	if dono != u.OrganizacaoID || !ve {
		return laudo.ErrNaoEncontrado
	}
	if status == "concluido" && !conta.Pode(u.Papel, conta.EmitirLaudo) {
		return laudo.ErrConcluido
	}
	var existe bool
	var outras int
	if err := tx.QueryRow(ctx, `select exists(select 1 from fotos where id = $1 and laudo_id = $2),
		(select count(*) from fotos where laudo_id = $2 and id <> $1)`, f.ID, f.LaudoID).Scan(&existe, &outras); err != nil {
		return traduzir(err)
	}
	if !existe {
		if outras >= laudo.MaxFotosPorLaudo {
			return laudo.ErrLimiteFotos
		}
		if imagem == "" || miniatura == "" {
			return laudo.ErrPrecisaImagem
		}
	}

	var tirada *time.Time
	if f.TiradaEm != nil {
		t := time.UnixMilli(*f.TiradaEm)
		tirada = &t
	}
	var gps *string
	if f.GPS != nil {
		s := fmt.Sprintf("(%f,%f)", f.GPS.Lng, f.GPS.Lat)
		gps = &s
	}
	var amb, elem, leg, qual, contrato, origem *string
	var sem *bool
	var analisado *time.Time
	if a := f.Analise; a != nil {
		amb, elem, leg, contrato, origem = &a.Ambiente, &a.Elemento, &a.Legenda, nulo(a.Contrato), &a.Origem
		qual = nulo(a.QualidadeFoto)
		sem = &a.SemAnomalia
		t := data(a.AnalisadoEm)
		analisado = &t
	}
	tag, err := tx.Exec(ctx, `insert into fotos (id, laudo_id, ordem, nome_arquivo, imagem_chave, miniatura_chave, bytes, largura, altura,
			tirada_em, gps, status, ambiente, elemento, legenda, sem_anomalia, qualidade_foto, contrato_ia, origem_analise, analisado_em,
			observacao, erro, criado_em)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::point, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		on conflict (id) do update set ordem = excluded.ordem, nome_arquivo = excluded.nome_arquivo,
			imagem_chave = case when $5 = '' then fotos.imagem_chave else excluded.imagem_chave end,
			miniatura_chave = case when $6 = '' then fotos.miniatura_chave else excluded.miniatura_chave end,
			bytes = case when $5 = '' then fotos.bytes else excluded.bytes end,
			largura = excluded.largura, altura = excluded.altura, tirada_em = excluded.tirada_em, gps = excluded.gps,
			status = excluded.status, ambiente = excluded.ambiente, elemento = excluded.elemento, legenda = excluded.legenda,
			sem_anomalia = excluded.sem_anomalia, qualidade_foto = excluded.qualidade_foto, contrato_ia = excluded.contrato_ia,
			origem_analise = excluded.origem_analise, analisado_em = excluded.analisado_em, observacao = excluded.observacao, erro = excluded.erro
		where fotos.laudo_id = excluded.laudo_id`,
		f.ID, f.LaudoID, f.Ordem, f.NomeArquivo, imagem, miniatura, bytes, f.Largura, f.Altura,
		tirada, gps, f.Status, amb, elem, leg, sem, qual, contrato, origem, analisado, nulo(f.Observacao), nulo(f.Erro), data(f.CriadoEm))
	if err != nil {
		return traduzir(err)
	}
	if tag.RowsAffected() == 0 { // o id é de uma foto de outro laudo: não mexe nos achados dela
		return laudo.ErrNaoEncontrado
	}

	var porIA any
	if f.Analise != nil {
		porIA = jsonOuNulo(f.Analise.PorIA)
	}
	if _, err := tx.Exec(ctx, `update fotos set analises_ia = $2 where id = $1`, f.ID, porIA); err != nil {
		return traduzir(err)
	}

	// achados: troca todos (a conferência mexe em vários de uma vez)
	if _, err := tx.Exec(ctx, `delete from achados where foto_id = $1`, f.ID); err != nil {
		return err
	}
	if f.Analise != nil {
		for _, a := range f.Analise.Achados {
			var regiao []byte
			if a.Regiao != nil {
				regiao, _ = json.Marshal(a.Regiao)
			}
			_, err := tx.Exec(ctx, `insert into achados (id, foto_id, tipo, sistema, descricao, gravidade, prioridade, abertura_mm,
					causa_provavel, recomendacao, confianca, regiao, aceito, origem, acompanhamento, ia)
				values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, nullif($16, ''))`,
				uuidOuNulo(a.ID), f.ID, a.Tipo, a.Sistema, a.Descricao, a.Gravidade, laudo.PrioridadeDe(a.Gravidade), a.AberturaMm,
				a.CausaProvavel, a.Recomendacao, a.Confianca, regiao, a.Aceito, a.Origem, jsonOuNulo(a.Acompanhamento), a.IA)
			if err != nil {
				return traduzir(err)
			}
		}
	}
	if _, err := tx.Exec(ctx, `update laudos set atualizado_em = greatest(atualizado_em, now()) where id = $1`, f.LaudoID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (b *Banco) ApagarFoto(ctx context.Context, u conta.Usuario, laudoID, fotoID string) ([]string, error) {
	img, mini, err := b.ChavesDaFoto(ctx, u, laudoID, fotoID)
	if err != nil {
		return nil, err
	}
	if img == "" {
		return nil, nil // já não existe
	}
	if !conta.Pode(u.Papel, conta.EmitirLaudo) {
		var status string
		if err := b.pool.QueryRow(ctx, `select status from laudos where id = $1`, laudoID).Scan(&status); err == nil && status == "concluido" {
			return nil, laudo.ErrConcluido
		}
	}
	if _, err := b.pool.Exec(ctx, `delete from fotos where id = $1 and laudo_id = $2`, fotoID, laudoID); err != nil {
		return nil, traduzir(err)
	}
	return []string{img, mini}, nil
}

// ---------- utilidades ----------

func val(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func nulo(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func uuidOuNulo(s string) *string {
	if len(s) != 36 || s[8] != '-' || s[13] != '-' || s[18] != '-' || s[23] != '-' {
		return nil
	}
	return &s
}

// uuidOuNuloTexto: "" quando não parece um uuid (o banco recusaria e a contagem se perderia).
func uuidOuNuloTexto(s string) string {
	if uuidOuNulo(s) == nil {
		return ""
	}
	return s
}

func traduzir(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return laudo.ErrNaoEncontrado
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) {
		switch pg.Code {
		case "22P02": // uuid ou valor mal formado
			return &portas.ErroDados{Mensagem: "Identificador inválido."}
		case "23505": // registro repetido (ex.: e-mail já cadastrado ou convidado)
			return &portas.ErroDados{Mensagem: "Isso já existe (registro repetido)."}
		case "23514", "23502", "22001", "22003":
			return &portas.ErroDados{Mensagem: "Dados inválidos: " + pg.ConstraintName + pg.ColumnName}
		}
	}
	return err
}

// jsonOuNulo: JSON vazio vira NULL no banco.
func jsonOuNulo(b json.RawMessage) any {
	if len(b) == 0 || string(b) == "null" {
		return nil
	}
	return []byte(b)
}

// ---------- link do cliente (só leitura) ----------

// CriarLink devolve o link do laudo (cria na 1ª vez; depois devolve o mesmo).
func (b *Banco) CriarLink(ctx context.Context, u conta.Usuario, id, novo string) (string, error) {
	var token string
	err := b.pool.QueryRow(ctx, `update laudos set link_token = coalesce(link_token, $3), link_criado_em = coalesce(link_criado_em, now())
		where id = $1 and organizacao_id = $2 and excluido_em is null and pode_ver('laudo', id, usuario_id, $4::uuid, $5)
		returning link_token`, id, u.OrganizacaoID, novo, u.ID, string(u.Papel)).Scan(&token)
	return token, traduzir(err)
}

// ApagarLink desliga o link: quem tinha o endereço não vê mais nada.
func (b *Banco) ApagarLink(ctx context.Context, u conta.Usuario, id string) error {
	tag, err := b.pool.Exec(ctx, `update laudos set link_token = null, link_criado_em = null
		where id = $1 and organizacao_id = $2 and pode_ver('laudo', id, usuario_id, $3::uuid, $4)`, id, u.OrganizacaoID, u.ID, string(u.Papel))
	if err == nil && tag.RowsAffected() == 0 {
		return laudo.ErrNaoEncontrado
	}
	return traduzir(err)
}

// LaudoPublico: o laudo pelo link, com fotos e os dados públicos do responsável técnico.
func (b *Banco) LaudoPublico(ctx context.Context, token string) (laudo.Registro, []laudo.FotoRegistro, conta.Usuario, error) {
	var autor conta.Usuario
	l, err := lerLaudo(b.pool.QueryRow(ctx, `select id::text, tipo, titulo, status, dados, textos, conclusao, usuario_id::text, criado_em, atualizado_em, versao
		from laudos where link_token = $1 and excluido_em is null`, token), false)
	if err != nil {
		return l, nil, autor, traduzir(err)
	}
	_ = b.pool.QueryRow(ctx, `select nome, profissao, registro, telefone, cidade, coalesce(uf,'') from usuarios where id = $1`, l.UsuarioID).
		Scan(&autor.Nome, &autor.Profissao, &autor.Registro, &autor.Telefone, &autor.Cidade, &autor.UF)
	fotos, err := b.fotosDoLaudo(ctx, l.ID)
	return l, fotos, autor, err
}

// ChavesFotoPublica: as chaves da foto, só se ela é do laudo daquele link.
func (b *Banco) ChavesFotoPublica(ctx context.Context, token, fotoID string) (string, string, error) {
	var img, mini string
	err := b.pool.QueryRow(ctx, `select f.imagem_chave, f.miniatura_chave from fotos f join laudos l on l.id = f.laudo_id
		where l.link_token = $1 and f.id = $2 and l.excluido_em is null`, token, fotoID).Scan(&img, &mini)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", laudo.ErrNaoEncontrado
	}
	return img, mini, traduzir(err)
}

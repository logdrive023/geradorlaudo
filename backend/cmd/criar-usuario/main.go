// criar-usuario cria (ou atualiza) um usuário no banco, sem a senha passar por SQL nem por log.
//
//	DATABASE_URL=... SENHA=... go run ./cmd/criar-usuario -email admin@admin -nome Administrador -papel admin
//
// A senha vem da variável SENHA (não fica no histórico do shell como argumento).
package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/postgres"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
)

func main() {
	email := flag.String("email", "", "e-mail do usuário")
	nome := flag.String("nome", "Administrador", "nome")
	papel := flag.String("papel", "admin", "admin | engenheiro")
	org := flag.String("org", "LaudoTech", "nome da organização")
	flag.Parse()
	senha := os.Getenv("SENHA")
	if *email == "" || len(senha) < 6 || (*papel != "admin" && *papel != "engenheiro") {
		fmt.Fprintln(os.Stderr, "uso: DATABASE_URL=... SENHA=... criar-usuario -email x@y [-nome N] [-papel admin|engenheiro]")
		os.Exit(2)
	}
	ctx := context.Background()
	b, err := postgres.Abrir(ctx, os.Getenv("DATABASE_URL")) // aplica as migrations também
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	b.Fechar()
	hash, err := conta.ResumoSenha(senha)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	c, err := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer c.Close(ctx)
	_, err = c.Exec(ctx, `insert into organizacoes (nome) select $1::text where not exists (select 1 from organizacoes where nome = $1::text)`, *org)
	if err == nil {
		_, err = c.Exec(ctx, `insert into usuarios (organizacao_id, email, nome, papel, senha_hash, profissao)
			select id, $2, $3, $4, $5, 'Engenheiro civil' from organizacoes where nome = $1 limit 1
			on conflict (email) do update set nome = excluded.nome, papel = excluded.papel, senha_hash = excluded.senha_hash, ativo = true`,
			*org, conta.NormalizarEmail(*email), *nome, *papel, hash)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println("usuário pronto:", conta.NormalizarEmail(*email), "("+*papel+")")
}

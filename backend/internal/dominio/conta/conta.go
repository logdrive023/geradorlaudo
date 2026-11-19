// Package conta: usuário, senha (argon2id) e token de sessão. Regras puras, sem banco.
package conta

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

type Papel string

const (
	Admin      Papel = "admin"
	Engenheiro Papel = "engenheiro"
)

// Usuario é quem entra no app. A senha nunca sai do banco.
type Usuario struct {
	ID            string `json:"id"`
	OrganizacaoID string `json:"organizacaoId"`
	Email         string `json:"email"`
	Nome          string `json:"nome"`
	Papel         Papel  `json:"papel"`
	Profissao     string `json:"profissao"`
	Registro      string `json:"registro"`
	Telefone      string `json:"telefone"`
	Endereco      string `json:"endereco"`
	Cidade        string `json:"cidade"`
	UF            string `json:"uf"`
	Ativo         bool   `json:"ativo"`
}

// parâmetros do argon2id (OWASP: m=64 MiB, t=3, p=2)
const (
	argonTempo    = 3
	argonMemoria  = 64 * 1024
	argonParalelo = 2
	argonTamanho  = 32
)

// ResumoSenha gera o hash argon2id no formato PHC ($argon2id$v=19$m=...,t=...,p=...$sal$hash).
func ResumoSenha(senha string) (string, error) {
	sal := make([]byte, 16)
	if _, err := rand.Read(sal); err != nil {
		return "", err
	}
	h := argon2.IDKey([]byte(senha), sal, argonTempo, argonMemoria, argonParalelo, argonTamanho)
	b := base64.RawStdEncoding
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, argonMemoria, argonTempo, argonParalelo,
		b.EncodeToString(sal), b.EncodeToString(h)), nil
}

// ConfereSenha compara a senha com o hash PHC em tempo constante. Hash inválido = não confere.
func ConfereSenha(senha, resumo string) bool {
	p := strings.Split(resumo, "$") // "", "argon2id", "v=19", "m=..,t=..,p=..", sal, hash
	if len(p) != 6 || p[1] != "argon2id" {
		return false
	}
	var v int
	var m, t uint32
	var par uint8
	if _, err := fmt.Sscanf(p[2], "v=%d", &v); err != nil || v != argon2.Version {
		return false
	}
	if _, err := fmt.Sscanf(p[3], "m=%d,t=%d,p=%d", &m, &t, &par); err != nil || m == 0 || t == 0 || par == 0 || m > 1<<20 || t > 20 {
		return false
	}
	b := base64.RawStdEncoding
	sal, err1 := b.DecodeString(p[4])
	esperado, err2 := b.DecodeString(p[5])
	if err1 != nil || err2 != nil || len(esperado) == 0 {
		return false
	}
	obtido := argon2.IDKey([]byte(senha), sal, t, m, par, uint32(len(esperado)))
	return subtle.ConstantTimeCompare(obtido, esperado) == 1
}

// NovoToken devolve o token (vai para o app) e o resumo dele (vai para o banco).
// Se o banco vazar, os resumos não servem para entrar.
func NovoToken() (token string, resumo []byte, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", nil, err
	}
	token = base64.RawURLEncoding.EncodeToString(b)
	return token, ResumoToken(token), nil
}

func ResumoToken(token string) []byte {
	s := sha256.Sum256([]byte(token))
	return s[:]
}

// NormalizarEmail: sem espaços e em minúsculas.
func NormalizarEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }

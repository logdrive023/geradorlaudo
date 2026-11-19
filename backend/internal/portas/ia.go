// Package portas define o que os casos de uso precisam do mundo de fora (IA, banco, storage…),
// sem saber QUEM faz. Os adaptadores (gemini, demo, postgres…) implementam estas interfaces.
package portas

import (
	"context"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
)

// Foto que vai para a análise.
type Foto struct {
	Dados     []byte
	MimeType  string
	Tipo      laudo.TipoLaudo
	Contexto  string // o que o engenheiro já sabe (endereço, ambiente, observação)
	Instrucao string // prompt final (padrão ou editado pelo usuário)
}

// IA é qualquer motor que analisa fotos e escreve textos.
type IA interface {
	Nome() string   // "gemini", "demo"…
	Modelo() string // ex.: gemini-2.5-flash
	AnalisarFoto(ctx context.Context, f Foto) (laudo.Analise, error)
	EscreverConclusao(ctx context.Context, instrucao, resumo string) (string, error)
	Conversar(ctx context.Context, instrucao string, conversa []laudo.Mensagem) (string, error)
}

// ErroIA classifica falhas para o HTTP responder certo.
type ErroIA struct {
	Tipo     string // "limite", "chave", "indisponivel", "recusado", "formato"
	Mensagem string
}

func (e *ErroIA) Error() string { return e.Mensagem }

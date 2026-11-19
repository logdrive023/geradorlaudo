// Package aplicacao tem os casos de uso: validam a entrada, chamam as portas e aplicam as regras do domínio.
package aplicacao

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

const (
	TamanhoMaximoFoto = 8 << 20 // 8 MB (o app já manda ~300 KB, 1600 px)
	maxConversa       = 20
	maxTexto          = 4000
	maxPrompt         = 20000
)

// ErroEntrada é erro de quem chamou (vira HTTP 400).
type ErroEntrada struct{ Mensagem string }

func (e *ErroEntrada) Error() string { return e.Mensagem }

// ServicoIA reúne os casos de uso de IA.
type ServicoIA struct {
	IA      portas.IA
	Timeout time.Duration
}

// AnalisarFoto: confere a foto, pede a análise e limpa a resposta.
// instrucao: prompt editado pelo usuário (Ajustes › Prompts da IA). Vazio = padrão do domínio.
func (s ServicoIA) AnalisarFoto(ctx context.Context, dados []byte, tipo, contexto, instrucao string) (laudo.Analise, error) {
	t, err := laudo.ValidarTipo(tipo)
	if err != nil {
		return laudo.Analise{}, &ErroEntrada{err.Error()}
	}
	if len(dados) == 0 {
		return laudo.Analise{}, &ErroEntrada{"Mande a foto no campo \"imagem\"."}
	}
	if len(dados) > TamanhoMaximoFoto {
		return laudo.Analise{}, &ErroEntrada{"Foto grande demais (máx. 8 MB)."}
	}
	mime := http.DetectContentType(dados)
	if mime != "image/jpeg" && mime != "image/png" && mime != "image/webp" {
		return laudo.Analise{}, &ErroEntrada{"Formato não aceito: mande JPEG, PNG ou WebP."}
	}
	ctx, cancel := context.WithTimeout(ctx, s.Timeout)
	defer cancel()
	a, err := s.IA.AnalisarFoto(ctx, portas.Foto{Dados: dados, MimeType: mime, Tipo: t, Contexto: cortar(contexto, 1000), Instrucao: escolher(instrucao, laudo.InstrucaoAnalise(t))})
	if err != nil {
		return laudo.Analise{}, err
	}
	return a.Limpar(), nil
}

// EscreverConclusao a partir do resumo dos achados aceitos.
func (s ServicoIA) EscreverConclusao(ctx context.Context, resumo, instrucao string) (string, error) {
	resumo = strings.TrimSpace(resumo)
	if resumo == "" {
		return "", &ErroEntrada{"Mande o resumo do laudo."}
	}
	ctx, cancel := context.WithTimeout(ctx, s.Timeout)
	defer cancel()
	return s.IA.EscreverConclusao(ctx, escolher(instrucao, laudo.InstrucaoConclusao), cortar(resumo, 12000))
}

// Conversar com a Lia (só as últimas mensagens, cada uma com tamanho limitado).
func (s ServicoIA) Conversar(ctx context.Context, contexto, instrucao string, conversa []laudo.Mensagem) (string, error) {
	limpa := make([]laudo.Mensagem, 0, len(conversa))
	for _, m := range conversa {
		t := strings.TrimSpace(m.Texto)
		if t == "" || (m.De != "voce" && m.De != "lia") {
			continue
		}
		limpa = append(limpa, laudo.Mensagem{De: m.De, Texto: cortar(t, maxTexto)})
	}
	if len(limpa) > maxConversa {
		limpa = limpa[len(limpa)-maxConversa:]
	}
	for len(limpa) > 0 && limpa[0].De != "voce" { // a conversa começa pela pessoa
		limpa = limpa[1:]
	}
	if len(limpa) == 0 || limpa[len(limpa)-1].De != "voce" {
		return "", &ErroEntrada{"A conversa precisa terminar com uma pergunta."}
	}
	ctx, cancel := context.WithTimeout(ctx, s.Timeout)
	defer cancel()
	return s.IA.Conversar(ctx, escolher(instrucao, laudo.InstrucaoLia(cortar(contexto, 6000))), limpa)
}

// escolher usa o prompt editado (com limite de tamanho) ou o padrão.
func escolher(editado, padrao string) string {
	if e := strings.TrimSpace(editado); e != "" {
		return cortar(e, maxPrompt)
	}
	return padrao
}

func cortar(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}

// ComoErroIA ajuda o HTTP a reconhecer erros do motor.
func ComoErroIA(err error) (*portas.ErroIA, bool) {
	var e *portas.ErroIA
	ok := errors.As(err, &e)
	return e, ok
}

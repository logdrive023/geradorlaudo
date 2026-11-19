// Package claude implementa a porta de IA com o Claude (SDK oficial github.com/anthropics/anthropic-sdk-go/v2).
// Só liga quando ANTHROPIC_API_KEY está no servidor.
package claude

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go/v2"
	"github.com/anthropics/anthropic-sdk-go/v2/option"

	"github.com/logdrive023/geradorlaudo/backend/contratos"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

type Claude struct {
	cliente anthropic.Client
	modelo  string
}

func Novo(apiKey, modelo string) *Claude {
	return &Claude{cliente: anthropic.NewClient(option.WithAPIKey(apiKey)), modelo: modelo}
}

func (c *Claude) Nome() string   { return "claude" }
func (c *Claude) Modelo() string { return c.modelo }

// gerar faz a chamada (2 novas tentativas em limite/instabilidade) e devolve o texto.
func (c *Claude) gerar(ctx context.Context, sistema string, msgs []anthropic.MessageParam, maxTokens int64) (string, error) {
	p := anthropic.MessageNewParams{
		Model:        anthropic.Model(c.modelo),
		MaxTokens:    maxTokens,
		System:       []anthropic.TextBlockParam{{Text: sistema}},
		Messages:     msgs,
		OutputConfig: anthropic.OutputConfigParam{Effort: anthropic.OutputConfigEffortLow}, // foto de vistoria: rápido basta
	}
	pausas := []time.Duration{4 * time.Second, 12 * time.Second}
	for i := 0; ; i++ {
		resp, err := c.cliente.Messages.New(ctx, p)
		if err == nil {
			if resp.StopReason == anthropic.StopReasonRefusal {
				return "", &portas.ErroIA{Tipo: "recusado", Mensagem: "O Claude não quis analisar esta foto. Preencha manualmente."}
			}
			var b strings.Builder
			for _, bloco := range resp.Content {
				if t, ok := bloco.AsAny().(anthropic.TextBlock); ok {
					b.WriteString(t.Text)
				}
			}
			return b.String(), nil
		}
		slog.Warn("claude falhou", "tentativa", i+1, "erro", err.Error())
		var api *anthropic.Error
		repetir := errors.As(err, &api) && (api.StatusCode == 429 || api.StatusCode >= 500)
		if !repetir || i >= len(pausas) {
			return "", traduzir(err)
		}
		select {
		case <-time.After(pausas[i]):
		case <-ctx.Done():
			return "", &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Claude demorou demais. Tente de novo."}
		}
	}
}

func traduzir(err error) error {
	var api *anthropic.Error
	if errors.As(err, &api) {
		switch {
		case api.StatusCode == 429:
			return &portas.ErroIA{Tipo: "limite", Mensagem: "Limite do Claude atingido. Espere um minuto e tente de novo."}
		case api.StatusCode == 401 || api.StatusCode == 403:
			return &portas.ErroIA{Tipo: "chave", Mensagem: "A chave do Claude no servidor é inválida ou sem permissão."}
		case api.StatusCode >= 500:
			return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Claude está instável agora. Tente de novo em instantes."}
		}
		return &portas.ErroIA{Tipo: "recusado", Mensagem: "O Claude recusou o pedido."}
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Claude demorou demais. Tente de novo."}
	}
	return err
}

func (c *Claude) AnalisarFoto(ctx context.Context, f portas.Foto) (laudo.Analise, error) {
	msgs := []anthropic.MessageParam{anthropic.NewUserMessage(
		anthropic.NewImageBlockBase64(f.MimeType, base64.StdEncoding.EncodeToString(f.Dados)),
		anthropic.NewTextBlock("Contexto do engenheiro: "+vazio(f.Contexto)+"\nAnalise a foto."),
	)}
	txt, err := c.gerar(ctx, f.Instrucao+contratos.PedidoJSON(), msgs, 8000)
	if err != nil {
		return laudo.Analise{}, err
	}
	var a laudo.Analise
	if err := json.Unmarshal([]byte(contratos.ExtrairJSON(txt)), &a); err != nil {
		return laudo.Analise{}, &portas.ErroIA{Tipo: "formato", Mensagem: "A resposta do Claude veio fora do formato. Tente de novo."}
	}
	a.Modelo = c.modelo
	return a, nil
}

func (c *Claude) EscreverConclusao(ctx context.Context, instrucao, resumo string) (string, error) {
	t, err := c.gerar(ctx, instrucao, []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("Escreva a conclusão do laudo a partir deste resumo:\n\n" + resumo))}, 4000)
	if err == nil && strings.TrimSpace(t) == "" {
		return "", &portas.ErroIA{Tipo: "recusado", Mensagem: "O Claude não gerou a conclusão. Escreva manualmente."}
	}
	return t, err
}

func (c *Claude) Conversar(ctx context.Context, instrucao string, conversa []laudo.Mensagem) (string, error) {
	msgs := make([]anthropic.MessageParam, 0, len(conversa))
	for _, m := range conversa {
		if m.De == "lia" {
			msgs = append(msgs, anthropic.NewAssistantMessage(anthropic.NewTextBlock(m.Texto)))
		} else {
			msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock(m.Texto)))
		}
	}
	t, err := c.gerar(ctx, instrucao, msgs, 2000)
	if err == nil && strings.TrimSpace(t) == "" {
		return "Não consegui responder agora. Tente de novo?", nil
	}
	return t, err
}

func vazio(s string) string {
	if s == "" {
		return "—"
	}
	return s
}

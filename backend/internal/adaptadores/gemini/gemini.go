// Package gemini implementa a porta de IA com o Google Gemini (SDK oficial google.golang.org/genai).
// A faixa grátis do Google AI Studio cobre os modelos Flash — bom para começar.
package gemini

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"google.golang.org/genai"

	"github.com/logdrive023/geradorlaudo/backend/contratos"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

type Gemini struct {
	cliente    *genai.Client
	modelo     string
	pensamento genai.ThinkingLevel // "" = padrão do modelo
}

// Novo cria o cliente. pensamento: minimal | low | medium | high ("" = padrão do modelo).
// Para olhar foto e preencher o contrato, "low" responde bem mais rápido e basta.
func Novo(ctx context.Context, apiKey, modelo, pensamento string) (*Gemini, error) {
	c, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: apiKey, Backend: genai.BackendGeminiAPI})
	if err != nil {
		return nil, err
	}
	return &Gemini{cliente: c, modelo: modelo, pensamento: genai.ThinkingLevel(strings.ToUpper(strings.TrimSpace(pensamento)))}, nil
}

func (g *Gemini) configPensamento() *genai.ThinkingConfig {
	if g.pensamento == "" {
		return nil
	}
	return &genai.ThinkingConfig{ThinkingLevel: g.pensamento}
}

func (g *Gemini) Nome() string   { return "gemini" }
func (g *Gemini) Modelo() string { return g.modelo }

// esquemaAnalise: o contrato analise-foto.v1 (backend/contratos), o mesmo que o app usa.
var esquemaAnalise = contratos.AnaliseFoto()

// comRepeticao tenta de novo no limite por minuto (429) ou instabilidade (5xx) — comum no plano grátis.
func comRepeticao[T any](ctx context.Context, fn func() (T, error)) (T, error) {
	pausas := []time.Duration{4 * time.Second, 12 * time.Second}
	for i := 0; ; i++ {
		inicio := time.Now()
		v, err := fn()
		if err == nil {
			return v, nil
		}
		slog.Warn("gemini falhou", "tentativa", i+1, "ms", time.Since(inicio).Milliseconds(), "erro", err.Error())
		var api genai.APIError
		repetir := errors.As(err, &api) && (api.Code == 429 || api.Code >= 500)
		if !repetir || i >= len(pausas) {
			var zero T
			return zero, traduzir(err)
		}
		select {
		case <-time.After(pausas[i]):
		case <-ctx.Done():
			var zero T
			return zero, &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Gemini demorou demais. Tente de novo."}
		}
	}
}

func traduzir(err error) error {
	var api genai.APIError
	if errors.As(err, &api) {
		switch {
		case api.Code == 429:
			return &portas.ErroIA{Tipo: "limite", Mensagem: "Limite grátis do Gemini atingido. Espere um minuto e tente de novo."}
		case api.Code == 400 && (api.Status == "INVALID_ARGUMENT" && containsKey(api.Message)):
			return &portas.ErroIA{Tipo: "chave", Mensagem: "Chave do Gemini inválida no servidor."}
		case api.Code == 401 || api.Code == 403:
			return &portas.ErroIA{Tipo: "chave", Mensagem: "A chave do Gemini no servidor não tem permissão."}
		case api.Code >= 500:
			return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Gemini está instável agora. Tente de novo em instantes."}
		}
		return &portas.ErroIA{Tipo: "recusado", Mensagem: "O Gemini recusou o pedido: " + api.Message}
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "O Gemini demorou demais. Tente de novo."}
	}
	return err
}

func containsKey(m string) bool {
	return strings.Contains(strings.ToLower(m), "api key") || strings.Contains(m, "API_KEY")
}

func (g *Gemini) AnalisarFoto(ctx context.Context, f portas.Foto) (laudo.Analise, error) {
	conteudo := []*genai.Content{genai.NewContentFromParts([]*genai.Part{
		genai.NewPartFromBytes(f.Dados, f.MimeType),
		genai.NewPartFromText("Contexto do engenheiro: " + vazio(f.Contexto) + "\nAnalise a foto."),
	}, genai.RoleUser)}
	cfg := &genai.GenerateContentConfig{
		SystemInstruction:  genai.NewContentFromText(f.Instrucao, genai.RoleUser),
		ResponseMIMEType:   "application/json",
		ResponseJsonSchema: esquemaAnalise,
		Temperature:        genai.Ptr[float32](0.2),
		ThinkingConfig:     g.configPensamento(),
	}
	resp, err := comRepeticao(ctx, func() (*genai.GenerateContentResponse, error) {
		return g.cliente.Models.GenerateContent(ctx, g.modelo, conteudo, cfg)
	})
	if err != nil {
		return laudo.Analise{}, err
	}
	txt := resp.Text()
	if txt == "" {
		return laudo.Analise{}, &portas.ErroIA{Tipo: "recusado", Mensagem: "O Gemini não respondeu sobre esta foto (filtro de segurança). Preencha manualmente."}
	}
	var a laudo.Analise
	if err := json.Unmarshal([]byte(txt), &a); err != nil {
		return laudo.Analise{}, &portas.ErroIA{Tipo: "formato", Mensagem: "A resposta do Gemini veio fora do formato. Tente de novo."}
	}
	return a, nil
}

func (g *Gemini) EscreverConclusao(ctx context.Context, instrucao, resumo string) (string, error) {
	cfg := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(instrucao, genai.RoleUser),
		Temperature:       genai.Ptr[float32](0.3),
	}
	resp, err := comRepeticao(ctx, func() (*genai.GenerateContentResponse, error) {
		return g.cliente.Models.GenerateContent(ctx, g.modelo, genai.Text("Escreva a conclusão do laudo a partir deste resumo:\n\n"+resumo), cfg)
	})
	if err != nil {
		return "", err
	}
	if t := resp.Text(); t != "" {
		return t, nil
	}
	return "", &portas.ErroIA{Tipo: "recusado", Mensagem: "O Gemini não gerou a conclusão. Escreva manualmente."}
}

func (g *Gemini) Conversar(ctx context.Context, instrucao string, conversa []laudo.Mensagem) (string, error) {
	conteudo := make([]*genai.Content, 0, len(conversa))
	for _, m := range conversa {
		papel := genai.Role(genai.RoleUser)
		if m.De == "lia" {
			papel = genai.RoleModel
		}
		conteudo = append(conteudo, genai.NewContentFromText(m.Texto, papel))
	}
	cfg := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(instrucao, genai.RoleUser),
		Temperature:       genai.Ptr[float32](0.4),
	}
	resp, err := comRepeticao(ctx, func() (*genai.GenerateContentResponse, error) {
		return g.cliente.Models.GenerateContent(ctx, g.modelo, conteudo, cfg)
	})
	if err != nil {
		return "", err
	}
	if t := resp.Text(); t != "" {
		return t, nil
	}
	return "Não consegui responder agora. Tente de novo?", nil
}

func vazio(s string) string {
	if s == "" {
		return "—"
	}
	return s
}

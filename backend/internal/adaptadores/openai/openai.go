// Package openai implementa a porta de IA com a API da OpenAI (Chat Completions, HTTP direto).
// Só liga quando OPENAI_API_KEY está no servidor.
package openai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/contratos"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

const endereco = "https://api.openai.com/v1/chat/completions"

type OpenAI struct {
	chave, modelo string
	http          *http.Client
}

func Novo(chave, modelo string) *OpenAI {
	return &OpenAI{chave: chave, modelo: modelo, http: &http.Client{}}
}

func (o *OpenAI) Nome() string   { return "openai" }
func (o *OpenAI) Modelo() string { return o.modelo }

type erroHTTP struct{ codigo int }

func (e erroHTTP) Error() string { return fmt.Sprintf("openai respondeu %d", e.codigo) }

func (o *OpenAI) chamar(ctx context.Context, msgs []map[string]any, emJSON bool) (string, error) {
	corpo := map[string]any{"model": o.modelo, "messages": msgs}
	if emJSON {
		corpo["response_format"] = map[string]any{"type": "json_object"}
	}
	dados, _ := json.Marshal(corpo)
	pausas := []time.Duration{4 * time.Second, 12 * time.Second}
	for i := 0; ; i++ {
		txt, err := o.uma(ctx, dados)
		if err == nil {
			return txt, nil
		}
		slog.Warn("openai falhou", "tentativa", i+1, "erro", err.Error())
		var e erroHTTP
		repetir := errors.As(err, &e) && (e.codigo == 429 || e.codigo >= 500)
		if !repetir || i >= len(pausas) {
			return "", traduzir(err)
		}
		select {
		case <-time.After(pausas[i]):
		case <-ctx.Done():
			return "", &portas.ErroIA{Tipo: "indisponivel", Mensagem: "A OpenAI demorou demais. Tente de novo."}
		}
	}
}

func (o *OpenAI) uma(ctx context.Context, dados []byte) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endereco, bytes.NewReader(dados))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+o.chave)
	req.Header.Set("Content-Type", "application/json")
	resp, err := o.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", erroHTTP{resp.StatusCode}
	}
	var r struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
				Refusal string `json:"refusal"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", err
	}
	if len(r.Choices) == 0 || r.Choices[0].Message.Refusal != "" {
		return "", &portas.ErroIA{Tipo: "recusado", Mensagem: "A OpenAI não quis responder sobre esta foto."}
	}
	return r.Choices[0].Message.Content, nil
}

func traduzir(err error) error {
	var e erroHTTP
	if errors.As(err, &e) {
		switch {
		case e.codigo == 429:
			return &portas.ErroIA{Tipo: "limite", Mensagem: "Limite da OpenAI atingido. Espere um minuto e tente de novo."}
		case e.codigo == 401 || e.codigo == 403:
			return &portas.ErroIA{Tipo: "chave", Mensagem: "A chave da OpenAI no servidor é inválida ou sem permissão."}
		case e.codigo >= 500:
			return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "A OpenAI está instável agora. Tente de novo em instantes."}
		}
		return &portas.ErroIA{Tipo: "recusado", Mensagem: "A OpenAI recusou o pedido."}
	}
	var ia *portas.ErroIA
	if errors.As(err, &ia) {
		return ia
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return &portas.ErroIA{Tipo: "indisponivel", Mensagem: "A OpenAI demorou demais. Tente de novo."}
	}
	return err
}

func (o *OpenAI) AnalisarFoto(ctx context.Context, f portas.Foto) (laudo.Analise, error) {
	img := "data:" + f.MimeType + ";base64," + base64.StdEncoding.EncodeToString(f.Dados)
	msgs := []map[string]any{
		{"role": "system", "content": f.Instrucao + contratos.PedidoJSON()},
		{"role": "user", "content": []map[string]any{
			{"type": "image_url", "image_url": map[string]any{"url": img}},
			{"type": "text", "text": "Contexto do engenheiro: " + vazio(f.Contexto) + "\nAnalise a foto."},
		}},
	}
	txt, err := o.chamar(ctx, msgs, true)
	if err != nil {
		return laudo.Analise{}, err
	}
	var a laudo.Analise
	if err := json.Unmarshal([]byte(contratos.ExtrairJSON(txt)), &a); err != nil {
		return laudo.Analise{}, &portas.ErroIA{Tipo: "formato", Mensagem: "A resposta da OpenAI veio fora do formato. Tente de novo."}
	}
	a.Modelo = o.modelo
	return a, nil
}

func (o *OpenAI) EscreverConclusao(ctx context.Context, instrucao, resumo string) (string, error) {
	return o.chamar(ctx, []map[string]any{
		{"role": "system", "content": instrucao},
		{"role": "user", "content": "Escreva a conclusão do laudo a partir deste resumo:\n\n" + resumo},
	}, false)
}

func (o *OpenAI) Conversar(ctx context.Context, instrucao string, conversa []laudo.Mensagem) (string, error) {
	msgs := []map[string]any{{"role": "system", "content": instrucao}}
	for _, m := range conversa {
		papel := "user"
		if m.De == "lia" {
			papel = "assistant"
		}
		msgs = append(msgs, map[string]any{"role": papel, "content": m.Texto})
	}
	t, err := o.chamar(ctx, msgs, false)
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

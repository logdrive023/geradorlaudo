// Package obra: regras da gestão de obras no servidor. O conteúdo (etapas, diário, financeiro, compras)
// é um documento JSON montado pelo app; aqui só validamos o essencial e protegemos o que é privado.
package obra

import (
	"encoding/json"
	"errors"
	"strings"
)

const (
	MaxDocumento = 2 << 20 // 2 MB de JSON por obra (fotos não entram: ficam no storage)
	MaxFotosObra = 60      // fase de teste
	StatusPadrao = "andamento"
)

var status = map[string]bool{"planejamento": true, "andamento": true, "pausada": true, "concluida": true}

var (
	ErrLimiteFotos = errors.New("limite de fotos da obra")
	ErrInvalida    = errors.New("obra inválida")
)

// Registro como trafega entre app e servidor.
type Registro struct {
	ID           string          `json:"id"`
	Nome         string          `json:"nome"`
	Status       string          `json:"status"`
	Dados        json.RawMessage `json:"dados"`
	UsuarioID    string          `json:"usuarioId,omitempty"`
	CriadoEm     int64           `json:"criadoEm"`
	AtualizadoEm int64           `json:"atualizadoEm"`
}

// Validar confere tamanho, nome e status; o JSON precisa ser um objeto.
func (r *Registro) Validar() error {
	r.Nome = strings.TrimSpace(r.Nome)
	if r.Nome == "" || len(r.Nome) > 200 {
		return errors.New("a obra precisa de um nome (até 200 caracteres)")
	}
	if !status[r.Status] {
		r.Status = StatusPadrao
	}
	if len(r.Dados) == 0 {
		r.Dados = json.RawMessage(`{}`)
	}
	if len(r.Dados) > MaxDocumento {
		return errors.New("obra grande demais (máx. 2 MB de dados)")
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(r.Dados, &obj); err != nil {
		return errors.New("dados da obra inválidos")
	}
	return nil
}

// Publico remove do documento o que o cliente não deve ver pelo link
// (financeiro e compras, a não ser que o engenheiro libere).
func Publico(dados json.RawMessage, comFinanceiro bool) json.RawMessage {
	var obj map[string]json.RawMessage
	if json.Unmarshal(dados, &obj) != nil {
		return json.RawMessage(`{}`)
	}
	delete(obj, "notasInternas")
	if !comFinanceiro {
		delete(obj, "lancamentos")
		delete(obj, "compras")
		if raw, ok := obj["etapas"]; ok { // esconde o orçado de cada etapa
			var etapas []map[string]json.RawMessage
			if json.Unmarshal(raw, &etapas) == nil {
				for _, e := range etapas {
					delete(e, "orcado")
				}
				obj["etapas"], _ = json.Marshal(etapas)
			}
		}
	}
	out, _ := json.Marshal(obj)
	return out
}

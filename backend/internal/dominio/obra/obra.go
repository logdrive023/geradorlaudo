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
	Versao       int             `json:"versao"` // sobe a cada gravação; 0 vindo do app = sem conferir
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
		delete(obj, "orcamentoPrevisto")
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

// chaves do financeiro no documento da obra (o assistente de campo não vê nem altera).
var chavesFinanceiro = []string{"lancamentos", "compras", "orcamentoPrevisto"}

// SemFinanceiro: a obra como o assistente vê (sem dinheiro). Notas internas continuam (é da equipe).
func SemFinanceiro(dados json.RawMessage) json.RawMessage {
	var obj map[string]json.RawMessage
	if json.Unmarshal(dados, &obj) != nil {
		return dados
	}
	for _, k := range chavesFinanceiro {
		delete(obj, k)
	}
	if raw, ok := obj["etapas"]; ok {
		var etapas []map[string]json.RawMessage
		if json.Unmarshal(raw, &etapas) == nil {
			for _, e := range etapas {
				delete(e, "orcado")
			}
			obj["etapas"], _ = json.Marshal(etapas)
		}
	}
	out, _ := json.Marshal(obj)
	return out
}

// ManterFinanceiro: quando o assistente salva, o financeiro que já estava no servidor é preservado.
func ManterFinanceiro(novo, antigo json.RawMessage) json.RawMessage {
	var n, a map[string]json.RawMessage
	if json.Unmarshal(novo, &n) != nil || json.Unmarshal(antigo, &a) != nil {
		return novo
	}
	for _, k := range chavesFinanceiro {
		if v, ok := a[k]; ok {
			n[k] = v
		} else {
			delete(n, k)
		}
	}
	// orçado de cada etapa, pelo id
	orcado := map[string]json.RawMessage{}
	var etA []map[string]json.RawMessage
	if json.Unmarshal(a["etapas"], &etA) == nil {
		for _, e := range etA {
			var id string
			if json.Unmarshal(e["id"], &id) == nil && e["orcado"] != nil {
				orcado[id] = e["orcado"]
			}
		}
	}
	var etN []map[string]json.RawMessage
	if json.Unmarshal(n["etapas"], &etN) == nil {
		for _, e := range etN {
			var id string
			_ = json.Unmarshal(e["id"], &id)
			delete(e, "orcado")
			if v, ok := orcado[id]; ok {
				e["orcado"] = v
			}
		}
		n["etapas"], _ = json.Marshal(etN)
	}
	out, _ := json.Marshal(n)
	return out
}

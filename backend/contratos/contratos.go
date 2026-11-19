// Package contratos guarda os formatos JSON que a IA devolve (um arquivo por versão).
// O mesmo arquivo é importado pelo app (src/ia/gemini.ts), então os dois lados nunca divergem.
package contratos

import (
	_ "embed"
	"encoding/json"
	"strings"
)

// VersaoAnaliseFoto é a versão do contrato em uso.
const VersaoAnaliseFoto = "analise-foto.v1"

//go:embed analise-foto.v1.schema.json
var analiseFotoV1 []byte

// AnaliseFoto devolve o JSON Schema (sem os campos de metadado que o Gemini não aceita).
func AnaliseFoto() map[string]any {
	var m map[string]any
	if err := json.Unmarshal(analiseFotoV1, &m); err != nil {
		panic("contrato analise-foto.v1 inválido: " + err.Error())
	}
	delete(m, "$id")
	delete(m, "title")
	return m
}

// PedidoJSON: texto para IAs sem esquema forçado (Claude, OpenAI) responderem no contrato.
func PedidoJSON() string {
	return "\n\nFORMATO DA RESPOSTA: responda SOMENTE com um objeto JSON válido (sem texto antes ou depois, sem cercas de código), seguindo este JSON Schema:\n" + string(analiseFotoV1)
}

// ExtrairJSON tira cercas de código e texto em volta, deixando só o objeto JSON.
func ExtrairJSON(s string) string {
	ini, fim := strings.Index(s, "{"), strings.LastIndex(s, "}")
	if ini < 0 || fim < ini {
		return s
	}
	return s[ini : fim+1]
}

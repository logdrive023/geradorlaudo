// Package contratos guarda os formatos JSON que a IA devolve (um arquivo por versão).
// O mesmo arquivo é importado pelo app (src/ia/gemini.ts), então os dois lados nunca divergem.
package contratos

import (
	_ "embed"
	"encoding/json"
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

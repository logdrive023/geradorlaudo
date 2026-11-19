package obra

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidar(t *testing.T) {
	r := Registro{Nome: "  Casa Silva  ", Status: "x", Dados: json.RawMessage(`{"etapas":[]}`)}
	if err := r.Validar(); err != nil || r.Nome != "Casa Silva" || r.Status != StatusPadrao {
		t.Fatalf("validação errada: %v %+v", err, r)
	}
	if (&Registro{Nome: ""}).Validar() == nil {
		t.Fatal("sem nome deveria falhar")
	}
	if (&Registro{Nome: "a", Dados: json.RawMessage(`[1]`)}).Validar() == nil {
		t.Fatal("dados que não são objeto deveriam falhar")
	}
}

func TestPublicoEscondeFinanceiro(t *testing.T) {
	d := json.RawMessage(`{"etapas":[{"nome":"Fundação","orcado":5000,"percentual":40}],"lancamentos":[{"valor":10}],"compras":[{}],"notasInternas":"x","diarios":[]}`)
	p := string(Publico(d, false))
	if strings.Contains(p, "lancamentos") || strings.Contains(p, "compras") || strings.Contains(p, "orcado") || strings.Contains(p, "notasInternas") {
		t.Fatalf("vazou financeiro: %s", p)
	}
	if !strings.Contains(p, "percentual") || !strings.Contains(p, "diarios") {
		t.Fatalf("tirou demais: %s", p)
	}
	c := string(Publico(d, true))
	if !strings.Contains(c, "lancamentos") || strings.Contains(c, "notasInternas") {
		t.Fatalf("com financeiro liberado: %s", c)
	}
}

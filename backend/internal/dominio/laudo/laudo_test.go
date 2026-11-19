package laudo

import (
	"strings"
	"testing"
)

func TestValidarTipo(t *testing.T) {
	for tipo := range Padroes {
		if _, err := ValidarTipo(string(tipo)); err != nil {
			t.Fatalf("%s deveria ser válido: %v", tipo, err)
		}
		if FocoPorTipo[tipo] == "" {
			t.Fatalf("%s sem foco no prompt", tipo)
		}
	}
	if _, err := ValidarTipo("inventado"); err == nil {
		t.Fatal("tipo inventado deveria dar erro")
	}
}

func TestLimpar(t *testing.T) {
	a := Analise{
		Ambiente: "  ",
		Achados: []Achado{
			{Tipo: "Fissura", Descricao: "x", Gravidade: "gravissimo", Confianca: 7, Regiao: &Regiao{X: -10, Y: 50, W: 300, H: 20}},
			{Tipo: "", Descricao: ""}, // vazio: some
			{Tipo: "Trinca", Descricao: "y", Gravidade: Critico, Confianca: 0.8, Regiao: &Regiao{W: 0.5, H: 0.5}}, // caixa minúscula: some só a caixa
		},
	}
	l := a.Limpar()
	if l.Ambiente != "Ambiente" {
		t.Fatalf("ambiente vazio deveria virar 'Ambiente', veio %q", l.Ambiente)
	}
	if len(l.Achados) != 2 {
		t.Fatalf("esperava 2 achados, veio %d", len(l.Achados))
	}
	if l.Achados[0].Gravidade != Minimo || l.Achados[0].Confianca != 1 {
		t.Fatalf("grau inválido deveria virar mínimo e confiança ficar em 1: %+v", l.Achados[0])
	}
	if r := l.Achados[0].Regiao; r == nil || r.X != 0 || r.W != 100 {
		t.Fatalf("caixa deveria ficar dentro da foto: %+v", r)
	}
	if l.Achados[0].Prioridade != 3 || l.Achados[1].Prioridade != 1 || l.QualidadeFoto != "boa" {
		t.Fatalf("prioridade/qualidade erradas: %+v", l)
	}
	if l.Achados[1].Regiao != nil {
		t.Fatal("caixa minúscula deveria ser descartada")
	}
	if l.SemAnomalia {
		t.Fatal("com achados não pode ser sem anomalia")
	}
	if !(Analise{}).Limpar().SemAnomalia {
		t.Fatal("sem achados deveria ser sem anomalia")
	}
}

func TestInstrucaoAnaliseSemMarcadorSobrando(t *testing.T) {
	for tipo := range Padroes {
		s := InstrucaoAnalise(tipo)
		for _, m := range []string{"{tipo}", "{normas}", "{foco}", "{anomalias}", "{sistemas}"} {
			if strings.Contains(s, m) {
				t.Fatalf("%s: marcador %s não foi trocado", tipo, m)
			}
		}
	}
	if strings.Contains(InstrucaoLia(""), "{contexto}") || !strings.Contains(InstrucaoLia("Laudo X"), "Laudo X") {
		t.Fatal("contexto da Lia mal montado")
	}
}

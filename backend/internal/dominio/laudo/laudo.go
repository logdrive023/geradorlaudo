// Package laudo é o domínio: tipos de laudo, achados e as regras que não dependem de banco nem de HTTP.
// Os nomes batem com o front (src/dominio/modelo.ts e src/dominio/tipos.ts).
package laudo

import (
	"fmt"
	"strings"
)

// TipoLaudo é um dos 10 padrões de laudo.
type TipoLaudo string

const (
	Cautelar      TipoLaudo = "cautelar"
	Entrega       TipoLaudo = "entrega"
	Locacao       TipoLaudo = "locacao"
	Inspecao      TipoLaudo = "inspecao"
	Extrajudicial TipoLaudo = "extrajudicial"
	Estrutural    TipoLaudo = "estrutural"
	Reforma       TipoLaudo = "reforma"
	Pericia       TipoLaudo = "pericia"
	Avaliacao     TipoLaudo = "avaliacao"
	Contabil      TipoLaudo = "contabil"
)

// Padrao é o que a IA precisa saber de cada tipo (nome e normas).
type Padrao struct {
	Nome   string
	Normas []string
	Foco   string // "imovel" ou "documento"
}

// Padroes espelha src/dominio/tipos.ts (só o que a IA usa).
var Padroes = map[TipoLaudo]Padrao{
	Cautelar:      {"Vistoria Cautelar de Vizinhança", []string{"ABNT NBR 13752", "ABNT NBR 12722", "ABNT NBR 16280"}, "imovel"},
	Entrega:       {"Vistoria de Entrega de Imóvel", []string{"ABNT NBR 15575", "ABNT NBR 17170", "ABNT NBR 5674"}, "imovel"},
	Locacao:       {"Vistoria de Locação", []string{"Lei 8.245/1991", "ABNT NBR 13752"}, "imovel"},
	Inspecao:      {"Inspeção Predial", []string{"ABNT NBR 16747:2020", "ABNT NBR 5674", "Norma de Inspeção Predial do IBAPE"}, "imovel"},
	Extrajudicial: {"Laudo de Vícios Construtivos", []string{"ABNT NBR 13752", "ABNT NBR 15575", "CDC arts. 12 e 18"}, "imovel"},
	Estrutural:    {"Laudo Estrutural", []string{"ABNT NBR 6118", "ABNT NBR 15575-2", "ABNT NBR 13752"}, "imovel"},
	Reforma:       {"Laudo de Reforma (NBR 16280)", []string{"ABNT NBR 16280", "ABNT NBR 5674"}, "imovel"},
	Pericia:       {"Perícia Judicial", []string{"CPC arts. 464 a 480", "ABNT NBR 13752"}, "imovel"},
	Avaliacao:     {"Avaliação de Imóvel", []string{"ABNT NBR 14653-1", "ABNT NBR 14653-2"}, "imovel"},
	Contabil:      {"Laudo Contábil", []string{"NBC TP 01", "NBC PP 01"}, "documento"},
}

// ValidarTipo devolve o tipo ou erro se não existir.
func ValidarTipo(s string) (TipoLaudo, error) {
	t := TipoLaudo(strings.TrimSpace(s))
	if _, ok := Padroes[t]; !ok {
		return "", fmt.Errorf("tipo de laudo desconhecido: %q", s)
	}
	return t, nil
}

// Gravidade é o grau de risco (IBAPE / NBR 16747).
type Gravidade string

const (
	Critico Gravidade = "critico"
	Medio   Gravidade = "medio"
	Minimo  Gravidade = "minimo"
)

// Regiao é a caixa do achado na foto, em % (0–100).
type Regiao struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

// Achado é uma anomalia que a IA viu (o engenheiro confere depois).
type Achado struct {
	Tipo          string    `json:"tipo"`
	Sistema       string    `json:"sistema"`
	Descricao     string    `json:"descricao"`
	Gravidade     Gravidade `json:"gravidade"`
	Prioridade    int       `json:"prioridade"`           // 1 crítico, 2 médio, 3 mínimo (calculada aqui, não pela IA)
	AberturaMm    *float64  `json:"aberturaMm,omitempty"` // estimada pela IA, quando dá
	CausaProvavel string    `json:"causaProvavel"`
	Recomendacao  string    `json:"recomendacao"`
	Confianca     float64   `json:"confianca"`
	Regiao        *Regiao   `json:"regiao,omitempty"`
}

// Analise é o que a IA devolve sobre UMA foto (mesmo formato do front: ResultadoIA).
type Analise struct {
	Ambiente      string   `json:"ambiente"`
	Elemento      string   `json:"elemento"`
	Legenda       string   `json:"legenda"`
	QualidadeFoto string   `json:"qualidadeFoto"` // boa | regular | ruim
	SemAnomalia   bool     `json:"semAnomalia"`
	Achados       []Achado `json:"achados"`
}

func limitar(v, min, max float64) float64 {
	if v != v { // NaN
		return min
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

// Limpar confere e corrige a resposta da IA antes de devolver ao app:
// grau válido, confiança entre 0 e 1, caixa dentro da foto, textos sem espaços sobrando.
func (a Analise) Limpar() Analise {
	out := Analise{
		Ambiente:      strings.TrimSpace(a.Ambiente),
		Elemento:      strings.TrimSpace(a.Elemento),
		Legenda:       strings.TrimSpace(a.Legenda),
		QualidadeFoto: a.QualidadeFoto,
		Achados:       make([]Achado, 0, len(a.Achados)),
	}
	if q := out.QualidadeFoto; q != "boa" && q != "regular" && q != "ruim" {
		out.QualidadeFoto = "boa"
	}
	if out.Ambiente == "" {
		out.Ambiente = "Ambiente"
	}
	for _, x := range a.Achados {
		g := x.Gravidade
		if g != Critico && g != Medio && g != Minimo {
			g = Minimo
		}
		y := Achado{
			Tipo: strings.TrimSpace(x.Tipo), Sistema: strings.TrimSpace(x.Sistema), Descricao: strings.TrimSpace(x.Descricao),
			Gravidade: g, CausaProvavel: strings.TrimSpace(x.CausaProvavel), Recomendacao: strings.TrimSpace(x.Recomendacao),
			Confianca: limitar(x.Confianca, 0, 1), Prioridade: map[Gravidade]int{Critico: 1, Medio: 2, Minimo: 3}[g],
		}
		if x.AberturaMm != nil && *x.AberturaMm > 0 {
			v := limitar(*x.AberturaMm, 0, 100)
			y.AberturaMm = &v
		}
		if y.Tipo == "" {
			y.Tipo = "Outro"
		}
		if y.Sistema == "" {
			y.Sistema = "Vedações"
		}
		if x.Regiao != nil {
			r := Regiao{X: limitar(x.Regiao.X, 0, 100), Y: limitar(x.Regiao.Y, 0, 100), W: limitar(x.Regiao.W, 0, 100), H: limitar(x.Regiao.H, 0, 100)}
			if r.W > 1 && r.H > 1 {
				y.Regiao = &r
			}
		}
		if y.Descricao == "" && y.Tipo == "Outro" {
			continue
		}
		out.Achados = append(out.Achados, y)
	}
	out.SemAnomalia = len(out.Achados) == 0
	return out
}

// Mensagem é uma fala da conversa com a Lia.
type Mensagem struct {
	De    string `json:"de"` // "voce" ou "lia"
	Texto string `json:"texto"`
}

package laudo

import (
	"encoding/json"
	"errors"
	"regexp"
)

// MaxFotosPorLaudo: fase de teste, cada laudo aceita poucas fotos (cota do banco e da IA).
const MaxFotosPorLaudo = 5

// Registro de laudo como o app guarda (JSON em camelCase, datas em ms desde 1970).
// Logo e imagem de localização ficam só no aparelho por enquanto.
type Registro struct {
	ID           string            `json:"id"`
	Tipo         TipoLaudo         `json:"tipo"`
	Titulo       string            `json:"titulo"`
	Status       string            `json:"status"` // rascunho | conferencia | concluido
	Dados        map[string]string `json:"dados"`
	Conclusao    string            `json:"conclusao"`
	Textos       *Textos           `json:"textos,omitempty"`
	UsuarioID    string            `json:"usuarioId"`
	CriadoEm     int64             `json:"criadoEm"`
	AtualizadoEm int64             `json:"atualizadoEm"`
	Versao       int               `json:"versao"` // sobe a cada gravação; 0 vindo do app = sem conferir (app antigo)
	Fotos        int               `json:"fotos"`  // só na listagem
}

type Textos struct {
	Objetivo    string `json:"objetivo,omitempty"`
	Metodologia string `json:"metodologia,omitempty"`
}

// FotoRegistro é a foto sem a imagem (a imagem fica no storage).
type FotoRegistro struct {
	ID          string        `json:"id"`
	LaudoID     string        `json:"laudoId"`
	Ordem       int           `json:"ordem"`
	NomeArquivo string        `json:"nomeArquivo"`
	Largura     int           `json:"largura"`
	Altura      int           `json:"altura"`
	TiradaEm    *int64        `json:"tiradaEm,omitempty"`
	GPS         *GPS          `json:"gps,omitempty"`
	Status      string        `json:"status"` // pendente | analisando | analisada | conferida | erro
	Analise     *AnaliseSalva `json:"analise,omitempty"`
	Observacao  string        `json:"observacao,omitempty"`
	Erro        string        `json:"erro,omitempty"`
	CriadoEm    int64         `json:"criadoEm"`
}

type GPS struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// AnaliseSalva é a análise depois da conferência do engenheiro.
type AnaliseSalva struct {
	Ambiente      string        `json:"ambiente"`
	Elemento      string        `json:"elemento"`
	Legenda       string        `json:"legenda"`
	SemAnomalia   bool          `json:"semAnomalia"`
	QualidadeFoto string        `json:"qualidadeFoto,omitempty"`
	Contrato      string        `json:"contrato,omitempty"`
	Achados       []AchadoSalvo `json:"achados"`
	Origem        string        `json:"origem"`
	AnalisadoEm   int64         `json:"analisadoEm"`
	// resumo de cada IA que analisou (legenda, ambiente, elemento, modelo ou erro); o app define o formato, até 8 KB
	PorIA json.RawMessage `json:"porIA,omitempty"`
}

type AchadoSalvo struct {
	ID            string   `json:"id"`
	Tipo          string   `json:"tipo"`
	Sistema       string   `json:"sistema"`
	Descricao     string   `json:"descricao"`
	Gravidade     string   `json:"gravidade"`
	CausaProvavel string   `json:"causaProvavel"`
	Recomendacao  string   `json:"recomendacao"`
	Confianca     float64  `json:"confianca"`
	AberturaMm    *float64 `json:"aberturaMm,omitempty"`
	Regiao        *Regiao  `json:"regiao,omitempty"`
	Aceito        *bool    `json:"aceito"`
	Origem        string   `json:"origem"`
	IA            string   `json:"ia,omitempty"` // qual IA escreveu (gemini, claude, openai…); vazio = manual ou antiga
	// plano de ação: status, prazo, responsável, custo (o app define o formato; até 4 KB)
	Acompanhamento json.RawMessage `json:"acompanhamento,omitempty"`
}

var (
	ErrNaoEncontrado = errors.New("não encontrado")
	ErrLimiteFotos   = errors.New("limite de fotos do laudo")
	ErrPrecisaImagem = errors.New("foto nova precisa da imagem")
	// ErrConflito: alguém salvou uma versão mais nova antes (o app junta ou guarda uma cópia).
	ErrConflito = errors.New("conflito de versão")
	// ErrConcluido: laudo concluído só o engenheiro responsável (ou admin) altera.
	ErrConcluido = errors.New("laudo concluído: só o engenheiro responsável altera ou reabre")
)

var statusLaudo = map[string]bool{"rascunho": true, "conferencia": true, "concluido": true}
var statusFoto = map[string]bool{"pendente": true, "analisando": true, "analisada": true, "conferida": true, "erro": true}
var origens = map[string]bool{"demo": true, "claude": true, "gemini": true, "servidor": true, "manual": true}

// Validar confere o laudo antes de gravar.
func (r *Registro) Validar() error {
	if _, err := ValidarTipo(string(r.Tipo)); err != nil {
		return err
	}
	if !statusLaudo[r.Status] {
		r.Status = "rascunho"
	}
	if r.Dados == nil {
		r.Dados = map[string]string{}
	}
	if len(r.Titulo) > 300 || len(r.Conclusao) > 20000 {
		return errors.New("título ou conclusão grandes demais")
	}
	// dados do formulário (inclui o plano de manutenção em JSON): limite para o banco não inchar
	if len(r.Dados) > 300 {
		return errors.New("campos demais no laudo")
	}
	total := 0
	for k, v := range r.Dados {
		total += len(k) + len(v)
	}
	if total > 256<<10 {
		return errors.New("dados do laudo grandes demais (máx. 256 KB)")
	}
	return nil
}

var nomeIA = regexp.MustCompile(`^[a-z0-9-]{1,20}$`)

// Validar confere a foto antes de gravar e corrige o que dá para corrigir.
func (f *FotoRegistro) Validar() error {
	if !statusFoto[f.Status] {
		f.Status = "pendente"
	}
	if f.Largura <= 0 || f.Altura <= 0 {
		return errors.New("foto sem largura/altura")
	}
	if f.NomeArquivo == "" {
		f.NomeArquivo = "foto"
	}
	if a := f.Analise; a != nil {
		if !origens[a.Origem] {
			a.Origem = "manual"
		}
		if len(a.PorIA) > 8<<10 || (len(a.PorIA) > 0 && !json.Valid(a.PorIA)) {
			a.PorIA = nil
		}
		if len(a.Achados) > 50 {
			return errors.New("achados demais na foto")
		}
		for i := range a.Achados {
			x := &a.Achados[i]
			if x.Gravidade != string(Critico) && x.Gravidade != string(Medio) && x.Gravidade != string(Minimo) {
				x.Gravidade = string(Minimo)
			}
			x.Confianca = limitar(x.Confianca, 0, 1)
			if !origens[x.Origem] {
				x.Origem = a.Origem
			}
			if x.Tipo == "" {
				x.Tipo = "Outro"
			}
			if !nomeIA.MatchString(x.IA) {
				x.IA = ""
			}
			if x.Sistema == "" {
				x.Sistema = "Vedações"
			}
			if x.AberturaMm != nil && (*x.AberturaMm <= 0 || *x.AberturaMm >= 1000) {
				x.AberturaMm = nil
			}
			if len(x.Acompanhamento) > 4096 || (len(x.Acompanhamento) > 0 && !json.Valid(x.Acompanhamento)) {
				x.Acompanhamento = nil
			}
		}
	}
	return nil
}

// PrioridadeDe: 1 crítico, 2 médio, 3 mínimo.
func PrioridadeDe(g string) int {
	switch Gravidade(g) {
	case Critico:
		return 1
	case Medio:
		return 2
	}
	return 3
}

// Package demo é o motor de demonstração: responde sem chave, para o servidor subir e ser testado
// mesmo antes de configurar o Gemini. Deixa claro na resposta que é simulado.
package demo

import (
	"context"
	"hash/fnv"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

type Demo struct{}

func (Demo) Nome() string   { return "demo" }
func (Demo) Modelo() string { return "simulado" }

var cenarios = []laudo.Analise{
	{Ambiente: "Sala", Elemento: "Parede", Legenda: "Parede com fissura inclinada no canto da janela (análise simulada).", Achados: []laudo.Achado{
		{Tipo: "Fissura", Sistema: "Vedações", Descricao: "Fissura inclinada partindo do canto da janela, abertura estimada < 1 mm.", Gravidade: laudo.Medio,
			CausaProvavel: "Ausência ou insuficiência de contraverga.", Recomendacao: "Tratar com tela de poliéster e argamassa flexível.", Confianca: 0.8,
			Regiao: &laudo.Regiao{X: 50, Y: 20, W: 30, H: 40}},
	}},
	{Ambiente: "Banheiro", Elemento: "Teto", Legenda: "Teto com mancha de umidade (análise simulada).", Achados: []laudo.Achado{
		{Tipo: "Infiltração / umidade", Sistema: "Impermeabilização", Descricao: "Mancha de umidade no forro.", Gravidade: laudo.Medio,
			CausaProvavel: "Falha de impermeabilização no pavimento superior.", Recomendacao: "Teste de estanqueidade e correção da impermeabilização.", Confianca: 0.75,
			Regiao: &laudo.Regiao{X: 20, Y: 15, W: 40, H: 40}},
	}},
	{Ambiente: "Corredor", Elemento: "Vista geral", Legenda: "Sem anomalias aparentes (análise simulada).", Achados: nil},
}

func (Demo) AnalisarFoto(_ context.Context, f portas.Foto) (laudo.Analise, error) {
	h := fnv.New32a()
	_, _ = h.Write(f.Dados)
	return cenarios[int(h.Sum32()%uint32(len(cenarios)))], nil
}

func (Demo) EscreverConclusao(_ context.Context, _, _ string) (string, error) {
	return "Conclusão simulada: configure GEMINI_API_KEY no servidor para a Lia escrever de verdade a partir dos achados aceitos.", nil
}

func (Demo) Conversar(_ context.Context, _ string, _ []laudo.Mensagem) (string, error) {
	return "Estou no modo demonstração do servidor. Peça para configurarem a chave do Gemini (GEMINI_API_KEY) para eu responder de verdade.", nil
}

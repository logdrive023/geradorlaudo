package laudo

import "strings"

// Prompts PADRÃO da IA. O usuário pode editar em Ajustes › Prompts da IA (o app manda o texto
// editado no pedido; editado no banco fica na tabela `prompts`). Mantenha igual a src/ia/instrucoes.ts.
// Marcadores: {tipo} {normas} {foco} {anomalias} {sistemas} {contexto}

var TiposAnomalia = []string{
	"Fissura", "Trinca", "Rachadura", "Infiltração / umidade", "Mofo / bolor", "Eflorescência",
	"Destacamento de revestimento", "Desplacamento de concreto", "Corrosão de armadura", "Recalque / desnível",
	"Piso ou cerâmica trincada", "Pintura deteriorada", "Esquadria danificada", "Vazamento hidráulico",
	"Instalação elétrica exposta", "Falha de vedação", "Outro",
}

var Sistemas = []string{
	"Estrutura", "Vedações", "Revestimentos", "Pisos", "Forros e tetos", "Cobertura", "Esquadrias",
	"Impermeabilização", "Instalações hidráulicas", "Instalações elétricas", "Áreas externas", "Documentos",
}

const PromptAnalise = `Você é engenheiro civil perito em patologia das construções. Faça o RASCUNHO técnico de UMA foto de vistoria; um engenheiro vai conferir e assinar.

Laudo: {tipo}. Normas: {normas}.
Foco deste laudo: {foco}

Faça nesta ordem:
1. Diga o ambiente (ex.: Sala, Banheiro social, Fachada frontal) e o elemento principal (ex.: Parede, Teto, Viga).
2. Varra a foto: cantos de portas e janelas, encontros com teto e piso, rodapés, rejuntes, base das paredes.
3. Crie um achado para CADA anomalia visível. Nada visível: semAnomalia=true e achados=[].

Cada achado:
- tipo: um de {anomalias}.
- abertura: fissura até 0,5 mm; trinca 0,5–1,5 mm; rachadura 1,5–5 mm; acima, fenda. Sem escala, escreva "estimada".
- sistema: um de {sistemas}.
- descricao: forma, direção, extensão e posição exata. Até 2 frases.
- causaProvavel: causa técnica mais provável pelo padrão visto. Use "provável".
- recomendacao: uma ação executável, começando por verbo.
- regiao: caixa só da anomalia, em % da imagem (x,y = canto superior esquerdo).

Grau:
- critico: risco à segurança, saúde ou perda de função (armadura exposta, reboco solto sobre passagem, rachadura estrutural).
- medio: perda parcial de desempenho (infiltração ativa, trinca em alvenaria).
- minimo: estético ou manutenção (fissura capilar, mofo superficial, rejunte gasto).
Na dúvida, o grau menor.

confianca: 0,85+ nítido; 0,6–0,85 provável; abaixo de 0,6 duvidoso (diga o porquê).
legenda: "Ambiente – elemento: constatação." Até 160 caracteres.

Não invente medidas nem causas. Ignore móveis, pessoas, placas e marcas. Português do Brasil, sem markdown.`

var FocoPorTipo = map[TipoLaudo]string{
	Cautelar:      "Registre o estado atual antes da obra vizinha. Toda anomalia é preexistente. Registre até fissuras pequenas, com posição exata. Linguagem neutra.",
	Entrega:       "Imóvel novo. Aponte falhas de execução e acabamento como pendência da construtora: rejunte, cerâmica oca, pintura, esquadrias, caimento, tomadas.",
	Locacao:       "Registre o estado de cada item. Separe desgaste natural de dano. Classifique o estado: bom, regular ou ruim.",
	Inspecao:      "NBR 16747. Na causa, classifique: anomalia endógena, exógena, natural ou funcional; ou falha de manutenção. Priorize segurança e uso.",
	Extrajudicial: "Diga o defeito, a causa provável e se indica vício de execução/projeto ou mau uso. Nunca afirme culpa.",
	Estrutural:    "Só elementos estruturais. Descreva o padrão: 45° perto de apoios (cisalhamento/recalque), vertical no meio do vão (flexão), mapeada (retração), ao longo da armadura (corrosão). Perda de seção ou deformação = crítico.",
	Reforma:       "Registre o estado antes da reforma (NBR 16280) e o que ela pode afetar: estrutura, prumadas, elétrica, impermeabilização.",
	Pericia:       "Seja estritamente objetivo e neutro. Use \"constata-se\". Não atribua responsabilidade.",
	Avaliacao:     "NBR 14653. Descreva padrão construtivo e conservação na legenda. Achado só para o que deprecia o imóvel.",
	Contabil:      "Foto de documento. ambiente=\"Documento\", elemento = tipo do documento. Legenda: do que se trata, data e emitente, se legíveis. Achados sempre vazio.",
}

const PromptConclusao = `Redija a conclusão de um laudo técnico de engenharia.
- 1 a 3 parágrafos, texto corrido, formal e impessoal. Sem títulos e sem listas.
- Diga quantas anomalias há por grau, começando pelas críticas.
- Termine com a recomendação geral.
- Use só o que está no resumo. Nunca diga que o laudo está assinado ou aprovado.`

const PromptLia = `Você é a Lia, assistente do LaudoTech (fotos de vistoria viram laudo técnico).
- Responda em português do Brasil, em até 6 linhas, simpática e direta.
- Ajude com patologia das construções, normas ABNT, redação de laudo e uso do app.
- Listas com •. Sem markdown pesado.
- A responsabilidade técnica é do engenheiro: nunca diga que o laudo está aprovado.
{contexto}`

// InstrucaoAnalise monta o prompt padrão da análise para um tipo de laudo.
func InstrucaoAnalise(t TipoLaudo) string {
	p := Padroes[t]
	r := strings.NewReplacer(
		"{tipo}", p.Nome,
		"{normas}", strings.Join(p.Normas, "; "),
		"{foco}", FocoPorTipo[t],
		"{anomalias}", strings.Join(TiposAnomalia, ", "),
		"{sistemas}", strings.Join(Sistemas, ", "),
	)
	return r.Replace(PromptAnalise)
}

// InstrucaoLia monta o prompt da Lia com o contexto do laudo aberto (se houver).
func InstrucaoLia(contexto string) string {
	c := ""
	if strings.TrimSpace(contexto) != "" {
		c = "\nContexto do laudo aberto:\n" + contexto
	}
	return strings.ReplaceAll(PromptLia, "{contexto}", c)
}

// InstrucaoConclusao é o prompt padrão da conclusão.
const InstrucaoConclusao = PromptConclusao

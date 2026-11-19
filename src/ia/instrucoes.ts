import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { SISTEMAS, TIPOS_ANOMALIA, type TipoLaudo } from '../dominio/modelo';
import { LISTA_TIPOS, TIPOS } from '../dominio/tipos';

/**
 * TODOS os prompts da IA num lugar só. Os padrões ficam aqui; o que o usuário edita em
 * Ajustes › Prompts da IA fica no banco (tabela `prompts`) e vale por cima do padrão.
 * O backend Go tem os mesmos padrões (backend/internal/dominio/laudo/instrucoes.go).
 *
 * Marcadores trocados na hora de usar: {tipo} {normas} {foco} {anomalias} {sistemas} {contexto}
 */

export type ChavePrompt = 'analise' | 'conclusao' | 'lia' | `foco:${TipoLaudo}`;

export interface DefinicaoPrompt { chave: ChavePrompt; nome: string; para: string; padrao: string; marcadores?: string[] }

export const PROMPT_ANALISE = `Você é engenheiro civil perito em patologia das construções. Faça o RASCUNHO técnico de UMA foto de vistoria; um engenheiro vai conferir e assinar.

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

Não invente medidas nem causas. Ignore móveis, pessoas, placas e marcas. Português do Brasil, sem markdown.`;

export const FOCO_PADRAO: Record<TipoLaudo, string> = {
  cautelar: 'Registre o estado atual antes da obra vizinha. Toda anomalia é preexistente. Registre até fissuras pequenas, com posição exata. Linguagem neutra.',
  entrega: 'Imóvel novo. Aponte falhas de execução e acabamento como pendência da construtora: rejunte, cerâmica oca, pintura, esquadrias, caimento, tomadas.',
  locacao: 'Registre o estado de cada item. Separe desgaste natural de dano. Classifique o estado: bom, regular ou ruim.',
  inspecao: 'NBR 16747. Na causa, classifique: anomalia endógena, exógena, natural ou funcional; ou falha de manutenção. Priorize segurança e uso.',
  extrajudicial: 'Diga o defeito, a causa provável e se indica vício de execução/projeto ou mau uso. Nunca afirme culpa.',
  estrutural: 'Só elementos estruturais. Descreva o padrão: 45° perto de apoios (cisalhamento/recalque), vertical no meio do vão (flexão), mapeada (retração), ao longo da armadura (corrosão). Perda de seção ou deformação = crítico.',
  reforma: 'Registre o estado antes da reforma (NBR 16280) e o que ela pode afetar: estrutura, prumadas, elétrica, impermeabilização.',
  pericia: 'Seja estritamente objetivo e neutro. Use "constata-se". Não atribua responsabilidade.',
  avaliacao: 'NBR 14653. Descreva padrão construtivo e conservação na legenda. Achado só para o que deprecia o imóvel.',
  contabil: 'Foto de documento. ambiente="Documento", elemento = tipo do documento. Legenda: do que se trata, data e emitente, se legíveis. Achados sempre vazio.',
};

export const PROMPT_CONCLUSAO = `Redija a conclusão de um laudo técnico de engenharia.
- 1 a 3 parágrafos, texto corrido, formal e impessoal. Sem títulos e sem listas.
- Diga quantas anomalias há por grau, começando pelas críticas.
- Termine com a recomendação geral.
- Use só o que está no resumo. Nunca diga que o laudo está assinado ou aprovado.`;

export const PROMPT_LIA = `Você é a Lia, assistente do LaudoTech (fotos de vistoria viram laudo técnico).
- Responda em português do Brasil, em até 6 linhas, simpática e direta.
- Ajude com patologia das construções, normas ABNT, redação de laudo e uso do app.
- Listas com •. Sem markdown pesado.
- A responsabilidade técnica é do engenheiro: nunca diga que o laudo está aprovado.
{contexto}`;

export const DEFINICOES: DefinicaoPrompt[] = [
  { chave: 'analise', nome: 'Análise da foto', para: 'Usado em cada foto. É o principal.', padrao: PROMPT_ANALISE, marcadores: ['{tipo}', '{normas}', '{foco}', '{anomalias}', '{sistemas}'] },
  ...LISTA_TIPOS.map((t) => ({ chave: `foco:${t.id}` as ChavePrompt, nome: `Foco · ${t.curto}`, para: `Entra no {foco} da análise quando o laudo é "${t.nome}".`, padrao: FOCO_PADRAO[t.id] })),
  { chave: 'conclusao', nome: 'Conclusão do laudo', para: 'Usado em "Escrever com a Lia" na aba Laudo.', padrao: PROMPT_CONCLUSAO },
  { chave: 'lia', nome: 'Lia (conversa)', para: 'Usado no "Pergunte à Lia".', padrao: PROMPT_LIA, marcadores: ['{contexto}'] },
];

/** Lê o prompt (editado ou padrão). */
export async function lerPrompt(chave: ChavePrompt): Promise<string> {
  const salvo = await db.prompts.get(chave);
  return salvo?.texto?.trim() || DEFINICOES.find((d) => d.chave === chave)!.padrao;
}

export function usePrompts() {
  return useLiveQuery(async () => new Map((await db.prompts.toArray()).map((p) => [p.chave, p])), [], new Map());
}

/** Prompt final da análise para um tipo de laudo, com todos os marcadores trocados. */
export async function instrucaoAnalise(tipo: TipoLaudo): Promise<string> {
  const [base, foco] = await Promise.all([lerPrompt('analise'), lerPrompt(`foco:${tipo}`)]);
  return montarAnalise(base, foco, tipo);
}

export function montarAnalise(base: string, foco: string, tipo: TipoLaudo): string {
  const t = TIPOS[tipo];
  return base
    .replaceAll('{tipo}', t.nome)
    .replaceAll('{normas}', t.normas.map((n) => n.split(' —')[0]).join('; '))
    .replaceAll('{foco}', foco)
    .replaceAll('{anomalias}', TIPOS_ANOMALIA.join(', '))
    .replaceAll('{sistemas}', SISTEMAS.join(', '));
}

export async function instrucaoLia(contexto?: string): Promise<string> {
  return (await lerPrompt('lia')).replaceAll('{contexto}', contexto ? `\nContexto do laudo aberto:\n${contexto}` : '');
}

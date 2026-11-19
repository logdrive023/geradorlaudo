import { lerConfig } from '../db/db';

/**
 * Lia no diário de obra: transforma anotações rápidas do canteiro em texto técnico de RDO.
 * Usa a IA do servidor quando ligada; sem IA, só arruma pontuação e maiúsculas.
 */
const INSTRUCAO = `Você é a Lia, assistente de engenharia. Reescreva as anotações do diário de obra (RDO) em português do Brasil,
em linguagem técnica, objetiva e impessoal, como um engenheiro escreveria no diário. Regras:
- Não invente fatos, quantidades, horários nem nomes; use só o que foi anotado.
- Uma frase por item, em tópicos iniciados por "• ".
- Corrija ortografia e use termos técnicos corretos (ex.: "concretagem", "alvenaria", "chapisco").
- Responda só com o texto reescrito, sem comentários.`;

function arrumar(t: string): string {
  return t.split('\n').map((l) => l.trim()).filter(Boolean)
    .map((l) => l.replace(/^[-*•]\s*/, ''))
    .map((l) => `• ${l.charAt(0).toUpperCase()}${l.slice(1)}${/[.!?]$/.test(l) ? '' : '.'}`)
    .join('\n');
}

export async function redigirDiario(campo: 'atividades' | 'ocorrencias', texto: string, contexto: string): Promise<string> {
  if (!texto.trim()) return texto;
  const cfg = await lerConfig();
  if (cfg.motorIA !== 'servidor') return arrumar(texto);
  const { conversarServidor, SERVIDOR_PADRAO } = await import('./servidor');
  const pedido = `${contexto}\n\n${campo === 'atividades' ? 'Atividades executadas' : 'Ocorrências e observações'} anotadas:\n${texto}`;
  try {
    const r = await conversarServidor(INSTRUCAO, [{ de: 'voce', texto: pedido }], cfg.servidorUrl || SERVIDOR_PADRAO);
    return r.trim() || arrumar(texto);
  } catch {
    return arrumar(texto);
  }
}

const INSTRUCAO_RESUMO = `Você é a Lia, assistente de engenharia. Reescreva o resumo semanal da obra como uma mensagem curta e clara
para o cliente (dono da obra), em português do Brasil, tom profissional e cordial. Regras:
- Não invente fatos, números, datas nem nomes: use só o que está no resumo.
- Comece com uma saudação curta e termine se colocando à disposição.
- Mantenha os tópicos com "• " e o avanço (real e previsto) no começo.
- Responda só com a mensagem.`;

/** Lia deixa o resumo da semana mais amigável para o cliente (sem IA ligada, devolve o mesmo texto). */
export async function resumoParaCliente(texto: string): Promise<string> {
  const cfg = await lerConfig();
  if (cfg.motorIA !== 'servidor' || !texto.trim()) return texto;
  const { conversarServidor, SERVIDOR_PADRAO } = await import('./servidor');
  try {
    const r = await conversarServidor(INSTRUCAO_RESUMO, [{ de: 'voce', texto }], cfg.servidorUrl || SERVIDOR_PADRAO);
    return r.trim() || texto;
  } catch {
    return texto;
  }
}

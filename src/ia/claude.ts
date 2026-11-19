import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { SISTEMAS, TIPOS_ANOMALIA } from '../dominio/modelo';
import { instrucaoAnalise, lerPrompt } from './instrucoes';
import { blobParaBase64, tipoImagem } from '../lib/imagem';
import type { PedidoAnalise, ResultadoIA } from './tipos';

/**
 * Motor Claude, chamado direto do navegador com a chave da própria pessoa (só para teste local).
 * No backend Go isso vai para o servidor e a chave nunca chega ao navegador.
 */
const MODELO = 'claude-opus-5-5';

const EsquemaAnalise = z.object({
  ambiente: z.string().describe('Ambiente do imóvel: Sala, Cozinha, Banheiro, Fachada, Garagem… ou "Documento"'),
  elemento: z.string().describe('Elemento principal fotografado: Parede, Teto, Piso, Viga, Esquadria…'),
  legenda: z.string().describe('Legenda técnica curta para a foto no laudo, em português'),
  semAnomalia: z.boolean().describe('true se não há anomalia aparente na foto'),
  qualidadeFoto: z.enum(['boa', 'regular', 'ruim']),
  achados: z.array(z.object({
    tipo: z.string().describe(`Um destes: ${TIPOS_ANOMALIA.join(', ')}`),
    sistema: z.string().describe(`Um destes: ${SISTEMAS.join(', ')}`),
    descricao: z.string().describe('O que se vê: forma, direção, extensão, abertura estimada'),
    gravidade: z.enum(['critico', 'medio', 'minimo']),
    causaProvavel: z.string(),
    recomendacao: z.string(),
    confianca: z.number().describe('0 a 1: quanto você tem certeza vendo só a foto'),
    aberturaMm: z.number().nullable().describe('Abertura estimada em mm (fissuras); null se não der'),
    regiao: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).nullable()
      .describe('Caixa aproximada do achado em % da imagem (0–100): x,y = canto superior esquerdo'),
  })),
});

function erroLegivel(e: unknown): Error {
  if (e instanceof Anthropic.AuthenticationError) return new Error('Chave da API inválida. Confira em Configurações › IA.');
  if (e instanceof Anthropic.PermissionDeniedError) return new Error('A chave não tem permissão para este modelo.');
  if (e instanceof Anthropic.RateLimitError) return new Error('Muitas análises ao mesmo tempo. Tente de novo em instantes.');
  if (e instanceof Anthropic.BadRequestError) return new Error(`Pedido recusado pela API: ${e.message}`);
  if (e instanceof Anthropic.APIConnectionError) return new Error('Sem conexão com a API da Anthropic.');
  if (e instanceof Anthropic.APIError) return new Error(`Erro da API (${e.status}): ${e.message}`);
  return e instanceof Error ? e : new Error(String(e));
}

const cliente = (apiKey: string) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

export async function analisarClaude(p: PedidoAnalise, apiKey: string): Promise<ResultadoIA> {
  try {
    const data = await blobParaBase64(p.imagem);
    const r = await cliente(apiKey).beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(EsquemaAnalise) },
      system: await instrucaoAnalise(p.tipoLaudo),
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipoImagem(p.imagem), data } },
          { type: 'text', text: `Contexto do engenheiro: ${p.contexto || '—'}\nAnalise a foto.` },
        ],
      }],
    });
    if (r.stop_reason === 'refusal') throw new Error('A IA não analisou esta foto. Preencha manualmente.');
    if (!r.parsed_output) throw new Error('A resposta da IA veio incompleta. Tente de novo.');
    const o = r.parsed_output;
    return {
      ...o,
      achados: o.achados.map((a) => ({ ...a, confianca: Math.max(0, Math.min(1, a.confianca)), regiao: a.regiao ?? undefined, aberturaMm: a.aberturaMm && a.aberturaMm > 0 ? a.aberturaMm : undefined })),
    };
  } catch (e) { throw erroLegivel(e); }
}

export async function conclusaoClaude(resumo: string, apiKey: string): Promise<string> {
  try {
    const r = await cliente(apiKey).beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: await lerPrompt('conclusao'),
      messages: [{ role: 'user', content: `Escreva a conclusão do laudo a partir deste resumo:\n\n${resumo}` }],
    });
    if (r.stop_reason === 'refusal') throw new Error('A IA não gerou a conclusão. Escreva manualmente.');
    return r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
  } catch (e) { throw erroLegivel(e); }
}

/** Conversa da Lia (assistente). */
export async function conversarClaude(sistema: string, conversa: { de: 'voce' | 'lia'; texto: string }[], apiKey: string): Promise<string> {
  try {
    const r = await cliente(apiKey).beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: sistema,
      messages: conversa.map((m) => ({ role: m.de === 'voce' ? 'user' as const : 'assistant' as const, content: m.texto })),
    });
    if (r.stop_reason === 'refusal') return 'Prefiro não responder essa. Posso ajudar com o laudo?';
    return r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
  } catch (e) { throw erroLegivel(e); }
}

export async function testarChave(apiKey: string): Promise<void> {
  try {
    await cliente(apiKey).models.retrieve(MODELO);
  } catch (e) { throw erroLegivel(e); }
}

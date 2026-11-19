import { ApiError, GoogleGenAI } from '@google/genai';
import { SISTEMAS, TIPOS_ANOMALIA, type Gravidade } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { blobParaBase64 } from '../lib/imagem';
import type { PedidoAnalise, ResultadoIA } from './tipos';

/**
 * Motor Gemini (Google). Tem faixa GRÁTIS na API para os modelos Flash — bom para testar.
 * Atenção: no plano grátis o Google pode usar os dados para melhorar os produtos dele;
 * para fotos de clientes em produção, use o plano pago (ou outro motor) e o backend.
 * Chamado direto do navegador com a chave da pessoa (só nesta versão de teste).
 */

export const MODELOS_GEMINI = [
  { id: 'gemini-2.5-flash', nome: 'Gemini 2.5 Flash', nota: 'recomendado no grátis' },
  { id: 'gemini-2.5-flash-lite', nome: 'Gemini 2.5 Flash-Lite', nota: 'mais rápido, mais limite' },
  { id: 'gemini-3.5-flash', nome: 'Gemini 3.5 Flash', nota: 'mais novo (confira se o seu plano cobre)' },
];
export const MODELO_GEMINI_PADRAO = 'gemini-2.5-flash';

const GRAUS: Gravidade[] = ['critico', 'medio', 'minimo'];

/** Formato da resposta (JSON Schema): o Gemini devolve exatamente isto. */
const ESQUEMA = {
  type: 'object',
  properties: {
    ambiente: { type: 'string', description: 'Ambiente: Sala, Cozinha, Banheiro, Fachada, Garagem… ou "Documento"' },
    elemento: { type: 'string', description: 'Elemento principal: Parede, Teto, Piso, Viga, Esquadria…' },
    legenda: { type: 'string', description: 'Legenda técnica curta para a foto no laudo' },
    semAnomalia: { type: 'boolean', description: 'true se não há anomalia aparente' },
    achados: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: { type: 'string', description: `Um destes: ${TIPOS_ANOMALIA.join(', ')}` },
          sistema: { type: 'string', description: `Um destes: ${SISTEMAS.join(', ')}` },
          descricao: { type: 'string', description: 'O que se vê: forma, direção, extensão, abertura estimada' },
          gravidade: { type: 'string', enum: GRAUS },
          causaProvavel: { type: 'string' },
          recomendacao: { type: 'string' },
          confianca: { type: 'number', description: '0 a 1: certeza vendo só a foto' },
          regiao: {
            type: 'object',
            description: 'Caixa aproximada do achado em % da imagem (0–100); x,y = canto superior esquerdo',
            properties: { x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } },
            required: ['x', 'y', 'w', 'h'],
          },
        },
        required: ['tipo', 'sistema', 'descricao', 'gravidade', 'causaProvavel', 'recomendacao', 'confianca'],
      },
    },
  },
  required: ['ambiente', 'elemento', 'legenda', 'semAnomalia', 'achados'],
};

function instrucao(tipoLaudo: PedidoAnalise['tipoLaudo']) {
  const t = TIPOS[tipoLaudo];
  return [
    'Você é um engenheiro civil perito que ajuda a montar laudos técnicos no Brasil.',
    `Tipo de laudo: ${t.nome}. Normas de referência: ${t.normas.join('; ')}.`,
    'Analise UMA foto da vistoria e devolva o que se vê, em português do Brasil, com vocabulário técnico de patologia das construções.',
    'Grau de risco: "critico" = risco à segurança, saúde ou funcionamento (Prioridade 1); "medio" = perda parcial de desempenho (Prioridade 2); "minimo" = estético/manutenção (Prioridade 3).',
    'Descreva apenas o que é visível. Não invente medidas: quando estimar, diga "estimada". Se não houver anomalia aparente, use semAnomalia=true e achados=[].',
    'Foto de documento (laudo contábil): ambiente="Documento", descreva o documento na legenda e deixe achados vazio.',
    'O engenheiro vai conferir tudo; seja objetivo e não exagere a gravidade.',
  ].join('\n');
}

function erroLegivel(e: unknown): Error {
  if (e instanceof ApiError) {
    const m = e.message || '';
    if (e.status === 400 && /api key|API_KEY/i.test(m)) return new Error('Chave do Gemini inválida. Confira em Ajustes › IA.');
    if (e.status === 403) return new Error('A chave do Gemini não tem permissão (ative a Generative Language API no projeto).');
    if (e.status === 404) return new Error('Modelo do Gemini não encontrado. Escolha outro em Ajustes › IA.');
    if (e.status === 429) return new Error('Limite grátis do Gemini atingido. Espere um minuto e toque em "Analisar de novo".');
    if (e.status >= 500) return new Error('O Gemini está instável agora. Tente de novo em instantes.');
    return new Error(`Erro do Gemini (${e.status}): ${m.slice(0, 160)}`);
  }
  if (e instanceof TypeError) return new Error('Sem conexão com o Gemini.');
  return e instanceof Error ? e : new Error(String(e));
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Repete em caso de limite (429) ou instabilidade (5xx): o plano grátis tem limite por minuto. */
async function comRepeticao<T>(fn: () => Promise<T>): Promise<T> {
  const pausas = [5000, 15000];
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      const repetir = e instanceof ApiError && (e.status === 429 || e.status >= 500);
      if (!repetir || i >= pausas.length) throw erroLegivel(e);
      await espera(pausas[i]);
    }
  }
}

const cliente = (apiKey: string) => new GoogleGenAI({ apiKey });
const numero = (v: unknown, padrao = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : padrao);
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const pct = (v: unknown) => Math.max(0, Math.min(100, numero(v)));

/** Confere e limpa a resposta antes de entrar no laudo. */
function limpar(bruto: unknown): ResultadoIA {
  const o = (bruto ?? {}) as Record<string, unknown>;
  const achados = Array.isArray(o.achados) ? o.achados : [];
  const lista = achados.map((x) => {
    const a = (x ?? {}) as Record<string, unknown>;
    const g = GRAUS.includes(a.gravidade as Gravidade) ? (a.gravidade as Gravidade) : 'minimo';
    const r = a.regiao as Record<string, unknown> | undefined;
    const regiao = r && typeof r === 'object' ? { x: pct(r.x), y: pct(r.y), w: pct(r.w), h: pct(r.h) } : undefined;
    return {
      tipo: texto(a.tipo) || 'Outro', sistema: texto(a.sistema) || 'Vedações', descricao: texto(a.descricao),
      gravidade: g, causaProvavel: texto(a.causaProvavel), recomendacao: texto(a.recomendacao),
      confianca: Math.max(0, Math.min(1, numero(a.confianca, 0.5))),
      regiao: regiao && regiao.w > 1 && regiao.h > 1 ? regiao : undefined,
    };
  }).filter((a) => a.descricao || a.tipo !== 'Outro');
  return {
    ambiente: texto(o.ambiente) || 'Ambiente', elemento: texto(o.elemento), legenda: texto(o.legenda),
    semAnomalia: lista.length === 0, achados: lista,
  };
}

export async function analisarGemini(p: PedidoAnalise, apiKey: string, modelo = MODELO_GEMINI_PADRAO): Promise<ResultadoIA> {
  const data = await blobParaBase64(p.imagem);
  const r = await comRepeticao(() => cliente(apiKey).models.generateContent({
    model: modelo,
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data } },
        { text: `Contexto do engenheiro: ${p.contexto || '—'}\nAnalise a foto.` },
      ],
    }],
    config: { systemInstruction: instrucao(p.tipoLaudo), responseMimeType: 'application/json', responseJsonSchema: ESQUEMA, temperature: 0.2 },
  }));
  const bruto = r.text;
  if (!bruto) throw new Error('O Gemini não respondeu sobre esta foto (pode ter sido bloqueada pelo filtro de segurança). Preencha manualmente.');
  try { return limpar(JSON.parse(bruto)); } catch { throw new Error('A resposta do Gemini veio fora do formato. Toque em "Analisar de novo".'); }
}

export async function conclusaoGemini(resumo: string, apiKey: string, modelo = MODELO_GEMINI_PADRAO): Promise<string> {
  const r = await comRepeticao(() => cliente(apiKey).models.generateContent({
    model: modelo,
    contents: `Escreva a conclusão do laudo a partir deste resumo:\n\n${resumo}`,
    config: { systemInstruction: 'Você redige a conclusão de laudos técnicos de engenharia no Brasil: texto corrido, formal, impessoal, 1 a 3 parágrafos, sem títulos nem listas, sem inventar fatos além do resumo dado.', temperature: 0.3 },
  }));
  const t = r.text?.trim();
  if (!t) throw new Error('O Gemini não gerou a conclusão. Escreva manualmente.');
  return t;
}

export async function conversarGemini(sistema: string, conversa: { de: 'voce' | 'lia'; texto: string }[], apiKey: string, modelo = MODELO_GEMINI_PADRAO): Promise<string> {
  const r = await comRepeticao(() => cliente(apiKey).models.generateContent({
    model: modelo,
    contents: conversa.map((m) => ({ role: m.de === 'voce' ? 'user' : 'model', parts: [{ text: m.texto }] })),
    config: { systemInstruction: sistema, temperature: 0.4 },
  }));
  return r.text?.trim() || 'Não consegui responder agora. Tente de novo?';
}

/** Testa a chave pedindo os dados do modelo escolhido (não gasta cota de geração). */
export async function testarChaveGemini(apiKey: string, modelo = MODELO_GEMINI_PADRAO): Promise<void> {
  try { await cliente(apiKey).models.get({ model: modelo }); } catch (e) { throw erroLegivel(e); }
}

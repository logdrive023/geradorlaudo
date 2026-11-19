import type { PedidoAnalise, ResultadoIA } from './tipos';
import { instrucaoAnalise, lerPrompt } from './instrucoes';

/**
 * Motor "Servidor LaudoTech": o app chama a API Go (backend/) e a chave da IA fica só no servidor.
 * Contrato da resposta: analise-foto.v1 (backend/contratos).
 */

// Sem VITE_API_URL: em produção, a API no Render; em desenvolvimento, a API local.
export const SERVIDOR_PADRAO = (import.meta.env.VITE_API_URL as string | undefined)
  || (import.meta.env.PROD ? 'https://laudotech-api.onrender.com' : 'http://localhost:8080');

export interface Envelope { versao: string; origem: string; modelo: string; analise: ResultadoIA }

async function chamar<T>(base: string, caminho: string, init: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${base.replace(/\/$/, '')}${caminho}`, init);
  } catch {
    throw new Error('Não deu para falar com o servidor. Confira o endereço em Ajustes › IA (o plano grátis do Render pode levar ~1 min para acordar).');
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((corpo as { erro?: string }).erro || `Servidor respondeu ${r.status}.`);
  return corpo as T;
}

export async function analisarServidor(p: PedidoAnalise, base: string): Promise<Envelope> {
  const f = new FormData();
  f.append('imagem', p.imagem, 'foto');
  f.append('tipoLaudo', p.tipoLaudo);
  f.append('contexto', p.contexto);
  f.append('instrucao', await instrucaoAnalise(p.tipoLaudo)); // prompt editado em Ajustes › Prompts da IA
  return chamar<Envelope>(base, '/api/ia/analisar', { method: 'POST', body: f });
}

export async function conclusaoServidor(resumo: string, base: string): Promise<string> {
  const r = await chamar<{ texto: string }>(base, '/api/ia/conclusao', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumo, instrucao: await lerPrompt('conclusao') }),
  });
  return r.texto;
}

export async function conversarServidor(instrucao: string, conversa: { de: 'voce' | 'lia'; texto: string }[], base: string): Promise<string> {
  const r = await chamar<{ texto: string }>(base, '/api/ia/lia', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instrucao, conversa }),
  });
  return r.texto;
}

export async function saudeServidor(base: string): Promise<{ ia: string; modelo: string; versao: string }> {
  return chamar(base, '/api/health', { method: 'GET' });
}

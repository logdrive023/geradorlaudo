import { instrucaoLia } from './instrucoes';
import { db, fotosDoLaudo, lerConfig } from '../db/db';
import { GRAVIDADE } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { achadosValidos, progressoFotos, resumoAchados, revisarLaudo } from '../dominio/regras';

export interface MensagemLia { de: 'voce' | 'lia'; texto: string }

/** O que a Lia sabe do laudo aberto (vai como contexto para a IA). */
async function contextoDoLaudo(laudoId?: string): Promise<{ texto: string; pendencias: string[] } | null> {
  if (!laudoId) return null;
  const laudo = await db.laudos.get(laudoId);
  if (!laudo) return null;
  const fotos = await fotosDoLaudo(laudoId);
  const autor = await db.usuarios.get(laudo.usuarioId);
  const r = resumoAchados(fotos);
  const p = progressoFotos(fotos);
  const pend = revisarLaudo(laudo, fotos, autor).filter((i) => !i.ok).map((i) => i.texto);
  const achados = fotos.flatMap((f, i) => achadosValidos(f).map((a) => `Foto ${i + 1} (${f.analise?.ambiente}): ${a.tipo}, ${GRAVIDADE[a.gravidade].nome}. ${a.descricao}`));
  return {
    pendencias: pend,
    texto: [
      `Laudo aberto: "${laudo.titulo}" — ${TIPOS[laudo.tipo].nome}. Endereço: ${laudo.dados.endereco || '—'}.`,
      `Fotos: ${p.total} (analisadas ${p.analisadas}, conferidas ${p.conferidas}). Achados aceitos: ${r.total} (críticos ${r.critico}, médios ${r.medio}, mínimos ${r.minimo}).`,
      achados.length ? `Achados:\n${achados.join('\n')}` : '',
      pend.length ? `Pendências para assinar: ${pend.join('; ')}` : 'Sem pendências para assinar.',
    ].filter(Boolean).join('\n'),
  };
}

/* ---------- respostas sem IA (modo demonstração) ---------- */
const BASE: [RegExp, string][] = [
  [/risco|grav|critic|prioridad|classific/i, 'Uso o grau de risco da inspeção predial (IBAPE / NBR 16747):\n• Crítico (Prioridade 1): risco à segurança, saúde ou funcionamento. Corrigir já.\n• Médio (Prioridade 2): perda parcial de desempenho. Programar.\n• Mínimo (Prioridade 3): estético ou manutenção.\nVocê pode mudar o grau de qualquer achado na aba Conferir.'],
  [/norma|nbr|abnt/i, 'Depende do tipo de laudo:\n• Cautelar: NBR 13752 e NBR 12722.\n• Inspeção predial: NBR 16747 e NBR 5674.\n• Extrajudicial: NBR 13752 e NBR 15575.\n• Contábil: NBC TP 01.\nElas aparecem na seção "Metodologia" do laudo.'],
  [/ia de verdade|chave|claude|gemini|api|ligar/i, 'Vá em Ajustes › IA e escolha Gemini (tem faixa grátis) ou Claude, e cole a chave. Eu testo a chave antes de salvar. Sem chave, fico no modo demonstração, com análise simulada.'],
  [/pdf|word|imprim|export|entreg/i, 'Na aba Laudo: "Imprimir / salvar PDF" abre a impressão (escolha "Salvar como PDF") e "Baixar Word" gera um .doc editável.'],
  [/art|rrt|assin|registro|crea/i, 'O laudo só fica pronto com seu registro profissional (Configurações › Perfil) e o número da ART/RRT (aba Dados). Também dá para enviar a imagem da sua assinatura no perfil.'],
  [/foto|subir|enviar|camera|câmera/i, 'Na aba Fotos, solte todas as fotos de uma vez ou use "Tirar foto" no celular. Eu reduzo o tamanho, guardo a data e o GPS e analiso 3 por vez.'],
  [/conferir|aceit|descart|marc/i, 'Na aba Conferir, cada achado tem Aceitar e Descartar. Dá para mudar o tipo, o grau e a recomendação, e "Marcar na foto" para redesenhar a caixa. Só entra no laudo o que você aceitou.'],
  [/voz|ditar|falar/i, 'Na aba Conferir, toque em "Ditar" na sua observação e fale. Funciona no Chrome e no Edge.'],
  [/backup|dados|salv|perder/i, 'Tudo fica salvo neste navegador, automaticamente. Para guardar ou levar para outro computador, use Configurações › Dados › Exportar backup.'],
];

function responderSemIA(pergunta: string, ctx: Awaited<ReturnType<typeof contextoDoLaudo>>): string {
  if (/falta|pend|pronto|assinar/i.test(pergunta) && ctx) {
    return ctx.pendencias.length ? `Para assinar, falta:\n• ${ctx.pendencias.join('\n• ')}` : 'Nada! Está tudo pronto para assinar. Confira a prévia e gere o PDF.';
  }
  for (const [re, r] of BASE) if (re.test(pergunta)) return r;
  if (ctx) return `Sobre este laudo:\n${ctx.texto}\n\nNo modo demonstração eu respondo só o básico. Ligue a IA em Configurações › IA para conversar de verdade.`;
  return 'No modo demonstração eu sei responder sobre: grau de risco, normas, fotos, conferência, ART, PDF/Word e backup. Para conversar sobre qualquer coisa, ligue a IA em Configurações › IA.';
}

export async function perguntarLia(conversa: MensagemLia[], laudoId?: string): Promise<string> {
  const ctx = await contextoDoLaudo(laudoId);
  const cfg = await lerConfig();
  const ultima = conversa[conversa.length - 1]?.texto ?? '';
  const comGemini = cfg.motorIA === 'gemini' && !!cfg.geminiKey;
  const comServidor = cfg.motorIA === 'servidor';
  if (!comGemini && !comServidor && (cfg.motorIA !== 'claude' || !cfg.apiKey)) {
    await new Promise((r) => setTimeout(r, 500));
    return responderSemIA(ultima, ctx);
  }
  const sistema = await instrucaoLia(ctx?.texto);
  if (comServidor) {
    const { conversarServidor, SERVIDOR_PADRAO } = await import('./servidor');
    return conversarServidor(sistema, conversa, cfg.servidorUrl || SERVIDOR_PADRAO);
  }
  if (comGemini) {
    const { conversarGemini } = await import('./gemini');
    return conversarGemini(sistema, conversa, cfg.geminiKey!, cfg.geminiModelo);
  }
  const { conversarClaude } = await import('./claude');
  return conversarClaude(sistema, conversa, cfg.apiKey);
}

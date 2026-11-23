import { db, fotosDoLaudo, lerConfig, tocarLaudo } from '../db/db';
import type { Analise, Foto, Laudo, ResumoIA } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { conclusaoPadrao, porAmbiente, resumoAchados, achadosValidos } from '../dominio/regras';
import { novoId } from '../lib/util';
import { analisarDemo } from './demo';
import type { ResultadoIA } from './tipos';

type Saida = { r: ResultadoIA; origem: Analise['origem']; contrato?: string; ia?: string; modelo?: string };

/**
 * Várias IAs no servidor: cada uma ligada analisa a mesma foto e os achados vêm juntos, marcados com a IA.
 * Com 1 IA (o normal) é exatamente a chamada de sempre.
 */
async function analisarVarias(pedido: Parameters<typeof import('./servidor').analisarServidor>[0], base: string, ias: string[]) {
  const { analisarServidor } = await import('./servidor');
  const res = await Promise.allSettled(ias.map((ia) => analisarServidor(pedido, base, ia)));
  const ok = res.flatMap((x, i) => (x.status === 'fulfilled' ? [{ ia: ias[i], env: x.value }] : []));
  if (!ok.length) throw (res[0] as PromiseRejectedResult).reason ?? new Error('Nenhuma IA respondeu.');
  const porIA: ResumoIA[] = res.map((x, i) => x.status === 'fulfilled'
    ? { ia: ias[i], modelo: x.value.modelo, ambiente: x.value.analise.ambiente, elemento: x.value.analise.elemento, legenda: x.value.analise.legenda, achados: x.value.analise.achados.length }
    : { ia: ias[i], erro: (x.reason as Error)?.message ?? 'falhou' });
  const base0 = ok[0].env.analise;
  const achados = ok.flatMap(({ ia, env }) => env.analise.achados.map((a) => ({ ...a, ia })));
  const r: ResultadoIA = { ...base0, achados, semAnomalia: achados.length === 0 };
  return { r, porIA, contrato: ok[0].env.versao };
}

/** Ponto único de entrada da IA: escolhe o motor pela configuração. */
async function analisar(laudo: Laudo, foto: Foto): Promise<Saida & { porIA?: ResumoIA[] }> {
  const cfg = await lerConfig();
  const contexto = [
    laudo.dados.endereco && `Imóvel: ${laudo.dados.endereco}`,
    foto.analise?.ambiente && `Ambiente anotado: ${foto.analise.ambiente}`,
    foto.observacao && `Observação: ${foto.observacao}`,
  ].filter(Boolean).join('. ');
  if (cfg.motorIA === 'servidor') {
    const { analisarServidor, SERVIDOR_PADRAO } = await import('./servidor');
    const base = cfg.servidorUrl || SERVIDOR_PADRAO;
    const pedido = { imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto };
    const ias = cfg.iasLigadas ?? [];
    if (ias.length > 1) return { ...(await analisarVarias(pedido, base, ias)), origem: 'servidor' };
    const env = await analisarServidor(pedido, base, ias[0]);
    return { r: env.analise, origem: 'servidor', contrato: env.versao, ia: (env as { origem?: string }).origem };
  }
  if (cfg.motorIA === 'gemini' && cfg.geminiKey) {
    const { analisarGemini } = await import('./gemini'); // só carrega o SDK quando usado
    return { r: await analisarGemini({ imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto }, cfg.geminiKey, cfg.geminiModelo), origem: 'gemini' };
  }
  if (cfg.motorIA === 'claude' && cfg.apiKey) {
    const { analisarClaude } = await import('./claude'); // só carrega o SDK quando usado
    return { r: await analisarClaude({ imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto }, cfg.apiKey), origem: 'claude' };
  }
  return { r: await analisarDemo({ imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto }), origem: 'demo' };
}

/** Analisa uma foto. Devolve true quando as fotos com IA do plano acabaram (aí a fila para). */
export async function analisarFoto(laudo: Laudo, fotoId: string): Promise<boolean> {
  const foto = await db.fotos.get(fotoId);
  if (!foto) return false;
  emAnalise.add(fotoId);
  await db.fotos.update(fotoId, { status: 'analisando', erro: undefined });
  try {
    const { r, origem, contrato, ia, porIA } = await analisar(laudo, foto);
    const analise: Analise = {
      ambiente: r.ambiente, elemento: r.elemento, legenda: r.legenda, semAnomalia: r.semAnomalia,
      qualidadeFoto: r.qualidadeFoto, contrato: contrato ?? 'analise-foto.v1',
      achados: r.achados.map((a) => ({ ...a, id: novoId(), aceito: null, origem, ia: a.ia ?? ia })),
      origem, analisadoEm: Date.now(), ...(porIA ? { porIA } : {}),
    };
    await db.fotos.update(fotoId, { status: 'analisada', analise });
    return false;
  } catch (e) {
    const semFotos = (e as Error)?.name === 'ErroSemFotos';
    // sem fotos no plano: a foto volta para a fila (analisa depois de comprar um pacote ou no mês que vem)
    await db.fotos.update(fotoId, { status: semFotos ? 'pendente' : 'erro', erro: (e as Error).message });
    if (semFotos) void import('../db/organizacao').then((m) => m.esquecerFotos());
    return semFotos;
  } finally {
    emAnalise.delete(fotoId);
  }
}

/** Fotos sendo analisadas agora neste aparelho (as outras "analisando" ficaram presas). */
const emAnalise = new Set<string>();

/** Analisa as fotos pendentes, 3 por vez (2 no Gemini grátis, que tem limite por minuto). */
export async function analisarPendentes(laudo: Laudo, aoAvancar?: (feitas: number, total: number) => void) {
  // "analisando" sem análise rodando neste aparelho = ficou presa (o app fechou no meio): entra de novo
  const fila = (await fotosDoLaudo(laudo.id)).filter((f) => f.status === 'pendente' || f.status === 'erro' || (f.status === 'analisando' && !emAnalise.has(f.id)));
  let feitas = 0;
  let semFotos = false;
  const trabalhador = async () => {
    for (let f = fila.shift(); f && !semFotos; f = fila.shift()) {
      if (await analisarFoto(laudo, f.id)) { semFotos = true; fila.length = 0; break; } // acabaram as fotos do plano: para
      aoAvancar?.(++feitas, feitas + fila.length);
    }
  };
  const cfg = await lerConfig();
  const vezes = cfg.motorIA === 'gemini' || cfg.motorIA === 'servidor' ? 2 : 3;
  await Promise.all(Array.from({ length: vezes }, trabalhador));
  if (laudo.status === 'rascunho') await tocarLaudo(laudo.id, { status: 'conferencia' });
}

export async function gerarConclusao(laudo: Laudo): Promise<string> {
  const fotos = await fotosDoLaudo(laudo.id);
  const cfg = await lerConfig();
  const comGemini = cfg.motorIA === 'gemini' && !!cfg.geminiKey;
  const comClaude = cfg.motorIA === 'claude' && !!cfg.apiKey;
  const comServidor = cfg.motorIA === 'servidor';
  if (!comGemini && !comClaude && !comServidor) return conclusaoPadrao(laudo, fotos);
  const r = resumoAchados(fotos);
  const linhas = porAmbiente(fotos).map(([amb, fs]) => {
    const itens = fs.flatMap(achadosValidos).map((a) => `${a.tipo} (${a.gravidade}): ${a.descricao}. Recomendação: ${a.recomendacao}`);
    return `- ${amb}: ${itens.length ? itens.join(' | ') : 'sem anomalias aparentes'}`;
  });
  const resumo = [
    `Tipo: ${TIPOS[laudo.tipo].nome}`,
    `Endereço: ${laudo.dados.endereco || '—'}`,
    `Estado de conservação informado: ${laudo.dados.conservacao || '—'}`,
    `Fotos: ${fotos.length}. Achados aceitos: ${r.total} (críticos ${r.critico}, médios ${r.medio}, mínimos ${r.minimo}).`,
    'Por ambiente:', ...linhas,
  ].join('\n');
  if (comServidor) {
    const { conclusaoServidor, SERVIDOR_PADRAO } = await import('./servidor');
    return conclusaoServidor(resumo, cfg.servidorUrl || SERVIDOR_PADRAO);
  }
  if (comGemini) {
    const { conclusaoGemini } = await import('./gemini');
    return conclusaoGemini(resumo, cfg.geminiKey!, cfg.geminiModelo);
  }
  const { conclusaoClaude } = await import('./claude');
  return conclusaoClaude(resumo, cfg.apiKey);
}

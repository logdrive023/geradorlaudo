import { db, fotosDoLaudo, lerConfig, tocarLaudo } from '../db/db';
import type { Analise, Foto, Laudo } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { conclusaoPadrao, porAmbiente, resumoAchados, achadosValidos } from '../dominio/regras';
import { novoId } from '../lib/util';
import { analisarDemo } from './demo';
import type { ResultadoIA } from './tipos';

/** Ponto único de entrada da IA: escolhe o motor pela configuração. */
async function analisar(laudo: Laudo, foto: Foto): Promise<{ r: ResultadoIA; origem: Analise['origem'] }> {
  const cfg = await lerConfig();
  const contexto = [
    laudo.dados.endereco && `Imóvel: ${laudo.dados.endereco}`,
    foto.analise?.ambiente && `Ambiente anotado: ${foto.analise.ambiente}`,
    foto.observacao && `Observação: ${foto.observacao}`,
  ].filter(Boolean).join('. ');
  if (cfg.motorIA === 'claude' && cfg.apiKey) {
    const { analisarClaude } = await import('./claude'); // só carrega o SDK quando usado
    return { r: await analisarClaude({ imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto }, cfg.apiKey), origem: 'claude' };
  }
  return { r: await analisarDemo({ imagem: foto.imagem, tipoLaudo: laudo.tipo, contexto }), origem: 'demo' };
}

export async function analisarFoto(laudo: Laudo, fotoId: string) {
  const foto = await db.fotos.get(fotoId);
  if (!foto) return;
  await db.fotos.update(fotoId, { status: 'analisando', erro: undefined });
  try {
    const { r, origem } = await analisar(laudo, foto);
    const analise: Analise = {
      ambiente: r.ambiente, elemento: r.elemento, legenda: r.legenda, semAnomalia: r.semAnomalia,
      achados: r.achados.map((a) => ({ ...a, id: novoId(), aceito: null, origem })),
      origem, analisadoEm: Date.now(),
    };
    await db.fotos.update(fotoId, { status: 'analisada', analise });
  } catch (e) {
    await db.fotos.update(fotoId, { status: 'erro', erro: (e as Error).message });
  }
}

/** Analisa as fotos pendentes, 3 por vez. */
export async function analisarPendentes(laudo: Laudo, aoAvancar?: (feitas: number, total: number) => void) {
  const fila = (await fotosDoLaudo(laudo.id)).filter((f) => f.status === 'pendente' || f.status === 'erro');
  let feitas = 0;
  const trabalhador = async () => {
    for (let f = fila.shift(); f; f = fila.shift()) {
      await analisarFoto(laudo, f.id);
      aoAvancar?.(++feitas, feitas + fila.length);
    }
  };
  await Promise.all([trabalhador(), trabalhador(), trabalhador()]);
  if (laudo.status === 'rascunho') await tocarLaudo(laudo.id, { status: 'conferencia' });
}

export async function gerarConclusao(laudo: Laudo): Promise<string> {
  const fotos = await fotosDoLaudo(laudo.id);
  const cfg = await lerConfig();
  if (cfg.motorIA !== 'claude' || !cfg.apiKey) return conclusaoPadrao(laudo, fotos);
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
  const { conclusaoClaude } = await import('./claude');
  return conclusaoClaude(resumo, cfg.apiKey);
}

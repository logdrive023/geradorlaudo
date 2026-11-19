import { GRAVIDADE, type Achado, type Foto, type Gravidade, type Laudo, type Usuario } from './modelo';
import { TIPOS, camposObrigatorios } from './tipos';

/** Achados que entram no laudo: os aceitos pelo engenheiro (os ainda não conferidos não entram). */
export function achadosValidos(f: Foto): Achado[] {
  return (f.analise?.achados ?? []).filter((a) => a.aceito === true);
}

export function resumoAchados(fotos: Foto[]) {
  const cont: Record<Gravidade, number> = { critico: 0, medio: 0, minimo: 0 };
  let total = 0;
  for (const f of fotos) for (const a of achadosValidos(f)) { cont[a.gravidade]++; total++; }
  return { ...cont, total };
}

export function progressoFotos(fotos: Foto[]) {
  const analisadas = fotos.filter((f) => f.status === 'analisada' || f.status === 'conferida').length;
  const conferidas = fotos.filter((f) => f.status === 'conferida').length;
  const pendentes = fotos.filter((f) => f.status === 'pendente' || f.status === 'erro').length;
  return { total: fotos.length, analisadas, conferidas, pendentes };
}

/** Agrupa fotos por ambiente, na ordem em que aparecem. */
export function porAmbiente(fotos: Foto[]): [string, Foto[]][] {
  const m = new Map<string, Foto[]>();
  for (const f of fotos) {
    const amb = f.analise?.ambiente?.trim() || 'Sem ambiente';
    m.set(amb, [...(m.get(amb) ?? []), f]);
  }
  return [...m.entries()];
}

export interface ItemRevisao { ok: boolean; texto: string; onde: 'dados' | 'fotos' | 'conferir' | 'laudo' | 'perfil' }

/** "Pronto para assinar?" — confere o que uma norma e um bom laudo exigem. */
export function revisarLaudo(laudo: Laudo, fotos: Foto[], autor?: Usuario): ItemRevisao[] {
  const itens: ItemRevisao[] = [];
  const faltando = camposObrigatorios(laudo.tipo).filter((c) => !laudo.dados[c.chave]?.trim());
  itens.push({
    ok: faltando.length === 0,
    texto: faltando.length ? `Preencher: ${faltando.map((c) => c.rotulo).join(', ')}` : 'Identificação e dados obrigatórios preenchidos',
    onde: 'dados',
  });
  itens.push({ ok: fotos.length > 0, texto: fotos.length ? `${fotos.length} foto(s) no relatório fotográfico` : 'Adicionar as fotos da vistoria', onde: 'fotos' });
  const p = progressoFotos(fotos);
  itens.push({
    ok: fotos.length > 0 && p.conferidas === p.total,
    texto: p.conferidas === p.total && p.total > 0 ? 'Todas as fotos conferidas por você' : `Conferir ${p.total - p.conferidas} foto${p.total - p.conferidas > 1 ? 's' : ''}`,
    onde: 'conferir',
  });
  const criticosSemRec = fotos.flatMap(achadosValidos).filter((a) => a.gravidade === 'critico' && !a.recomendacao.trim());
  itens.push({
    ok: criticosSemRec.length === 0,
    texto: criticosSemRec.length ? `${criticosSemRec.length} achado(s) crítico(s) sem recomendação` : 'Todo achado crítico tem recomendação',
    onde: 'conferir',
  });
  const semLegenda = fotos.filter((f) => !f.analise?.legenda?.trim()).length;
  itens.push({ ok: semLegenda === 0, texto: semLegenda ? `${semLegenda} foto(s) sem legenda` : 'Todas as fotos com legenda', onde: 'conferir' });
  itens.push({ ok: laudo.conclusao.trim().length > 40, texto: laudo.conclusao.trim() ? 'Conclusão escrita' : 'Escrever (ou gerar) a conclusão', onde: 'laudo' });
  itens.push({
    ok: !!(autor?.nome && autor.registro),
    texto: autor?.registro ? 'Responsável técnico com registro profissional' : 'Informar seu registro (CREA/CAU/CRC) no perfil',
    onde: 'perfil',
  });
  return itens;
}

/** Conclusão padrão, montada a partir dos achados aceitos. A IA pode reescrever. */
export function conclusaoPadrao(laudo: Laudo, fotos: Foto[]): string {
  const t = TIPOS[laudo.tipo];
  const r = resumoAchados(fotos);
  const amb = porAmbiente(fotos).map(([a]) => a).filter((a) => a !== 'Sem ambiente');
  const local = laudo.dados.endereco ? ` situado à ${laudo.dados.endereco}` : '';
  if (t.foco === 'documento') {
    return `Com base no exame dos ${fotos.length} documento(s) anexados e nas análises realizadas, conclui-se o exposto nas seções anteriores, que respondem ao objeto da perícia.`;
  }
  if (r.total === 0) {
    return `Na vistoria do imóvel${local}, foram percorridos ${amb.length || 'os'} ambiente(s) acessíveis e registradas ${fotos.length} fotografias. Não foram constatadas anomalias aparentes na data da diligência. O imóvel apresenta estado de conservação ${(laudo.dados.conservacao || 'compatível com sua idade').toLowerCase()}.`;
  }
  const partes = (['critico', 'medio', 'minimo'] as Gravidade[])
    .filter((g) => r[g] > 0)
    .map((g) => `${r[g]} de grau ${GRAVIDADE[g].nome.toLowerCase()}`);
  const base = `Na vistoria do imóvel${local}, foram registradas ${fotos.length} fotografias em ${amb.length} ambiente(s) e constatadas ${r.total} anomalia(s) aparente(s): ${partes.join(', ')}.`;
  const fim = laudo.tipo === 'cautelar'
    ? ' As anomalias descritas são preexistentes ao início da obra vizinha e ficam registradas como referência para comparação futura.'
    : r.critico > 0
      ? ' Recomenda-se tratar imediatamente os itens de Prioridade 1, seguidos dos de Prioridade 2, conforme as recomendações de cada item.'
      : ' Recomenda-se programar a correção dos itens apontados e mantê-los no plano de manutenção.';
  return base + fim;
}

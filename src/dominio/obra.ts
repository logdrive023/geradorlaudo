import { etapasParaTipo, type EtapaModelo, type NivelEtapa } from './etapas';
import { dataLocal } from '../lib/util';

/**
 * Gestão de obras: a obra é um documento só (etapas, diário de obra, financeiro, compras e laudos ligados).
 * Fica no IndexedDB e sobe inteiro para o servidor. As fotos do diário ficam à parte (tabela obraFotos + storage).
 */

export type StatusObra = 'planejamento' | 'andamento' | 'pausada' | 'concluida';
export type Clima = 'sol' | 'nublado' | 'chuva' | 'impraticavel';
export type CategoriaGasto = 'material' | 'mao_de_obra' | 'equipamento' | 'servico' | 'outros';
export type StatusCompra = 'solicitada' | 'cotando' | 'aprovada' | 'comprada' | 'entregue' | 'cancelada';

export interface ItemChecklist { id: string; texto: string; feito: boolean }

export interface Etapa {
  id: string;
  nome: string;
  nivel?: NivelEtapa;                      // crítica / intermediária / simples (vem do modelo; dá para mudar)
  inicioPrev?: string; fimPrev?: string;   // AAAA-MM-DD
  inicioReal?: string; fimReal?: string;
  percentual: number;                      // medição: 0–100
  orcado?: number;                         // R$
  checklist: ItemChecklist[];
}

export interface Diario {
  id: string;
  data: string;                            // AAAA-MM-DD
  clima: { manha: Clima; tarde: Clima };
  equipe: { funcao: string; qtd: number }[];
  atividades: string;
  ocorrencias: string;
  etapaIds: string[];
  fotoIds: string[];
  fechado: boolean;                        // dia assinado/encerrado
  criadoEm: number;
}

export interface Lancamento {
  id: string; data: string; descricao: string; valor: number;
  tipo: 'despesa' | 'receita'; categoria: CategoriaGasto; etapaId?: string; pago: boolean;
}

export interface Cotacao { id: string; fornecedor: string; valor: number; prazo?: string }
export interface Compra {
  id: string; item: string; quantidade: number; unidade: string; etapaId?: string;
  status: StatusCompra; cotacoes: Cotacao[]; escolhida?: string; lancamentoId?: string; criadoEm: number;
}

export type TipoObra = 'construcao' | 'reforma' | 'ampliacao' | 'manutencao' | 'interiores' | 'demolicao';
export type Regime = 'empreitada' | 'administracao' | 'preco_unitario' | 'propria';

/** Ficha da obra (dados cadastrais). Todos opcionais: a obra nasce com o mínimo. */
export interface FichaObra {
  tipo?: TipoObra;
  regime?: Regime;
  area?: number;                           // m² construídos/reformados
  orcamentoPrevisto?: number;              // R$ total previsto (contrato)
  clienteTelefone?: string;
  clienteEmail?: string;
  art?: string;                            // ART / RRT
  alvara?: string;
}

export interface Obra extends FichaObra {
  id: string;
  usuarioId: string;
  nome: string;
  endereco: string;
  cliente: string;
  status: StatusObra;
  inicio?: string; fim?: string;           // previstos
  etapas: Etapa[];
  diarios: Diario[];
  lancamentos: Lancamento[];
  compras: Compra[];
  laudoIds: string[];
  notasInternas?: string;                  // nunca vai para o link do cliente
  criadoEm: number;
  atualizadoEm: number;
  /** versão no servidor em que esta cópia se baseia */
  versao?: number;
}

/** Foto do diário (fica fora do documento: é grande). */
export interface FotoObra { id: string; obraId: string; imagem: Blob; miniatura: Blob; legenda?: string; criadoEm: number }

export const STATUS_OBRA: Record<StatusObra, { nome: string; tom: 'neutro' | 'ok' | 'obra' | 'tinta' | 'critico' }> = {
  planejamento: { nome: 'Planejamento', tom: 'neutro' },
  andamento: { nome: 'Em andamento', tom: 'obra' },
  pausada: { nome: 'Pausada', tom: 'critico' },
  concluida: { nome: 'Concluída', tom: 'ok' },
};

export const CLIMA: Record<Clima, { nome: string; emoji: string }> = {
  sol: { nome: 'Sol', emoji: '☀️' },
  nublado: { nome: 'Nublado', emoji: '⛅' },
  chuva: { nome: 'Chuva', emoji: '🌧️' },
  impraticavel: { nome: 'Impraticável', emoji: '⛔' },
};

export const CATEGORIA: Record<CategoriaGasto, string> = {
  material: 'Material', mao_de_obra: 'Mão de obra', equipamento: 'Equipamento', servico: 'Serviço terceirizado', outros: 'Outros',
};

export const STATUS_COMPRA: Record<StatusCompra, { nome: string; tom: 'neutro' | 'ok' | 'obra' | 'tinta' | 'critico' }> = {
  solicitada: { nome: 'Solicitada', tom: 'neutro' },
  cotando: { nome: 'Cotando', tom: 'tinta' },
  aprovada: { nome: 'Aprovada', tom: 'obra' },
  comprada: { nome: 'Comprada', tom: 'obra' },
  entregue: { nome: 'Entregue', tom: 'ok' },
  cancelada: { nome: 'Cancelada', tom: 'critico' },
};
export const FLUXO_COMPRA: StatusCompra[] = ['solicitada', 'cotando', 'aprovada', 'comprada', 'entregue'];

export const TIPO_OBRA: Record<TipoObra, { nome: string }> = {
  construcao: { nome: 'Construção nova' }, reforma: { nome: 'Reforma' }, ampliacao: { nome: 'Ampliação' },
  manutencao: { nome: 'Manutenção predial' }, interiores: { nome: 'Interiores / acabamento' }, demolicao: { nome: 'Demolição' },
};

export const REGIME: Record<Regime, string> = {
  empreitada: 'Empreitada global (preço fechado)',
  administracao: 'Administração (custo + taxa)',
  preco_unitario: 'Preço unitário (por medição)',
  propria: 'Obra própria',
};


// ---------- cálculos ----------

export const hojeISO = () => dataLocal();
export const diasEntre = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);

/** Pesos das etapas: pelo orçado quando todas têm orçado; senão, peso igual (misturar os dois distorce o avanço). */
const pesosEtapas = (etapas: Etapa[]) => (etapas.every((e) => e.orcado && e.orcado > 0) ? etapas.map((e) => e.orcado!) : etapas.map(() => 1));

/** Avanço físico: média das etapas ponderada pelo orçado (se todas tiverem; senão, peso igual). */
export function avancoFisico(o: Pick<Obra, 'etapas'>): number {
  if (!o.etapas.length) return 0;
  const pesos = pesosEtapas(o.etapas);
  const total = pesos.reduce((s, p) => s + p, 0);
  return Math.round(o.etapas.reduce((s, e, i) => s + (e.percentual || 0) * pesos[i], 0) / total);
}

/** Avanço previsto para hoje, pelo cronograma (linear em cada etapa). */
export function avancoPrevisto(o: Pick<Obra, 'etapas'>, hoje = hojeISO()): number | null {
  const com = o.etapas.filter((e) => e.inicioPrev && e.fimPrev);
  if (!com.length) return null;
  const esperado = (e: Etapa) => {
    if (hoje < e.inicioPrev!) return 0;
    if (hoje >= e.fimPrev!) return 100;
    const dur = Math.max(1, diasEntre(e.inicioPrev!, e.fimPrev!));
    return (diasEntre(e.inicioPrev!, hoje) / dur) * 100;
  };
  const pesos = pesosEtapas(com);
  const total = pesos.reduce((s, p) => s + p, 0);
  return Math.round(com.reduce((s, e, i) => s + esperado(e) * pesos[i], 0) / total);
}

export type SituacaoEtapa = 'nao_iniciada' | 'andamento' | 'concluida' | 'atrasada';
export function situacaoEtapa(e: Etapa, hoje = hojeISO()): SituacaoEtapa {
  if (e.percentual >= 100) return 'concluida';
  if (e.fimPrev && hoje > e.fimPrev) return 'atrasada';
  return e.percentual > 0 || e.inicioReal ? 'andamento' : 'nao_iniciada';
}

export function financeiro(o: Pick<Obra, 'etapas' | 'lancamentos'> & { orcamentoPrevisto?: number }) {
  // orçado: a soma das etapas; sem etapas orçadas, vale o orçamento previsto da ficha
  const porEtapas = o.etapas.reduce((s, e) => s + (e.orcado ?? 0), 0);
  const orcado = porEtapas || o.orcamentoPrevisto || 0;
  const despesas = o.lancamentos.filter((l) => l.tipo === 'despesa');
  const realizado = despesas.reduce((s, l) => s + l.valor, 0);
  const aPagar = despesas.filter((l) => !l.pago).reduce((s, l) => s + l.valor, 0);
  const recebido = o.lancamentos.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const porEtapa = o.etapas.map((e) => ({
    etapa: e, orcado: e.orcado ?? 0, realizado: despesas.filter((l) => l.etapaId === e.id).reduce((s, l) => s + l.valor, 0),
  }));
  const semEtapa = despesas.filter((l) => !l.etapaId || !o.etapas.some((e) => e.id === l.etapaId)).reduce((s, l) => s + l.valor, 0);
  const porCategoria = (Object.keys(CATEGORIA) as CategoriaGasto[]).map((c) => ({ c, valor: despesas.filter((l) => l.categoria === c).reduce((s, l) => s + l.valor, 0) })).filter((x) => x.valor > 0);
  return { orcado, realizado, aPagar, recebido, saldo: orcado - realizado, porEtapa, semEtapa, porCategoria };
}

export const melhorCotacao = (c: Compra) => [...c.cotacoes].sort((a, b) => a.valor - b.valor)[0];

/** Resumo para cartões e painel. */
export function resumoObra(o: Obra) {
  const fis = avancoFisico(o);
  const prev = avancoPrevisto(o);
  return {
    fisico: fis, previsto: prev, desvio: prev == null ? null : fis - prev,
    atrasadas: o.etapas.filter((e) => situacaoEtapa(e) === 'atrasada').length,
    diarios: o.diarios.length, ultimoDiario: [...o.diarios].sort((a, b) => b.data.localeCompare(a.data))[0],
    comprasAbertas: o.compras.filter((c) => !['entregue', 'cancelada'].includes(c.status)).length,
    fin: financeiro(o),
  };
}

export type DadosNovaObra = FichaObra & { nome: string; endereco: string; cliente: string; inicio?: string; fim?: string; comEtapas: boolean };

/** Etapas para a obra nova, a partir dos modelos configurados (datas espalhadas no prazo, se houver). */
export function etapasDoTipo(modelos: EtapaModelo[], tipo: TipoObra | undefined, novoId: () => string, inicio?: string, fim?: string): Etapa[] {
  const lista = etapasParaTipo(modelos, tipo);
  const total = inicio && fim ? Math.max(1, diasEntre(inicio, fim)) : 0;
  const dia = (n: number) => { const d = new Date(`${inicio}T12:00:00`); d.setDate(d.getDate() + n); return dataLocal(d); };
  return lista.map((e, i) => ({
    id: novoId(), nome: e.nome, nivel: e.nivel, percentual: 0, checklist: e.checklist.map((t) => ({ id: novoId(), texto: t, feito: false })),
    ...(total ? { inicioPrev: dia(Math.round((i * total) / lista.length)), fimPrev: dia(Math.round(((i + 1) * total) / lista.length)) } : {}),
  }));
}

export function obraNova(id: string, usuarioId: string, d: DadosNovaObra, novoId: () => string, modelos: EtapaModelo[]): Obra {
  const agora = Date.now();
  const { comEtapas, nome, endereco, cliente, inicio, fim, ...ficha } = d;
  return {
    ...ficha, id, usuarioId, nome: nome.trim(), endereco: endereco.trim(), cliente: cliente.trim(), status: inicio && inicio > hojeISO() ? 'planejamento' : 'andamento',
    inicio: inicio || undefined, fim: fim || undefined,
    etapas: comEtapas ? etapasDoTipo(modelos, d.tipo, novoId, inicio || undefined, fim || undefined) : [],
    diarios: [], lancamentos: [], compras: [], laudoIds: [], criadoEm: agora, atualizadoEm: agora,
  };
}

/** Dias da obra decorridos e previstos (para a barra de prazo). */
export function prazoObra(o: Pick<Obra, 'inicio' | 'fim'>, hoje = hojeISO()) {
  if (!o.inicio || !o.fim) return null;
  const total = Math.max(1, diasEntre(o.inicio, o.fim));
  const passados = Math.min(total, Math.max(0, diasEntre(o.inicio, hoje)));
  return { total, passados, restantes: diasEntre(hoje, o.fim), pct: Math.round((passados / total) * 100) };
}

/**
 * Resumo da semana para o cliente: avanço, dias trabalhados, o que foi feito e ocorrências dos últimos 7 dias.
 * Só usa o que foi registrado no diário (nada é inventado).
 */
export function resumoSemana(o: Obra, hoje = hojeISO()): string {
  const ini = new Date(`${hoje}T12:00:00`); ini.setDate(ini.getDate() - 6);
  const de = dataLocal(ini);
  const br = (d: string) => d.split('-').reverse().slice(0, 2).join('/');
  const dias = o.diarios.filter((d) => d.data >= de && d.data <= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const real = avancoFisico(o), prev = avancoPrevisto(o, hoje);
  const chuva = dias.filter((d) => [d.clima.manha, d.clima.tarde].some((c) => c === 'chuva' || c === 'impraticavel')).length;
  const equipe = dias.length ? Math.round(dias.reduce((s, d) => s + d.equipe.reduce((x, e) => x + e.qtd, 0), 0) / dias.length) : 0;
  const itens = (campo: 'atividades' | 'ocorrencias') => dias.flatMap((d) => d[campo].split('\n').map((l) => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean).map((l) => `• ${br(d.data)}: ${l}`));
  const etapas = [...new Set(dias.flatMap((d) => d.etapaIds))].map((id) => o.etapas.find((e) => e.id === id)?.nome).filter(Boolean);
  const feito = itens('atividades'), ocorr = itens('ocorrencias');
  return [
    `Resumo da semana — ${o.nome} (${br(de)} a ${br(hoje)})`,
    '',
    `Avanço da obra: ${real}%${prev != null ? ` (previsto para hoje: ${prev}%)` : ''}.`,
    dias.length ? `Dias com registro: ${dias.length}${chuva ? ` · com chuva: ${chuva}` : ''}${equipe ? ` · equipe média: ${equipe} pessoa${equipe > 1 ? 's' : ''} por dia` : ''}.` : 'Sem registros no diário nesta semana.',
    ...(etapas.length ? ['', `Etapas trabalhadas: ${etapas.join(', ')}.`] : []),
    ...(feito.length ? ['', 'O que foi feito:', ...feito] : []),
    ...(ocorr.length ? ['', 'Ocorrências e observações:', ...ocorr] : []),
  ].join('\n');
}

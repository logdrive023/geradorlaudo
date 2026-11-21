import { GRAVIDADE, type Acompanhamento, type Achado, type Foto, type Gravidade, type Laudo, type StatusAcao } from './modelo';
import { dataLocal } from '../lib/util';
import { achadosValidos } from './regras';

/**
 * Plano de ação: o que fazer com cada anomalia depois do laudo (NBR 16747 pede prioridades e prazos).
 * Cada achado aceito vira um item com status, prazo, responsável e custo estimado.
 */

/** Prazo sugerido pela gravidade (dias a partir da vistoria). */
export const PRAZO_DIAS: Record<Gravidade, number> = { critico: 7, medio: 30, minimo: 90 };

export const STATUS_ACAO: Record<StatusAcao, { nome: string; cor: string }> = {
  aberta: { nome: 'A fazer', cor: 'critico' },
  andamento: { nome: 'Em andamento', cor: 'medio' },
  resolvida: { nome: 'Resolvida', cor: 'ok' },
};

export interface ItemPlano { foto: Foto; achado: Achado; numeroFoto: number; acomp: Acompanhamento; prazo: string; atrasado: boolean; gut: Gut; pontos: number }

/** Matriz GUT (padrão IBAPE): Gravidade × Urgência × Tendência, cada uma de 1 a 5 (máximo 125). */
export type Gut = { g: number; u: number; t: number };
export const GUT_SUGERIDA: Record<Gravidade, Gut> = { critico: { g: 5, u: 5, t: 4 }, medio: { g: 3, u: 3, t: 3 }, minimo: { g: 2, u: 2, t: 2 } };
export const GUT_EIXOS: { k: keyof Gut; nome: string; explica: string }[] = [
  { k: 'g', nome: 'Gravidade', explica: '1 sem gravidade · 3 grave · 5 extremamente grave (risco à vida, à estrutura ou ao meio ambiente)' },
  { k: 'u', nome: 'Urgência', explica: '1 pode esperar · 3 o mais cedo possível · 5 ação imediata' },
  { k: 't', nome: 'Tendência', explica: '1 não piora · 3 piora a médio prazo · 5 piora rápido se nada for feito' },
];
export const pontosGut = (x: Gut) => x.g * x.u * x.t;

const iso = (d: Date) => dataLocal(d);

export function prazoSugerido(dataVistoria: string | undefined, g: Gravidade): string {
  const base = dataVistoria ? new Date(`${dataVistoria}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return iso(new Date(Date.now() + PRAZO_DIAS[g] * 864e5));
  base.setDate(base.getDate() + PRAZO_DIAS[g]);
  return iso(base);
}

/** Itens do plano, na ordem de prioridade (crítico primeiro, depois prazo). */
export function itensPlano(laudo: Laudo, fotos: Foto[], hoje = iso(new Date())): ItemPlano[] {
  const ordem: Record<Gravidade, number> = { critico: 0, medio: 1, minimo: 2 };
  const itens = fotos.flatMap((f, i) => achadosValidos(f).map((a) => {
    const acomp: Acompanhamento = a.acompanhamento ?? { status: 'aberta' };
    const prazo = acomp.prazo || prazoSugerido(laudo.dados.dataVistoria, a.gravidade);
    const gut = acomp.gut ?? GUT_SUGERIDA[a.gravidade];
    return { foto: f, achado: a, numeroFoto: i + 1, acomp, prazo, atrasado: acomp.status !== 'resolvida' && prazo < hoje, gut, pontos: pontosGut(gut) };
  }));
  // maior pontuação GUT primeiro (sem GUT preenchida, a sugestão segue a gravidade); empate: gravidade e prazo
  return itens.sort((x, y) => y.pontos - x.pontos || ordem[x.achado.gravidade] - ordem[y.achado.gravidade] || x.prazo.localeCompare(y.prazo));
}

export function resumoPlano(itens: ItemPlano[]) {
  const r = { total: itens.length, aberta: 0, andamento: 0, resolvida: 0, atrasados: 0, custo: 0, custoAberto: 0 };
  for (const i of itens) {
    r[i.acomp.status]++;
    if (i.atrasado) r.atrasados++;
    const c = i.acomp.custo ?? 0;
    r.custo += c;
    if (i.acomp.status !== 'resolvida') r.custoAberto += c;
  }
  return r;
}

/** O engenheiro mexeu em algum item? (só então o plano entra no documento A4) */
export const planoPreenchido = (itens: ItemPlano[]) => itens.some((i) => i.achado.acompanhamento);

export const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataCurta = (d: string) => (d ? d.split('-').reverse().join('/') : '');

/** Planilha (CSV com ; e BOM: abre certo no Excel brasileiro). */
export function planilhaPlano(laudo: Laudo, itens: ItemPlano[]): Blob {
  const cel = (v: string | number | undefined) => {
    const s = String(v ?? '').replace(/\r?\n/g, ' ');
    return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas = [
    ['Laudo', laudo.titulo], ['Endereço', laudo.dados.endereco ?? ''], [],
    ['Foto', 'Ambiente', 'Anomalia', 'Grau', 'Prioridade', 'G', 'U', 'T', 'GUT', 'Recomendação', 'Status', 'Prazo', 'Responsável', 'Custo estimado (R$)', 'Observação'],
    ...itens.map((i) => [
      String(i.numeroFoto).padStart(2, '0'), i.foto.analise?.ambiente ?? '', i.achado.tipo, GRAVIDADE[i.achado.gravidade].nome,
      GRAVIDADE[i.achado.gravidade].prioridade, i.gut.g, i.gut.u, i.gut.t, i.pontos, i.achado.recomendacao, STATUS_ACAO[i.acomp.status].nome, dataCurta(i.prazo),
      i.acomp.responsavel ?? '', i.acomp.custo != null ? i.acomp.custo.toFixed(2).replace('.', ',') : '', i.acomp.nota ?? '',
    ]),
  ];
  return new Blob(['﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

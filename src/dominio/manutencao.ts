import type { Foto, Laudo } from './modelo';
import { dataLocal } from '../lib/util';
import { achadosValidos } from './regras';

/**
 * Plano de manutenção preventiva (ABNT NBR 5674 — Manutenção de edificações).
 * A norma pede um programa com atividades, periodicidade, responsável e registro do que foi feito.
 * Este catálogo é uma referência de práticas usuais; o engenheiro ajusta ao manual de uso e
 * manutenção do edifício (NBR 14037), às recomendações dos fabricantes e às leis locais.
 * Fica guardado em laudo.dados.planoManutencao (JSON), então sincroniza junto com o laudo.
 */

export type Periodicidade = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bienal' | 'trienal' | 'quinquenal';
export type Responsavel = 'equipe' | 'capacitada' | 'especializada';

export const PERIODO: Record<Periodicidade, { nome: string; meses: number; dias?: number }> = {
  semanal: { nome: 'Semanal', meses: 0, dias: 7 },
  mensal: { nome: 'Mensal', meses: 1 },
  trimestral: { nome: 'Trimestral', meses: 3 },
  semestral: { nome: 'Semestral', meses: 6 },
  anual: { nome: 'Anual', meses: 12 },
  bienal: { nome: 'A cada 2 anos', meses: 24 },
  trienal: { nome: 'A cada 3 anos', meses: 36 },
  quinquenal: { nome: 'A cada 5 anos', meses: 60 },
};

/** Quem faz, nos termos da NBR 5674. */
export const RESPONSAVEL: Record<Responsavel, { nome: string; explica: string }> = {
  equipe: { nome: 'Equipe local', explica: 'Equipe de manutenção do próprio edifício (zelador, manutencista).' },
  capacitada: { nome: 'Empresa capacitada', explica: 'Empresa ou profissional treinado para a atividade.' },
  especializada: { nome: 'Empresa especializada', explica: 'Empresa com responsável técnico legalmente habilitado (com ART/RRT).' },
};

export interface ItemManutencao {
  id: string;
  sistema: string;
  atividade: string;
  periodicidade: Periodicidade;
  responsavel: Responsavel;
  ultima?: string;   // AAAA-MM-DD: última vez feita
  ativo: boolean;
  destaque?: boolean; // sistema com anomalia neste laudo
}

export interface PlanoManutencao { criadoEm: string; itens: ItemManutencao[] }

type Modelo = Omit<ItemManutencao, 'id' | 'ativo' | 'ultima' | 'destaque'>;

/** Referência de atividades por sistema (práticas usuais alinhadas à NBR 5674 e normas dos sistemas). */
export const CATALOGO: Modelo[] = [
  { sistema: 'Instalações hidráulicas', atividade: 'Verificar funcionamento das bombas de recalque e alternar a bomba em uso', periodicidade: 'semanal', responsavel: 'equipe' },
  { sistema: 'Instalações hidráulicas', atividade: 'Limpar e desinfetar reservatórios de água (caixas e cisternas)', periodicidade: 'semestral', responsavel: 'capacitada' },
  { sistema: 'Instalações hidráulicas', atividade: 'Limpar ralos, grelhas e caixas sifonadas', periodicidade: 'mensal', responsavel: 'equipe' },
  { sistema: 'Instalações hidráulicas', atividade: 'Limpar caixas de gordura, de inspeção e de esgoto', periodicidade: 'trimestral', responsavel: 'equipe' },
  { sistema: 'Instalações hidráulicas', atividade: 'Verificar vazamentos em registros, válvulas e metais', periodicidade: 'semestral', responsavel: 'equipe' },
  { sistema: 'Instalações elétricas', atividade: 'Testar disjuntores DR e iluminação de emergência', periodicidade: 'mensal', responsavel: 'equipe' },
  { sistema: 'Instalações elétricas', atividade: 'Reapertar conexões e inspecionar quadros de distribuição', periodicidade: 'anual', responsavel: 'especializada' },
  { sistema: 'Instalações elétricas', atividade: 'Inspecionar o SPDA (para-raios) e medir aterramento', periodicidade: 'anual', responsavel: 'especializada' },
  { sistema: 'Cobertura', atividade: 'Limpar calhas, rufos e condutores de água pluvial', periodicidade: 'semestral', responsavel: 'equipe' },
  { sistema: 'Cobertura', atividade: 'Inspecionar telhas, fixações e vedações do telhado', periodicidade: 'anual', responsavel: 'capacitada' },
  { sistema: 'Impermeabilização', atividade: 'Inspecionar impermeabilização de lajes, áreas molhadas e reservatórios', periodicidade: 'anual', responsavel: 'capacitada' },
  { sistema: 'Revestimentos', atividade: 'Inspecionar fachada: fissuras, destacamentos e juntas de dilatação', periodicidade: 'anual', responsavel: 'especializada' },
  { sistema: 'Revestimentos', atividade: 'Lavar a fachada', periodicidade: 'trienal', responsavel: 'capacitada' },
  { sistema: 'Revestimentos', atividade: 'Repintar áreas comuns e fachada', periodicidade: 'quinquenal', responsavel: 'capacitada' },
  { sistema: 'Pisos', atividade: 'Revisar rejuntes de pisos e áreas molhadas', periodicidade: 'anual', responsavel: 'equipe' },
  { sistema: 'Vedações', atividade: 'Inspecionar paredes e muros: fissuras, umidade e mofo', periodicidade: 'anual', responsavel: 'capacitada' },
  { sistema: 'Esquadrias', atividade: 'Revisar vedações (silicone, borrachas) e regular portas e janelas', periodicidade: 'anual', responsavel: 'capacitada' },
  { sistema: 'Esquadrias', atividade: 'Limpar drenos dos trilhos de janelas', periodicidade: 'trimestral', responsavel: 'equipe' },
  { sistema: 'Estrutura', atividade: 'Inspecionar visualmente estrutura: fissuras, armadura exposta, deformações', periodicidade: 'anual', responsavel: 'especializada' },
  { sistema: 'Áreas externas', atividade: 'Revisar portões automáticos e interfones', periodicidade: 'mensal', responsavel: 'capacitada' },
  { sistema: 'Áreas externas', atividade: 'Controle de pragas (dedetização e desratização)', periodicidade: 'semestral', responsavel: 'especializada' },
  { sistema: 'Segurança contra incêndio', atividade: 'Inspecionar extintores (validade, lacre, pressão)', periodicidade: 'mensal', responsavel: 'equipe' },
  { sistema: 'Segurança contra incêndio', atividade: 'Recarregar extintores e testar hidrantes e mangueiras', periodicidade: 'anual', responsavel: 'especializada' },
  { sistema: 'Equipamentos', atividade: 'Manutenção dos elevadores (contrato com a fabricante ou conservadora)', periodicidade: 'mensal', responsavel: 'especializada' },
  { sistema: 'Equipamentos', atividade: 'Testar e revisar o gerador', periodicidade: 'mensal', responsavel: 'capacitada' },
  { sistema: 'Documentos', atividade: 'Revisar o próprio programa de manutenção e os registros (NBR 5674)', periodicidade: 'anual', responsavel: 'especializada' },
];

const ordemP = Object.keys(PERIODO) as Periodicidade[];

/** Cria o plano: todo o catálogo, com destaque (e ativo) nos sistemas que tiveram anomalia no laudo. */
export function criarPlano(fotos: Foto[], novoId: () => string, hoje: string): PlanoManutencao {
  const comProblema = new Set(fotos.flatMap(achadosValidos).map((a) => a.sistema));
  return {
    criadoEm: hoje,
    itens: CATALOGO.map((m) => ({ ...m, id: novoId(), ativo: true, destaque: comProblema.has(m.sistema) }))
      .sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque) || ordemP.indexOf(a.periodicidade) - ordemP.indexOf(b.periodicidade)),
  };
}

export function lerPlano(laudo: Laudo): PlanoManutencao | null {
  const raw = laudo.dados.planoManutencao;
  if (!raw) return null;
  try { return JSON.parse(raw) as PlanoManutencao; } catch { return null; }
}
export const gravarPlano = (p: PlanoManutencao | null) => (p ? JSON.stringify(p) : '');

/** Próxima data: a partir da última vez feita (ou da criação do plano). */
export function proxima(i: ItemManutencao, criadoEm: string): string {
  const base = new Date(`${i.ultima || criadoEm}T12:00:00`);
  const p = PERIODO[i.periodicidade];
  if (p.dias) base.setDate(base.getDate() + p.dias); else base.setMonth(base.getMonth() + p.meses);
  return dataLocal(base);
}

/** Planilha (CSV com ; e BOM, abre certo no Excel). */
export function planilhaManutencao(laudo: Laudo, p: PlanoManutencao): Blob {
  const cel = (v: string) => (/[;"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const br = (d?: string) => (d ? d.split('-').reverse().join('/') : '');
  const linhas = [
    ['Plano de manutenção (ABNT NBR 5674)', laudo.titulo], [],
    ['Sistema', 'Atividade', 'Periodicidade', 'Responsável', 'Última vez', 'Próxima'],
    ...p.itens.filter((i) => i.ativo).map((i) => [i.sistema, i.atividade, PERIODO[i.periodicidade].nome, RESPONSAVEL[i.responsavel].nome, br(i.ultima), br(proxima(i, p.criadoEm))]),
  ];
  return new Blob(['﻿' + linhas.map((l) => l.map((x) => cel(String(x))).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

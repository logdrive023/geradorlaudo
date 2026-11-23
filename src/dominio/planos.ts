/**
 * Planos do LaudoTech: o limite é de FOTOS ANALISADAS PELA IA por mês (é o que custa). Laudos são ilimitados.
 * Mesma tabela do servidor (repo geradorlaudo-backend: internal/dominio/plano/plano.go). Mudou lá, mude aqui.
 * Base dos números: ~8 laudos por mês × 60 fotos com IA por laudo (nos EUA a média medida é 84 fotos por laudo,
 * mas capa, fachada e fotos repetidas não precisam passar pela IA).
 */

export type IdPlano = 'teste' | 'laudo' | 'completo' | 'escritorio';

export interface PlanoVenda {
  id: IdPlano;
  nome: string;
  preco: number;          // R$ por mês
  fotosMes: number;       // fotos com IA por mês (0 = sem limite)
  usuarios: number;       // pessoas na conta (0 = sem limite)
  obras: boolean;         // gestão de obras incluída
  para: string;
  itens: string[];
  destaque?: boolean;
}

export const PLANOS: PlanoVenda[] = [
  {
    id: 'laudo', nome: 'Laudo', preco: 119, fotosMes: 500, usuarios: 1, obras: false, para: 'para quem só faz laudo',
    itens: ['Laudos ilimitados', 'A IA analisa cada foto e escreve o achado', 'GUT, plano NBR 5674 e link do cliente', 'PDF, Word e Excel com a sua marca'],
  },
  {
    id: 'completo', nome: 'Completo', preco: 197, fotosMes: 1000, usuarios: 2, obras: true, para: 'laudo + gestão de obras', destaque: true,
    itens: ['Tudo do Laudo', 'Obras: cronograma, diário, financeiro e compras', 'O cliente acompanha a obra por link', 'Você + 1 assistente'],
  },
  {
    id: 'escritorio', nome: 'Escritório', preco: 399, fotosMes: 2500, usuarios: 5, obras: true, para: 'para equipes',
    itens: ['Tudo do Completo', 'Fotos da equipe toda num saldo só', 'Até 5 pessoas: admin, engenheiros e assistentes', 'Laudos e obras atribuídos a cada um'],
  },
];

export interface PacoteFotos { id: string; fotos: number; preco: number }
/** Pacotes extras: não vencem no fim do mês, só são usados depois que as do plano acabam. */
export const PACOTES: PacoteFotos[] = [
  { id: 'p250', fotos: 250, preco: 49 },
  { id: 'p1000', fotos: 1000, preco: 149 },
];

export const NOME_PLANO: Record<string, string> = { teste: 'Teste', laudo: 'Laudo', completo: 'Completo', escritorio: 'Escritório' };
export const milhar = (n: number) => n.toLocaleString('pt-BR');
export const precoBR = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const porFoto = (p: PacoteFotos) => (p.preco / p.fotos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

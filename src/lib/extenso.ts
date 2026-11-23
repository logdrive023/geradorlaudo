/** Valor em reais por extenso (para o recibo): 197.5 → "cento e noventa e sete reais e cinquenta centavos". */

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

/** 0 a 999 por extenso ("" para 0). */
function ate999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100), r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (r) partes.push(r < 20 ? UNIDADES[r] : DEZENAS[Math.floor(r / 10)] + (r % 10 ? ` e ${UNIDADES[r % 10]}` : ''));
  return partes.join(' e ');
}

/** Inteiro (até 999 milhões) por extenso. */
export function numeroPorExtenso(n: number): string {
  if (n === 0) return 'zero';
  const milhoes = Math.floor(n / 1_000_000), milhares = Math.floor((n % 1_000_000) / 1000), resto = n % 1000;
  const grupos: string[] = [];
  if (milhoes) grupos.push(`${ate999(milhoes)} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  if (milhares) grupos.push(milhares === 1 ? 'mil' : `${ate999(milhares)} mil`);
  if (resto) grupos.push(ate999(resto));
  // "e" antes do último grupo quando ele é < 100 ou uma centena redonda (ex.: mil e duzentos, mil e cinquenta)
  if (grupos.length > 1 && resto && (resto < 100 || resto % 100 === 0)) return `${grupos.slice(0, -1).join(' ')} e ${grupos.at(-1)}`;
  return grupos.join(' ');
}

export function reaisPorExtenso(centavos: number): string {
  const r = Math.floor(centavos / 100), c = centavos % 100;
  const partes: string[] = [];
  if (r) partes.push(`${numeroPorExtenso(r)}${r % 1_000_000 === 0 ? ' de' : ''} ${r === 1 ? 'real' : 'reais'}`);
  if (c) partes.push(`${numeroPorExtenso(c)} ${c === 1 ? 'centavo' : 'centavos'}`);
  return partes.length ? partes.join(' e ') : 'zero real';
}

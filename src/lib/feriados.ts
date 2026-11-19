/**
 * Feriados do Brasil, calculados no aparelho para qualquer ano (sem internet).
 *
 * - Nacionais: Lei 662/1949 e alterações (Lei 6.802/1980 — Aparecida; Lei 14.759/2023 — Consciência Negra, desde 2024).
 * - Móveis: dependem da Páscoa (algoritmo de Meeus/Jones/Butcher).
 * - Pontos facultativos: os do calendário federal (Carnaval, Cinzas até 14h, Corpus Christi, Servidor Público,
 *   vésperas de Natal e Ano-Novo após 14h). Muitas cidades transformam alguns em feriado.
 * - Estaduais: datas magnas e feriados das leis estaduais das 27 UFs.
 * - Municipais: as 27 capitais (aniversário e padroeiro). Para outra cidade, acrescente em MUNICIPAIS.
 *
 * Base de referência: confira o decreto do seu estado e da sua cidade, que pode mudar de um ano para outro.
 */

export type TipoFeriado = 'feriado' | 'facultativo';
export type Escopo = 'nacional' | 'estadual' | 'municipal';
export interface Feriado { data: string; nome: string; tipo: TipoFeriado; escopo: Escopo }
export interface Local { uf?: string; cidade?: string }

type Def = [mes: number, dia: number, nome: string, tipo?: TipoFeriado];

/** Estaduais por UF (datas fixas). */
export const ESTADUAIS: Record<string, Def[]> = {
  AC: [[1, 23, 'Dia do Evangélico'], [3, 8, 'Dia Internacional da Mulher'], [6, 15, 'Aniversário do Acre'], [8, 6, 'Início da Revolução Acreana'], [9, 5, 'Dia da Amazônia'], [11, 17, 'Tratado de Petrópolis']],
  AL: [[6, 24, 'São João'], [6, 29, 'São Pedro'], [9, 16, 'Emancipação política de Alagoas'], [11, 30, 'Dia do Evangélico']],
  AP: [[3, 19, 'São José'], [9, 13, 'Criação do Território do Amapá']],
  AM: [[9, 5, 'Elevação do Amazonas a província'], [12, 8, 'Nossa Senhora da Conceição']],
  BA: [[7, 2, 'Independência da Bahia']],
  CE: [[3, 19, 'São José'], [3, 25, 'Data Magna do Ceará (Abolição)']],
  DF: [[11, 30, 'Dia do Evangélico']],
  ES: [],
  GO: [],
  MA: [[7, 28, 'Adesão do Maranhão à Independência']],
  MT: [],
  MS: [[10, 11, 'Criação do Estado de Mato Grosso do Sul']],
  MG: [],
  PA: [[8, 15, 'Adesão do Pará à Independência']],
  PB: [[8, 5, 'Fundação do Estado da Paraíba']],
  PR: [[12, 19, 'Emancipação política do Paraná']],
  PE: [[3, 6, 'Data Magna de Pernambuco'], [6, 24, 'São João']],
  PI: [[10, 19, 'Dia do Piauí']],
  RJ: [[4, 23, 'São Jorge']],
  RN: [[10, 3, 'Mártires de Cunhaú e Uruaçu']],
  RS: [[9, 20, 'Revolução Farroupilha']],
  RO: [[1, 4, 'Criação do Estado de Rondônia'], [6, 18, 'Dia do Evangélico']],
  RR: [[10, 5, 'Criação do Estado de Roraima']],
  SC: [[8, 11, 'Dia de Santa Catarina'], [11, 25, 'Santa Catarina de Alexandria']],
  SP: [[7, 9, 'Revolução Constitucionalista']],
  SE: [[7, 8, 'Emancipação política de Sergipe']],
  TO: [[3, 18, 'Autonomia do Estado do Tocantins'], [9, 8, 'Nossa Senhora da Natividade'], [10, 5, 'Criação do Estado do Tocantins']],
};

export const UFS = Object.keys(ESTADUAIS);

/** Municipais: chave "UF/Cidade" (com acento, como se escreve). Comece pelas capitais e acrescente outras. */
export const MUNICIPAIS: Record<string, Def[]> = {
  'AC/Rio Branco': [[12, 28, 'Aniversário de Rio Branco']],
  'AL/Maceió': [[8, 27, 'Nossa Senhora dos Prazeres'], [12, 8, 'Nossa Senhora da Conceição']],
  'AP/Macapá': [[2, 4, 'Aniversário de Macapá']],
  'AM/Manaus': [[10, 24, 'Aniversário de Manaus']],
  'BA/Salvador': [[12, 8, 'Nossa Senhora da Conceição da Praia']],
  'CE/Fortaleza': [[4, 13, 'Aniversário de Fortaleza'], [8, 15, 'Nossa Senhora da Assunção']],
  'DF/Brasília': [],
  'ES/Vitória': [[9, 8, 'Nossa Senhora da Vitória']],
  'GO/Goiânia': [[5, 24, 'Nossa Senhora Auxiliadora'], [10, 24, 'Aniversário de Goiânia']],
  'MA/São Luís': [[9, 8, 'Aniversário de São Luís'], [12, 8, 'Nossa Senhora da Conceição']],
  'MT/Cuiabá': [[4, 8, 'Aniversário de Cuiabá']],
  'MS/Campo Grande': [[8, 26, 'Aniversário de Campo Grande']],
  'MG/Belo Horizonte': [[8, 15, 'Assunção de Nossa Senhora'], [12, 8, 'Imaculada Conceição']],
  'PA/Belém': [[1, 12, 'Aniversário de Belém'], [12, 8, 'Nossa Senhora da Conceição']],
  'PB/João Pessoa': [[8, 5, 'Nossa Senhora das Neves']],
  'PR/Curitiba': [[9, 8, 'Nossa Senhora da Luz dos Pinhais']],
  'PE/Recife': [[7, 16, 'Nossa Senhora do Carmo'], [12, 8, 'Nossa Senhora da Conceição']],
  'PI/Teresina': [[8, 16, 'Aniversário de Teresina']],
  'RJ/Rio de Janeiro': [[1, 20, 'São Sebastião']],
  'RN/Natal': [[1, 6, 'Santos Reis'], [11, 21, 'Nossa Senhora da Apresentação']],
  'RS/Porto Alegre': [[2, 2, 'Nossa Senhora dos Navegantes']],
  'RO/Porto Velho': [[10, 2, 'Aniversário de Porto Velho']],
  'RR/Boa Vista': [[7, 9, 'Aniversário de Boa Vista']],
  'SC/Florianópolis': [[3, 23, 'Aniversário de Florianópolis']],
  'SP/São Paulo': [[1, 25, 'Aniversário de São Paulo']],
  'SE/Aracaju': [[3, 17, 'Aniversário de Aracaju'], [12, 8, 'Nossa Senhora da Conceição']],
  'TO/Palmas': [[5, 20, 'Aniversário de Palmas']],
};

/** Cidades com feriados cadastrados nesta UF. */
export const cidadesDe = (uf?: string) => Object.keys(MUNICIPAIS).filter((k) => k.startsWith(`${uf}/`)).map((k) => k.slice(3));

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const somar = (d: Date, dias: number) => { const x = new Date(d); x.setDate(x.getDate() + dias); return x; };

/** Domingo de Páscoa (calendário gregoriano). */
export function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia, 12);
}

const cache = new Map<string, Feriado[]>();

/** Todos os feriados e pontos facultativos do ano para o local (nacionais sempre; estaduais e municipais se informados). */
export function feriadosDoAno(ano: number, local: Local = {}): Feriado[] {
  const chave = `${ano}|${local.uf ?? ''}|${local.cidade ?? ''}`;
  const c = cache.get(chave);
  if (c) return c;
  const dt = (m: number, d: number) => `${ano}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const de = (defs: Def[], escopo: Escopo): Feriado[] => defs.map(([m, d, nome, tipo]) => ({ data: dt(m, d), nome, tipo: tipo ?? 'feriado', escopo }));
  const p = pascoa(ano);
  const movel = (dias: number, nome: string, tipo: TipoFeriado): Feriado => ({ data: iso(somar(p, dias)), nome, tipo, escopo: 'nacional' });
  const nacionais: Def[] = [
    [1, 1, 'Confraternização Universal'], [4, 21, 'Tiradentes'], [5, 1, 'Dia do Trabalho'], [9, 7, 'Independência do Brasil'],
    [10, 12, 'Nossa Senhora Aparecida'], [11, 2, 'Finados'], [11, 15, 'Proclamação da República'],
    ...(ano >= 2024 ? [[11, 20, 'Dia Nacional de Zumbi e da Consciência Negra'] as Def] : []),
    [12, 25, 'Natal'],
    [10, 28, 'Dia do Servidor Público', 'facultativo'], [12, 24, 'Véspera de Natal (após 14h)', 'facultativo'], [12, 31, 'Véspera de Ano-Novo (após 14h)', 'facultativo'],
  ];
  const lista: Feriado[] = [
    ...de(nacionais, 'nacional'),
    movel(-48, 'Carnaval', 'facultativo'), movel(-47, 'Carnaval', 'facultativo'), movel(-46, 'Quarta-feira de Cinzas (até 14h)', 'facultativo'),
    movel(-2, 'Sexta-feira Santa', 'feriado'), movel(60, 'Corpus Christi', 'facultativo'),
    ...(local.uf ? de(ESTADUAIS[local.uf] ?? [], 'estadual') : []),
    ...(local.uf && local.cidade ? de(MUNICIPAIS[`${local.uf}/${local.cidade}`] ?? [], 'municipal') : []),
  ];
  lista.sort((a, b) => a.data.localeCompare(b.data));
  cache.set(chave, lista);
  return lista;
}

const peso = (f: Feriado) => (f.tipo === 'feriado' ? 0 : 1) * 10 + ({ nacional: 0, estadual: 1, municipal: 2 })[f.escopo];

/** Feriados nesta data (AAAA-MM-DD), o mais forte primeiro (feriado antes de facultativo; nacional antes de local). */
export function feriadosEm(data: string, local: Local = {}): Feriado[] {
  return feriadosDoAno(Number(data.slice(0, 4)), local).filter((f) => f.data === data).sort((a, b) => peso(a) - peso(b));
}
export const feriadoEm = (data: string, local: Local = {}): Feriado | undefined => feriadosEm(data, local)[0];

export const NOME_ESCOPO: Record<Escopo, string> = { nacional: 'Feriado nacional', estadual: 'Feriado estadual', municipal: 'Feriado municipal' };
export const rotuloFeriado = (f: Feriado) => (f.tipo === 'facultativo' ? 'Ponto facultativo' : NOME_ESCOPO[f.escopo]);

export const dataISO = iso;

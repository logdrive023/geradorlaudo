import { useEffect, useState } from 'react';
import { ArrowRight, Camera, Check, HardHat, Lightbulb, Sparkles, TrendingDown, TrendingUp, Users, Wallet, X } from 'lucide-react';
import { trocarPlano, avisarPlanoMudou } from '../../db/organizacao';
import { PACOTES, PLANOS, milhar, precoBR, type PlanoVenda } from '../../dominio/planos';
import { Botao, Modal } from '../../componentes/ui';
import { cx } from '../../lib/util';

const dataBR = (d?: string) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '');
const porFoto = (p: { preco: number; fotosMes: number }) => (p.fotosMes ? p.preco / p.fotosMes : 0);
const centavos = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const laudos = (fotos: number) => Math.round(fotos / 60);
const pessoas = (n: number) => (n === 0 ? 'sem limite' : n === 1 ? '1 pessoa' : `até ${n} pessoas`);
const MAX_FOTOS = Math.max(...PLANOS.map((p) => p.fotosMes));

/** O plano de teste (fase atual, grátis) para comparar com os pagos. */
const TESTE: PlanoVenda = { id: 'teste', nome: 'Teste', preco: 0, fotosMes: 300, usuarios: 0, obras: true, para: 'fase de testes', itens: [] };

/** Quanto custaria cobrir "faltam" fotos com pacotes extras (a combinação mais barata). */
export function custoPacotes(faltam: number): number {
  if (faltam <= 0) return 0;
  const [p1, p2] = [...PACOTES].sort((a, b) => a.fotos - b.fotos); // 250 e 1.000
  let melhor = Infinity;
  for (let grandes = 0; grandes <= Math.ceil(faltam / p2.fotos); grandes++) {
    const resto = Math.max(0, faltam - grandes * p2.fotos);
    melhor = Math.min(melhor, grandes * p2.preco + Math.ceil(resto / p1.fotos) * p1.preco);
  }
  return melhor;
}

/** O plano de menor custo total para esse uso: mensalidade + pacotes que faltariam (empate: o maior, com folga). */
function idealPeloUso(uso: number): PlanoVenda | null {
  if (uso <= 0) return null;
  let melhor: { p: PlanoVenda; custo: number } | null = null;
  for (const p of PLANOS) {
    const custo = p.preco + custoPacotes(uso - p.fotosMes);
    if (!melhor || custo <= melhor.custo) melhor = { p, custo };
  }
  return melhor!.p;
}

/** Sugestão inicial: o ideal pelo uso (se for outro); senão o próximo acima do atual. */
function sugestao(atual: string, ideal: PlanoVenda | null) {
  if (ideal && ideal.id !== atual) return ideal.id;
  return atual === 'laudo' ? 'completo' : atual === 'completo' ? 'escritorio' : atual === 'escritorio' ? null : 'completo';
}

/** O que muda entre dois planos, em frases curtas: ganhos (verde) e perdas (vermelho). */
function diferencas(de: PlanoVenda, para: PlanoVenda, uso: number) {
  const ganha: string[] = [], perde: string[] = [];
  const df = para.fotosMes - de.fotosMes;
  if (df > 0) ganha.push(`+${milhar(df)} fotos com IA por mês (uns ${laudos(df)} laudos a mais)`);
  if (df < 0) perde.push(`${milhar(-df)} fotos com IA a menos por mês`);
  if (para.usuarios === 0 && de.usuarios !== 0) ganha.push('Pessoas sem limite');
  else if (de.usuarios === 0 && para.usuarios !== 0) perde.push(`Equipe limitada a ${pessoas(para.usuarios)}`);
  else if (para.usuarios > de.usuarios) ganha.push(`+${para.usuarios - de.usuarios} ${para.usuarios - de.usuarios === 1 ? 'pessoa' : 'pessoas'} na equipe`);
  else if (para.usuarios < de.usuarios) perde.push(`Equipe cai para ${pessoas(para.usuarios)}`);
  if (para.obras && !de.obras) ganha.push('Gestão de obras: cronograma, diário, financeiro e compras');
  if (!para.obras && de.obras) perde.push('Sem gestão de obras (as que existem ficam só para editar)');
  if (de.preco > 0 && para.preco > 0 && porFoto(para) < porFoto(de)) ganha.push(`Cada foto com IA sai mais barata: ${centavos(porFoto(para))} em vez de ${centavos(porFoto(de))}`);
  if (uso > 0 && uso > de.fotosMes && uso <= para.fotosMes) ganha.push(`Cabe o seu uso (${milhar(uso)} fotos no mês mais cheio) sem comprar pacote`);
  if (uso > 0 && uso > para.fotosMes && uso <= de.fotosMes) perde.push(`No mês mais cheio você usou ${milhar(uso)} fotos: faltariam ${milhar(uso - para.fotosMes)}`);
  return { ganha, perde };
}

type Linha = { ic: typeof Camera; t: string; v: (p: PlanoVenda) => React.ReactNode };
const LINHAS: Linha[] = [
  {
    ic: Camera, t: 'Fotos com IA por mês', v: (p) => (
      <span className="grid justify-items-center gap-0.5">
        <span className="flex items-baseline gap-1"><b className="text-base">{milhar(p.fotosMes)}</b><span className="text-[11px] text-texto3">~{laudos(p.fotosMes)} laudos</span></span>
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sup2" aria-hidden><span className="block h-full rounded-full bg-obra" style={{ width: `${Math.round((p.fotosMes / MAX_FOTOS) * 100)}%` }} /></span>
      </span>
    ),
  },
  { ic: Wallet, t: 'Custo por foto com IA', v: (p) => (p.preco ? centavos(porFoto(p)) : '—') },
  { ic: Users, t: 'Pessoas na conta', v: (p) => pessoas(p.usuarios) },
  { ic: HardHat, t: 'Gestão de obras', v: (p) => (p.obras ? <Check className="mx-auto size-5 text-ok" aria-label="sim" /> : <X className="mx-auto size-5 text-texto3" aria-label="não" />) },
  { ic: Sparkles, t: 'Laudos ilimitados, GUT, NBR 5674 e link do cliente', v: () => <Check className="mx-auto size-5 text-ok" aria-label="sim" /> },
];

/**
 * Trocar de plano: "seu plano hoje é X; com Y você ganha...", recomendação pelo uso real,
 * tabela comparativa e confirmação. usoMes = fotos com IA do mês mais cheio (últimos 3 meses).
 */
export function TrocarPlano({ aberto, aoFechar, atual, proximaCobranca, aoTrocar, usoMes = 0, inicial, simular }: {
  aberto: boolean; aoFechar: () => void; atual: string; proximaCobranca?: string; aoTrocar: (msg: string) => void; usoMes?: number; inicial?: string;
  /** exemplo: não vai ao servidor, só muda a tela */ simular?: (plano: string) => void;
}) {
  const hoje = PLANOS.find((p) => p.id === atual) ?? TESTE;
  const ideal = idealPeloUso(usoMes);
  const [escolhaId, setEscolhaId] = useState<string | null>(inicial ?? sugestao(atual, ideal));
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { if (aberto) { setEscolhaId(inicial ?? sugestao(atual, ideal)); setErro(''); } }, [aberto, atual]); // eslint-disable-line react-hooks/exhaustive-deps
  const escolha = PLANOS.find((p) => p.id === escolhaId) ?? null;
  const fechar = () => { setErro(''); aoFechar(); };

  const confirmar = async () => {
    if (!escolha) return;
    setOcupado(true); setErro('');
    try {
      if (simular) { simular(escolha.id); aoTrocar(`Exemplo: assim ficaria no plano ${escolha.nome}. Nada foi salvo.`); fechar(); setOcupado(false); return; }
      const r = await trocarPlano(escolha.id);
      avisarPlanoMudou();
      aoTrocar(`Pronto, você está no plano ${r.para.nome}. A mensalidade de ${precoBR(r.para.precoCentavos / 100)} vale a partir de ${dataBR(r.proximaCobranca)}.`);
      fechar();
    } catch (e) { setErro((e as Error).message); }
    setOcupado(false);
  };

  const dif = escolha ? diferencas(hoje, escolha, usoMes) : null;
  const deltaPreco = escolha ? escolha.preco - hoje.preco : 0;
  const sobe = deltaPreco > 0;
  // a conta do uso: quanto o plano atual custa de verdade com os pacotes que faltam
  const faltaHoje = Math.max(0, usoMes - hoje.fotosMes);
  const pacotesHoje = custoPacotes(faltaHoje);

  return (
    <Modal aberto={aberto} aoFechar={fechar} largura="max-w-4xl" titulo="Trocar de plano">
      <div className="grid gap-3">
        {/* 1. de → para, a diferença e a leitura do uso, numa faixa só */}
        <div className="grid gap-3 rounded-2xl bg-[#121A2B] p-4 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-lg font-extrabold">
              <span className="text-[#B6BECC]">{hoje.nome}</span><ArrowRight className="size-5 text-obra" /><span className={escolha ? 'text-white' : 'text-[#7A8599]'}>{escolha ? escolha.nome : 'escolha abaixo'}</span>
            </span>
            {usoMes > 0 && (
              <p className="mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-[#D6DCE6]">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-obra" />
                <span>
                  Mês mais cheio: <b className="text-white">{milhar(usoMes)} fotos</b>.{' '}
                  {faltaHoje > 0
                    ? (ideal && ideal.id !== hoje.id
                      ? <>No {hoje.nome} faltariam {milhar(faltaHoje)} (≈ {precoBR(pacotesHoje)} em pacotes); o <b className="text-obra">{ideal.nome}</b> cobre tudo.</>
                      : <>Faltariam {milhar(faltaHoje)}: um pacote ({precoBR(pacotesHoje)}) <b className="text-obra">sai mais em conta</b> que subir de plano.</>)
                    : ideal && ideal.id === hoje.id ? <>O {hoje.nome} já é o ideal para esse uso.</> : <>O <b className="text-obra">{ideal?.nome}</b> já dá conta com folga.</>}
                </span>
              </p>
            )}
          </div>
          {escolha && (
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center sm:text-right">
              <b className={cx('block font-display text-2xl', sobe ? 'text-white' : 'text-[#7EE2A8]')}>{deltaPreco === 0 ? 'mesmo valor' : `${sobe ? '+' : '−'} ${precoBR(Math.abs(deltaPreco))}/mês`}</b>
              <span className="text-[11px] text-[#B6BECC]">vale na hora · valor novo {proximaCobranca ? `em ${dataBR(proximaCobranca)}` : 'na próxima cobrança'}</span>
            </div>
          )}
        </div>

        {/* 2. ganhos e perdas em selos (curto, sem rolar) */}
        {dif && escolha && (dif.ganha.length > 0 || dif.perde.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {dif.ganha.map((g) => <span key={g} className="inline-flex items-center gap-1 rounded-full bg-ok-suave px-2.5 py-1 text-[13px] font-semibold text-ok-texto"><TrendingUp className="size-3.5" />{g}</span>)}
            {dif.perde.map((g) => <span key={g} className="inline-flex items-center gap-1 rounded-full bg-critico-suave px-2.5 py-1 text-[13px] font-semibold text-critico-texto"><TrendingDown className="size-3.5" />{g}</span>)}
            {sobe && escolha.fotosMes > hoje.fotosMes && hoje.preco > 0 && (() => {
              const extra = escolha.fotosMes - hoje.fotosMes, viaPacote = custoPacotes(extra);
              return viaPacote > deltaPreco ? <span className="inline-flex items-center gap-1 rounded-full bg-obra-suave px-2.5 py-1 text-[13px] font-semibold text-obra-texto">{milhar(extra)} fotos em pacotes custariam {precoBR(viaPacote)}: economia de {precoBR(viaPacote - deltaPreco)}</span> : null;
            })()}
          </div>
        )}

        {/* 3a. celular: um cartão por plano (as mesmas linhas da tabela) */}
        <div className="grid gap-3 sm:hidden">
          {PLANOS.map((p) => {
            const eAtual = p.id === hoje.id, marcado = p.id === escolhaId, eIdeal = ideal?.id === p.id && !eAtual;
            const selos = [eAtual && 'seu plano', eIdeal && 'ideal pro seu uso', !eAtual && !eIdeal && p.destaque && 'mais escolhido'].filter(Boolean) as string[];
            return (
              <button key={p.id} disabled={eAtual} onClick={() => setEscolhaId(p.id)} aria-pressed={marcado}
                className={cx('grid gap-3 rounded-2xl border-2 p-4 text-left transition', marcado ? 'border-obra bg-obra-suave/50' : eAtual ? 'cursor-default border-borda bg-sup2' : 'border-borda')}>
                <span className="flex items-start justify-between gap-2">
                  <span>
                    <span className="flex flex-wrap gap-1">
                      {selos.map((x) => <span key={x} className={cx('rounded-full px-2 py-0.5 text-[10px] font-extrabold', x === 'seu plano' ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : x === 'ideal pro seu uso' ? 'bg-ok text-white' : 'bg-obra text-[#121A2B]')}>{x}</span>)}
                    </span>
                    <b className="mt-1 block text-xs font-extrabold uppercase tracking-wider text-texto2">{p.nome}</b>
                    <span><b className="font-display text-2xl">{precoBR(p.preco)}</b><span className="text-xs text-texto3">/mês</span></span>
                  </span>
                  <span className={cx('flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold', marcado ? 'bg-obra text-[#121A2B]' : eAtual ? 'text-texto3' : 'bg-sup2 text-tinta')}>
                    {marcado ? <><Check className="size-3.5" />escolhido</> : eAtual ? 'atual' : 'escolher'}
                  </span>
                </span>
                <span className="grid gap-2 border-t border-borda pt-3 text-sm">
                  {LINHAS.slice(0, 4).map((l) => (
                    <span key={l.t} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-texto2"><l.ic className="size-4 shrink-0 text-obra" />{l.t}</span>
                      <span className="shrink-0 text-right font-semibold">{l.v(p)}</span>
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
          <p className="flex items-center gap-2 text-xs text-texto2"><Sparkles className="size-4 text-obra" />Em todos: laudos ilimitados, GUT, NBR 5674 e link do cliente.</p>
        </div>

        {/* 3b. computador e tablet: tabela comparativa */}
        <div className="-mx-1 hidden overflow-x-auto px-1 pt-2 sm:block">
          <table className="w-full min-w-[580px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-[32%] p-2 text-left align-bottom text-xs font-extrabold uppercase tracking-wider text-texto3">Compare</th>
                {PLANOS.map((p) => {
                  const eAtual = p.id === hoje.id, marcado = p.id === escolhaId, eIdeal = ideal?.id === p.id && !eAtual;
                  const selos = [eAtual && 'seu plano', eIdeal && 'ideal pro seu uso', !eAtual && !eIdeal && p.destaque && 'mais escolhido'].filter(Boolean) as string[];
                  return (
                    <th key={p.id} className="p-1 align-bottom">
                      <button disabled={eAtual} onClick={() => setEscolhaId(p.id)} aria-pressed={marcado}
                        className={cx('grid w-full gap-0.5 rounded-t-2xl border-2 border-b-0 px-2 pb-2 pt-2 text-center transition',
                          marcado ? 'border-obra bg-obra-suave/60' : eAtual ? 'cursor-default border-transparent bg-sup2' : 'border-transparent hover:bg-sup2')}>
                        <span className="flex min-h-5 flex-wrap justify-center gap-1">
                          {selos.map((s) => (
                            <span key={s} className={cx('whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                              s === 'seu plano' ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : s === 'ideal pro seu uso' ? 'bg-ok text-white' : 'bg-obra text-[#121A2B]')}>{s}</span>
                          ))}
                        </span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-texto2">{p.nome}</span>
                        <span><b className="font-display text-xl text-texto">{precoBR(p.preco)}</b><span className="text-xs font-normal text-texto3">/mês</span></span>
                        <span className={cx('mx-auto flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold', marcado ? 'bg-obra text-[#121A2B]' : eAtual ? 'text-texto3' : 'bg-sup2 text-tinta')}>
                          {marcado ? <><Check className="size-3.5" />escolhido</> : eAtual ? 'atual' : 'escolher'}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {LINHAS.slice(0, 4).map((l, i) => (
                <tr key={l.t}>
                  <td className="border-t border-borda px-3 py-2 text-texto2">
                    <span className="flex items-center gap-2"><l.ic className="size-4 shrink-0 text-obra" />{l.t}</span>
                  </td>
                  {PLANOS.map((p) => {
                    const marcado = p.id === escolhaId, eAtual = p.id === hoje.id;
                    return (
                      <td key={p.id} className={cx('border-t border-borda px-2 py-2 text-center font-semibold',
                        marcado ? 'border-x-2 border-x-obra bg-obra-suave/60' : eAtual ? 'bg-sup2' : '',
                        marcado && i === 3 && 'rounded-b-2xl border-b-2 border-b-obra')}>
                        {l.v(p)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="hidden items-center gap-2 text-xs text-texto2 sm:flex"><Sparkles className="size-4 text-obra" />Em todos os planos: laudos ilimitados, GUT, NBR 5674, link do cliente e pacote extra quando precisar.</p>
        {erro && <p className="rounded-xl bg-critico-suave px-3 py-2.5 text-sm text-critico-texto">{erro}</p>}
        {/* rodapé fixo: o botão de confirmar sempre à vista */}
        <div className="sticky -bottom-5 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-borda bg-sup px-5 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
          <span className="hidden text-xs text-texto3 sm:inline">{escolha ? <>Plano {escolha.nome}: <b className="text-texto">{precoBR(escolha.preco)}/mês</b>, {milhar(escolha.fotosMes)} fotos com IA.</> : 'Pode trocar de novo quando quiser.'}</span>
          <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            <Botao variante="fantasma" onClick={fechar}>Voltar</Botao>
            <Botao variante="obra" disabled={!escolha} carregando={ocupado} onClick={confirmar}>{escolha ? `Quero o ${escolha.nome}` : 'Escolha um plano'}</Botao>
          </div>
        </div>
      </div>
    </Modal>
  );
}

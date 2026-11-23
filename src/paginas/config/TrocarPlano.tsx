import { useEffect, useState } from 'react';
import { ArrowRight, Camera, Check, HardHat, Lightbulb, Minus, Sparkles, TrendingDown, TrendingUp, Users, Wallet, X } from 'lucide-react';
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
      <span className="grid justify-items-center gap-1">
        <b className="text-base">{milhar(p.fotosMes)}</b>
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sup2" aria-hidden><span className="block h-full rounded-full bg-obra" style={{ width: `${Math.round((p.fotosMes / MAX_FOTOS) * 100)}%` }} /></span>
        <span className="text-[11px] text-texto3">~{laudos(p.fotosMes)} laudos</span>
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
export function TrocarPlano({ aberto, aoFechar, atual, proximaCobranca, aoTrocar, usoMes = 0, inicial }: {
  aberto: boolean; aoFechar: () => void; atual: string; proximaCobranca?: string; aoTrocar: (msg: string) => void; usoMes?: number; inicial?: string;
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
      <div className="grid gap-5">
        {/* 0. a leitura do uso (a "Lia" fazendo a conta) */}
        {usoMes > 0 && (
          <div className="flex items-start gap-3 rounded-2xl bg-[#121A2B] p-4 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-obra text-[#121A2B]"><Lightbulb className="size-5" /></span>
            <p className="text-sm leading-relaxed text-[#D6DCE6]">
              No seu mês mais cheio a equipe usou <b className="text-white">{milhar(usoMes)} fotos com IA</b>.{' '}
              {faltaHoje > 0
                ? <>O {hoje.nome} cobre {milhar(hoje.fotosMes)}: faltariam {milhar(faltaHoje)}, uns <b className="text-white">{precoBR(pacotesHoje)} em pacotes</b> (total de {precoBR(hoje.preco + pacotesHoje)} no mês). {ideal && ideal.id !== hoje.id ? <>O <b className="text-obra">{ideal.nome}</b> cobre tudo por {precoBR(ideal.preco)}.</> : <>Mesmo assim, ficar no {hoje.nome} e comprar um pacote quando faltar <b className="text-obra">sai mais em conta</b> que subir de plano.</>}</>
                : ideal && ideal.id === hoje.id ? <>O seu plano <b className="text-white">{hoje.nome}</b> já é o ideal para esse uso.</>
                  : <>O <b className="text-obra">{ideal?.nome}</b> já dá conta com folga.</>}
            </p>
          </div>
        )}

        {/* 1. hoje × com o novo */}
        <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-2xl border border-borda bg-sup2 p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">Seu plano hoje</span>
            <b className="block font-display text-2xl">{hoje.nome}</b>
            <span className="text-sm text-texto2">{hoje.preco ? `${precoBR(hoje.preco)}/mês` : 'grátis, fase de testes'} · {milhar(hoje.fotosMes)} fotos com IA</span>
          </div>
          <span className="hidden place-items-center sm:grid"><ArrowRight className="size-6 text-obra" /></span>
          <div className={cx('rounded-2xl border-2 p-4', escolha ? 'border-obra bg-obra-suave/50' : 'border-dashed border-borda-forte')}>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-obra-texto">{escolha ? 'Com o plano novo' : 'Escolha na tabela'}</span>
            {escolha ? <>
              <b className="block font-display text-2xl">{escolha.nome}</b>
              <span className="text-sm text-texto2">{precoBR(escolha.preco)}/mês · {milhar(escolha.fotosMes)} fotos com IA</span>
            </> : <span className="block text-sm text-texto2">Toque no plano que quer para ver o que muda.</span>}
          </div>
        </div>

        {/* 2. o que você ganha (e o que perde, se descer) */}
        {dif && escolha && (
          <div className="grid gap-3 sm:grid-cols-2">
            {dif.ganha.length > 0 && (
              <div className="rounded-2xl bg-ok-suave p-4">
                <b className="flex items-center gap-1.5 text-sm text-ok-texto"><TrendingUp className="size-4" />Com o {escolha.nome} você ganha</b>
                <ul className="mt-2 grid gap-1.5">
                  {dif.ganha.map((g) => <li key={g} className="flex items-start gap-2 text-sm text-texto"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{g}</li>)}
                </ul>
              </div>
            )}
            {dif.perde.length > 0 && (
              <div className="rounded-2xl bg-critico-suave p-4">
                <b className="flex items-center gap-1.5 text-sm text-critico-texto"><TrendingDown className="size-4" />Você deixa de ter</b>
                <ul className="mt-2 grid gap-1.5">
                  {dif.perde.map((g) => <li key={g} className="flex items-start gap-2 text-sm text-texto"><Minus className="mt-0.5 size-4 shrink-0 text-critico" />{g}</li>)}
                </ul>
              </div>
            )}
            <div className={cx('grid content-center gap-1 rounded-2xl border border-borda p-4', dif.ganha.length && dif.perde.length ? 'sm:col-span-2' : '')}>
              <span className="text-sm text-texto2">Diferença na mensalidade</span>
              <b className={cx('font-display text-2xl', sobe ? 'text-texto' : 'text-ok-texto')}>{deltaPreco === 0 ? 'mesmo valor' : `${sobe ? '+' : '−'} ${precoBR(Math.abs(deltaPreco))}/mês`}</b>
              {sobe && escolha.fotosMes > hoje.fotosMes && (
                <span className="text-xs font-bold text-texto2">
                  {(() => {
                    const extra = escolha.fotosMes - hoje.fotosMes;
                    const viaPacote = custoPacotes(extra);
                    return viaPacote > deltaPreco ? `As ${milhar(extra)} fotos a mais custariam ${precoBR(viaPacote)} em pacotes: o ${escolha.nome} sai ${precoBR(viaPacote - deltaPreco)} mais em conta.` : `Dá ${centavos(deltaPreco / extra)} por foto a mais.`;
                  })()}
                </span>
              )}
              <span className="text-xs text-texto3">Vale na hora; o valor novo só a partir de {proximaCobranca ? dataBR(proximaCobranca) : 'a próxima cobrança'}. Sem multa e sem cobrança proporcional.</span>
            </div>
          </div>
        )}

        {/* 3. tabela comparativa */}
        <div className="-mx-1 overflow-x-auto px-1 pt-2">
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
                        className={cx('grid w-full gap-1 rounded-t-2xl border-2 border-b-0 px-2 pb-3 pt-3 text-center transition',
                          marcado ? 'border-obra bg-obra-suave/60' : eAtual ? 'cursor-default border-transparent bg-sup2' : 'border-transparent hover:bg-sup2')}>
                        <span className="flex min-h-5 flex-wrap justify-center gap-1">
                          {selos.map((s) => (
                            <span key={s} className={cx('whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                              s === 'seu plano' ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : s === 'ideal pro seu uso' ? 'bg-ok text-white' : 'bg-obra text-[#121A2B]')}>{s}</span>
                          ))}
                        </span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-texto2">{p.nome}</span>
                        <span><b className="font-display text-2xl text-texto">{precoBR(p.preco)}</b><span className="text-xs font-normal text-texto3">/mês</span></span>
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
              {LINHAS.map((l, i) => (
                <tr key={l.t}>
                  <td className="border-t border-borda p-3 text-texto2">
                    <span className="flex items-center gap-2"><l.ic className="size-4 shrink-0 text-obra" />{l.t}</span>
                  </td>
                  {PLANOS.map((p) => {
                    const marcado = p.id === escolhaId, eAtual = p.id === hoje.id;
                    return (
                      <td key={p.id} className={cx('border-t border-borda px-2 py-3 text-center font-semibold',
                        marcado ? 'border-x-2 border-x-obra bg-obra-suave/60' : eAtual ? 'bg-sup2' : '',
                        marcado && i === LINHAS.length - 1 && 'rounded-b-2xl border-b-2 border-b-obra')}>
                        {l.v(p)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {erro && <p className="rounded-xl bg-critico-suave px-3 py-2.5 text-sm text-critico-texto">{erro}</p>}
        {/* rodapé fixo: o botão de confirmar sempre à vista */}
        <div className="sticky -bottom-5 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-borda bg-sup px-5 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
          <span className="text-xs text-texto3">{escolha ? <>Plano {escolha.nome}: <b className="text-texto">{precoBR(escolha.preco)}/mês</b>, {milhar(escolha.fotosMes)} fotos com IA.</> : 'Pode trocar de novo quando quiser.'}</span>
          <div className="flex gap-2">
            <Botao variante="fantasma" onClick={fechar}>Voltar</Botao>
            <Botao variante="obra" disabled={!escolha} carregando={ocupado} onClick={confirmar}>{escolha ? `Quero o ${escolha.nome}` : 'Escolha um plano'}</Botao>
          </div>
        </div>
      </div>
    </Modal>
  );
}

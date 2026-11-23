import { useEffect, useRef, useState } from 'react';
import { comPaciencia } from '../../lib/paciencia';
import { Link } from 'react-router';
import { TrocarPlano } from './TrocarPlano';
import { CenaCarregando } from '../../componentes/CenaCarregando';
import { CalendarClock, CalendarDays, ExternalLink, Package, ReceiptText, RotateCw, Sparkles, Wallet, WifiOff } from 'lucide-react';
import { avisarPlanoMudou, cancelarPlano, lerCobrancas, mudarDiaCobranca, reativarPlano, type Cobranca, type HistoricoCobranca as Historico } from '../../db/organizacao';
import { PLANOS, milhar, precoBR } from '../../dominio/planos';
import { Botao, Cartao, Modal, useAviso } from '../../componentes/ui';
import { cx } from '../../lib/util';
import { exemploCobrancas } from '../../dominio/exemploPlano';

const reais = (c: number) => precoBR(c / 100);
const dia = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('pt-BR') : '—');
/** Data sem hora (vencimento, próxima cobrança): o servidor manda meia-noite UTC, então usa só AAAA-MM-DD. */
const data = (d?: string) => dia(d?.slice(0, 10));
const nomeMes = (m: string) => {
  const t = new Date(`${m}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
/** Mesma data, n meses depois (dia 1 a 28: existe em todo mês). */
const maisMeses = (iso: string, n: number) => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const x = new Date(a, m - 1 + n, d, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const STATUS: Record<Cobranca['status'], { t: string; c: string }> = {
  pago: { t: 'pago', c: 'bg-ok-suave text-ok-texto' },
  pendente: { t: 'a pagar', c: 'bg-medio-suave text-medio-texto' },
  vencido: { t: 'vencido', c: 'bg-critico-suave text-critico-texto' },
  cancelado: { t: 'cancelado', c: 'bg-sup2 text-texto3' },
  estornado: { t: 'estornado', c: 'bg-sup2 text-texto3' },
};
const MOTIVOS = ['Está caro para mim', 'Uso pouco', 'Faltou algum recurso', 'Vou usar outro sistema', 'Outro motivo'];

function LinhaCobranca({ c, exemplo }: { c: Cobranca; exemplo?: boolean }) {
  const st = STATUS[c.status] ?? STATUS.pendente;
  const quando = c.status === 'pago' ? `pago em ${dia(c.pagoEm)}` : c.vencimento ? `vence em ${data(c.vencimento)}` : `pedido em ${dia(c.criadoEm)}`;
  const recibo = `/recibo/${exemplo ? 'exemplo' : c.tipo === 'pacote' ? 'pacote' : 'mensalidade'}/${c.id}`;
  const fatura = `/fatura/${exemplo ? 'exemplo' : 'mensalidade'}/${c.id}`;
  const aberta = c.status === 'pendente' || c.status === 'vencido';
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-sup2 px-3 py-2.5">
      <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', c.tipo === 'pacote' ? 'bg-obra-suave text-obra-texto' : 'bg-sup text-texto2')}>
        {c.tipo === 'pacote' ? <Package className="size-4" /> : <Wallet className="size-4" />}
      </span>
      <span className="min-w-0 flex-1 basis-[55%]">
        <b className="block text-sm leading-snug">{c.descricao}{c.referencia && c.tipo === 'mensalidade' ? ` · ${nomeMes(c.referencia)}` : ''}</b>
        <span className="text-xs text-texto3">{quando}</span>
      </span>
      <span className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
        <b className="text-sm tabular-nums">{reais(c.valorCentavos)}</b>
        <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-extrabold', st.c)}>{st.t}</span>
        {c.status === 'pago' && <Link to={recibo} target="_blank" className="flex items-center gap-0.5 text-[11px] font-extrabold text-tinta">recibo<ExternalLink className="size-3" /></Link>}
        {aberta && c.tipo === 'mensalidade' && <Link to={fatura} target="_blank" className="flex items-center gap-0.5 rounded-full bg-obra px-2 py-0.5 text-[11px] font-extrabold text-[#121A2B]">pagar<ExternalLink className="size-3" /></Link>}
      </span>
    </li>
  );
}

/** Cobrança (só o admin): o plano e a próxima cobrança, mudar o dia, cancelar, próximas cobranças e histórico. */
export function HistoricoCobranca({ irAjuda, abrirTroca, exemplo }: { irAjuda: () => void; abrirTroca?: boolean; exemplo?: boolean }) {
  const [troca, setTroca] = useState(!!abrirTroca);
  const [trocaInicial, setTrocaInicial] = useState<string | undefined>(undefined);
  const [h, setH] = useState<Historico | null>(null);
  const [erro, setErro] = useState('');
  const [mudandoDia, setMudandoDia] = useState<number | null>(null);
  const [cancelar, setCancelar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [todas, setTodas] = useState(false);
  const { avisar, el } = useAviso();
  const [acordando, setAcordando] = useState(false);
  const parar = useRef<() => void>(undefined);
  // no exemplo nada vai ao servidor: as ações mudam só a tela
  const carregar = () => { setErro(''); parar.current?.(); if (exemplo) { setH(exemploCobrancas()); return; } parar.current = comPaciencia(lerCobrancas, setH, setErro, setAcordando); };
  useEffect(() => { carregar(); return () => parar.current?.(); }, [exemplo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) return (
    <Cartao className="grid justify-items-center gap-3 p-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-medio-suave text-medio-texto"><WifiOff className="size-6" /></span>
      <p className="max-w-md text-texto2">{erro}</p>
      <Botao variante="claro" onClick={carregar}><RotateCw className="size-4" />Tentar de novo</Botao>
    </Cartao>
  );
  if (!h) return <CenaCarregando entrar={false} texto={acordando ? 'Acordando o servidor… (pode levar até 1 minuto)' : 'Abrindo as cobranças…'} />;

  const cancelado = h.status === 'cancelada';
  const atraso = h.status === 'inadimplente';
  const emAberto = h.cobrancas.filter((c) => c.status === 'pendente' || c.status === 'vencido');
  const quandoFoi = (c: Cobranca) => c.pagoEm ?? c.vencimento ?? c.criadoEm;
  // mensalidades e pacotes vêm de lugares diferentes: junta pela data, o mais recente primeiro
  const historico = h.cobrancas.filter((c) => !(c.status === 'pendente' || c.status === 'vencido')).sort((a, b) => quandoFoi(b).localeCompare(quandoFoi(a)));
  // próximas: as já geradas em aberto + as próximas mensalidades previstas
  const previstas = !cancelado && h.pago && h.proximaCobranca
    ? [0, 1, 2].map((n) => maisMeses(h.proximaCobranca!, n)).filter((d) => !emAberto.some((c) => c.vencimento?.slice(0, 10) === d))
    : [];
  const pctPacote = h.pacotes.comprado ? Math.min(100, Math.round((h.pacotes.usado / h.pacotes.comprado) * 100)) : 0;

  const salvarDia = async () => {
    if (mudandoDia == null) return;
    setOcupado(true);
    try {
      if (exemplo && h) {
        const hj = new Date(); let d = new Date(hj.getFullYear(), hj.getMonth(), mudandoDia, 12); if (d <= hj) d = new Date(hj.getFullYear(), hj.getMonth() + 1, mudandoDia, 12);
        const prox = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setH({ ...h, diaCobranca: mudandoDia, proximaCobranca: prox, cobrancas: h.cobrancas.map((c) => (c.status === 'pendente' ? { ...c, vencimento: prox, referencia: prox.slice(0, 7) } : c)) });
        avisar(`Exemplo: a próxima cobrança iria para ${data(prox)}. Nada foi salvo.`); setMudandoDia(null);
      } else { const r = await mudarDiaCobranca(mudandoDia); avisar(`Pronto. A próxima cobrança é em ${data(r.proximaCobranca)}.`); setMudandoDia(null); carregar(); }
    }
    catch (e) { avisar((e as Error).message, 'erro'); }
    setOcupado(false);
  };
  const confirmarCancelar = async () => {
    setOcupado(true);
    try {
      if (exemplo && h) { setH({ ...h, status: 'cancelada', acessoAte: h.proximaCobranca, canceladoEm: new Date().toISOString(), cobrancas: h.cobrancas.map((c) => (c.status === 'pendente' ? { ...c, status: 'cancelado' } : c)) }); avisar('Exemplo: assim fica um plano cancelado. Nada foi salvo.'); setCancelar(false); }
      else { const r = await cancelarPlano(motivo); avisar(r.acessoAte ? `Plano cancelado. Você usa tudo até ${data(r.acessoAte)}.` : 'Plano cancelado.'); setCancelar(false); carregar(); avisarPlanoMudou(); }
    }
    catch (e) { avisar((e as Error).message, 'erro'); }
    setOcupado(false);
  };
  const reativar = async () => {
    setOcupado(true);
    try {
      if (exemplo) { setH(exemploCobrancas()); avisar('Exemplo: plano reativado. Nada foi salvo.'); }
      else { await reativarPlano(); avisar('Plano reativado. Que bom que ficou!'); carregar(); avisarPlanoMudou(); }
    }
    catch (e) { avisar((e as Error).message, 'erro'); }
    setOcupado(false);
  };

  return (
    <div className="grid gap-4">
      {el}
      {/* 1. o plano, num olhar */}
      <Cartao className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">Sua assinatura</span>
            <h3 className="font-display text-2xl font-extrabold">Plano {h.plano.nome}</h3>
            <p className="text-sm text-texto2">{h.pago ? `${reais(h.plano.precoCentavos)} por mês` : 'Fase de testes: sem cobrança'}</p>
          </div>
          <span className={cx('rounded-full px-3 py-1 text-xs font-extrabold', cancelado ? 'bg-sup2 text-texto2' : atraso ? 'bg-critico-suave text-critico-texto' : 'bg-ok-suave text-ok-texto')}>
            {cancelado ? 'cancelado' : atraso ? 'pagamento em atraso' : 'ativo'}
          </span>
        </div>

        {h.pago && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-sup2 p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-texto2"><CalendarClock className="size-4 text-obra" />{cancelado ? 'Você usa até' : 'Próxima cobrança'}</span>
              <b className="mt-1 block font-display text-2xl">{cancelado ? data(h.acessoAte) : h.proximaCobranca ? data(h.proximaCobranca) : 'a combinar'}</b>
              <span className="text-sm text-texto2">{cancelado ? 'nenhuma cobrança nova' : reais(h.proximoValorCentavos)}</span>
            </div>
            <div className="rounded-2xl bg-sup2 p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-texto2"><CalendarDays className="size-4 text-obra" />Dia da cobrança</span>
              {mudandoDia == null ? <>
                <b className="mt-1 block font-display text-2xl">{h.diaCobranca ? `Todo dia ${h.diaCobranca}` : '—'}</b>
                {!cancelado && <button onClick={() => setMudandoDia(h.diaCobranca ?? 10)} className="text-sm font-extrabold text-tinta">Mudar dia</button>}
              </> : (
                <div className="mt-1 grid gap-2">
                  <label className="flex items-center gap-2 text-sm">Todo dia
                    <select value={mudandoDia} onChange={(e) => setMudandoDia(Number(e.target.value))} className="h-10 rounded-lg border border-borda-forte bg-sup px-2 font-bold" aria-label="Dia da cobrança">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <Botao tam="p" variante="obra" carregando={ocupado} onClick={salvarDia}>Salvar</Botao>
                    <Botao tam="p" variante="fantasma" onClick={() => setMudandoDia(null)}>Voltar</Botao>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {atraso && <p className="rounded-xl bg-critico-suave px-3 py-2.5 text-sm text-critico-texto">Tem uma mensalidade vencida. Pague pelo link em "Próximas cobranças" para não parar a IA.</p>}
        {cancelado && <p className="rounded-xl bg-sup2 px-3 py-2.5 text-sm text-texto2">Seu plano foi cancelado{h.canceladoEm ? ` em ${dia(h.canceladoEm)}` : ''}. Seus laudos e obras continuam salvos.</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borda pt-3 text-sm">
          <Botao tam="p" variante="obra" onClick={() => setTroca(true)}>{h.pago ? 'Trocar de plano' : 'Escolher um plano'}</Botao>
          {h.pago && !cancelado && <button onClick={() => setCancelar(true)} className="font-extrabold text-critico-texto">Cancelar plano</button>}
          {cancelado && <Botao tam="p" variante="obra" carregando={ocupado} onClick={reativar}>Reativar plano</Botao>}
          <button onClick={irAjuda} className="font-extrabold text-tinta">Dúvidas e suporte</button>
        </div>
      </Cartao>

      {/* 2. o que vem pela frente */}
      {(emAberto.length > 0 || previstas.length > 0) && (
        <Cartao className="grid gap-2 p-4">
          <h3 className="font-bold">Próximas cobranças</h3>
          <ul className="grid gap-2">
            {emAberto.map((c) => <LinhaCobranca key={c.tipo + c.id} c={c} exemplo={exemplo} />)}
            {previstas.map((d, i) => (
              <li key={d} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-borda-forte px-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sup2 text-texto3"><Wallet className="size-4" /></span>
                <span className="min-w-0 flex-1 basis-[55%]"><b className="block text-sm">Mensalidade {h.plano.nome}</b><span className="text-xs text-texto3">{i === 0 && !emAberto.length ? 'próxima' : 'prevista'} · {data(d)}</span></span>
                <span className="ml-auto flex items-center gap-2">
                  <b className="text-sm tabular-nums text-texto2">{reais(h.proximoValorCentavos)}</b>
                  <Link to={`/fatura/${exemplo ? 'exemplo' : 'prevista'}/${d}`} target="_blank" className="flex items-center gap-0.5 text-[11px] font-extrabold text-tinta">ver<ExternalLink className="size-3" /></Link>
                </span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {/* 3. o que já foi */}
      <Cartao className="grid gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-bold"><ReceiptText className="size-4 text-obra" />Histórico</h3>
          {historico.length > 0 && <span className="text-xs text-texto3">pago em {new Date().getFullYear()}: <b className="text-texto">{reais(historico.filter((c) => c.status === 'pago' && (c.pagoEm ?? '').startsWith(String(new Date().getFullYear()))).reduce((s, c) => s + c.valorCentavos, 0))}</b></span>}
        </div>
        {historico.length ? <>
          <ul className="grid gap-2">{(todas ? historico : historico.slice(0, 5)).map((c) => <LinhaCobranca key={c.tipo + c.id} c={c} exemplo={exemplo} />)}</ul>
          {historico.length > 5 && <button onClick={() => setTodas(!todas)} className="justify-self-start text-sm font-extrabold text-tinta">{todas ? 'Mostrar menos' : `Ver todas (${historico.length})`}</button>}
        </> : <p className="text-sm text-texto2">{h.pago ? 'Nenhum pagamento ainda.' : 'Na fase de testes não há cobrança. Quando o plano pago começar, cada mensalidade e cada pacote aparecem aqui.'}</p>}
      </Cartao>

      {/* 4. fotos: pacotes e uso por mês */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="grid content-start gap-3 p-4">
          <h3 className="flex items-center gap-1.5 font-bold"><Package className="size-4 text-obra" />Fotos dos pacotes</h3>
          {h.pacotes.comprado ? <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {([['compradas', h.pacotes.comprado, ''], ['usadas a mais', h.pacotes.usado, 'text-obra-texto'], ['de saldo', h.pacotes.saldo, 'text-ok-texto']] as const).map(([t, n, c]) => (
                <div key={t} className="rounded-xl bg-sup2 p-2"><b className={cx('block font-display text-xl', c)}>{milhar(n)}</b><span className="text-xs font-bold text-texto2">{t}</span></div>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sup2" aria-label={`${pctPacote}% dos pacotes usados`}><div className="h-full rounded-full bg-obra" style={{ width: `${pctPacote}%` }} /></div>
            <p className="text-xs text-texto3">"Usadas a mais" são as fotos com IA que passaram do plano e saíram dos pacotes.</p>
          </> : <p className="text-sm text-texto2">Nenhum pacote comprado. As fotos extras só entram quando as do plano acabam.</p>}
        </Cartao>
        <Cartao className="grid content-start gap-2 p-4">
          <h3 className="flex items-center gap-1.5 font-bold"><Sparkles className="size-4 text-obra" />Fotos com IA por mês</h3>
          {h.usoMensal.length ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-texto3"><th className="py-1 font-bold">Mês</th><th className="py-1 text-right font-bold">Total</th><th className="py-1 text-right font-bold">Do plano</th><th className="py-1 text-right font-bold">A mais</th></tr></thead>
              <tbody>
                {h.usoMensal.map((m) => (
                  <tr key={m.mes} className="border-t border-borda">
                    <td className="py-1.5">{nomeMes(m.mes)}</td>
                    <td className="py-1.5 text-right font-bold tabular-nums">{milhar(m.total)}</td>
                    <td className="py-1.5 text-right tabular-nums text-texto2">{milhar(m.doPlano)}</td>
                    <td className={cx('py-1.5 text-right tabular-nums', m.doPacote ? 'font-bold text-obra-texto' : 'text-texto3')}>{m.doPacote ? milhar(m.doPacote) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-texto2">Ainda sem fotos analisadas pela IA do servidor.</p>}
        </Cartao>
      </div>

      <TrocarPlano simular={exemplo ? (id) => { const p = PLANOS.find((x) => x.id === id)!; setH({ ...h, plano: { ...h.plano, id: p.id, nome: p.nome, precoCentavos: p.preco * 100, fotosMes: p.fotosMes, usuariosMax: p.usuarios, obras: p.obras }, proximoValorCentavos: p.preco * 100 }); } : undefined} aberto={troca} aoFechar={() => { setTroca(false); setTrocaInicial(undefined); }} atual={h.plano.id} proximaCobranca={cancelado ? undefined : h.proximaCobranca}
        usoMes={Math.max(0, ...h.usoMensal.slice(0, 3).map((m) => m.total))} inicial={trocaInicial}
        aoTrocar={(msg) => { avisar(msg); carregar(); }} />

      {/* cancelar: claro e sem pegadinha */}
      <Modal aberto={cancelar} aoFechar={() => setCancelar(false)} titulo="Cancelar o plano?">
        <div className="grid gap-4">
          <ul className="grid gap-2 text-sm text-texto2">
            <li>• Você continua usando tudo até <b className="text-texto">{data(h.proximaCobranca)}</b>.</li>
            <li>• Nenhuma cobrança nova é feita. Sem multa.</li>
            <li>• Seus laudos e obras continuam salvos; dá para baixar tudo em Ajustes › Dados.</li>
            {h.pacotes.saldo > 0 && <li>• As {milhar(h.pacotes.saldo)} fotos de pacotes que sobraram continuam valendo.</li>}
          </ul>
          <label className="grid gap-1 text-sm font-bold">Se puder, conte o motivo (opcional)
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="h-11 rounded-xl border border-borda-forte bg-sup px-3 font-normal">
              <option value="">Prefiro não dizer</option>
              {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          {/* uma oferta só, ligada ao motivo, e o cancelar continua ali embaixo */}
          {(() => {
            const atualPreco = PLANOS.find((p) => p.id === h.plano.id)?.preco ?? 0;
            const menor = PLANOS.find((p) => p.preco < atualPreco);
            if ((motivo === 'Está caro para mim' || motivo === 'Uso pouco') && menor) return (
              <div className="grid gap-2 rounded-2xl border-2 border-obra bg-obra-suave/40 p-4">
                <b className="text-sm">Que tal o plano {menor.nome} por {precoBR(menor.preco)}/mês?</b>
                <span className="text-sm text-texto2">Você paga {precoBR(atualPreco - menor.preco)} a menos por mês e continua com laudos ilimitados e {milhar(menor.fotosMes)} fotos com IA. Se faltar, um pacote extra resolve.</span>
                <Botao tam="p" variante="obra" className="justify-self-start" onClick={() => { setCancelar(false); setTrocaInicial(menor.id); setTroca(true); }}>Ver o plano {menor.nome}</Botao>
              </div>
            );
            if (motivo === 'Faltou algum recurso') return (
              <div className="grid gap-2 rounded-2xl bg-sup2 p-4 text-sm text-texto2">
                <span>Conte o que faltou: muita coisa do LaudoTech nasceu de pedido de quem usa.</span>
                <button onClick={() => { setCancelar(false); irAjuda(); }} className="justify-self-start font-extrabold text-tinta">Falar com o suporte</button>
              </div>
            );
            return null;
          })()}
          <div className="flex flex-wrap justify-end gap-2">
            <Botao variante="obra" onClick={() => setCancelar(false)}>Manter meu plano</Botao>
            <Botao variante="claro" className="text-critico-texto" carregando={ocupado} onClick={confirmarCancelar}>Cancelar plano</Botao>
          </div>
        </div>
      </Modal>
    </div>
  );
}

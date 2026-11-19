import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CalendarPlus, Check, ChevronLeft, ChevronRight, MapPin, MessageCircle, Pencil, Phone, RotateCw } from 'lucide-react';
import { api, logadoNaNuvem } from '../../db/nuvem';
import { listarUsuarios, type UsuarioOrg } from '../../db/organizacao';
import { useSessao } from '../../lib/sessao';
import { TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';
import { dataISO, feriadoEm, rotuloFeriado, type Feriado, type Local } from '../../lib/feriados';
import { LegendaFeriados, corDe, lerLocal } from './LegendaFeriados';
import { Botao, Cartao, Vazio, useAviso } from '../../componentes/ui';
import { CabecalhoTela } from '../../componentes/CabecalhoTela';
import { cx } from '../../lib/util';
import { MarcarVistoria, type Agendamento, type Rascunho } from './MarcarVistoria';

/* Agenda de vistorias: visões Dia, Semana e Mês, com os feriados nacionais. */

type Visao = 'dia' | 'semana' | 'mes';
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const telefone = (c: string) => c.replace(/\D/g, '');
const noDia = (d: Date) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
const mais = (d: Date, dias: number) => { const x = new Date(d); x.setDate(x.getDate() + dias); return x; };
const inicioSemana = (d: Date) => mais(noDia(d), -d.getDay());

/** Faixa do feriado (vermelho = feriado nacional; amarelo = ponto facultativo). */
function SeloFeriado({ f }: { f: Feriado }) {
  return <span className={cx('inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-extrabold', corDe(f).selo)} title={`${rotuloFeriado(f)}: ${f.nome}`}>{f.nome}</span>;
}

/** Cartão de uma vistoria. */
function CartaoVistoria({ a, quem, aoEditar, aoFeita }: { a: Agendamento; quem?: string; aoEditar: () => void; aoFeita: () => void }) {
  const ini = new Date(a.inicio), fim = new Date(ini.getTime() + a.duracaoMin * 60e3);
  const feita = a.status === 'feito';
  const tel = telefone(a.clienteContato);
  const Acao = ({ href, onClick, ic: Ic, rot }: { href?: string; onClick?: () => void; ic: typeof Phone; rot: string }) => {
    const cls = 'flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold text-texto2 transition hover:bg-sup2 hover:text-texto';
    return href ? <a className={cls} href={href} target="_blank" rel="noreferrer"><Ic className="size-[18px]" />{rot}</a> : <button className={cls} onClick={onClick}><Ic className="size-[18px]" />{rot}</button>;
  };
  return (
    <div className={cx('overflow-hidden rounded-2xl border border-borda bg-sup', feita && 'opacity-60')}>
      <div className="flex gap-3 p-3.5">
        <div className="flex w-[58px] shrink-0 flex-col items-center justify-center self-start rounded-xl bg-[#121A2B] py-2 text-white">
          <b className="font-display text-base leading-none">{hora(ini)}</b>
          <span className="mt-1 text-[10px] text-white/60">{hora(fim)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <b className="min-w-0 truncate leading-tight">{a.clienteNome || 'Cliente sem nome'}</b>
            {feita ? <span className="shrink-0 rounded-full bg-ok-suave px-2 py-0.5 text-[11px] font-extrabold text-ok-texto">Feita</span>
              : <span className="shrink-0 rounded-full bg-obra-suave px-2 py-0.5 text-[11px] font-extrabold text-obra-texto">{TIPOS[a.tipo as TipoLaudo]?.curto ?? a.tipo}</span>}
          </div>
          {a.endereco && <p className="mt-1 flex items-start gap-1 text-sm text-texto2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-texto3" /><span className="line-clamp-2">{a.endereco}</span></p>}
          {(quem || a.observacao) && <p className="mt-1 text-xs text-texto3">{quem && <>Vai: <b className="text-texto2">{quem}</b></>}{quem && a.observacao && ' · '}{a.observacao}</p>}
        </div>
      </div>
      <div className="grid grid-cols-5 border-t border-borda px-1 py-1">
        {tel.length >= 10 ? <Acao ic={MessageCircle} rot="WhatsApp" href={`https://wa.me/55${tel}?text=${encodeURIComponent(`Olá, ${a.clienteNome}! Confirmando a vistoria em ${ini.toLocaleDateString('pt-BR')} às ${hora(ini)}.`)}`} /> : <span />}
        {tel.length >= 10 ? <Acao ic={Phone} rot="Ligar" href={`tel:${tel}`} /> : <span />}
        {a.endereco ? <Acao ic={MapPin} rot="Mapa" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.endereco)}`} /> : <span />}
        {!feita ? <Acao ic={Check} rot="Feita" onClick={aoFeita} /> : <span />}
        <Acao ic={Pencil} rot="Editar" onClick={aoEditar} />
      </div>
    </div>
  );
}

export function Agenda() {
  const { usuario } = useSessao();
  const { avisar, el } = useAviso();
  const [lista, setLista] = useState<Agendamento[] | null>(null);
  const [pessoas, setPessoas] = useState<UsuarioOrg[]>([]);
  const [erro, setErro] = useState('');
  const [visao, setVisao] = useState<Visao>(() => (innerWidth < 640 ? 'semana' : 'mes'));
  const [foco, setFoco] = useState(() => noDia(new Date()));
  const [form, setForm] = useState<Rascunho | null>(null);
  const [local, setLocal] = useState<Local>(() => lerLocal({ uf: usuario?.uf || undefined, cidade: usuario?.cidade || undefined }));
  const admin = usuario?.papel === 'admin';

  const carregar = async () => {
    setErro('');
    try {
      const de = new Date(Date.now() - 90 * 864e5).toISOString(), ate = new Date(Date.now() + 365 * 864e5).toISOString();
      setLista((await api<{ agenda: Agendamento[] }>(`/api/agenda?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`)).agenda);
      if (admin) setPessoas((await listarUsuarios()).filter((u) => u.ativo));
    } catch (e) { setErro((e as Error).message); }
  };
  useEffect(() => { if (logadoNaNuvem()) void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (a: Rascunho) => {
    try {
      await api('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) });
      setForm(null); await carregar(); avisar(a.status === 'cancelado' ? 'Visita cancelada' : 'Agenda salva');
    } catch (e) { avisar((e as Error).message, 'erro'); }
  };
  const apagar = async (id: string) => { try { await api(`/api/agenda/${id}`, { method: 'DELETE' }); setForm(null); await carregar(); avisar('Apagada'); } catch (e) { avisar((e as Error).message, 'erro'); } };

  // vistorias por dia (AAAA-MM-DD), sem as canceladas
  const porDia = useMemo(() => {
    const m = new Map<string, Agendamento[]>();
    for (const a of lista ?? []) {
      if (a.status === 'cancelado') continue;
      const k = dataISO(new Date(a.inicio));
      m.set(k, [...(m.get(k) ?? []), a].sort((x, y) => x.inicio.localeCompare(y.inicio)));
    }
    return m;
  }, [lista]);

  if (!logadoNaNuvem()) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Vazio icone={<CalendarCheck2 className="size-7" />} titulo="Agenda precisa da conta no servidor" texto="Entre com a sua conta do LaudoTech para marcar vistorias e ver a agenda da equipe." />
    </div>
  );

  const nomePessoa = (id?: string) => (admin ? pessoas.find((p) => p.id === id)?.nome : undefined);
  const novaEm = (d: Date) => { const x = noDia(d); x.setHours(9, 0, 0, 0); setForm({ clienteNome: '', clienteContato: '', endereco: '', tipo: 'cautelar', inicio: x.toISOString(), duracaoMin: 60, status: 'marcado', observacao: '' }); };
  const andar = (n: number) => setFoco((f) => (visao === 'mes' ? new Date(f.getFullYear(), f.getMonth() + n, 1, 12) : mais(f, visao === 'semana' ? 7 * n : n)));
  const titulo = visao === 'mes' ? foco.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : visao === 'semana' ? `${inicioSemana(foco).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${mais(inicioSemana(foco), 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
      : foco.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const hojeK = dataISO(new Date());

  const ListaDoDia = ({ d, compacto }: { d: Date; compacto?: boolean }) => {
    const k = dataISO(d), as = porDia.get(k) ?? [], f = feriadoEm(k, local);
    return (
      <section className={cx(compacto && 'rounded-2xl border border-borda bg-sup/50 p-3', k === hojeK && compacto && 'border-tinta/40')}>
        {compacto && (
          <button onClick={() => { setFoco(noDia(d)); setVisao('dia'); }} className="mb-2 flex w-full flex-wrap items-center gap-2 text-left">
            <b className={cx('text-sm', k === hojeK && 'text-tinta')}>{SEMANA[d.getDay()]}, {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{k === hojeK && ' · hoje'}</b>
            {f && <SeloFeriado f={f} />}
            <span className="ml-auto text-xs text-texto3">{as.length ? `${as.length} vistoria${as.length > 1 ? 's' : ''}` : 'livre'}</span>
          </button>
        )}
        {!compacto && f && <p className={cx('mb-3 rounded-xl px-3 py-2 text-sm font-bold', corDe(f).selo)}>{rotuloFeriado(f)}: {f.nome}</p>}
        <div className="grid gap-2">
          {as.map((a) => <CartaoVistoria key={a.id} a={a} quem={nomePessoa(a.usuarioId)} aoEditar={() => setForm({ ...a })} aoFeita={() => salvar({ ...a, status: 'feito' })} />)}
          {!compacto && !as.length && (
            <button onClick={() => novaEm(d)} className="grid place-items-center gap-1 rounded-2xl border-2 border-dashed border-borda-forte p-8 text-texto2 hover:border-obra hover:text-obra-texto">
              <CalendarPlus className="size-6" /><b>Dia livre</b><span className="text-sm">Toque para marcar uma vistoria</span>
            </button>
          )}
        </div>
      </section>
    );
  };

  const Mes = () => {
    const primeiro = new Date(foco.getFullYear(), foco.getMonth(), 1, 12);
    const ini = mais(primeiro, -primeiro.getDay());
    const celulas = Array.from({ length: 42 }, (_, i) => mais(ini, i));
    return (
      <div className="overflow-hidden rounded-2xl border border-borda bg-sup">
        <div className="grid grid-cols-7 border-b border-borda bg-sup2 text-center text-[11px] font-extrabold uppercase tracking-wider text-texto3">
          {SEMANA.map((s, i) => <span key={s} className={cx('py-2', (i === 0 || i === 6) && 'text-texto3/70')}>{s.slice(0, 3)}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {celulas.map((d) => {
            const k = dataISO(d), as = porDia.get(k) ?? [], f = feriadoEm(k, local);
            const fora = d.getMonth() !== foco.getMonth();
            return (
              <button key={k} onClick={() => { setFoco(noDia(d)); setVisao('dia'); }}
                className={cx('flex min-h-[64px] flex-col items-start gap-1 border-b border-r border-borda p-1.5 text-left transition hover:bg-sup2 sm:min-h-[92px]', fora && 'bg-sup2/40 text-texto3', f?.tipo === 'feriado' && !fora && 'bg-sup2/70')}>
                <span className={cx('grid size-6 place-items-center rounded-full text-xs font-extrabold', k === hojeK && 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]')}>{d.getDate()}</span>
                {f && !fora && <span className="hidden w-full sm:block"><SeloFeriado f={f} /></span>}
                {f && !fora && <span className={cx('size-1.5 rounded-full sm:hidden', corDe(f).ponto)} />}
                {as.length > 0 && (
                  <span className="w-full">
                    <span className="hidden truncate rounded-md bg-obra-suave px-1 py-0.5 text-[10px] font-bold text-obra-texto sm:block">{hora(new Date(as[0].inicio))} {as[0].clienteNome}</span>
                    {as.length > 1 && <span className="hidden text-[10px] font-bold text-texto3 sm:block">+{as.length - 1}</span>}
                    <span className="flex gap-0.5 sm:hidden">{as.slice(0, 3).map((a) => <span key={a.id} className="size-1.5 rounded-full bg-obra" />)}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // números do topo e a próxima vistoria
  const futuras = (lista ?? []).filter((a) => a.status === 'marcado' && new Date(a.inicio).getTime() >= Date.now() - 3600e3).sort((x, y) => x.inicio.localeCompare(y.inicio));
  const proxima = futuras[0];
  const contar = (de: number, dias: number) => { const a = mais(noDia(new Date()), de), b = mais(a, dias); const ka = dataISO(a), kb = dataISO(b); return futuras.filter((x) => { const k = dataISO(new Date(x.inicio)); return k >= ka && k < kb; }).length; };
  const feitasMes = (lista ?? []).filter((a) => a.status === 'feito' && new Date(a.inicio).getMonth() === new Date().getMonth() && new Date(a.inicio).getFullYear() === new Date().getFullYear()).length;
  const rotuloProx = proxima ? (() => { const d = new Date(proxima.inicio); const k = dataISO(d); return k === hojeK ? 'hoje' : k === dataISO(mais(noDia(new Date()), 1)) ? 'amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }); })() : '';
  const feriadoProx = proxima ? feriadoEm(dataISO(new Date(proxima.inicio)), local) : undefined;
  const proximos = (() => { const h = new Date(); return [...porDia.entries()].filter(([k]) => k >= hojeK).reduce((s, [, as]) => s + as.filter((a) => a.status === 'marcado' && new Date(a.inicio) >= h).length, 0); })();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-9">
      <CabecalhoTela sobre={admin ? 'Agenda de toda a equipe' : 'Suas vistorias'} titulo="Sua" grifo="agenda"
        acao={<button onClick={() => novaEm(visao === 'dia' ? foco : mais(noDia(new Date()), 1))} className="pilula pilula-obra"><CalendarPlus className="size-5" />Marcar vistoria</button>}
        humor={proxima ? 'normal' : 'feliz'}
        lia={!lista ? 'Abrindo a agenda…' : proxima
          ? <>Próxima vistoria: <b>{rotuloProx}</b> às <b>{hora(new Date(proxima.inicio))}</b>{proxima.clienteNome && <> com {proxima.clienteNome}</>}.{feriadoProx && <> Atenção: é {rotuloFeriado(feriadoProx).toLowerCase()} ({feriadoProx.nome}).</>}</>
          : 'Nenhuma vistoria marcada. Toque em "Marcar vistoria" para agendar a próxima.'}
        numeros={[{ n: contar(0, 1), t: 'hoje' }, { n: contar(0, 7), t: 'próximos 7 dias' }, { n: proximos, t: 'pela frente' }, { n: feitasMes, t: 'feitas no mês' }]} />

      {/* visão e navegação */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-borda bg-sup p-1" role="tablist" aria-label="Visão da agenda">
          {(['dia', 'semana', 'mes'] as Visao[]).map((v) => (
            <button key={v} role="tab" aria-selected={visao === v} onClick={() => setVisao(v)}
              className={cx('h-8 rounded-lg px-3 text-sm font-extrabold transition', visao === v ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'text-texto2 hover:bg-sup2')}>
              {v === 'dia' ? 'Dia' : v === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => andar(-1)} aria-label="Anterior" className="grid size-9 place-items-center rounded-xl border border-borda bg-sup hover:bg-sup2"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setFoco(noDia(new Date()))} className="h-9 rounded-xl border border-borda bg-sup px-3 text-sm font-extrabold hover:bg-sup2">Hoje</button>
          <button onClick={() => andar(1)} aria-label="Próximo" className="grid size-9 place-items-center rounded-xl border border-borda bg-sup hover:bg-sup2"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <h2 className="mt-4 text-lg font-extrabold first-letter:uppercase">{titulo}</h2>

      <div className="mt-3">
        {erro ? (
          <Cartao className="p-5 text-center"><p className="text-texto2">{erro}</p><Botao className="mt-3" variante="claro" onClick={carregar}><RotateCw className="size-4" />Tentar de novo</Botao></Cartao>
        ) : !lista ? <div className="h-64 animate-pulse rounded-2xl bg-sup2" />
          : visao === 'mes' ? <Mes />
            : visao === 'semana' ? <div className="grid gap-2">{Array.from({ length: 7 }, (_, i) => <ListaDoDia key={i} d={mais(inicioSemana(foco), i)} compacto />)}</div>
              : <ListaDoDia d={foco} />}
      </div>
      <LegendaFeriados local={local} aoMudar={setLocal} />

      {form && <MarcarVistoria inicial={form} local={local} admin={admin} pessoas={pessoas} euId={usuario?.id}
        aoFechar={() => setForm(null)} aoSalvar={salvar} aoApagar={form.id ? () => apagar(form.id!) : undefined} />}
      {el}

    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, CalendarDays, ChevronRight, HardHat, Plus, Search } from 'lucide-react';
import { db } from '../../db/db';
import { STATUS_OBRA, prazoObra, resumoObra, type Obra, type StatusObra } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { useSessao } from '../../lib/sessao';
import { Carregando, Selo, Vazio } from '../../componentes/ui';
import { BarraDupla } from '../../componentes/Pecas';
import { Lia } from '../../componentes/Lia';
import { cx, dataBR, haQuanto } from '../../lib/util';
import { NovaObra } from './NovaObra';

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function CartaoObra({ o }: { o: Obra }) {
  const r = resumoObra(o);
  const p = prazoObra(o);
  return (
    <Link to={`/obra/${o.id}`} className="group grid gap-3 rounded-[20px] border border-borda bg-sup p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,26,43,.07)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold leading-tight">{o.nome}</h3>
          <p className="truncate text-sm text-texto2">{o.endereco || o.cliente || 'Sem endereço'}</p>
        </div>
        <Selo tom={STATUS_OBRA[o.status].tom}>{STATUS_OBRA[o.status].nome}</Selo>
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-bold">Avanço físico <b className="font-display text-lg">{r.fisico}%</b></span>
          {r.previsto != null && <span className={cx('text-xs font-bold', r.desvio! < -5 ? 'text-critico-texto' : 'text-texto3')}>previsto {r.previsto}%</span>}
        </div>
        <BarraDupla real={r.fisico} previsto={r.previsto} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-texto2">
        {p && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{p.restantes >= 0 ? `${p.restantes} dias para o fim` : `${-p.restantes} dias além do prazo`}</span>}
        {r.atrasadas > 0 && <span className="flex items-center gap-1 text-critico-texto"><AlarmClock className="size-3.5" />{r.atrasadas} etapa{r.atrasadas > 1 ? 's' : ''} atrasada{r.atrasadas > 1 ? 's' : ''}</span>}
        {r.fin.orcado > 0 && <span>{reais(r.fin.realizado)} de {reais(r.fin.orcado)}</span>}
        <span className="ml-auto flex items-center gap-1 text-texto3">{r.ultimoDiario ? `diário ${dataBR(r.ultimoDiario.data)}` : `criada ${haQuanto(o.criadoEm)}`}<ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

/** Lista de obras: busca, filtro por status e um resumo no topo. */
export function ListaObras() {
  const { usuario } = useSessao();
  const obras = useLiveQuery(() => db.obras.orderBy('atualizadoEm').reverse().toArray(), []);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<'todas' | StatusObra>('todas');
  const [nova, setNova] = useState(false);

  const filtradas = useMemo(() => {
    const t = normal(busca.trim());
    return (obras ?? []).filter((o) => (status === 'todas' || o.status === status) && (!t || normal(`${o.nome} ${o.endereco} ${o.cliente}`).includes(t)));
  }, [obras, busca, status]);

  if (!usuario || !obras) return <Carregando />;
  const ativas = obras.filter((o) => o.status === 'andamento');
  const atrasadas = obras.filter((o) => resumoObra(o).atrasadas > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 md:px-8 md:py-8">
      <section className="relative overflow-hidden rounded-[24px] bg-[#121A2B] p-5 text-white md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-obra/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#A9B1C1]">Gestão de obras</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight md:text-4xl">Suas <span className="grifo">obras</span></h1>
          </div>
          <button onClick={() => setNova(true)} className="pilula pilula-obra"><Plus className="size-5" />Nova obra</button>
        </div>
        <Lia className="relative mt-4 max-w-2xl" tom="escuro" tam={40} humor={atrasadas ? 'atenta' : 'feliz'}>
          {obras.length === 0 ? 'Cadastre a obra e eu ajudo no diário, no cronograma, nas compras e no financeiro.'
            : atrasadas ? `${atrasadas} obra${atrasadas > 1 ? 's têm' : ' tem'} etapa atrasada. Vale olhar o cronograma.`
              : 'Cronogramas em dia. Lembre de preencher o diário de hoje.'}
        </Lia>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          {[{ n: obras.length, t: 'obras' }, { n: ativas.length, t: 'em andamento' }, { n: atrasadas, t: 'com atraso', alerta: atrasadas > 0 }].map((s) => (
            <div key={s.t} className="rounded-2xl bg-white/[.07] px-2 py-3 text-center ring-1 ring-white/10">
              <div className={cx('font-display text-2xl font-extrabold md:text-3xl', s.alerta && 'text-[#FF8B8B]')}>{s.n}</div>
              <div className="text-[11px] font-bold text-[#A9B1C1] md:text-sm">{s.t}</div>
            </div>
          ))}
        </div>
        <div className="fita absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
      </section>

      <label className="mt-5 flex h-11 items-center rounded-xl border border-borda-forte bg-sup focus-within:border-tinta">
        <Search className="ml-3 size-[18px] shrink-0 text-texto3" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar obra, endereço, cliente…" className="h-full w-full min-w-0 bg-transparent px-2.5 outline-none placeholder:text-texto3" />
      </label>
      <div className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist">
        {([['todas', 'Todas'], ...Object.entries(STATUS_OBRA).map(([k, v]) => [k, v.nome])] as [string, string][]).map(([k, v]) => {
          const n = k === 'todas' ? obras.length : obras.filter((o) => o.status === k).length;
          return (
            <button key={k} role="tab" aria-selected={status === k} onClick={() => setStatus(k as typeof status)}
              className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition', status === k ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda hover:text-texto')}>
              {v}<span className={cx('text-xs', status === k ? 'text-obra' : 'text-texto3')}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {obras.length === 0 ? (
          <Vazio icone={<HardHat className="size-7" />} titulo="Nenhuma obra ainda" texto="Cadastre a obra para ter diário, cronograma, compras e financeiro num lugar só, e um link para o cliente acompanhar.">
            <button onClick={() => setNova(true)} className="pilula pilula-obra"><Plus className="size-5" />Nova obra</button>
          </Vazio>
        ) : filtradas.length === 0 ? (
          <Vazio icone={<Search className="size-7" />} titulo="Nada encontrado" texto="Tente outro termo ou outro status." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {filtradas.map((o) => <CartaoObra key={o.id} o={o} />)}
          </div>
        )}
      </div>
      <NovaObra aberto={nova} aoFechar={() => setNova(false)} />
    </div>
  );
}

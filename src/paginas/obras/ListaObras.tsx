import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, BookOpenText, ChevronRight, HardHat, MapPin, Plus, Search, ShoppingCart, User } from 'lucide-react';
import { db } from '../../db/db';
import { STATUS_OBRA, TIPO_OBRA, prazoObra, resumoObra, situacaoEtapa, type Obra, type StatusObra } from '../../dominio/obra';
import { ICONE_OBRA } from './CamposObra';
import { reais } from '../../dominio/plano';
import { useSessao } from '../../lib/sessao';
import { Carregando, Selo, Vazio } from '../../componentes/ui';
import { BarraDupla, Rotulado } from '../../componentes/Pecas';
import { Lia } from '../../componentes/Lia';
import { cx, dataBR, haQuanto } from '../../lib/util';
import { NovaObra } from './NovaObra';

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Cartão da obra: tipo e status no topo, onde e para quem, avanço explicado e números com rótulo. */
function CartaoObra({ o }: { o: Obra }) {
  const r = resumoObra(o);
  const p = prazoObra(o);
  const Ic = o.tipo ? ICONE_OBRA[o.tipo] : HardHat;
  const concluidas = o.etapas.filter((e) => e.percentual >= 100).length;
  const atrasadasCriticas = o.etapas.filter((e) => e.nivel === 'critica' && situacaoEtapa(e) === 'atrasada').length;
  const orcado = r.fin.orcado || o.orcamentoPrevisto || 0;
  const atrasada = r.desvio != null && r.desvio < -5;
  return (
    <Link to={`/obra/${o.id}`} className="group flex flex-col overflow-hidden rounded-[20px] border border-borda bg-sup transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,26,43,.08)]">
      {/* topo: tipo e status */}
      <div className="relative flex items-center justify-between gap-2 bg-[#121A2B] px-4 py-2.5 text-white">
        <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-obra"><Ic className="size-4" />{o.tipo ? TIPO_OBRA[o.tipo].nome : 'Obra'}</span>
        <Selo tom={STATUS_OBRA[o.status].tom}>{STATUS_OBRA[o.status].nome}</Selo>
        <span className="fita absolute inset-x-0 bottom-0 h-1" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* o quê, onde e para quem */}
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-extrabold leading-tight">{o.nome}</h3>
          {o.endereco && <p className="mt-0.5 flex items-start gap-1 text-sm text-texto2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span className="line-clamp-1">{o.endereco}</span></p>}
          {o.cliente && <p className="flex items-center gap-1 text-sm text-texto2"><User className="size-3.5 shrink-0" /><span className="truncate">{o.cliente}</span></p>}
        </div>

        {/* avanço explicado */}
        <div className="grid gap-1.5 rounded-2xl bg-sup2 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-texto3">Avanço físico</span>
            <span className="font-display text-2xl font-extrabold leading-none">{r.fisico}%</span>
          </div>
          <BarraDupla real={r.fisico} previsto={r.previsto} />
          <span className={cx('text-xs', atrasada ? 'font-bold text-critico-texto' : 'text-texto2')}>
            {r.previsto == null ? 'Sem datas no cronograma para comparar.'
              : atrasada ? `Atrasada: deveria estar em ${r.previsto}% (${-r.desvio!} pts abaixo)`
                : `No ritmo · previsto para hoje: ${r.previsto}%`}
          </span>
        </div>

        {/* números com rótulo */}
        <div className="grid grid-cols-3 gap-2">
          <Rotulado rotulo="Prazo" alerta={!!p && p.restantes < 0}>{p ? (p.restantes >= 0 ? `${p.restantes} dias` : `+${-p.restantes} dias`) : '—'}</Rotulado>
          <Rotulado rotulo="Etapas">{o.etapas.length ? `${concluidas} de ${o.etapas.length}` : '—'}</Rotulado>
          <Rotulado rotulo={r.fin.realizado ? 'Gasto' : 'Orçamento'} inteiro>{r.fin.realizado ? reaisCurto(r.fin.realizado) : orcado ? reaisCurto(orcado) : '—'}</Rotulado>
        </div>

        {/* alertas e rodapé */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-borda pt-2.5 text-xs">
          {r.atrasadas > 0 && <span className="flex items-center gap-1 font-bold text-critico-texto"><AlarmClock className="size-3.5" />{r.atrasadas} etapa{r.atrasadas > 1 ? 's' : ''} atrasada{r.atrasadas > 1 ? 's' : ''}{atrasadasCriticas > 0 && ` (${atrasadasCriticas} crítica${atrasadasCriticas > 1 ? 's' : ''})`}</span>}
          {r.comprasAbertas > 0 && <span className="flex items-center gap-1 text-texto2"><ShoppingCart className="size-3.5" />{r.comprasAbertas} compra{r.comprasAbertas > 1 ? 's' : ''}</span>}
          <span className="ml-auto flex items-center gap-1 text-texto3">{r.ultimoDiario ? <><BookOpenText className="size-3.5" />diário {dataBR(r.ultimoDiario.data)}</> : `criada ${haQuanto(o.criadoEm)}`}<ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></span>
        </div>
      </div>
    </Link>
  );
}

/** R$ curto para caber no cartão: R$ 180 mil, R$ 1,2 mi. */
function reaisCurto(v: number) {
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 1e4) return `R$ ${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`;
  return reais(v);
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

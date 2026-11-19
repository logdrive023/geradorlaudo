import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlarmClock, ChevronRight, ClipboardList, Search } from 'lucide-react';
import type { Foto, Laudo } from '../dominio/modelo';
import { STATUS_ACAO, dataCurta, itensPlano, planoPreenchido, reais, type ItemPlano } from '../dominio/plano';
import { SeloGravidade } from './ui';
import { cx } from '../lib/util';

type Filtro = 'emAberto' | 'aberta' | 'andamento' | 'resolvida' | 'atrasadas' | 'todas';
const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'emAberto', rotulo: 'Em aberto' }, { id: 'aberta', rotulo: 'A fazer' }, { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'atrasadas', rotulo: 'Atrasadas' }, { id: 'resolvida', rotulo: 'Fechadas' }, { id: 'todas', rotulo: 'Todas' },
];
const COR: Record<string, string> = { aberta: 'bg-critico-suave text-critico-texto', andamento: 'bg-medio-suave text-medio-texto', resolvida: 'bg-ok-suave text-ok-texto' };
const passa = (f: Filtro, i: ItemPlano) => f === 'todas' || (f === 'emAberto' ? i.acomp.status !== 'resolvida' : f === 'atrasadas' ? i.atrasado : i.acomp.status === f);
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Itens do plano de todos os laudos (só dos laudos em que o plano foi preenchido). */
export function itensDoPainel(laudos: Laudo[], porLaudo: Map<string, Foto[]>) {
  return laudos.flatMap((l) => {
    const its = itensPlano(l, porLaudo.get(l.id) ?? []);
    return planoPreenchido(its) ? its.map((i) => ({ ...i, laudo: l })) : [];
  });
}

/**
 * Plano de ação de todos os laudos: filtro por fase, busca e valor que acompanha o filtro.
 * `buscaExterna`: a busca vem do painel (uma barra só para laudos e plano).
 */
export function PainelPlano({ laudos, porLaudo, buscaExterna }: { laudos: Laudo[]; porLaudo: Map<string, Foto[]>; buscaExterna?: string }) {
  const [filtro, setFiltro] = useState<Filtro>('emAberto');
  const [buscaPropria, setBusca] = useState('');
  const busca = buscaExterna ?? buscaPropria;
  const [todos, setTodos] = useState(false);

  const itens = useMemo(() => itensDoPainel(laudos, porLaudo), [laudos, porLaudo]);
  if (!itens.length) return null;

  const termo = normal(busca.trim());
  const buscados = termo ? itens.filter((i) => normal([i.achado.tipo, i.laudo.titulo, i.foto.analise?.ambiente, i.acomp.responsavel, i.laudo.dados.endereco].filter(Boolean).join(' ')).includes(termo)) : itens;
  const visiveis = buscados.filter((i) => passa(filtro, i));
  const conta = (f: Filtro) => buscados.filter((i) => passa(f, i)).length;
  const valor = visiveis.reduce((s, i) => s + (i.acomp.custo ?? 0), 0);
  const mostrar = todos ? visiveis : visiveis.slice(0, 6);

  return (
    <section className={cx(buscaExterna == null && 'mt-5 rounded-[22px] border border-borda bg-sup p-4')} aria-label="Plano de ação">
      <div className="flex flex-wrap items-end justify-between gap-2">
        {buscaExterna == null ? <h2 className="flex items-center gap-1.5 text-lg font-extrabold"><ClipboardList className="size-5 text-obra" />Plano de ação</h2>
          : <span className="text-sm font-bold text-texto2">Total da seleção</span>}
        <p className="text-right text-sm text-texto2">
          <b className="font-display text-lg text-texto">{reais(valor)}</b>
          <span className="block text-xs">{FILTROS.find((f) => f.id === filtro)!.rotulo.toLowerCase()}{termo && ' · na busca'} · {visiveis.length} {visiveis.length === 1 ? 'item' : 'itens'}</span>
        </p>
      </div>

      {buscaExterna == null && <label className="mt-3 flex h-10 items-center rounded-xl border border-borda-forte bg-sup focus-within:border-tinta">
        <Search className="ml-3 size-4 shrink-0 text-texto3" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar anomalia, laudo, ambiente, responsável…" className="h-full w-full min-w-0 bg-transparent px-2.5 text-sm outline-none placeholder:text-texto3" />
      </label>}

      <div className="-mx-4 mt-3 overflow-x-auto px-4" role="tablist" aria-label="Filtrar por fase">
        <div className="flex w-max gap-1.5">
          {FILTROS.map((f) => {
            const n = conta(f.id);
            return (
              <button key={f.id} role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
                className={cx('flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold transition', filtro === f.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup2 text-texto2 hover:text-texto', f.id === 'atrasadas' && n > 0 && filtro !== f.id && 'text-critico-texto')}>
                {f.id === 'atrasadas' && <AlarmClock className="size-3.5" />}{f.rotulo}<span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-sup2 p-4 text-center text-sm text-texto2">Nada {termo ? 'encontrado com essa busca' : 'nesta fase'}.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {mostrar.map((i) => (
            <li key={`${i.laudo.id}-${i.achado.id}`}>
              <Link to={`/laudo/${i.laudo.id}?aba=laudo`} className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 overflow-hidden rounded-2xl bg-sup2 py-2.5 pl-4 pr-3 transition hover:bg-obra-suave">
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--${i.achado.gravidade})` }} aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5"><b className="truncate">{i.achado.tipo}</b><SeloGravidade g={i.achado.gravidade} /></span>
                  <span className="block truncate text-xs text-texto2">{i.laudo.titulo}{i.foto.analise?.ambiente && ` · ${i.foto.analise.ambiente}`}</span>
                  <span className={cx('mt-0.5 flex items-center gap-1 text-xs', i.atrasado ? 'font-bold text-critico-texto' : 'text-texto3')}><AlarmClock className="size-3" />{dataCurta(i.prazo)}{i.acomp.responsavel && ` · ${i.acomp.responsavel}`}</span>
                </span>
                <span className="grid justify-items-end gap-1">
                  <span className={cx('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold', COR[i.acomp.status])}>{STATUS_ACAO[i.acomp.status].nome}</span>
                  <span className="flex items-center gap-1 text-sm font-extrabold">{i.acomp.custo != null ? reais(i.acomp.custo) : <span className="text-xs font-bold text-texto3">—</span>}<ChevronRight className="size-4 text-texto3" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {visiveis.length > 6 && (
        <button onClick={() => setTodos(!todos)} className="mt-2 w-full rounded-xl py-2 text-sm font-extrabold text-tinta hover:bg-sup2">{todos ? 'Mostrar menos' : `Ver todos (${visiveis.length})`}</button>
      )}
    </section>
  );
}

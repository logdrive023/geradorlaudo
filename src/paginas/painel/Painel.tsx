import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, AlertTriangle, Camera, ClipboardList, ChevronRight, Copy, FilePlus2, FileText, ImageOff, MoreVertical, Search, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { db, excluirLaudo } from '../../db/db';
import { criarLaudoExemplo } from '../../db/exemplo';
import { useSessao } from '../../lib/sessao';
import { Barra, Botao, Carregando, Cartao, Modal, Selo, Vazio, useAviso, useUrl } from '../../componentes/ui';
import { LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import { STATUS_LAUDO, type Foto, type Laudo, type StatusLaudo, type TipoLaudo } from '../../dominio/modelo';
import { progressoFotos, resumoAchados } from '../../dominio/regras';
import { itensPlano, planoPreenchido, reais, resumoPlano } from '../../dominio/plano';
import { cx, haQuanto, novoId } from '../../lib/util';
import { ICONE_TIPO, NovoLaudo } from './NovoLaudo';
import { Lia } from '../../componentes/Lia';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Cartão do laudo: lista no celular (foto à esquerda), grade com capa no computador. */
function CartaoLaudo({ laudo, fotos, autor, aoDuplicar, aoExcluir }: { laudo: Laudo; fotos: Foto[]; autor?: string; aoDuplicar: () => void; aoExcluir: () => void }) {
  const [menu, setMenu] = useState(false);
  const capa = useUrl(fotos[0]?.miniatura);
  const p = progressoFotos(fotos);
  const r = resumoAchados(fotos);
  const Ic = ICONE_TIPO[laudo.tipo];
  const tomStatus = laudo.status === 'concluido' ? 'ok' : laudo.status === 'conferencia' ? 'obra' : 'neutro';
  return (
    <Cartao className="group relative flex overflow-hidden transition hover:shadow-[0_12px_30px_rgba(18,26,43,.08)] sm:flex-col sm:hover:-translate-y-0.5">
      <Link to={`/laudo/${laudo.id}`} className="absolute inset-0 z-0" aria-label={`Abrir ${laudo.titulo}`} />
      <div className="relative w-28 shrink-0 bg-sup2 sm:aspect-[16/8] sm:w-full">
        {capa ? <img src={capa} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-texto3"><ImageOff className="size-7" /></div>}
        <span className="absolute left-2 top-2 hidden items-center gap-1 rounded-full bg-[#121A2B]/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur sm:inline-flex"><Ic className="size-3.5" />{TIPOS[laudo.tipo].curto}</span>
        {r.critico > 0 && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-critico px-2 py-0.5 text-[11px] font-extrabold text-white sm:bottom-auto sm:left-auto sm:right-3 sm:top-2 sm:px-2.5 sm:py-1 sm:text-xs"><AlertTriangle className="size-3.5" />{r.critico}<span className="hidden sm:inline"> crítico{r.critico > 1 ? 's' : ''}</span></span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-obra-texto sm:hidden">{TIPOS[laudo.tipo].curto}</span>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug sm:text-[17px]">{laudo.titulo}</h3>
          </div>
          <div className="relative z-10">
            <button onClick={() => setMenu(!menu)} aria-label="Mais ações" className="-mr-1.5 rounded-lg p-1.5 text-texto3 hover:bg-sup2 hover:text-texto"><MoreVertical className="size-5" /></button>
            {menu && (
              <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-borda bg-sup py-1 shadow-xl" onMouseLeave={() => setMenu(false)}>
                <button onClick={() => { setMenu(false); aoDuplicar(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-sup2"><Copy className="size-4" />Duplicar</button>
                <button onClick={() => { setMenu(false); aoExcluir(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-critico-texto hover:bg-critico-suave"><Trash2 className="size-4" />Excluir</button>
              </div>
            )}
          </div>
        </div>
        {laudo.dados.endereco && <p className="line-clamp-1 text-sm text-texto2">{laudo.dados.endereco}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <Selo tom={tomStatus}>{STATUS_LAUDO[laudo.status]}</Selo>
          <Selo><Camera className="size-3.5" />{p.total}</Selo>
          {autor && <Selo tom="tinta">{autor}</Selo>}
          <span className="ml-auto hidden text-xs text-texto3 sm:inline">{haQuanto(laudo.atualizadoEm)}</span>
        </div>
        {p.total > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <Barra className="flex-1" valor={p.conferidas} total={p.total} />
            <span className="text-xs font-bold text-texto3">{p.conferidas}/{p.total}</span>
          </div>
        )}
      </div>
    </Cartao>
  );
}

export function Painel() {
  const { usuario } = useSessao();
  const nav = useNavigate();
  const { avisar, el } = useAviso();
  const [aba, setAba] = useState<'todos' | TipoLaudo>('todos');
  const [status, setStatus] = useState<'todos' | StatusLaudo>('todos');
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState(false);
  const [excluir, setExcluir] = useState<Laudo | null>(null);
  const [criandoEx, setCriandoEx] = useState(false);
  const [busca2, setBusca2] = useSearchParams();
  const [novo, setNovo] = useState(() => busca2.get('novo') === '1');
  useEffect(() => { if (busca2.get('novo') === '1') { setNovo(true); setBusca2({}, { replace: true }); } }, [busca2]); // eslint-disable-line react-hooks/exhaustive-deps
  const admin = usuario?.papel === 'admin';

  const dados = useLiveQuery(async () => {
    if (!usuario) return null;
    const laudos = admin ? await db.laudos.toArray() : await db.laudos.where('usuarioId').equals(usuario.id).toArray();
    laudos.sort((a, b) => b.atualizadoEm - a.atualizadoEm);
    const ids = laudos.map((l) => l.id);
    const fotos = ids.length ? await db.fotos.where('laudoId').anyOf(ids).toArray() : [];
    const porLaudo = new Map<string, Foto[]>();
    for (const f of fotos.sort((a, b) => a.ordem - b.ordem)) porLaudo.set(f.laudoId, [...(porLaudo.get(f.laudoId) ?? []), f]);
    const autores = new Map((await db.usuarios.toArray()).map((u) => [u.id, u.nome]));
    return { laudos, porLaudo, autores };
  }, [usuario?.id, admin]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const q = busca.trim().toLowerCase();
    return dados.laudos
      .filter((l) => aba === 'todos' || l.tipo === aba)
      .filter((l) => status === 'todos' || l.status === status)
      .filter((l) => !q || `${l.titulo} ${l.dados.endereco ?? ''} ${l.dados.solicitante ?? ''}`.toLowerCase().includes(q));
  }, [dados, aba, status, busca]);

  if (!usuario || !dados) return <Carregando />;

  const todasFotos = [...dados.porLaudo.values()].flat();
  const r = resumoAchados(todasFotos);
  const emAndamento = dados.laudos.filter((l) => l.status !== 'concluido').length;
  const aConferir = todasFotos.filter((f) => f.status === 'analisada').length;
  const laudoAConferir = dados.laudos.find((l) => dados.porLaudo.get(l.id)?.some((f) => f.status === 'analisada'));

  const duplicar = async (l: Laudo) => {
    const id = novoId();
    const fotos = dados.porLaudo.get(l.id) ?? [];
    await db.transaction('rw', db.laudos, db.fotos, async () => {
      await db.laudos.add({ ...l, id, titulo: `${l.titulo} (cópia)`, status: 'rascunho', usuarioId: usuario.id, criadoEm: Date.now(), atualizadoEm: Date.now() });
      await db.fotos.bulkAdd(fotos.map((f) => ({ ...f, id: novoId(), laudoId: id })));
    });
    avisar('Laudo duplicado');
  };

  const exemplo = async () => {
    setCriandoEx(true);
    const id = await criarLaudoExemplo(usuario.id);
    nav(`/laudo/${id}?aba=conferir`);
  };

  const fala = dados.laudos.length === 0 ? 'Me manda as fotos da vistoria que eu faço o rascunho do laudo para você conferir.'
    : aConferir ? `Analisei ${aConferir} foto${aConferir > 1 ? 's' : ''} que ${aConferir > 1 ? 'esperam' : 'espera'} a sua conferência.`
      : r.critico ? `Há ${r.critico} achado${r.critico > 1 ? 's' : ''} crítico${r.critico > 1 ? 's' : ''} nos seus laudos. Vale priorizar.`
        : 'Tudo conferido por aqui. Bora para a próxima vistoria?';

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 md:px-8 md:py-8">
      {/* topo escuro: saudação, Lia e números */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#121A2B] p-5 text-white md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-obra/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-[#3b6bc4]/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#A9B1C1]">{saudacao()}, {usuario.nome.split(' ')[0]}</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight md:text-4xl">{admin ? <>Todos os <span className="grifo">laudos</span></> : <>Seus <span className="grifo">laudos</span></>}</h1>
          </div>
          <button onClick={() => setNovo(true)} className="pilula pilula-obra hidden md:inline-flex"><FilePlus2 className="size-5" />Novo laudo</button>
        </div>
        <Lia className="relative mt-4 max-w-2xl" tom="escuro" tam={40} humor={aConferir ? 'normal' : r.critico ? 'atenta' : 'feliz'}
          acao={laudoAConferir && <Link to={`/laudo/${laudoAConferir.id}?aba=conferir`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-obra px-4 text-sm font-extrabold text-[#121A2B]"><Sparkles className="size-4" />Conferir agora</Link>}>
          {fala}
        </Lia>
        <div className="relative mt-5 grid grid-cols-4 gap-2">
          {[
            { n: dados.laudos.length, t: 'laudos' },
            { n: emAndamento, t: 'abertos' },
            { n: todasFotos.length, t: 'fotos' },
            { n: r.critico, t: 'críticos', alerta: r.critico > 0 },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-white/[.07] px-2 py-3 text-center ring-1 ring-white/10">
              <div className={cx('font-display text-2xl font-extrabold md:text-3xl', s.alerta && 'text-[#FF8B8B]')}>{s.n}</div>
              <div className="text-[11px] font-bold text-[#A9B1C1] md:text-sm">{s.t}</div>
            </div>
          ))}
        </div>
        <div className="fita absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
      </section>

      {/* plano de ação: o que ficou em aberto depois dos laudos (só aparece para quem usa) */}
      {(() => {
        const comPlano = dados.laudos.map((l) => {
          const itens = itensPlano(l, dados.porLaudo.get(l.id) ?? []);
          return { l, itens, r: resumoPlano(itens) };
        }).filter((x) => planoPreenchido(x.itens) && x.r.aberta + x.r.andamento > 0);
        if (!comPlano.length) return null;
        const abertas = comPlano.reduce((s, x) => s + x.r.aberta + x.r.andamento, 0);
        const atrasadas = comPlano.reduce((s, x) => s + x.r.atrasados, 0);
        const custo = comPlano.reduce((s, x) => s + x.r.custoAberto, 0);
        return (
          <section className="mt-5 rounded-[22px] border border-borda bg-sup p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-lg font-extrabold"><ClipboardList className="size-5 text-obra" />Plano de ação</h2>
              <p className="flex flex-wrap gap-x-3 text-sm text-texto2">
                <span><b className="text-texto">{abertas}</b> em aberto</span>
                {atrasadas > 0 && <span className="flex items-center gap-1 font-bold text-critico-texto"><AlarmClock className="size-4" />{atrasadas} atrasada{atrasadas > 1 ? 's' : ''}</span>}
                {custo > 0 && <span>{reais(custo)} a executar</span>}
              </p>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {comPlano.slice(0, 4).map(({ l, r: rp }) => (
                <li key={l.id}>
                  <Link to={`/laudo/${l.id}?aba=laudo`} className="flex items-center gap-3 rounded-2xl bg-sup2 p-3 transition hover:bg-obra-suave">
                    <span className="min-w-0 flex-1"><b className="block truncate">{l.titulo}</b>
                      <span className="text-sm text-texto2">{rp.aberta + rp.andamento} pendência{rp.aberta + rp.andamento > 1 ? 's' : ''}{rp.atrasados > 0 && <b className="text-critico-texto"> · {rp.atrasados} atrasada{rp.atrasados > 1 ? 's' : ''}</b>}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-texto3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {/* busca e filtros */}
      <div className="mt-5 flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-borda-forte bg-sup focus-within:border-tinta">
          <Search className="ml-3 size-[18px] shrink-0 text-texto3" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar laudo, endereço…" className="h-full w-full min-w-0 bg-transparent px-2.5 outline-none placeholder:text-texto3" />
        </label>
        <button onClick={() => setFiltros(!filtros)} aria-expanded={filtros} aria-label="Filtrar por status"
          className={cx('relative grid size-11 shrink-0 place-items-center rounded-xl border transition', filtros || status !== 'todos' ? 'border-tinta bg-tinta/10 text-tinta' : 'border-borda-forte bg-sup text-texto2')}>
          <SlidersHorizontal className="size-5" />
          {status !== 'todos' && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-obra ring-2 ring-papel" />}
        </button>
      </div>
      {filtros && (
        <div className="revelar mt-2 flex flex-wrap gap-1.5">
          {([['todos', 'Todos os status'], ...Object.entries(STATUS_LAUDO)] as [string, string][]).map(([k, v]) => (
            <button key={k} onClick={() => setStatus(k as typeof status)} className={cx('h-9 rounded-full px-3.5 text-sm font-bold transition', status === k ? 'bg-tinta text-white dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda')}>{v}</button>
          ))}
        </div>
      )}
      <div className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist">
        {([{ id: 'todos', curto: 'Todos' }, ...LISTA_TIPOS] as { id: 'todos' | TipoLaudo; curto: string }[]).map((t) => {
          const n = t.id === 'todos' ? dados.laudos.length : dados.laudos.filter((l) => l.tipo === t.id).length;
          return (
            <button key={t.id} role="tab" aria-selected={aba === t.id} onClick={() => setAba(t.id)}
              className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition', aba === t.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda hover:text-texto')}>
              {t.curto}<span className={cx('text-xs', aba === t.id ? 'text-obra' : 'text-texto3')}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {dados.laudos.length === 0 ? (
          <Vazio icone={<FileText className="size-7" />} titulo="Nenhum laudo ainda" texto="Crie o primeiro: suba as fotos da vistoria e a Lia faz o rascunho para você conferir.">
            <Botao variante="obra" onClick={() => setNovo(true)}>Novo laudo</Botao>
            <Botao variante="claro" onClick={exemplo} carregando={criandoEx}>Ver um laudo de exemplo</Botao>
          </Vazio>
        ) : filtrados.length === 0 ? (
          <Vazio icone={<Search className="size-7" />} titulo="Nada encontrado" texto="Tente outro termo ou limpe os filtros." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {filtrados.map((l) => (
              <CartaoLaudo key={l.id} laudo={l} fotos={dados.porLaudo.get(l.id) ?? []}
                autor={admin && l.usuarioId !== usuario.id ? dados.autores.get(l.usuarioId) : undefined}
                aoDuplicar={() => duplicar(l)} aoExcluir={() => setExcluir(l)} />
            ))}
            <button onClick={() => setNovo(true)} className="flex min-h-24 items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-borda-forte font-extrabold text-texto2 transition hover:border-obra hover:bg-obra-suave hover:text-obra-texto">
              <FilePlus2 className="size-5" />Novo laudo<ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <Modal aberto={!!excluir} aoFechar={() => setExcluir(null)} titulo="Excluir laudo?">
        <p className="text-texto2">“{excluir?.titulo}” e as {dados.porLaudo.get(excluir?.id ?? '')?.length ?? 0} fotos dele serão apagados deste navegador. Não dá para desfazer.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={() => setExcluir(null)}>Cancelar</Botao>
          <Botao variante="perigo" onClick={async () => { await excluirLaudo(excluir!.id); setExcluir(null); avisar('Laudo excluído'); }}><Trash2 className="size-4" />Excluir</Botao>
        </div>
      </Modal>
      <NovoLaudo aberto={novo} aoFechar={() => setNovo(false)} />
      {el}
    </div>
  );
}

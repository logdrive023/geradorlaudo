import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, ChevronRight, ClipboardList, Copy, FilePlus2, FileText, ImageOff, MapPin, MoreVertical, Search, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { db, excluirLaudo } from '../../db/db';
import { criarLaudoExemplo } from '../../db/exemplo';
import { useSessao } from '../../lib/sessao';
import { Barra, Botao, Carregando, Cartao, Modal, Selo, Vazio, useAviso, useUrl } from '../../componentes/ui';
import { LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import { STATUS_LAUDO, type Foto, type Laudo, type StatusLaudo, type TipoLaudo } from '../../dominio/modelo';
import { progressoFotos, resumoAchados } from '../../dominio/regras';
import { PainelPlano, itensDoPainel } from '../../componentes/PainelPlano';
import { Abas, Rotulado } from '../../componentes/Pecas';
import { cx, haQuanto, novoId } from '../../lib/util';
import { ICONE_TIPO, NovoLaudo } from './NovoLaudo';
import { Lia } from '../../componentes/Lia';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Cartão do laudo: capa com tipo e status, nome inteiro, endereço e números com rótulo. */
function CartaoLaudo({ laudo, fotos, autor, aoDuplicar, aoExcluir }: { laudo: Laudo; fotos: Foto[]; autor?: string; aoDuplicar: () => void; aoExcluir?: () => void }) {
  const [menu, setMenu] = useState(false);
  const capa = useUrl(fotos[0]?.miniatura);
  const p = progressoFotos(fotos);
  const r = resumoAchados(fotos);
  const Ic = ICONE_TIPO[laudo.tipo];
  const tomStatus = laudo.status === 'concluido' ? 'ok' : laudo.status === 'conferencia' ? 'obra' : 'neutro';
  return (
    <Cartao className="group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,26,43,.08)]">
      <Link to={`/laudo/${laudo.id}`} className="absolute inset-0 z-0" aria-label={`Abrir ${laudo.titulo}`} />
      {/* capa: tipo à esquerda, status à direita */}
      <div className="relative aspect-[16/7] w-full shrink-0 bg-sup2">
        {capa ? <img src={capa} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-texto3"><ImageOff className="size-7" /></div>}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" aria-hidden />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#121A2B]/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur"><Ic className="size-3.5" />{TIPOS[laudo.tipo].curto}</span>
        <span className="absolute right-12 top-2.5"><Selo tom={tomStatus}>{STATUS_LAUDO[laudo.status]}</Selo></span>
        <div className="absolute right-1.5 top-1.5 z-10">
          <button onClick={() => setMenu(!menu)} aria-label="Mais ações" className="grid size-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55"><MoreVertical className="size-5" /></button>
          {menu && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-borda bg-sup py-1 text-texto shadow-xl" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setMenu(false); aoDuplicar(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-sup2"><Copy className="size-4" />Duplicar</button>
              {aoExcluir && <button onClick={() => { setMenu(false); aoExcluir(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-critico-texto hover:bg-critico-suave"><Trash2 className="size-4" />Excluir</button>}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug">{laudo.titulo}</h3>
          {laudo.dados.endereco && <p className="mt-0.5 flex items-start gap-1 text-sm text-texto2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span className="line-clamp-2">{laudo.dados.endereco}</span></p>}
          {autor && <p className="mt-1 text-xs text-texto3">Responsável: <b className="text-texto2">{autor}</b></p>}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-sup2 px-3 py-2">
          <Rotulado rotulo="Fotos"><span className="flex items-center gap-1"><Camera className="size-3.5 shrink-0 text-texto3" />{p.total}</span></Rotulado>
          <Rotulado rotulo="Achados" alerta={r.critico > 0}>{r.total}{r.critico > 0 && <span className="text-xs font-extrabold"> · {r.critico} crít.</span>}</Rotulado>
          <Rotulado rotulo="Atualizado">{haQuanto(laudo.atualizadoEm)}</Rotulado>
        </div>

        {p.total > 0 && (
          <div className="mt-auto grid gap-1">
            <span className="flex items-center justify-between text-xs"><span className="font-bold text-texto2">Fotos conferidas</span><b>{p.conferidas} de {p.total}</b></span>
            <Barra valor={p.conferidas} total={p.total} />
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
  const [vista, setVista] = useState<'laudos' | 'plano'>('laudos');
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

      {/* um lugar só: laudos e plano de ação, com a mesma busca */}
      {(() => {
        const plano = itensDoPainel(dados.laudos, dados.porLaudo);
        const abertas = plano.filter((i) => i.acomp.status !== 'resolvida').length;
        return (
          <div className="mt-5">
            <Abas rotulo="O que ver" ativa={vista} aoMudar={setVista} abas={[
              { id: 'laudos', rotulo: 'Laudos', ic: FileText, conta: dados.laudos.length },
              { id: 'plano', rotulo: 'Plano de ação', ic: ClipboardList, conta: abertas },
            ]} />
          </div>
        );
      })()}

      {/* busca (vale para laudos e plano) e filtros */}
      <div className="mt-3 flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-borda-forte bg-sup focus-within:border-tinta">
          <Search className="ml-3 size-[18px] shrink-0 text-texto3" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={vista === 'plano' ? 'Buscar anomalia, laudo, ambiente, responsável…' : 'Buscar laudo, endereço…'} className="h-full w-full min-w-0 bg-transparent px-2.5 outline-none placeholder:text-texto3" />
        </label>
        {vista === 'laudos' && <button onClick={() => setFiltros(!filtros)} aria-expanded={filtros} aria-label="Filtrar por status"
          className={cx('relative grid size-11 shrink-0 place-items-center rounded-xl border transition', filtros || status !== 'todos' ? 'border-tinta bg-tinta/10 text-tinta' : 'border-borda-forte bg-sup text-texto2')}>
          <SlidersHorizontal className="size-5" />
          {status !== 'todos' && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-obra ring-2 ring-papel" />}
        </button>}
      </div>
      {vista === 'plano' && <div className="mt-4">{itensDoPainel(dados.laudos, dados.porLaudo).length
        ? <PainelPlano laudos={dados.laudos} porLaudo={dados.porLaudo} buscaExterna={busca} />
        : <Vazio icone={<ClipboardList className="size-7" />} titulo="Nenhum plano de ação ainda" texto="Abra um laudo, vá na aba Laudo e preencha o plano de ação dos achados (prazo, responsável e custo). Eles aparecem aqui, juntos, para você acompanhar." />}</div>}
      {vista === 'laudos' && <>
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
                aoDuplicar={() => duplicar(l)} aoExcluir={usuario?.papel === 'assistente' ? undefined : () => setExcluir(l)} />
            ))}
            <button onClick={() => setNovo(true)} className="flex min-h-24 items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-borda-forte font-extrabold text-texto2 transition hover:border-obra hover:bg-obra-suave hover:text-obra-texto">
              <FilePlus2 className="size-5" />Novo laudo<ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      </>}

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

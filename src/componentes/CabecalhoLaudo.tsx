import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Check, ChevronDown, Pencil } from 'lucide-react';
import { STATUS_LAUDO, type Laudo, type StatusLaudo } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { cx, haQuanto } from '../lib/util';
import { useSessao } from '../lib/sessao';

const COR_STATUS: Record<StatusLaudo, { ponto: string; caixa: string }> = {
  rascunho: { ponto: 'bg-texto3', caixa: 'bg-sup2 text-texto2' },
  conferencia: { ponto: 'bg-obra', caixa: 'bg-obra-suave text-obra-texto' },
  concluido: { ponto: 'bg-ok', caixa: 'bg-ok-suave text-ok-texto' },
};

/**
 * Status do laudo: no celular só a bolinha colorida (o nome aparece ao abrir);
 * o menu também mostra o tipo e quando foi salvo, que saíram do cabeçalho.
 */
export function PilulaStatus({ status, aoMudar, info }: { status: StatusLaudo; aoMudar: (s: StatusLaudo) => void; info?: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const assistente = useSessao().usuario?.papel === 'assistente'; // quem conclui é o responsável técnico
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    addEventListener('pointerdown', fora);
    return () => removeEventListener('pointerdown', fora);
  }, [aberto]);
  const c = COR_STATUS[status];
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setAberto(!aberto)} aria-haspopup="listbox" aria-expanded={aberto} aria-label={`Status: ${STATUS_LAUDO[status]}`}
        className={cx('flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-1.5 text-xs font-extrabold transition sm:h-9 sm:text-sm', c.caixa)}>
        <span className={cx('size-2.5 rounded-full', c.ponto)} />
        <span className="whitespace-nowrap">{STATUS_LAUDO[status]}</span>
        <ChevronDown className={cx('size-4 transition', aberto && 'rotate-180')} />
      </button>
      {aberto && (
        <div className="revelar absolute right-0 top-10 z-30 w-72 overflow-hidden rounded-2xl border border-borda bg-sup p-1 shadow-xl">
          {info && <div className="border-b border-borda px-3 pb-2 pt-1.5 text-xs text-texto3">{info}</div>}
          <div className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wider text-texto3">Status</div>
          <ul role="listbox">
            {(Object.keys(STATUS_LAUDO) as StatusLaudo[]).filter((s) => !assistente || s !== 'concluido' || status === 'concluido').map((s) => (
              <li key={s}>
                <button role="option" aria-selected={s === status} onClick={() => { aoMudar(s); setAberto(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sup2">
                  <span className={cx('size-2.5 rounded-full', COR_STATUS[s].ponto)} />{STATUS_LAUDO[s]}
                  {s === status && <Check className="ml-auto size-4 text-tinta" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Título em uma linha; tocar abre para renomear. */
function TituloEditavel({ valor, aoSalvar }: { valor: string; aoSalvar: (v: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  const fim = () => { setEditando(false); if (v.trim() && v.trim() !== valor) aoSalvar(v.trim()); else setV(valor); };
  if (editando) {
    return (
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onBlur={fim}
        onKeyDown={(e) => { if (e.key === 'Enter') fim(); if (e.key === 'Escape') { setV(valor); setEditando(false); } }}
        className="h-9 w-full rounded-lg border border-tinta bg-sup px-2 font-display text-base font-bold outline-none ring-3 ring-tinta/10 sm:text-lg"
        aria-label="Nome do laudo" />
    );
  }
  return (
    <button onClick={() => setEditando(true)} className="group flex h-9 w-full min-w-0 items-center gap-1.5 rounded-lg text-left" title="Tocar para renomear">
      <h1 className="truncate font-display text-base font-bold sm:text-lg md:text-xl">{valor}</h1>
      <Pencil className="size-3.5 shrink-0 text-texto3 opacity-50 group-hover:opacity-100" />
    </button>
  );
}

export interface Passo<A extends string> { id: A; rotulo: string; info?: string; feito?: boolean }

/** Cabeçalho do editor em 2 linhas: [← endereço · status] e [passos com nome]. */
export function CabecalhoLaudo<A extends string>({ laudo, autorNome, passos, ativo, aoIr, aoRenomear, aoMudarStatus }: {
  laudo: Laudo; autorNome?: string; passos: Passo<A>[]; ativo: A; aoIr: (a: A) => void;
  aoRenomear: (t: string) => void; aoMudarStatus: (s: StatusLaudo) => void;
}) {
  const local = [laudo.dados.endereco, laudo.dados.cidadeUf?.split('/')[0]?.trim()].filter(Boolean).join(' · ');
  const info = (
    <div className="grid gap-1.5">
      <span><b className="block text-sm text-texto">{TIPOS[laudo.tipo].nome}</b>Salvo {haQuanto(laudo.atualizadoEm)} · automático{autorNome && <> · de {autorNome}</>}</span>
      <span className="text-[11px] font-extrabold uppercase tracking-wider">Nome do laudo</span>
      <TituloEditavel valor={laudo.titulo} aoSalvar={aoRenomear} />
    </div>
  );
  return (
    <div className="nao-imprimir sticky top-0 z-20 border-b border-borda bg-papel/92 backdrop-blur">
      {/* linha 1: onde é + em que pé está */}
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-2 pt-2 sm:gap-3 sm:px-4 md:px-8">
        <Link to="/painel" aria-label="Voltar aos laudos" className="grid size-9 shrink-0 place-items-center rounded-full text-texto2 hover:bg-sup2 hover:text-texto"><ArrowLeft className="size-5" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-bold leading-tight sm:text-lg md:text-xl" title={laudo.titulo}>{local || laudo.titulo}</h1>
          <span className="block truncate text-xs font-bold text-texto3">{TIPOS[laudo.tipo].curto}{local ? ` · ${laudo.titulo}` : ''}</span>
        </div>
        <PilulaStatus status={laudo.status} aoMudar={aoMudarStatus} info={info} />
      </div>
      {/* linha 2: os passos, todos com nome */}
      <nav className="mx-auto mt-1.5 grid max-w-7xl grid-cols-4 gap-1 px-2 pb-2 sm:px-4 md:flex md:px-8" role="tablist">
        {passos.map((s, i) => {
          const atual = s.id === ativo;
          return (
            <button key={s.id} role="tab" aria-selected={atual} onClick={() => aoIr(s.id)}
              className={cx('flex h-9 min-w-0 items-center justify-center gap-1 rounded-full px-1.5 text-[13px] font-extrabold transition sm:gap-1.5 sm:px-3 sm:text-sm',
                atual ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : s.feito ? 'bg-ok-suave text-ok-texto' : 'text-texto3 hover:bg-sup2 hover:text-texto2')}>
              {s.feito && !atual ? <Check className="size-4 shrink-0" /> : <span className={cx('hidden size-5 shrink-0 place-items-center rounded-full text-[11px] sm:grid', atual ? 'bg-obra text-[#121A2B]' : 'bg-sup2')}>{i + 1}</span>}
              <span className="truncate">{s.rotulo}</span>
              {s.info && <span className={cx('hidden rounded-full px-1.5 text-[11px] sm:inline', atual ? 'bg-white/15' : 'bg-sup2')}>{s.info}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

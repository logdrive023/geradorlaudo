import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Info, LoaderCircle, X } from 'lucide-react';
import { cx } from '../lib/util';
import type { Gravidade } from '../dominio/modelo';
import { GRAVIDADE } from '../dominio/modelo';

type Variante = 'tinta' | 'obra' | 'claro' | 'fantasma' | 'perigo';
const VAR: Record<Variante, string> = {
  tinta: 'bg-tinta text-white hover:bg-tinta2 dark:text-[#0E1320] border border-transparent',
  obra: 'bg-obra text-[#121A2B] hover:bg-obra-forte border border-[#121A2B] shadow-[0_2px_0_#121A2B]',
  claro: 'bg-sup text-texto border border-borda-forte hover:bg-sup2',
  fantasma: 'text-texto2 hover:text-texto hover:bg-sup2 border border-transparent',
  perigo: 'bg-critico-suave text-critico-texto hover:brightness-95 border border-transparent',
};

export function Botao({ variante = 'tinta', tam = 'm', carregando, className, children, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tam?: 'p' | 'm' | 'g'; carregando?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || carregando}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        tam === 'p' && 'h-9 px-3 text-sm', tam === 'm' && 'h-11 px-4 text-[15px]', tam === 'g' && 'h-13 px-6 text-base',
        VAR[variante], className,
      )}
    >
      {carregando && <LoaderCircle className="size-4 girando" />}
      {children}
    </button>
  );
}

/** Tooltip: ícone "i" que explica o campo (passar o mouse, focar ou tocar). */
export function Dica({ texto, className }: { texto: ReactNode; className?: string }) {
  const [aberta, setAberta] = useState(false);
  const id = useRef(`dica-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <span className={cx('relative inline-flex align-middle', className)} onMouseEnter={() => setAberta(true)} onMouseLeave={() => setAberta(false)}>
      <button type="button" aria-describedby={id} aria-label="Ajuda" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAberta(!aberta); }} onFocus={() => setAberta(true)} onBlur={() => setAberta(false)}
        className="grid size-5 place-items-center rounded-full text-texto3 transition hover:bg-sup2 hover:text-tinta">
        <Info className="size-3.5" />
      </button>
      {aberta && <span id={id} role="tooltip" className={cx('pointer-events-none absolute bottom-full -left-2 z-40 mb-2 w-60 max-w-[calc(100vw-48px)] rounded-xl bg-[#121A2B] px-3 py-2 text-left text-xs font-semibold normal-case leading-snug tracking-normal text-white shadow-xl transition',
        'revelar')}>
        {texto}
        <span className="absolute left-[11px] top-full border-[6px] border-transparent border-t-[#121A2B]" />
      </span>}
    </span>
  );
}

export function Campo({ rotulo, dica, ajuda, erro, children, className }: { rotulo: ReactNode; dica?: ReactNode; ajuda?: ReactNode; erro?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('flex flex-col gap-1.5 min-w-0', className)}>
      <span className="flex items-center gap-1 text-[13px] font-bold text-texto2">{rotulo}{ajuda && <Dica texto={ajuda} />}</span>
      {children}
      {erro ? <small className="text-xs text-critico-texto">{erro}</small> : dica && <small className="text-xs text-texto3">{dica}</small>}
    </label>
  );
}

const INPUT = 'w-full rounded-xl border border-borda-forte bg-sup px-3.5 text-[15px] text-texto placeholder:text-texto3 outline-none transition focus:border-tinta focus:ring-3 focus:ring-tinta/10';

export const Entrada = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(INPUT, 'h-11', p.className)} />;
export const AreaTexto = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx(INPUT, 'py-2.5 leading-relaxed resize-y', p.className)} />;
export const Selecao = ({ opcoes, vazio = 'Selecione…', ...p }: SelectHTMLAttributes<HTMLSelectElement> & { opcoes: string[]; vazio?: string }) => (
  <select {...p} className={cx(INPUT, 'h-11 pr-8', p.className)}>
    <option value="">{vazio}</option>
    {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

export function Cartao({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-[18px] border border-borda bg-sup', className)}>{children}</div>;
}

export function SeloGravidade({ g, className }: { g: Gravidade; className?: string }) {
  const cls = { critico: 'bg-critico-suave text-critico-texto', medio: 'bg-medio-suave text-medio-texto', minimo: 'bg-minimo-suave text-minimo-texto' }[g];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold', cls, className)}>{GRAVIDADE[g].nome}</span>;
}

export const COR_GRAVIDADE: Record<Gravidade, string> = { critico: 'var(--critico)', medio: 'var(--medio)', minimo: 'var(--minimo)' };

export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'ok' | 'obra' | 'tinta' | 'critico' }) {
  const cls = {
    neutro: 'bg-sup2 text-texto2', ok: 'bg-ok-suave text-ok-texto', obra: 'bg-obra-suave text-obra-texto',
    tinta: 'bg-tinta/10 text-tinta', critico: 'bg-critico-suave text-critico-texto',
  }[tom];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', cls)}>{children}</span>;
}

export function Modal({ aberto, aoFechar, titulo, children, largura = 'max-w-lg' }: { aberto: boolean; aoFechar: () => void; titulo: ReactNode; children: ReactNode; largura?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) {
      d.showModal();
      // no celular, abrir janela não pode abrir o teclado: o foco vai para o botão de fechar, não para um campo
      requestAnimationFrame(() => d.querySelector<HTMLElement>('[data-fechar]')?.focus({ preventScroll: true }));
    }
    if (!aberto && d.open) d.close();
  }, [aberto]);
  // com a janela aberta, a página de trás não rola
  useEffect(() => {
    if (!aberto) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = antes; };
  }, [aberto]);
  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => { if (e.target === ref.current) aoFechar(); }}
      className={cx('m-auto max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[22px] border border-borda bg-sup p-0 text-texto backdrop:bg-[#0b1220]/50 backdrop:backdrop-blur-[2px]', largura)}
    >
      {aberto && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{titulo}</h2>
            <button data-fechar autoFocus onClick={aoFechar} aria-label="Fechar" className="-m-1 rounded-lg p-1.5 text-texto3 hover:bg-sup2 hover:text-texto"><X className="size-5" /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Barra({ valor, total, className }: { valor: number; total: number; className?: string }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-sup2', className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-obra transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Vazio({ icone, titulo, texto, children }: { icone: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-borda-forte bg-sup px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-obra-suave text-obra-texto">{icone}</div>
      <h3 className="text-lg font-bold">{titulo}</h3>
      <p className="mt-1 max-w-sm text-texto2">{texto}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Logo({ claro, tam = 32 }: { claro?: boolean; tam?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-display text-[19px] font-extrabold tracking-tight">
      <svg width={tam} height={tam} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill={claro ? '#fff' : 'var(--tinta)'} />
        <path d="M20 14h18l8 8v28H20z" fill={claro ? '#1D3B70' : '#fff'} />
        <path d="M26 40l5-6 4 4 6-8" stroke="#FF8A1F" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="46" cy="46" r="9" fill="#FF8A1F" />
        <path d="M42 46l3 3 5-6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={claro ? 'text-white' : 'text-texto'}>Laudo<b className="text-obra">Tech</b></span>
    </span>
  );
}

/** URL temporária para mostrar um Blob guardado no banco. */
export function useUrl(b?: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!b) { setUrl(undefined); return; }
    const u = URL.createObjectURL(b);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [b]);
  return url;
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <div className="flex items-center justify-center gap-2 py-20 text-texto3"><LoaderCircle className="size-5 girando" />{texto}</div>;
}

/** Aviso rápido no canto (sem biblioteca). */
export function useAviso() {
  const [msg, setMsg] = useState<{ t: string; tom: 'ok' | 'erro' } | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3200); return () => clearTimeout(t); }, [msg]);
  const el = msg && (
    <div role="status" className={cx('fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold shadow-lg md:bottom-8 revelar',
      msg.tom === 'ok' ? 'bg-[#121A2B] text-white' : 'bg-critico text-white')}>{msg.t}</div>
  );
  return { avisar: (t: string, tom: 'ok' | 'erro' = 'ok') => setMsg({ t, tom }), el };
}

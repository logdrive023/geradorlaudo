import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Copy, Link2, Link2Off, Share2 } from 'lucide-react';
import { Botao, CLASSE_CAMPO, Dica } from './ui';
import { cx } from '../lib/util';

/** Peças compartilhadas entre laudo e obra (abas, números, link público, item que abre). */

/** Select de pares valor/rótulo, no mesmo visual dos campos. */
export function Escolha<T extends string>({ valor, aoMudar, opcoes, vazio, className, ...p }: { valor: T | ''; aoMudar: (v: T) => void; opcoes: { v: T; r: string }[]; vazio?: string; className?: string; 'aria-label'?: string }) {
  return (
    <select value={valor} onChange={(e) => aoMudar(e.target.value as T)} className={cx(CLASSE_CAMPO, 'h-11 pr-8', className)} {...p}>
      {vazio != null && <option value="">{vazio}</option>}
      {opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
    </select>
  );
}

/** Lê "1.234,56" ou "1234.5" como número (vazio = undefined). */
export function lerReais(t: string): number | undefined {
  const s = t.trim();
  if (!s) return undefined;
  const v = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(v) && v >= 0 ? v : undefined;
}
const mostrarReais = (v?: number) => (v == null ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** Campo em R$: digita à vontade e grava ao sair do campo. */
export function EntradaReais({ valor, aoMudar, placeholder = '0,00', className, ...p }: { valor?: number; aoMudar: (v: number | undefined) => void; placeholder?: string; className?: string; 'aria-label'?: string }) {
  const [t, setT] = useState(mostrarReais(valor));
  useEffect(() => { setT(mostrarReais(valor)); }, [valor]);
  return (
    <span className={cx('relative block', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-texto3">R$</span>
      <input inputMode="decimal" value={t} placeholder={placeholder} onChange={(e) => setT(e.target.value.replace(/[^\d.,]/g, ''))}
        onBlur={() => { const v = lerReais(t); if (v !== valor) aoMudar(v); setT(mostrarReais(v)); }} className={cx(CLASSE_CAMPO, 'h-11 pl-10')} {...p} />
    </span>
  );
}

/** Bolinha colorida com nome (classificação: crítica, intermediária, simples…). */
export function Ponto({ cor, nome, mostrarNome = true, className }: { cor: string; nome: string; mostrarNome?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-bold text-texto2', className)} title={nome}>
      <span className="size-2.5 shrink-0 rounded-full ring-2 ring-sup" style={{ background: cor }} aria-hidden />
      {mostrarNome ? nome : <span className="sr-only">{nome}</span>}
    </span>
  );
}

/** Dado com rótulo pequeno em cima (deixa claro o que é cada número numa lista). */
export function Rotulado({ rotulo, children, className, alerta, inteiro }: { rotulo: string; children: ReactNode; className?: string; alerta?: boolean; inteiro?: boolean }) {
  return (
    <span className={cx('grid min-w-0', className)}>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-texto3">{rotulo}</span>
      {inteiro
        ? <ValorAjustado className={cx('text-sm font-bold', alerta ? 'text-critico-texto' : 'text-texto')}>{children}</ValorAjustado>
        : <span className={cx('truncate text-sm font-bold', alerta ? 'text-critico-texto' : 'text-texto')}>{children}</span>}
    </span>
  );
}

/** Abas em pílula, com rolagem lateral no celular. */
export function Abas<T extends string>({ abas, ativa, aoMudar, rotulo }: { abas: { id: T; rotulo: string; ic?: React.ComponentType<{ className?: string }>; conta?: number }[]; ativa: T; aoMudar: (a: T) => void; rotulo: string }) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="tablist" aria-label={rotulo}>
      <div className="flex w-max gap-1 rounded-2xl border border-borda bg-sup p-1">
        {abas.map(({ id, rotulo: r, ic: Ic, conta }) => (
          <button key={id} role="tab" aria-selected={ativa === id} onClick={() => aoMudar(id)}
            className={cx('flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-extrabold transition', ativa === id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'text-texto2 hover:bg-sup2')}>
            {Ic && <Ic className="size-4" />}{r}
            {conta != null && conta > 0 && <span className={cx('rounded-full px-1.5 text-[11px]', ativa === id ? 'bg-white/20' : 'bg-sup2')}>{conta}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Número grande com rótulo (painéis e resumos). */
export function Indicador({ valor, rotulo, tom = 'neutro', dica, ic: Ic }: { valor: ReactNode; rotulo: string; tom?: 'neutro' | 'ok' | 'obra' | 'critico' | 'medio'; dica?: ReactNode; ic?: React.ComponentType<{ className?: string }> }) {
  const cls = { neutro: 'bg-sup2 text-texto', ok: 'bg-ok-suave text-ok-texto', obra: 'bg-obra-suave text-obra-texto', critico: 'bg-critico-suave text-critico-texto', medio: 'bg-medio-suave text-medio-texto' }[tom];
  return (
    <div className={cx('grid min-w-0 content-between gap-1 rounded-2xl p-3', cls)}>
      {/* valor ocupa a largura toda e diminui se for longo (nunca fica embaixo do ícone) */}
      <ValorAjustado className={cx('font-display font-extrabold leading-tight tabular-nums', tamanhoValor(valor))}>{valor}</ValorAjustado>
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold opacity-80">
        {Ic && <Ic className="size-3.5 shrink-0" />}<span className="min-w-0">{rotulo}</span>{dica && <Dica texto={dica} />}
      </div>
    </div>
  );
}

/**
 * Valor que NUNCA quebra linha: fica numa linha só e diminui a fonte até caber na largura disponível
 * (R$ 0,00 ou R$ 1.250.000.000,00, tanto faz).
 */
export function ValorAjustado({ children, className, min = 7 }: { children: ReactNode; className?: string; min?: number }) {
  const caixa = useRef<HTMLSpanElement>(null);
  const texto = useRef<HTMLSpanElement>(null);
  const atual = useRef(1);
  const [escala, setEscala] = useState(1);
  useLayoutEffect(() => {
    const c = caixa.current, t = texto.current;
    if (!c || !t) return;
    const ajustar = () => {
      // largura natural = largura medida / escala aplicada agora (sem "resetar" o estilo)
      const natural = t.getBoundingClientRect().width / atual.current;
      const base = parseFloat(getComputedStyle(c).fontSize) || 16;
      const e = natural > c.clientWidth ? Math.max(min / base, c.clientWidth / natural) : 1;
      if (Math.abs(e - atual.current) > 0.005) { atual.current = e; setEscala(e); }
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(c);
    ro.observe(t);
    void document.fonts?.ready.then(ajustar); // a fonte de título carrega depois e muda a largura
    return () => ro.disconnect();
  }, [children, min]);
  return (
    <span ref={caixa} className={cx('block min-w-0 overflow-hidden', className)}>
      <span ref={texto} className="inline-block whitespace-nowrap" style={escala < 1 ? { fontSize: `${escala}em` } : undefined}>{children}</span>
    </span>
  );
}

/** Fonte do valor pelo tamanho do texto: valores longos (R$ 1.250.000,00) diminuem em vez de quebrar. */
function tamanhoValor(v: ReactNode) {
  const n = typeof v === 'string' || typeof v === 'number' ? String(v).length : 0;
  if (n > 14) return 'text-sm sm:text-base md:text-lg';
  if (n > 10) return 'text-base sm:text-lg md:text-xl';
  return 'text-xl md:text-2xl';
}

/** Anel de progresso (0–100) com marca do previsto; fica vermelho se estiver bem abaixo do previsto. */
export function Anel({ pct, previsto, tam = 104, espessura = 11, children }: { pct: number; previsto?: number | null; tam?: number; espessura?: number; children?: ReactNode }) {
  const r = (tam - espessura) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  const ang = previsto == null ? null : (Math.max(0, Math.min(100, previsto)) / 100) * 2 * Math.PI - Math.PI / 2;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }} role="img" aria-label={`${v}% realizado${previsto != null ? `, previsto ${previsto}%` : ''}`}>
      <svg width={tam} height={tam} className="-rotate-90">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" className="stroke-[#121A2B] dark:stroke-white/15" strokeWidth={espessura} />
        {v > 0 && <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="var(--obra)" strokeWidth={espessura} strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />}
      </svg>
      {ang != null && (
        <span className="absolute size-3 rounded-full border-2 border-[#121A2B] bg-white" title={`Previsto para hoje: ${previsto}%`}
          style={{ left: tam / 2 + r * Math.cos(ang) - 6, top: tam / 2 + r * Math.sin(ang) - 6 }} />
      )}
      <div className="absolute inset-0 grid place-items-center text-center">{children ?? <b className="font-display text-2xl font-extrabold">{v}%</b>}</div>
    </div>
  );
}

/** Barra de progresso: trilho preto que vai enchendo de laranja; a marca branca é o previsto para hoje. */
export function BarraDupla({ real, previsto, className }: { real: number; previsto?: number | null; className?: string }) {
  const r = Math.max(0, Math.min(100, real));
  const p = previsto == null ? null : Math.max(0, Math.min(100, previsto));
  return (
    <div className={cx('relative h-3 overflow-hidden rounded-full bg-[#121A2B] dark:bg-white/15', className)} role="progressbar" aria-valuenow={r} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-obra transition-all duration-500" style={{ width: `${r}%` }} />
      {p != null && <div className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(18,26,43,.6)]" style={{ left: `${Math.max(1, p)}%` }} title={`Previsto para hoje: ${p}%`} />}
    </div>
  );
}

/** Item de lista que abre para editar (mesmo padrão do plano de ação, do cronograma e das compras). */
export function ItemAbre({ aberto, alternar, cabeca, children, faixa }: { aberto: boolean; alternar: () => void; cabeca: ReactNode; children: ReactNode; faixa?: string }) {
  return (
    <li className={cx('overflow-hidden rounded-2xl border bg-sup transition', aberto ? 'border-borda-forte shadow-[0_8px_24px_rgba(18,26,43,.06)]' : 'border-borda')}>
      <button onClick={alternar} aria-expanded={aberto} className="relative flex w-full items-start gap-3 py-3 pl-4 pr-3 text-left">
        {faixa && <span className="absolute inset-y-0 left-0 w-1" style={{ background: faixa }} aria-hidden />}
        <span className="min-w-0 flex-1">{cabeca}</span>
        <ChevronDown className={cx('mt-1 size-4 shrink-0 text-texto3 transition', aberto && 'rotate-180')} />
      </button>
      {aberto && <div className="grid gap-3 border-t border-borda p-3">{children}</div>}
    </li>
  );
}

/**
 * Link público só de leitura (laudo para o cliente, obra para o proprietário).
 * O estado do link fica com quem chama: assim não some quando a tela atualiza.
 */
export function LinkPublico({ titulo, dica, link, setLink, gerar, desligar, avisar, extra, textoCompartilhar = 'Acompanhe por aqui:' }: {
  titulo: string; dica: ReactNode; link: string | null; setLink: (l: string | null) => void;
  gerar: () => Promise<string>; desligar: () => Promise<void>; avisar: (t: string, tom?: 'ok' | 'erro') => void;
  extra?: ReactNode; textoCompartilhar?: string;
}) {
  const [ocupado, setOcupado] = useState(false);
  const copiar = async (l: string, msg: string) => { try { await navigator.clipboard.writeText(l); avisar(msg); } catch { avisar('Link pronto. Copie e envie.'); } };
  const criar = async () => {
    setOcupado(true);
    try { const l = await gerar(); setLink(l); await copiar(l, 'Link copiado! É só enviar.'); } catch (e) { avisar((e as Error).message, 'erro'); }
    setOcupado(false);
  };
  const compartilhar = async () => {
    if (!link) return;
    if (navigator.share) { try { await navigator.share({ title: titulo, text: textoCompartilhar, url: link }); return; } catch { /* cancelou */ } }
    await copiar(link, 'Link copiado!');
  };
  const tirar = async () => {
    setOcupado(true);
    try { await desligar(); setLink(null); avisar('Link desligado: quem tinha não vê mais.'); } catch (e) { avisar((e as Error).message, 'erro'); }
    setOcupado(false);
  };
  return (
    <div className="grid gap-2 rounded-2xl border border-borda bg-sup2 p-3">
      <p className="flex items-center gap-1.5 text-sm font-extrabold"><Link2 className="size-4 text-obra" />{titulo}<Dica texto={dica} /></p>
      {extra}
      {link ? (
        <>
          <div className="flex items-center gap-1 rounded-xl border border-borda bg-sup px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-xs text-texto2">{link}</span>
            <button onClick={() => void copiar(link, 'Link copiado!')} className="grid size-8 place-items-center rounded-lg hover:bg-sup2" aria-label="Copiar link"><Copy className="size-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Botao tam="p" variante="claro" onClick={compartilhar}><Share2 className="size-4" />Enviar</Botao>
            <Botao tam="p" variante="fantasma" carregando={ocupado} onClick={tirar}><Link2Off className="size-4" />Desligar</Botao>
          </div>
        </>
      ) : <Botao tam="p" variante="claro" carregando={ocupado} onClick={criar}><Link2 className="size-4" />Gerar link</Botao>}
    </div>
  );
}

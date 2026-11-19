import { useState, type ReactNode } from 'react';
import { ChevronDown, Copy, Link2, Link2Off, Share2 } from 'lucide-react';
import { Botao, Dica } from './ui';
import { cx } from '../lib/util';

/** Peças compartilhadas entre laudo e obra (abas, números, link público, item que abre). */

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
export function Indicador({ valor, rotulo, tom = 'neutro', dica }: { valor: ReactNode; rotulo: string; tom?: 'neutro' | 'ok' | 'obra' | 'critico' | 'medio'; dica?: ReactNode }) {
  const cls = { neutro: 'bg-sup2 text-texto', ok: 'bg-ok-suave text-ok-texto', obra: 'bg-obra-suave text-obra-texto', critico: 'bg-critico-suave text-critico-texto', medio: 'bg-medio-suave text-medio-texto' }[tom];
  return (
    <div className={cx('rounded-2xl p-3', cls)}>
      <div className="font-display text-xl font-extrabold leading-tight md:text-2xl">{valor}</div>
      <div className="mt-0.5 flex items-center gap-1 text-xs font-bold opacity-80">{rotulo}{dica && <Dica texto={dica} />}</div>
    </div>
  );
}

/** Barra de progresso dupla: realizado (cheia) e previsto (marca). */
export function BarraDupla({ real, previsto, className }: { real: number; previsto?: number | null; className?: string }) {
  const r = Math.max(0, Math.min(100, real));
  const p = previsto == null ? null : Math.max(0, Math.min(100, previsto));
  return (
    <div className={cx('relative h-3 overflow-hidden rounded-full bg-sup2', className)} role="progressbar" aria-valuenow={r} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-500', p != null && r < p - 5 ? 'bg-critico' : 'bg-obra')} style={{ width: `${r}%` }} />
      {p != null && <div className="absolute inset-y-0 w-0.5 bg-[#121A2B] dark:bg-white" style={{ left: `${p}%` }} title={`Previsto: ${p}%`} />}
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

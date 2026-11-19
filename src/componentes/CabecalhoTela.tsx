import type { ReactNode } from 'react';
import { Lia, type HumorLia } from './Lia';
import { cx } from '../lib/util';
import { ValorAjustado } from './Pecas';

export interface NumeroCabecalho { n: ReactNode; t: string; alerta?: boolean; aoTocar?: () => void }

/**
 * Topo padrão das telas (o mesmo de Laudos e Obras): fundo escuro com brilho, sobretítulo,
 * título com grifo, ação à direita, fala da Lia e os números da tela. Fita de obra embaixo.
 */
export function CabecalhoTela({ sobre, titulo, grifo, acao, lia, humor = 'normal', numeros, className }: {
  sobre?: ReactNode; titulo: string; grifo?: string; acao?: ReactNode; lia?: ReactNode;
  humor?: HumorLia; numeros?: NumeroCabecalho[]; className?: string;
}) {
  return (
    <section className={cx('relative overflow-hidden rounded-[24px] bg-[#121A2B] p-5 text-white md:p-7', className)}>
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-obra/25 blur-3xl" aria-hidden />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {sobre && <p className="truncate text-sm font-bold text-[#A9B1C1]">{sobre}</p>}
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight md:text-4xl">{titulo}{grifo && <> <span className="grifo">{grifo}</span></>}</h1>
        </div>
        {acao}
      </div>
      {lia && <Lia className="relative mt-4 max-w-2xl" tom="escuro" tam={40} humor={humor}>{lia}</Lia>}
      {numeros && numeros.length > 0 && (
        <div className={cx('relative mt-5 grid gap-2', numeros.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
          {numeros.map((s) => {
            const Tag = s.aoTocar ? 'button' : 'div';
            return (
              <Tag key={s.t} onClick={s.aoTocar} className={cx('min-w-0 rounded-2xl px-2 py-3 text-center ring-1 transition', s.alerta ? 'bg-critico/20 ring-critico/50' : 'bg-white/[.07] ring-white/10', s.aoTocar && 'hover:bg-white/[.12]')}>
                {/* o valor nunca quebra nem estoura: diminui a fonte até caber (ex.: "Servidor") */}
                <ValorAjustado className={cx('font-display text-2xl font-extrabold md:text-3xl', s.alerta && 'text-[#FF8B8B]')}>{s.n}</ValorAjustado>
                <div className="truncate text-[11px] font-bold text-[#A9B1C1] md:text-sm">{s.t}</div>
              </Tag>
            );
          })}
        </div>
      )}
      <div className="fita absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
    </section>
  );
}

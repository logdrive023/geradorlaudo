import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { cx } from '../lib/util';

/**
 * Peças do wizard do laudo: uma ação principal por passo, o resto recolhido.
 */

/** Barra de ações: fixa no rodapé do celular, no fim do conteúdo no computador. */
export function BarraWizard({ voltar, principal, nota }: {
  voltar?: { rotulo: string; aoClicar: () => void };
  principal?: { rotulo: ReactNode; aoClicar: () => void; desativado?: boolean; carregando?: boolean; icone?: ReactNode };
  nota?: ReactNode;
}) {
  return (
    <>
      <div className="h-24 md:hidden" aria-hidden />
      <div className="nao-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-sup/95 px-3 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur md:static md:mt-6 md:rounded-[18px] md:border md:p-3">
        {nota && <div className="mb-2 text-center text-xs font-bold text-texto3 md:text-left">{nota}</div>}
        <div className="flex gap-2">
          {voltar && (
            <button onClick={voltar.aoClicar} className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-3.5 font-extrabold text-texto2 hover:bg-sup2 md:px-4">
              <ArrowLeft className="size-5" /><span className="hidden sm:inline">{voltar.rotulo}</span>
            </button>
          )}
          {principal && (
            <button onClick={principal.aoClicar} disabled={principal.desativado || principal.carregando}
              className="pilula pilula-obra ml-auto h-12 flex-1 disabled:opacity-50 md:flex-none md:px-7">
              {principal.icone}{principal.rotulo}{!principal.icone && <ArrowRight className="size-5" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/** Bloco que abre e fecha ("Mais detalhes"), com um resumo do que tem dentro. */
export function Recolhivel({ titulo, resumo, aberto: inicial = false, children, className }: { titulo: ReactNode; resumo?: ReactNode; aberto?: boolean; children: ReactNode; className?: string }) {
  const [aberto, setAberto] = useState(inicial);
  return (
    <div className={cx('rounded-[18px] border border-borda bg-sup', className)}>
      <button onClick={() => setAberto(!aberto)} aria-expanded={aberto} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1"><b className="block">{titulo}</b>{resumo && <span className="block text-sm text-texto3">{resumo}</span>}</span>
        <ChevronDown className={cx('size-5 shrink-0 text-texto3 transition', aberto && 'rotate-180')} />
      </button>
      {aberto && <div className="border-t border-borda p-4">{children}</div>}
    </div>
  );
}

/** Opções em botões grandes (mais fácil que select no celular). */
export function EscolhaChips({ opcoes, valor, aoMudar, rotulo }: { opcoes: string[]; valor: string; aoMudar: (v: string) => void; rotulo: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-bold text-texto2">{rotulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button key={o} type="button" onClick={() => aoMudar(valor === o ? '' : o)} aria-pressed={valor === o}
            className={cx('min-h-10 rounded-xl px-3 text-sm font-bold transition', valor === o ? 'bg-tinta text-white dark:text-[#0E1320]' : 'bg-sup2 text-texto2 hover:text-texto')}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

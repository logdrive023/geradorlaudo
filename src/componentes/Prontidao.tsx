import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import type { ItemRevisao } from '../dominio/regras';
import { Barra, Cartao } from './ui';
import { RostoLia } from './Lia';
import { cx } from '../lib/util';

/** "Pronto para assinar?": mostra só o que falta; o que já está ok fica recolhido. */
export function Prontidao({ itens, aoIr, className }: { itens: ItemRevisao[]; aoIr: (i: ItemRevisao) => void; className?: string }) {
  const [verOk, setVerOk] = useState(false);
  const ok = itens.filter((i) => i.ok);
  const faltam = itens.filter((i) => !i.ok);
  const pronto = faltam.length === 0;
  return (
    <Cartao className={cx('overflow-hidden', className)}>
      <div className="flex items-center gap-3 p-4">
        <RostoLia humor={pronto ? 'feliz' : 'normal'} tam={40} />
        <div className="min-w-0 flex-1">
          <b className="block leading-tight">{pronto ? 'Pronto para assinar!' : `Faltam ${faltam.length} ${faltam.length === 1 ? 'item' : 'itens'} para assinar`}</b>
          <div className="mt-1.5 flex items-center gap-2"><Barra className="flex-1" valor={ok.length} total={itens.length} /><span className="text-xs font-extrabold text-texto3">{ok.length}/{itens.length}</span></div>
        </div>
      </div>
      {faltam.length > 0 && (
        <ul className="border-t border-borda">
          {faltam.map((i) => {
            const conteudo = <><Circle className="size-4 shrink-0 text-obra" /><span className="flex-1 text-sm font-semibold">{i.texto}</span><ChevronRight className="size-4 shrink-0 text-texto3" /></>;
            const cls = 'flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-sup2';
            return (
              <li key={i.texto} className="border-b border-borda last:border-0">
                {i.onde === 'perfil' ? <Link to="/configuracoes" className={cls}>{conteudo}</Link> : <button onClick={() => aoIr(i)} className={cls}>{conteudo}</button>}
              </li>
            );
          })}
        </ul>
      )}
      {ok.length > 0 && (
        <div className="border-t border-borda">
          <button onClick={() => setVerOk(!verOk)} className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-texto3 hover:text-texto2">{verOk ? 'Esconder' : 'Ver'} o que já está ok ({ok.length})</button>
          {verOk && <ul className="grid gap-1.5 px-4 pb-3">{ok.map((i) => <li key={i.texto} className="flex items-center gap-2 text-sm text-texto2"><CheckCircle2 className="size-4 shrink-0 text-ok" />{i.texto}</li>)}</ul>}
        </div>
      )}
    </Cartao>
  );
}

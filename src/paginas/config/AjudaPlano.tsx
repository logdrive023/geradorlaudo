import { ChevronDown, Clock, Mail, MessageCircle } from 'lucide-react';
import { DUVIDAS_COBRANCA, SUPORTE } from '../../dominio/suporte';
import { Cartao } from '../../componentes/ui';
import { cx } from '../../lib/util';

/** Ajuda do plano: dúvidas frequentes e, se não resolver, contato com o suporte. */
export function AjudaPlano() {
  const zap = SUPORTE.whatsapp.replace(/\D/g, '');
  const canais = [
    { ic: MessageCircle, t: 'WhatsApp', v: zap ? `+${zap}` : '', href: zap ? `https://wa.me/${zap}?text=${encodeURIComponent('Olá! Preciso de ajuda com o LaudoTech.')}` : '' },
    { ic: Mail, t: 'E-mail', v: SUPORTE.email, href: SUPORTE.email ? `mailto:${SUPORTE.email}?subject=${encodeURIComponent('Ajuda com o LaudoTech')}` : '' },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Cartao className="grid content-start gap-1 p-2 sm:p-3">
        <h3 className="px-2 pb-1 pt-2 font-bold">Dúvidas frequentes</h3>
        {DUVIDAS_COBRANCA.map((d) => (
          <details key={d.p} className="group rounded-xl px-2 open:bg-sup2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-extrabold">
              {d.p}<ChevronDown className="size-4 shrink-0 text-texto3 transition group-open:rotate-180" />
            </summary>
            <p className="pb-3 text-sm text-texto2">{d.r}</p>
          </details>
        ))}
      </Cartao>
      <aside className="grid content-start gap-3">
        <Cartao className="grid gap-3 p-4">
          <h3 className="font-bold">Não achou? Fale com a gente</h3>
          {canais.map(({ ic: Ic, t, v, href }) => {
            const ativo = !!href;
            const conteudo = (
              <>
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', ativo ? 'bg-obra text-[#121A2B]' : 'bg-sup2 text-texto3')}><Ic className="size-5" /></span>
                <span className="min-w-0"><b className="block text-sm">{t}</b><span className="block truncate text-xs text-texto3">{v || 'em breve'}</span></span>
              </>
            );
            return ativo
              ? <a key={t} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-borda p-3 transition hover:border-obra">{conteudo}</a>
              : <div key={t} aria-disabled className="flex items-center gap-3 rounded-2xl border border-dashed border-borda p-3 opacity-70">{conteudo}</div>;
          })}
          <p className="flex items-center gap-1.5 text-xs text-texto3"><Clock className="size-3.5" />{SUPORTE.horario}</p>
        </Cartao>
      </aside>
    </div>
  );
}

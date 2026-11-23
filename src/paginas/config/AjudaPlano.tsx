import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ChevronDown, Clock, Mail, MessageCircle, Search, X } from 'lucide-react';
import { DUVIDAS_PLANO, GRUPOS_DUVIDA, SUPORTE, type GrupoDuvida } from '../../dominio/suporte';
import { abrirLia, RostoLia } from '../../componentes/Lia';
import { Cartao } from '../../componentes/ui';
import { cx } from '../../lib/util';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ajuda do plano: as mesmas dúvidas da Lia, agrupadas, com filtro e busca; e o contato, se não resolver. */
export function AjudaPlano() {
  const nav = useNavigate();
  const [grupo, setGrupo] = useState<GrupoDuvida | 'todas'>('todas');
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<string | null>(null);

  const achadas = useMemo(() => {
    const palavras = norm(busca).split(/\s+/).filter((w) => w.length > 1);
    return DUVIDAS_PLANO.filter((d) => (grupo === 'todas' || d.grupo === grupo)
      && (!palavras.length || palavras.every((w) => norm(`${d.p} ${d.r} ${d.chaves ?? ''}`).includes(w))));
  }, [grupo, busca]);
  const grupos = GRUPOS_DUVIDA.filter((g) => achadas.some((d) => d.grupo === g.id));
  const contagem = (g: GrupoDuvida) => DUVIDAS_PLANO.filter((d) => d.grupo === g).length;

  const zap = SUPORTE.whatsapp.replace(/\D/g, '');
  const canais = [
    { ic: MessageCircle, t: 'WhatsApp', v: zap ? `+${zap}` : '', href: zap ? `https://wa.me/${zap}?text=${encodeURIComponent('Olá! Preciso de ajuda com o LaudoTech.')}` : '' },
    { ic: Mail, t: 'E-mail', v: SUPORTE.email, href: SUPORTE.email ? `mailto:${SUPORTE.email}?subject=${encodeURIComponent('Ajuda com o LaudoTech')}` : '' },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-3">
        {/* busca + filtro por assunto */}
        <Cartao className="grid gap-3 p-3 sm:p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-texto3" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque: recibo, cancelar, pacote, dia da cobrança…"
              aria-label="Buscar nas dúvidas" className="h-12 w-full rounded-xl border border-borda-forte bg-sup pl-11 pr-10 text-[15px] outline-none focus:border-tinta" />
            {busca && <button onClick={() => setBusca('')} aria-label="Limpar a busca" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-texto3 hover:bg-sup2"><X className="size-4" /></button>}
          </label>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Assuntos">
            {[{ id: 'todas' as const, nome: 'Todas', n: DUVIDAS_PLANO.length }, ...GRUPOS_DUVIDA.map((g) => ({ ...g, n: contagem(g.id) }))].map((g) => (
              <button key={g.id} role="tab" aria-selected={grupo === g.id} onClick={() => setGrupo(g.id)}
                className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition', grupo === g.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup2 text-texto2 hover:text-texto')}>
                {g.nome}<span className={cx('text-xs', grupo === g.id ? 'text-obra' : 'text-texto3')}>{g.n}</span>
              </button>
            ))}
          </div>
        </Cartao>

        {/* as dúvidas, por assunto */}
        {grupos.map((g) => (
          <Cartao key={g.id} className="grid gap-1 p-2 sm:p-3">
            <h3 className="px-2 pb-1 pt-2 text-xs font-extrabold uppercase tracking-wider text-texto3">{g.nome}</h3>
            {achadas.filter((d) => d.grupo === g.id).map((d) => {
              const abre = aberta === d.p || (!!busca && achadas.length <= 2);
              return (
                <div key={d.p} className={cx('rounded-xl px-2 transition-colors', abre && 'bg-sup2')}>
                  <button onClick={() => setAberta(abre ? null : d.p)} aria-expanded={abre} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-extrabold">
                    {d.p}<ChevronDown className={cx('size-4 shrink-0 text-texto3 transition-transform', abre && 'rotate-180')} />
                  </button>
                  {abre && (
                    <div className="grid gap-2 pb-3">
                      <p className="text-sm text-texto2">{d.r}</p>
                      {d.ir?.tipo === 'rota' && (
                        <button onClick={() => nav((d.ir as { para: string }).para)} className="flex items-center gap-1 justify-self-start text-sm font-extrabold text-tinta">{d.ir.rotulo}<ArrowRight className="size-4" /></button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Cartao>
        ))}
        {!achadas.length && (
          <Cartao className="grid justify-items-center gap-3 p-6 text-center">
            <p className="text-texto2">Nada encontrado para "{busca}".</p>
            <button onClick={() => abrirLia({ pergunta: busca })} className="pilula pilula-obra"><MessageCircle className="size-5" />Perguntar à Lia</button>
          </Cartao>
        )}
      </div>

      <aside className="grid content-start gap-3">
        {/* a Lia sabe as mesmas respostas e conversa */}
        <Cartao className="grid gap-3 bg-[#121A2B] p-4 text-white">
          <div className="flex items-center gap-3">
            <RostoLia humor="feliz" tam={40} />
            <span><b className="block">Pergunte à Lia</b><span className="text-sm text-[#B6BECC]">Ela sabe estas respostas e conversa com você.</span></span>
          </div>
          <div className="grid gap-2">
            <button onClick={() => abrirLia({ cat: 'plano' })} className="pilula pilula-obra w-full">Conversar sobre o plano</button>
            {busca && <button onClick={() => abrirLia({ pergunta: busca })} className="text-sm font-extrabold text-obra">Perguntar "{busca}"</button>}
          </div>
        </Cartao>
        <Cartao className="grid gap-3 p-4">
          <h3 className="font-bold">Não resolveu? Fale com a gente</h3>
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

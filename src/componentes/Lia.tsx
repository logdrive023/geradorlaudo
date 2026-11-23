import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowRight, ChevronRight, MessageCircleQuestion, Send, X } from 'lucide-react';
import { perguntarLia, type MensagemLia } from '../ia/lia';
import { AJUDA, buscarAjuda, type Categoria, type Destino, type Pergunta } from '../ia/ajuda';
import { cx } from '../lib/util';

/**
 * LIA — a assistente do LaudoTech ("Laudo IA").
 * É uma prancheta de vistoria com capacete de obra: o clipe vira o capacete e a folha vira o rosto.
 * Regras (como a Vanda do VanAaki): no máximo uma fala por tela; só afirma o que aconteceu;
 * sem gracinha em achado crítico; quem assina é sempre o engenheiro.
 */
export type HumorLia = 'normal' | 'feliz' | 'pensando' | 'atenta';

export function RostoLia({ humor = 'normal', tam = 44 }: { humor?: HumorLia; tam?: number }) {
  const olhos = {
    normal: <><circle cx="25" cy="38" r="3.2" fill="#121A2B" /><circle cx="39" cy="38" r="3.2" fill="#121A2B" /></>,
    feliz: <><path d="M21.5 39q3.5-4.5 7 0M35.5 39q3.5-4.5 7 0" stroke="#121A2B" strokeWidth="2.6" fill="none" strokeLinecap="round" /></>,
    pensando: <><circle cx="26.5" cy="36.5" r="3.2" fill="#121A2B" /><circle cx="40.5" cy="36.5" r="3.2" fill="#121A2B" /></>,
    atenta: <><circle cx="25" cy="39" r="3.2" fill="#121A2B" /><circle cx="39" cy="39" r="3.2" fill="#121A2B" /><path d="M21 32.5l7 1.5M43 32.5l-7 1.5" stroke="#121A2B" strokeWidth="2.2" strokeLinecap="round" /></>,
  }[humor];
  const boca = {
    normal: <path d="M27 46q5 4 10 0" stroke="#121A2B" strokeWidth="2.4" fill="none" strokeLinecap="round" />,
    feliz: <path d="M25.5 45q6.5 7 13 0z" fill="#121A2B" />,
    pensando: <path d="M29 47h7" stroke="#121A2B" strokeWidth="2.4" strokeLinecap="round" />,
    atenta: <ellipse cx="32" cy="47" rx="2.6" ry="3" fill="#121A2B" />,
  }[humor];
  return (
    <svg width={tam} height={tam} viewBox="0 0 64 64" aria-hidden className={cx('shrink-0', humor === 'pensando' && 'lia-pensando')}>
      <rect x="9" y="14" width="46" height="46" rx="10" fill="#1D3B70" />
      <rect x="14" y="21" width="36" height="35" rx="6" fill="#fff" />
      <circle cx="19" cy="44" r="3" fill="#FF8A1F" opacity=".35" /><circle cx="45" cy="44" r="3" fill="#FF8A1F" opacity=".35" />
      {olhos}{boca}
      {/* capacete */}
      <path d="M14 21a18 14 0 0136 0z" fill="#FF8A1F" stroke="#121A2B" strokeWidth="2" strokeLinejoin="round" />
      <rect x="10" y="19.5" width="44" height="5" rx="2.5" fill="#FF8A1F" stroke="#121A2B" strokeWidth="2" />
      <path d="M32 8v12" stroke="#121A2B" strokeWidth="2" strokeLinecap="round" />
      {humor === 'pensando' && <g fill="#FF8A1F"><circle cx="54" cy="8" r="2.2" /><circle cx="59" cy="4" r="1.5" /></g>}
    </svg>
  );
}

/** A fala da Lia (uma por tela). */
export function Lia({ humor = 'normal', tam = 44, tom = 'claro', children, acao, className }: {
  humor?: HumorLia; tam?: number; tom?: 'claro' | 'escuro'; children: ReactNode; acao?: ReactNode; className?: string;
}) {
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <RostoLia humor={humor} tam={tam} />
      <div className={cx('relative min-w-0 flex-1 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[15px] leading-snug',
        tom === 'escuro' ? 'bg-white/10 text-white' : 'border border-borda bg-sup text-texto')}>
        <span className={cx('mb-0.5 block text-[11px] font-extrabold uppercase tracking-wider', tom === 'escuro' ? 'text-obra' : 'text-obra-texto')}>Lia</span>
        <span role="status">{children}</span>
        {acao && <div className="mt-2 flex flex-wrap gap-2">{acao}</div>}
      </div>
    </div>
  );
}

/** Abre a Lia de qualquer tela: num assunto (cat) ou já perguntando algo. */
export const abrirLia = (o: { cat?: string; pergunta?: string } = {}) => window.dispatchEvent(new CustomEvent('laudotech:lia', { detail: o }));

/** Botão flutuante "Pergunte à Lia": central de ajuda por assunto + conversa. Toda resposta leva a algum lugar. */
export function PergunteLia({ ajuda = AJUDA, site = false, subir = false }: { ajuda?: Categoria[]; site?: boolean; subir?: boolean } = {}) {
  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<(MensagemLia & { ir?: Destino })[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [cat, setCat] = useState(ajuda[0].id);
  const [menu, setMenu] = useState(true);
  const { id } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const fim = useRef<HTMLDivElement>(null);
  const laudoId = loc.pathname.startsWith('/laudo/') ? id : undefined;
  // no celular, na conferência, o botão fixo "Confirmar" ocupa o rodapé: a Lia sai do caminho
  const naConferencia = loc.search.includes('aba=conferir');

  useEffect(() => { if (!menu) fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, pensando, menu]);
  // na página do plano, a Lia já abre no assunto "Plano e cobrança"
  useEffect(() => { if (loc.pathname.startsWith('/plano') && ajuda.some((c) => c.id === 'plano')) setCat('plano'); }, [loc.pathname, ajuda]);
  // outras telas podem abrir a Lia (ex.: Plano › Ajuda) num assunto ou com uma pergunta
  useEffect(() => {
    const abrir = (e: Event) => {
      const o = (e as CustomEvent<{ cat?: string; pergunta?: string }>).detail ?? {};
      setAberto(true);
      if (o.cat && ajuda.some((c) => c.id === o.cat)) { setCat(o.cat); setMenu(true); }
      if (o.pergunta) void enviarRef.current(o.pergunta);
    };
    window.addEventListener('laudotech:lia', abrir);
    return () => window.removeEventListener('laudotech:lia', abrir);
  }, [ajuda]);

  const irPara = (d: Destino) => {
    setAberto(false);
    if (d.tipo === 'ancora') document.getElementById(d.id)?.scrollIntoView({ behavior: 'smooth' });
    else if (d.tipo === 'rota') nav(d.para);
    else if (d.tipo === 'novo') nav('/painel?novo=1');
    else if (laudoId) nav(`/laudo/${laudoId}?aba=${d.aba}`);
    else nav('/painel');
  };
  const rotuloDestino = (d: Destino) => (d.tipo === 'aba' && !laudoId ? 'Abrir um laudo' : d.rotulo);

  const responder = (q: Pergunta) => { setMenu(false); setMsgs((m) => [...m, { de: 'voce', texto: q.p }, { de: 'lia', texto: q.r, ir: q.ir }]); };

  const enviar = async (p: string) => {
    const q = p.trim();
    if (!q || pensando) return;
    setMenu(false); setTexto('');
    const achada = buscarAjuda(q, ajuda);
    if (achada) { setMsgs((m) => [...m, { de: 'voce', texto: q }, { de: 'lia', texto: achada.r, ir: achada.ir }]); return; }
    if (site) { setMsgs((m) => [...m, { de: 'voce', texto: q }, { de: 'lia', texto: 'Ainda não sei responder isso. Veja as dúvidas frequentes; o acesso ao app é por convite do administrador do seu escritório.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' } }]); return; }
    const nova: MensagemLia[] = [...msgs.map(({ de, texto: t }) => ({ de, texto: t })), { de: 'voce', texto: q }];
    setMsgs(nova); setPensando(true);
    try { setMsgs([...nova, { de: 'lia', texto: await perguntarLia(nova, laudoId) }]); }
    catch (e) { setMsgs([...nova, { de: 'lia', texto: `Não consegui responder agora: ${(e as Error).message}` }]); }
    setPensando(false);
  };

  const enviarRef = useRef(enviar);
  enviarRef.current = enviar;
  const categoria = ajuda.find((c) => c.id === cat) ?? ajuda[0];

  return (
    <>
      <button onClick={() => setAberto(!aberto)} aria-expanded={aberto}
        className={cx(naConferencia && !aberto && 'max-lg:hidden', 'nao-imprimir fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full border-[1.5px] border-[#121A2B] bg-sup p-1 font-extrabold sm:pr-4 shadow-[0_3px_0_#121A2B] transition-all duration-300 active:translate-y-0.5 md:bottom-6 md:right-6', subir && '-translate-y-14')}>
        <RostoLia humor={aberto ? 'feliz' : 'normal'} tam={38} />
        <span className="hidden sm:inline">Pergunte à Lia</span><span className="sr-only sm:hidden">Ajuda</span>
      </button>
      {aberto && (
        <section role="dialog" aria-label="Ajuda da Lia"
          className="nao-imprimir revelar fixed inset-x-3 bottom-40 z-40 flex max-h-[min(620px,calc(100dvh-11rem))] flex-col overflow-hidden rounded-[22px] border border-borda bg-sup shadow-[0_24px_60px_rgba(18,26,43,.25)] sm:inset-x-auto sm:right-6 sm:w-[400px] md:bottom-24">
          <header className="flex items-center gap-3 bg-[#121A2B] px-4 py-3 text-white">
            <RostoLia humor="feliz" tam={36} />
            <div className="flex-1 leading-tight"><b className="font-display text-lg">Lia</b><span className="block text-xs text-[#A9B1C1]">{site ? 'dúvidas sobre o LaudoTech' : 'ajuda do LaudoTech · toque numa dúvida'}</span></div>
            {!menu && <button onClick={() => setMenu(true)} className="rounded-lg px-2 py-1 text-xs font-extrabold text-obra hover:bg-white/10">Assuntos</button>}
            <button onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
          </header>
          <div className="fita h-1.5" aria-hidden />

          {menu ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex gap-1.5 overflow-x-auto border-b border-borda px-3 py-2.5" role="tablist" aria-label="Assuntos">
                {ajuda.map((c) => (
                  <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
                    className={cx('h-8 shrink-0 rounded-full px-3 text-[13px] font-extrabold transition', cat === c.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup2 text-texto2 hover:text-texto')}>
                    {c.nome}
                  </button>
                ))}
              </div>
              <ul className="sem-barra min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {categoria.perguntas.map((q) => (
                  <li key={q.p}>
                    <button onClick={() => responder(q)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-bold hover:bg-sup2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-obra-suave text-obra-texto"><MessageCircleQuestion className="size-4" /></span>
                      <span className="flex-1 leading-snug">{q.p}</span>
                      <ChevronRight className="size-4 shrink-0 text-texto3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="sem-barra flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
              {msgs.map((m, i) => m.de === 'lia'
                ? <Lia key={i} tam={32} acao={m.ir && <button onClick={() => irPara(m.ir!)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-obra px-3.5 text-sm font-extrabold text-[#121A2B]">{rotuloDestino(m.ir)}<ArrowRight className="size-4" /></button>}><span className="whitespace-pre-line">{m.texto}</span></Lia>
                : <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-tinta px-3.5 py-2.5 text-[15px] text-white dark:text-[#0E1320]">{m.texto}</div>)}
              {pensando && <Lia humor="pensando" tam={32}>Pensando…</Lia>}
              {!pensando && <button onClick={() => setMenu(true)} className="mx-auto block rounded-full px-3 py-1.5 text-sm font-extrabold text-tinta hover:bg-tinta/10">Ver outras dúvidas</button>}
              <div ref={fim} />
            </div>
          )}

          <form onSubmit={(e: FormEvent) => { e.preventDefault(); void enviar(texto); }} className="flex gap-2 border-t border-borda p-3">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ou escreva sua dúvida…" className="h-11 min-w-0 flex-1 rounded-xl border border-borda-forte bg-sup px-3 outline-none focus:border-tinta" />
            <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar" className="grid size-11 place-items-center rounded-xl bg-obra text-[#121A2B] disabled:opacity-40"><Send className="size-5" /></button>
          </form>
        </section>
      )}
    </>
  );
}

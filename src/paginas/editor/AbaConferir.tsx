import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Crosshair, Eye, MapPin, Mic, MicOff, Pencil, Plus, RotateCw, Search, Sparkles, Wrench, X } from 'lucide-react';
import { db, tocarLaudo } from '../../db/db';
import { GRAVIDADE, SISTEMAS, TIPOS_ANOMALIA, type Achado, type Analise, type Foto, type Gravidade, type Laudo, type Regiao } from '../../dominio/modelo';
import { analisarFoto } from '../../ia/motor';
import { AreaTexto, Barra, Botao, Campo, Cartao, COR_GRAVIDADE, Dica, Entrada, SeloGravidade, Vazio, useAviso, useUrl } from '../../componentes/ui';
import { Recolhivel } from '../../componentes/Wizard';
import { FotoMarcada } from '../../componentes/FotoMarcada';
import { Lia } from '../../componentes/Lia';
import { cx, dois, novoId } from '../../lib/util';
import type { Aba } from './Editor';

/* ---------- filtro pela certeza da Lia ---------- */
type FaixaCerteza = 'todos' | 'alta' | 'media' | 'baixa';
const FAIXAS: { id: FaixaCerteza; rotulo: string; faixa: string; explica: string; caixa: string; ponto: string }[] = [
  { id: 'todos', rotulo: 'Todas', faixa: 'todas', explica: '', caixa: '', ponto: 'bg-texto3' },
  { id: 'alta', rotulo: 'Segura', faixa: '75%+', explica: 'em que a Lia tem 75% ou mais de certeza', caixa: 'bg-ok-suave text-ok-texto border-ok/40', ponto: 'bg-ok' },
  { id: 'media', rotulo: 'Média', faixa: '50–75%', explica: 'em que a Lia tem de 50% a 75% de certeza', caixa: 'bg-medio-suave text-medio-texto border-medio/40', ponto: 'bg-medio' },
  { id: 'baixa', rotulo: 'Em dúvida', faixa: '<50%', explica: 'em que a Lia tem menos de 50% de certeza (confira com atenção)', caixa: 'bg-critico-suave text-critico-texto border-critico/40', ponto: 'bg-critico' },
];
const naFaixa = (c: number, f: FaixaCerteza) => f === 'todos' || (f === 'alta' ? c >= 0.75 : f === 'media' ? c >= 0.5 && c < 0.75 : c < 0.5);

/* ---------- ditado por voz (Web Speech API, Chrome/Edge) ---------- */
type Reconhecedor = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: (e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void; onend: () => void };
function useDitado(aoTexto: (t: string) => void) {
  const ref = useRef<Reconhecedor | null>(null);
  const [ouvindo, setOuvindo] = useState(false);
  const W = window as unknown as { SpeechRecognition?: new () => Reconhecedor; webkitSpeechRecognition?: new () => Reconhecedor };
  const Classe = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  const alternar = () => {
    if (!Classe) return;
    if (ouvindo) { ref.current?.stop(); return; }
    const r = new Classe();
    r.lang = 'pt-BR'; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) aoTexto(e.results[i][0].transcript.trim()); };
    r.onend = () => setOuvindo(false);
    ref.current = r; r.start(); setOuvindo(true);
  };
  useEffect(() => () => ref.current?.stop(), []);
  return { suportado: !!Classe, ouvindo, alternar };
}

/* ---------- desenhar a caixa do achado na foto ---------- */
function Marcador({ foto, aoMarcar }: { foto: Foto; aoMarcar: (r: Regiao) => void }) {
  const url = useUrl(foto.imagem);
  const [ini, setIni] = useState<{ x: number; y: number } | null>(null);
  const [atual, setAtual] = useState<Regiao | null>(null);
  const pos = (e: PointerEvent) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - b.top) / b.height) * 100)) };
  };
  return (
    <div
      className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-2xl bg-[#0b1220]"
      style={{ aspectRatio: `${foto.largura} / ${foto.altura}` }}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); setIni(pos(e)); setAtual(null); }}
      onPointerMove={(e) => { if (!ini) return; const p = pos(e); setAtual({ x: Math.min(ini.x, p.x), y: Math.min(ini.y, p.y), w: Math.abs(p.x - ini.x), h: Math.abs(p.y - ini.y) }); }}
      onPointerUp={() => { if (atual && atual.w > 2 && atual.h > 2) aoMarcar(atual); setIni(null); }}
    >
      {url && <img src={url} alt="" className="absolute inset-0 size-full object-cover opacity-80" draggable={false} />}
      {atual && <div className="absolute rounded-md border-2 border-obra bg-obra/15" style={{ left: `${atual.x}%`, top: `${atual.y}%`, width: `${atual.w}%`, height: `${atual.h}%` }} />}
      <div className="absolute inset-x-0 top-0 bg-[#121A2B]/80 py-2 text-center text-sm font-bold text-white">Arraste sobre a foto para marcar onde está o achado</div>
    </div>
  );
}

/** Selo que deixa claro: este texto a IA já escreveu. */
export function SeloLia({ texto = 'Escrito pela Lia' }: { texto?: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-obra-suave px-2 py-0.5 text-[11px] font-extrabold text-obra-texto"><Sparkles className="size-3" />{texto}</span>;
}

/**
 * Um achado: por padrão mostra o TEXTO PRONTO que a IA escreveu, em 3 blocos
 * (o que é · por quê · o que fazer). "Editar" (✎) abre os campos.
 */
function CartaoAchado({ a, n, sel, aoSel, aoMudar, aoMarcar }: { a: Achado; n: number; sel: boolean; aoSel: () => void; aoMudar: (p: Partial<Achado>) => void; aoMarcar: () => void }) {
  const daIA = a.origem !== 'manual';
  const cor = COR_GRAVIDADE[a.gravidade];
  const blocos = [
    { ic: Eye, rot: 'O que é', txt: a.descricao },
    { ic: Search, rot: 'Por quê', txt: a.causaProvavel },
    { ic: Wrench, rot: 'O que fazer', txt: a.recomendacao },
  ].filter((b) => b.txt?.trim());
  return (
    <div className={cx('overflow-hidden rounded-2xl border bg-sup transition',
      a.aceito === true ? 'border-ok/60 ring-2 ring-ok/15' : a.aceito === false ? 'border-borda opacity-55' : sel ? 'border-tinta ring-2 ring-tinta/15' : 'border-borda')}>
      {/* cabeçalho na cor do grau */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: `color-mix(in srgb, ${cor} 12%, transparent)`, borderLeft: `4px solid ${cor}` }}>
        <span className="grid size-6 shrink-0 place-items-center rounded-md text-xs font-extrabold text-white" style={{ background: cor }}>{n}</span>
        <span className="min-w-0 flex-1">
          <b className="block truncate leading-tight">{a.tipo}</b>
          {a.sistema && <span className="block truncate text-[11px] font-bold text-texto2">{a.sistema}</span>}
        </span>
        {a.aceito === true && <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2 py-0.5 text-[11px] font-extrabold text-white"><Check className="size-3" />Aceito</span>}
        <SeloGravidade g={a.gravidade} className="shrink-0" />
      </div>

      <div className="px-3.5 pt-2.5">
        {daIA ? (
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-obra-texto">
            <Sparkles className="size-3.5" />Escrito pela Lia
            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-sup2"><span className="block h-full rounded-full bg-obra" style={{ width: `${Math.round(a.confianca * 100)}%` }} /></span>
            <span className="text-texto3">{Math.round(a.confianca * 100)}% de certeza</span>
          </div>
        ) : <span className="text-[11px] font-extrabold text-texto3">Adicionado por você</span>}
        {/* onde está na foto: deixa claro se falta marcar */}
        {!sel && (a.regiao
          ? <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-texto3"><Crosshair className="size-3" />Marcado na foto</span>
          : <button onClick={aoMarcar} className="mt-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-tinta underline underline-offset-2"><Crosshair className="size-3" />Marcar onde está na foto</button>)}
      </div>

      {!sel ? (
        <div className="grid gap-1.5 p-3.5 pt-2">
          {blocos.length ? blocos.map(({ ic: Ic, rot, txt }) => (
            <div key={rot} className="flex gap-2.5 rounded-xl bg-sup2 px-3 py-2">
              <Ic className="mt-0.5 size-4 shrink-0 text-texto3" />
              <div className="min-w-0 text-sm leading-snug"><span className="block text-[11px] font-extrabold uppercase tracking-wider text-texto3">{rot}</span>{txt}</div>
            </div>
          )) : <p className="rounded-xl bg-sup2 px-3 py-2 text-sm text-texto3">Sem texto ainda. Toque no ✎ para escrever.</p>}
        </div>
      ) : (
        <div className="grid gap-3 p-3.5 pt-2.5">
          <Campo rotulo="Tipo de anomalia"><Entrada list="tipos-anomalia" value={a.tipo} onChange={(e) => aoMudar({ tipo: e.target.value })} /></Campo>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-sup2 p-1" role="radiogroup" aria-label="Grau de risco">
            {(Object.keys(GRAVIDADE) as Gravidade[]).map((g) => (
              <button key={g} role="radio" aria-checked={a.gravidade === g} onClick={() => aoMudar({ gravidade: g })}
                className={cx('rounded-lg py-1.5 text-xs font-extrabold transition', a.gravidade === g ? 'text-white' : 'text-texto2 hover:text-texto')}
                style={a.gravidade === g ? { background: COR_GRAVIDADE[g] } : undefined}>
                {GRAVIDADE[g].nome}
              </button>
            ))}
          </div>
          <Campo rotulo="Sistema"><Entrada list="sistemas" value={a.sistema} onChange={(e) => aoMudar({ sistema: e.target.value })} /></Campo>
          <Campo rotulo="O que é (descrição)"><AreaTexto rows={2} value={a.descricao} onChange={(e) => aoMudar({ descricao: e.target.value })} /></Campo>
          <Campo rotulo="Por quê (causa provável)"><AreaTexto rows={2} value={a.causaProvavel} onChange={(e) => aoMudar({ causaProvavel: e.target.value })} /></Campo>
          <Campo rotulo="O que fazer (recomendação)"><AreaTexto rows={2} value={a.recomendacao} onChange={(e) => aoMudar({ recomendacao: e.target.value })} /></Campo>
          <Botao tam="p" variante="claro" onClick={aoMarcar}><Crosshair className="size-4" />{a.regiao ? 'Remarcar na foto' : 'Marcar na foto'}</Botao>
        </div>
      )}

      {/* ações em uma barra só */}
      <div className="grid grid-cols-[1fr_1fr_auto] border-t border-borda">
        <button onClick={() => aoMudar({ aceito: a.aceito === true ? null : true })}
          className={cx('flex h-11 items-center justify-center gap-1.5 text-sm font-extrabold transition', a.aceito === true ? 'bg-ok text-white' : 'text-ok-texto hover:bg-ok-suave')}>
          <Check className="size-4" />{a.aceito === true ? 'Aceito' : 'Aceitar'}
        </button>
        <button onClick={() => aoMudar({ aceito: a.aceito === false ? null : false })}
          className={cx('flex h-11 items-center justify-center gap-1.5 border-l border-borda text-sm font-extrabold transition', a.aceito === false ? 'bg-critico text-white' : 'text-texto2 hover:bg-sup2')}>
          <X className="size-4" />{a.aceito === false ? 'Descartado' : 'Descartar'}
        </button>
        <button onClick={aoSel} aria-expanded={sel} aria-label={sel ? 'Fechar edição' : 'Editar achado'} title={sel ? 'Pronto' : 'Editar'}
          className={cx('grid h-11 w-14 place-items-center border-l border-borda transition', sel ? 'bg-tinta text-white dark:text-[#0E1320]' : 'text-tinta hover:bg-tinta/10')}>
          {sel ? <Check className="size-5" /> : <Pencil className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function AbaConferir({ laudo, fotos, irPara, fotoInicial }: { laudo: Laudo; fotos: Foto[]; irPara: (a: Aba) => void; fotoInicial?: string }) {
  const [certeza, setCerteza] = useState<FaixaCerteza>('todos');
  const todas = fotos.filter((f) => f.analise || f.status === 'analisando' || f.status === 'erro');
  const lista = certeza === 'todos' ? todas : todas.filter((f) => (f.analise?.achados ?? []).some((a) => a.origem !== 'manual' && naFaixa(a.confianca, certeza)));
  const primeira = lista.find((f) => f.id === fotoInicial) ?? lista.find((f) => f.status === 'analisada') ?? lista[0];
  const [fotoId, setFotoId] = useState(primeira?.id);
  const foto = lista.find((f) => f.id === fotoId) ?? primeira;
  const [an, setAn] = useState<Analise | undefined>(foto?.analise);
  const [obs, setObs] = useState(foto?.observacao ?? '');
  const [sel, setSel] = useState<string>();
  const [marcando, setMarcando] = useState<string>();
  const sujo = useRef(false);
  const { avisar, el } = useAviso();
  const ditado = useDitado((t) => { sujo.current = true; setObs((o) => (o ? `${o} ${t}` : t)); });
  // atalhos do teclado (computador): ← → trocam de foto, fora dos campos de texto
  const atalhos = useRef<{ ant?: () => void; prox?: () => void }>({});
  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => {
      const alvo = e.target instanceof Element ? e.target : null;
      if (e.altKey || e.ctrlKey || e.metaKey || alvo?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') atalhos.current.ant?.();
      if (e.key === 'ArrowRight') atalhos.current.prox?.();
    };
    window.addEventListener('keydown', ouvir);
    return () => window.removeEventListener('keydown', ouvir);
  }, []);

  // troca de foto: carrega a cópia local
  useEffect(() => { setAn(foto?.analise); setObs(foto?.observacao ?? ''); setSel(undefined); setMarcando(undefined); sujo.current = false; }, [foto?.id, foto?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  // salva sozinho
  useEffect(() => {
    if (!sujo.current || !foto) return;
    const t = setTimeout(() => { void db.fotos.update(foto.id, { analise: an, observacao: obs }); sujo.current = false; }, 400);
    return () => clearTimeout(t);
  }, [an, obs, foto]);

  if (!lista.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Vazio icone={<Sparkles className="size-7" />} titulo="Nada para conferir ainda" texto="Suba as fotos e peça para a IA analisar. Depois você confere uma por uma aqui.">
          <Botao variante="obra" onClick={() => irPara('fotos')}>Ir para as fotos</Botao>
        </Vazio>
      </div>
    );
  }
  if (!foto) return null;

  const idx = Math.max(0, lista.findIndex((f) => f.id === foto.id));
  const numeroOriginal = todas.findIndex((f) => f.id === foto.id) + 1;
  const faixaAtual = FAIXAS.find((x) => x.id === certeza)!;
  const mudarAn = (p: Partial<Analise>) => { sujo.current = true; setAn((a) => (a ? { ...a, ...p } : a)); };
  const mudarAchado = (id: string, p: Partial<Achado>) => { sujo.current = true; setAn((x) => (x ? { ...x, achados: x.achados.map((a) => (a.id === id ? { ...a, ...p } : a)) } : x)); };
  const novoAchado = () => {
    const a: Achado = { id: novoId(), tipo: 'Fissura', sistema: 'Vedações', descricao: '', gravidade: 'minimo', causaProvavel: '', recomendacao: '', confianca: 1, aceito: true, origem: 'manual' };
    mudarAn({ achados: [...(an?.achados ?? []), a], semAnomalia: false });
    setSel(a.id); setMarcando(a.id);
  };
  const irFoto = async (i: number) => {
    if (sujo.current) { await db.fotos.update(foto.id, { analise: an, observacao: obs }); sujo.current = false; }
    const f = lista[i]; if (f) setFotoId(f.id);
  };
  const irFotoId = async (fid: string) => {
    if (sujo.current) { await db.fotos.update(foto.id, { analise: an, observacao: obs }); sujo.current = false; }
    setFotoId(fid);
  };
  const confirmar = async () => {
    if (!an) return;
    const achados = an.achados.map((a) => (a.aceito === null ? { ...a, aceito: true } : a));
    const semAnomalia = achados.every((a) => a.aceito === false);
    await db.fotos.update(foto.id, { analise: { ...an, achados, semAnomalia }, observacao: obs, status: 'conferida' });
    sujo.current = false;
    await tocarLaudo(laudo.id);
    const prox = lista.find((f, i) => i > idx && f.status === 'analisada') ?? lista.find((f) => f.status === 'analisada' && f.id !== foto.id);
    if (prox) setFotoId(prox.id);
    else { avisar('Tudo conferido! Veja o laudo.'); setTimeout(() => irPara('laudo'), 900); }
  };

  const conferidas = lista.filter((f) => f.status === 'conferida').length;
  const todosAchados = an?.achados ?? [];
  const achados = certeza === 'todos' ? todosAchados : todosAchados.filter((a) => a.origem === 'manual' || naFaixa(a.confianca, certeza));
  const foraDoFiltro = todosAchados.length - achados.length;
  const semDecisao = achados.filter((a) => a.aceito === null);
  const decididos = achados.length - semDecisao.length;
  const aceitarRestantes = () => { sujo.current = true; setAn((x) => (x ? { ...x, achados: x.achados.map((a) => (a.aceito === null && achados.some((v) => v.id === a.id) ? { ...a, aceito: true } : a)) } : x)); };
  atalhos.current = { ant: idx > 0 ? () => void irFoto(idx - 1) : undefined, prox: idx < lista.length - 1 ? () => void irFoto(idx + 1) : undefined };
  const situacao = foto.status === 'conferida' ? { t: 'Conferida', c: 'bg-ok-suave text-ok-texto' } : foto.status === 'erro' ? { t: 'Falhou', c: 'bg-critico-suave text-critico-texto' } : foto.status === 'analisando' ? { t: 'Analisando…', c: 'bg-obra-suave text-obra-texto' } : { t: 'A conferir', c: 'bg-medio-suave text-medio-texto' };
  const criticosDa = (f: Foto) => (f.analise?.achados ?? []).filter((a) => a.gravidade === 'critico' && a.aceito !== false).length;

  const falaLia = (() => {
    const ativos = achados.filter((a) => a.aceito !== false && a.origem !== 'manual');
    if (!ativos.length) return 'Já analisei esta foto: não vi anomalia aparente e já escrevi a legenda. Se viu algo no local, toque em “Adicionar achado”.';
    const crit = ativos.find((a) => a.gravidade === 'critico');
    if (crit) return `Já escrevi tudo desta foto. Atenção: ${crit.tipo.toLowerCase()} com cara de crítico, confira com cuidado.`;
    const top = [...ativos].sort((x, y) => y.confianca - x.confianca)[0];
    return `Já escrevi tudo desta foto: ${ativos.length === 1 ? top.tipo.toLowerCase() : `${ativos.length} achados`}, grau, causa e recomendação. É só conferir; se quiser mudar algo, toque em Editar.`;
  })();

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-4 sm:px-4 md:px-8 lg:grid-cols-[1fr_400px] lg:gap-6">
      <datalist id="tipos-anomalia">{TIPOS_ANOMALIA.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="sistemas">{SISTEMAS.map((t) => <option key={t} value={t} />)}</datalist>

      <div className="min-w-0">
        {/* filtro pela certeza da Lia: controle fixo + frase dizendo o que está na tela */}
        <div className="mb-3 rounded-2xl border border-borda bg-sup p-2.5">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-extrabold uppercase tracking-wider text-texto3">Certeza da Lia<Dica texto="Mostra só as fotos em que a Lia teve esse nível de certeza nos achados. Comece pelas “Em dúvida”: são as que mais pedem o seu olho." /></div>
          <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Filtrar pela certeza da Lia">
            {FAIXAS.map((fx) => {
              const n = fx.id === 'todos' ? todas.length : todas.filter((f) => (f.analise?.achados ?? []).some((a) => a.origem !== 'manual' && naFaixa(a.confianca, fx.id))).length;
              const ativo = certeza === fx.id;
              return (
                <button key={fx.id} role="tab" aria-selected={ativo} disabled={!n} onClick={() => { setCerteza(fx.id); const pf = fx.id === 'todos' ? todas[0] : todas.find((f) => (f.analise?.achados ?? []).some((a) => a.origem !== 'manual' && naFaixa(a.confianca, fx.id))); if (pf) void irFotoId(pf.id); }}
                  className={cx('flex flex-col items-center rounded-xl px-1 py-1.5 transition disabled:opacity-35', ativo ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'hover:bg-sup2')}>
                  <span className="flex items-center gap-1 text-[13px] font-extrabold"><span className={cx('size-2 rounded-full', fx.ponto)} />{fx.rotulo}</span>
                  <span className={cx('text-[11px] font-bold', ativo ? 'text-white/70' : 'text-texto3')}>{fx.faixa} · {n}</span>
                </button>
              );
            })}
          </div>
          {certeza !== 'todos' && (
            <div className={cx('mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]', faixaAtual.caixa)}>
              <span className="flex-1"><b>Mostrando {lista.length} de {todas.length} fotos:</b> só as {faixaAtual.explica}.</span>
              <button onClick={() => setCerteza('todos')} className="shrink-0 font-extrabold underline underline-offset-2">Ver todas</button>
            </div>
          )}
        </div>

        {/* qual foto está na tela: número original + posição no filtro */}
        <div className="mb-2.5 flex items-center gap-3">
          <span className="shrink-0 text-sm font-extrabold">Foto {dois(numeroOriginal)}{certeza !== 'todos' ? <span className="font-bold text-texto3"> · {idx + 1}ª de {lista.length} no filtro</span> : <span className="text-texto3"> de {dois(todas.length)}</span>}</span>
          <span className={cx('shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold', situacao.c)}>{situacao.t}</span>
          <Barra className="flex-1" valor={conferidas} total={lista.length} />
          <span className="shrink-0 whitespace-nowrap text-xs font-bold text-ok-texto">{conferidas}/{lista.length} conferidas</span>
        </div>

        {marcando ? (
          <Marcador foto={foto} aoMarcar={(r) => { mudarAchado(marcando, { regiao: r }); setMarcando(undefined); }} />
        ) : (
          <div className="relative">
            <FotoMarcada foto={foto} achados={achados} selecionado={sel} aoSelecionar={setSel} grande scanner={foto.status === 'analisando'} className="rounded-2xl" />
            {/* etiqueta da câmera: quando e onde a foto foi tirada, bem visível */}
            <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#121A2B]/85 px-2.5 py-1.5 text-sm font-extrabold text-white backdrop-blur">
                <CalendarDays className="size-4 text-obra" />
                {foto.tiradaEm ? new Date(foto.tiradaEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sem data na foto'}
              </span>
              {foto.gps && (
                <a className="pointer-events-auto inline-flex items-center gap-1 rounded-xl bg-[#121A2B]/85 px-2.5 py-1.5 text-sm font-extrabold text-white backdrop-blur" target="_blank" rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${foto.gps.lat}&mlon=${foto.gps.lng}#map=19/${foto.gps.lat}/${foto.gps.lng}`}>
                  <MapPin className="size-4 text-obra" />Ver local
                </a>
              )}
            </div>
            {an?.ambiente && <span className="pointer-events-none absolute left-2 top-2 rounded-xl bg-white/90 px-2.5 py-1 text-sm font-extrabold text-[#121A2B] shadow">{an.ambiente}</span>}
          </div>
        )}
        {an?.origem === 'demo' && <p className="mt-1.5 text-xs text-texto3">Análise de demonstração (simulada)</p>}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {lista.map((f, i) => (
            <button key={f.id} onClick={() => irFoto(i)} aria-label={`Foto ${i + 1}`} className={cx('relative w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:w-20', f.id === foto.id ? 'ring-obra ring-offset-2 ring-offset-papel' : 'opacity-75 ring-transparent hover:opacity-100')}>
              <FotoMarcada foto={f} achados={[]} />
              <span className={cx('absolute bottom-1 right-1 grid size-5 place-items-center rounded-full text-[10px] font-extrabold',
                f.status === 'conferida' ? 'bg-ok text-white' : f.status === 'erro' ? 'bg-critico text-white' : 'bg-obra text-[#121A2B]')}>
                {f.status === 'conferida' ? <Check className="size-3" /> : todas.indexOf(f) + 1}
              </span>
              {criticosDa(f) > 0 && <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-full bg-critico text-[9px] font-extrabold text-white ring-2 ring-white" title={`${criticosDa(f)} crítico(s)`}>!</span>}
            </button>
          ))}
        </div>
      </div>

      <aside className="grid content-start gap-3">
        {foto.status === 'erro' && (
          <Cartao className="border-critico/40 bg-critico-suave p-4 text-critico-texto">
            <b>A análise falhou.</b> <span className="text-sm">{foto.erro}</span>
            <Botao tam="p" variante="claro" className="mt-3" onClick={() => analisarFoto(laudo, foto.id)}><RotateCw className="size-4" />Tentar de novo</Botao>
          </Cartao>
        )}
        {an && (
          <>
            <Lia tam={38} humor={achados.some((a) => a.gravidade === 'critico' && a.aceito !== false) ? 'atenta' : achados.length ? 'normal' : 'feliz'}>{falaLia}</Lia>

            {foraDoFiltro > 0 && <button onClick={() => setCerteza('todos')} className="rounded-xl bg-sup2 px-3 py-2 text-left text-xs font-bold text-texto2">+{foraDoFiltro} achado{foraDoFiltro > 1 ? 's' : ''} desta foto fora do filtro · <span className="text-tinta">ver todos</span></button>}
            {achados.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-borda bg-sup px-3 py-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">Achados desta foto</span>
                <span className="text-sm font-extrabold">{decididos}/{achados.length} decididos</span>
                <Dica texto="Aceite o que vai para o laudo e descarte o que não procede. Ao confirmar, o que ficou sem decisão entra como aceito." />
                {semDecisao.length > 1 && <button onClick={aceitarRestantes} className="ml-auto inline-flex items-center gap-1 rounded-full bg-ok-suave px-2.5 py-1 text-xs font-extrabold text-ok-texto hover:bg-ok hover:text-white"><CheckCheck className="size-3.5" />Aceitar os {semDecisao.length}</button>}
              </div>
            )}
            {todosAchados.length === 0 && <Cartao className="p-4 text-sm text-ok-texto"><b>Sem anomalia aparente.</b> A foto entra no laudo como registro do ambiente.</Cartao>}
            {achados.map((a, i) => (
              <CartaoAchado key={a.id} a={a} n={i + 1} sel={sel === a.id} aoSel={() => setSel(sel === a.id ? undefined : a.id)} aoMudar={(p) => mudarAchado(a.id, p)} aoMarcar={() => { setSel(a.id); setMarcando(a.id); }} />
            ))}
            <button onClick={novoAchado} className="flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-borda-forte font-extrabold text-texto2 hover:border-obra hover:text-obra-texto"><Plus className="size-4" />Adicionar achado</button>

            <Cartao className="grid gap-1.5 p-3.5">
              <div className="flex flex-wrap items-center gap-1.5"><b className="text-sm">{an.ambiente || 'Ambiente'}{an.elemento ? ` · ${an.elemento}` : ''}</b>{an.origem !== 'manual' && <SeloLia texto="Legenda escrita pela Lia" />}</div>
              <p className="text-sm text-texto2">{an.legenda || 'Sem legenda.'}</p>
            </Cartao>
            <Recolhivel titulo="Editar legenda e observação" resumo={obs ? 'Com observação sua' : 'Opcional: mude o texto ou dite uma observação'}>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Ambiente"><Entrada value={an.ambiente} onChange={(e) => mudarAn({ ambiente: e.target.value })} /></Campo>
                  <Campo rotulo="Elemento"><Entrada value={an.elemento} onChange={(e) => mudarAn({ elemento: e.target.value })} /></Campo>
                </div>
                <Campo rotulo="Legenda no laudo" ajuda="Texto que aparece embaixo da foto no relatório fotográfico."><AreaTexto rows={2} value={an.legenda} onChange={(e) => mudarAn({ legenda: e.target.value })} /></Campo>
                <Campo rotulo={<span className="flex w-full items-center justify-between">Sua observação {ditado.suportado && (
                  <button type="button" onClick={ditado.alternar} className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold', ditado.ouvindo ? 'bg-critico text-white' : 'bg-sup2 text-texto2')}>
                    {ditado.ouvindo ? <><MicOff className="size-3.5" />Parar</> : <><Mic className="size-3.5" />Ditar</>}
                  </button>)}</span>}>
                  <AreaTexto rows={2} value={obs} onChange={(e) => { sujo.current = true; setObs(e.target.value); }} placeholder="Fale ou escreva o que só você viu no local" />
                </Campo>
              </div>
            </Recolhivel>

            {/* barra de ações: fixa no celular, no fim da coluna no computador */}
            <div className="h-20 lg:hidden" aria-hidden />
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-sup/95 px-3 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur lg:sticky lg:bottom-4 lg:rounded-2xl lg:border lg:p-3">
              {semDecisao.length > 0 && foto.status !== 'conferida' && <p className="mb-1.5 text-center text-[11px] font-bold text-texto3">{semDecisao.length} sem decisão {semDecisao.length > 1 ? 'entram' : 'entra'} como {semDecisao.length > 1 ? 'aceitos' : 'aceito'} ao confirmar<span className="hidden lg:inline"> · ← → trocam de foto</span></p>}
              <div className="flex items-center gap-2">
                <button onClick={() => irFoto(idx - 1)} disabled={idx === 0} aria-label="Foto anterior" className="grid size-12 shrink-0 place-items-center rounded-xl bg-sup2 text-texto2 disabled:opacity-30"><ChevronLeft className="size-5" /></button>
                <button onClick={confirmar} className="pilula pilula-obra h-12 flex-1"><CheckCheck className="size-5" />{foto.status === 'conferida' ? 'Salvar' : 'Confirmar'}</button>
                <button onClick={() => irFoto(idx + 1)} disabled={idx === lista.length - 1} aria-label="Próxima foto" className="grid size-12 shrink-0 place-items-center rounded-xl bg-sup2 text-texto2 disabled:opacity-30"><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </>
        )}
      </aside>
      {el}
    </div>
  );
}

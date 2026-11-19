import { useEffect, useRef, useState, type DragEvent } from 'react';
import { SeloIA } from '../config/IasServidor';
import { nomeIA } from '../../dominio/modelo';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, ArrowLeft, ArrowRight, Camera, Check, Eye, ImagePlus, LoaderCircle, MoreHorizontal, RotateCw, Sparkles, Trash2, Upload } from 'lucide-react';
import { db, lerConfig, tocarLaudo } from '../../db/db';
import type { Foto, Laudo } from '../../dominio/modelo';
import { achadosValidos, progressoFotos } from '../../dominio/regras';
import { TIPOS } from '../../dominio/tipos';
import { analisarFoto, analisarPendentes } from '../../ia/motor';
import { prepararFoto } from '../../lib/imagem';
import { Barra, Botao, Modal, useAviso } from '../../componentes/ui';
import { FotoMarcada } from '../../componentes/FotoMarcada';
import { BarraWizard } from '../../componentes/Wizard';
import { Lia } from '../../componentes/Lia';
import { cx, dois, novoId } from '../../lib/util';
import { MAX_FOTOS_POR_LAUDO, ouvirNuvem } from '../../db/nuvem';
import type { Aba } from './Editor';

type Filtro = 'todas' | 'conferir' | 'conferidas' | 'erro';

function AcaoFoto({ ic, children, onClick, perigo }: { ic: React.ReactNode; children: React.ReactNode; onClick: () => void; perigo?: boolean }) {
  return <button onClick={onClick} className={cx('flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-bold transition', perigo ? 'text-critico-texto hover:bg-critico-suave' : 'hover:bg-sup2')}>{ic}{children}</button>;
}

/** Miniatura da foto com status simples (bolinha) e menu ⋯ para mover, reanalisar ou excluir. */
function MiniFoto({ f, n, primeira, ultima, aoAbrir, aoMover, aoReanalisar }: { f: Foto; n: number; primeira: boolean; ultima: boolean; aoAbrir: () => void; aoMover: (d: -1 | 1) => void; aoReanalisar: () => void }) {
  const [menu, setMenu] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => { if (!menu) setConfirmar(false); }, [menu]);
  const ach = f.status === 'conferida' ? achadosValidos(f) : (f.analise?.achados ?? []);
  const criticos = ach.filter((a) => a.gravidade === 'critico').length;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-borda bg-sup">
      <button className="block w-full text-left" onClick={aoAbrir} aria-label={`Abrir foto ${n}`}>
        <FotoMarcada foto={f} achados={ach} scanner={f.status === 'analisando'} />
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          <span className={cx('grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold',
            f.status === 'conferida' ? 'bg-ok text-white' : f.status === 'analisada' ? 'bg-obra text-[#121A2B]' : f.status === 'erro' ? 'bg-critico text-white' : 'bg-sup2 text-texto3')}>
            {f.status === 'conferida' ? <Check className="size-3" /> : f.status === 'analisando' ? <LoaderCircle className="size-3 girando" /> : f.status === 'erro' ? <AlertCircle className="size-3" /> : n}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{f.analise?.ambiente ?? (f.status === 'pendente' ? 'Aguardando análise' : f.status === 'analisando' ? 'Analisando…' : 'Erro na análise')}</span>
          {(f.analise?.porIA?.length ?? 0) > 1 && <span className="flex -space-x-1" title={`Analisada por ${f.analise!.porIA!.filter((p) => !p.erro).map((p) => nomeIA(p.ia)).join(' e ')}`}>{f.analise!.porIA!.filter((p) => !p.erro).map((p) => <SeloIA key={p.ia} id={p.ia} tam={16} />)}</span>}
          {criticos > 0 && <span className="rounded-full bg-critico px-1.5 text-[11px] font-extrabold text-white">{criticos}</span>}
        </div>
      </button>
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-[#121A2B]/80 px-1.5 text-[11px] font-extrabold text-white">{dois(n)}</span>
      <button onClick={() => setMenu(!menu)} aria-label="Mais ações" className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-[#121A2B]/70 text-white backdrop-blur"><MoreHorizontal className="size-4" /></button>
      {/* ações da foto: janela própria (não fica cortada pelo cartão) */}
      <Modal aberto={menu} aoFechar={() => setMenu(false)} titulo={`Foto ${dois(n)}${f.analise?.ambiente ? ` · ${f.analise.ambiente}` : ''}`} largura="max-w-sm">
        <div className="-mt-1 grid gap-1.5">
          <div className="mb-2 overflow-hidden rounded-xl"><FotoMarcada foto={f} achados={ach} /></div>
          {(f.analise || f.status === 'erro') && <AcaoFoto ic={<Eye className="size-5" />} onClick={() => { setMenu(false); aoAbrir(); }}>Abrir e conferir</AcaoFoto>}
          {!primeira && <AcaoFoto ic={<ArrowLeft className="size-5" />} onClick={() => { aoMover(-1); setMenu(false); }}>Mover para trás</AcaoFoto>}
          {!ultima && <AcaoFoto ic={<ArrowRight className="size-5" />} onClick={() => { aoMover(1); setMenu(false); }}>Mover para frente</AcaoFoto>}
          {f.status !== 'pendente' && f.status !== 'analisando' && <AcaoFoto ic={<RotateCw className="size-5" />} onClick={() => { aoReanalisar(); setMenu(false); }}>Pedir para a Lia analisar de novo</AcaoFoto>}
          {!confirmar
            ? <AcaoFoto ic={<Trash2 className="size-5" />} perigo onClick={() => setConfirmar(true)}>Excluir foto</AcaoFoto>
            : <div className="rounded-xl bg-critico-suave p-3 text-sm text-critico-texto"><b>Excluir esta foto?</b> Os achados dela saem do laudo.
                <div className="mt-2 flex gap-2"><Botao tam="p" variante="perigo" className="bg-critico text-white" onClick={() => { void db.fotos.delete(f.id); setMenu(false); }}>Excluir</Botao><Botao tam="p" variante="fantasma" onClick={() => setConfirmar(false)}>Cancelar</Botao></div>
              </div>}
        </div>
      </Modal>
    </div>
  );
}

export function AbaFotos({ laudo, fotos, irPara }: { laudo: Laudo; fotos: Foto[]; irPara: (a: Aba, foto?: string) => void }) {
  const inp = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [subindo, setSubindo] = useState<{ feitas: number; total: number } | null>(null);
  const [analisando, setAnalisando] = useState<{ feitas: number; total: number } | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const motor = useLiveQuery(async () => { const c = await lerConfig(); return c.motorIA === 'claude' && c.apiKey ? 'claude' : c.motorIA === 'gemini' && c.geminiKey ? 'gemini' : c.motorIA === 'servidor' ? 'servidor' : 'demo'; }, [], 'demo');
  const { avisar, el } = useAviso();
  const cheio = fotos.length >= MAX_FOTOS_POR_LAUDO;
  // o servidor recusou algo (ex.: limite de fotos): mostra aqui
  useEffect(() => ouvirNuvem((e) => { if (e.tipo === 'erro') avisar(e.mensagem, 'erro'); }), [avisar]);
  const p = progressoFotos(fotos);
  const paraConferir = fotos.filter((f) => f.status === 'analisada');
  const achadosNovos = paraConferir.flatMap((f) => f.analise?.achados ?? []);
  const criticos = achadosNovos.filter((a) => a.gravidade === 'critico').length;
  const docs = TIPOS[laudo.tipo].foco === 'documento';

  const adicionar = async (lista: FileList | File[]) => {
    const imagens = [...lista].filter((f) => f.type.startsWith('image/'));
    if (!imagens.length) return;
    const vagas = Math.max(0, MAX_FOTOS_POR_LAUDO - fotos.length);
    if (!vagas) { avisar(`Na fase de teste cada laudo aceita até ${MAX_FOTOS_POR_LAUDO} fotos.`, 'erro'); return; }
    const arqs = imagens.slice(0, vagas);
    if (imagens.length > vagas) avisar(`Só ${vagas === 1 ? 'cabia mais 1 foto' : `cabiam mais ${vagas} fotos`} (limite de ${MAX_FOTOS_POR_LAUDO} no teste).`, 'erro');
    setSubindo({ feitas: 0, total: arqs.length });
    let ordem = fotos.length ? Math.max(...fotos.map((f) => f.ordem)) + 1 : 0;
    for (const [i, a] of arqs.entries()) {
      try {
        const x = await prepararFoto(a);
        await db.fotos.add({ id: novoId(), laudoId: laudo.id, ordem: ordem++, nomeArquivo: a.name, ...x, status: 'pendente', criadoEm: Date.now() });
      } catch { avisar(`Não deu para ler ${a.name}`, 'erro'); }
      setSubindo({ feitas: i + 1, total: arqs.length });
    }
    await tocarLaudo(laudo.id);
    setSubindo(null);
    // mandou a foto, a IA já analisa: sem botão extra
    setAnalisando({ feitas: 0, total: arqs.length });
    await analisarPendentes(laudo, (feitas, total) => setAnalisando({ feitas, total }));
    setAnalisando(null);
  };
  const analisar = async () => {
    setAnalisando({ feitas: 0, total: p.pendentes });
    await analisarPendentes(laudo, (feitas, total) => setAnalisando({ feitas, total }));
    setAnalisando(null);
  };
  const mover = async (f: Foto, dir: -1 | 1) => {
    const i = fotos.findIndex((x) => x.id === f.id);
    const outra = fotos[i + dir];
    if (!outra) return;
    await db.transaction('rw', db.fotos, async () => { await db.fotos.update(f.id, { ordem: outra.ordem }); await db.fotos.update(outra.id, { ordem: f.ordem }); });
  };
  const soltar = (e: DragEvent) => { e.preventDefault(); setArrastando(false); void adicionar(e.dataTransfer.files); };
  const escolher = () => inp.current?.click();
  const tirar = () => cam.current?.click();

  // a ÚNICA ação principal deste passo, conforme o momento
  const passo = analisando ? 'analisando' : !fotos.length ? 'vazio' : p.pendentes ? 'analisar' : paraConferir.length ? 'conferir' : 'pronto';
  const principal = {
    vazio: { rotulo: 'Escolher fotos', icone: <ImagePlus className="size-5" />, aoClicar: escolher },
    analisar: { rotulo: `Analisar ${p.pendentes} foto${p.pendentes > 1 ? 's' : ''}`, icone: <Sparkles className="size-5" />, aoClicar: analisar },
    analisando: { rotulo: 'Analisando…', icone: <LoaderCircle className="size-5 girando" />, aoClicar: () => {}, desativado: true },
    conferir: { rotulo: `Conferir ${paraConferir.length} foto${paraConferir.length > 1 ? 's' : ''}`, aoClicar: () => irPara('conferir') },
    pronto: { rotulo: 'Próximo: ver o laudo', aoClicar: () => irPara('laudo') },
  }[passo];

  const visiveis = fotos.filter((f) => filtro === 'todas' || (filtro === 'conferir' ? f.status === 'analisada' : filtro === 'conferidas' ? f.status === 'conferida' : f.status === 'erro'));
  const filtros: [Filtro, string, number][] = [['todas', 'Todas', fotos.length], ['conferir', 'Para conferir', paraConferir.length], ['conferidas', 'Conferidas', p.conferidas], ['erro', 'Com erro', fotos.filter((f) => f.status === 'erro').length]];

  const inputs = (
    <>
      <input ref={inp} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) void adicionar(e.target.files); e.target.value = ''; }} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files) void adicionar(e.target.files); e.target.value = ''; }} />
    </>
  );

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-3 py-4 sm:px-4 md:py-6"
      onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)} onDrop={soltar}>
      {inputs}

      {/* a Lia diz o que fazer agora */}
      <Lia tam={40} humor={passo === 'analisando' ? 'pensando' : criticos ? 'atenta' : passo === 'pronto' ? 'feliz' : 'normal'}>
        {passo === 'vazio' && <>Me mande as {docs ? 'fotos dos documentos' : 'fotos da vistoria'}. Eu analiso cada uma <b>sozinha</b> e já escrevo tudo; você só confere.</>}
        {passo === 'analisar' && <>Tem {p.pendentes} foto{p.pendentes > 1 ? 's' : ''} que ainda não analisei. Toque em Analisar.{motor === 'demo' && <span className="mt-1 block text-sm text-texto3">Modo demonstração: a análise é simulada. <Link to="/configuracoes?aba=ia" className="font-bold text-tinta underline-offset-2 hover:underline">Ligar a IA de verdade</Link></span>}</>}
        {passo === 'analisando' && analisando && <>Analisando e escrevendo: foto {Math.min(analisando.feitas + 1, analisando.total)} de {analisando.total}…<Barra className="mt-2" valor={analisando.feitas} total={analisando.total} /></>}
        {passo === 'conferir' && (criticos ? <>Pronto! Analisei e já escrevi tudo: {achadosNovos.length} achados, <b>{criticos} crítico{criticos > 1 ? 's' : ''}</b>. Agora é só conferir.</> : <>Pronto! Analisei e já escrevi tudo ({achadosNovos.length} achado{achadosNovos.length !== 1 ? 's' : ''}). Agora é só conferir.</>)}
        {passo === 'pronto' && 'Todas as fotos conferidas. O laudo já está montado!'}
      </Lia>

      {subindo && <div className="rounded-2xl border border-borda bg-sup p-4"><div className="mb-1.5 text-sm font-bold text-texto2">Preparando {subindo.feitas} de {subindo.total} fotos…</div><Barra valor={subindo.feitas} total={subindo.total} /></div>}

      {!fotos.length ? (
        <div className={cx('rounded-[22px] border-2 border-dashed p-8 text-center transition md:p-12', arrastando ? 'border-obra bg-obra-suave' : 'border-borda-forte bg-sup')}>
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-obra-suave text-obra-texto"><Upload className="size-8" /></div>
          <h2 className="mt-4 text-xl font-bold md:text-2xl">Mande as fotos. A Lia faz o resto.</h2>
          <ol className="mx-auto mt-4 grid max-w-md gap-2 text-left sm:grid-cols-3 sm:text-center">
            {[['1', 'Você manda as fotos', 'todas de uma vez'], ['2', 'A Lia analisa e escreve', 'ambiente, legenda, achados, grau e recomendação'], ['3', 'Você só confere', 'e edita se quiser']].map(([n, t, d]) => (
              <li key={n} className="flex items-start gap-2.5 rounded-xl bg-sup2 p-2.5 sm:flex-col sm:items-center sm:gap-1">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-obra text-xs font-extrabold text-[#121A2B]">{n}</span>
                <span><b className="block text-sm leading-tight">{t}</b><span className="text-xs text-texto3">{d}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-center text-xs font-bold text-texto3">Fase de teste: até {MAX_FOTOS_POR_LAUDO} fotos por laudo.</p>
          <div className="mt-3 grid gap-2 sm:flex sm:justify-center">
            <button onClick={escolher} className="pilula pilula-obra"><ImagePlus className="size-5" />Escolher fotos</button>
            <button onClick={tirar} className="pilula pilula-clara"><Camera className="size-5" />Tirar foto agora</button>
          </div>
        </div>
      ) : (
        <>
          <div className={cx('flex items-center gap-2 rounded-2xl border border-dashed p-2 transition', arrastando ? 'border-obra bg-obra-suave' : 'border-borda-forte')}>
            <button onClick={escolher} disabled={cheio} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sup font-extrabold text-texto2 hover:text-texto disabled:opacity-45"><ImagePlus className="size-5" />Adicionar fotos</button>
            <button onClick={tirar} disabled={cheio} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sup font-extrabold text-texto2 hover:text-texto disabled:opacity-45"><Camera className="size-5" />Câmera</button>
          </div>
          <p className={cx('-mt-1 text-center text-xs font-bold', cheio ? 'text-obra-forte' : 'text-texto3')}>
            {fotos.length} de {MAX_FOTOS_POR_LAUDO} fotos{cheio ? ' — limite da fase de teste' : ''}
          </p>

          {p.analisadas > 0 && (
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="tablist">
              {filtros.filter(([id, , n]) => id === 'todas' || n > 0).map(([id, rot, n]) => (
                <button key={id} role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)}
                  className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition', filtro === id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda')}>
                  {rot}<span className={cx('text-xs', filtro === id ? 'text-obra' : 'text-texto3')}>{n}</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visiveis.map((f) => {
              const i = fotos.indexOf(f);
              return <MiniFoto key={f.id} f={f} n={i + 1} primeira={i === 0} ultima={i === fotos.length - 1}
                aoAbrir={() => (f.analise || f.status === 'erro' ? irPara('conferir', f.id) : undefined)}
                aoMover={(d) => mover(f, d)} aoReanalisar={() => analisarFoto(laudo, f.id)} />;
            })}
          </div>
        </>
      )}

      <BarraWizard voltar={{ rotulo: 'Dados', aoClicar: () => irPara('dados') }} principal={principal}
        nota={fotos.length ? `${p.total} foto${p.total > 1 ? 's' : ''} · ${p.conferidas} conferida${p.conferidas !== 1 ? 's' : ''}` : undefined} />
      {el}
    </div>
  );
}

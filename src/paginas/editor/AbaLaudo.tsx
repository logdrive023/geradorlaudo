import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, FileDown, FileText, Maximize2, Minimize2, Pencil, MessageSquare, Printer, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { emitirLaudo, respostasDoLaudo, urlVerificacao, type RespostaCliente } from '../../db/organizacao';
import { useSessao } from '../../lib/sessao';
import { LinkPublico } from '../../componentes/Pecas';
import { PlanoAcao } from '../../componentes/PlanoAcao';
import { criarLinkCliente, desligarLinkCliente, logadoNaNuvem } from '../../db/nuvem';
import { Prontidao } from '../../componentes/Prontidao';
import { BarraWizard } from '../../componentes/Wizard';
import { Leitura } from '../../laudo/Leitura';
import { db, tocarLaudo } from '../../db/db';
import type { Foto, Laudo, Usuario } from '../../dominio/modelo';
import { conclusaoPadrao, revisarLaudo, type ItemRevisao } from '../../dominio/regras';
import { gerarConclusao } from '../../ia/motor';
import { Documento, type Edicao } from '../../laudo/Documento';
import { AreaTexto, Botao, Cartao, Dica, useAviso } from '../../componentes/ui';
import { baixar, cx } from '../../lib/util';
import { blobParaDataUrl } from '../../lib/imagem';
import type { Aba } from './Editor';

const ESTILO_WORD = `body{font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#1b1f29}
h1,h2,h3{color:#1D3B70}h2{border-bottom:2px solid #FF8A1F;font-size:13pt}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #d4dae4;padding:4px 6px;text-align:left;vertical-align:top}th{background:#EEF2F8}
.cab,.rod{font-size:8pt;color:#6b7890}.folha{page-break-after:always}img{max-width:16cm}button{display:none}`;

async function exportarWord(el: HTMLElement, nome: string) {
  const copia = el.cloneNode(true) as HTMLElement;
  // troca as imagens temporárias (blob:) por imagens embutidas
  await Promise.all([...copia.querySelectorAll('img')].map(async (img) => {
    if (img.src.startsWith('blob:')) img.src = await blobParaDataUrl(await (await fetch(img.src)).blob());
    img.removeAttribute('class');
  }));
  copia.querySelectorAll('.scanner, button').forEach((x) => x.remove());
  copia.querySelectorAll('[contenteditable]').forEach((x) => { x.removeAttribute('contenteditable'); x.removeAttribute('class'); });
  const html = `<html><head><meta charset="utf-8"><style>${ESTILO_WORD}</style></head><body>${copia.innerHTML}</body></html>`;
  baixar(`${nome}.doc`, new Blob(['﻿', html], { type: 'application/msword' }));
}

/** A folha A4 (210 mm ≈ 794 px) encolhe para caber na tela do celular; na impressão volta ao tamanho real. */
function DocumentoAjustado({ docRef, children, real = false, editando = false }: { docRef: React.RefObject<HTMLDivElement | null>; children: React.ReactNode; real?: boolean; editando?: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [altura, setAltura] = useState<number>();
  useEffect(() => {
    const medir = () => {
      const largura = caixa.current?.clientWidth ?? 0;
      const e = real ? 1 : Math.min(1, largura / 800);
      setEscala(e);
      setAltura((docRef.current?.scrollHeight ?? 0) * e);
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (caixa.current) ro.observe(caixa.current);
    if (docRef.current) ro.observe(docRef.current);
    return () => ro.disconnect();
  }, [docRef, real]);
  return (
    <div className={cx('so-documento min-w-0 rounded-[22px] bg-sup2 p-2 sm:p-4 md:p-6', editando && 'editando-a4')}>
      <div ref={caixa} style={{ height: altura }} className={cx(real ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden', 'print:!h-auto print:overflow-visible')}>
        <div ref={docRef} className="folha-escala w-[800px] print:w-auto" style={{ transform: `scale(${escala})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  );
}

/** Link só de leitura para o cliente acompanhar o laudo (sem conta, sem instalar nada). */
function LinkCliente({ laudoId, avisar, link, setLink }: { laudoId: string; avisar: (t: string, tom?: 'ok' | 'erro') => void; link: string | null; setLink: (l: string | null) => void }) {
  if (!logadoNaNuvem()) return null;
  return (
    <LinkPublico titulo="Link para o cliente" textoCompartilhar="Seu laudo está pronto para leitura:" link={link} setLink={setLink} avisar={avisar}
      dica="O cliente abre o laudo no celular, só para ler e baixar o PDF, sem conta. Você pode desligar o link quando quiser."
      gerar={() => criarLinkCliente(laudoId)} desligar={() => desligarLinkCliente(laudoId)} />
  );
}

/** O que o cliente respondeu pelo link (aceite, contestação, comentário), mais recente primeiro. */
function RespostasDoCliente({ laudo, fotos }: { laudo: Laudo; fotos: Foto[] }) {
  const [rs, setRs] = useState<RespostaCliente[]>([]);
  useEffect(() => { if (logadoNaNuvem()) respostasDoLaudo(laudo.id).then(setRs).catch(() => setRs([])); }, [laudo.id]);
  if (!rs.length) return null;
  const nomeAchado = (id?: string) => { for (const f of fotos) { const a = f.analise?.achados.find((x) => x.id === id); if (a) return `${a.tipo}${f.analise?.ambiente ? ` (${f.analise.ambiente})` : ''}`; } return ''; };
  const ROT = { aceite: ['Aceitou o laudo', 'bg-ok-suave text-ok-texto'], contestacao: ['Contestou', 'bg-medio-suave text-medio-texto'], comentario: ['Comentou', 'bg-sup2 text-texto2'], reparo: ['Pediu reparo', 'bg-obra-suave text-obra-texto'], aprovacao: ['Aprovou', 'bg-ok-suave text-ok-texto'] } as const;
  return (
    <Cartao className="grid gap-2 p-4">
      <b className="flex items-center gap-2"><MessageSquare className="size-5 text-tinta" />Respostas do cliente<span className="rounded-full bg-sup2 px-2 text-xs">{rs.length}</span></b>
      <ul className="grid gap-2">
        {rs.map((r) => (
          <li key={r.id} className="rounded-xl bg-sup2 px-3 py-2.5 text-sm">
            <span className="flex flex-wrap items-center gap-2"><span className={cx('rounded-full px-2 py-0.5 text-[11px] font-extrabold', ROT[r.tipo][1])}>{ROT[r.tipo][0]}</span><b>{r.nome}</b>{r.documento && <span className="text-texto3">· {r.documento}</span>}<span className="ml-auto text-xs text-texto3">{new Date(r.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></span>
            {r.achadoId && nomeAchado(r.achadoId) && <span className="mt-1 block text-xs font-bold text-texto2">Sobre: {nomeAchado(r.achadoId)}</span>}
            {r.texto && <p className="mt-1 text-texto">{r.texto}</p>}
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

/** Emitir: registra o laudo no servidor com código público e resumo do conteúdo (vai no PDF). */
function Autenticidade({ laudo, avisar }: { laudo: Laudo; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const { usuario } = useSessao();
  const [emitindo, setEmitindo] = useState(false);
  if (!logadoNaNuvem() || usuario?.papel === 'assistente') return null;
  const codigo = laudo.dados.codigoVerificacao;
  const emitir = async () => {
    setEmitindo(true);
    try {
      const e = await emitirLaudo(laudo.id);
      await tocarLaudo(laudo.id, { dados: { ...laudo.dados, codigoVerificacao: e.codigo, emitidoEm: e.emitidoEm } });
      avisar(codigo ? 'Emissão atualizada' : 'Laudo emitido: o código já está no PDF');
    } catch (err) { avisar((err as Error).message, 'erro'); }
    setEmitindo(false);
  };
  return (
    <Cartao className="grid gap-2 p-4">
      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-ok" /><b>Autenticidade</b>
        <Dica texto="Ao emitir, o servidor guarda o resumo do conteúdo (SHA-256) e gera um código. O código sai no PDF; quem recebe confere online se o laudo é autêntico e quem é o responsável." /></div>
      {codigo ? (
        <p className="text-sm text-texto2">Emitido · código <b className="font-mono text-texto">{codigo}</b> ·{' '}
          <a href={urlVerificacao(codigo)} target="_blank" rel="noreferrer" className="font-extrabold text-tinta underline underline-offset-2">ver a verificação</a></p>
      ) : <p className="text-sm text-texto2">Quando o laudo estiver pronto, emita para pôr o código de verificação no PDF.</p>}
      <Botao tam="p" variante={codigo ? 'claro' : 'obra'} carregando={emitindo} onClick={emitir}>{codigo ? 'Emitir de novo (após mudanças)' : 'Emitir com código de verificação'}</Botao>
    </Cartao>
  );
}

export function AbaLaudo({ laudo, fotos, autor, irPara }: { laudo: Laudo; fotos: Foto[]; autor?: Usuario; irPara: (a: Aba, foto?: string) => void }) {
  const doc = useRef<HTMLDivElement>(null);
  const [conclusao, setConclusao] = useState(laudo.conclusao);
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [modo, setModo] = useState<'leitura' | 'folhas'>(() => (window.innerWidth < 1024 ? 'leitura' : 'folhas'));
  const [real, setReal] = useState(false);
  const { avisar, el } = useAviso();
  const [linkCliente, setLinkCliente] = useState<string | null>(null);
  const itens = revisarLaudo(laudo, fotos, autor);

  // edição direta na folha A4: cada texto grava no lugar certo
  const editar: Edicao = {
    titulo: (v) => { if (v) void tocarLaudo(laudo.id, { titulo: v }); },
    dado: async (k, v) => { const l = await db.laudos.get(laudo.id); if (l) await tocarLaudo(l.id, { dados: { ...l.dados, [k]: v } }); },
    texto: async (k, v) => { const l = await db.laudos.get(laudo.id); if (l) await tocarLaudo(l.id, { textos: { ...l.textos, [k]: v } }); },
    conclusao: (v) => setConclusao(v),
    legenda: async (fotoId, v) => { const f = await db.fotos.get(fotoId); if (f?.analise) await db.fotos.update(fotoId, { analise: { ...f.analise, legenda: v } }); },
    achado: async (fotoId, achadoId, p) => {
      const f = await db.fotos.get(fotoId);
      if (f?.analise) await db.fotos.update(fotoId, { analise: { ...f.analise, achados: f.analise.achados.map((a) => (a.id === achadoId ? { ...a, ...p } : a)) } });
    },
  };
  const pronto = itens.every((i) => i.ok);

  useEffect(() => {
    if (conclusao === laudo.conclusao) return;
    const t = setTimeout(() => tocarLaudo(laudo.id, { conclusao }), 500);
    return () => clearTimeout(t);
  }, [conclusao]); // eslint-disable-line react-hooks/exhaustive-deps

  const gerar = async () => {
    setGerando(true);
    try { setConclusao(await gerarConclusao(laudo)); avisar('Conclusão escrita. Revise antes de assinar.'); }
    catch (e) { avisar((e as Error).message, 'erro'); setConclusao(conclusaoPadrao(laudo, fotos)); }
    setGerando(false);
  };
  const irItem = (i: ItemRevisao) => {
    if (i.onde === 'laudo') { const c = document.getElementById('conclusao'); c?.scrollIntoView({ behavior: 'smooth', block: 'center' }); c?.focus(); }
    else if (i.onde !== 'perfil') irPara(i.onde);
  };
  const word = async () => { setExportando(true); await exportarWord(doc.current!, laudo.titulo.replace(/[\\/:*?"<>|]/g, '')); setExportando(false); };
  const concluir = async () => { await tocarLaudo(laudo.id, { status: 'concluido' }); avisar('Laudo concluído!'); };

  const Entregar = ({ className }: { className?: string }) => (
    <Cartao className={cx('grid gap-2 p-4', className)}>
      <h2 className="flex items-center gap-1.5 text-lg font-bold">Entregar<Dica texto={<>PDF: abre a impressão; escolha <b>Salvar como PDF</b>. No celular: Compartilhar › Imprimir › Salvar PDF.<br />Word: um .doc para ajustes finais no Office.</>} /></h2>
      <button onClick={() => window.print()} className="pilula pilula-obra"><Printer className="size-5" />Baixar PDF / imprimir</button>
      <Botao variante="claro" carregando={exportando} onClick={word}><FileDown className="size-4" />Baixar Word (.doc)</Botao>
      {laudo.status !== 'concluido'
        ? <div className="flex items-center gap-1"><Botao variante="tinta" className="flex-1" disabled={!pronto} onClick={concluir}><CheckCircle2 className="size-4" />Marcar como concluído</Botao><Dica texto="Muda o status para Concluído no painel. Você ainda pode editar depois, se precisar." /></div>
        : <p className="rounded-xl bg-ok-suave p-3 text-center text-sm font-bold text-ok-texto">Laudo concluído</p>}
      {!pronto && laudo.status !== 'concluido' && <p className="text-center text-xs text-texto3">Resolva o que falta para concluir.</p>}
      <LinkCliente laudoId={laudo.id} avisar={avisar} link={linkCliente} setLink={setLinkCliente} />
      <Autenticidade laudo={laudo} avisar={avisar} />
      <RespostasDoCliente laudo={laudo} fotos={fotos} />
    </Cartao>
  );

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-3 py-4 sm:px-4 md:px-8 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <Prontidao className="nao-imprimir mb-4 xl:hidden" itens={itens} aoIr={irItem} />

        <div className="nao-imprimir mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xl font-extrabold">Seu laudo<Dica texto={<><b>Leitura</b>: o laudo organizado para ler no celular, com filtros nas fotos.<br /><b>A4</b>: o documento oficial, igual ao PDF. Nele você pode tocar em qualquer texto e editar.</>} /></h2>
          <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-borda bg-sup p-1" role="tablist" aria-label="Como ver o laudo">
            {([['leitura', 'Leitura', BookOpen], ['folhas', 'Editar A4', FileText]] as const).map(([m, t, Ic]) => (
              <button key={m} role="tab" aria-selected={modo === m} onClick={() => setModo(m)}
                className={cx('flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-extrabold transition', modo === m ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'text-texto2 hover:bg-sup2')}>
                <Ic className="size-4" />{t}
              </button>
            ))}
          </div>
        </div>

        {modo === 'leitura' && <div className="nao-imprimir"><Leitura laudo={{ ...laudo, conclusao }} fotos={fotos} autor={autor} semConclusao aoConferir={(id) => irPara('conferir', id)} /></div>}
        {modo === 'leitura' && (
          <button onClick={() => setModo('folhas')} className="nao-imprimir mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-obra/40 bg-obra-suave p-3 text-left text-sm text-obra-texto">
            <Pencil className="size-4 shrink-0" /><span className="flex-1"><b>Quer mudar algum texto?</b> Abra o A4 e edite direto no documento.</span>
          </button>
        )}
        {modo === 'folhas' && (
          <div className="nao-imprimir mb-3 flex items-center gap-2.5 rounded-2xl border border-obra/40 bg-obra-suave p-3 text-sm text-obra-texto">
            <Pencil className="size-4 shrink-0" />
            <span className="flex-1"><b>Toque em qualquer texto marcado</b> e escreva. Salva sozinho. <span className="opacity-80">Esc desfaz.</span></span>
            <button onClick={() => setReal(!real)} className="flex shrink-0 items-center gap-1 rounded-lg bg-sup px-2 py-1 text-xs font-extrabold text-texto2 md:hidden">
              {real ? <><Minimize2 className="size-3.5" />Caber</> : <><Maximize2 className="size-3.5" />Ampliar</>}
            </button>
          </div>
        )}
        <div className={modo === 'leitura' ? 'hidden print:block' : undefined}>
          <DocumentoAjustado docRef={doc} real={real} editando={modo === 'folhas'}>
            <Documento laudo={{ ...laudo, conclusao }} fotos={fotos} autor={autor} editar={editar} />
          </DocumentoAjustado>
        </div>

        <Cartao className="nao-imprimir mt-4 grid gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-lg font-bold">Conclusão<Dica texto="A Lia escreve usando só os achados que você aceitou, o estado de conservação e os ambientes. Você pode reescrever aqui ou direto na folha A4." /></h3>
            <Botao tam="p" variante="claro" onClick={gerar} carregando={gerando}><Wand2 className="size-4" />{conclusao ? 'Reescrever com a Lia' : 'Escrever com a Lia'}</Botao>
          </div>
          <AreaTexto id="conclusao" rows={7} value={conclusao} onChange={(e) => setConclusao(e.target.value)} placeholder="Toque em “Escrever com a Lia”: ela escreve a partir dos achados que você aceitou. Depois é só ajustar." />
          <p className="flex items-start gap-1.5 text-xs text-texto3"><Sparkles className="mt-0.5 size-3.5 shrink-0" />A responsabilidade técnica é sua: a Lia só sugere o texto.</p>
        </Cartao>

        <PlanoAcao className="nao-imprimir mt-4" laudo={laudo} fotos={fotos} />

        <Entregar className="nao-imprimir mt-4 xl:hidden" />
        <div className="xl:hidden">
          <BarraWizard
            voltar={{ rotulo: 'Conferir', aoClicar: () => irPara('conferir') }}
            principal={{ rotulo: 'Baixar PDF', icone: <Printer className="size-5" />, aoClicar: () => window.print() }}
            nota={pronto ? 'Tudo certo para assinar' : 'Dá para baixar o rascunho; o que falta está no topo'}
          />
        </div>
      </div>

      <aside className="nao-imprimir hidden content-start gap-4 xl:sticky xl:top-36 xl:grid xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto">
        <Prontidao itens={itens} aoIr={irItem} />
        <Entregar />
      </aside>
      {el}
    </div>
  );
}

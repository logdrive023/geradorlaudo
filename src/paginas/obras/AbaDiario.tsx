import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarPlus, Camera, Copy, Lock, LockOpen, MessageCircle, MessageSquareText, Minus, Plus, Printer, Trash2, Users, Wand2 } from 'lucide-react';
import { db, mudarObra } from '../../db/db';
import { CLIMA, resumoSemana, type Clima, type Diario, type FotoObra, type Obra } from '../../dominio/obra';
import { redigirDiario, resumoParaCliente } from '../../ia/obra';
import { prepararFoto } from '../../lib/imagem';
import { AreaTexto, Botao, Cartao, Dica, Entrada, Modal, Vazio, useUrl } from '../../componentes/ui';
import { Indicador, ItemAbre } from '../../componentes/Pecas';
import { cx, dataBR, dataExtenso, hoje, novoId } from '../../lib/util';

const MAX_FOTOS_DIA = 8;

const editar = (obraId: string, diaId: string, fn: (d: Diario) => void) =>
  mudarObra(obraId, (o) => { const d = o.diarios.find((x) => x.id === diaId); if (d) fn(d); });

function Miniatura({ foto, aoTirar }: { foto: FotoObra; aoTirar?: () => void }) {
  const url = useUrl(foto.miniatura);
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-sup2">
      {url && <img src={url} alt="" className="size-full object-cover" />}
      {aoTirar && <button onClick={aoTirar} aria-label="Tirar foto do diário" className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/60 text-white"><Trash2 className="size-3.5" /></button>}
    </div>
  );
}

function FotoA4({ foto }: { foto: FotoObra }) {
  const url = useUrl(foto.imagem);
  return url ? <img src={url} alt="" style={{ width: '100%', height: '55mm', objectFit: 'cover', borderRadius: 4 }} /> : null;
}

/** Folha A4 do diário do dia (sai no PDF). */
function DocumentoRdo({ obra, d, fotos }: { obra: Obra; d: Diario; fotos: FotoObra[] }) {
  const etapas = obra.etapas.filter((e) => d.etapaIds.includes(e.id));
  const total = d.equipe.reduce((s, x) => s + x.qtd, 0);
  return (
    <div className="folha">
      <h1 style={{ fontSize: '18pt', margin: 0 }}>Diário de obra (RDO)</h1>
      <div style={{ height: 4, margin: '3mm 0 5mm', background: 'repeating-linear-gradient(-45deg,#FF8A1F 0 10px,#121A2B 10px 20px)' }} />
      <table><tbody>
        <tr><th style={{ width: '28%' }}>Obra</th><td>{obra.nome}</td></tr>
        <tr><th>Endereço</th><td>{obra.endereco || '—'}</td></tr>
        <tr><th>Cliente</th><td>{obra.cliente || '—'}</td></tr>
        <tr><th>Data</th><td>{dataExtenso(d.data)}</td></tr>
        <tr><th>Clima</th><td>Manhã: {CLIMA[d.clima.manha].nome} · Tarde: {CLIMA[d.clima.tarde].nome}</td></tr>
      </tbody></table>
      <h2 style={{ marginTop: '6mm' }}>Equipe ({total} pessoa{total === 1 ? '' : 's'})</h2>
      {d.equipe.length ? <table><tbody>{d.equipe.map((x, i) => <tr key={i}><td>{x.funcao}</td><td style={{ width: '20%' }}>{x.qtd}</td></tr>)}</tbody></table> : <p>Não informada.</p>}
      {etapas.length > 0 && <><h2 style={{ marginTop: '6mm' }}>Etapas trabalhadas</h2><p>{etapas.map((e) => `${e.nome} (${e.percentual}%)`).join(' · ')}</p></>}
      <h2 style={{ marginTop: '6mm' }}>Atividades executadas</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{d.atividades || '—'}</p>
      <h2 style={{ marginTop: '6mm' }}>Ocorrências</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{d.ocorrencias || 'Sem ocorrências.'}</p>
      {fotos.length > 0 && <>
        <h2 style={{ marginTop: '6mm' }}>Registro fotográfico</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm' }}>{fotos.map((f) => <FotoA4 key={f.id} foto={f} />)}</div>
      </>}
      <div style={{ marginTop: '18mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12mm', textAlign: 'center', fontSize: '9pt' }}>
        <div style={{ borderTop: '1px solid #121A2B', paddingTop: 4 }}>Responsável técnico</div>
        <div style={{ borderTop: '1px solid #121A2B', paddingTop: 4 }}>Contratante / fiscalização</div>
      </div>
    </div>
  );
}

function DiaItem({ obra, d, fotos, aberto, alternar, imprimir, avisar }: { obra: Obra; d: Diario; fotos: FotoObra[]; aberto: boolean; alternar: () => void; imprimir: () => void; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const set = (fn: (x: Diario) => void) => void editar(obra.id, d.id, fn);
  const [txt, setTxt] = useState({ atividades: d.atividades, ocorrencias: d.ocorrencias });
  const [lia, setLia] = useState<'' | 'atividades' | 'ocorrencias'>('');
  const [funcao, setFuncao] = useState('');
  const inp = useRef<HTMLInputElement>(null);
  const total = d.equipe.reduce((s, x) => s + x.qtd, 0);
  const so = d.fechado;

  const escrever = async (campo: 'atividades' | 'ocorrencias') => {
    setLia(campo);
    const ctx = `Obra: ${obra.nome}. Data: ${dataBR(d.data)}. Etapas do dia: ${obra.etapas.filter((e) => d.etapaIds.includes(e.id)).map((e) => e.nome).join(', ') || 'não informadas'}.`;
    const r = await redigirDiario(campo, txt[campo], ctx);
    setTxt((t) => ({ ...t, [campo]: r }));
    set((x) => { x[campo] = r; });
    setLia('');
    avisar('A Lia reescreveu. Confira antes de fechar o dia.');
  };
  const addFotos = async (lista: FileList | null) => {
    const arqs = [...(lista ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, Math.max(0, MAX_FOTOS_DIA - d.fotoIds.length));
    if (!arqs.length) { avisar(`Até ${MAX_FOTOS_DIA} fotos por dia.`, 'erro'); return; }
    const ids: string[] = [];
    for (const a of arqs) {
      try {
        const x = await prepararFoto(a);
        const id = novoId();
        await db.obraFotos.add({ id, obraId: obra.id, imagem: x.imagem, miniatura: x.miniatura, criadoEm: Date.now() });
        ids.push(id);
      } catch { avisar(`Não deu para ler ${a.name}`, 'erro'); }
    }
    set((x) => { x.fotoIds.push(...ids); });
  };
  const tirarFoto = async (id: string) => { set((x) => { x.fotoIds = x.fotoIds.filter((f) => f !== id); }); await db.obraFotos.delete(id); };

  return (
    <ItemAbre aberto={aberto} alternar={alternar} faixa={so ? 'var(--ok)' : 'var(--obra)'} cabeca={
      <span className="grid gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-3">
            <span className="grid w-12 shrink-0 justify-items-center rounded-xl bg-sup2 py-1 leading-none"><b className="font-display text-lg">{d.data.slice(8, 10)}</b><span className="text-[10px] font-bold uppercase text-texto3">{new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></span>
            <span><b className="block text-[15px] first-letter:uppercase">{new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' })}</b><span className="text-sm">{CLIMA[d.clima.manha].emoji} {CLIMA[d.clima.tarde].emoji}</span></span>
          </span>
          <span className={cx('flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold', so ? 'bg-ok-suave text-ok-texto' : 'bg-obra-suave text-obra-texto')}>{so ? <><Lock className="size-3" />Fechado</> : 'Aberto'}</span>
        </span>
        <span className="line-clamp-1 text-sm text-texto2">{d.atividades || 'Sem atividades anotadas'}</span>
        <span className="flex gap-3 text-xs text-texto3"><span className="flex items-center gap-1"><Users className="size-3.5" />{total}</span><span className="flex items-center gap-1"><Camera className="size-3.5" />{d.fotoIds.length}</span>{d.ocorrencias && <span className="font-bold text-medio-texto">com ocorrência</span>}</span>
      </span>
    }>
      <fieldset disabled={so} className="grid gap-3 disabled:opacity-90">
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <label className="grid gap-1 text-xs font-bold text-texto2">Data<Entrada type="date" value={d.data} onChange={(e) => e.target.value && set((x) => { x.data = e.target.value; })} /></label>
          <div className="grid gap-1 text-xs font-bold text-texto2">Clima
            <div className="grid grid-cols-2 gap-2">
              {(['manha', 'tarde'] as const).map((p) => (
                <div key={p} className="flex flex-wrap items-center gap-1">
                  <span className="w-11 text-[11px] text-texto3">{p === 'manha' ? 'Manhã' : 'Tarde'}</span>
                  {(Object.keys(CLIMA) as Clima[]).map((c) => (
                    <button key={c} type="button" title={CLIMA[c].nome} aria-label={`${p === 'manha' ? 'Manhã' : 'Tarde'}: ${CLIMA[c].nome}`} aria-pressed={d.clima[p] === c} onClick={() => set((x) => { x.clima[p] = c; })}
                      className={cx('grid size-8 place-items-center rounded-lg text-base transition', d.clima[p] === c ? 'bg-obra-suave ring-2 ring-obra' : 'bg-sup2 opacity-60 hover:opacity-100')}>{CLIMA[c].emoji}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="flex items-center gap-1 text-xs font-bold text-texto2">Equipe no dia: {total} pessoa{total === 1 ? '' : 's'}</span>
          {d.equipe.map((x, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-bold">{x.funcao}</span>
              <button type="button" aria-label="Menos um" onClick={() => set((y) => { y.equipe[i].qtd = Math.max(0, y.equipe[i].qtd - 1); if (!y.equipe[i].qtd) y.equipe.splice(i, 1); })} className="grid size-7 place-items-center rounded-lg bg-sup"><Minus className="size-3.5" /></button>
              <b className="w-6 text-center">{x.qtd}</b>
              <button type="button" aria-label="Mais um" onClick={() => set((y) => { y.equipe[i].qtd++; })} className="grid size-7 place-items-center rounded-lg bg-sup"><Plus className="size-3.5" /></button>
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!funcao.trim()) return; set((x) => { const j = x.equipe.find((y) => y.funcao.toLowerCase() === funcao.trim().toLowerCase()); if (j) j.qtd++; else x.equipe.push({ funcao: funcao.trim(), qtd: 1 }); }); setFuncao(''); }}>
            <Entrada list="funcoes" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Função (pedreiro, servente…)" />
            <datalist id="funcoes">{['Pedreiro', 'Servente', 'Carpinteiro', 'Armador', 'Eletricista', 'Encanador', 'Pintor', 'Mestre de obras', 'Engenheiro'].map((f) => <option key={f} value={f} />)}</datalist>
            <Botao type="submit" variante="claro" aria-label="Pôr na equipe"><Plus className="size-4" /></Botao>
          </form>
        </div>

        {obra.etapas.length > 0 && (
          <div className="grid gap-1.5">
            <span className="text-xs font-bold text-texto2">Etapas trabalhadas</span>
            <div className="flex flex-wrap gap-1.5">
              {obra.etapas.map((e) => {
                const on = d.etapaIds.includes(e.id);
                return <button key={e.id} type="button" aria-pressed={on} onClick={() => set((x) => { x.etapaIds = on ? x.etapaIds.filter((y) => y !== e.id) : [...x.etapaIds, e.id]; })}
                  className={cx('h-8 rounded-full px-3 text-xs font-bold transition', on ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup2 text-texto2')}>{e.nome}</button>;
              })}
            </div>
          </div>
        )}

        {(['atividades', 'ocorrencias'] as const).map((campo) => (
          <div key={campo} className="grid gap-1">
            <span className="flex items-center justify-between gap-2 text-xs font-bold text-texto2">
              <span className="flex items-center gap-1">{campo === 'atividades' ? 'Atividades executadas' : 'Ocorrências'}{campo === 'ocorrencias' && <Dica texto="Chuva que parou a obra, falta de material, acidente, visita do cliente, ordem de serviço… o que precisa ficar registrado." />}</span>
              <button type="button" onClick={() => void escrever(campo)} disabled={!txt[campo].trim() || !!lia} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold text-tinta hover:bg-sup2 disabled:opacity-40"><Wand2 className="size-3.5" />{lia === campo ? 'Escrevendo…' : 'Lia escreve'}</button>
            </span>
            <AreaTexto rows={3} value={txt[campo]} onChange={(e) => setTxt({ ...txt, [campo]: e.target.value })} onBlur={() => txt[campo] !== d[campo] && set((x) => { x[campo] = txt[campo]; })}
              placeholder={campo === 'atividades' ? 'Anote rápido: "concretagem laje 2o pav, 8m3"; a Lia passa a limpo.' : 'Ex.: chuva 14h, paralisação de 1h.'} />
          </div>
        ))}

        <div className="grid gap-1.5">
          <span className="text-xs font-bold text-texto2">Fotos do dia ({d.fotoIds.length}/{MAX_FOTOS_DIA})</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {fotos.map((f) => <Miniatura key={f.id} foto={f} aoTirar={so ? undefined : () => void tirarFoto(f.id)} />)}
            {!so && d.fotoIds.length < MAX_FOTOS_DIA && (
              <button type="button" onClick={() => inp.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-borda-forte text-texto3 hover:border-obra hover:text-obra-texto" aria-label="Pôr fotos"><Camera className="size-6" /></button>
            )}
          </div>
          <input ref={inp} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFotos(e.target.files); e.target.value = ''; }} />
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 border-t border-borda pt-3">
        <Botao tam="p" variante={so ? 'claro' : 'tinta'} onClick={() => set((x) => { x.fechado = !x.fechado; })}>{so ? <><LockOpen className="size-4" />Reabrir o dia</> : <><Lock className="size-4" />Fechar o dia</>}</Botao>
        <Botao tam="p" variante="claro" onClick={imprimir}><Printer className="size-4" />PDF do dia</Botao>
        {!so && <Botao tam="p" variante="fantasma" className="ml-auto text-critico-texto" onClick={() => { void mudarObra(obra.id, (o) => { o.diarios = o.diarios.filter((x) => x.id !== d.id); }); void db.obraFotos.bulkDelete(d.fotoIds); }}><Trash2 className="size-4" />Apagar dia</Botao>}
      </div>
    </ItemAbre>
  );
}

/** Diário de obra (RDO): um registro por dia, com clima, equipe, atividades, ocorrências e fotos. */
export function AbaDiario({ obra, avisar }: { obra: Obra; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [imprimindo, setImprimindo] = useState<string | null>(null);
  const [resumo, setResumo] = useState<string | null>(null);
  const [melhorando, setMelhorando] = useState(false);
  const fotos = useLiveQuery(() => db.obraFotos.where('obraId').equals(obra.id).toArray(), [obra.id], []);
  const porId = new Map(fotos.map((f) => [f.id, f]));
  const dias = [...obra.diarios].sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm - a.criadoEm);
  const temHoje = obra.diarios.some((d) => d.data === hoje());

  const novo = () => {
    const id = novoId();
    const ultimo = dias[0];
    void mudarObra(obra.id, (o) => {
      o.diarios.push({ id, data: hoje(), clima: { manha: 'sol', tarde: 'sol' }, equipe: ultimo ? ultimo.equipe.map((x) => ({ ...x })) : [], atividades: '', ocorrencias: '', etapaIds: ultimo ? [...ultimo.etapaIds] : [], fotoIds: [], fechado: false, criadoEm: Date.now() });
    });
    setAberto(id);
  };
  const imprimir = (id: string) => { setImprimindo(id); setTimeout(() => { window.print(); }, 300); };
  const dPrint = dias.find((d) => d.id === imprimindo);

  return (
    <div className="grid gap-4">
      <Cartao className="nao-imprimir grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Diário de obra</h2>
            <p className="text-sm text-texto2">{dias.length ? 'O registro do dia a dia da obra, com prova em foto.' : 'Registre o dia: clima, equipe, o que foi feito e as fotos.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dias.length > 0 && <Botao variante="claro" onClick={() => setResumo(resumoSemana(obra))}><MessageSquareText className="size-4" />Resumo da semana</Botao>}
            <Botao variante="obra" onClick={novo}><CalendarPlus className="size-4" />{temHoje ? 'Outro registro hoje' : 'Registrar hoje'}</Botao>
          </div>
        </div>
        {dias.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Indicador ic={CalendarPlus} valor={dias.length} rotulo="dias registrados" />
            <Indicador ic={Users} valor={dias.reduce((s, d) => s + d.equipe.reduce((x, e) => x + e.qtd, 0), 0)} rotulo="pessoas-dia" dica="Soma da equipe de todos os dias: mede o esforço na obra." />
            <Indicador ic={Camera} valor={dias.reduce((s, d) => s + d.fotoIds.length, 0)} rotulo="fotos" />
            <Indicador valor={dias.filter((d) => [d.clima.manha, d.clima.tarde].some((c) => c === 'chuva' || c === 'impraticavel')).length} rotulo="dias com chuva" tom="medio" dica="Dias com chuva ou impraticáveis ajudam a justificar o prazo." />
          </div>
        )}
      </Cartao>
      {dias.length === 0 ? (
        <div className="nao-imprimir"><Vazio icone={<CalendarPlus className="size-7" />} titulo="Nenhum dia registrado" texto="O diário vira prova do que aconteceu na obra. Dica: a equipe e as etapas do último dia já vêm preenchidas no próximo." /></div>
      ) : (
        <ul className="nao-imprimir grid gap-2">
          {dias.map((d) => <DiaItem key={d.id} obra={obra} d={d} fotos={d.fotoIds.map((id) => porId.get(id)).filter(Boolean) as FotoObra[]}
            aberto={aberto === d.id} alternar={() => setAberto(aberto === d.id ? null : d.id)} imprimir={() => imprimir(d.id)} avisar={avisar} />)}
        </ul>
      )}
      {dPrint && <div className="hidden print:block"><DocumentoRdo obra={obra} d={dPrint} fotos={dPrint.fotoIds.map((id) => porId.get(id)).filter(Boolean) as FotoObra[]} /></div>}
      <Modal aberto={resumo != null} aoFechar={() => setResumo(null)} titulo="Resumo da semana para o cliente">
        <div className="grid gap-3">
          <p className="text-sm text-texto2">Montado com o que foi registrado no diário dos últimos 7 dias. Edite à vontade antes de mandar.</p>
          <AreaTexto rows={12} value={resumo ?? ''} onChange={(e) => setResumo(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Botao variante="claro" carregando={melhorando} onClick={async () => { setMelhorando(true); setResumo(await resumoParaCliente(resumo ?? '')); setMelhorando(false); }}><Wand2 className="size-4" />Lia deixa mais amigável</Botao>
            <Botao variante="claro" onClick={() => { void navigator.clipboard.writeText(resumo ?? ''); avisar('Resumo copiado'); }}><Copy className="size-4" />Copiar</Botao>
            <a className="pilula pilula-obra" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(resumo ?? '')}`}><MessageCircle className="size-4" />Mandar no WhatsApp</a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

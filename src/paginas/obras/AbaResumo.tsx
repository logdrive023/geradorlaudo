import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, BookOpenText, CalendarDays, CalendarRange, ChevronRight, FileText, Pencil, Plus, ShoppingCart, Unlink, Wallet } from 'lucide-react';
import { db, mudarObra } from '../../db/db';
import { CLIMA, REGIME, TIPO_OBRA, prazoObra, resumoObra, situacaoEtapa, type Obra } from '../../dominio/obra';
import { NIVEL_ETAPA } from '../../dominio/etapas';
import { reais } from '../../dominio/plano';
import { STATUS_LAUDO } from '../../dominio/modelo';
import { criarLinkObra, desligarLinkObra, logadoNaNuvem } from '../../db/nuvem';
import { AreaTexto, Botao, Cartao, Dica, Modal } from '../../componentes/ui';
import { Anel, Escolha, Indicador, LinkPublico, Rotulado } from '../../componentes/Pecas';
import { cx, dataBR } from '../../lib/util';
import { CamposObra, ICONE_OBRA, type ValoresObra } from './CamposObra';
import type { AbaObra } from './ObraTela';

/** Editar a ficha da obra (mesmos campos de "Nova obra"). */
function EditarFicha({ obra, aberto, aoFechar }: { obra: Obra; aberto: boolean; aoFechar: () => void }) {
  const [v, setV] = useState<ValoresObra>(() => ({ nome: obra.nome, endereco: obra.endereco, cliente: obra.cliente, inicio: obra.inicio, fim: obra.fim, tipo: obra.tipo, regime: obra.regime, area: obra.area, orcamentoPrevisto: obra.orcamentoPrevisto, clienteTelefone: obra.clienteTelefone, clienteEmail: obra.clienteEmail, art: obra.art, alvara: obra.alvara }));
  const salvar = async () => {
    if (!v.nome.trim()) return;
    await mudarObra(obra.id, (o) => { Object.assign(o, { ...v, nome: v.nome.trim(), endereco: v.endereco.trim(), cliente: v.cliente.trim(), inicio: v.inicio || undefined, fim: v.fim || undefined }); });
    aoFechar();
  };
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} largura="max-w-xl" titulo="Ficha da obra">
      <div className="grid gap-4">
        <CamposObra v={v} set={(p) => setV({ ...v, ...p })} />
        <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 bg-sup px-1 pt-2">
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="obra" onClick={salvar}>Salvar</Botao>
        </div>
      </div>
    </Modal>
  );
}

/** Resumo: avanço, prazo, dinheiro, diário, próximas etapas, laudos, ficha, link e notas. */
export function AbaResumo({ obra, irPara, avisar }: { obra: Obra; irPara: (a: AbaObra) => void; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const r = resumoObra(obra);
  const p = prazoObra(obra);
  const laudos = useLiveQuery(() => db.laudos.toArray(), [], []);
  const ligados = laudos.filter((l) => obra.laudoIds.includes(l.id));
  const livres = laudos.filter((l) => !obra.laudoIds.includes(l.id));
  const [link, setLink] = useState<string | null>(null);
  const [comFin, setComFin] = useState(false);
  const [notas, setNotas] = useState(obra.notasInternas ?? '');
  const [ficha, setFicha] = useState(false);
  const usoOrc = r.fin.orcado > 0 ? Math.round((r.fin.realizado / r.fin.orcado) * 100) : null;
  const proximas = obra.etapas.filter((e) => e.percentual < 100).slice(0, 4);
  const atrasada = r.desvio != null && r.desvio < -5;
  const TipoIc = obra.tipo ? ICONE_OBRA[obra.tipo] : null;
  const ud = r.ultimoDiario;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid content-start gap-4">
        {/* avanço: anel + explicação + prazo */}
        <Cartao className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <Anel pct={r.fisico} previsto={r.previsto} tam={112}>
              <span><b className="block font-display text-3xl font-extrabold leading-none">{r.fisico}%</b><span className="text-[10px] font-bold uppercase tracking-wider text-texto3">feito</span></span>
            </Anel>
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 text-lg font-bold">Avanço da obra<Dica texto="Média da medição das etapas (ponderada pelo orçado). O laranja enche conforme a obra anda; a bolinha branca é onde ela deveria estar hoje pelo cronograma." /></h2>
              <p className={cx('mt-1 text-sm font-bold', atrasada ? 'text-critico-texto' : 'text-ok-texto')}>
                {r.previsto == null ? <span className="font-normal text-texto2">Ponha datas nas etapas para comparar com o planejado.</span>
                  : atrasada ? `Atrasada ${-r.desvio!} pontos` : 'No ritmo do cronograma'}
              </p>
              {r.previsto != null && <p className="text-xs text-texto2">Previsto para hoje: <b className="text-texto">{r.previsto}%</b></p>}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-texto3">
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-obra" />feito</span>
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#121A2B] dark:bg-white/40" />falta</span>
                {r.previsto != null && <span className="flex items-center gap-1"><span className="size-2.5 rounded-full border-2 border-[#121A2B] bg-white" />previsto hoje</span>}
              </div>
            </div>
          </div>
          {p && (
            <div className="grid gap-1.5 rounded-2xl bg-sup2 p-3">
              <div className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-1 text-texto2"><CalendarDays className="size-3.5" />Prazo</span><span>{p.passados} de {p.total} dias</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-sup"><div className={cx('h-full rounded-full', p.restantes < 0 ? 'bg-critico' : 'bg-tinta')} style={{ width: `${Math.min(100, p.pct)}%` }} /></div>
              <div className="flex justify-between text-[11px] text-texto3"><span>{dataBR(obra.inicio)}</span><span className={cx('font-bold', p.restantes < 0 ? 'text-critico-texto' : 'text-texto2')}>{p.restantes >= 0 ? `faltam ${p.restantes} dias` : `${-p.restantes} dias além do prazo`}</span><span>{dataBR(obra.fim)}</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Indicador ic={AlarmClock} valor={r.atrasadas} rotulo="etapas atrasadas" tom={r.atrasadas ? 'critico' : 'ok'} />
            <Indicador ic={CalendarRange} valor={`${obra.etapas.filter((e) => e.percentual >= 100).length}/${obra.etapas.length}`} rotulo="etapas concluídas" />
            <Indicador ic={BookOpenText} valor={r.diarios} rotulo="dias no diário" />
            <Indicador ic={ShoppingCart} valor={r.comprasAbertas} rotulo="compras abertas" tom={r.comprasAbertas ? 'obra' : 'neutro'} />
          </div>
        </Cartao>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* dinheiro */}
          <button onClick={() => irPara('financeiro')} className="group grid gap-2 rounded-[22px] border border-borda bg-sup p-4 text-left transition hover:border-obra">
            <span className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm font-bold text-texto2"><Wallet className="size-4 text-obra" />Orçado × gasto</span><ChevronRight className="size-4 text-texto3 transition group-hover:translate-x-0.5" /></span>
            <span className="font-display text-2xl font-extrabold leading-none">{reais(r.fin.realizado)}</span>
            {usoOrc != null ? <>
              <div className="h-2 overflow-hidden rounded-full bg-sup2"><div className={cx('h-full rounded-full', usoOrc > 100 ? 'bg-critico' : 'bg-obra')} style={{ width: `${Math.min(100, usoOrc)}%` }} /></div>
              <span className="text-xs text-texto2"><b className={usoOrc > 100 ? 'text-critico-texto' : 'text-texto'}>{usoOrc}%</b> de {reais(r.fin.orcado)}{r.fin.aPagar > 0 && <> · <b className="text-medio-texto">{reais(r.fin.aPagar)} a pagar</b></>}</span>
            </> : <span className="text-xs text-texto2">Ponha o orçamento na ficha ou nas etapas para acompanhar.</span>}
          </button>
          {/* último diário */}
          <button onClick={() => irPara('diario')} className="group grid gap-2 rounded-[22px] border border-borda bg-sup p-4 text-left transition hover:border-obra">
            <span className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm font-bold text-texto2"><BookOpenText className="size-4 text-obra" />Último diário</span><ChevronRight className="size-4 text-texto3 transition group-hover:translate-x-0.5" /></span>
            {ud ? (
              <span className="flex items-center gap-3">
                <span className="grid w-14 shrink-0 justify-items-center rounded-xl bg-sup2 py-1.5 leading-none"><b className="font-display text-xl">{ud.data.slice(8, 10)}</b><span className="text-[10px] font-bold uppercase text-texto3">{new Date(`${ud.data}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></span>
                <span className="min-w-0"><span className="text-lg">{CLIMA[ud.clima.manha].emoji} {CLIMA[ud.clima.tarde].emoji}</span><span className="line-clamp-2 block text-xs text-texto2">{ud.atividades || ud.ocorrencias || 'Sem atividades anotadas.'}</span></span>
              </span>
            ) : <span className="flex items-center gap-2 text-sm text-texto2"><Plus className="size-4 text-obra" />Registrar o dia de hoje</span>}
          </button>
        </div>

        {/* próximas etapas */}
        {proximas.length > 0 && (
          <Cartao className="grid gap-2 p-4">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-1.5 text-lg font-bold"><CalendarRange className="size-5 text-obra" />Próximas etapas</h2><button onClick={() => irPara('cronograma')} className="text-xs font-extrabold text-tinta hover:underline">Ver cronograma</button></div>
            <ul className="grid gap-1.5">
              {proximas.map((e) => {
                const at = situacaoEtapa(e) === 'atrasada';
                return (
                  <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-xl bg-sup2 px-3 py-2">
                    <span className="size-2.5 rounded-full" style={{ background: e.nivel ? NIVEL_ETAPA[e.nivel].cor : 'var(--borda-forte)' }} title={e.nivel ? NIVEL_ETAPA[e.nivel].nome : undefined} />
                    <span className="min-w-0"><b className="block truncate text-sm">{e.nome}</b><span className={cx('text-[11px]', at ? 'font-bold text-critico-texto' : 'text-texto3')}>{e.fimPrev ? `${at ? 'atrasada · ' : ''}até ${dataBR(e.fimPrev)}` : 'sem data'}</span></span>
                    <span className="flex items-center gap-2"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-sup"><span className="block h-full rounded-full bg-obra" style={{ width: `${e.percentual}%` }} /></span><b className="w-9 text-right text-xs">{e.percentual}%</b></span>
                  </li>
                );
              })}
            </ul>
          </Cartao>
        )}

        {/* laudos */}
        <Cartao className="grid gap-3 p-4">
          <h2 className="flex items-center gap-1.5 text-lg font-bold"><FileText className="size-5 text-obra" />Laudos desta obra</h2>
          {ligados.length > 0 ? (
            <ul className="grid gap-2">{ligados.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-2xl bg-sup2 p-3">
                <Link to={`/laudo/${l.id}`} className="min-w-0 flex-1"><b className="block truncate">{l.titulo}</b><span className="text-xs text-texto2">{STATUS_LAUDO[l.status]}</span></Link>
                <button aria-label="Desligar laudo da obra" title="Desligar da obra" onClick={() => void mudarObra(obra.id, (o) => { o.laudoIds = o.laudoIds.filter((x) => x !== l.id); })} className="grid size-9 place-items-center rounded-lg text-texto3 hover:bg-sup hover:text-texto"><Unlink className="size-4" /></button>
                <Link to={`/laudo/${l.id}`} aria-label="Abrir laudo"><ChevronRight className="size-4 text-texto3" /></Link>
              </li>
            ))}</ul>
          ) : <p className="text-sm text-texto2">Ligue vistorias e laudos (cautelar, entrega, inspeção) feitos nesta obra.</p>}
          {livres.length > 0 && (
            <Escolha aria-label="Ligar laudo à obra" valor="" vazio="+ Ligar um laudo existente…" aoMudar={(id) => id && void mudarObra(obra.id, (o) => { o.laudoIds = [...o.laudoIds, id]; })}
              opcoes={livres.map((l) => ({ v: l.id, r: l.titulo }))} />
          )}
        </Cartao>
      </div>

      <aside className="grid content-start gap-4">
        {/* ações rápidas em blocos */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { a: 'diario' as const, ic: BookOpenText, t: 'Registrar o dia' },
            { a: 'cronograma' as const, ic: CalendarRange, t: 'Medir etapas' },
            { a: 'compras' as const, ic: ShoppingCart, t: 'Pedir material' },
          ].map(({ a, ic: Ic, t }) => (
            <button key={a} onClick={() => irPara(a)} className="grid justify-items-center gap-1.5 rounded-2xl border border-borda bg-sup px-2 py-3 text-center text-xs font-extrabold transition hover:border-obra hover:bg-obra-suave">
              <span className="grid size-10 place-items-center rounded-xl bg-obra text-[#121A2B]"><Ic className="size-5" /></span>{t}
            </button>
          ))}
        </div>

        {/* ficha */}
        <Cartao className="grid gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-lg font-bold">{TipoIc && <TipoIc className="size-5 text-obra" />}Ficha da obra</h2>
            <Botao tam="p" variante="claro" onClick={() => setFicha(true)}><Pencil className="size-4" />Editar</Botao>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Rotulado rotulo="Tipo">{obra.tipo ? TIPO_OBRA[obra.tipo].nome : '—'}</Rotulado>
            <Rotulado rotulo="Área">{obra.area ? `${obra.area.toLocaleString('pt-BR')} m²` : '—'}</Rotulado>
            <Rotulado rotulo="Orçamento" inteiro>{obra.orcamentoPrevisto ? reais(obra.orcamentoPrevisto) : '—'}</Rotulado>
            <Rotulado rotulo="Custo / m²">{obra.area && obra.orcamentoPrevisto ? reais(obra.orcamentoPrevisto / obra.area) : '—'}</Rotulado>
            <Rotulado rotulo="ART / RRT">{obra.art || '—'}</Rotulado>
            <Rotulado rotulo="Alvará">{obra.alvara || '—'}</Rotulado>
          </div>
          {obra.regime && <p className="text-xs text-texto2">Regime: <b className="text-texto">{REGIME[obra.regime]}</b></p>}
          {(obra.cliente || obra.clienteTelefone) && <p className="rounded-xl bg-sup2 px-3 py-2 text-xs text-texto2">Cliente: <b className="text-texto">{obra.cliente || '—'}</b>{obra.clienteTelefone && <> · {obra.clienteTelefone}</>}{obra.clienteEmail && <> · {obra.clienteEmail}</>}</p>}
        </Cartao>

        {logadoNaNuvem() && (
          <LinkPublico titulo="Link do cliente" textoCompartilhar={`Acompanhe a obra ${obra.nome}:`} link={link} setLink={setLink} avisar={avisar}
            dica="O cliente acompanha avanço, cronograma e diário com fotos, sem conta. O financeiro só aparece se você liberar."
            extra={!link && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={comFin} onChange={(e) => setComFin(e.target.checked)} className="size-4 accent-[var(--obra)]" />Mostrar financeiro e compras ao cliente</label>}
            gerar={() => criarLinkObra(obra.id, comFin)} desligar={() => desligarLinkObra(obra.id)} />
        )}

        <Cartao className="grid gap-2 p-4">
          <h2 className="flex items-center gap-1.5 text-lg font-bold">Notas internas<Dica texto="Só você vê. Nunca aparecem no link do cliente." /></h2>
          <AreaTexto rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} onBlur={() => notas !== (obra.notasInternas ?? '') && void mudarObra(obra.id, (o) => { o.notasInternas = notas; })} placeholder="Combinações, telefones, lembretes…" />
          <p className="text-xs text-texto3">Salva ao sair do campo.</p>
        </Cartao>
      </aside>
      {ficha && <EditarFicha obra={obra} aberto={ficha} aoFechar={() => setFicha(false)} />}
    </div>
  );
}

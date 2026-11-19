import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpenText, CalendarDays, ChevronRight, FileText, Plus, ShoppingCart, Unlink } from 'lucide-react';
import { db, mudarObra } from '../../db/db';
import { CLIMA, prazoObra, resumoObra, type Obra } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { STATUS_LAUDO } from '../../dominio/modelo';
import { criarLinkObra, desligarLinkObra, logadoNaNuvem } from '../../db/nuvem';
import { AreaTexto, Cartao, Dica, Selo } from '../../componentes/ui';
import { BarraDupla, Escolha, Indicador, LinkPublico } from '../../componentes/Pecas';
import { cx, dataBR } from '../../lib/util';
import type { AbaObra } from './ObraTela';

/** Resumo: avanço, prazo, dinheiro, último diário, laudos ligados, link do cliente e notas internas. */
export function AbaResumo({ obra, irPara, avisar }: { obra: Obra; irPara: (a: AbaObra) => void; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const r = resumoObra(obra);
  const p = prazoObra(obra);
  const laudos = useLiveQuery(() => db.laudos.toArray(), [], []);
  const ligados = laudos.filter((l) => obra.laudoIds.includes(l.id));
  const livres = laudos.filter((l) => !obra.laudoIds.includes(l.id));
  const [link, setLink] = useState<string | null>(null);
  const [comFin, setComFin] = useState(false);
  const [notas, setNotas] = useState(obra.notasInternas ?? '');

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid content-start gap-4">
        <Cartao className="grid gap-3 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-lg font-bold">Avanço da obra<Dica texto="Físico: média da medição das etapas, ponderada pelo orçado de cada uma. A marca preta mostra onde a obra deveria estar hoje pelo cronograma." /></h2>
            <span className="font-display text-3xl font-extrabold">{r.fisico}%</span>
          </div>
          <BarraDupla real={r.fisico} previsto={r.previsto} />
          <p className="text-sm text-texto2">
            {r.previsto == null ? 'Coloque datas previstas nas etapas para comparar com o planejado.'
              : r.desvio! >= -5 ? <>No ritmo: previsto <b>{r.previsto}%</b> para hoje.</>
                : <span className="font-bold text-critico-texto">Atrasada: deveria estar em {r.previsto}% ({-r.desvio!} pontos abaixo).</span>}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Indicador valor={p ? (p.restantes >= 0 ? p.restantes : `+${-p.restantes}`) : '—'} rotulo={p && p.restantes < 0 ? 'dias de atraso' : 'dias para o fim'} tom={p && p.restantes < 0 ? 'critico' : 'neutro'} />
            <Indicador valor={r.atrasadas} rotulo="etapas atrasadas" tom={r.atrasadas ? 'critico' : 'ok'} />
            <Indicador valor={r.diarios} rotulo="diários" />
            <Indicador valor={r.comprasAbertas} rotulo="compras abertas" tom={r.comprasAbertas ? 'obra' : 'neutro'} />
          </div>
          {p && <p className="flex items-center gap-1.5 text-xs text-texto3"><CalendarDays className="size-3.5" />{dataBR(obra.inicio)} → {dataBR(obra.fim)} · {p.passados} de {p.total} dias</p>}
        </Cartao>

        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => irPara('financeiro')} className="grid gap-1 rounded-[22px] border border-borda bg-sup p-4 text-left transition hover:border-obra">
            <span className="text-sm font-bold text-texto2">Orçado × realizado</span>
            <span className="font-display text-2xl font-extrabold">{reais(r.fin.realizado)}</span>
            <span className="text-sm text-texto2">de {reais(r.fin.orcado)} orçados{r.fin.aPagar > 0 && <> · <b className="text-medio-texto">{reais(r.fin.aPagar)} a pagar</b></>}</span>
          </button>
          <button onClick={() => irPara('diario')} className="grid gap-1 rounded-[22px] border border-borda bg-sup p-4 text-left transition hover:border-obra">
            <span className="flex items-center gap-1.5 text-sm font-bold text-texto2"><BookOpenText className="size-4" />Último diário</span>
            {r.ultimoDiario ? <>
              <span className="font-display text-2xl font-extrabold">{dataBR(r.ultimoDiario.data)} {CLIMA[r.ultimoDiario.clima.manha].emoji}</span>
              <span className="line-clamp-2 text-sm text-texto2">{r.ultimoDiario.atividades || r.ultimoDiario.ocorrencias || 'Sem atividades anotadas.'}</span>
            </> : <span className="text-sm text-texto2">Nenhum ainda. Toque para registrar o dia de hoje.</span>}
          </button>
        </div>

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
          ) : <p className="text-sm text-texto2">Ligue vistorias, laudo cautelar, de entrega ou inspeções feitas nesta obra.</p>}
          {livres.length > 0 && (
            <Escolha aria-label="Ligar laudo à obra" valor="" vazio="+ Ligar um laudo existente…" aoMudar={(id) => id && void mudarObra(obra.id, (o) => { o.laudoIds = [...o.laudoIds, id]; })}
              opcoes={livres.map((l) => ({ v: l.id, r: l.titulo }))} />
          )}
        </Cartao>
      </div>

      <aside className="grid content-start gap-4">
        <Cartao className="grid gap-3 p-4">
          <h2 className="text-lg font-bold">Ações rápidas</h2>
          {[
            { a: 'diario' as const, ic: Plus, t: 'Registrar o dia (diário)' },
            { a: 'cronograma' as const, ic: CalendarDays, t: 'Atualizar medição das etapas' },
            { a: 'compras' as const, ic: ShoppingCart, t: 'Pedir material / cotar' },
          ].map(({ a, ic: Ic, t }) => (
            <button key={a} onClick={() => irPara(a)} className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2.5 text-left text-sm font-bold hover:bg-obra-suave"><Ic className="size-4 text-obra" />{t}<ChevronRight className="ml-auto size-4 text-texto3" /></button>
          ))}
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
          <p className={cx('text-xs text-texto3')}>Salva ao sair do campo.</p>
        </Cartao>
        {obra.status === 'concluida' && <Selo tom="ok">Obra concluída</Selo>}
      </aside>
    </div>
  );
}

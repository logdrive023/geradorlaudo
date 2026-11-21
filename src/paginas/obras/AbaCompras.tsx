import { useState } from 'react';
import { Check, Plus, ShoppingCart, Trash2, Trophy } from 'lucide-react';
import { mudarObra } from '../../db/db';
import { FLUXO_COMPRA, STATUS_COMPRA, melhorCotacao, type Compra, type Obra, type StatusCompra } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { Botao, Cartao, Entrada, Selo, Vazio } from '../../componentes/ui';
import { EntradaReais, Escolha, ItemAbre } from '../../componentes/Pecas';
import { cx, dataBR, hoje, novoId } from '../../lib/util';

const editar = (obraId: string, compraId: string, fn: (c: Compra, o: Obra) => void) =>
  mudarObra(obraId, (o) => { const c = o.compras.find((x) => x.id === compraId); if (c) fn(c, o); });

/** Ao marcar como comprada, a compra vira despesa no financeiro (uma vez só). */
function registrarDespesa(c: Compra, o: Obra) {
  const escolhida = c.cotacoes.find((x) => x.id === c.escolhida) ?? melhorCotacao(c);
  if (!escolhida || c.lancamentoId) return;
  const id = novoId();
  o.lancamentos.push({ id, data: hoje(), descricao: `${c.quantidade} ${c.unidade} ${c.item} — ${escolhida.fornecedor}`, valor: escolhida.valor, tipo: 'despesa', categoria: 'material', etapaId: c.etapaId, pago: false });
  c.lancamentoId = id;
}

const despesaPaga = (o: Obra, c: Compra) => !!o.lancamentos.find((l) => l.id === c.lancamentoId)?.pago;

/** Compra cancelada ou apagada: a despesa "a pagar" que ela gerou sai do financeiro (a já paga fica: o dinheiro saiu). */
function tirarDespesa(c: Compra, o: Obra) {
  if (!c.lancamentoId) return;
  const l = o.lancamentos.find((x) => x.id === c.lancamentoId);
  if (l && !l.pago) { o.lancamentos = o.lancamentos.filter((x) => x.id !== l.id); c.lancamentoId = undefined; }
}

function CompraItem({ obra, c, aberto, alternar, avisar }: { obra: Obra; c: Compra; aberto: boolean; alternar: () => void; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const [cot, setCot] = useState<{ fornecedor: string; valor?: number; prazo: string }>({ fornecedor: '', prazo: '' });
  const set = (fn: (x: Compra, o: Obra) => void) => void editar(obra.id, c.id, fn);
  const melhor = melhorCotacao(c);
  const escolhida = c.cotacoes.find((x) => x.id === c.escolhida);
  const etapa = obra.etapas.find((e) => e.id === c.etapaId);
  const i = FLUXO_COMPRA.indexOf(c.status);

  const mudarStatus = (s: StatusCompra) => {
    if ((s === 'aprovada' || s === 'comprada' || s === 'entregue') && !c.cotacoes.length) { avisar('Ponha pelo menos uma cotação (fornecedor e valor) antes.', 'erro'); return; }
    set((x, o) => {
      x.status = s;
      if (s === 'aprovada' && !x.escolhida && melhor) x.escolhida = melhor.id;
      if (s === 'comprada' || s === 'entregue') registrarDespesa(x, o);
    });
    if (s === 'comprada' && !c.lancamentoId) avisar('Compra lançada no financeiro como "a pagar".');
  };

  return (
    <ItemAbre aberto={aberto} alternar={alternar} faixa={c.status === 'cancelada' ? 'var(--borda-forte)' : c.status === 'entregue' ? 'var(--ok)' : 'var(--obra)'} cabeca={
      <span className="grid gap-1">
        <span className="flex items-center justify-between gap-2">
          <b className="truncate text-[15px]">{c.quantidade} {c.unidade} · {c.item}</b>
          <Selo tom={STATUS_COMPRA[c.status].tom}>{STATUS_COMPRA[c.status].nome}</Selo>
        </span>
        <span className="flex flex-wrap gap-x-3 text-xs text-texto2">
          {etapa && <span>{etapa.nome}</span>}
          <span>{c.cotacoes.length} cotaç{c.cotacoes.length === 1 ? 'ão' : 'ões'}</span>
          {(escolhida ?? melhor) && <span className="font-bold text-texto">{escolhida ? 'aprovada' : 'melhor'}: {reais((escolhida ?? melhor)!.valor)}</span>}
        </span>
      </span>
    }>
      {c.status !== 'cancelada' && (
        <ol className="grid grid-cols-5 gap-1" aria-label="Andamento da compra">
          {FLUXO_COMPRA.map((s, k) => (
            <li key={s}>
              <button onClick={() => mudarStatus(s)} aria-current={c.status === s ? 'step' : undefined}
                className={cx('grid w-full justify-items-center gap-1 rounded-lg py-1.5 text-[10px] font-extrabold leading-tight transition sm:text-xs', k <= i ? 'text-obra-texto' : 'text-texto3', c.status === s && 'bg-obra-suave')}>
                <span className={cx('grid size-6 place-items-center rounded-full text-[11px]', k < i ? 'bg-obra text-[#121A2B]' : k === i ? 'bg-[#121A2B] text-white' : 'bg-sup2')}>{k < i ? <Check className="size-3.5" /> : k + 1}</span>
                {STATUS_COMPRA[s].nome}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-1.5">
        <span className="text-xs font-bold text-texto2">Cotações</span>
        {c.cotacoes.map((q) => (
          <div key={q.id} className={cx('flex items-center gap-2 rounded-xl px-3 py-2', c.escolhida === q.id ? 'bg-ok-suave' : 'bg-sup2')}>
            {q.id === melhor?.id && <Trophy className="size-4 shrink-0 text-obra" aria-label="Menor preço" />}
            <span className="min-w-0 flex-1"><b className="block truncate text-sm">{q.fornecedor}</b>{q.prazo && <span className="text-xs text-texto2">entrega {dataBR(q.prazo)}</span>}</span>
            <b className="whitespace-nowrap text-sm">{reais(q.valor)}</b>
            <button onClick={() => set((x) => { x.escolhida = q.id; })} aria-pressed={c.escolhida === q.id} className={cx('rounded-lg px-2 py-1 text-xs font-extrabold', c.escolhida === q.id ? 'text-ok-texto' : 'text-tinta hover:bg-sup')}>{c.escolhida === q.id ? 'Escolhida' : 'Escolher'}</button>
            <button onClick={() => set((x) => { x.cotacoes = x.cotacoes.filter((y) => y.id !== q.id); if (x.escolhida === q.id) x.escolhida = undefined; })} aria-label="Tirar cotação" className="grid size-7 place-items-center rounded-lg text-texto3 hover:bg-sup"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
        <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_150px_auto]" onSubmit={(e) => {
          e.preventDefault();
          if (!cot.fornecedor.trim() || !cot.valor) { avisar('Fornecedor e valor da cotação.', 'erro'); return; }
          set((x) => { x.cotacoes.push({ id: novoId(), fornecedor: cot.fornecedor.trim(), valor: cot.valor!, prazo: cot.prazo || undefined }); if (x.status === 'solicitada') x.status = 'cotando'; });
          setCot({ fornecedor: '', prazo: '' });
        }}>
          <Entrada value={cot.fornecedor} onChange={(e) => setCot({ ...cot, fornecedor: e.target.value })} placeholder="Fornecedor" aria-label="Fornecedor" />
          <EntradaReais aria-label="Valor da cotação" valor={cot.valor} aoMudar={(v) => setCot({ ...cot, valor: v })} />
          <Entrada type="date" value={cot.prazo} onChange={(e) => setCot({ ...cot, prazo: e.target.value })} aria-label="Prazo de entrega" />
          <Botao type="submit" variante="claro" aria-label="Pôr cotação"><Plus className="size-4" /></Botao>
        </form>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-borda pt-3">
        {c.status !== 'cancelada' && c.status !== 'entregue' && <Botao tam="p" variante="fantasma" onClick={() => {
          set((x, o) => { x.status = 'cancelada'; tirarDespesa(x, o); });
          if (c.lancamentoId) avisar(despesaPaga(obra, c) ? 'Pedido cancelado. A despesa já paga continua no financeiro.' : 'Pedido cancelado e despesa "a pagar" retirada do financeiro.');
        }}>Cancelar pedido</Botao>}
        <Botao tam="p" variante="fantasma" className="ml-auto text-critico-texto" onClick={() => {
          if (c.lancamentoId && !despesaPaga(obra, c) && !confirm('Apagar a compra e a despesa "a pagar" dela no financeiro?')) return;
          void mudarObra(obra.id, (o) => { const x = o.compras.find((y) => y.id === c.id); if (x) tirarDespesa(x, o); o.compras = o.compras.filter((y) => y.id !== c.id); });
        }}><Trash2 className="size-4" />Apagar</Botao>
      </div>
    </ItemAbre>
  );
}

/** Compras: pedido de material, cotações, aprovação e entrada no financeiro. */
export function AbaCompras({ obra, avisar }: { obra: Obra; avisar: (t: string, tom?: 'ok' | 'erro') => void }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [n, setN] = useState({ item: '', quantidade: '1', unidade: 'un', etapaId: '' });
  const [ver, setVer] = useState<'abertas' | 'todas'>('abertas');
  const lista = [...obra.compras].sort((a, b) => b.criadoEm - a.criadoEm).filter((c) => ver === 'todas' || !['entregue', 'cancelada'].includes(c.status));

  const pedir = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(n.quantidade.replace(',', '.'));
    if (!n.item.trim() || !(q > 0)) { avisar('Diga o item e a quantidade.', 'erro'); return; }
    const id = novoId();
    void mudarObra(obra.id, (o) => { o.compras.push({ id, item: n.item.trim(), quantidade: q, unidade: n.unidade.trim() || 'un', etapaId: n.etapaId || undefined, status: 'solicitada', cotacoes: [], criadoEm: Date.now() }); });
    setN({ ...n, item: '', quantidade: '1' });
    setAberto(id);
  };

  return (
    <div className="grid gap-4">
      <Cartao className="p-4">
        <form onSubmit={pedir} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px_90px_minmax(0,180px)_auto]">
          <Entrada value={n.item} onChange={(e) => setN({ ...n, item: e.target.value })} placeholder="O que precisa? (ex.: cimento CP-II)" aria-label="Item" />
          <Entrada inputMode="decimal" value={n.quantidade} onChange={(e) => setN({ ...n, quantidade: e.target.value })} aria-label="Quantidade" />
          <Entrada list="unidades" value={n.unidade} onChange={(e) => setN({ ...n, unidade: e.target.value })} aria-label="Unidade" />
          <datalist id="unidades">{['un', 'sc', 'm²', 'm³', 'm', 'kg', 'l', 'cx', 'pç', 'milheiro'].map((u) => <option key={u} value={u} />)}</datalist>
          {obra.etapas.length > 0 ? <Escolha aria-label="Etapa" valor={n.etapaId} vazio="Etapa (opcional)" aoMudar={(v) => setN({ ...n, etapaId: v })} opcoes={obra.etapas.map((e) => ({ v: e.id, r: e.nome }))} /> : <span className="hidden sm:block" />}
          <Botao type="submit" variante="obra"><ShoppingCart className="size-4" />Pedir</Botao>
        </form>
      </Cartao>
      <div className="flex gap-1.5">
        {(['abertas', 'todas'] as const).map((v) => (
          <button key={v} onClick={() => setVer(v)} aria-pressed={ver === v} className={cx('h-8 rounded-full px-3 text-xs font-extrabold', ver === v ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda')}>{v === 'abertas' ? 'Em aberto' : 'Todas'}</button>
        ))}
      </div>
      {lista.length === 0 ? <Vazio icone={<ShoppingCart className="size-7" />} titulo={obra.compras.length ? 'Nada em aberto' : 'Nenhum pedido'} texto="Peça o material, ponha as cotações dos fornecedores e aprove a melhor. Ao marcar como comprada, ela entra no financeiro." />
        : <ul className="grid gap-2">{lista.map((c) => <CompraItem key={c.id} obra={obra} c={c} aberto={aberto === c.id} alternar={() => setAberto(aberto === c.id ? null : c.id)} avisar={avisar} />)}</ul>}
    </div>
  );
}

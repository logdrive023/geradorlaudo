import { useState } from 'react';
import { CheckCircle2, Circle, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { mudarObra } from '../../db/db';
import { CATEGORIA, financeiro, type CategoriaGasto, type Lancamento, type Obra } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { Botao, Cartao, Dica, Entrada } from '../../componentes/ui';
import { EntradaReais, Escolha, Indicador } from '../../componentes/Pecas';
import { baixar, cx, dataBR, hoje, novoId } from '../../lib/util';

/** Planilha do financeiro (CSV com ; e BOM, abre certo no Excel). */
function planilha(o: Obra): Blob {
  const cel = (v: string | number) => { const s = String(v).replace(/\r?\n/g, ' '); return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const etapa = (id?: string) => o.etapas.find((e) => e.id === id)?.nome ?? '';
  const linhas = [['Obra', o.nome], [], ['Data', 'Tipo', 'Descrição', 'Categoria', 'Etapa', 'Valor (R$)', 'Pago'],
    ...o.lancamentos.map((l) => [dataBR(l.data), l.tipo === 'despesa' ? 'Despesa' : 'Receita', l.descricao, CATEGORIA[l.categoria], etapa(l.etapaId), l.valor.toFixed(2).replace('.', ','), l.pago ? 'Sim' : 'Não'])];
  return new Blob(['﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

/** Financeiro: orçado × realizado por etapa, lançamentos e a pagar. */
export function AbaFinanceiro({ obra }: { obra: Obra }) {
  const f = financeiro(obra);
  const [n, setN] = useState<{ descricao: string; valor?: number; tipo: Lancamento['tipo']; categoria: CategoriaGasto; etapaId: string; data: string; pago: boolean }>(
    { descricao: '', tipo: 'despesa', categoria: 'material', etapaId: '', data: hoje(), pago: true });
  const [erro, setErro] = useState('');
  const pct = f.orcado > 0 ? Math.round((f.realizado / f.orcado) * 100) : null;

  const lancar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!n.descricao.trim() || !n.valor) { setErro('Preencha a descrição e o valor.'); return; }
    setErro('');
    const l: Lancamento = { id: novoId(), data: n.data, descricao: n.descricao.trim(), valor: n.valor, tipo: n.tipo, categoria: n.categoria, etapaId: n.etapaId || undefined, pago: n.pago };
    void mudarObra(obra.id, (o) => { o.lancamentos.push(l); });
    setN({ ...n, descricao: '', valor: undefined });
  };
  const lista = [...obra.lancamentos].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid content-start gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Indicador valor={reais(f.orcado)} rotulo="orçado" dica="Soma do orçado de cada etapa (aba Cronograma ou aqui embaixo)." />
          <Indicador valor={reais(f.realizado)} rotulo={pct != null ? `realizado · ${pct}%` : 'realizado'} tom={pct != null && pct > 100 ? 'critico' : 'obra'} />
          <Indicador valor={reais(f.saldo)} rotulo={f.saldo < 0 ? 'acima do orçado' : 'saldo do orçamento'} tom={f.saldo < 0 ? 'critico' : 'ok'} />
          <Indicador valor={reais(f.aPagar)} rotulo="a pagar" tom={f.aPagar > 0 ? 'medio' : 'neutro'} />
        </div>

        <Cartao className="grid gap-3 p-4">
          <h2 className="flex items-center gap-1.5 text-lg font-bold">Orçado × realizado por etapa<Dica texto="Ponha o orçado de cada etapa e lance as despesas escolhendo a etapa. A barra vermelha passou do orçado." /></h2>
          {obra.etapas.length === 0 ? <p className="text-sm text-texto2">Crie etapas no Cronograma para acompanhar por etapa.</p> : (
            <ul className="grid gap-2.5">
              {f.porEtapa.map(({ etapa, orcado, realizado }) => {
                const p = orcado > 0 ? Math.min(100, (realizado / orcado) * 100) : realizado > 0 ? 100 : 0;
                return (
                  <li key={etapa.id} className="grid gap-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <b className="truncate">{etapa.nome}</b>
                      <span className="w-36 shrink-0"><EntradaReais aria-label={`Orçado de ${etapa.nome}`} valor={etapa.orcado} aoMudar={(v) => void mudarObra(obra.id, (o) => { const e = o.etapas.find((x) => x.id === etapa.id); if (e) e.orcado = v; })} /></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sup2"><div className={cx('h-full rounded-full', realizado > orcado && orcado > 0 ? 'bg-critico' : 'bg-obra')} style={{ width: `${p}%` }} /></div>
                    <span className="text-xs text-texto2">realizado <b className="text-texto">{reais(realizado)}</b>{orcado > 0 && <> de {reais(orcado)}</>}</span>
                  </li>
                );
              })}
              {f.semEtapa > 0 && <li className="text-xs text-texto2">Sem etapa: <b>{reais(f.semEtapa)}</b></li>}
            </ul>
          )}
        </Cartao>

        <Cartao className="grid gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Lançamentos</h2>
            {obra.lancamentos.length > 0 && <Botao tam="p" variante="claro" onClick={() => baixar(`${obra.nome} - financeiro.csv`, planilha(obra))}><FileSpreadsheet className="size-4" />Planilha</Botao>}
          </div>
          {lista.length === 0 ? <p className="text-sm text-texto2">Nenhum lançamento. Compras marcadas como "comprada" entram aqui sozinhas.</p> : (
            <ul className="grid gap-1.5">
              {lista.map((l) => (
                <li key={l.id} className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2">
                  <button aria-label={l.pago ? 'Marcar como a pagar' : 'Marcar como pago'} title={l.pago ? 'Pago' : 'A pagar'} onClick={() => void mudarObra(obra.id, (o) => { const x = o.lancamentos.find((y) => y.id === l.id); if (x) x.pago = !x.pago; })}>
                    {l.pago ? <CheckCircle2 className="size-5 text-ok" /> : <Circle className="size-5 text-medio" />}
                  </button>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{l.descricao}</b>
                    <span className="block truncate text-xs text-texto2">{dataBR(l.data)} · {CATEGORIA[l.categoria]}{l.etapaId && ` · ${obra.etapas.find((e) => e.id === l.etapaId)?.nome ?? ''}`}{!l.pago && ' · a pagar'}</span>
                  </span>
                  <b className={cx('whitespace-nowrap text-sm', l.tipo === 'receita' ? 'text-ok-texto' : 'text-texto')}>{l.tipo === 'receita' ? '+' : '−'} {reais(l.valor)}</b>
                  <button aria-label="Apagar lançamento" onClick={() => void mudarObra(obra.id, (o) => { o.lancamentos = o.lancamentos.filter((y) => y.id !== l.id); })} className="grid size-8 place-items-center rounded-lg text-texto3 hover:bg-sup"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <aside className="grid content-start gap-4">
        <Cartao className="p-4">
          <form onSubmit={lancar} className="grid gap-3">
            <h2 className="text-lg font-bold">Novo lançamento</h2>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-sup2 p-1" role="radiogroup" aria-label="Tipo">
              {(['despesa', 'receita'] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={n.tipo === t} onClick={() => setN({ ...n, tipo: t })}
                  className={cx('h-9 rounded-lg text-sm font-extrabold', n.tipo === t ? 'bg-sup shadow-sm' : 'text-texto2')}>{t === 'despesa' ? 'Despesa' : 'Receita'}</button>
              ))}
            </div>
            <Entrada value={n.descricao} onChange={(e) => setN({ ...n, descricao: e.target.value })} placeholder={n.tipo === 'despesa' ? 'Ex.: 30 sacos de cimento' : 'Ex.: Parcela 2 do cliente'} aria-label="Descrição" />
            <div className="grid grid-cols-2 gap-2">
              <EntradaReais aria-label="Valor" valor={n.valor} aoMudar={(v) => setN({ ...n, valor: v })} />
              <Entrada type="date" value={n.data} onChange={(e) => setN({ ...n, data: e.target.value })} aria-label="Data" />
            </div>
            {n.tipo === 'despesa' && <>
              <Escolha aria-label="Categoria" valor={n.categoria} aoMudar={(c) => setN({ ...n, categoria: c })} opcoes={(Object.keys(CATEGORIA) as CategoriaGasto[]).map((c) => ({ v: c, r: CATEGORIA[c] }))} />
              {obra.etapas.length > 0 && <Escolha aria-label="Etapa" valor={n.etapaId} vazio="Sem etapa" aoMudar={(e) => setN({ ...n, etapaId: e })} opcoes={obra.etapas.map((e) => ({ v: e.id, r: e.nome }))} />}
            </>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={n.pago} onChange={(e) => setN({ ...n, pago: e.target.checked })} className="size-4 accent-[var(--obra)]" />{n.tipo === 'despesa' ? 'Já está pago' : 'Já recebido'}</label>
            {erro && <p className="rounded-xl bg-critico-suave p-2 text-sm font-bold text-critico-texto">{erro}</p>}
            <Botao type="submit" variante="obra"><Plus className="size-4" />Lançar</Botao>
          </form>
        </Cartao>
        {f.porCategoria.length > 0 && (
          <Cartao className="grid gap-2 p-4">
            <h2 className="text-lg font-bold">Despesas por categoria</h2>
            {f.porCategoria.map(({ c, valor }) => (
              <div key={c} className="grid gap-1">
                <div className="flex justify-between text-sm"><span>{CATEGORIA[c]}</span><b>{reais(valor)}</b></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-sup2"><div className="h-full rounded-full bg-tinta" style={{ width: `${(valor / Math.max(1, f.realizado)) * 100}%` }} /></div>
              </div>
            ))}
            {f.recebido > 0 && <p className="mt-1 text-sm text-texto2">Recebido do cliente: <b className="text-ok-texto">{reais(f.recebido)}</b></p>}
          </Cartao>
        )}
      </aside>
    </div>
  );
}

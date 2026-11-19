import { useState } from 'react';
import { AlarmClock, CheckCircle2, ChevronDown, ClipboardList, FileSpreadsheet } from 'lucide-react';
import { db } from '../db/db';
import type { Acompanhamento, Foto, Laudo, StatusAcao } from '../dominio/modelo';
import { STATUS_ACAO, dataCurta, itensPlano, planilhaPlano, reais, resumoPlano, type ItemPlano } from '../dominio/plano';
import { Botao, Cartao, Dica, Entrada, SeloGravidade } from './ui';
import { baixar, cx } from '../lib/util';

/** Grava o acompanhamento dentro do achado (sobe para o servidor junto com a foto). */
async function salvar(i: ItemPlano, p: Partial<Acompanhamento>) {
  const f = await db.fotos.get(i.foto.id);
  if (!f?.analise) return;
  const achados = f.analise.achados.map((a) => (a.id === i.achado.id
    ? { ...a, acompanhamento: { status: 'aberta' as StatusAcao, prazo: i.prazo, ...a.acompanhamento, ...p } }
    : a));
  await db.fotos.update(f.id, { analise: { ...f.analise, achados } });
}

const COR: Record<StatusAcao, string> = {
  aberta: 'bg-critico-suave text-critico-texto',
  andamento: 'bg-medio-suave text-medio-texto',
  resolvida: 'bg-ok-suave text-ok-texto',
};

function Item({ i, aberto, alternar }: { i: ItemPlano; aberto: boolean; alternar: () => void }) {
  const [custo, setCusto] = useState(i.acomp.custo != null ? String(i.acomp.custo).replace('.', ',') : '');
  const [resp, setResp] = useState(i.acomp.responsavel ?? '');
  const gravarCusto = () => {
    const v = Number(custo.replace(/\./g, '').replace(',', '.'));
    void salvar(i, { custo: custo.trim() && Number.isFinite(v) && v >= 0 ? v : undefined });
  };
  return (
    <li className={cx('overflow-hidden rounded-2xl border bg-sup transition', aberto ? 'border-borda-forte shadow-[0_8px_24px_rgba(18,26,43,.06)]' : 'border-borda')}>
      <button onClick={alternar} aria-expanded={aberto} className="relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-3 pl-4 pr-3 text-left">
        {/* faixa na cor da gravidade: dá para bater o olho na lista */}
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--${i.achado.gravidade})` }} aria-hidden />
        <span className="grid size-8 place-items-center rounded-lg bg-sup2 text-xs font-extrabold text-texto2" title="Número da foto">{String(i.numeroFoto).padStart(2, '0')}</span>
        <span className="min-w-0">
          <b className="block truncate text-[15px] leading-tight">{i.achado.tipo}</b>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-texto2">
            <SeloGravidade g={i.achado.gravidade} />
            {i.foto.analise?.ambiente && <span className="truncate">{i.foto.analise.ambiente}</span>}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cx('whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold', COR[i.acomp.status])}>{STATUS_ACAO[i.acomp.status].nome}</span>
          <ChevronDown className={cx('size-4 text-texto3 transition', aberto && 'rotate-180')} />
        </span>
        <span className="col-start-2 col-end-4 mt-2 flex items-center justify-between gap-2 border-t border-dashed border-borda pt-2 text-sm">
          <span className={cx('flex items-center gap-1.5', i.atrasado ? 'font-extrabold text-critico-texto' : 'text-texto2')}>
            <AlarmClock className="size-4" />{dataCurta(i.prazo)}{i.atrasado && <span className="rounded-full bg-critico-suave px-1.5 text-[11px]">atrasado</span>}
          </span>
          <span className={cx('font-extrabold', i.acomp.custo != null ? 'text-texto' : 'font-bold text-texto3')}>{i.acomp.custo != null ? reais(i.acomp.custo) : 'sem custo'}</span>
        </span>
      </button>
      {aberto && (
        <div className="grid gap-3 border-t border-borda p-3">
          <p className="text-sm text-texto2"><b className="text-texto">O que fazer:</b> {i.achado.recomendacao || '—'}</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-sup2 p-1" role="radiogroup" aria-label="Status">
            {(Object.keys(STATUS_ACAO) as StatusAcao[]).map((s) => (
              <button key={s} role="radio" aria-checked={i.acomp.status === s} onClick={() => void salvar(i, { status: s })}
                className={cx('h-9 rounded-lg text-xs font-extrabold transition', i.acomp.status === s ? COR[s] : 'text-texto2 hover:bg-sup')}>
                {STATUS_ACAO[s].nome}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-bold text-texto2">Prazo
              <Entrada type="date" value={i.prazo} onChange={(e) => e.target.value && void salvar(i, { prazo: e.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-bold text-texto2">Responsável
              <Entrada value={resp} onChange={(e) => setResp(e.target.value)} onBlur={() => void salvar(i, { responsavel: resp.trim() || undefined })} placeholder="Construtora, síndico…" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-texto2">Custo estimado (R$)
              <Entrada inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value.replace(/[^\d.,]/g, ''))} onBlur={gravarCusto} placeholder="0,00" />
            </label>
          </div>
        </div>
      )}
    </li>
  );
}

/** Plano de ação: prioridades, prazos, responsáveis e custo de cada anomalia aceita. */
export function PlanoAcao({ laudo, fotos, className }: { laudo: Laudo; fotos: Foto[]; className?: string }) {
  const itens = itensPlano(laudo, fotos);
  const r = resumoPlano(itens);
  const [aberto, setAberto] = useState<string | null>(null);
  if (!itens.length) return null;
  const nome = laudo.titulo.replace(/[\\/:*?"<>|]/g, '');
  return (
    <Cartao className={cx('grid gap-3 p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-lg font-bold"><ClipboardList className="size-5 text-obra" />Plano de ação
          <Dica texto={<>Cada anomalia aceita vira uma tarefa com <b>prazo</b> (sugerido pela gravidade: crítico 7 dias, médio 30, mínimo 90), <b>responsável</b> e <b>custo estimado</b>. Quando você preenche, o plano entra no laudo A4 e na planilha.</>} />
        </h3>
        <Botao tam="p" variante="claro" onClick={() => baixar(`${nome} - plano de ação.csv`, planilhaPlano(laudo, itens))}><FileSpreadsheet className="size-4" />Planilha (Excel)</Botao>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-critico-suave p-2"><b className="block text-xl text-critico-texto">{r.aberta + r.andamento}</b><span className="text-xs font-bold text-critico-texto">em aberto</span></div>
        <div className={cx('rounded-xl p-2', r.atrasados ? 'bg-medio-suave' : 'bg-sup2')}><b className={cx('flex items-center justify-center gap-1 text-xl', r.atrasados ? 'text-medio-texto' : 'text-texto2')}><AlarmClock className="size-4" />{r.atrasados}</b><span className="text-xs font-bold text-texto2">atrasadas</span></div>
        <div className="rounded-xl bg-ok-suave p-2"><b className="flex items-center justify-center gap-1 text-xl text-ok-texto"><CheckCircle2 className="size-4" />{r.resolvida}</b><span className="text-xs font-bold text-ok-texto">resolvidas</span></div>
      </div>
      {r.custo > 0 && <p className="rounded-xl bg-sup2 px-3 py-2 text-sm">Custo estimado dos reparos: <b>{reais(r.custo)}</b>{r.custoAberto !== r.custo && <> · em aberto <b>{reais(r.custoAberto)}</b></>}</p>}
      <ul className="grid gap-2">
        {itens.map((i) => <Item key={i.achado.id} i={i} aberto={aberto === i.achado.id} alternar={() => setAberto(aberto === i.achado.id ? null : i.achado.id)} />)}
      </ul>
    </Cartao>
  );
}

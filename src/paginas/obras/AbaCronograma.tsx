import { useState } from 'react';
import { CheckSquare, Plus, Square, Trash2 } from 'lucide-react';
import { mudarObra } from '../../db/db';
import { avancoFisico, avancoPrevisto, situacaoEtapa, type Etapa, type Obra, type SituacaoEtapa } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { Botao, Cartao, Dica, Entrada } from '../../componentes/ui';
import { Anel, BarraDupla, EntradaReais, ItemAbre, Ponto } from '../../componentes/Pecas';
import { NIVEL_ETAPA, type NivelEtapa } from '../../dominio/etapas';
import { cx, dataBR, novoId, dataLocal } from '../../lib/util';

const SITUACAO: Record<SituacaoEtapa, { nome: string; cls: string; cor: string }> = {
  nao_iniciada: { nome: 'Não iniciada', cls: 'bg-sup2 text-texto2', cor: 'var(--borda-forte)' },
  andamento: { nome: 'Em andamento', cls: 'bg-obra-suave text-obra-texto', cor: 'var(--obra)' },
  concluida: { nome: 'Concluída', cls: 'bg-ok-suave text-ok-texto', cor: 'var(--ok)' },
  atrasada: { nome: 'Atrasada', cls: 'bg-critico-suave text-critico-texto', cor: 'var(--critico)' },
};

const editar = (obraId: string, etapaId: string, fn: (e: Etapa) => void) =>
  mudarObra(obraId, (o) => { const e = o.etapas.find((x) => x.id === etapaId); if (e) fn(e); });

/** Linha do tempo simples: barra prevista (clara) e realizada (cheia) de cada etapa. */
function Gantt({ etapas, inicio, fim }: { etapas: Etapa[]; inicio: string; fim: string }) {
  const t0 = new Date(`${inicio}T12:00:00`).getTime();
  const t1 = new Date(`${fim}T12:00:00`).getTime();
  const pos = (d: string) => Math.max(0, Math.min(100, ((new Date(`${d}T12:00:00`).getTime() - t0) / Math.max(1, t1 - t0)) * 100));
  const hoje = pos(dataLocal());
  return (
    <div className="relative grid gap-1.5" aria-label="Linha do tempo das etapas">
      {/* linha de hoje: só sobre a área das barras (depois da coluna de nomes) */}
      <div className="pointer-events-none absolute inset-y-0 left-[118px] right-0 z-10 sm:left-[168px]" aria-hidden>
        <div className="absolute inset-y-0 w-0.5 rounded bg-critico" style={{ left: `${hoje}%` }} title="Hoje" />
      </div>
      {etapas.map((e) => {
        const ini = e.inicioPrev ? pos(e.inicioPrev) : null;
        const fi = e.fimPrev ? pos(e.fimPrev) : null;
        return (
          <div key={e.id} className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-xs sm:grid-cols-[160px_minmax(0,1fr)]">
            <span className="flex min-w-0 items-center gap-1.5">{e.nivel && <span className="size-2 shrink-0 rounded-full" style={{ background: NIVEL_ETAPA[e.nivel].cor }} aria-hidden />}<span className="truncate font-bold text-texto2">{e.nome}</span></span>
            <div className="relative h-5 rounded bg-sup2">
              {ini != null && fi != null && (
                <div className="absolute inset-y-0 overflow-hidden rounded bg-tinta/15" style={{ left: `${ini}%`, width: `${Math.max(1.5, fi - ini)}%` }}>
                  <div className="h-full rounded" style={{ width: `${e.percentual}%`, background: SITUACAO[situacaoEtapa(e)].cor }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2 text-[11px] text-texto3 sm:grid-cols-[160px_minmax(0,1fr)]"><span />
        <span className="flex justify-between"><span>{dataBR(inicio)}</span><span className="font-bold text-critico-texto">hoje</span><span>{dataBR(fim)}</span></span>
      </div>
    </div>
  );
}

function EtapaItem({ obraId, e, aberto, alternar }: { obraId: string; e: Etapa; aberto: boolean; alternar: () => void }) {
  const s = situacaoEtapa(e);
  const [novoItem, setNovoItem] = useState('');
  const feitos = e.checklist.filter((c) => c.feito).length;
  const set = (fn: (x: Etapa) => void) => void editar(obraId, e.id, fn);
  return (
    <ItemAbre aberto={aberto} alternar={alternar} faixa={SITUACAO[s].cor} cabeca={
      <span className="grid gap-1.5">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">{e.nivel && <Ponto cor={NIVEL_ETAPA[e.nivel].cor} nome={NIVEL_ETAPA[e.nivel].nome} mostrarNome={false} />}<b className="truncate text-[15px]">{e.nome}</b></span>
          <span className={cx('whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold', SITUACAO[s].cls)}>{SITUACAO[s].nome}</span>
        </span>
        <span className="flex items-center gap-2"><BarraDupla real={e.percentual} className="h-2 flex-1" /><b className="w-10 text-right text-sm">{e.percentual}%</b></span>
        <span className="flex flex-wrap gap-x-3 text-xs text-texto2">
          {e.inicioPrev && <span>{dataBR(e.inicioPrev)} → {dataBR(e.fimPrev)}</span>}
          {e.checklist.length > 0 && <span>checklist {feitos}/{e.checklist.length}</span>}
          {e.orcado != null && <span>{reais(e.orcado)}</span>}
        </span>
      </span>
    }>
      <label className="grid gap-1 text-xs font-bold text-texto2">Nome da etapa
        <Entrada defaultValue={e.nome} onBlur={(ev) => ev.target.value.trim() && ev.target.value !== e.nome && set((x) => { x.nome = ev.target.value.trim(); })} />
      </label>
      <div className="grid gap-1">
        <span className="flex items-center gap-1 text-xs font-bold text-texto2">Classificação<Dica texto={<>{(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => <span key={n} className="block"><b>{NIVEL_ETAPA[n].nome}:</b> {NIVEL_ETAPA[n].texto}</span>)}</>} /></span>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-sup2 p-1" role="radiogroup" aria-label="Classificação da etapa">
          {(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={e.nivel === n} onClick={() => set((x) => { x.nivel = n; })}
              className={cx('flex h-9 items-center justify-center rounded-lg transition', e.nivel === n ? 'bg-sup shadow-sm' : 'opacity-60 hover:opacity-100')}>
              <Ponto cor={NIVEL_ETAPA[n].cor} nome={NIVEL_ETAPA[n].nome} />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-1">
        <span className="flex items-center gap-1 text-xs font-bold text-texto2">Medição: {e.percentual}% executado<Dica texto="Quanto desta etapa já foi feito. Entra no avanço físico da obra." /></span>
        <input type="range" min={0} max={100} step={5} value={e.percentual} aria-label="Percentual executado" className="w-full accent-[var(--obra)]"
          onChange={(ev) => set((x) => {
            x.percentual = Number(ev.target.value);
            const hoje = dataLocal();
            if (x.percentual > 0 && !x.inicioReal) x.inicioReal = hoje;
            if (x.percentual >= 100 && !x.fimReal) x.fimReal = hoje;
            if (x.percentual < 100) x.fimReal = undefined;
          })} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([['inicioPrev', 'Início previsto'], ['fimPrev', 'Fim previsto'], ['inicioReal', 'Início real'], ['fimReal', 'Fim real']] as const).map(([k, r]) => (
          <label key={k} className="grid gap-1 text-xs font-bold text-texto2">{r}
            <Entrada type="date" value={e[k] ?? ''} onChange={(ev) => set((x) => { x[k] = ev.target.value || undefined; })} />
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-xs font-bold text-texto2">Orçado da etapa
        <EntradaReais valor={e.orcado} aoMudar={(v) => set((x) => { x.orcado = v; })} aria-label="Orçado da etapa" />
      </label>
      <div className="grid gap-1.5">
        <span className="text-xs font-bold text-texto2">Checklist</span>
        {e.checklist.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl bg-sup2 px-2 py-1.5">
            <button onClick={() => set((x) => { const i = x.checklist.find((y) => y.id === c.id); if (i) i.feito = !i.feito; })} aria-pressed={c.feito} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
              {c.feito ? <CheckSquare className="size-5 shrink-0 text-ok" /> : <Square className="size-5 shrink-0 text-texto3" />}
              <span className={cx('truncate', c.feito && 'text-texto3 line-through')}>{c.texto}</span>
            </button>
            <button onClick={() => set((x) => { x.checklist = x.checklist.filter((y) => y.id !== c.id); })} aria-label="Tirar item" className="grid size-7 place-items-center rounded-lg text-texto3 hover:bg-sup"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
        <form className="flex gap-2" onSubmit={(ev) => { ev.preventDefault(); if (!novoItem.trim()) return; set((x) => { x.checklist.push({ id: novoId(), texto: novoItem.trim(), feito: false }); }); setNovoItem(''); }}>
          <Entrada value={novoItem} onChange={(ev) => setNovoItem(ev.target.value)} placeholder="Novo item do checklist" />
          <Botao type="submit" variante="claro" aria-label="Pôr no checklist"><Plus className="size-4" /></Botao>
        </form>
      </div>
      <button onClick={() => void mudarObra(obraId, (o) => { o.etapas = o.etapas.filter((x) => x.id !== e.id); })} className="justify-self-start text-sm font-bold text-critico-texto hover:underline">Apagar etapa</button>
    </ItemAbre>
  );
}

/** Cronograma: etapas com previsto × real, medição (%) e checklist. */
export function AbaCronograma({ obra }: { obra: Obra }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const fis = avancoFisico(obra);
  const prev = avancoPrevisto(obra);
  const datas = obra.etapas.flatMap((e) => [e.inicioPrev, e.fimPrev]).filter(Boolean) as string[];
  const inicio = obra.inicio || datas.sort()[0];
  const fim = obra.fim || datas.sort().at(-1);

  return (
    <div className="grid gap-4">
      <Cartao className="grid gap-3 p-4">
        <div className="flex items-center gap-4">
          <Anel pct={fis} previsto={prev} tam={88} espessura={9} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">Cronograma físico</h2>
            <p className="text-sm text-texto2">feito <b className="text-texto">{fis}%</b>{prev != null && <> · previsto hoje <b className="text-texto">{prev}%</b></>}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(SITUACAO) as SituacaoEtapa[]).map((k) => {
                const n = obra.etapas.filter((e) => situacaoEtapa(e) === k).length;
                return n ? <span key={k} className={cx('rounded-full px-2 py-0.5 text-[11px] font-extrabold', SITUACAO[k].cls)}>{n} {SITUACAO[k].nome.toLowerCase()}</span> : null;
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-2 text-xs">
          <span className="font-bold text-texto3">Classificação:</span>
          {(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => <Ponto key={n} cor={NIVEL_ETAPA[n].cor} nome={NIVEL_ETAPA[n].nome} />)}
        </div>
        {inicio && fim && obra.etapas.some((e) => e.inicioPrev && e.fimPrev)
          ? <Gantt etapas={obra.etapas} inicio={inicio} fim={fim} />
          : <p className="rounded-xl bg-sup2 p-3 text-sm text-texto2">Coloque início e fim previstos nas etapas para ver a linha do tempo.</p>}
      </Cartao>

      <ul className="grid gap-2">
        {obra.etapas.map((e) => <EtapaItem key={e.id} obraId={obra.id} e={e} aberto={aberta === e.id} alternar={() => setAberta(aberta === e.id ? null : e.id)} />)}
      </ul>

      <form className="flex gap-2" onSubmit={(ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        const id = novoId();
        void mudarObra(obra.id, (o) => { o.etapas.push({ id, nome: nome.trim(), percentual: 0, checklist: [] }); });
        setNome(''); setAberta(id);
      }}>
        <Entrada value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Nova etapa (ex.: Muro de divisa)" />
        <Botao type="submit" variante="obra"><Plus className="size-4" />Etapa</Botao>
      </form>
    </div>
  );
}

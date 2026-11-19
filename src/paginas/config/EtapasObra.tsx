import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowDown, ArrowUp, BookMarked, Check, CheckSquare, ChevronDown, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { lerConfig, salvarConfig } from '../../db/db';
import { ETAPAS_PADRAO, NIVEL_ETAPA, etapasConfiguradas, type EtapaModelo, type NivelEtapa } from '../../dominio/etapas';
import { TIPO_OBRA, type TipoObra } from '../../dominio/obra';
import { Botao, Cartao, Dica, Entrada, Modal, useAviso } from '../../componentes/ui';
import { Ponto } from '../../componentes/Pecas';
import { cx, novoId } from '../../lib/util';

/** De onde vem a ordem padrão (fica escrito para a pessoa saber o porquê). */
const REFERENCIAS = [
  { origem: 'Brasil', nome: 'SINAPI · NBR 12721', linha: 'Etapas usadas em orçamento público e no CUB.', detalhe: 'Caixa/IBGE: serviços preliminares, infraestrutura, superestrutura, vedação, cobertura, instalações, revestimentos…' },
  { origem: 'Internacional', nome: 'UniFormat II', linha: 'Classificação por elementos (ASTM E1557).', detalhe: 'A Subestrutura · B Envoltória · C Interiores · D Instalações · G Área externa.' },
  { origem: 'Internacional', nome: 'MasterFormat', linha: 'Divisões de serviços do CSI.', detalhe: 'Da divisão 01 (requisitos gerais) à 33 (utilidades).' },
];
const NORMAS: [string, string][] = [['NBR 9575', 'Impermeabilização'], ['NBR 5410', 'Instalações elétricas'], ['NBR 13749', 'Revestimentos de argamassa'], ['NBR 13245', 'Pintura'], ['NBR 14037', 'Manual de uso'], ['NBR 5674', 'Manutenção'], ['NR-18', 'Segurança no canteiro']];

/** De onde vem a ordem padrão: curto à vista, detalhe em "Ver mais". */
function Origem() {
  const [mais, setMais] = useState(false);
  return (
    <Cartao className="grid gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-obra-suave text-obra-texto"><BookMarked className="size-5" /></span>
        <div>
          <h2 className="text-lg font-bold leading-tight">De onde vem o padrão</h2>
          <p className="text-sm text-texto2">Um consenso entre 3 referências, na ordem de execução usada no Brasil.</p>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {REFERENCIAS.map((r) => (
          <li key={r.nome} className="rounded-2xl bg-sup2 p-3">
            <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider', r.origem === 'Brasil' ? 'bg-ok-suave text-ok-texto' : 'bg-tinta/10 text-tinta')}>{r.origem}</span>
            <b className="mt-1.5 block text-sm">{r.nome}</b>
            <span className="text-xs text-texto2">{r.linha}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => setMais(!mais)} aria-expanded={mais} className="flex items-center gap-1 justify-self-start rounded-lg py-1 text-xs font-extrabold text-tinta hover:underline">
        {mais ? 'Ver menos' : 'Ver mais sobre as referências e normas'}<ChevronDown className={cx('size-4 transition', mais && 'rotate-180')} />
      </button>
      {mais && (
        <div className="revelar grid gap-4 rounded-2xl border border-borda p-3">
          <div className="grid gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-texto3">Como cada referência divide a obra</span>
            {REFERENCIAS.map((r) => (
              <div key={r.nome} className="grid gap-0.5 rounded-xl bg-sup2 px-3 py-2">
                <span className="flex items-center gap-2"><b className="text-sm">{r.nome}</b><span className={cx('rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase', r.origem === 'Brasil' ? 'bg-ok-suave text-ok-texto' : 'bg-tinta/10 text-tinta')}>{r.origem}</span></span>
                <span className="text-xs leading-snug text-texto2">{r.detalhe}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-texto3">Normas citadas nos checklists</span>
            <ul className="grid grid-cols-2 gap-1.5">
              {NORMAS.map(([cod, assunto]) => (
                <li key={cod} className="rounded-xl bg-sup2 px-3 py-2"><b className="block text-xs">{cod}</b><span className="text-[11px] text-texto2">{assunto}</span></li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-texto3"><BookMarked className="size-3.5" />Ao abrir cada etapa, aparece a correspondência dela.</p>
        </div>
      )}
      <p className="rounded-xl bg-obra-suave px-3 py-2 text-xs font-bold text-obra-texto">Tudo aqui é seu: nome, ordem, classificação e checklist. Vale para as próximas obras.</p>
    </Cartao>
  );
}

function Secao({ titulo, dica, children, extra }: { titulo: string; dica?: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-texto3">{titulo}{dica && <Dica texto={dica} />}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function ItemEtapa({ e, i, total, aberto, alternar, mudar, mover, apagar }: {
  e: EtapaModelo; i: number; total: number; aberto: boolean; alternar: () => void;
  mudar: (p: Partial<EtapaModelo>) => void; mover: (d: -1 | 1) => void; apagar: () => void;
}) {
  const [novo, setNovo] = useState('');
  const todosTipos = Object.keys(TIPO_OBRA) as TipoObra[];
  const cor = NIVEL_ETAPA[e.nivel].cor;
  const resumo = `${e.checklist.length} ${e.checklist.length === 1 ? 'item' : 'itens'} · ${e.tipos.length === todosTipos.length ? 'todos os tipos' : `${e.tipos.length} ${e.tipos.length === 1 ? 'tipo' : 'tipos'} de obra`}`;

  return (
    <li className={cx('overflow-hidden rounded-2xl border bg-sup transition', aberto ? 'border-borda-forte shadow-[0_8px_24px_rgba(18,26,43,.06)]' : 'border-borda')}>
      {/* linha: número na cor da classificação, nome, ordem e abrir */}
      <div className="flex items-center gap-3 py-2.5 pl-3 pr-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: cor }} title={`Etapa ${i + 1} · ${NIVEL_ETAPA[e.nivel].nome}`}>{i + 1}</span>
        <button onClick={alternar} aria-expanded={aberto} className="min-w-0 flex-1 text-left">
          <b className="line-clamp-2 text-[15px] leading-snug">{e.nome}</b>
          <span className="text-xs text-texto3">{NIVEL_ETAPA[e.nivel].nome} · {resumo}</span>
        </button>
        <span className="flex shrink-0 flex-col">
          <button onClick={() => mover(-1)} disabled={i === 0} aria-label={`Subir ${e.nome}`} title="Subir" className="grid h-6 w-8 place-items-center rounded-md text-texto3 hover:bg-sup2 hover:text-texto disabled:opacity-25"><ArrowUp className="size-4" /></button>
          <button onClick={() => mover(1)} disabled={i === total - 1} aria-label={`Descer ${e.nome}`} title="Descer" className="grid h-6 w-8 place-items-center rounded-md text-texto3 hover:bg-sup2 hover:text-texto disabled:opacity-25"><ArrowDown className="size-4" /></button>
        </span>
        <button onClick={alternar} aria-label={aberto ? 'Fechar' : 'Editar etapa'} className="grid size-9 shrink-0 place-items-center rounded-lg text-texto3 hover:bg-sup2"><ChevronDown className={cx('size-4 transition', aberto && 'rotate-180')} /></button>
      </div>

      {aberto && (
        <div className="grid gap-5 border-t border-borda p-4">
          <Secao titulo="Nome da etapa">
            <Entrada defaultValue={e.nome} onBlur={(ev) => ev.target.value.trim() && ev.target.value !== e.nome && mudar({ nome: ev.target.value.trim() })} />
            {e.ref && <span className="flex items-center gap-1 text-xs text-texto3"><BookMarked className="size-3.5 shrink-0" />Referência: {e.ref}</span>}
          </Secao>

          <Secao titulo="Classificação" dica="Diz o quanto um erro nesta etapa custa. Aparece como bolinha colorida no cronograma de cada obra.">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Classificação">
              {(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => {
                const on = e.nivel === n;
                return (
                  <button key={n} role="radio" aria-checked={on} onClick={() => mudar({ nivel: n })}
                    className={cx('grid gap-0.5 rounded-xl border-2 p-2.5 text-left transition', on ? 'shadow-sm' : 'border-borda bg-sup hover:border-borda-forte')}
                    style={on ? { borderColor: NIVEL_ETAPA[n].cor, background: `color-mix(in srgb, ${NIVEL_ETAPA[n].cor} 8%, var(--sup))` } : undefined}>
                    <span className="flex items-center gap-1.5 text-sm font-extrabold"><span className="size-2.5 rounded-full" style={{ background: NIVEL_ETAPA[n].cor }} />{NIVEL_ETAPA[n].nome}{on && <Check className="ml-auto size-4" style={{ color: NIVEL_ETAPA[n].cor }} />}</span>
                    <span className="text-xs leading-snug text-texto2">{NIVEL_ETAPA[n].texto}</span>
                  </button>
                );
              })}
            </div>
          </Secao>

          <Secao titulo="Entra nas obras do tipo" dica="Ao criar uma obra desses tipos, esta etapa já vem no cronograma."
            extra={<button onClick={() => mudar({ tipos: e.tipos.length === todosTipos.length ? [] : todosTipos })} className="text-xs font-extrabold text-tinta hover:underline">{e.tipos.length === todosTipos.length ? 'Tirar todos' : 'Marcar todos'}</button>}>
            <div className="flex flex-wrap gap-1.5">
              {todosTipos.map((t) => {
                const on = e.tipos.includes(t);
                return (
                  <button key={t} aria-pressed={on} onClick={() => mudar({ tipos: on ? e.tipos.filter((x) => x !== t) : [...e.tipos, t] })}
                    className={cx('flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold transition', on ? 'border-obra bg-obra-suave text-obra-texto' : 'border-borda-forte bg-sup text-texto hover:border-texto3')}>
                    {on && <Check className="size-3.5" />}{TIPO_OBRA[t].nome}
                  </button>
                );
              })}
            </div>
          </Secao>

          <Secao titulo={`Checklist (${e.checklist.length})`} dica="O que conferir nesta etapa. Vira um checklist marcável dentro de cada obra.">
            <ul className="grid gap-1.5">
              {e.checklist.map((c, k) => (
                <li key={`${k}-${c}`} className="flex items-center gap-2 rounded-xl bg-sup px-3 py-1.5 ring-1 ring-borda">
                  <CheckSquare className="size-4 shrink-0 text-texto3" />
                  <input defaultValue={c} aria-label={`Item ${k + 1}`} className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                    onBlur={(ev) => { const v = ev.target.value.trim(); if (v && v !== c) mudar({ checklist: e.checklist.map((x, j) => (j === k ? v : x)) }); }} />
                  <button onClick={() => mudar({ checklist: e.checklist.filter((_, j) => j !== k) })} aria-label="Tirar item" className="grid size-7 place-items-center rounded-lg text-texto3 hover:bg-sup2 hover:text-critico-texto"><X className="size-4" /></button>
                </li>
              ))}
            </ul>
            <form className="flex gap-2" onSubmit={(ev) => { ev.preventDefault(); if (!novo.trim()) return; mudar({ checklist: [...e.checklist, novo.trim()] }); setNovo(''); }}>
              <Entrada value={novo} onChange={(ev) => setNovo(ev.target.value)} placeholder="Novo item do checklist" aria-label="Novo item do checklist" />
              <Botao type="submit" variante="claro" aria-label="Pôr no checklist"><Plus className="size-4" /></Botao>
            </form>
          </Secao>

          <div className="flex justify-end border-t border-borda pt-3">
            <button onClick={apagar} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-bold text-critico-texto hover:bg-critico-suave"><Trash2 className="size-4" />Apagar etapa</button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Ajustes › Etapas de obra: cadastro, ordem, classificação e checklist das etapas usadas nas obras novas. */
export function EtapasObra() {
  const etapas = useLiveQuery(async () => etapasConfiguradas(await lerConfig()), [], ETAPAS_PADRAO);
  const [aberta, setAberta] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [voltar, setVoltar] = useState(false);
  const { avisar, el } = useAviso();
  const gravar = (lista: EtapaModelo[]) => salvarConfig({ etapasObra: lista });
  const mudar = (id: string, p: Partial<EtapaModelo>) => void gravar(etapas.map((e) => (e.id === id ? { ...e, ...p } : e)));
  const mover = (i: number, d: -1 | 1) => { const l = [...etapas]; [l[i], l[i + d]] = [l[i + d], l[i]]; void gravar(l); };
  const personalizado = etapas !== ETAPAS_PADRAO && JSON.stringify(etapas) !== JSON.stringify(ETAPAS_PADRAO);

  return (
    <div className="grid gap-4">
      <Origem />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Suas etapas ({etapas.length}){personalizado && <span className="ml-2 rounded-full bg-obra-suave px-2 py-0.5 text-xs text-obra-texto">personalizado</span>}</h2>
        <div className="flex items-center gap-3 text-xs">{(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => <Ponto key={n} cor={NIVEL_ETAPA[n].cor} nome={`${NIVEL_ETAPA[n].nome} ${etapas.filter((e) => e.nivel === n).length}`} />)}
          <Dica texto={<>A cor do número é a classificação da etapa.<br />{(Object.keys(NIVEL_ETAPA) as NivelEtapa[]).map((n) => <span key={n} className="block"><b>{NIVEL_ETAPA[n].nome}:</b> {NIVEL_ETAPA[n].texto}</span>)}Use as setas para mudar a ordem; toque na etapa para editar.</>} /></div>
      </div>
      <ul className="grid gap-2">
        {etapas.map((e, i) => (
          <ItemEtapa key={e.id} e={e} i={i} total={etapas.length} aberto={aberta === e.id} alternar={() => setAberta(aberta === e.id ? null : e.id)}
            mudar={(p) => mudar(e.id, p)} mover={(d) => mover(i, d)} apagar={() => { void gravar(etapas.filter((x) => x.id !== e.id)); avisar('Etapa apagada.'); }} />
        ))}
      </ul>
      <form className="flex gap-2" onSubmit={(ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        const nova: EtapaModelo = { id: novoId(), nome: nome.trim(), nivel: 'intermediaria', tipos: Object.keys(TIPO_OBRA) as TipoObra[], checklist: [] };
        void gravar([...etapas, nova]); setNome(''); setAberta(nova.id);
      }}>
        <Entrada value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Nova etapa (ex.: Fachada ventilada)" aria-label="Nova etapa" />
        <Botao type="submit" variante="obra"><Plus className="size-4" />Etapa</Botao>
      </form>
      {personalizado && <Botao variante="fantasma" className="justify-self-start" onClick={() => setVoltar(true)}><RotateCcw className="size-4" />Voltar ao padrão de consenso</Botao>}
      <Modal aberto={voltar} aoFechar={() => setVoltar(false)} titulo="Voltar ao padrão?">
        <p className="text-texto2">Suas etapas, ordem e checklists personalizados serão trocados pelo padrão de consenso. As obras já criadas não mudam.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={() => setVoltar(false)}>Cancelar</Botao>
          <Botao variante="obra" onClick={async () => { await salvarConfig({ etapasObra: undefined }); setVoltar(false); avisar('Padrão de consenso restaurado.'); }}><RotateCcw className="size-4" />Voltar ao padrão</Botao>
        </div>
      </Modal>
      {el}
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Phone, Trash2, User, X } from 'lucide-react';
import { LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';
import type { UsuarioOrg } from '../../db/organizacao';
import { dataISO, feriadoEm, rotuloFeriado, type Local } from '../../lib/feriados';
import { corDe } from './LegendaFeriados';
import { AreaTexto, Botao, Campo, Entrada, Modal } from '../../componentes/ui';
import { cx } from '../../lib/util';

export interface Agendamento {
  id: string; usuarioId?: string; clienteNome: string; clienteContato: string; endereco: string; tipo: string;
  inicio: string; duracaoMin: number; status: 'marcado' | 'feito' | 'cancelado'; laudoId?: string; observacao: string;
}
export type Rascunho = Omit<Agendamento, 'id'> & { id?: string };

const PASSOS = ['Quem e onde', 'Quando', 'Detalhes'] as const;
const HORAS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DURACOES = [30, 60, 90, 120, 180, 240];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const pad = (n: number) => String(n).padStart(2, '0');
const mascaraTel = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

/** Marcar ou editar uma vistoria em 3 passos curtos. */
export function MarcarVistoria({ inicial, local = {}, admin, pessoas, euId, aoFechar, aoSalvar, aoApagar }: {
  inicial: Rascunho; local?: Local; admin: boolean; pessoas: UsuarioOrg[]; euId?: string;
  aoFechar: () => void; aoSalvar: (a: Rascunho) => Promise<void>; aoApagar?: () => void;
}) {
  const [f, setF] = useState<Rascunho>(inicial);
  const [passo, setPasso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const editando = !!inicial.id;
  const d = new Date(f.inicio);
  const dia = dataISO(d);
  const horaAtual = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const feriado = feriadoEm(dia, local);
  const set = (p: Partial<Rascunho>) => setF((x) => ({ ...x, ...p }));
  const mudarDia = (iso: string) => { const [a, m, dd] = iso.split('-').map(Number); const x = new Date(d); x.setFullYear(a, m - 1, dd); set({ inicio: x.toISOString() }); };
  const mudarHora = (h: string) => { const [hh, mm] = h.split(':').map(Number); const x = new Date(d); x.setHours(hh, mm, 0, 0); set({ inicio: x.toISOString() }); };
  const proximosDias = Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + i); return x; });
  const podeSeguir = passo !== 0 || f.clienteNome.trim().length > 1 || f.endereco.trim().length > 3;
  const salvar = async (extra?: Partial<Rascunho>) => { setSalvando(true); await aoSalvar({ ...f, ...extra }); setSalvando(false); };
  const fim = new Date(d.getTime() + f.duracaoMin * 60e3);

  return (
    <Modal aberto aoFechar={aoFechar} titulo={editando ? 'Editar vistoria' : 'Marcar vistoria'}>
      {/* passos (dá para tocar e pular) */}
      <ol className="mb-4 grid grid-cols-3 gap-1.5">
        {PASSOS.map((p, i) => (
          <li key={p}>
            <button onClick={() => (i <= passo || podeSeguir) && setPasso(i)} className="grid w-full gap-1 text-left">
              <span className={cx('h-1.5 rounded-full transition', i <= passo ? 'bg-obra' : 'bg-sup2')} />
              <span className={cx('text-[11px] font-extrabold', i === passo ? 'text-texto' : 'text-texto3')}>{i + 1}. {p}</span>
            </button>
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <div className="grid gap-3">
          <Campo rotulo="Cliente"><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto3" /><Entrada className="pl-9" value={f.clienteNome} onChange={(e) => set({ clienteNome: e.target.value })} placeholder="Nome de quem vai receber" autoFocus /></div></Campo>
          <Campo rotulo="Telefone ou WhatsApp" ajuda="Com ele, a agenda mostra os botões de WhatsApp e ligar."><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto3" /><Entrada className="pl-9" value={f.clienteContato} onChange={(e) => set({ clienteContato: mascaraTel(e.target.value) })} inputMode="tel" placeholder="(11) 90000-0000" /></div></Campo>
          <Campo rotulo="Endereço"><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-texto3" /><AreaTexto className="pl-9" rows={2} value={f.endereco} onChange={(e) => set({ endereco: e.target.value })} placeholder="Rua, número, bairro, cidade" /></div></Campo>
        </div>
      )}

      {passo === 1 && (
        <div className="grid gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-texto3">Dia</span>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {proximosDias.map((x) => {
                const k = dataISO(x), fe = feriadoEm(k, local), sel = k === dia;
                return (
                  <button key={k} onClick={() => mudarDia(k)} title={fe?.nome}
                    className={cx('relative flex w-14 shrink-0 flex-col items-center rounded-xl border py-1.5 transition', sel ? 'border-[#121A2B] bg-[#121A2B] text-white dark:border-tinta dark:bg-tinta dark:text-[#0E1320]' : 'border-borda bg-sup hover:border-borda-forte')}>
                    <span className={cx('text-[10px] font-bold uppercase', sel ? 'text-white/70' : 'text-texto3')}>{SEMANA[x.getDay()]}</span>
                    <b className="text-lg leading-tight">{x.getDate()}</b>
                    {fe && <span className={cx('absolute right-1 top-1 size-1.5 rounded-full', corDe(fe).ponto)} />}
                  </button>
                );
              })}
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-texto2">Outra data:
              <Entrada type="date" className="h-9 max-w-[180px]" value={dia} onChange={(e) => e.target.value && mudarDia(e.target.value)} />
            </label>
            {feriado && <p className={cx('mt-2 rounded-xl px-3 py-2 text-sm font-bold', corDe(feriado).selo)}>Atenção: {rotuloFeriado(feriado).toLowerCase()} ({feriado.nome}).</p>}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-texto3">Horário</span>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
              {HORAS.map((h) => <button key={h} onClick={() => mudarHora(h)} className={cx('h-9 rounded-lg border text-sm font-bold transition', horaAtual === h ? 'border-obra bg-obra text-[#121A2B]' : 'border-borda bg-sup hover:border-borda-forte')}>{h}</button>)}
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-texto2">Outro horário:
              <Entrada type="time" className="h-9 max-w-[130px]" value={horaAtual} onChange={(e) => e.target.value && mudarHora(e.target.value)} />
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-texto3">Duração</span>
            <div className="grid grid-cols-6 gap-1.5">
              {DURACOES.map((m) => <button key={m} onClick={() => set({ duracaoMin: m })} className={cx('h-9 rounded-lg border text-sm font-bold transition', f.duracaoMin === m ? 'border-obra bg-obra text-[#121A2B]' : 'border-borda bg-sup hover:border-borda-forte')}>{m < 60 ? `${m}m` : `${m / 60}h`}</button>)}
            </div>
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="grid gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-texto3">Tipo de vistoria</span>
            <div className="flex flex-wrap gap-1.5">
              {LISTA_TIPOS.map((t) => <button key={t.id} onClick={() => set({ tipo: t.id })} className={cx('h-9 rounded-full border px-3 text-sm font-bold transition', f.tipo === t.id ? 'border-[#121A2B] bg-[#121A2B] text-white dark:border-tinta dark:bg-tinta dark:text-[#0E1320]' : 'border-borda bg-sup hover:border-borda-forte')}>{t.curto}</button>)}
            </div>
          </div>
          {admin && pessoas.length > 1 && (
            <div>
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-texto3">Quem vai</span>
              <div className="flex flex-wrap gap-1.5">
                {pessoas.map((p) => { const sel = (f.usuarioId ?? euId) === p.id; return <button key={p.id} onClick={() => set({ usuarioId: p.id })} className={cx('h-9 rounded-full border px-3 text-sm font-bold transition', sel ? 'border-obra bg-obra-suave text-obra-texto' : 'border-borda bg-sup hover:border-borda-forte')}>{p.nome}</button>; })}
              </div>
            </div>
          )}
          <Campo rotulo="Observação (opcional)"><AreaTexto rows={2} value={f.observacao} onChange={(e) => set({ observacao: e.target.value })} placeholder="Chave na portaria, falar com o síndico…" /></Campo>
          {/* resumo antes de salvar */}
          <div className="rounded-2xl bg-sup2 p-3 text-sm">
            <b className="block">{f.clienteNome || 'Cliente sem nome'} · {TIPOS[f.tipo as TipoLaudo]?.curto ?? f.tipo}</b>
            <span className="mt-1 flex items-center gap-1 text-texto2"><Clock className="size-3.5" />{d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}, {horaAtual}–{`${pad(fim.getHours())}:${pad(fim.getMinutes())}`}</span>
            {f.endereco && <span className="mt-0.5 flex items-start gap-1 text-texto2"><MapPin className="mt-0.5 size-3.5 shrink-0" />{f.endereco}</span>}
          </div>
          {editando && (
            <div className="flex flex-wrap gap-3 text-sm">
              {f.status !== 'cancelado' && <button onClick={() => salvar({ status: 'cancelado' })} className="flex items-center gap-1 font-bold text-texto2 hover:text-critico-texto"><X className="size-4" />Cancelar visita</button>}
              {aoApagar && <button onClick={aoApagar} className="flex items-center gap-1 font-bold text-texto2 hover:text-critico-texto"><Trash2 className="size-4" />Apagar</button>}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-borda pt-4">
        {passo > 0 ? <Botao variante="fantasma" onClick={() => setPasso(passo - 1)}><ArrowLeft className="size-4" />Voltar</Botao> : <span />}
        {passo < 2
          ? <Botao variante="obra" disabled={!podeSeguir} onClick={() => setPasso(passo + 1)}>Continuar<ArrowRight className="size-4" /></Botao>
          : <Botao variante="obra" carregando={salvando} onClick={() => salvar(f.status === 'cancelado' ? { status: 'marcado' } : undefined)}><Check className="size-4" />{editando ? 'Salvar' : 'Marcar vistoria'}</Botao>}
      </div>
    </Modal>
  );
}

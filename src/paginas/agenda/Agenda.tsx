import { useEffect, useState } from 'react';
import { CalendarCheck2, CalendarPlus, Check, Clock, MapPin, MessageCircle, Phone, RotateCw, Trash2, X } from 'lucide-react';
import { api, logadoNaNuvem } from '../../db/nuvem';
import { listarUsuarios, type UsuarioOrg } from '../../db/organizacao';
import { useSessao } from '../../lib/sessao';
import { LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';
import { AreaTexto, Botao, Campo, Cartao, Entrada, Modal, Vazio, useAviso } from '../../componentes/ui';
import { cx } from '../../lib/util';

/* Agenda de vistorias: quem vai, onde, quando. O admin vê e marca para todos; os demais, a própria. */

interface Agendamento {
  id: string; usuarioId?: string; clienteNome: string; clienteContato: string; endereco: string; tipo: string;
  inicio: string; duracaoMin: number; status: 'marcado' | 'feito' | 'cancelado'; laudoId?: string; observacao: string;
}
const vazio = (): Omit<Agendamento, 'id'> & { id?: string } => {
  const d = new Date(Date.now() + 864e5); d.setHours(9, 0, 0, 0);
  return { clienteNome: '', clienteContato: '', endereco: '', tipo: 'cautelar', inicio: d.toISOString(), duracaoMin: 60, status: 'marcado', observacao: '' };
};
const paraInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const deInput = (v: string) => new Date(v).toISOString();
const telefone = (c: string) => c.replace(/\D/g, '');

function rotuloDia(d: Date) {
  const h = new Date(); const am = new Date(Date.now() + 864e5);
  if (d.toDateString() === h.toDateString()) return 'Hoje';
  if (d.toDateString() === am.toDateString()) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function Agenda() {
  const { usuario } = useSessao();
  const { avisar, el } = useAviso();
  const [lista, setLista] = useState<Agendamento[] | null>(null);
  const [pessoas, setPessoas] = useState<UsuarioOrg[]>([]);
  const [form, setForm] = useState<ReturnType<typeof vazio> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const admin = usuario?.papel === 'admin';

  const carregar = async () => {
    setErro('');
    try {
      const de = new Date(Date.now() - 7 * 864e5).toISOString(), ate = new Date(Date.now() + 120 * 864e5).toISOString();
      setLista((await api<{ agenda: Agendamento[] }>(`/api/agenda?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`)).agenda);
      if (admin) setPessoas((await listarUsuarios()).filter((u) => u.ativo));
    } catch (e) { setErro((e as Error).message); }
  };
  useEffect(() => { if (logadoNaNuvem()) void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (a: ReturnType<typeof vazio>) => {
    setSalvando(true);
    try {
      await api('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) });
      setForm(null); await carregar(); avisar('Agenda salva');
    } catch (e) { avisar((e as Error).message, 'erro'); }
    setSalvando(false);
  };
  const apagar = async (id: string) => { try { await api(`/api/agenda/${id}`, { method: 'DELETE' }); await carregar(); } catch (e) { avisar((e as Error).message, 'erro'); } };

  if (!logadoNaNuvem()) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Vazio icone={<CalendarCheck2 className="size-7" />} titulo="Agenda precisa da conta no servidor" texto="Entre com a sua conta do LaudoTech para marcar vistorias e ver a agenda da equipe." />
    </div>
  );

  const futuros = (lista ?? []).filter((a) => a.status !== 'cancelado' && new Date(a.inicio).getTime() > Date.now() - 6 * 3600e3).sort((x, y) => x.inicio.localeCompare(y.inicio));
  const grupos = new Map<string, Agendamento[]>();
  for (const a of futuros) { const k = rotuloDia(new Date(a.inicio)); grupos.set(k, [...(grupos.get(k) ?? []), a]); }
  const nomePessoa = (id?: string) => pessoas.find((p) => p.id === id)?.nome;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="font-bold text-texto3">{admin ? 'Toda a equipe' : 'Suas vistorias'}</p><h1 className="mt-1 text-3xl font-extrabold md:text-4xl"><span className="grifo">Agenda</span></h1></div>
        <Botao variante="obra" onClick={() => setForm(vazio())}><CalendarPlus className="size-4" />Marcar vistoria</Botao>
      </div>

      {erro ? (
        <Cartao className="mt-6 p-5 text-center"><p className="text-texto2">{erro}</p><Botao className="mt-3" variante="claro" onClick={carregar}><RotateCw className="size-4" />Tentar de novo</Botao></Cartao>
      ) : !lista ? <div className="mt-6 h-40 animate-pulse rounded-2xl bg-sup2" /> : !futuros.length ? (
        <div className="mt-6"><Vazio icone={<CalendarCheck2 className="size-7" />} titulo="Nenhuma vistoria marcada" texto="Marque a próxima vistoria: cliente, endereço, dia e hora. Fica aqui para você e para a equipe." /></div>
      ) : (
        <div className="mt-6 grid gap-6">
          {[...grupos].map(([dia, as]) => (
            <section key={dia}>
              <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-texto3">{dia}</h2>
              <div className="grid gap-2">
                {as.map((a) => {
                  const ini = new Date(a.inicio), fim = new Date(ini.getTime() + a.duracaoMin * 60e3);
                  const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const feito = a.status === 'feito';
                  return (
                    <Cartao key={a.id} className={cx('grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4', feito && 'opacity-60')}>
                      <div className="grid w-16 place-items-center self-start rounded-xl bg-[#121A2B] py-2 text-white">
                        <b className="font-display text-lg leading-none">{hora(ini)}</b><span className="text-[10px] text-white/70">até {hora(fim)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="truncate">{a.clienteNome || 'Cliente sem nome'}</b>
                          <span className="rounded-full bg-obra-suave px-2 py-0.5 text-[11px] font-extrabold text-obra-texto">{TIPOS[a.tipo as TipoLaudo]?.curto ?? a.tipo}</span>
                          {feito && <span className="rounded-full bg-ok-suave px-2 py-0.5 text-[11px] font-extrabold text-ok-texto">Feita</span>}
                        </div>
                        {a.endereco && <a className="mt-1 flex items-start gap-1 text-sm text-texto2 hover:text-tinta" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.endereco)}`}><MapPin className="mt-0.5 size-4 shrink-0" />{a.endereco}</a>}
                        {admin && nomePessoa(a.usuarioId) && <p className="mt-0.5 text-xs text-texto3">Vai: <b className="text-texto2">{nomePessoa(a.usuarioId)}</b></p>}
                        {a.observacao && <p className="mt-1 text-sm text-texto2">{a.observacao}</p>}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {telefone(a.clienteContato).length >= 10 && <>
                            <a className="pilula pilula-clara !min-h-9 !px-3 text-xs" href={`https://wa.me/55${telefone(a.clienteContato)}?text=${encodeURIComponent(`Olá, ${a.clienteNome}! Confirmando a vistoria em ${rotuloDia(ini).toLowerCase()} às ${hora(ini)}.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />Confirmar</a>
                            <a className="pilula pilula-clara !min-h-9 !px-3 text-xs" href={`tel:${telefone(a.clienteContato)}`}><Phone className="size-4" />Ligar</a>
                          </>}
                          {!feito && <Botao tam="p" variante="claro" onClick={() => salvar({ ...a, status: 'feito' })}><Check className="size-4" />Feita</Botao>}
                          <Botao tam="p" variante="fantasma" onClick={() => setForm({ ...a })}>Editar</Botao>
                        </div>
                      </div>
                    </Cartao>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal aberto={!!form} aoFechar={() => setForm(null)} titulo={form?.id ? 'Editar vistoria' : 'Marcar vistoria'}>
        {form && (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Cliente"><Entrada value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} /></Campo>
              <Campo rotulo="Telefone / WhatsApp"><Entrada value={form.clienteContato} onChange={(e) => setForm({ ...form, clienteContato: e.target.value })} inputMode="tel" placeholder="(11) 90000-0000" /></Campo>
            </div>
            <Campo rotulo="Endereço"><Entrada value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro, cidade" /></Campo>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Dia e hora"><Entrada type="datetime-local" value={paraInput(form.inicio)} onChange={(e) => e.target.value && setForm({ ...form, inicio: deInput(e.target.value) })} /></Campo>
              <Campo rotulo="Duração">
                <select value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} className="h-11 rounded-xl border border-borda-forte bg-sup px-3">
                  {[30, 60, 90, 120, 180, 240].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Tipo">
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="h-11 rounded-xl border border-borda-forte bg-sup px-3">
                  {LISTA_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.curto}</option>)}
                </select>
              </Campo>
            </div>
            {admin && pessoas.length > 1 && (
              <Campo rotulo="Quem vai">
                <select value={form.usuarioId ?? usuario?.id} onChange={(e) => setForm({ ...form, usuarioId: e.target.value })} className="h-11 rounded-xl border border-borda-forte bg-sup px-3">
                  {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Campo>
            )}
            <Campo rotulo="Observação"><AreaTexto rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Chave na portaria, falar com o síndico…" /></Campo>
            <div className="mt-1 flex flex-wrap justify-between gap-2">
              {form.id ? <div className="flex gap-1.5">
                <Botao variante="fantasma" onClick={() => salvar({ ...form, status: 'cancelado' })}><X className="size-4" />Cancelar visita</Botao>
                <Botao variante="fantasma" onClick={async () => { await apagar(form.id!); setForm(null); }}><Trash2 className="size-4" />Apagar</Botao>
              </div> : <span className="flex items-center gap-1 text-xs text-texto3"><Clock className="size-3.5" />Aparece para quem vai fazer</span>}
              <Botao variante="obra" carregando={salvando} onClick={() => salvar(form)}>Salvar</Botao>
            </div>
          </div>
        )}
      </Modal>
      {el}
    </div>
  );
}

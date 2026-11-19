import { CheckCircle2, History, Mail, MessageSquareWarning, PenLine, ShieldCheck, UserCog, UserPlus, Users, type LucideIcon } from 'lucide-react';
import type { EventoOrg } from '../../db/organizacao';
import { Recolhivel } from '../../componentes/Wizard';

/* Linha do tempo do registro de atividades: agrupada por dia, um ícone por tipo de ação. */

const TIPO: Record<string, { ic: LucideIcon; cor: string; frase: string; cliente?: boolean }> = {
  'laudo.emitido': { ic: ShieldCheck, cor: 'bg-ok-suave text-ok-texto', frase: 'emitiu um laudo com código de verificação' },
  'usuario.convidado': { ic: Mail, cor: 'bg-obra-suave text-obra-texto', frase: 'convidou uma pessoa para a equipe' },
  'usuario.entrou': { ic: UserPlus, cor: 'bg-ok-suave text-ok-texto', frase: 'entrou na equipe' },
  'usuario.alterado': { ic: UserCog, cor: 'bg-sup2 text-texto2', frase: 'mudou o papel ou o acesso de alguém' },
  'laudo.equipe': { ic: Users, cor: 'bg-sup2 text-texto2', frase: 'mudou quem trabalha num laudo' },
  'obra.equipe': { ic: Users, cor: 'bg-sup2 text-texto2', frase: 'mudou quem trabalha numa obra' },
  'organizacao.alterada': { ic: UserCog, cor: 'bg-sup2 text-texto2', frase: 'alterou os dados da organização' },
  'cliente.aceite': { ic: CheckCircle2, cor: 'bg-ok-suave text-ok-texto', frase: 'aceitou o laudo pelo link', cliente: true },
  'cliente.contestacao': { ic: MessageSquareWarning, cor: 'bg-medio-suave text-medio-texto', frase: 'contestou o laudo pelo link', cliente: true },
  'cliente.comentario': { ic: PenLine, cor: 'bg-sup2 text-texto2', frase: 'comentou pelo link', cliente: true },
  'cliente.reparo': { ic: PenLine, cor: 'bg-obra-suave text-obra-texto', frase: 'pediu reparo pelo link', cliente: true },
  'cliente.aprovacao': { ic: CheckCircle2, cor: 'bg-ok-suave text-ok-texto', frase: 'aprovou pelo link', cliente: true },
};
const PADRAO = { ic: History, cor: 'bg-sup2 text-texto2', frase: '' };

function dia(d: Date) {
  const hoje = new Date(); const ontem = new Date(Date.now() - 864e5);
  const igual = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (igual(d, hoje)) return 'Hoje';
  if (igual(d, ontem)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

export function Atividades({ eventos }: { eventos: EventoOrg[] }) {
  const grupos = new Map<string, EventoOrg[]>();
  for (const e of eventos.slice(0, 60)) {
    const k = dia(new Date(e.criadoEm));
    grupos.set(k, [...(grupos.get(k) ?? []), e]);
  }
  return (
    <Recolhivel className="mt-7" titulo={<span className="flex items-center gap-1.5"><History className="size-4" />Atividades recentes</span>} resumo={`${eventos.length} registro${eventos.length === 1 ? '' : 's'} · quem fez o quê`}>
      <div className="grid gap-5">
        {[...grupos].map(([d, evs]) => (
          <section key={d}>
            <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-texto3">{d}</h3>
            <ol className="relative grid gap-3 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-borda">
              {evs.map((e) => {
                const t = TIPO[e.acao] ?? PADRAO;
                const quem = t.cliente ? (e.detalhe?.nome || 'O cliente') : (e.nome || 'Alguém');
                const Ic = t.ic;
                return (
                  <li key={e.id} className="relative flex items-start gap-3">
                    <span className={`relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-sup ${t.cor}`}><Ic className="size-4" /></span>
                    <p className="min-w-0 flex-1 pt-1 text-sm leading-snug">
                      <b>{quem}</b>{t.cliente && <span className="ml-1 rounded bg-sup2 px-1 py-px text-[10px] font-extrabold uppercase text-texto3">cliente</span>} {t.frase || e.acao}
                    </p>
                    <time className="shrink-0 pt-1 text-xs font-bold tabular-nums text-texto3" dateTime={e.criadoEm}>
                      {new Date(e.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </Recolhivel>
  );
}

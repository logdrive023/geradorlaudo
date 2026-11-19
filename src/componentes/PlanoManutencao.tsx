import { useState } from 'react';
import { CalendarClock, Check, FileSpreadsheet, Plus, Trash2, Wrench } from 'lucide-react';
import { tocarLaudo } from '../db/db';
import type { Foto, Laudo } from '../dominio/modelo';
import { CATALOGO, PERIODO, RESPONSAVEL, criarPlano, gravarPlano, lerPlano, planilhaManutencao, proxima, type ItemManutencao, type Periodicidade, type PlanoManutencao, type Responsavel } from '../dominio/manutencao';
import { Botao, Cartao, Dica } from './ui';
import { baixar, cx, novoId } from '../lib/util';

const hoje = () => new Date().toISOString().slice(0, 10);
const br = (d: string) => d.split('-').reverse().join('/');
const SEL = 'h-9 rounded-lg border border-borda-forte bg-sup px-2 text-xs font-bold text-texto';

/** Plano de manutenção preventiva (NBR 5674): atividades por sistema, periodicidade, responsável e próxima data. */
export function PlanoManutencao({ laudo, fotos, className }: { laudo: Laudo; fotos: Foto[]; className?: string }) {
  const plano = lerPlano(laudo);
  const [aberto, setAberto] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);
  const salvar = (p: PlanoManutencao | null) => tocarLaudo(laudo.id, { dados: { ...laudo.dados, planoManutencao: gravarPlano(p) } });
  const mudar = (id: string, m: Partial<ItemManutencao>) => plano && salvar({ ...plano, itens: plano.itens.map((i) => (i.id === id ? { ...i, ...m } : i)) });

  const titulo = (
    <h3 className="flex items-center gap-1.5 text-lg font-bold"><CalendarClock className="size-5 text-obra" />Plano de manutenção
      <Dica texto={<>Programa de manutenção preventiva da <b>ABNT NBR 5674</b>: o que fazer em cada sistema, de quanto em quanto tempo e por quem (equipe local, empresa capacitada ou especializada). As atividades vêm de uma referência de práticas usuais; ajuste ao manual de uso e manutenção do edifício (NBR 14037) e às recomendações dos fabricantes.</>} />
    </h3>
  );

  if (!plano) return (
    <Cartao className={cx('grid gap-3 p-4', className)}>
      {titulo}
      <p className="text-sm text-texto2">Monte o calendário de manutenção preventiva do imóvel em um toque: {CATALOGO.length} atividades de referência, com destaque nos sistemas onde este laudo encontrou problema. Você ajusta tudo e ele entra no PDF.</p>
      <Botao variante="obra" onClick={() => salvar(criarPlano(fotos, novoId, hoje()))}><Plus className="size-4" />Criar plano de manutenção</Botao>
    </Cartao>
  );

  const ativos = plano.itens.filter((i) => i.ativo);
  const comProx = ativos.map((i) => ({ i, prox: proxima(i, plano.criadoEm) })).sort((a, b) => a.prox.localeCompare(b.prox));
  const atrasados = comProx.filter((x) => x.prox < hoje()).length;
  const mostrar = todos ? plano.itens : plano.itens.filter((i) => i.ativo);
  const nome = laudo.titulo.replace(/[\\/:*?"<>|]/g, '');

  return (
    <Cartao className={cx('grid gap-3 p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {titulo}
        <Botao tam="p" variante="claro" onClick={() => baixar(`${nome} - plano de manutenção.csv`, planilhaManutencao(laudo, plano))}><FileSpreadsheet className="size-4" />Planilha (Excel)</Botao>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-sup2 p-2"><b className="block text-xl">{ativos.length}</b><span className="text-xs font-bold text-texto2">atividades</span></div>
        <div className={cx('rounded-xl p-2', atrasados ? 'bg-critico-suave text-critico-texto' : 'bg-ok-suave text-ok-texto')}><b className="block text-xl">{atrasados}</b><span className="text-xs font-bold">atrasadas</span></div>
        <div className="rounded-xl bg-obra-suave p-2 text-obra-texto"><b className="block text-sm leading-7">{comProx[0] ? br(comProx[0].prox) : '—'}</b><span className="text-xs font-bold">próxima</span></div>
      </div>

      <ul className="grid gap-2">
        {mostrar.map((i) => {
          const prox = proxima(i, plano.criadoEm);
          const atraso = i.ativo && prox < hoje();
          const abre = aberto === i.id;
          return (
            <li key={i.id} className={cx('rounded-2xl border bg-sup', !i.ativo && 'opacity-50', abre ? 'border-borda-forte' : 'border-borda')}>
              <button onClick={() => setAberto(abre ? null : i.id)} aria-expanded={abre} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-3 text-left">
                <span className={cx('mt-0.5 grid size-8 place-items-center rounded-lg', i.destaque ? 'bg-medio-suave text-medio-texto' : 'bg-sup2 text-texto2')}><Wrench className="size-4" /></span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-texto3">{i.sistema}{i.destaque && <span className="rounded bg-medio-suave px-1 normal-case tracking-normal text-medio-texto">achado neste laudo</span>}</span>
                  <b className="block text-sm leading-snug">{i.atividade}</b>
                  <span className="mt-0.5 block text-xs text-texto2">{PERIODO[i.periodicidade].nome} · {RESPONSAVEL[i.responsavel].nome}</span>
                </span>
                <span className={cx('whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-extrabold', atraso ? 'bg-critico-suave text-critico-texto' : 'bg-sup2 text-texto2')}>{atraso ? 'atrasada' : br(prox).slice(0, 5)}</span>
              </button>
              {abre && (
                <div className="grid gap-2 border-t border-borda p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-[11px] font-bold text-texto2">De quanto em quanto tempo
                      <select className={SEL} value={i.periodicidade} onChange={(e) => mudar(i.id, { periodicidade: e.target.value as Periodicidade })}>
                        {(Object.keys(PERIODO) as Periodicidade[]).map((p) => <option key={p} value={p}>{PERIODO[p].nome}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-[11px] font-bold text-texto2">Quem faz
                      <select className={SEL} value={i.responsavel} onChange={(e) => mudar(i.id, { responsavel: e.target.value as Responsavel })} title={RESPONSAVEL[i.responsavel].explica}>
                        {(Object.keys(RESPONSAVEL) as Responsavel[]).map((r) => <option key={r} value={r}>{RESPONSAVEL[r].nome}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-texto3">{RESPONSAVEL[i.responsavel].explica} {i.ultima ? `Última vez: ${br(i.ultima)}.` : ''} Próxima: {br(prox)}.</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Botao tam="p" variante="claro" onClick={() => mudar(i.id, { ultima: hoje() })}><Check className="size-4" />Feito hoje</Botao>
                    <Botao tam="p" variante="fantasma" onClick={() => mudar(i.id, { ativo: !i.ativo })}>{i.ativo ? 'Não se aplica' : 'Voltar ao plano'}</Botao>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => setTodos(!todos)} className="text-sm font-extrabold text-tinta">{todos ? 'Esconder as que não se aplicam' : `Ver as que não se aplicam (${plano.itens.length - ativos.length})`}</button>
        <button onClick={() => { if (confirm('Apagar o plano de manutenção deste laudo?')) void salvar(null); }} className="flex items-center gap-1 text-xs font-bold text-texto3 hover:text-critico-texto"><Trash2 className="size-3.5" />Apagar plano</button>
      </div>
    </Cartao>
  );
}

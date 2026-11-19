import { CalendarHeart } from 'lucide-react';
import { NOME_UF, UFS, cidadesDe, feriadosDoAno, type Local } from '../../lib/feriados';
import { cx } from '../../lib/util';

const CHAVE = 'laudotech.feriados.local';
export function lerLocal(padrao: Local): Local {
  try { const s = localStorage.getItem(CHAVE); if (s) return JSON.parse(s) as Local; } catch { /* modo privado */ }
  return padrao;
}
function gravarLocal(l: Local) { try { localStorage.setItem(CHAVE, JSON.stringify(l)); } catch { /* modo privado */ } }

/** Cor de cada tipo de feriado (a mesma no calendário, nos selos e na legenda). */
export const COR_FERIADO = {
  nacional: { ponto: 'bg-critico', selo: 'bg-critico-suave text-critico-texto' },
  estadual: { ponto: 'bg-[#7c5cff]', selo: 'bg-[#7c5cff]/15 text-[#5b3fd6] dark:text-[#b7a6ff]' },
  municipal: { ponto: 'bg-tinta', selo: 'bg-tinta/10 text-tinta' },
  facultativo: { ponto: 'bg-medio', selo: 'bg-medio-suave text-medio-texto' },
} as const;
export const corDe = (f: { tipo: string; escopo: keyof typeof COR_FERIADO }) => COR_FERIADO[f.tipo === 'facultativo' ? 'facultativo' : f.escopo];

/** Legenda + escolha de onde valem os feriados (UF e cidade). Mostra os próximos feriados do local. */
export function LegendaFeriados({ local, aoMudar }: { local: Local; aoMudar: (l: Local) => void }) {
  const mudar = (l: Local) => { gravarLocal(l); aoMudar(l); };
  const cidades = cidadesDe(local.uf);
  const hoje = new Date().toISOString().slice(0, 10);
  const proximos = [...feriadosDoAno(new Date().getFullYear(), local), ...feriadosDoAno(new Date().getFullYear() + 1, local)].filter((f) => f.data >= hoje).slice(0, 4);
  const SEL = 'h-11 w-full min-w-0 rounded-xl border border-borda-forte bg-sup px-3 text-sm font-bold text-texto outline-none focus:border-tinta';
  return (
    <div className="mt-4 grid gap-3 rounded-2xl border border-borda bg-sup p-4">
      <b className="flex items-center gap-2"><CalendarHeart className="size-5 text-obra" />Feriados na agenda</b>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1 text-[11px] font-extrabold uppercase tracking-wider text-texto3">Estado
          <select className={SEL} value={local.uf ?? ''} onChange={(e) => mudar({ uf: e.target.value || undefined, cidade: undefined })} aria-label="Estado">
            <option value="">Só os nacionais</option>
            {UFS.map((u) => <option key={u} value={u}>{NOME_UF[u]} ({u})</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-extrabold uppercase tracking-wider text-texto3">Cidade
          <select className={SEL} value={local.cidade ?? ''} disabled={!local.uf || !cidades.length} onChange={(e) => mudar({ ...local, cidade: e.target.value || undefined })} aria-label="Cidade">
            <option value="">{!local.uf ? 'Escolha o estado' : cidades.length ? 'Sem feriados municipais' : 'Sem cidade cadastrada'}</option>
            {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-texto2">
        {([['nacional', 'Nacional'], ['estadual', 'Estadual'], ['municipal', 'Municipal'], ['facultativo', 'Ponto facultativo']] as const).map(([k, r]) => (
          <span key={k} className="flex items-center gap-1.5"><span className={cx('size-2.5 rounded-full', COR_FERIADO[k].ponto)} />{r}</span>
        ))}
      </div>
      {proximos.length > 0 && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {proximos.map((f) => (
            <li key={f.data + f.nome} className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2 text-sm">
              <b className="w-12 shrink-0 tabular-nums">{f.data.slice(8)}/{f.data.slice(5, 7)}</b>
              <span className="min-w-0 flex-1 truncate">{f.nome}</span>
              <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold', corDe(f).selo)}>{f.tipo === 'facultativo' ? 'facultativo' : f.escopo}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-texto3">Municipais cadastrados para as capitais. Confira o decreto da sua cidade: as datas podem mudar de um ano para outro.</p>
    </div>
  );
}

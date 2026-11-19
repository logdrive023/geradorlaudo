import { useEffect, useState } from 'react';
import { BookMarked, Search, Trash2 } from 'lucide-react';
import { apagarTexto, listarBiblioteca, type TextoBiblioteca } from '../../db/organizacao';
import { logadoNaNuvem } from '../../db/nuvem';
import { Cartao, SeloGravidade, Vazio, useAviso } from '../../componentes/ui';

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Textos aprovados do escritório: o que é, por quê e o que fazer, prontos para reaproveitar na Conferir. */
export function BibliotecaTextos() {
  const { avisar, el } = useAviso();
  const [textos, setTextos] = useState<TextoBiblioteca[] | null>(null);
  const [busca, setBusca] = useState('');
  useEffect(() => { if (logadoNaNuvem()) listarBiblioteca().then(setTextos).catch(() => setTextos([])); }, []);

  if (!logadoNaNuvem()) return <Vazio icone={<BookMarked className="size-7" />} titulo="Biblioteca precisa da conta no servidor" texto="Entre com a sua conta para guardar textos aprovados e reaproveitar em todos os laudos da equipe." />;
  if (!textos) return <div className="h-40 animate-pulse rounded-2xl bg-sup2" />;

  const termo = normal(busca.trim());
  const vis = termo ? textos.filter((t) => normal([t.tipo, t.sistema, t.descricao, t.recomendacao].join(' ')).includes(termo)) : textos;

  return (
    <div className="grid gap-4">
      <Cartao className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><BookMarked className="size-5 text-obra" />Biblioteca do escritório</h2>
        <p className="mt-1 text-sm text-texto2">Na Conferir, abra um achado em <b>Editar</b> e toque em <b>Salvar este texto na biblioteca</b>. Depois é só escolher o texto salvo para preencher outro achado. Os mais usados aparecem primeiro.</p>
      </Cartao>
      {textos.length === 0 ? (
        <Vazio icone={<BookMarked className="size-7" />} titulo="Nenhum texto salvo ainda" texto="Salve os textos que você aprova com frequência; a equipe toda passa a usar o mesmo padrão." />
      ) : (
        <>
          <label className="flex h-11 items-center rounded-xl border border-borda-forte bg-sup focus-within:border-tinta">
            <Search className="ml-3 size-4 shrink-0 text-texto3" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por tipo, sistema ou texto…" className="h-full w-full min-w-0 bg-transparent px-2.5 text-sm outline-none" />
          </label>
          <div className="grid gap-2">
            {vis.map((t) => (
              <Cartao key={t.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{t.tipo}</b><SeloGravidade g={t.gravidade} />{t.sistema && <span className="text-xs text-texto3">{t.sistema}</span>}
                  <span className="ml-auto text-xs text-texto3">usado {t.usos}×</span>
                  <button aria-label="Apagar texto" onClick={async () => { try { await apagarTexto(t.id); setTextos(textos.filter((x) => x.id !== t.id)); avisar('Texto apagado'); } catch (e) { avisar((e as Error).message, 'erro'); } }}
                    className="grid size-8 place-items-center rounded-lg text-texto3 hover:bg-critico-suave hover:text-critico-texto"><Trash2 className="size-4" /></button>
                </div>
                {[['O que é', t.descricao], ['Por quê', t.causaProvavel], ['O que fazer', t.recomendacao]].filter(([, v]) => v).map(([r, v]) => (
                  <p key={r} className="text-sm"><span className="mr-1 text-[11px] font-extrabold uppercase tracking-wider text-texto3">{r}</span>{v}</p>
                ))}
              </Cartao>
            ))}
          </div>
        </>
      )}
      {el}
    </div>
  );
}

import { useState } from 'react';
import { AlertTriangle, Calendar, Camera, ChevronLeft, ChevronRight, Clock, MapPin, ScanSearch, User, Wrench } from 'lucide-react';
import { GRAVIDADE, type Achado, type Foto, type Gravidade, type Laudo, type Usuario } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { achadosValidos, porAmbiente, resumoAchados } from '../dominio/regras';
import { Cartao, Modal, SeloGravidade } from '../componentes/ui';
import { FotoMarcada } from '../componentes/FotoMarcada';
import { cx, dataBR, dois } from '../lib/util';

/**
 * O laudo para LER na tela (principalmente no celular): resumo, achados por prioridade,
 * dados do imóvel e as fotos grandes. As folhas A4 continuam sendo o documento oficial.
 */
export function Leitura({ laudo, fotos, autor, semConclusao, aoConferir }: { laudo: Laudo; fotos: Foto[]; autor?: Usuario; semConclusao?: boolean; aoConferir?: (fotoId: string) => void }) {
  const t = TIPOS[laudo.tipo];
  const d = laudo.dados;
  const r = resumoAchados(fotos);
  const [aberta, setAberta] = useState<number | null>(null);
  const numero = new Map(fotos.map((f, i) => [f.id, i]));
  const itens = fotos.flatMap((f) => achadosValidos(f).map((a) => ({ f, a })));
  const campos = t.secoes.flatMap((s) => s.campos).filter((c) => d[c.chave]?.trim() && c.tipo !== 'area');
  const textos = t.secoes.flatMap((s) => s.campos).filter((c) => d[c.chave]?.trim() && c.tipo === 'area');
  const foto = aberta !== null ? fotos[aberta] : undefined;

  // filtros do relatório fotográfico: todas, cada ambiente, com achados e críticos
  const [filtroFoto, setFiltroFoto] = useState('todas');
  const [filtroGrau, setFiltroGrau] = useState<'todos' | Gravidade>('todos');
  const comAchados = fotos.filter((f) => achadosValidos(f).length > 0);
  const comCriticos = fotos.filter((f) => achadosValidos(f).some((a) => a.gravidade === 'critico'));
  const filtrosFoto: { id: string; rotulo: string; n: number; fotos: Foto[]; critico?: boolean }[] = [
    { id: 'todas', rotulo: 'Todas', n: fotos.length, fotos },
    ...porAmbiente(fotos).map(([amb, fs]) => ({ id: `amb:${amb}`, rotulo: amb, n: fs.length, fotos: fs })),
    ...(comAchados.length ? [{ id: 'achados', rotulo: 'Com achados', n: comAchados.length, fotos: comAchados }] : []),
    ...(comCriticos.length ? [{ id: 'criticos', rotulo: 'Críticos', n: comCriticos.length, fotos: comCriticos, critico: true }] : []),
  ];
  const fotosFiltradas = filtrosFoto.find((x) => x.id === filtroFoto)?.fotos ?? fotos;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      {/* capa resumida */}
      <Cartao className="overflow-hidden">
        <div className="fita h-1.5" aria-hidden />
        <div className="p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-obra-texto">{t.nome}</span>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight">{laudo.titulo}</h2>
          <ul className="mt-3 grid gap-1.5 text-sm text-texto2">
            {d.endereco && <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{[d.endereco, d.cidadeUf].filter(Boolean).join(' — ')}</li>}
            {d.dataVistoria && <li className="flex gap-2"><Calendar className="mt-0.5 size-4 shrink-0" />Vistoria em {dataBR(d.dataVistoria)}</li>}
            {autor && <li className="flex gap-2"><User className="mt-0.5 size-4 shrink-0" />{autor.nome}{autor.registro && ` · ${autor.registro}`}</li>}
          </ul>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-sup2 p-2"><b className="block font-display text-2xl">{fotos.length}</b><span className="text-[11px] font-bold text-texto2">fotos</span></div>
            {(['critico', 'medio', 'minimo'] as Gravidade[]).map((g) => (
              <div key={g} className={cx('rounded-xl p-2', { critico: 'bg-critico-suave text-critico-texto', medio: 'bg-medio-suave text-medio-texto', minimo: 'bg-minimo-suave text-minimo-texto' }[g])}>
                <b className="block font-display text-2xl">{r[g]}</b><span className="text-[11px] font-bold">{GRAVIDADE[g].nome.toLowerCase()}{r[g] !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </Cartao>

      {/* achados por prioridade, com filtro */}
      <Cartao className="p-5">
        <h3 className="text-lg font-bold">Achados por prioridade</h3>
        {itens.length === 0 ? <p className="mt-2 text-texto2">Nenhuma anomalia aceita até agora.</p> : (
          <>
            <div className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" role="tablist" aria-label="Filtrar por grau">
              {(['todos', 'critico', 'medio', 'minimo'] as const).map((g) => {
                const n = g === 'todos' ? itens.length : itens.filter((x) => x.a.gravidade === g).length;
                if (g !== 'todos' && !n) return null;
                const cor = g === 'todos' ? '' : { critico: 'bg-critico-suave text-critico-texto', medio: 'bg-medio-suave text-medio-texto', minimo: 'bg-minimo-suave text-minimo-texto' }[g];
                return (
                  <button key={g} role="tab" aria-selected={filtroGrau === g} onClick={() => setFiltroGrau(g)}
                    className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition',
                      filtroGrau === g ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : cor || 'bg-sup2 text-texto2')}>
                    {g === 'todos' ? 'Todos' : GRAVIDADE[g].nome}<span className={cx('text-xs', filtroGrau === g ? 'text-obra' : 'opacity-70')}>{n}</span>
                  </button>
                );
              })}
            </div>
            <ExplicacaoGrau g={filtroGrau} className="mt-3" />
            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
              {itens
                .filter((x) => filtroGrau === 'todos' || x.a.gravidade === filtroGrau)
                .sort((x, y) => ORDEM_G[x.a.gravidade] - ORDEM_G[y.a.gravidade])
                .map(({ f, a }) => <ItemAchado key={a.id} f={f} a={a} n={numero.get(f.id)! + 1} aoAbrir={() => setAberta(numero.get(f.id)!)} />)}
            </div>
          </>
        )}
      </Cartao>

      {/* dados, separados pelas seções do padrão do laudo */}
      {campos.length + textos.length > 0 && (
        <Cartao className="p-5">
          <h3 className="text-lg font-bold">Dados {t.foco === 'documento' ? 'da análise' : 'do imóvel e da vistoria'}</h3>
          <div className="mt-3 grid gap-4">
            {t.secoes.map((sec) => {
              const preenchidos = sec.campos.filter((c) => d[c.chave]?.trim());
              if (!preenchidos.length) return null;
              return (
                <section key={sec.titulo} className="rounded-2xl bg-sup2 p-3.5">
                  <h4 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-obra-texto">{sec.titulo}</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {preenchidos.map((c) => {
                      const v = c.tipo === 'data' ? dataBR(d[c.chave]) : d[c.chave];
                      const longo = c.tipo === 'area' || c.largo || v.length > 26;
                      return (
                        <div key={c.chave} className={cx('min-w-0', longo && 'col-span-2')}>
                          <dt className="text-xs font-bold text-texto3">{c.rotulo}</dt>
                          <dd className={cx('break-words text-[15px] font-semibold leading-snug', c.tipo === 'area' && 'whitespace-pre-line font-normal text-texto2')}>{v}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              );
            })}
          </div>
        </Cartao>
      )}

      {/* relatório fotográfico com filtros */}
      <Cartao className="p-5">
        <h3 className="text-lg font-bold">Relatório fotográfico</h3>
        {fotos.length > 0 && (
          <div className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" role="tablist" aria-label="Filtrar fotos">
            {filtrosFoto.map((fl) => (
              <button key={fl.id} role="tab" aria-selected={filtroFoto === fl.id} onClick={() => setFiltroFoto(fl.id)}
                className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold transition',
                  filtroFoto === fl.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : fl.critico ? 'bg-critico-suave text-critico-texto' : 'bg-sup2 text-texto2 hover:text-texto')}>
                {fl.rotulo}<span className={cx('text-xs', filtroFoto === fl.id ? 'text-obra' : 'opacity-70')}>{fl.n}</span>
              </button>
            ))}
          </div>
        )}
        {(filtroFoto === 'todas' ? porAmbiente(fotos) : [[filtrosFoto.find((x) => x.id === filtroFoto)?.rotulo ?? '', fotosFiltradas] as [string, Foto[]]]).map(([amb, fs]) => (
          <div key={amb} className="mt-4">
            {filtroFoto === 'todas' && <h4 className="mb-2 text-sm font-extrabold text-texto2">{amb} <span className="font-bold text-texto3">· {fs.length}</span></h4>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fs.map((f) => (
                <button key={f.id} onClick={() => setAberta(numero.get(f.id)!)} className="overflow-hidden rounded-xl border border-borda text-left">
                  <div className="relative"><FotoMarcada foto={f} achados={achadosValidos(f)} /><span className="absolute left-1.5 top-1.5 rounded-md bg-[#121A2B]/80 px-1.5 text-[11px] font-extrabold text-white">{dois(numero.get(f.id)! + 1)}</span></div>
                  <p className="line-clamp-2 p-2 text-xs text-texto2">{f.analise?.legenda || f.nomeArquivo}</p>
                </button>
              ))}
            </div>
            {!fs.length && <p className="text-sm text-texto3">Nenhuma foto neste filtro.</p>}
          </div>
        ))}
        {!fotos.length && <p className="mt-2 text-texto2">Sem fotos ainda.</p>}
      </Cartao>

      {!semConclusao && <Cartao className="p-5">
        <h3 className="text-lg font-bold">Conclusão</h3>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-texto2">{laudo.conclusao || 'Ainda não escrita.'}</p>
      </Cartao>}

      {/* foto em tela cheia */}
      <Modal aberto={!!foto} aoFechar={() => setAberta(null)} titulo={foto ? `Foto ${dois(aberta! + 1)} · ${foto.analise?.ambiente ?? ''}` : ''} largura="max-w-3xl">
        {foto && (
          <div className="grid gap-3">
            <FotoMarcada foto={foto} achados={achadosValidos(foto)} grande className="rounded-xl" />
            <p className="font-semibold">{foto.analise?.legenda}</p>
            {achadosValidos(foto).map((a, i) => (
              <div key={a.id} className="rounded-xl bg-sup2 p-3 text-sm">
                <div className="flex items-center gap-2"><b>{i + 1}. {a.tipo}</b><SeloGravidade g={a.gravidade} /></div>
                <p className="mt-1 text-texto2">{a.descricao}</p>
                {a.recomendacao && <p className="mt-1"><b>Recomendação:</b> {a.recomendacao}</p>}
              </div>
            ))}
            {foto.observacao && <p className="text-sm text-texto2"><b>Observação:</b> {foto.observacao}</p>}
            {aoConferir && (
              <button onClick={() => { const id = foto.id; setAberta(null); aoConferir(id); }} className="pilula pilula-obra w-full">
                <ScanSearch className="size-5" />Conferir / editar esta foto
              </button>
            )}
            <div className="flex justify-between">
              <button disabled={aberta === 0} onClick={() => setAberta(aberta! - 1)} className="flex h-10 items-center gap-1 rounded-xl px-3 font-bold text-texto2 hover:bg-sup2 disabled:opacity-30"><ChevronLeft className="size-5" />Anterior</button>
              <button disabled={aberta === fotos.length - 1} onClick={() => setAberta(aberta! + 1)} className="flex h-10 items-center gap-1 rounded-xl px-3 font-bold text-texto2 hover:bg-sup2 disabled:opacity-30">Próxima<ChevronRight className="size-5" /></button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const ORDEM_G: Record<Gravidade, number> = { critico: 0, medio: 1, minimo: 2 };
const ESTILO_G: Record<Gravidade, { barra: string; caixa: string; ic: typeof AlertTriangle }> = {
  critico: { barra: 'bg-critico', caixa: 'bg-critico-suave text-critico-texto', ic: AlertTriangle },
  medio: { barra: 'bg-medio', caixa: 'bg-medio-suave text-medio-texto', ic: Clock },
  minimo: { barra: 'bg-minimo', caixa: 'bg-minimo-suave text-minimo-texto', ic: Wrench },
};

/** O que cada grau significa: um quadro só. Em "Todos", os 3 graus compactos; num grau, só ele. */
function ExplicacaoGrau({ g, className }: { g: 'todos' | Gravidade; className?: string }) {
  const lista = g === 'todos' ? (['critico', 'medio', 'minimo'] as Gravidade[]) : [g];
  return (
    <div className={cx('overflow-hidden rounded-2xl border border-borda', className)}>
      {lista.map((x) => {
        const e = ESTILO_G[x];
        const Ic = e.ic;
        return (
          <div key={x} className={cx('flex items-start gap-3 border-b border-borda p-3 last:border-0', e.caixa)}>
            <span className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-white', e.barra)}><Ic className="size-4" /></span>
            <div className="min-w-0 text-sm leading-snug">
              <b>{GRAVIDADE[x].nome} · {GRAVIDADE[x].prioridade}</b>
              <span className="block opacity-90">{GRAVIDADE[x].texto}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Recorte com zoom na área do achado (quando a IA marcou onde está). */
function Recorte({ f, a }: { f: Foto; a: Achado }) {
  const r = a.regiao;
  const zoom = r ? Math.min(3, Math.max(1, 70 / Math.max(r.w, r.h))) : 1;
  return (
    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-[#0b1220] sm:w-28">
      <div className="absolute inset-0" style={r ? { transform: `scale(${zoom})`, transformOrigin: `${r.x + r.w / 2}% ${r.y + r.h / 2}%` } : undefined}>
        <FotoMarcada foto={f} achados={[a]} className="!absolute inset-0 !aspect-auto size-full" />
      </div>
    </div>
  );
}

/** Um achado na leitura: recorte da anomalia, grau, onde está, o que é e o que fazer. */
function ItemAchado({ f, a, n, aoAbrir }: { f: Foto; a: Achado; n: number; aoAbrir: () => void }) {
  return (
    <button onClick={aoAbrir} className="flex gap-3 rounded-2xl border border-borda bg-sup p-2.5 text-left transition hover:border-borda-forte hover:shadow-[0_6px_18px_rgba(18,26,43,.06)]">
      <Recorte f={f} a={a} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <b className="leading-tight">{a.tipo}</b>
          <SeloGravidade g={a.gravidade} className="shrink-0" />
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-texto3"><Camera className="size-3.5" />Foto {dois(n)} · {f.analise?.ambiente}{a.sistema ? ` · ${a.sistema}` : ''}</span>
        {a.descricao && <p className="line-clamp-2 text-sm text-texto2">{a.descricao}</p>}
        {a.recomendacao && <p className="mt-auto line-clamp-2 rounded-lg bg-sup2 px-2 py-1 text-xs text-texto"><b>Fazer:</b> {a.recomendacao}</p>}
      </div>
    </button>
  );
}

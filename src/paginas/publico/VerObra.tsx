import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CalendarDays, FileWarning, HardHat, ShieldCheck, Users } from 'lucide-react';
import { abrirObraPublica, type ObraPublica } from '../../db/nuvem';
import { CLIMA, STATUS_OBRA, prazoObra, resumoObra, situacaoEtapa } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { Carregando, Cartao, Logo, Selo, useUrl } from '../../componentes/ui';
import { BarraDupla, Indicador } from '../../componentes/Pecas';
import { dataBR } from '../../lib/util';

function Mini({ b }: { b?: Blob }) {
  const u = useUrl(b);
  return <div className="aspect-square overflow-hidden rounded-xl bg-sup2">{u && <img src={u} alt="" className="size-full object-cover" />}</div>;
}

/** Portal do cliente: acompanha a obra pelo link, sem conta. */
export function VerObra() {
  const { token = '' } = useParams();
  const [d, setD] = useState<ObraPublica | null>(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let vivo = true;
    abrirObraPublica(token).then((x) => { if (vivo) setD(x); }).catch((e: Error) => { if (vivo) setErro(e.message); });
    return () => { vivo = false; };
  }, [token]);
  useEffect(() => { if (d) document.title = `${d.obra.nome} · LaudoTech`; }, [d]);

  if (erro) return (
    <div className="grid min-h-dvh place-items-center bg-papel px-4">
      <div className="grid max-w-sm justify-items-center gap-3 text-center">
        <FileWarning className="size-10 text-obra" />
        <h1 className="text-2xl font-extrabold">Não deu para abrir esta obra</h1>
        <p className="text-texto2">{erro} Peça um link novo ao responsável.</p>
        <Link to="/" className="font-bold text-tinta underline-offset-2 hover:underline">Conhecer o LaudoTech</Link>
      </div>
    </div>
  );
  if (!d) return <Carregando texto="Abrindo a obra…" />;
  const o = d.obra;
  const r = resumoObra(o);
  const p = prazoObra(o);
  const dias = [...o.diarios].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="min-h-dvh bg-papel">
      <header className="sticky top-0 z-20 border-b border-borda bg-sup/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3"><Logo tam={28} /><Selo tom={STATUS_OBRA[o.status].tom}>{STATUS_OBRA[o.status].nome}</Selo></div>
      </header>
      <main className="mx-auto grid max-w-3xl gap-4 px-4 py-5 pb-16">
        <section className="rounded-[22px] bg-[#121A2B] p-5 text-white">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.14em] text-obra"><HardHat className="size-4" />Acompanhamento da obra</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight">{o.nome}</h1>
          {o.endereco && <p className="mt-1 text-white/75">{o.endereco}</p>}
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-sm"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-obra" />
            <span>Responsável técnico: <b>{d.autor.nome || '—'}</b>{d.autor.registro && <> · {d.autor.registro}</>}{d.autor.telefone && <> · {d.autor.telefone}</>}</span></p>
        </section>

        <Cartao className="grid gap-3 p-4">
          <div className="flex items-baseline justify-between"><h2 className="text-lg font-bold">Avanço</h2><span className="font-display text-3xl font-extrabold">{r.fisico}%</span></div>
          <BarraDupla real={r.fisico} previsto={r.previsto} />
          <div className="grid grid-cols-3 gap-2">
            <Indicador valor={p ? Math.max(0, p.restantes) : '—'} rotulo="dias para o fim" />
            <Indicador valor={o.etapas.filter((e) => e.percentual >= 100).length} rotulo="etapas concluídas" tom="ok" />
            <Indicador valor={o.diarios.length} rotulo="dias registrados" />
          </div>
          {p && <p className="flex items-center gap-1.5 text-xs text-texto3"><CalendarDays className="size-3.5" />Previsão: {dataBR(o.inicio)} a {dataBR(o.fim)}</p>}
        </Cartao>

        {o.etapas.length > 0 && (
          <Cartao className="grid gap-2 p-4">
            <h2 className="text-lg font-bold">Etapas</h2>
            {o.etapas.map((e) => (
              <div key={e.id} className="grid gap-1">
                <div className="flex justify-between gap-2 text-sm"><b className="truncate">{e.nome}</b><span className="text-texto2">{e.percentual}%{situacaoEtapa(e) === 'atrasada' && ' · atrasada'}</span></div>
                <BarraDupla real={e.percentual} className="h-2" />
              </div>
            ))}
          </Cartao>
        )}

        {d.financeiro && r.fin.orcado > 0 && (
          <Cartao className="grid gap-2 p-4">
            <h2 className="text-lg font-bold">Financeiro</h2>
            <div className="grid grid-cols-2 gap-2"><Indicador valor={reais(r.fin.orcado)} rotulo="orçado" /><Indicador valor={reais(r.fin.realizado)} rotulo="realizado" tom="obra" /></div>
          </Cartao>
        )}

        <h2 className="mt-2 text-lg font-bold">Diário da obra</h2>
        {dias.length === 0 ? <p className="text-texto2">Ainda não há dias registrados.</p> : dias.map((dia) => {
          const equipe = dia.equipe.reduce((s, x) => s + x.qtd, 0);
          return (
            <Cartao key={dia.id} className="grid gap-2 p-4">
              <div className="flex items-center justify-between gap-2"><b>{dataBR(dia.data)} {CLIMA[dia.clima.manha].emoji} {CLIMA[dia.clima.tarde].emoji}</b><span className="flex items-center gap-1 text-xs text-texto2"><Users className="size-3.5" />{equipe} na obra</span></div>
              {dia.atividades && <p className="whitespace-pre-line text-sm">{dia.atividades}</p>}
              {dia.ocorrencias && <p className="whitespace-pre-line rounded-xl bg-medio-suave p-2.5 text-sm text-medio-texto"><b>Ocorrências:</b> {dia.ocorrencias}</p>}
              {dia.fotoIds.length > 0 && <div className="grid grid-cols-4 gap-2">{dia.fotoIds.filter((f) => d.fotos.has(f)).map((f) => <Mini key={f} b={d.fotos.get(f)} />)}</div>}
            </Cartao>
          );
        })}
        <p className="text-center text-xs text-texto3">Compartilhado pelo responsável técnico via LaudoTech. Somente leitura.</p>
      </main>
    </div>
  );
}

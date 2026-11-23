import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CalendarClock, Camera, CheckCircle2, ExternalLink, Package, RotateCw, Sparkles } from 'lucide-react';
import { comprarFotos, lerFotos, ouvirPlano, type InfoFotos } from '../../db/organizacao';
import { logadoNaNuvem } from '../../db/nuvem';
import { PACOTES, milhar, porFoto, precoBR } from '../../dominio/planos';
import { Botao, Cartao, Dica, useAviso } from '../../componentes/ui';
import { cx } from '../../lib/util';
import { HistoricoCobranca } from './HistoricoCobranca';
import { AjudaPlano } from './AjudaPlano';
import { MolduraTransicao } from '../../componentes/MolduraTransicao';
import { CenaCarregando } from '../../componentes/CenaCarregando';

type Parte = 'uso' | 'cobranca' | 'ajuda';

const proximoMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
};

/** Plano e fotos com IA: quanto já usou no mês, saldo dos pacotes e compra de mais fotos (só o admin compra). */
export function PlanoFotos({ admin }: { admin: boolean }) {
  // a parte fica no endereço (/plano?parte=cobranca): dá para mandar o link e o voltar do navegador funciona
  const [busca, setBusca] = useSearchParams();
  const pedida = busca.get('parte') as Parte | null;
  const parte: Parte = pedida === 'ajuda' || (pedida === 'cobranca' && admin) ? pedida : 'uso';
  const setParte = (p: Parte) => setBusca(p === 'uso' ? {} : { parte: p }, { replace: true });
  const abrirTroca = busca.get('trocar') === '1';
  const [info, setInfo] = useState<InfoFotos | null>(null);
  const [erro, setErro] = useState('');
  const [comprando, setComprando] = useState<string | null>(null);
  const { avisar, el } = useAviso();
  const carregar = (forcar = false) => { setErro(''); lerFotos(forcar).then(setInfo).catch((e) => setErro((e as Error).message)); };
  useEffect(() => { if (logadoNaNuvem()) carregar(true); return ouvirPlano(() => carregar(true)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!logadoNaNuvem()) return <Cartao className="p-5 text-sm text-texto2">Entre com a sua conta para ver o seu plano e as fotos com IA do mês.</Cartao>;
  if (erro) return (
    <Cartao className="grid justify-items-center gap-3 p-6 text-center">
      <p className="text-texto2">{erro}</p>
      <Botao variante="claro" onClick={() => carregar(true)}><RotateCw className="size-4" />Tentar de novo</Botao>
    </Cartao>
  );
  if (!info) return <CenaCarregando texto="Abrindo o seu plano…" />;

  const { cota, plano } = info;
  const semLimite = cota.restam < 0;
  const doPlano = Math.min(cota.usadas, cota.fotosMes);
  const pct = semLimite || !cota.fotosMes ? 0 : Math.min(100, Math.round((doPlano / cota.fotosMes) * 100));
  const acabou = !semLimite && cota.restam === 0;
  const pouco = !semLimite && !acabou && cota.restam <= Math.max(30, cota.fotosMes * 0.1);
  const pendentes = info.pedidos.filter((p) => p.status === 'pendente');

  const comprar = async (id: string) => {
    setComprando(id);
    try {
      const r = await comprarFotos(id);
      if (r.link) { window.open(r.link, '_blank', 'noopener'); avisar('Pague pelo link que abriu. As fotos entram sozinhas assim que o pagamento confirmar.'); }
      else avisar(r.aviso ?? 'Pedido registrado.');
      carregar(true);
    } catch (e) { avisar((e as Error).message, 'erro'); }
    setComprando(null);
  };

  const partes: { id: Parte; t: string }[] = [{ id: 'uso', t: 'Uso' }, ...(admin ? [{ id: 'cobranca' as Parte, t: 'Cobrança' }] : []), { id: 'ajuda', t: 'Ajuda' }];
  return (
    <>
    {/* trocar de aba usa a mesma moldura de carregamento da troca de tela */}
    <MolduraTransicao chave={parte} />
    {/* três partes curtas: quanto usou, quanto paga, e ajuda */}
    <div className="mb-4 inline-flex rounded-full bg-sup p-1 ring-1 ring-borda" role="tablist" aria-label="Plano">
      {partes.map((p) => (
        <button key={p.id} role="tab" aria-selected={parte === p.id} onClick={() => setParte(p.id)}
          className={cx('h-9 rounded-full px-4 text-sm font-extrabold transition', parte === p.id ? 'bg-obra text-[#121A2B]' : 'text-texto2 hover:text-texto')}>{p.t}</button>
      ))}
    </div>
    {parte === 'cobranca' && admin && <HistoricoCobranca irAjuda={() => setParte('ajuda')} abrirTroca={abrirTroca} />}
    {parte === 'ajuda' && <AjudaPlano />}
    {parte === 'uso' && <>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {el}
      <div className="grid content-start gap-4">
        {/* uso do mês */}
        <Cartao className="grid gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">Seu plano</span>
              <h2 className="font-display text-2xl font-extrabold">{plano.nome}{plano.precoCentavos > 0 && <span className="ml-2 text-base font-bold text-texto2">{precoBR(plano.precoCentavos / 100)}/mês</span>}</h2>
              {plano.id === 'teste' && <p className="text-sm text-texto2">Fase de testes: sem cobrança.</p>}
            </div>
            <span className={cx('rounded-full px-3 py-1 text-xs font-extrabold', acabou ? 'bg-critico-suave text-critico-texto' : pouco ? 'bg-medio-suave text-medio-texto' : 'bg-ok-suave text-ok-texto')}>
              {acabou ? 'fotos do mês acabaram' : pouco ? 'restam poucas' : 'tudo certo'}
            </span>
          </div>

          <div className="grid gap-2">
            <div className="flex items-end justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-texto2"><Sparkles className="size-4 text-obra" />Fotos com IA neste mês
                <Dica texto="Conta cada foto analisada pela IA do servidor. Com 2 IAs ligadas, cada foto conta 2. Fotos sem IA (diário de obra, logo, capa) não contam. Laudos são ilimitados." />
              </span>
              <b className="font-display text-xl tabular-nums">{semLimite ? milhar(cota.usadas) : `${milhar(doPlano)} de ${milhar(cota.fotosMes)}`}</b>
            </div>
            {!semLimite && (
              <div className="h-3 overflow-hidden rounded-full bg-sup2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Fotos do plano usadas">
                <div className={cx('h-full rounded-full transition-all', acabou ? 'bg-critico' : pouco ? 'bg-medio' : 'bg-obra')} style={{ width: `${pct}%` }} />
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto2">
              {!semLimite && <span>Restam <b className="text-texto">{milhar(cota.restam)}</b> fotos</span>}
              {cota.extras > 0 && <span className="flex items-center gap-1"><Package className="size-3.5 text-obra" /><b className="text-texto">{milhar(cota.extras)}</b> de pacotes guardadas</span>}
              <span className="flex items-center gap-1"><CalendarClock className="size-3.5" />Renova em {proximoMes()}</span>
            </div>
          </div>
          {acabou && <p className="rounded-xl bg-critico-suave px-3 py-2.5 text-sm text-critico-texto">As fotos novas ficam na fila e são analisadas quando você comprar um pacote ou no começo do mês que vem. Nada se perde.</p>}
        </Cartao>

        {/* pacotes */}
        <Cartao className="grid gap-3 p-5">
          <div>
            <h3 className="flex items-center gap-1.5 text-lg font-bold"><Package className="size-5 text-obra" />Precisa de mais fotos?</h3>
            <p className="text-sm text-texto2">Pacotes extras não vencem no fim do mês: só são usados depois que as do plano acabam.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PACOTES.map((p) => (
              <div key={p.id} className="grid gap-2 rounded-2xl border border-borda bg-sup p-4">
                <span className="flex items-center gap-2"><Camera className="size-5 text-obra" /><b className="font-display text-2xl">{milhar(p.fotos)}</b><span className="text-sm text-texto2">fotos</span></span>
                <span className="text-sm"><b className="text-lg">{precoBR(p.preco)}</b> <span className="text-texto3">· {porFoto(p)} por foto</span></span>
                <span className="text-xs text-texto3">uns {Math.round(p.fotos / 60)} laudos</span>
                {admin
                  ? <Botao variante={p.id === 'p250' ? 'obra' : 'claro'} carregando={comprando === p.id} disabled={!!comprando} onClick={() => comprar(p.id)}>Comprar</Botao>
                  : <span className="rounded-xl bg-sup2 px-3 py-2 text-center text-xs font-bold text-texto2">Peça ao admin do escritório</span>}
              </div>
            ))}
          </div>
          {!info.compraLigada && admin && <p className="text-xs text-texto3">Nesta fase a gente envia o Pix e libera as fotos assim que o pagamento cair.</p>}
        </Cartao>
      </div>

      <aside className="grid content-start gap-4">
        <Cartao className="grid gap-2 p-4">
          <h3 className="font-bold">O que o seu plano inclui</h3>
          <ul className="grid gap-1.5 text-sm text-texto2">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />{plano.fotosMes ? `${milhar(plano.fotosMes)} fotos com IA por mês` : 'Fotos com IA sem limite'}</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />Laudos ilimitados</li>
            <li className="flex gap-2"><CheckCircle2 className={cx('mt-0.5 size-4 shrink-0', plano.obras ? 'text-ok' : 'text-texto3')} />{plano.obras ? 'Gestão de obras' : 'Sem gestão de obras (só no Completo)'}</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />{plano.usuariosMax ? `Até ${plano.usuariosMax} ${plano.usuariosMax === 1 ? 'pessoa' : 'pessoas'}` : 'Pessoas sem limite'}</li>
          </ul>
          {admin
            ? <button onClick={() => setBusca({ parte: 'cobranca', trocar: '1' }, { replace: true })} className="pilula pilula-obra mt-2 w-full">Trocar de plano</button>
            : <Link to="/#planos" className="mt-1 text-sm font-extrabold text-tinta">Ver todos os planos</Link>}
        </Cartao>

        {!admin && info.pedidos.length > 0 && (
          <Cartao className="grid gap-2 p-4">
            <h3 className="font-bold">Pacotes pedidos</h3>
            <ul className="grid gap-2">
              {info.pedidos.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-sup2 px-3 py-2 text-sm">
                  <span><b>{milhar(p.fotos)} fotos</b><span className="block text-xs text-texto3">{new Date(p.criadoEm).toLocaleDateString('pt-BR')} · {precoBR(p.valorCentavos / 100)}</span></span>
                  {p.status === 'pago'
                    ? <span className="rounded-full bg-ok-suave px-2 py-0.5 text-[11px] font-extrabold text-ok-texto">liberado</span>
                    : p.status === 'cancelado'
                      ? <span className="rounded-full bg-sup px-2 py-0.5 text-[11px] font-extrabold text-texto3">cancelado</span>
                      : p.link
                        ? <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-obra px-2.5 py-1 text-[11px] font-extrabold text-[#121A2B]">Pagar<ExternalLink className="size-3" /></a>
                        : <span className="rounded-full bg-medio-suave px-2 py-0.5 text-[11px] font-extrabold text-medio-texto">aguardando</span>}
                </li>
              ))}
            </ul>
            {pendentes.length > 0 && <button onClick={() => carregar(true)} className="justify-self-start text-xs font-extrabold text-tinta">Já paguei: atualizar</button>}
          </Cartao>
        )}
      </aside>
    </div>
    </>}
    </>
  );
}

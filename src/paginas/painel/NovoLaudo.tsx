import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, BrickWall, RefreshCw, Building2, Calculator, Check, ChevronRight, FileSpreadsheet, Gavel, Hammer, House, HousePlus, KeyRound, Scale } from 'lucide-react';
import { Botao, Campo, Dica, Entrada, Modal } from '../../componentes/ui';
import { GRUPOS, LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import type { Laudo, TipoLaudo } from '../../dominio/modelo';
import { db } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { cx, hoje, novoId } from '../../lib/util';

export const ICONE_TIPO: Record<TipoLaudo, typeof Building2> = {
  cautelar: HousePlus, entrega: KeyRound, locacao: House, inspecao: Building2, extrajudicial: Gavel,
  estrutural: BrickWall, reforma: Hammer, pericia: Scale, avaliacao: Calculator, contabil: FileSpreadsheet,
};

/** Novo laudo em 2 passos: 1) o tipo  2) onde (e o que o modelo já traz). */
export function NovoLaudo({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { usuario } = useSessao();
  const nav = useNavigate();
  const [tipo, setTipo] = useState<TipoLaudo | null>(null);
  const [titulo, setTitulo] = useState('');
  const [endereco, setEndereco] = useState('');

  const fechar = () => { aoFechar(); setTimeout(() => { setTipo(null); setTitulo(''); setEndereco(''); }, 200); };

  const criar = async () => {
    if (!usuario || !tipo) return;
    const t = TIPOS[tipo];
    const agora = Date.now();
    const l: Laudo = {
      id: novoId(), usuarioId: usuario.id, tipo, status: 'rascunho',
      titulo: titulo.trim() || (endereco.trim() ? `${t.curto} — ${endereco.trim()}` : t.tituloPadrao),
      dados: { endereco: endereco.trim(), dataVistoria: hoje() }, conclusao: '', criadoEm: agora, atualizadoEm: agora,
    };
    await db.laudos.add(l);
    fechar();
    nav(`/laudo/${l.id}?aba=${t.foco === 'documento' ? 'dados' : 'fotos'}`);
  };

  const t = tipo ? TIPOS[tipo] : null;
  const Ic = tipo ? ICONE_TIPO[tipo] : null;

  return (
    <Modal aberto={aberto} aoFechar={fechar} titulo={t ? 'Onde é a vistoria?' : 'Qual laudo vamos fazer?'} largura="max-w-xl">
      {!t ? (
        <div className="sem-barra grid max-h-[68dvh] grid-cols-1 gap-5 overflow-y-auto overflow-x-hidden overscroll-contain pb-1">
          <p className="rounded-2xl bg-obra-suave px-3 py-2.5 text-sm leading-snug text-obra-texto">
            <b>Escolha o tipo:</b> o modelo, as normas e o texto já vêm prontos.
            <Dica texto={<><b>Vistorias:</b> registrar o estado do imóvel (antes de obra vizinha, na entrega, na locação).<br /><b>Laudos técnicos:</b> diagnosticar problemas e dar parecer.<br /><b>Perícias e avaliações:</b> uso judicial e valor de mercado.<br />Dá para trocar depois.</>} />
          </p>
          {GRUPOS.map((g, gi) => {
            const lista = LISTA_TIPOS.filter((x) => x.grupo === g);
            if (!lista.length) return null;
            const cor = ['bg-obra text-[#121A2B]', 'bg-tinta text-white dark:text-[#0E1320]', 'bg-[#7c5cff] text-white', 'bg-ok text-white'][gi % 4];
            return (
              <section key={g} className="grid gap-2">
                <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-texto3">{g}<span className="rounded-full bg-sup2 px-1.5 text-[10px]">{lista.length}</span></h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {lista.map((x) => {
                    const I = ICONE_TIPO[x.id];
                    return (
                      <button key={x.id} onClick={() => setTipo(x.id)}
                        className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-borda bg-sup p-3 text-left transition hover:-translate-y-0.5 hover:border-obra hover:shadow-[0_10px_24px_rgba(18,26,43,.08)]">
                        <span className={cx('grid size-11 place-items-center rounded-xl', cor)}><I className="size-5" /></span>
                        <span className="min-w-0">
                          <b className="block leading-tight">{x.nome}</b>
                          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-texto2">{x.descricao}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1">{x.normas.slice(0, 2).map((n) => <span key={n} className="rounded-md bg-sup2 px-1.5 py-0.5 text-[10px] font-bold text-texto2">{n.split(' —')[0].split(' (')[0]}</span>)}</span>
                        </span>
                        <ChevronRight className="mt-3 size-5 text-texto3 transition group-hover:translate-x-0.5 group-hover:text-obra" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-tinta/5 p-3 ring-1 ring-tinta/20">
            {Ic && <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tinta text-white dark:text-[#0E1320]"><Ic className="size-5" /></span>}
            <span className="min-w-0 flex-1"><span className="block text-[11px] font-extrabold uppercase tracking-wider text-texto3">{t.grupo}</span><b className="block leading-tight">{t.nome}</b></span>
            <button onClick={() => setTipo(null)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-borda-forte bg-sup px-3 text-sm font-extrabold text-tinta hover:border-tinta"><RefreshCw className="size-4" />Trocar</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-borda">
            <div className="flex items-center gap-2 bg-ok-suave px-3.5 py-2.5 text-sm font-extrabold text-ok-texto"><Check className="size-4" />Este modelo já vem pronto</div>
            <ul className="grid gap-2 p-3.5">
              {t.entrega.map((e) => (
                <li key={e} className="flex items-center gap-2.5 text-sm font-semibold">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white"><Check className="size-3.5" /></span>{e}
                </li>
              ))}
            </ul>
            <div className="border-t border-borda px-3.5 py-3">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-texto3">Normas citadas</div>
              <div className="flex flex-wrap gap-1.5">
                {t.normas.map((n) => {
                  const [cod, nome] = n.split(' — ');
                  return <span key={n} className="inline-flex items-center gap-1 rounded-full bg-tinta/10 py-0.5 pl-2.5 pr-1 text-xs font-extrabold text-tinta">{cod.replace('ABNT ', '')}{nome ? <Dica texto={n} /> : <span className="w-1.5" />}</span>;
                })}
              </div>
            </div>
            <div className="border-t border-borda bg-obra-suave/60 px-3.5 py-2.5 text-[13px] text-obra-texto">
              <b>A Lia preenche:</b> {t.foco === 'documento' ? 'a descrição de cada documento fotografado.' : 'legendas, constatações com grau de risco e o relatório fotográfico.'} Você confere.
            </div>
          </div>
          <Campo rotulo={t.foco === 'documento' ? 'Endereço da empresa' : 'Endereço do imóvel'} dica="Dá para preencher depois.">
            <Entrada value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número — bairro" onKeyDown={(e) => e.key === 'Enter' && criar()} />
          </Campo>
          <Campo rotulo="Nome do laudo (opcional)"><Entrada value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={endereco ? `${t.curto} — ${endereco}` : t.tituloPadrao} /></Campo>
          <div className="flex gap-2">
            <Botao variante="fantasma" onClick={() => setTipo(null)}><ArrowLeft className="size-4" />Voltar</Botao>
            <button onClick={criar} className={cx('pilula pilula-obra flex-1')}>{t.foco === 'documento' ? 'Criar laudo' : 'Criar e subir fotos'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

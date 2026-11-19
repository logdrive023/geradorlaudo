import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, BookOpenText, CalendarRange, LayoutDashboard, MoreVertical, ShoppingCart, Trash2, Wallet } from 'lucide-react';
import { db, excluirObra, mudarObra } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { STATUS_OBRA, type StatusObra } from '../../dominio/obra';
import { Abas, Escolha } from '../../componentes/Pecas';
import { Botao, Carregando, Modal, Vazio, useAviso } from '../../componentes/ui';
import { AbaResumo } from './AbaResumo';
import { AbaCronograma } from './AbaCronograma';
import { AbaDiario } from './AbaDiario';
import { AbaFinanceiro } from './AbaFinanceiro';
import { AbaCompras } from './AbaCompras';

export type AbaObra = 'resumo' | 'cronograma' | 'diario' | 'financeiro' | 'compras';

/** Tela da obra: cabeçalho com status e as abas de gestão. */
export function ObraTela() {
  const { usuario } = useSessao();
  const { id = '' } = useParams();
  const [q, setQ] = useSearchParams();
  const aba = (q.get('aba') as AbaObra) || 'resumo';
  const irPara = (a: AbaObra) => setQ({ aba: a }, { replace: true });
  const obra = useLiveQuery(async () => (await db.obras.get(id)) ?? null, [id]);
  const [menu, setMenu] = useState(false);
  const [apagar, setApagar] = useState(false);
  const nav = useNavigate();
  const aviso = useAviso();

  if (obra === undefined) return <Carregando />;
  if (obra === null) return <div className="p-6"><Vazio icone={<ArrowLeft className="size-7" />} titulo="Obra não encontrada" texto="Ela pode ter sido apagada."><Link to="/obras" className="pilula pilula-obra">Ver obras</Link></Vazio></div>;

  const abertasCompras = obra.compras.filter((c) => !['entregue', 'cancelada'].includes(c.status)).length;
  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 md:px-8 md:py-6">
      <header className="nao-imprimir flex items-start gap-2">
        <Link to="/obras" aria-label="Voltar para obras" className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl hover:bg-sup2"><ArrowLeft className="size-5" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-2 text-2xl font-extrabold leading-tight md:text-3xl">{obra.nome}</h1>
          <p className="truncate text-sm text-texto2">{[obra.cliente, obra.endereco].filter(Boolean).join(' · ') || 'Sem cliente e endereço'}</p>
          <Escolha aria-label="Status da obra" valor={obra.status} className="mt-2 !h-9 !w-auto max-w-full text-sm font-bold"
            aoMudar={(s: StatusObra) => void mudarObra(obra.id, (o) => { o.status = s; })}
            opcoes={(Object.keys(STATUS_OBRA) as StatusObra[]).map((s) => ({ v: s, r: STATUS_OBRA[s].nome }))} />
        </div>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} aria-label="Mais opções" aria-expanded={menu} className="grid size-10 place-items-center rounded-xl hover:bg-sup2"><MoreVertical className="size-5" /></button>
          {menu && (
            <div className="revelar absolute right-0 top-11 z-30 w-52 rounded-2xl border border-borda bg-sup p-1 shadow-xl">
              {usuario?.papel !== 'assistente' && <button onClick={() => { setMenu(false); setApagar(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-critico-texto hover:bg-critico-suave"><Trash2 className="size-4" />Apagar obra</button>}
            </div>
          )}
        </div>
      </header>

      <div className="nao-imprimir mt-4">
        <Abas rotulo="Partes da obra" ativa={aba} aoMudar={irPara} abas={[
          { id: 'resumo', rotulo: 'Resumo', ic: LayoutDashboard },
          { id: 'cronograma', rotulo: 'Cronograma', ic: CalendarRange, conta: obra.etapas.length },
          { id: 'diario', rotulo: 'Diário', ic: BookOpenText, conta: obra.diarios.length },
          { id: 'financeiro', rotulo: 'Financeiro', ic: Wallet },
          { id: 'compras', rotulo: 'Compras', ic: ShoppingCart, conta: abertasCompras },
        ]} />
      </div>

      <div className="mt-4">
        {aba === 'resumo' && <AbaResumo obra={obra} irPara={irPara} avisar={aviso.avisar} />}
        {aba === 'cronograma' && <AbaCronograma obra={obra} />}
        {aba === 'diario' && <AbaDiario obra={obra} avisar={aviso.avisar} />}
        {aba === 'financeiro' && <AbaFinanceiro obra={obra} />}
        {aba === 'compras' && <AbaCompras obra={obra} avisar={aviso.avisar} />}
      </div>

      <Modal aberto={apagar} aoFechar={() => setApagar(false)} titulo="Apagar a obra?">
        <p className="text-texto2">“{obra.nome}”, com {obra.diarios.length} diário(s), etapas, financeiro, compras e fotos, será apagada. Os laudos ligados continuam existindo. Não dá para desfazer.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={() => setApagar(false)}>Cancelar</Botao>
          <Botao variante="perigo" onClick={async () => { await excluirObra(obra.id); nav('/obras'); }}><Trash2 className="size-4" />Apagar</Botao>
        </div>
      </Modal>
      {aviso.el}
    </div>
  );
}

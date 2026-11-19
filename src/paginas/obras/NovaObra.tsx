import { useState } from 'react';
import { useNavigate } from 'react-router';
import { HardHat, ListChecks } from 'lucide-react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { TIPO_OBRA, obraNova } from '../../dominio/obra';
import { etapasConfiguradas, etapasParaTipo } from '../../dominio/etapas';
import { lerConfig } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { Botao, Dica, Modal } from '../../componentes/ui';
import { novoId } from '../../lib/util';
import { CamposObra, type ValoresObra } from './CamposObra';

const VAZIO: ValoresObra = { nome: '', endereco: '', cliente: '', tipo: 'construcao' };

/** Modal "Nova obra": ficha completa com dicas; só o nome é obrigatório. */
export function NovaObra({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { usuario } = useSessao();
  const nav = useNavigate();
  const [v, setV] = useState<ValoresObra>(VAZIO);
  const [comEtapas, setComEtapas] = useState(true);
  const [erro, setErro] = useState('');
  const modelos = useLiveQuery(async () => etapasConfiguradas(await lerConfig()), [], etapasConfiguradas());
  const qtdEtapas = etapasParaTipo(modelos, v.tipo).length;

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    if (!v.nome.trim()) { setErro('Dê um nome para a obra.'); return; }
    if (v.inicio && v.fim && v.fim < v.inicio) { setErro('O fim previsto vem antes do início.'); return; }
    const o = obraNova(novoId(), usuario.id, { ...v, comEtapas }, novoId, modelos);
    await db.obras.add(o);
    aoFechar();
    setV(VAZIO); setErro('');
    nav(`/obra/${o.id}`);
  };

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} largura="max-w-xl" titulo={<span className="flex items-center gap-2"><HardHat className="size-5 text-obra" />Nova obra</span>}>
      <form onSubmit={criar} className="grid gap-4">
        <p className="-mt-2 text-sm text-texto2">Só o nome é obrigatório. O resto ajuda no cronograma, no financeiro e no que o cliente vê.</p>
        <CamposObra v={v} set={(p) => setV({ ...v, ...p })} />
        <label className="flex items-start gap-3 rounded-2xl bg-obra-suave p-3 text-sm text-obra-texto">
          <input type="checkbox" checked={comEtapas} onChange={(e) => setComEtapas(e.target.checked)} className="mt-0.5 size-5 accent-[var(--obra)]" />
          <span className="grid gap-0.5">
            <b className="flex items-center gap-1.5"><ListChecks className="size-4" />Criar {qtdEtapas} etapas sugeridas<Dica texto="Cada etapa vem com checklist de execução (ex.: armadura conferida antes da concretagem). Com início e fim previstos, as datas já são distribuídas. Você muda tudo depois." /></b>
            <span className="opacity-80">Para {v.tipo ? TIPO_OBRA[v.tipo].nome.toLowerCase() : 'a obra'}, com checklist{v.inicio && v.fim ? ' e datas no prazo' : ''}. <Link to="/configuracoes?aba=etapas" onClick={aoFechar} className="font-bold underline underline-offset-2">Mudar as etapas</Link></span>
          </span>
        </label>
        {erro && <p className="rounded-xl bg-critico-suave p-3 text-sm font-bold text-critico-texto">{erro}</p>}
        <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 bg-sup px-1 pt-2">
          <Botao type="button" variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="obra"><HardHat className="size-4" />Criar obra</Botao>
        </div>
      </form>
    </Modal>
  );
}

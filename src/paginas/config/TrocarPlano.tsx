import { useState } from 'react';
import { ArrowRight, Camera, Check, HardHat, Users } from 'lucide-react';
import { trocarPlano, avisarPlanoMudou } from '../../db/organizacao';
import { PLANOS, milhar, precoBR, type PlanoVenda } from '../../dominio/planos';
import { Botao, Modal } from '../../componentes/ui';
import { cx } from '../../lib/util';

const dataBR = (d?: string) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '');

/** Trocar de plano: escolhe, vê o que muda (na hora e na próxima cobrança) e confirma. */
export function TrocarPlano({ aberto, aoFechar, atual, proximaCobranca, aoTrocar }: {
  aberto: boolean; aoFechar: () => void; atual: string; proximaCobranca?: string; aoTrocar: (msg: string) => void;
}) {
  const [escolha, setEscolha] = useState<PlanoVenda | null>(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const hoje = PLANOS.find((p) => p.id === atual);
  const fechar = () => { setEscolha(null); setErro(''); aoFechar(); };

  const confirmar = async () => {
    if (!escolha) return;
    setOcupado(true); setErro('');
    try {
      const r = await trocarPlano(escolha.id);
      avisarPlanoMudou();
      aoTrocar(`Pronto, você está no plano ${r.para.nome}. A mensalidade de ${precoBR(r.para.precoCentavos / 100)} vale a partir de ${dataBR(r.proximaCobranca)}.`);
      fechar();
    } catch (e) { setErro((e as Error).message); }
    setOcupado(false);
  };

  const sobe = escolha && hoje ? escolha.preco > hoje.preco : true;
  return (
    <Modal aberto={aberto} aoFechar={fechar} largura="max-w-3xl" titulo="Trocar de plano">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          {PLANOS.map((p) => {
            const eAtual = p.id === atual;
            const marcado = escolha?.id === p.id;
            return (
              <button key={p.id} disabled={eAtual} onClick={() => setEscolha(p)} aria-pressed={marcado}
                className={cx('relative grid gap-2 rounded-2xl border-2 p-4 text-left transition', marcado ? 'border-obra bg-obra-suave/40' : 'border-borda hover:border-borda-forte', eAtual && 'cursor-default opacity-70')}>
                {eAtual && <span className="absolute right-3 top-3 rounded-full bg-sup2 px-2 py-0.5 text-[11px] font-extrabold text-texto2">seu plano</span>}
                {marcado && <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-obra text-[#121A2B]"><Check className="size-4" /></span>}
                <span className="text-xs font-extrabold uppercase tracking-wider text-texto3">{p.nome}</span>
                <span><b className="font-display text-2xl">{precoBR(p.preco)}</b><span className="text-sm text-texto2">/mês</span></span>
                <span className="grid gap-1 text-sm text-texto2">
                  <span className="flex items-center gap-1.5"><Camera className="size-4 text-obra" />{milhar(p.fotosMes)} fotos com IA/mês</span>
                  <span className="flex items-center gap-1.5"><Users className="size-4 text-obra" />{p.usuarios === 1 ? '1 pessoa' : `até ${p.usuarios} pessoas`}</span>
                  <span className={cx('flex items-center gap-1.5', !p.obras && 'text-texto3 line-through')}><HardHat className="size-4 text-obra" />gestão de obras</span>
                </span>
              </button>
            );
          })}
        </div>

        {escolha && (
          <div className="grid gap-2 rounded-2xl bg-sup2 p-4 text-sm">
            {hoje && (
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {hoje.nome} {precoBR(hoje.preco)} <ArrowRight className="size-4 text-obra" /> {escolha.nome} {precoBR(escolha.preco)}
              </p>
            )}
            <ul className="grid gap-1 text-texto2">
              <li>• Fotos com IA, pessoas e obras do plano {escolha.nome} valem <b className="text-texto">na hora</b>.</li>
              <li>• A mensalidade de <b className="text-texto">{precoBR(escolha.preco)}</b> começa na próxima cobrança{proximaCobranca ? <> (<b className="text-texto">{dataBR(proximaCobranca)}</b>)</> : ', daqui a um mês'}. Sem multa e sem cobrança proporcional.</li>
              {!sobe && <li>• As fotos do mês passam a ser <b className="text-texto">{milhar(escolha.fotosMes)}</b>. Se já usou mais que isso, as novas ficam na fila (ou saem de um pacote).</li>}
              {!escolha.obras && <li>• Sem gestão de obras: as obras que já existem continuam abertas para editar, mas não dá para criar novas.</li>}
              {!sobe && <li>• Se houver mais pessoas ativas do que o plano permite, desative alguém em Equipe antes.</li>}
            </ul>
          </div>
        )}
        {erro && <p className="rounded-xl bg-critico-suave px-3 py-2.5 text-sm text-critico-texto">{erro}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Botao variante="fantasma" onClick={fechar}>Voltar</Botao>
          <Botao variante="obra" disabled={!escolha} carregando={ocupado} onClick={confirmar}>{escolha ? `Trocar para ${escolha.nome}` : 'Escolha um plano'}</Botao>
        </div>
      </div>
    </Modal>
  );
}

import type { ReactNode } from 'react';
import { Building2, CalendarRange, FileBadge, Hammer, Home, PaintRoller, Ruler, Trash, User, Wrench } from 'lucide-react';
import { REGIME, TIPO_OBRA, diasEntre, type DadosNovaObra, type Regime, type TipoObra } from '../../dominio/obra';
import { reais } from '../../dominio/plano';
import { Campo, Entrada } from '../../componentes/ui';
import { EntradaReais, Escolha } from '../../componentes/Pecas';
import { cx } from '../../lib/util';

export const ICONE_OBRA: Record<TipoObra, React.ComponentType<{ className?: string }>> = {
  construcao: Building2, reforma: Hammer, ampliacao: Home, manutencao: Wrench, interiores: PaintRoller, demolicao: Trash,
};

function Bloco({ ic: Ic, titulo, children }: { ic: React.ComponentType<{ className?: string }>; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-borda p-3.5">
      <legend className="flex items-center gap-1.5 px-1 text-xs font-extrabold uppercase tracking-wider text-texto3"><Ic className="size-4 text-obra" />{titulo}</legend>
      {children}
    </fieldset>
  );
}

export type ValoresObra = Omit<DadosNovaObra, 'comEtapas'>;

/** Campos da ficha da obra, com dicas. Usado para criar a obra e para editar a ficha depois. */
export function CamposObra({ v, set }: { v: ValoresObra; set: (p: Partial<ValoresObra>) => void }) {
  const dias = v.inicio && v.fim && v.fim >= v.inicio ? diasEntre(v.inicio, v.fim) : null;
  const porM2 = v.area && v.orcamentoPrevisto ? v.orcamentoPrevisto / v.area : null;
  const txt = (k: keyof ValoresObra) => (e: React.ChangeEvent<HTMLInputElement>) => set({ [k]: e.target.value } as Partial<ValoresObra>);

  return (
    <div className="grid gap-3">
      <Bloco ic={Building2} titulo="A obra">
        <Campo rotulo="Nome da obra" ajuda="Como você chama a obra no dia a dia. Aparece no diário, no PDF e no link do cliente.">
          <Entrada value={v.nome} onChange={txt('nome')} placeholder="Ex.: Residência Silva" autoFocus={false} />
        </Campo>
        <div className="grid gap-1.5">
          <span className="flex items-center gap-1 text-[13px] font-bold text-texto2">Tipo de obra</span>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Tipo de obra">
            {(Object.keys(TIPO_OBRA) as TipoObra[]).map((t) => {
              const Ic = ICONE_OBRA[t];
              const on = v.tipo === t;
              return (
                <button key={t} type="button" role="radio" aria-checked={on} onClick={() => set({ tipo: t })}
                  className={cx('grid justify-items-center gap-1 rounded-xl border px-1 py-2.5 text-center text-[11px] font-bold leading-tight transition', on ? 'border-obra bg-obra-suave text-obra-texto' : 'border-borda bg-sup text-texto2 hover:border-borda-forte')}>
                  <Ic className="size-5" />{TIPO_OBRA[t].nome}
                </button>
              );
            })}
          </div>
          <small className="text-xs text-texto3">Define as etapas sugeridas do cronograma.</small>
        </div>
        <Campo rotulo="Regime de contratação" ajuda={<>Como a obra é paga.<br /><b>Empreitada:</b> preço fechado.<br /><b>Administração:</b> o cliente paga o custo + taxa.<br /><b>Preço unitário:</b> paga o que for medido.</>}>
          <Escolha aria-label="Regime de contratação" valor={v.regime ?? ''} vazio="Escolha (opcional)" aoMudar={(r: Regime) => set({ regime: r || undefined })} opcoes={(Object.keys(REGIME) as Regime[]).map((r) => ({ v: r, r: REGIME[r] }))} />
        </Campo>
      </Bloco>

      <Bloco ic={User} titulo="Local e cliente">
        <Campo rotulo="Endereço" ajuda="Rua, número, bairro e cidade. Vai para o diário e para o link do cliente.">
          <Entrada value={v.endereco} onChange={txt('endereco')} placeholder="Rua, número — bairro, cidade" />
        </Campo>
        <Campo rotulo="Cliente / proprietário" ajuda="Quem contratou a obra. É quem recebe o link de acompanhamento.">
          <Entrada value={v.cliente} onChange={txt('cliente')} placeholder="Nome de quem contratou" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Telefone" ajuda="Para mandar o link e combinar visitas. Só você vê.">
            <Entrada type="tel" inputMode="tel" value={v.clienteTelefone ?? ''} onChange={txt('clienteTelefone')} placeholder="(11) 90000-0000" />
          </Campo>
          <Campo rotulo="E-mail" ajuda="Opcional. Só você vê.">
            <Entrada type="email" value={v.clienteEmail ?? ''} onChange={txt('clienteEmail')} placeholder="cliente@email.com" />
          </Campo>
        </div>
      </Bloco>

      <Bloco ic={CalendarRange} titulo="Prazo e valor">
        <div className="grid grid-cols-2 items-end gap-3">
          <Campo rotulo="Início previsto" ajuda="Com início e fim, eu já distribuo as datas das etapas no cronograma."><Entrada type="date" value={v.inicio ?? ''} onChange={txt('inicio')} /></Campo>
          <Campo rotulo="Fim previsto" ajuda="Data de entrega combinada com o cliente."><Entrada type="date" value={v.fim ?? ''} onChange={txt('fim')} /></Campo>
        </div>
        {v.inicio && v.fim && v.fim < v.inicio && <p className="rounded-xl bg-critico-suave p-2 text-xs font-bold text-critico-texto">O fim está antes do início.</p>}
        <div className="grid grid-cols-2 items-end gap-3">
          <Campo rotulo="Área (m²)" ajuda="Área construída ou reformada. Serve para calcular o custo por m².">
            <span className="relative block">
              <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto3" />
              <Entrada inputMode="decimal" className="pl-9" value={v.area ?? ''} placeholder="0" onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); set({ area: e.target.value && Number.isFinite(n) && n > 0 ? n : undefined }); }} />
            </span>
          </Campo>
          <Campo rotulo="Orçamento" ajuda="Orçamento previsto: valor total do contrato. Depois você detalha por etapa no Financeiro.">
            <EntradaReais aria-label="Orçamento previsto" valor={v.orcamentoPrevisto} aoMudar={(n) => set({ orcamentoPrevisto: n })} />
          </Campo>
        </div>
        {(dias != null || porM2 != null) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-sup2 px-3 py-2 text-xs text-texto2">
            {dias != null && <span>Duração: <b className="text-texto">{dias} dias</b> (~{Math.max(1, Math.round(dias / 30))} {Math.round(dias / 30) > 1 ? 'meses' : 'mês'})</span>}
            {porM2 != null && <span>Custo previsto: <b className="text-texto">{reais(porM2)}/m²</b></span>}
          </p>
        )}
      </Bloco>

      <Bloco ic={FileBadge} titulo="Documentos">
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="ART / RRT" ajuda="Número da Anotação (CREA) ou Registro (CAU) de Responsabilidade Técnica da obra. Sai no diário de obra.">
            <Entrada value={v.art ?? ''} onChange={txt('art')} placeholder="Nº da ART" />
          </Campo>
          <Campo rotulo="Alvará" ajuda="Número do alvará de construção/reforma da prefeitura, se houver.">
            <Entrada value={v.alvara ?? ''} onChange={txt('alvara')} placeholder="Nº do alvará" />
          </Campo>
        </div>
      </Bloco>
    </div>
  );
}

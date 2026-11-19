import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { db } from '../../db/db';
import { GRUPOS, LISTA_TIPOS, TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';
import { useModelo } from '../../dominio/textos';
import { AreaTexto, Botao, Campo, Cartao, useAviso } from '../../componentes/ui';
import { ICONE_TIPO } from '../painel/NovoLaudo';
import { cx } from '../../lib/util';

/** Ajustes › Modelos: o texto padrão de cada tipo de laudo, do jeito do engenheiro. */
export function Modelos() {
  const [tipo, setTipo] = useState<TipoLaudo>('cautelar');
  const t = TIPOS[tipo];
  const modelo = useModelo(tipo);
  const [f, setF] = useState({ objetivo: '', metodologia: '', normas: '' });
  const { avisar, el } = useAviso();

  useEffect(() => {
    setF({
      objetivo: modelo?.objetivo || t.objetivo,
      metodologia: modelo?.metodologia || t.metodologia,
      normas: (modelo?.normas?.length ? modelo.normas : t.normas).join('\n'),
    });
  }, [tipo, modelo]); // eslint-disable-line react-hooks/exhaustive-deps

  const personalizado = !!modelo;
  const salvar = async () => {
    await db.modelos.put({
      tipo,
      objetivo: f.objetivo.trim() === t.objetivo ? undefined : f.objetivo.trim(),
      metodologia: f.metodologia.trim() === t.metodologia ? undefined : f.metodologia.trim(),
      normas: f.normas.split('\n').map((n) => n.trim()).filter(Boolean),
    });
    avisar('Modelo salvo. Vale para os laudos deste tipo.');
  };
  const restaurar = async () => { await db.modelos.delete(tipo); avisar('Voltou ao padrão do sistema'); };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      <nav className="grid content-start gap-3" aria-label="Tipos de laudo">
        {GRUPOS.map((g) => (
          <div key={g}>
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-texto3">{g}</div>
            <div className="flex flex-wrap gap-1.5 lg:grid">
              {LISTA_TIPOS.filter((x) => x.grupo === g).map((x) => {
                const Ic = ICONE_TIPO[x.id];
                return (
                  <button key={x.id} onClick={() => setTipo(x.id)} aria-pressed={tipo === x.id}
                    className={cx('flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition', tipo === x.id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda hover:text-texto')}>
                    <Ic className="size-4 shrink-0" />{x.curto}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Cartao className="grid content-start gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{t.nome}</h2>
            <p className="text-sm text-texto2">{personalizado ? 'Personalizado por você.' : 'Usando o padrão do sistema.'} Vale para os novos laudos e para os que não têm texto próprio.</p>
          </div>
          {personalizado && <span className="inline-flex items-center gap-1 rounded-full bg-ok-suave px-2.5 py-0.5 text-xs font-extrabold text-ok-texto"><Check className="size-3.5" />Personalizado</span>}
        </div>
        <Campo rotulo="Objetivo" ajuda="Para que serve este laudo. Aparece na seção 1 do documento."><AreaTexto rows={4} value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} /></Campo>
        <Campo rotulo="Metodologia" ajuda="Como a vistoria foi feita: visual, ensaios, documentos analisados…"><AreaTexto rows={5} value={f.metodologia} onChange={(e) => setF({ ...f, metodologia: e.target.value })} /></Campo>
        <Campo rotulo="Normas e referências" dica="Uma por linha" ajuda="Lista que aparece em “Normas e referências”. Ex.: ABNT NBR 13752 — Perícias de engenharia."><AreaTexto rows={4} value={f.normas} onChange={(e) => setF({ ...f, normas: e.target.value })} /></Campo>
        <div className="rounded-xl bg-sup2 p-3 text-sm text-texto2">
          <b className="text-texto">Campos deste tipo:</b> {t.secoes.flatMap((s) => s.campos).map((c) => c.rotulo).join(' · ')}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {personalizado && <Botao variante="fantasma" onClick={restaurar}><RotateCcw className="size-4" />Voltar ao padrão</Botao>}
          <Botao variante="obra" onClick={salvar}>Salvar modelo</Botao>
        </div>
      </Cartao>
      {el}
    </div>
  );
}

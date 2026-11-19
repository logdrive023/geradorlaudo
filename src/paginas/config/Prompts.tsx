import { useEffect, useState } from 'react';
import { Check, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { db } from '../../db/db';
import { DEFINICOES, montarAnalise, usePrompts, type ChavePrompt } from '../../ia/instrucoes';
import { LISTA_TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';
import { AreaTexto, Botao, Cartao, Dica, Modal, useAviso } from '../../componentes/ui';
import { cx } from '../../lib/util';

const GRUPOS: { nome: string; chaves: (d: (typeof DEFINICOES)[number]) => boolean }[] = [
  { nome: 'Principal', chaves: (d) => d.chave === 'analise' },
  { nome: 'Foco por tipo de laudo', chaves: (d) => d.chave.startsWith('foco:') },
  { nome: 'Textos', chaves: (d) => d.chave === 'conclusao' || d.chave === 'lia' },
];

/** Ajustes › Prompts da IA: ver e editar TODOS os prompts que vão para a IA. Fica salvo no banco. */
export function Prompts() {
  const salvos = usePrompts();
  const [chave, setChave] = useState<ChavePrompt>('analise');
  const def = DEFINICOES.find((d) => d.chave === chave)!;
  const salvo = salvos.get(chave);
  const [texto, setTexto] = useState('');
  const [verFinal, setVerFinal] = useState(false);
  const [tipoPrevia, setTipoPrevia] = useState<TipoLaudo>('cautelar');
  const { avisar, el } = useAviso();

  useEffect(() => { setTexto(salvo?.texto || def.padrao); }, [chave, salvo?.texto]); // eslint-disable-line react-hooks/exhaustive-deps

  const editado = !!salvo?.texto;
  const mudou = texto.trim() !== (salvo?.texto || def.padrao).trim();
  const salvar = async () => {
    if (texto.trim() === def.padrao.trim()) await db.prompts.delete(chave);
    else await db.prompts.put({ chave, texto: texto.trim(), atualizadoEm: Date.now() });
    avisar('Prompt salvo. Vale a partir da próxima análise.');
  };
  const restaurar = async () => { await db.prompts.delete(chave); setTexto(def.padrao); avisar('Voltou ao padrão'); };

  const tipoFoco = chave.startsWith('foco:') ? (chave.slice(5) as TipoLaudo) : tipoPrevia;
  const previa = chave === 'analise' || chave.startsWith('foco:')
    ? montarAnalise(chave === 'analise' ? texto : salvos.get('analise')?.texto || DEFINICOES[0].padrao,
      chave.startsWith('foco:') ? texto : salvos.get(`foco:${tipoFoco}`)?.texto || DEFINICOES.find((d) => d.chave === `foco:${tipoFoco}`)!.padrao, tipoFoco)
    : texto.replaceAll('{contexto}', '\nContexto do laudo aberto:\n(resumo do laudo que estiver aberto)');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      <nav className="grid content-start gap-3" aria-label="Prompts">
        {GRUPOS.map((g) => (
          <div key={g.nome}>
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-texto3">{g.nome}</div>
            <div className="flex flex-wrap gap-1.5 lg:grid">
              {DEFINICOES.filter(g.chaves).map((d) => (
                <button key={d.chave} onClick={() => setChave(d.chave)} aria-pressed={chave === d.chave}
                  className={cx('flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition',
                    chave === d.chave ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'bg-sup text-texto2 ring-1 ring-borda hover:text-texto')}>
                  {d.nome}{salvos.has(d.chave) && <span className="size-2 shrink-0 rounded-full bg-obra" title="Editado" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Cartao className="grid content-start gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-lg font-bold">{def.nome}<Dica texto="É exatamente o texto que vai para a IA. Mudou, salvou: a próxima análise já usa." /></h2>
            <p className="text-sm text-texto2">{def.para}</p>
          </div>
          <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold', editado ? 'bg-obra-suave text-obra-texto' : 'bg-sup2 text-texto2')}>
            {editado ? <><Sparkles className="size-3.5" />Editado por você</> : <><Check className="size-3.5" />Padrão</>}
          </span>
        </div>

        {def.marcadores && (
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-texto3">
            Marcadores (trocados na hora):
            {def.marcadores.map((m) => <code key={m} className="rounded-md bg-sup2 px-1.5 py-0.5 font-bold text-texto2">{m}</code>)}
          </p>
        )}

        <AreaTexto rows={chave === 'analise' ? 22 : chave.startsWith('foco:') ? 5 : 9} value={texto} onChange={(e) => setTexto(e.target.value)}
          className="font-mono text-[13px] leading-relaxed" spellCheck={false} aria-label={`Prompt ${def.nome}`} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-texto3">{texto.length} caracteres</span>
          <div className="flex flex-wrap gap-2">
            <Botao variante="claro" tam="p" onClick={() => setVerFinal(true)}><Eye className="size-4" />Ver prompt final</Botao>
            {editado && <Botao variante="fantasma" tam="p" onClick={restaurar}><RotateCcw className="size-4" />Voltar ao padrão</Botao>}
            <Botao variante="obra" tam="p" onClick={salvar} disabled={!mudou}>Salvar</Botao>
          </div>
        </div>
      </Cartao>

      <Modal aberto={verFinal} aoFechar={() => setVerFinal(false)} titulo="Prompt final enviado à IA" largura="max-w-3xl">
        {(chave === 'analise') && (
          <label className="mb-3 flex items-center gap-2 text-sm font-bold text-texto2">Tipo de laudo:
            <select value={tipoPrevia} onChange={(e) => setTipoPrevia(e.target.value as TipoLaudo)} className="h-9 rounded-xl border border-borda-forte bg-sup px-2">
              {LISTA_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </label>
        )}
        <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap rounded-xl bg-sup2 p-4 font-mono text-[12.5px] leading-relaxed text-texto">{previa}</pre>
        <p className="mt-2 text-xs text-texto3">Junto vai a foto e o contexto que você anotou (endereço, ambiente, observação).</p>
      </Modal>
      {el}
    </div>
  );
}

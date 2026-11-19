import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { tocarLaudo } from '../../db/db';
import { TIPOS, type Campo as CampoT } from '../../dominio/tipos';
import type { Laudo } from '../../dominio/modelo';
import { textosDoTipo, useModelo } from '../../dominio/textos';
import { AreaTexto, Botao, Campo, Cartao, Entrada, useUrl } from '../../componentes/ui';
import { BarraWizard, EscolhaChips, Recolhivel } from '../../componentes/Wizard';
import { Lia } from '../../componentes/Lia';
import { prepararFoto } from '../../lib/imagem';
import { cx } from '../../lib/util';
import type { Aba } from './Editor';

function Imagem({ rotulo, dica, valor, aoMudar }: { rotulo: string; dica: string; valor?: Blob; aoMudar: (b?: Blob) => void }) {
  const url = useUrl(valor);
  const inp = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => inp.current?.click()} className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-borda-forte bg-sup2">
        {url ? <img src={url} alt="" className="size-full object-contain" /> : <ImagePlus className="size-6 text-texto3" />}
      </button>
      <div className="min-w-0">
        <b className="block text-sm">{rotulo}</b><small className="block text-xs text-texto3">{dica}</small>
        <div className="mt-1.5 flex gap-1.5">
          <Botao tam="p" variante="claro" onClick={() => inp.current?.click()}>{valor ? 'Trocar' : 'Escolher'}</Botao>
          {valor && <Botao tam="p" variante="fantasma" onClick={() => aoMudar(undefined)} aria-label="Remover"><Trash2 className="size-4" /></Botao>}
        </div>
      </div>
      <input ref={inp} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) aoMudar((await prepararFoto(f)).imagem); e.target.value = ''; }} />
    </div>
  );
}

/** Um campo do padrão do laudo, do jeito certo para o tipo (texto, data, número, opções em botões). */
function CampoDinamico({ c, valor, aoMudar }: { c: CampoT; valor: string; aoMudar: (v: string) => void }) {
  const rotulo = <>{c.rotulo}{c.obrigatorio && <span className="text-obra-forte"> *</span>}</>;
  if (c.tipo === 'opcoes') return <div className="col-span-2">{<EscolhaChips rotulo={rotulo} opcoes={c.opcoes!} valor={valor} aoMudar={aoMudar} />}</div>;
  const ctl = c.tipo === 'area'
    ? <AreaTexto value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={c.dica} />
    : <Entrada type={c.tipo === 'data' ? 'date' : 'text'} inputMode={c.tipo === 'numero' ? 'decimal' : undefined} value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={c.dica} />;
  return <Campo rotulo={rotulo} ajuda={c.ajuda} className={cx(c.curto ? 'col-span-1' : 'col-span-2', !c.largo && !c.curto && 'sm:col-span-1')}>{ctl}</Campo>;
}

export function AbaDados({ laudo, irPara }: { laudo: Laudo; irPara: (a: Aba) => void }) {
  const def = TIPOS[laudo.tipo];
  const modelo = useModelo(laudo.tipo);
  const padrao = textosDoTipo(laudo.tipo, modelo);
  const [dados, setDados] = useState(laudo.dados);
  const [textos, setTextos] = useState(laudo.textos ?? {});
  const sujo = useRef(false);

  // salva sozinho, meio segundo depois de parar de digitar
  useEffect(() => {
    if (!sujo.current) return;
    const t = setTimeout(() => { void tocarLaudo(laudo.id, { dados, textos }); sujo.current = false; }, 500);
    return () => clearTimeout(t);
  }, [dados, textos, laudo.id]);
  useEffect(() => () => { if (sujo.current) void tocarLaudo(laudo.id, { dados, textos }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = (k: string, v: string) => { sujo.current = true; setDados((d) => ({ ...d, [k]: v })); };
  const mudarTexto = (k: 'objetivo' | 'metodologia', v: string) => { sujo.current = true; setTextos((t) => ({ ...t, [k]: v })); };

  const todos = def.secoes.flatMap((s) => s.campos);
  const essenciais = todos.filter((c) => c.obrigatorio);
  const faltam = essenciais.filter((c) => !dados[c.chave]?.trim());

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 px-3 py-4 sm:px-4 md:py-6">
      <Lia humor={faltam.length ? 'normal' : 'feliz'} tam={40}>
        {faltam.length ? <>Só o essencial agora: falta{faltam.length > 1 ? 'm' : ''} <b>{faltam.length}</b> campo{faltam.length > 1 ? 's' : ''}. O resto pode ficar para depois.</> : 'O essencial está pronto. Os detalhes abaixo deixam o laudo mais completo.'}
      </Lia>

      <Cartao className="p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-bold">O essencial</h2>
        <div className="grid grid-cols-2 gap-4">
          {essenciais.map((c) => <CampoDinamico key={c.chave} c={c} valor={dados[c.chave] ?? ''} aoMudar={(v) => mudar(c.chave, v)} />)}
        </div>
      </Cartao>

      <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-texto3">Mais detalhes (opcional)</div>
      {def.secoes.map((s) => {
        const campos = s.campos.filter((c) => !c.obrigatorio);
        if (!campos.length) return null;
        const preenchidos = campos.filter((c) => dados[c.chave]?.trim()).length;
        return (
          <Recolhivel key={s.titulo} titulo={s.titulo} resumo={preenchidos ? `${preenchidos} de ${campos.length} preenchidos` : `${campos.length} campo${campos.length > 1 ? 's' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              {campos.map((c) => <CampoDinamico key={c.chave} c={c} valor={dados[c.chave] ?? ''} aoMudar={(v) => mudar(c.chave, v)} />)}
            </div>
          </Recolhivel>
        );
      })}

      <Recolhivel titulo="Textos do laudo" resumo={textos.objetivo || textos.metodologia ? 'Ajustados para este laudo' : 'Usando o modelo padrão'}>
        <div className="grid gap-4">
          {(['objetivo', 'metodologia'] as const).map((k) => (
            <Campo key={k} rotulo={<span className="flex w-full items-center justify-between">{k === 'objetivo' ? 'Objetivo' : 'Metodologia'}
              {textos[k] && <button type="button" onClick={() => mudarTexto(k, '')} className="inline-flex items-center gap-1 text-xs font-extrabold text-tinta"><RotateCcw className="size-3.5" />Voltar ao padrão</button>}</span>}
              ajuda="Vem do modelo do tipo de laudo (Ajustes › Modelos). Mudar aqui vale só para este laudo.">
              <AreaTexto rows={4} value={textos[k] || padrao[k]} onChange={(e) => mudarTexto(k, e.target.value === padrao[k] ? '' : e.target.value)} />
            </Campo>
          ))}
          <div className="rounded-xl bg-sup2 p-3 text-sm text-texto2"><b className="text-texto">Normas citadas:</b> {padrao.normas.map((n) => n.split(' —')[0]).join(' · ')}</div>
        </div>
      </Recolhivel>

      <Recolhivel titulo="Capa do laudo" resumo={[laudo.logo && 'logo', laudo.imagemLocalizacao && 'localização'].filter(Boolean).join(' e ') || 'Logo e mapa de localização'}>
        <div className="grid gap-4">
          <Imagem rotulo="Logo deste laudo" dica="Se vazio, usa a logo do seu perfil." valor={laudo.logo} aoMudar={(b) => tocarLaudo(laudo.id, { logo: b })} />
          <Imagem rotulo="Localização do imóvel" dica="Print do mapa ou croqui de situação." valor={laudo.imagemLocalizacao} aoMudar={(b) => tocarLaudo(laudo.id, { imagemLocalizacao: b })} />
        </div>
      </Recolhivel>

      <BarraWizard
        principal={{ rotulo: 'Próximo: fotos', aoClicar: () => irPara('fotos') }}
        nota={faltam.length ? `Faltam ${faltam.length} campo${faltam.length > 1 ? 's' : ''} essenciais · dá para continuar e voltar depois` : 'Salvo automaticamente'}
      />
    </div>
  );
}

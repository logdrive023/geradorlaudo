import { useState } from 'react';
import { CheckCircle2, MessageSquareWarning, PenLine } from 'lucide-react';
import { responderLaudo } from '../../db/organizacao';
import type { Foto, Laudo } from '../../dominio/modelo';
import { achadosValidos } from '../../dominio/regras';
import { Botao, Campo, Cartao, Entrada, AreaTexto } from '../../componentes/ui';
import { cx } from '../../lib/util';

type Modo = 'aceite' | 'contestacao';
const chave = (token: string) => `laudotech.resposta.${token}`;

/** Resumo (SHA-256) do que o cliente viu, para o aceite valer sobre este conteúdo. */
async function resumo(laudo: Laudo, fotos: Foto[]) {
  const txt = JSON.stringify({ l: [laudo.id, laudo.titulo, laudo.conclusao, laudo.atualizadoEm], a: fotos.flatMap(achadosValidos).map((a) => [a.id, a.tipo, a.gravidade]) });
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** O cliente responde pelo link: aceita o laudo (assinatura eletrônica simples) ou contesta/comenta. */
export function RespostaCliente({ token, laudo, fotos }: { token: string; laudo: Laudo; fotos: Foto[] }) {
  const anterior = (() => { try { return JSON.parse(localStorage.getItem(chave(token)) ?? 'null') as { tipo: Modo; em: string } | null; } catch { return null; } })();
  const [feito, setFeito] = useState(anterior);
  const [modo, setModo] = useState<Modo | null>(null);
  const [nome, setNome] = useState('');
  const [doc, setDoc] = useState('');
  const [texto, setTexto] = useState('');
  const [achado, setAchado] = useState('');
  const [concordo, setConcordo] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const itens = fotos.flatMap((f, i) => achadosValidos(f).map((a) => ({ id: a.id, rot: `Foto ${i + 1} · ${a.tipo}${f.analise?.ambiente ? ` (${f.analise.ambiente})` : ''}` })));

  const enviar = async () => {
    setErro('');
    if (nome.trim().length < 2) return setErro('Escreva o seu nome.');
    if (modo === 'aceite' && !concordo) return setErro('Marque que leu o laudo para aceitar.');
    if (modo === 'contestacao' && !texto.trim()) return setErro('Escreva o que quer contestar ou comentar.');
    setEnviando(true);
    try {
      await responderLaudo(token, { tipo: modo!, nome: nome.trim(), documento: doc.trim() || undefined, texto: texto.trim() || undefined, achadoId: achado || undefined, hashConteudo: await resumo(laudo, fotos) });
      const r = { tipo: modo!, em: new Date().toISOString() };
      try { localStorage.setItem(chave(token), JSON.stringify(r)); } catch { /* modo privado */ }
      setFeito(r); setModo(null); setTexto('');
    } catch (e) { setErro((e as Error).message); }
    setEnviando(false);
  };

  return (
    <Cartao className="grid gap-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold"><PenLine className="size-5 text-obra" />Sua resposta ao laudo</h2>
        <p className="text-sm text-texto2">O responsável técnico recebe a sua resposta com data e hora.</p>
      </div>

      {feito && !modo && (
        <p className="flex items-start gap-2 rounded-xl bg-ok-suave px-3 py-2.5 text-sm text-ok-texto">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{feito.tipo === 'aceite' ? 'Você aceitou este laudo' : 'Sua contestação foi enviada'} em {new Date(feito.em).toLocaleString('pt-BR')}. Pode enviar outra mensagem se precisar.</span>
        </p>
      )}

      {!modo ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={() => setModo('aceite')} className="flex items-center gap-3 rounded-2xl border border-borda p-4 text-left transition hover:border-ok hover:bg-ok-suave/40">
            <CheckCircle2 className="size-6 shrink-0 text-ok" /><span><b className="block">Aceito o laudo</b><span className="text-sm text-texto2">Li e estou de acordo</span></span>
          </button>
          <button onClick={() => setModo('contestacao')} className="flex items-center gap-3 rounded-2xl border border-borda p-4 text-left transition hover:border-medio hover:bg-medio-suave/40">
            <MessageSquareWarning className="size-6 shrink-0 text-medio" /><span><b className="block">Contestar ou comentar</b><span className="text-sm text-texto2">Algo não confere</span></span>
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Seu nome"><Entrada value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" /></Campo>
            <Campo rotulo="CPF ou CNPJ (opcional)"><Entrada value={doc} onChange={(e) => setDoc(e.target.value)} inputMode="numeric" maxLength={20} /></Campo>
          </div>
          {modo === 'contestacao' && (
            <>
              {itens.length > 0 && (
                <Campo rotulo="Sobre qual ponto? (opcional)">
                  <select value={achado} onChange={(e) => setAchado(e.target.value)} className="h-11 rounded-xl border border-borda-forte bg-sup px-3 text-texto outline-none focus:border-tinta">
                    <option value="">O laudo em geral</option>
                    {itens.map((i) => <option key={i.id} value={i.id}>{i.rot}</option>)}
                  </select>
                </Campo>
              )}
              <Campo rotulo="Sua mensagem"><AreaTexto rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: a fissura da sala já existia antes da obra vizinha." /></Campo>
            </>
          )}
          {modo === 'aceite' && (
            <label className="flex items-start gap-2 rounded-xl bg-sup2 p-3 text-sm">
              <input type="checkbox" checked={concordo} onChange={(e) => setConcordo(e.target.checked)} className="mt-0.5 size-4 accent-[var(--ok)]" />
              <span>Li o laudo <b>{laudo.titulo}</b> e estou de acordo com o seu conteúdo.</span>
            </label>
          )}
          {erro && <p className="rounded-xl bg-critico-suave px-3 py-2 text-sm font-bold text-critico-texto">{erro}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Botao variante="fantasma" onClick={() => { setModo(null); setErro(''); }}>Voltar</Botao>
            <Botao variante={modo === 'aceite' ? 'obra' : 'claro'} carregando={enviando} onClick={enviar} className={cx(modo === 'aceite' && 'min-w-40')}>
              {modo === 'aceite' ? 'Confirmar aceite' : 'Enviar'}
            </Botao>
          </div>
          <p className="text-xs text-texto3">Guardamos seu nome, a data e a hora e um resumo do conteúdo que você viu. Seu IP não é guardado, só um resumo dele.</p>
        </div>
      )}
    </Cartao>
  );
}

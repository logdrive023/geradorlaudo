import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { verificarCodigo, type Verificacao } from '../../db/organizacao';
import { Cartao, Logo } from '../../componentes/ui';
import { TIPOS } from '../../dominio/tipos';
import type { TipoLaudo } from '../../dominio/modelo';

/** Página pública: qualquer pessoa confere se o laudo foi emitido pelo LaudoTech e por quem. */
export function Verificar() {
  const { codigo = '' } = useParams();
  const [v, setV] = useState<Verificacao | null | undefined>();
  useEffect(() => { verificarCodigo(codigo).then(setV).catch(() => setV(null)); }, [codigo]);

  return (
    <div className="grid min-h-dvh place-items-center bg-papel px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center"><Link to="/"><Logo /></Link></div>
        {v === undefined ? <div className="h-64 animate-pulse rounded-[22px] bg-sup2" /> : v === null ? (
          <Cartao className="p-6 text-center">
            <ShieldAlert className="mx-auto size-12 text-critico" />
            <h1 className="mt-3 text-xl font-bold">Código não encontrado</h1>
            <p className="mt-2 text-texto2">Não existe laudo emitido pelo LaudoTech com o código <b className="font-mono">{codigo}</b>. Confira o código ou fale com quem enviou o laudo.</p>
          </Cartao>
        ) : (
          <Cartao className="overflow-hidden">
            <div className="flex items-center gap-3 bg-ok-suave p-5 text-ok-texto">
              <ShieldCheck className="size-10 shrink-0" />
              <div><h1 className="text-xl font-bold leading-tight">Laudo autêntico</h1><p className="text-sm">Emitido pelo LaudoTech e registrado no servidor.</p></div>
            </div>
            <dl className="grid gap-3 p-5 text-sm">
              {[
                ['Laudo', v.titulo],
                ['Tipo', TIPOS[v.tipo as TipoLaudo]?.nome ?? v.tipo],
                ['Responsável técnico', [v.responsavel, v.registro].filter(Boolean).join(' · ')],
                ['Organização', v.organizacao],
                ['Emitido em', new Date(v.emitidoEm).toLocaleString('pt-BR')],
                ['Código', v.codigo],
              ].map(([k, x]) => <div key={k}><dt className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">{k}</dt><dd className="font-bold">{x}</dd></div>)}
              <div><dt className="text-[11px] font-extrabold uppercase tracking-wider text-texto3">Resumo do conteúdo (SHA-256)</dt><dd className="break-all font-mono text-xs text-texto2">{v.hash}</dd></div>
            </dl>
            <p className="border-t border-borda px-5 py-3 text-xs text-texto3">A verificação confirma a emissão e o responsável. O conteúdo técnico é de responsabilidade do profissional que assina.</p>
          </Cartao>
        )}
      </div>
    </div>
  );
}

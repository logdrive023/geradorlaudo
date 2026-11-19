import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { FileWarning, Printer, ShieldCheck } from 'lucide-react';
import { abrirLaudoPublico, type LaudoPublico } from '../../db/nuvem';
import type { Laudo, Usuario } from '../../dominio/modelo';
import { TIPOS } from '../../dominio/tipos';
import { Leitura } from '../../laudo/Leitura';
import { Documento } from '../../laudo/Documento';
import { Carregando, Logo } from '../../componentes/ui';

/** Página do cliente: abre o laudo pelo link, só para ler e baixar o PDF. Não precisa de conta. */
export function VerLaudo() {
  const { token = '' } = useParams();
  const [d, setD] = useState<LaudoPublico | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    abrirLaudoPublico(token).then((x) => { if (vivo) setD(x); }).catch((e: Error) => { if (vivo) setErro(e.message); });
    return () => { vivo = false; };
  }, [token]);

  useEffect(() => { if (d) document.title = `${d.laudo.titulo} · LaudoTech`; }, [d]);

  if (erro) {
    return (
      <div className="grid min-h-dvh place-items-center bg-papel px-4">
        <div className="grid max-w-sm justify-items-center gap-3 text-center">
          <FileWarning className="size-10 text-obra" />
          <h1 className="text-2xl font-extrabold">Não deu para abrir este laudo</h1>
          <p className="text-texto2">{erro} Peça um link novo ao engenheiro responsável.</p>
          <Link to="/" className="font-bold text-tinta underline-offset-2 hover:underline">Conhecer o LaudoTech</Link>
        </div>
      </div>
    );
  }
  if (!d) return <Carregando texto="Abrindo o laudo…" />;

  const laudo = { ...d.laudo, usuarioId: '' } as Laudo;
  const autor = { ...d.autor, id: '', email: '', papel: 'engenheiro', sal: '', senhaHash: '', endereco: '', ativo: true, criadoEm: 0 } as Usuario;

  return (
    <div className="min-h-dvh bg-papel">
      <header className="nao-imprimir sticky top-0 z-20 border-b border-borda bg-sup/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Logo tam={28} />
          <button onClick={() => window.print()} className="pilula pilula-obra h-10 px-4 text-sm"><Printer className="size-4" />Baixar PDF</button>
        </div>
      </header>
      <main className="nao-imprimir mx-auto grid max-w-3xl gap-4 px-4 py-5">
        <p className="flex items-start gap-2 rounded-2xl bg-[#121A2B] px-4 py-3 text-sm text-white" aria-label={TIPOS[laudo.tipo]?.nome}>
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-obra" />
          <span>Responsável técnico: <b>{autor.nome || '—'}</b>{autor.registro && <> · {autor.registro}</>}{autor.telefone && <> · {autor.telefone}</>}</span>
        </p>
        <Leitura laudo={laudo} fotos={d.fotos} autor={autor} />
        <p className="pb-8 text-center text-xs text-texto3">Documento compartilhado pelo responsável técnico via LaudoTech. Somente leitura.</p>
      </main>
      <div className="hidden print:block">
        <Documento laudo={laudo} fotos={d.fotos} autor={autor} />
      </div>
    </div>
  );
}

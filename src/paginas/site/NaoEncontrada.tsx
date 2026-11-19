import { Link, useLocation } from 'react-router';
import { ArrowLeft, Home, LayoutGrid } from 'lucide-react';
import { Logo } from '../../componentes/ui';
import { RostoLia } from '../../componentes/Lia';
import { useSessao } from '../../lib/sessao';

/** 404: endereço que não existe. A Lia explica e oferece caminhos. */
export function NaoEncontrada() {
  const { usuario } = useSessao();
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center px-4"><Link to="/"><Logo /></Link></header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md text-center">
          <div className="relative mx-auto w-fit">
            <span className="font-display text-[120px] font-extrabold leading-none tracking-tighter text-tinta/10 sm:text-[160px]" aria-hidden>404</span>
            <div className="absolute inset-0 grid place-items-center"><RostoLia humor="atenta" tam={96} /></div>
          </div>
          <div className="fita mx-auto mt-2 h-2 w-40 rounded-full" aria-hidden />
          <h1 className="mt-6 text-3xl font-extrabold">Essa página não <span className="grifo">existe</span>.</h1>
          <p className="mt-3 text-texto2">
            Procurei por <code className="break-all rounded-md bg-sup2 px-1.5 py-0.5 text-sm text-texto">{pathname}</code> e não achei nada.
            Pode ser um link antigo ou digitado errado.
          </p>
          <div className="mt-8 grid gap-2 sm:flex sm:justify-center">
            {usuario
              ? <Link to="/painel" className="pilula pilula-obra"><LayoutGrid className="size-5" />Ir para meus laudos</Link>
              : <Link to="/" className="pilula pilula-obra"><Home className="size-5" />Voltar ao início</Link>}
            <button onClick={() => history.back()} className="pilula pilula-clara"><ArrowLeft className="size-5" />Voltar</button>
          </div>
        </div>
      </main>
    </div>
  );
}

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { FilePlus2, HardHat, LayoutGrid, LogOut, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { useSessao } from '../lib/sessao';
import { Logo } from './ui';
import { cx } from '../lib/util';
import { NovoLaudo } from '../paginas/painel/NovoLaudo';
import { PergunteLia } from './Lia';

/** Estrutura das telas internas: menu lateral (computador) e barra inferior (celular). */
export function Casco() {
  const { usuario, sair } = useSessao();
  const nav = useNavigate();
  const [novo, setNovo] = useState(false);
  const noLaudo = useLocation().pathname.startsWith('/laudo/'); // dentro do laudo, o celular usa o cabeçalho do próprio laudo
  if (!usuario) return null;
  const itens = [
    { para: '/painel', rotulo: 'Laudos', ic: LayoutGrid },
    { para: '/obras', rotulo: 'Obras', ic: HardHat },
    { para: '/configuracoes', rotulo: 'Configurações', ic: Settings },
    ...(usuario.papel === 'admin' ? [{ para: '/usuarios', rotulo: 'Equipe', ic: Users }] : []),
  ];
  const iniciais = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-dvh md:pl-64">
      <aside className="nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-borda bg-sup md:flex">
        <div className="flex h-16 items-center px-5"><Logo /></div>
        <div className="px-4">
          <button onClick={() => setNovo(true)} className="pilula pilula-obra w-full">
            <FilePlus2 className="size-5" /> Novo laudo
          </button>
        </div>
        <nav className="mt-5 flex flex-col gap-1 px-3">
          {itens.map(({ para, rotulo, ic: Ic }) => (
            <NavLink key={para} to={para} className={({ isActive }) => cx('flex h-11 items-center gap-3 rounded-xl px-3 font-bold transition',
              isActive ? 'bg-tinta/10 text-tinta' : 'text-texto2 hover:bg-sup2 hover:text-texto')}>
              <Ic className="size-5" />{rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-borda p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span className="grid size-10 place-items-center rounded-full bg-tinta font-extrabold text-white dark:text-[#0E1320]">{iniciais}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{usuario.nome}</div>
              <div className="truncate text-xs text-texto3">{usuario.papel === 'admin' ? 'Administrador · acesso total' : usuario.papel === 'assistente' ? 'Assistente de campo' : usuario.registro || usuario.profissao}</div>
            </div>
            <button onClick={() => { sair(); nav('/entrar'); }} aria-label="Sair" title="Sair" className="rounded-lg p-2 text-texto3 hover:bg-sup2 hover:text-texto"><LogOut className="size-5" /></button>
          </div>
        </div>
        <div className="fita h-1.5" aria-hidden />
      </aside>

      <header className={cx(noLaudo && 'hidden', 'nao-imprimir sticky top-0 z-20 flex h-14 items-center justify-between border-b border-borda bg-papel/90 px-4 backdrop-blur md:hidden')}>
        <Logo tam={28} />
        <button onClick={() => { sair(); nav('/entrar'); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-texto2"><LogOut className="size-4" />Sair</button>
      </header>

      <main className={noLaudo ? 'md:pb-0' : 'pb-28 md:pb-10'}><Outlet /></main>

      <nav style={{ gridTemplateColumns: `repeat(${itens.length + 1}, 1fr)` }} className={cx(noLaudo ? 'hidden' : 'grid', 'nao-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-sup/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden')}>
        {itens.slice(0, 2).map(({ para, rotulo, ic: Ic }) => (
          <NavLink key={para} to={para} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold', isActive ? 'text-tinta' : 'text-texto3')}><Ic className="size-5" />{rotulo}</NavLink>
        ))}
        <button onClick={() => setNovo(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-obra-texto">
          <span className="-mt-5 grid size-11 place-items-center rounded-full border-[1.5px] border-[#121A2B] bg-obra text-[#121A2B] shadow-[0_3px_0_#121A2B]"><FilePlus2 className="size-5" /></span>Novo
        </button>
        {itens.slice(2).map(({ para, rotulo, ic: Ic }) => (
          <NavLink key={para} to={para} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold', isActive ? 'text-tinta' : 'text-texto3')}><Ic className="size-5" />{rotulo === 'Configurações' ? 'Ajustes' : rotulo}</NavLink>
        ))}
      </nav>

      <NovoLaudo aberto={novo} aoFechar={() => setNovo(false)} />
      <PergunteLia />
    </div>
  );
}

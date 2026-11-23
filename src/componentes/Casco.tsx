import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { CalendarDays, ChevronsLeft, CreditCard, FilePlus2, HardHat, LayoutGrid, LogOut, Settings, Users } from 'lucide-react';
import { logadoNaNuvem } from '../db/nuvem';
import { useState } from 'react';
import { useSessao } from '../lib/sessao';
import { Logo } from './ui';
import { cx } from '../lib/util';
import { NovoLaudo } from '../paginas/painel/NovoLaudo';
import { PergunteLia } from './Lia';
import { MolduraTransicao } from './MolduraTransicao';

/** Estrutura das telas internas: menu lateral (computador) e barra inferior (celular). */
export function Casco() {
  const { usuario, sair } = useSessao();
  const nav = useNavigate();
  const [novo, setNovo] = useState(false);
  // menu do computador recolhível (só ícones); a escolha fica guardada no aparelho
  const [recolhido, setRecolhido] = useState(() => { try { return localStorage.getItem('laudotech.menu') === 'recolhido'; } catch { return false; } });
  const alternarMenu = () => setRecolhido((r) => { try { localStorage.setItem('laudotech.menu', r ? 'aberto' : 'recolhido'); } catch { /* modo privado */ } return !r; });
  const caminho = useLocation().pathname;
  const noLaudo = caminho.startsWith('/laudo/'); // dentro do laudo, o celular usa o cabeçalho do próprio laudo
  if (!usuario) return null;
  const itens = [
    { para: '/painel', rotulo: 'Laudos', ic: LayoutGrid },
    { para: '/obras', rotulo: 'Obras', ic: HardHat },
    ...(logadoNaNuvem() ? [{ para: '/agenda', rotulo: 'Agenda', ic: CalendarDays }] : []),
    ...(usuario.papel !== 'assistente' && logadoNaNuvem() ? [{ para: '/plano', rotulo: 'Plano', ic: CreditCard }] : []),
    { para: '/configuracoes', rotulo: 'Configurações', ic: Settings },
    ...(usuario.papel === 'admin' ? [{ para: '/usuarios', rotulo: 'Equipe', ic: Users }] : []),
  ];
  const iniciais = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    // --menu: largura do menu no computador (as telas fixas usam a mesma medida)
    <div style={{ '--menu': recolhido ? '72px' : '256px' } as React.CSSProperties}
      className="min-h-dvh transition-[padding] duration-200 ease-out motion-reduce:transition-none md:pl-[var(--menu)]">
      <aside className="nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[var(--menu)] flex-col border-r border-borda bg-sup transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex">
        {/* recolher / abrir (desliza suave; o conteúdo do menu só é cortado, não remontado) */}
        <button onClick={alternarMenu} aria-label={recolhido ? 'Abrir o menu' : 'Recolher o menu'} title={recolhido ? 'Abrir o menu' : 'Recolher o menu'} aria-expanded={!recolhido}
          className="absolute -right-3.5 top-[74px] z-10 grid size-7 place-items-center rounded-full border border-borda bg-sup text-texto2 shadow-sm transition hover:border-borda-forte hover:text-texto">
          <ChevronsLeft className={cx('size-4 transition-transform duration-200 motion-reduce:transition-none', recolhido && 'rotate-180')} />
        </button>
        {/* recolhido: só o ícone (a caixa corta antes do nome, que some junto) */}
        <div className={cx('flex h-16 items-center overflow-hidden whitespace-nowrap pl-5 transition-[width] duration-200 ease-out motion-reduce:transition-none', recolhido ? 'w-[56px]' : 'w-full')}><Logo /></div>
        <div className={cx('transition-[padding] duration-200 motion-reduce:transition-none', recolhido ? 'px-3' : 'px-4')}>
          <button onClick={() => setNovo(true)} title="Novo laudo" aria-label="Novo laudo" className={cx('pilula pilula-obra w-full overflow-hidden whitespace-nowrap', recolhido && '!px-0')}>
            <FilePlus2 className="size-5 shrink-0" /><span className={cx('transition-opacity duration-150', recolhido && 'sr-only')}>Novo laudo</span>
          </button>
        </div>
        <nav className="mt-5 flex flex-col gap-1 overflow-hidden px-3">
          {itens.map(({ para, rotulo, ic: Ic }) => (
            <NavLink key={para} to={para} title={recolhido ? rotulo : undefined} aria-label={rotulo} className={({ isActive }) => cx('flex h-11 items-center gap-3 whitespace-nowrap rounded-xl px-[13px] font-bold transition-colors',
              isActive ? 'bg-tinta/10 text-tinta' : 'text-texto2 hover:bg-sup2 hover:text-texto')}>
              <Ic className="size-5 shrink-0" /><span className={cx('transition-opacity duration-150 motion-reduce:transition-none', recolhido ? 'opacity-0' : 'opacity-100')}>{rotulo}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto overflow-hidden border-t border-borda p-3">
          <div className={cx('flex items-center gap-3 rounded-xl p-2', recolhido && 'flex-col !gap-2 !p-0')}>
            <span title={recolhido ? usuario.nome : undefined} className="grid size-10 shrink-0 place-items-center rounded-full bg-tinta font-extrabold text-white dark:text-[#0E1320]">{iniciais}</span>
            <div className={cx('min-w-0 flex-1', recolhido && 'hidden')}>
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

      <main className={noLaudo ? 'md:pb-0' : 'pb-28 md:pb-10'}><div key={caminho} className="lt-tela"><Outlet /></div></main>

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

      <MolduraTransicao chave={caminho} />
      <NovoLaudo aberto={novo} aoFechar={() => setNovo(false)} />
      <PergunteLia />
    </div>
  );
}

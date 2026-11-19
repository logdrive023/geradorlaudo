import { useEffect, useRef, useState } from 'react';
import { CenaCarregando } from './CenaCarregando';
import { cx } from '../lib/util';

/**
 * Moldura de troca de tela: ao mudar de página, mostra a cena de carregamento por um instante
 * enquanto a tela nova monta por trás (desfocada). Some sozinha com um esmaecer.
 * Fica só sobre a área de conteúdo (o menu continua visível).
 */
export function MolduraTransicao({ chave, ms = 550 }: { chave: string; ms?: number }) {
  const [estado, setEstado] = useState<'oculta' | 'visivel' | 'saindo'>('oculta');
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; } // na abertura do app já existe o carregamento próprio
    setEstado('visivel');
    const t1 = setTimeout(() => setEstado('saindo'), ms);
    const t2 = setTimeout(() => setEstado('oculta'), ms + 220);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chave, ms]);
  if (estado === 'oculta') return null;
  return (
    <div aria-hidden className={cx('nao-imprimir pointer-events-none fixed inset-0 z-20 grid place-items-center bg-papel/75 backdrop-blur-[3px] transition-opacity duration-200 md:left-64',
      estado === 'saindo' ? 'opacity-0' : 'opacity-100')}>
      <div className="w-full max-w-[300px] rounded-[26px] border border-borda bg-sup/90 p-2 shadow-[0_20px_60px_rgba(18,26,43,.18)]">
        <CenaCarregando entrar={false} />
      </div>
    </div>
  );
}

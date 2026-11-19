import type { Achado, Foto } from '../dominio/modelo';
import { COR_GRAVIDADE, useUrl } from './ui';
import { cx } from '../lib/util';

/** Foto com as caixas dos achados desenhadas por cima (numeradas). */
export function FotoMarcada({ foto, achados, selecionado, aoSelecionar, grande, scanner, className, imprimir }: {
  foto: Foto; achados: Achado[]; selecionado?: string; aoSelecionar?: (id: string) => void;
  grande?: boolean; scanner?: boolean; className?: string; imprimir?: boolean;
}) {
  const url = useUrl(grande || imprimir ? foto.imagem : foto.miniatura);
  // só vira botão quando dá para tocar na caixa (evita botão dentro de botão)
  const Caixa = aoSelecionar ? 'button' : 'span';
  return (
    <div className={cx('relative overflow-hidden bg-[#0b1220]', className)} style={{ aspectRatio: `${foto.largura} / ${foto.altura}` }}>
      {url && <img src={url} alt={foto.analise?.legenda ?? foto.nomeArquivo} className="absolute inset-0 size-full object-cover" draggable={false} />}
      {achados.map((a, i) => a.regiao && (
        <Caixa
          key={a.id}
          {...(aoSelecionar ? { type: 'button' as const, onClick: () => aoSelecionar(a.id) } : {})}
          className={cx('caixa-achado absolute rounded-md border-2 text-left', !aoSelecionar && 'pointer-events-none', a.aceito === false && 'opacity-30')}
          style={{
            left: `${a.regiao.x}%`, top: `${a.regiao.y}%`, width: `${a.regiao.w}%`, height: `${a.regiao.h}%`,
            borderColor: COR_GRAVIDADE[a.gravidade],
            boxShadow: selecionado === a.id ? `0 0 0 3px #fff, 0 0 0 6px ${COR_GRAVIDADE[a.gravidade]}` : `0 0 0 1px rgba(0,0,0,.25)`,
            background: selecionado === a.id ? 'rgba(255,255,255,.12)' : 'transparent',
            animationDelay: `${i * 120}ms`,
          }}
          aria-label={`Achado ${i + 1}: ${a.tipo}`}
        >
          <span className="absolute -left-0.5 -top-0.5 grid min-w-5 place-items-center rounded-br-md rounded-tl-md px-1 text-[11px] font-extrabold leading-5 text-white" style={{ background: COR_GRAVIDADE[a.gravidade] }}>{i + 1}</span>
        </Caixa>
      ))}
      {scanner && <div className="scanner" />}
    </div>
  );
}

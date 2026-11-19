import { useEffect, useState } from 'react';

/**
 * Carregamento com a cara do LaudoTech: uma fachada em traço de planta, a Lia "escaneando" a parede,
 * a fissura aparecendo e sendo marcada (caixa numerada, como no app), fita de obra no chão.
 * Animação em SVG + CSS (leve, nítida em qualquer tela, respeita "reduzir movimento").
 */
const FRASES = ['Carregando…', 'Olhando as fotos…', 'Conferindo os achados…', 'Organizando o laudo…'];

export function CenaCarregando({ texto, frases = !texto, entrar = true }: { texto?: string; frases?: boolean; entrar?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (!frases) return; const t = setInterval(() => setI((x) => (x + 1) % FRASES.length), 1800); return () => clearInterval(t); }, [frases]);
  return (
    <div className="grid place-items-center px-4 py-10" role="status" aria-live="polite">
      <div className={entrar ? 'lt-cena w-full max-w-[340px]' : 'w-full max-w-[340px]'}>
        <svg viewBox="0 0 340 200" className="block w-full rounded-[22px]" aria-hidden>
          <defs>
            <linearGradient id="lt-feixe" x1="0" x2="1">
              <stop offset="0" stopColor="#FF8A1F" stopOpacity="0" />
              <stop offset=".5" stopColor="#FF8A1F" stopOpacity=".35" />
              <stop offset="1" stopColor="#FF8A1F" stopOpacity="0" />
            </linearGradient>
            <clipPath id="lt-parede"><rect x="88" y="78" width="164" height="86" /></clipPath>
            <clipPath id="lt-cartao"><rect width="340" height="200" rx="22" /></clipPath>
          </defs>
          <g clipPath="url(#lt-cartao)">
          <rect width="340" height="200" rx="22" fill="#121A2B" />
          <circle cx="300" cy="-10" r="90" fill="#FF8A1F" opacity=".12" />

          {/* estrelinhas */}
          <g fill="#FF8A1F">
            <path className="lt-brilho" d="M40 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
            <path className="lt-brilho lt-d2" d="M292 70l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
            <path className="lt-brilho lt-d3" d="M70 92l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
          </g>

          {/* fachada em traço */}
          <g fill="none" stroke="#E4E7EC" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M80 82 L170 36 L260 82" />
            <rect x="88" y="78" width="164" height="86" rx="2" />
            <rect x="108" y="98" width="38" height="30" rx="2" />
            <path d="M127 98v30M108 113h38" opacity=".6" />
            <rect x="190" y="112" width="34" height="52" rx="2" />
            <circle cx="217" cy="139" r="1.8" fill="#E4E7EC" />
          </g>

          {/* fissura se desenhando */}
          <path className="lt-fissura" d="M150 140 L158 150 L154 156 L163 164" fill="none" stroke="#FF8A1F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />

          {/* feixe de análise varrendo a parede */}
          <g clipPath="url(#lt-parede)">
            <rect className="lt-feixe" x="60" y="78" width="46" height="86" fill="url(#lt-feixe)" />
          </g>

          {/* caixa do achado (como no app) */}
          <g className="lt-marca">
            <rect x="141" y="133" width="30" height="34" rx="4" fill="none" stroke="#FF8A1F" strokeWidth="2.4" />
            <rect x="135" y="126" width="15" height="15" rx="4" fill="#FF8A1F" />
            <text x="142.5" y="137.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#121A2B" fontFamily="system-ui, sans-serif">1</text>
          </g>

          {/* chão: fita de obra correndo */}
          <line x1="24" x2="316" y1="166" y2="166" stroke="#E4E7EC" strokeWidth="2.2" strokeLinecap="round" />
          <clipPath id="lt-chao"><rect x="24" y="170" width="292" height="16" /></clipPath>
          <g clipPath="url(#lt-chao)">
            <line className="lt-fita" x1="24" x2="360" y1="178" y2="178" stroke="#FF8A1F" strokeWidth="4" strokeDasharray="18 10" strokeLinecap="round" />
          </g>
          </g>
        </svg>
        <div className="mx-auto mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-sup2">
          <span className="lt-barra block h-full w-1/3 rounded-full bg-obra" />
        </div>
        <p className="mt-3 text-center text-sm font-bold text-texto2">{texto ?? FRASES[i]}</p>
      </div>
    </div>
  );
}

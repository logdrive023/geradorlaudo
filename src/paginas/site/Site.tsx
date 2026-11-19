import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AlarmClock, ArrowRight, BookOpenText, HardHat, Wallet, ArrowUp, Camera, Check, ClipboardCheck, ClipboardList, Cloud, Crosshair, FileDown, FileSpreadsheet, Link2, MapPin, Mic, ScanSearch, Share2, ShieldCheck, Smartphone, Sparkles, TriangleAlert, X } from 'lucide-react';
import { Logo } from '../../componentes/ui';
import { RodapeSite } from './Legal';
import { LISTA_TIPOS } from '../../dominio/tipos';
import { ICONE_TIPO } from '../painel/NovoLaudo';
import { cx } from '../../lib/util';
import { Lia, PergunteLia, RostoLia } from '../../componentes/Lia';
import { AJUDA_SITE } from '../../ia/ajudaSite';
import { Comparacao, Confianca, ParaQuem, Planos } from './SecoesVenda';

/* ---------- a "foto" do hero: parede desenhada + IA marcando ---------- */
const ACHADOS_HERO = [
  { x: 55, y: 50, w: 30, h: 42, cor: 'var(--medio)', t: 'Fissura inclinada', g: 'Médio', c: 86 },
  { x: 8, y: 6, w: 34, h: 26, cor: 'var(--critico)', t: 'Infiltração no forro', g: 'Crítico', c: 81 },
  { x: 6, y: 78, w: 40, h: 18, cor: 'var(--minimo)', t: 'Eflorescência', g: 'Mínimo', c: 72 },
];

function FotoHero() {
  const [fase, setFase] = useState(0);
  useEffect(() => { const t = setInterval(() => setFase((f) => (f + 1) % 5), 1400); return () => clearInterval(t); }, []);
  const visiveis = Math.min(fase, 3);
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[22px] border-[1.5px] border-[#121A2B] bg-[#121A2B] shadow-[0_50px_80px_-30px_rgba(18,26,43,.45)]">
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-xs font-bold text-white/60">Foto 07 · Sala · Rua das Acácias, 120</span>
        </div>
        <div className="relative aspect-[4/3]">
          <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <radialGradient id="mancha" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#8a7a58" stopOpacity=".7" /><stop offset="1" stopColor="#8a7a58" stopOpacity="0" /></radialGradient>
            </defs>
            <rect width="400" height="300" fill="#E9E3D7" />
            <rect y="0" width="400" height="18" fill="#F4F1EA" />
            <ellipse cx="90" cy="40" rx="80" ry="40" fill="url(#mancha)" />
            <rect x="80" y="70" width="130" height="110" fill="#C7D5E6" stroke="#F7F7F4" strokeWidth="8" />
            <line x1="145" y1="70" x2="145" y2="180" stroke="#F7F7F4" strokeWidth="6" />
            <path d="M214 176 L226 190 L236 196 L244 214 L258 222 L266 240 L282 252 L290 268" fill="none" stroke="#3a332c" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M244 214 L236 226" stroke="#3a332c" strokeWidth="1.2" />
            <rect y="262" width="400" height="38" fill="#9c7b58" />
            {[...Array(14)].map((_, i) => <circle key={i} cx={30 + i * 11} cy={250 + (i % 3) * 4} r={6 + (i % 4)} fill="#fff" opacity=".45" />)}
          </svg>
          {ACHADOS_HERO.slice(0, visiveis).map((a, i) => (
            <div key={i} className="caixa-achado absolute rounded-md border-2" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, borderColor: a.cor }}>
              <span className="absolute -left-0.5 -top-0.5 rounded-br-md rounded-tl-md px-1.5 text-[11px] font-extrabold leading-5 text-white" style={{ background: a.cor }}>{i + 1}</span>
            </div>
          ))}
          {fase < 3 && <div className="scanner" />}
        </div>
      </div>
      {/* cartões dos achados */}
      <div className="absolute -bottom-10 -left-4 grid w-[230px] gap-2 sm:-left-10">
        {ACHADOS_HERO.slice(0, visiveis).map((a, i) => (
          <div key={i} className="caixa-achado flex items-center gap-2 rounded-2xl border border-borda bg-sup p-2.5 shadow-[0_10px_30px_rgba(18,26,43,.14)]" style={{ animationDelay: '150ms' }}>
            <span className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white" style={{ background: a.cor }}>{i + 1}</span>
            <div className="min-w-0 flex-1 leading-tight"><b className="block truncate text-[13px]">{a.t}</b><span className="text-[11px] text-texto3">{a.g} · IA {a.c}%</span></div>
            <Check className="size-4 text-ok" />
          </div>
        ))}
      </div>
    </div>
  );
}

const PASSOS = [
  { ic: Camera, t: 'Suba as fotos', d: 'Do celular, no próprio imóvel, ou do computador depois. Todas de uma vez: a gente guarda a data e o local de cada uma.' },
  { ic: ScanSearch, t: 'A IA analisa', d: 'Cada foto ganha ambiente, legenda técnica e os achados marcados na imagem, com sistema, grau de risco e recomendação.' },
  { ic: ClipboardCheck, t: 'Você confere', d: 'Aceita, corrige ou descarta cada achado. Só entra no laudo o que você aprovou. A assinatura continua sendo sua.' },
];

const ANTES_DEPOIS = [
  ['Uma noite inteira legendando 120 fotos', 'Legenda técnica pronta em cada foto'],
  ['Montar a tabela de anomalias na mão', 'Tabela com grau de risco e prioridade montada sozinha'],
  ['Cada laudo sai num formato diferente', 'Mesmo padrão sempre, com as normas citadas'],
  ['Descobrir que faltou a ART depois de imprimir', '“Pronto para assinar?” confere tudo antes'],
];

const RECURSOS = [
  { ic: Crosshair, t: 'Achado marcado na foto', d: 'Caixa numerada sobre a anomalia. Errou? Arraste e remarque.' },
  { ic: TriangleAlert, t: 'Grau de risco', d: 'Crítico, médio e mínimo, com Prioridade 1, 2 e 3 (NBR 16747).' },
  { ic: Mic, t: 'Ditado por voz', d: 'Fale a observação no local; o texto entra na foto.' },
  { ic: MapPin, t: 'Data e GPS da foto', d: 'Lidos da própria imagem, para a prova ficar datada.' },
  { ic: FileDown, t: 'PDF, Word e Excel', d: 'Capa, relatório fotográfico 2 por página, assinatura e o plano de ação em planilha.' },
  { ic: Smartphone, t: 'Feito para o celular', d: 'Tire a foto e confira no mesmo aparelho. Instala como app, sem loja.' },
  { ic: Cloud, t: 'Salvo na nuvem', d: 'Seus laudos no servidor e no aparelho. Trocou de celular? Entre e eles voltam.' },
  { ic: ClipboardList, t: 'Plano de ação', d: 'Cada anomalia com prazo, responsável e custo estimado do reparo.' },
  { ic: Link2, t: 'Link do cliente', d: 'O cliente lê o laudo no celular e baixa o PDF, sem criar conta.' },
  { ic: HardHat, t: 'Gestão de obras', d: 'Cronograma com medição, diário de obra (RDO), financeiro e compras com cotação.' },
  { ic: BookOpenText, t: 'Diário com a Lia', d: 'Anote rápido no canteiro; a Lia passa a limpo em linguagem técnica.' },
  { ic: Wallet, t: 'Orçado × gasto', d: 'Despesas por etapa, o que falta pagar e planilha para o Excel.' },
];

const DUVIDAS = [
  ['A IA assina o laudo?', 'Não. A IA faz o rascunho; você confere cada foto e cada achado. A responsabilidade técnica, a ART e a assinatura são suas.'],
  ['Para onde vão as minhas fotos?', 'Para o servidor do LaudoTech: a IA analisa e as fotos ficam guardadas com o seu laudo, no seu aparelho e na nuvem, num armazenamento privado.'],
  ['Preciso instalar alguma coisa?', 'Não. Abre no navegador do computador ou do celular, e dá para instalar como app na tela inicial, sem loja.'],
  ['Como o meu cliente recebe o laudo?', 'Além do PDF, você gera um link e manda no WhatsApp. O cliente lê no celular e baixa o PDF, sem conta. Você desliga o link quando quiser.'],
  ['Dá para gerir a obra também?', 'Dá: cada obra tem cronograma com medição e classificação das etapas, diário de obra (RDO) com fotos e PDF, financeiro orçado × gasto e compras com cotação. O cliente acompanha por um link.'],
  ['E depois da vistoria?', 'O plano de ação transforma cada anomalia em tarefa com prazo (sugerido pela gravidade), responsável e custo estimado. Sai no PDF e em planilha Excel.'],
  ['Quais tipos de laudo?', 'Vistoria cautelar, entrega de imóvel, locação, inspeção predial, vícios construtivos, estrutural, reforma (NBR 16280), perícia judicial, avaliação (NBR 14653) e contábil. Cada um com seu padrão, que você pode personalizar.'],
  ['Dá para usar com a minha equipe?', 'Dá: a organização tem três papéis. O admin controla tudo; o engenheiro vê os laudos dele e os atribuídos, confere e assina; o assistente faz o campo (fotos, dados, diário) só no que for atribuído a ele, sem ver o financeiro nem emitir laudo.'],
  ['Como faço para usar?', 'Nesta fase o acesso é por convite: o administrador do escritório convida a equipe e cada pessoa cria a própria senha. Os planos (Profissional e Escritório) serão anunciados antes de qualquer cobrança.'],
  ['Como provo que o laudo é meu e não foi alterado?', 'As fotos guardam data e local, e cada achado passa pela sua aprovação. Ao emitir, o laudo ganha um código de verificação no PDF: quem recebe confere online se ele é autêntico e quem é o responsável.'],
  ['Quais normas o laudo cita?', 'ABNT NBR 13752 (perícias), NBR 16747 (inspeção predial), NBR 15575 (desempenho), NBR 5674 (manutenção), conforme o tipo de laudo.'],
];

/** "Faça a conta": a pessoa digita a própria rotina e vê o tempo que ganha (estimativa, sem enviar nada). */
function Calculadora() {
  const [laudos, setLaudos] = useState(6);
  const [fotos, setFotos] = useState(40);
  const [min, setMin] = useState(3);
  const REDUCAO = 0.7;
  const horas = (laudos * fotos * min * REDUCAO) / 60;
  const Linha = ({ rot, v, set, de, ate, passo = 1, un }: { rot: string; v: number; set: (n: number) => void; de: number; ate: number; passo?: number; un: string }) => (
    <label className="grid gap-2">
      <span className="flex items-baseline justify-between font-bold"><span>{rot}</span><b className="font-display text-2xl text-tinta">{v}<small className="ml-1 text-sm text-texto3">{un}</small></b></span>
      <input type="range" min={de} max={ate} step={passo} value={v} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[var(--obra)]" />
    </label>
  );
  return (
    <section id="conta" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-20 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Quanto tempo a Lia <span className="grifo">devolve</span> para você?</h2>
          <p className="mt-4 text-lg text-texto2">Mexa nos números da sua rotina. A conta é feita aqui no seu navegador e nada é enviado.</p>
          <div className="mt-8 grid gap-6 rounded-[22px] border border-borda bg-sup p-6">
            <Linha rot="Laudos por mês" v={laudos} set={setLaudos} de={1} ate={40} un="laudos" />
            <Linha rot="Fotos por laudo" v={fotos} set={setFotos} de={10} ate={200} passo={5} un="fotos" />
            <Linha rot="Minutos por foto hoje" v={min} set={setMin} de={1} ate={10} un="min" />
          </div>
        </div>
        <div className="relative min-w-0 overflow-hidden rounded-[28px] bg-[#121A2B] p-6 text-white sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-obra/30 blur-3xl" aria-hidden />
          <span className="relative rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-obra">Estimativa</span>
          <div className="relative mt-5 font-display text-6xl font-extrabold leading-none sm:text-7xl md:text-8xl">{Math.round(horas)}<span className="ml-2 text-3xl text-[#A9B1C1]">h/mês</span></div>
          <p className="relative mt-3 text-lg text-[#C9CED8]">{fraseTempo(horas)}</p>
          <p className="relative mt-6 text-xs text-[#8C95A6]">Considera que a IA faz cerca de 70% do trabalho de legendar, descrever e montar a tabela, e que você continua conferindo cada foto. Seu resultado pode variar.</p>
          <Link to="/entrar" className="pilula pilula-obra relative mt-6 w-full sm:w-auto">Entrar <ArrowRight className="size-5" /></Link>
        </div>
      </div>
    </section>
  );
}


/** Traduz as horas economizadas numa frase que faz sentido (um mês tem ~22 dias úteis de 8 h = 176 h). */
function fraseTempo(horas: number) {
  const DIA = 8, MES = 22 * DIA;
  const h = Math.round(horas);
  if (h < DIA) return `≈ ${Math.max(1, h)} hora${h > 1 ? 's' : ''} por mês a menos de legenda e tabela.`;
  const dias = Math.round(horas / DIA);
  if (horas <= MES) {
    const semanas = horas / (5 * DIA);
    return `≈ ${dias} dia${dias > 1 ? 's' : ''} ${dias > 1 ? 'úteis' : 'útil'} por mês livre${dias > 1 ? 's' : ''} de legenda e tabela${semanas >= 1 ? ` (${Math.floor(semanas) > 1 ? `${Math.floor(semanas)} semanas` : '1 semana'} de trabalho)` : ''}, para vistoriar mais ou descansar.`;
  }
  const pessoas = horas / MES;
  const nPessoas = pessoas < 10 ? pessoas.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : Math.round(pessoas).toLocaleString('pt-BR');
  return `É mais que um mês inteiro de trabalho (~176 h úteis): seria preciso ≈ ${nPessoas} pessoa${pessoas >= 1.05 ? 's' : ''} em tempo integral só para legendar e montar tabela.`;
}

export function Site() {
  const [rolou, setRolou] = useState(false);
  const [topo, setTopo] = useState(false); // setinha de voltar ao topo
  useEffect(() => { const f = () => { setRolou(scrollY > 8); setTopo(scrollY > 700); }; addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  return (
    <div className="overflow-x-hidden">
      <header className={cx('sticky top-0 z-40 border-b bg-papel/88 backdrop-blur-md transition-colors', rolou ? 'border-borda' : 'border-transparent')}>
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4">
          <Link to="/"><Logo /></Link>
          <nav className="hidden gap-7 text-sm font-bold text-texto2 lg:flex">
            <a href="#como" className="hover:text-texto">Como funciona</a>
            <a href="#para-quem" className="hover:text-texto">Para quem</a>
            <a href="#recursos" className="hover:text-texto">Recursos</a>
            <a href="#confianca" className="hover:text-texto">Confiança</a>
            <a href="#planos" className="hover:text-texto">Planos</a>
            <a href="#duvidas" className="hover:text-texto">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Link to="/entrar" className="inline-flex h-10 items-center rounded-full px-3 text-sm font-bold text-texto2 hover:text-texto sm:px-4">Entrar</Link>
            <Link to="/entrar" className="pilula pilula-obra !min-h-10 !px-4 whitespace-nowrap text-sm">Entrar</Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative">
          <div className="pointer-events-none absolute -right-40 -top-20 size-[520px] rounded-full bg-obra/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 px-4 pb-24 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
            <div>
              <span className="revelar inline-flex items-center gap-2 rounded-full border border-borda bg-sup px-3 py-1 text-sm font-bold text-texto2"><Sparkles className="size-4 text-obra" />Para engenheiros, arquitetos e peritos</span>
              <h1 className="revelar mt-5 text-[44px] font-extrabold leading-[.98] tracking-[-0.035em] sm:text-6xl lg:text-[76px]" style={{ animationDelay: '60ms' }}>
                Fotos viram <span className="grifo">laudo</span>.
              </h1>
              <p className="revelar mt-6 max-w-[540px] text-lg leading-relaxed text-texto2" style={{ animationDelay: '120ms' }}>
                Suba as fotos da vistoria. A IA aponta fissuras, umidade e o grau de risco de cada uma. Você confere, e o laudo sai no padrão, pronto para assinar.
              </p>
              <div className="revelar mt-8 flex flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
                <Link to="/entrar" className="pilula pilula-obra text-base">Entrar <ArrowRight className="size-5" /></Link>
                <a href="#como" className="pilula pilula-clara text-base">Ver como funciona</a>
              </div>
              <ul className="revelar mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-texto2" style={{ animationDelay: '240ms' }}>
                {['Acesso por convite', 'Você aprova cada achado', 'Seu nome na capa'].map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-ok" />{t}</li>)}
              </ul>
              <Lia className="revelar mt-7 max-w-md" humor="feliz" tam={42}>Oi! Sou a Lia. Eu olho as fotos e escrevo o rascunho. Você confere e assina.</Lia>
            </div>
            <div className="relative mx-auto w-full max-w-[520px] lg:rotate-[1.5deg]">
              <span className="absolute -right-3 -top-6 z-10 rotate-6 rounded-xl border-[1.5px] border-[#121A2B] bg-obra px-3 py-1.5 text-center text-xs font-extrabold leading-tight text-[#121A2B] shadow-[0_3px_0_#121A2B]">legenda<br />sem digitar</span>
              <span className="absolute -right-6 bottom-16 z-10 -rotate-3 rounded-xl border-[1.5px] border-[#121A2B] bg-sup px-3 py-1.5 text-center text-xs font-extrabold leading-tight shadow-[0_3px_0_#121A2B]">pronto para<br /><b className="text-obra-forte">assinar</b></span>
              <FotoHero />
            </div>
          </div>
        </section>

        {/* FITA DE OBRA */}
        <div className="fita relative overflow-hidden py-3" aria-hidden>
          <div className="flex w-max animate-[rolar_28s_linear_infinite] gap-10 whitespace-nowrap font-display text-lg font-extrabold uppercase tracking-wider text-white [text-shadow:0_1px_0_#121A2B]">
            {[...Array(2)].map((_, k) => <span key={k} className="flex gap-10">{['Suba as fotos', 'A IA analisa', 'Você confere', 'O laudo sai pronto', 'Plano de ação', 'Link do cliente', 'Gestão de obras', 'Diário de obra', 'NBR 13752', 'NBR 16747'].map((t) => <span key={t} className="rounded bg-[#121A2B] px-3">{t}</span>)}</span>)}
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <section id="como" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-20 md:py-28">
          <h2 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">Três passos. Nenhuma <span className="grifo">legenda</span> na mão.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PASSOS.map(({ ic: Ic, t, d }, i) => (
              <div key={t} className="relative rounded-[22px] border border-borda bg-sup p-6">
                <span className="font-display text-6xl font-extrabold text-obra/30">0{i + 1}</span>
                <span className="absolute right-6 top-6 grid size-12 place-items-center rounded-2xl bg-obra-suave text-obra-texto"><Ic className="size-6" /></span>
                <h3 className="mt-2 text-2xl font-bold">{t}</h3>
                <p className="mt-2 leading-relaxed text-texto2">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ANTES × DEPOIS */}
        <section className="bg-sup py-20 md:py-28">
          <div className="mx-auto max-w-[1180px] px-4">
            <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">O seu laudo hoje. E com o <span className="grifo">LaudoTech</span>.</h2>
            <div className="mt-10 grid gap-3">
              {ANTES_DEPOIS.map(([a, d]) => (
                <div key={a} className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="flex items-center gap-3 rounded-2xl bg-papel p-4 text-texto2"><X className="size-5 shrink-0 text-critico" /><span className="line-through decoration-critico/40">{a}</span></div>
                  <ArrowRight className="mx-auto hidden size-5 text-texto3 md:block" />
                  <div className="flex items-center gap-3 rounded-2xl border border-ok/30 bg-ok-suave p-4 font-bold text-ok-texto"><Check className="size-5 shrink-0" />{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARA QUEM É */}
        <ParaQuem />

        {/* FAÇA A CONTA (valor) */}
        <Calculadora />

        {/* COMPARAÇÃO */}
        <Comparacao />

        {/* SEU NOME NA CAPA (autoridade / pertencimento) */}
        <section className="bg-sup py-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Seu nome na capa. Não o <span className="grifo">nosso</span>.</h2>
              <p className="mt-4 text-lg leading-relaxed text-texto2">O laudo sai com a sua logo, o seu registro, a sua ART e a sua assinatura. A IA trabalha nos bastidores; quem aparece para o cliente é você.</p>
              <ul className="mt-6 grid gap-3">
                {['Normas ABNT citadas certinho para cada tipo de laudo', 'Fotos numeradas, datadas e com a anomalia marcada', 'Tabela de constatações com grau de risco e prioridade', 'Lista “pronto para assinar?” antes de entregar'].map((t) => (
                  <li key={t} className="flex items-start gap-3 font-semibold"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok-suave text-ok-texto"><Check className="size-4" /></span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="relative mx-auto h-[420px] w-full max-w-[460px]" aria-hidden>
              {[2, 1, 0].map((i) => (
                <div key={i} className="absolute inset-x-6 top-0 h-[400px] rounded-xl border border-borda bg-white p-6 text-[#1b1f29] shadow-[0_20px_50px_rgba(18,26,43,.14)]"
                  style={{ transform: `translate(${i * 18}px, ${i * 14}px) rotate(${i * 2.5 - 2}deg)`, zIndex: 3 - i }}>
                  {i === 0 && (
                    <>
                      <div className="flex items-center justify-between"><span className="rounded-md bg-[#1D3B70] px-2 py-1 text-[10px] font-extrabold text-white">SUA LOGO</span><span className="text-[10px] text-[#6b7890]">18 de novembro de 2026</span></div>
                      <div className="fita mt-6 h-1.5 rounded" />
                      <div className="mt-6 text-[10px] font-extrabold uppercase tracking-[.14em] text-obra-forte">Vistoria cautelar de vizinhança</div>
                      <div className="mt-1 font-display text-2xl font-extrabold leading-tight text-[#1D3B70]">Rua das Acácias, 120</div>
                      <div className="mt-4 grid gap-1">{[['Solicitante', 'Construtora Horizonte'], ['Fotos', '42 · 9 ambientes'], ['Achados', '2 críticos · 5 médios']].map(([k, v]) => <div key={k} className="flex border-b border-[#e3e8f0] py-1 text-[11px]"><b className="w-24 text-[#1D3B70]">{k}</b>{v}</div>)}</div>
                      <div className="absolute inset-x-6 bottom-6 border-t border-[#e3e8f0] pt-3 text-[11px]"><b>Eng. Seu Nome</b><br /><span className="text-[#526079]">CREA 000000000 · ART nº 0000000</span></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONFIANÇA */}
        <Confianca />

        {/* RECURSOS */}
        <section id="recursos" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-20 md:py-28">
          <h2 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">Feito para usar <span className="grifo">na obra</span>.</h2>
          <p className="mt-3 max-w-xl text-lg text-texto2">O que os melhores apps de vistoria do mundo têm, no padrão de laudo brasileiro.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map(({ ic: Ic, t, d }) => (
              <div key={t} className="rounded-[22px] border border-borda bg-sup p-6 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,26,43,.07)]">
                <span className="grid size-11 place-items-center rounded-xl bg-tinta/10 text-tinta"><Ic className="size-5" /></span>
                <h3 className="mt-4 text-xl font-bold">{t}</h3>
                <p className="mt-1.5 text-texto2">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DEPOIS DO LAUDO: plano de ação, link do cliente, app */}
        <section id="entrega" className="scroll-mt-20 bg-sup py-20 md:py-28">
          <div className="mx-auto max-w-[1180px] px-4">
            <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">O laudo não termina no <span className="grifo">PDF</span>.</h2>
            <p className="mt-3 max-w-2xl text-lg text-texto2">Depois da assinatura começa o trabalho do seu cliente. O LaudoTech organiza o que fazer, em que ordem e quanto custa, e entrega tudo num link.</p>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col rounded-[22px] border border-borda bg-papel p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><ClipboardList className="size-5" /></span>
                <h3 className="mt-4 text-xl font-bold">Plano de ação</h3>
                <p className="mt-1.5 text-texto2">Cada anomalia vira tarefa com prazo sugerido pela gravidade, responsável e custo estimado.</p>
                <div className="mt-5 grid gap-2 rounded-2xl border border-borda bg-sup p-3 text-sm" aria-hidden>
                  {[['Fissura em viga', 'Crítico', '7 dias', 'A fazer', 'bg-critico-suave text-critico-texto'], ['Infiltração no teto', 'Médio', '30 dias', 'Em andamento', 'bg-medio-suave text-medio-texto'], ['Rejunte gasto', 'Mínimo', '90 dias', 'Resolvida', 'bg-ok-suave text-ok-texto']].map(([a, g, p, st, cls]) => (
                    <div key={a} className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2">
                      <span className="min-w-0 flex-1"><b className="block truncate">{a}</b><span className="flex items-center gap-1 text-xs text-texto3"><AlarmClock className="size-3" />{g} · {p}</span></span>
                      <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', cls)}>{st}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-1 pt-1 text-xs font-bold text-texto2"><span className="flex items-center gap-1"><FileSpreadsheet className="size-3.5" />Planilha Excel</span><span>R$ 4.850 em reparos</span></div>
                </div>
              </div>
              <div className="flex flex-col rounded-[22px] border border-borda bg-papel p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Link2 className="size-5" /></span>
                <h3 className="mt-4 text-xl font-bold">Link do cliente</h3>
                <p className="mt-1.5 text-texto2">Mande no WhatsApp. O cliente lê no celular e baixa o PDF, sem conta. Você desliga quando quiser.</p>
                <div className="mt-5 rounded-2xl border border-borda bg-sup p-3" aria-hidden>
                  <div className="rounded-xl bg-[#121A2B] p-3 text-white">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-obra">Inspeção predial</p>
                    <p className="font-display text-lg font-extrabold leading-tight">Ed. Jardim das Acácias</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-white/75"><ShieldCheck className="size-3.5 text-obra" />Eng. responsável · CREA</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2 text-xs"><Link2 className="size-3.5 shrink-0 text-obra" /><span className="min-w-0 flex-1 truncate text-texto2">laudotech.pages.dev/ver/…</span><Share2 className="size-3.5 shrink-0 text-texto3" /></div>
                </div>
              </div>
              <div className="flex flex-col rounded-[22px] border border-borda bg-papel p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Smartphone className="size-5" /></span>
                <h3 className="mt-4 text-xl font-bold">No bolso, como app</h3>
                <p className="mt-1.5 text-texto2">Instala na tela inicial direto do navegador. Tire a foto na vistoria e confira no mesmo aparelho.</p>
                <div className="mt-5 grid grid-cols-4 gap-3 rounded-2xl border border-borda bg-[#121A2B] p-4" aria-hidden>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="grid justify-items-center gap-1">
                      <span className={cx('grid aspect-square w-full place-items-center rounded-xl', i === 2 ? 'bg-obra' : 'bg-white/10')}>{i === 2 && <ClipboardCheck className="size-5 text-[#121A2B]" />}</span>
                      <span className={cx('h-1.5 w-8 max-w-full rounded-full', i === 2 ? 'bg-white/80' : 'bg-white/15')} />
                    </div>
                  ))}
                  <p className="col-span-4 flex items-center justify-center gap-1.5 text-xs font-bold text-white/70"><Cloud className="size-3.5" />Salvo na nuvem e no aparelho</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/entrar" className="pilula pilula-obra text-base">Entrar <ArrowRight className="size-5" /></Link>
              <span className="text-sm font-bold text-texto2">Acesso por convite · sem instalar nada</span>
            </div>
          </div>
        </section>

        {/* TIPOS */}
        <section id="tipos" className="scroll-mt-20 bg-[#121A2B] py-20 text-white md:py-28">
          <div className="mx-auto max-w-[1180px] px-4">
            <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Dez laudos, um <span className="grifo">padrão</span>.</h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LISTA_TIPOS.map((t) => {
                const Ic = ICONE_TIPO[t.id];
                return (
                  <div key={t.id} className="rounded-[22px] border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-obra text-[#121A2B]"><Ic className="size-5" /></span><h3 className="text-xl font-bold">{t.nome}</h3></div>
                    <p className="mt-3 text-[#B6BECC]">{t.descricao}</p>
                    <p className="mt-3 text-sm font-bold text-obra">{t.normas.map((n) => n.split(' —')[0]).join(' · ')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PLANOS */}
        <Planos />

        {/* DÚVIDAS */}
        <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:py-28">
          <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Pergunta de quem <span className="grifo">assina</span>.</h2>
          <div className="mt-8 grid gap-3">
            {DUVIDAS.map(([p, r]) => (
              <details key={p} className="group rounded-2xl border border-borda bg-sup p-5 open:shadow-[0_8px_24px_rgba(18,26,43,.06)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">{p}<span className="grid size-8 shrink-0 place-items-center rounded-full bg-sup2 transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 leading-relaxed text-texto2">{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="px-4 pb-20">
          <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[28px] bg-[#121A2B] px-6 py-16 text-center text-white md:py-20">
            <div className="fita absolute inset-x-0 top-0 h-2" aria-hidden />
            <div className="mx-auto w-fit"><RostoLia humor="feliz" tam={72} /></div>
            <h2 className="mt-4 text-4xl font-extrabold md:text-6xl">Bora <span className="grifo">vistoriar</span>?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[#B6BECC]">Crie a conta, mande as fotos da próxima vistoria e veja a Lia escrever o laudo. Leva dois minutos.</p>
            <Link to="/entrar" className="pilula pilula-obra mt-8 text-base">Entrar <ArrowRight className="size-5" /></Link>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-[#C9CED8]">
              {['Acesso por convite', 'Seus dados ficam com você', 'Exporte quando quiser'].map((t) => <li key={t} className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-obra" />{t}</li>)}
            </ul>
          </div>
        </section>
      </main>

      {/* Lia (dúvidas sobre o produto) + setinha para o topo: quando a setinha aparece, a Lia sobe um pouco */}
      <PergunteLia ajuda={AJUDA_SITE} site subir={topo} />
      <button onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Voltar ao topo" tabIndex={topo ? 0 : -1}
        className={cx('fixed bottom-24 right-4 z-40 grid size-12 place-items-center rounded-full border-[1.5px] border-[#121A2B] bg-sup shadow-[0_3px_0_#121A2B] transition-all duration-300 md:bottom-6 md:right-6',
          topo ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}>
        <ArrowUp className="size-5" />
      </button>

      {/* barra fixa no celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-papel/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Link to="/entrar" className="pilula pilula-obra w-full">Entrar <span className="font-bold opacity-70">· acesso por convite</span></Link>
      </div>

      <RodapeSite barraFixa />
    </div>
  );
}

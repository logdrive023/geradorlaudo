import { Link } from 'react-router';
import { ArrowRight, BadgeCheck, Building2, Check, Fingerprint, HardHat, Landmark, Minus, QrCode, ScanSearch, ShieldCheck, User, Users, X } from 'lucide-react';
import { cx } from '../../lib/util';

/* Seções de venda da página inicial: para quem é, comparação, confiança e planos.
   Regra: só prometer o que existe; o que ainda não tem tela aparece como "em breve". */


/* ---------- para quem ---------- */
const PUBLICOS = [
  { ic: User, t: 'Engenheiro ou arquiteto autônomo', d: 'Faz mais vistorias no mesmo mês, com laudo no padrão e o seu nome na capa.', itens: ['Laudo a partir das fotos', 'Plano de ação com custos', 'Link para o cliente'] },
  { ic: Users, t: 'Escritório com equipe', d: 'O assistente fotografa no campo; o engenheiro confere e assina. Cada um vê o que é dele.', itens: ['Papéis: admin, engenheiro e assistente', 'Convite por link; cada um com a própria senha', 'Registro de quem fez o quê'] },
  { ic: HardHat, t: 'Construtora e reforma', d: 'Obra e laudo no mesmo lugar: cronograma, diário, financeiro e a vistoria de entrega.', itens: ['Diário de obra (RDO) com a Lia', 'Orçado × gasto por etapa', 'Portal para o cliente acompanhar'] },
  { ic: Building2, t: 'Condomínio e administradora', d: 'Inspeção predial no padrão da NBR 16747, com prioridades e um plano para o síndico seguir.', itens: ['Grau de risco e prioridade', 'Prazos e responsáveis', 'Planilha para a assembleia'] },
];

export function ParaQuem() {
  return (
    <section id="para-quem" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-20 md:py-28">
      <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Feito para quem <span className="grifo">assina</span> e para quem toca a obra.</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PUBLICOS.map(({ ic: Ic, t, d, itens }) => (
          <div key={t} className="flex flex-col rounded-[22px] border border-borda bg-sup p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Ic className="size-5" /></span>
            <h3 className="mt-4 text-lg font-bold leading-snug">{t}</h3>
            <p className="mt-1.5 text-sm text-texto2">{d}</p>
            <ul className="mt-4 grid gap-1.5 text-sm">
              {itens.map((i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- comparação ---------- */
type Marca = 'sim' | 'nao' | 'parcial';
const LINHAS: [string, Marca, Marca, Marca][] = [
  ['A IA lê cada foto e aponta o problema, com grau de risco', 'sim', 'nao', 'nao'],
  ['Você aprova cada achado antes de entrar no laudo', 'sim', 'nao', 'parcial'],
  ['Laudo no padrão das normas (NBR 13752, 16747…)', 'sim', 'parcial', 'parcial'],
  ['Plano de ação com prazo, responsável e custo', 'sim', 'nao', 'parcial'],
  ['Link para o cliente ler no celular', 'sim', 'nao', 'sim'],
  ['Gestão da obra no mesmo app (cronograma, diário, financeiro)', 'sim', 'nao', 'nao'],
  ['Legenda e tabela sem digitar', 'sim', 'nao', 'parcial'],
];
const Celula = ({ v }: { v: Marca }) => (
  <td className="px-2 py-3 text-center">
    {v === 'sim' ? <Check className="mx-auto size-5 text-ok" aria-label="sim" /> : v === 'nao' ? <X className="mx-auto size-5 text-critico/70" aria-label="não" /> : <Minus className="mx-auto size-5 text-medio" aria-label="em parte" />}
  </td>
);

export function Comparacao() {
  return (
    <section className="bg-sup py-20 md:py-28">
      <div className="mx-auto max-w-[1180px] px-4">
        <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Não é só mais um app de <span className="grifo">vistoria</span>.</h2>
        <p className="mt-3 max-w-2xl text-lg text-texto2">Os apps de vistoria organizam fotos. O LaudoTech lê as fotos, escreve o laudo e acompanha o que vem depois.</p>
        <div className="mt-10 overflow-x-auto rounded-[22px] border border-borda bg-papel">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-borda text-left">
                <th className="p-4 font-bold text-texto2">O que você precisa</th>
                <th className="w-28 bg-[#121A2B] p-4 text-center font-extrabold text-white">LaudoTech</th>
                <th className="w-28 p-4 text-center font-bold text-texto2">Word e planilha</th>
                <th className="w-28 p-4 text-center font-bold text-texto2">Apps de vistoria</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS.map(([t, a, b, c]) => (
                <tr key={t} className="border-b border-borda last:border-0">
                  <td className="p-4 font-semibold">{t}</td>
                  <td className="bg-[#121A2B]/[.04]"><Celula v={a} /></td><Celula v={b} /><Celula v={c} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-texto3">
          <span className="flex items-center gap-1"><Check className="size-3.5 text-ok" />tem</span>
          <span className="flex items-center gap-1"><Minus className="size-3.5 text-medio" />em parte, varia por app</span>
          <span className="flex items-center gap-1"><X className="size-3.5 text-critico/70" />não tem</span>
          <span>Comparação geral do mercado em 2026, não de um produto específico.</span>
        </p>
      </div>
    </section>
  );
}

/* ---------- confiança ---------- */
const PILARES = [
  { ic: BadgeCheck, t: 'Você aprova cada achado', d: 'A IA sugere; nada entra no laudo sem o seu aceite. A responsabilidade técnica, a ART e a assinatura continuam suas.' },
  { ic: ScanSearch, t: 'Prova datada', d: 'Data e local de cada foto lidos da própria imagem, com a anomalia marcada e numerada.' },
  { ic: QrCode, t: 'Laudo verificável', d: 'Código de verificação no PDF: qualquer pessoa confere online se o laudo é autêntico, quando foi emitido e quem é o responsável.' },
  { ic: Landmark, t: 'Armazenamento privado', d: 'Fotos e laudos guardados em armazenamento privado, com acesso só pela sua conta. O cliente vê apenas pelo link que você criar e pode desligar.' },
  { ic: Fingerprint, t: 'Aceite do cliente', d: 'O cliente lê pelo link e registra o aceite ou a contestação, com data e hora. Você vê a resposta na hora.' },
  { ic: ShieldCheck, t: 'Seus dados são seus', d: 'Exporte tudo quando quiser. Sem anúncio e sem vender dado de ninguém.' },
];

export function Confianca() {
  return (
    <section id="confianca" className="scroll-mt-20 bg-[#121A2B] py-20 text-white md:py-28">
      <div className="mx-auto max-w-[1180px] px-4">
        <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Laudo é <span className="grifo">responsabilidade</span>. A gente leva a sério.</h2>
        <p className="mt-3 max-w-2xl text-lg text-[#B6BECC]">A IA acelera; quem decide é você. Tudo foi pensado para o laudo aguentar a pergunta do cliente, do síndico e do juiz.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILARES.map(({ ic: Ic, t, d }) => (
            <div key={t} className="rounded-[22px] border border-white/10 bg-white/5 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-obra text-[#121A2B]"><Ic className="size-5" /></span>
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-[#B6BECC]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- planos ---------- */
const PLANOS = [
  { nome: 'Teste', preco: 'Grátis', nota: 'agora, na fase de testes', destaque: true, itens: ['Laudos com IA (até 5 fotos por laudo)', 'Gestão de obras', 'Plano de ação e link do cliente', 'PDF, Word e Excel'] },
  { nome: 'Profissional', preco: 'Em breve', nota: 'para quem assina sozinho', itens: ['Laudos e fotos sem o limite de teste', 'Seu modelo e sua logo em todos', 'Código de verificação no laudo', 'Agenda de vistorias'] },
  { nome: 'Escritório', preco: 'Em breve', nota: 'para equipes', itens: ['Tudo do Profissional', 'Admin, engenheiros e assistentes', 'Laudos e obras atribuídos a cada um', 'Registro de atividades'] },
];

export function Planos() {
  return (
    <section id="planos" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-20 md:py-28">
      <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Comece de <span className="grifo">graça</span>.</h2>
      <p className="mt-3 max-w-2xl text-lg text-texto2">Na fase de testes tudo é liberado, sem cartão. Quando os planos chegarem, você é avisado antes de qualquer cobrança.</p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANOS.map((p) => (
          <div key={p.nome} className={cx('flex flex-col rounded-[22px] border p-6', p.destaque ? 'border-[#121A2B] bg-[#121A2B] text-white shadow-[0_6px_0_var(--obra)]' : 'border-borda bg-sup')}>
            <span className={cx('text-sm font-extrabold uppercase tracking-wider', p.destaque ? 'text-obra' : 'text-texto3')}>{p.nome}</span>
            <span className="mt-2 font-display text-4xl font-extrabold">{p.preco}</span>
            <span className={cx('text-sm', p.destaque ? 'text-[#B6BECC]' : 'text-texto2')}>{p.nota}</span>
            <ul className="mt-5 grid gap-2 text-sm">
              {p.itens.map((i) => <li key={i} className="flex items-start gap-2"><Check className={cx('mt-0.5 size-4 shrink-0', p.destaque ? 'text-obra' : 'text-ok')} />{i}</li>)}
            </ul>
            {p.destaque && <Link to="/cadastrar" className="pilula pilula-obra mt-6 w-full">Criar conta grátis <ArrowRight className="size-5" /></Link>}
          </div>
        ))}
      </div>
    </section>
  );
}

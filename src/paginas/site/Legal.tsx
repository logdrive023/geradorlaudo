import { useEffect, type ReactNode } from 'react';
import { cx } from '../../lib/util';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Camera, ClipboardCheck, FileCheck2, Lock, ScanSearch, ShieldCheck, Users } from 'lucide-react';
import { Logo } from '../../componentes/ui';

/** Dados da empresa: preencha aqui (aparecem em Termos, Privacidade e Sobre). */
export const EMPRESA = {
  nome: 'Log Drive',
  cnpj: '',              // ex.: 00.000.000/0001-00
  email: '',             // ex.: contato@seudominio.com.br
  cidade: 'São Paulo/SP',
};
const VIGENCIA = '19 de novembro de 2026';

function Contato() {
  return EMPRESA.email
    ? <a href={`mailto:${EMPRESA.email}`} className="font-bold text-tinta underline-offset-2 hover:underline">{EMPRESA.email}</a>
    : <>o canal de suporte dentro do aplicativo (botão <b>Ajuda</b>)</>;
}

/** Rodapé comum do site. `barraFixa`: a página tem a barra "Criar conta" fixa no celular (só a landing), então reserva espaço para ela. */
export function RodapeSite({ barraFixa = false }: { barraFixa?: boolean }) {
  return (
    <footer className={barraFixa ? 'border-t border-borda pb-28 pt-10 sm:pb-10' : 'border-t border-borda pb-10 pt-10'}>
      <div className="mx-auto grid max-w-[1180px] gap-6 px-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-2">
          <Logo tam={26} />
          <p className="max-w-sm text-sm text-texto3">Laudos técnicos de engenharia a partir das fotos da vistoria, com IA e conferência do responsável técnico.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-texto2" aria-label="Institucional">
          <Link to="/sobre" className="hover:text-texto">Sobre</Link>
          <Link to="/termos" className="hover:text-texto">Termos de uso</Link>
          <Link to="/privacidade" className="hover:text-texto">Privacidade</Link>
          <Link to="/entrar" className="hover:text-texto">Entrar</Link>
        </nav>
        <p className="text-xs text-texto3 sm:col-span-2">
          © {new Date().getFullYear()} LaudoTech · {EMPRESA.nome}{EMPRESA.cnpj && <> · CNPJ {EMPRESA.cnpj}</>} · Versão de teste
        </p>
      </div>
    </footer>
  );
}

/** Moldura das páginas institucionais: topo simples, índice, texto com boa leitura. */
function Pagina({ titulo, resumo, secoes, children }: { titulo: string; resumo: ReactNode; secoes?: { id: string; t: string }[]; children: ReactNode }) {
  useEffect(() => { document.title = `${titulo} · LaudoTech`; scrollTo(0, 0); }, [titulo]);
  return (
    <div className="min-h-dvh bg-papel">
      <header className="sticky top-0 z-30 border-b border-borda bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="Página inicial"><Logo tam={30} /></Link>
          <Link to="/" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-texto2 hover:text-texto"><ArrowLeft className="size-4" />Voltar ao site</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-10 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{titulo}</h1>
          <div className="mt-4 text-lg leading-relaxed text-texto2">{resumo}</div>
        </div>
        {/* duas colunas só quando há índice (Termos, Privacidade); o Sobre usa a largura toda */}
        <div className={cx('mt-10 grid gap-10', secoes && 'lg:grid-cols-[220px_minmax(0,1fr)]')}>
          {secoes && (
            <nav className="hidden lg:block" aria-label="Nesta página">
              <ol className="sticky top-24 grid gap-1 border-l-2 border-borda text-sm">
                {secoes.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="-ml-0.5 block border-l-2 border-transparent py-1 pl-3 text-texto2 hover:border-obra hover:text-texto">{i + 1}. {s.t}</a></li>)}
              </ol>
            </nav>
          )}
          <article className={cx('legal min-w-0', secoes && 'max-w-3xl')}>{children}</article>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}

const S = ({ id, n, t, children }: { id: string; n: number; t: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-24 border-t border-borda py-7 first:border-t-0 first:pt-0">
    <h2 className="text-xl font-extrabold md:text-2xl">{n}. {t}</h2>
    <div className="mt-3 grid gap-3 leading-relaxed text-texto2">{children}</div>
  </section>
);
const L = ({ itens }: { itens: ReactNode[] }) => (
  <ul className="grid gap-2 pl-5 [list-style:disc] marker:text-obra">{itens.map((x, i) => <li key={i}>{x}</li>)}</ul>
);
const Vigencia = () => <p className="mb-8 inline-flex rounded-full bg-sup2 px-3 py-1 text-sm font-bold text-texto2">Vigente desde {VIGENCIA}</p>;

/* ============================== TERMOS DE USO ============================== */

const SEC_TERMOS = [
  { id: 'aceite', t: 'Aceite' }, { id: 'servico', t: 'O serviço' }, { id: 'conta', t: 'Conta e acesso' },
  { id: 'responsabilidade', t: 'Responsabilidade técnica' }, { id: 'ia', t: 'Uso da inteligência artificial' },
  { id: 'conteudo', t: 'Seu conteúdo' }, { id: 'compartilhar', t: 'Link do cliente' }, { id: 'uso', t: 'Uso permitido' },
  { id: 'teste', t: 'Versão de teste e preços' }, { id: 'disponibilidade', t: 'Disponibilidade' },
  { id: 'limites', t: 'Limitação de responsabilidade' }, { id: 'propriedade', t: 'Propriedade intelectual' },
  { id: 'encerramento', t: 'Encerramento' }, { id: 'mudancas', t: 'Mudanças nos termos' }, { id: 'foro', t: 'Lei e foro' },
];

export function Termos() {
  let n = 0;
  return (
    <Pagina titulo="Termos de uso" secoes={SEC_TERMOS}
      resumo={<>Regras para usar o LaudoTech. Em resumo: <b className="text-texto">a IA faz o rascunho, você confere e assina</b>, o laudo e as fotos são seus, e a responsabilidade técnica é sempre do profissional habilitado.</>}>
      <Vigencia />
      <S id="aceite" n={++n} t="Aceite">
        <p>Estes Termos regulam o uso do LaudoTech (site, aplicativo web e serviços relacionados), oferecido por {EMPRESA.nome}{EMPRESA.cnpj && <>, CNPJ {EMPRESA.cnpj}</>} (“nós”). Ao criar uma conta ou usar o serviço, você declara ter lido e concordado com estes Termos e com a <Link to="/privacidade" className="font-bold text-tinta underline-offset-2 hover:underline">Política de Privacidade</Link>.</p>
        <p>Se você usa o LaudoTech em nome de uma empresa, declara ter poderes para aceitar estes Termos por ela.</p>
      </S>
      <S id="servico" n={++n} t="O serviço">
        <p>O LaudoTech é uma ferramenta de apoio à elaboração de laudos técnicos de engenharia e arquitetura. Ele permite:</p>
        <L itens={[
          'cadastrar laudos de diferentes tipos (cautelar, entrega de imóvel, locação, inspeção predial, entre outros);',
          'enviar fotografias da vistoria e obter, por inteligência artificial, uma sugestão de análise (ambiente, anomalias, grau de risco, causa provável e recomendação);',
          'conferir, editar, aceitar ou descartar cada sugestão;',
          'gerar o documento do laudo (PDF e Word), o plano de ação e a planilha correspondente;',
          'compartilhar o laudo com o cliente por meio de link de leitura.',
        ]} />
      </S>
      <S id="conta" n={++n} t="Conta e acesso">
        <L itens={[
          'Você deve fornecer dados verdadeiros e mantê-los atualizados, inclusive o registro profissional (CREA, CAU ou equivalente) quando aplicável.',
          'A senha é pessoal e intransferível. Você é responsável por todas as ações realizadas com a sua conta.',
          'Avise-nos imediatamente sobre qualquer uso não autorizado.',
          'Administradores de uma organização podem criar, desativar e gerenciar contas de sua equipe.',
        ]} />
      </S>
      <S id="responsabilidade" n={++n} t="Responsabilidade técnica">
        <p className="rounded-2xl border border-obra/40 bg-obra-suave p-4 font-semibold text-obra-texto">O LaudoTech não substitui o profissional. Todo laudo é de exclusiva responsabilidade técnica do engenheiro ou arquiteto que o assina, inclusive pela vistoria em campo, pela conferência de cada constatação, pela emissão da ART/RRT e pelo cumprimento das normas aplicáveis (como ABNT NBR 13752, 16747, 15575, 5674 e 16280).</p>
        <p>O serviço não realiza vistoria, não emite parecer técnico próprio e não assina documentos. Os textos sugeridos são rascunhos para avaliação do profissional.</p>
      </S>
      <S id="ia" n={++n} t="Uso da inteligência artificial">
        <L itens={[
          'As análises são geradas por modelos de inteligência artificial e podem conter erros, omissões ou interpretações inadequadas. Elas indicam apenas o que é aparente na imagem.',
          'Somente as constatações que você aceitar entram no laudo. Revise sempre o grau de risco, a causa provável e a recomendação.',
          'Estimativas de abertura de fissuras, prazos sugeridos e custos são referências e não substituem medição, ensaio ou orçamento.',
        ]} />
      </S>
      <S id="conteudo" n={++n} t="Seu conteúdo">
        <p>Fotos, dados, textos e laudos que você cadastra (“Conteúdo”) continuam sendo seus. Você nos concede apenas a licença necessária para armazenar, processar, exibir e transmitir o Conteúdo com a finalidade de prestar o serviço, inclusive o envio das fotos ao provedor de IA para análise.</p>
        <p>Você declara ter autorização para coletar e usar as imagens e os dados de terceiros que cadastrar (proprietários, condomínios, vizinhos, ocupantes), observando a legislação aplicável.</p>
      </S>
      <S id="compartilhar" n={++n} t="Link do cliente">
        <p>Ao gerar o link do cliente, qualquer pessoa que possua o endereço poderá ler o laudo e baixar o PDF, sem login. Compartilhe-o apenas com quem deve ter acesso. Você pode desligar o link a qualquer momento; a partir disso, ele deixa de funcionar.</p>
      </S>
      <S id="uso" n={++n} t="Uso permitido">
        <p>É proibido:</p>
        <L itens={[
          'usar o serviço para fins ilícitos, fraudulentos ou para produzir documentos falsos ou enganosos;',
          'enviar conteúdo que viole direitos de terceiros, a privacidade ou a intimidade de pessoas;',
          'tentar acessar dados de outras contas, burlar limites de uso ou interferir no funcionamento do serviço;',
          'copiar, revender ou fazer engenharia reversa do software, salvo quando a lei permitir.',
        ]} />
      </S>
      <S id="teste" n={++n} t="Versão de teste e preços">
        <p>O LaudoTech está em versão de teste, oferecida gratuitamente e com limites de uso (por exemplo, quantidade de fotos por laudo). Funcionalidades podem mudar, ser suspensas ou ter limites ajustados. Antes de qualquer cobrança, os planos e preços serão informados com antecedência, e a contratação dependerá do seu aceite.</p>
      </S>
      <S id="disponibilidade" n={++n} t="Disponibilidade">
        <p>Empregamos esforços razoáveis para manter o serviço disponível e seguro, mas não garantimos funcionamento ininterrupto ou livre de erros. Recomendamos manter cópia dos laudos finalizados (PDF e Word) e usar a exportação de backup disponível em Ajustes.</p>
      </S>
      <S id="limites" n={++n} t="Limitação de responsabilidade">
        <p>Na máxima extensão permitida pela lei, não respondemos por danos decorrentes de decisões técnicas tomadas com base nos rascunhos gerados, por indisponibilidade temporária, por perda de dados causada por fatores fora de nosso controle ou por uso em desacordo com estes Termos. Nada nestes Termos exclui direitos garantidos pelo Código de Defesa do Consumidor quando aplicável.</p>
      </S>
      <S id="propriedade" n={++n} t="Propriedade intelectual">
        <p>A marca LaudoTech, o software, o design, os textos-modelo e a assistente Lia pertencem a {EMPRESA.nome} ou a seus licenciantes. O uso do serviço não transfere nenhum desses direitos a você.</p>
      </S>
      <S id="encerramento" n={++n} t="Encerramento">
        <p>Você pode deixar de usar o serviço e pedir a exclusão da conta a qualquer momento. Podemos suspender ou encerrar contas que violem estes Termos, com aviso quando possível. Após o encerramento, os dados são tratados conforme a <Link to="/privacidade" className="font-bold text-tinta underline-offset-2 hover:underline">Política de Privacidade</Link>.</p>
      </S>
      <S id="mudancas" n={++n} t="Mudanças nos termos">
        <p>Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas no aplicativo ou por e-mail antes de entrarem em vigor. A data de vigência fica no topo desta página.</p>
      </S>
      <S id="foro" n={++n} t="Lei e foro">
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de {EMPRESA.cidade}, salvo quando a lei garantir ao consumidor o foro do seu domicílio. Dúvidas: <Contato />.</p>
      </S>
    </Pagina>
  );
}

/* ============================== PRIVACIDADE ============================== */

const SEC_PRIV = [
  { id: 'quem', t: 'Quem somos' }, { id: 'dados', t: 'Dados que tratamos' }, { id: 'finalidades', t: 'Para que usamos' },
  { id: 'bases', t: 'Bases legais' }, { id: 'ia', t: 'Inteligência artificial' }, { id: 'compartilhamento', t: 'Com quem compartilhamos' },
  { id: 'transferencia', t: 'Transferência internacional' }, { id: 'armazenamento', t: 'Armazenamento e prazo' },
  { id: 'seguranca', t: 'Segurança' }, { id: 'direitos', t: 'Seus direitos' }, { id: 'cookies', t: 'Cookies e armazenamento local' },
  { id: 'terceiros', t: 'Dados de terceiros nos laudos' }, { id: 'menores', t: 'Menores de idade' }, { id: 'contato', t: 'Contato e atualizações' },
];

export function Privacidade() {
  let n = 0;
  return (
    <Pagina titulo="Política de privacidade" secoes={SEC_PRIV}
      resumo={<>Como tratamos os seus dados no LaudoTech, conforme a <b className="text-texto">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</b>. Em resumo: coletamos só o necessário para o serviço funcionar, não vendemos dados e as fotos ficam em armazenamento privado.</>}>
      <Vigencia />
      <S id="quem" n={++n} t="Quem somos">
        <p>O controlador dos dados pessoais da sua conta é {EMPRESA.nome}{EMPRESA.cnpj && <>, CNPJ {EMPRESA.cnpj}</>}. Em relação aos dados de terceiros que você inclui nos laudos (clientes, proprietários, ocupantes), você é o controlador e nós atuamos como operador, tratando-os conforme as suas instruções.</p>
      </S>
      <S id="dados" n={++n} t="Dados que tratamos">
        <L itens={[
          <><b className="text-texto">Cadastro:</b> nome, e-mail, profissão, registro profissional, telefone, cidade e, se você enviar, logo e assinatura.</>,
          <><b className="text-texto">Acesso:</b> senha (guardada apenas como resumo criptográfico Argon2id, nunca em texto), sessões de login e registros técnicos de acesso (data, hora e endereço IP).</>,
          <><b className="text-texto">Laudos:</b> dados do imóvel e da vistoria, fotos (com data e localização gravadas na imagem, quando existirem), análises, constatações, plano de ação e conclusão.</>,
          <><b className="text-texto">Uso:</b> configurações do aplicativo e preferências salvas no seu navegador.</>,
        ]} />
      </S>
      <S id="finalidades" n={++n} t="Para que usamos">
        <L itens={[
          'criar e proteger a sua conta e autenticar o acesso;',
          'armazenar e sincronizar seus laudos entre aparelhos;',
          'analisar as fotos com inteligência artificial e gerar os documentos;',
          'disponibilizar o link de leitura ao seu cliente, quando você o gerar;',
          'prestar suporte, prevenir fraudes e abusos, e cumprir obrigações legais;',
          'melhorar o serviço com base em métricas de uso agregadas.',
        ]} />
      </S>
      <S id="bases" n={++n} t="Bases legais">
        <p>Tratamos dados com base na execução do contrato (art. 7º, V, da LGPD), no cumprimento de obrigação legal (art. 7º, II), no legítimo interesse para segurança e melhoria do serviço (art. 7º, IX) e, quando necessário, no seu consentimento (art. 7º, I), que pode ser revogado a qualquer momento.</p>
      </S>
      <S id="ia" n={++n} t="Inteligência artificial">
        <p>Para gerar a análise, cada foto é enviada ao servidor do LaudoTech e dele ao provedor de IA (Google Gemini), junto com o tipo de laudo e o contexto que você informar. O resultado volta para o seu laudo. A chave de acesso à IA fica somente no servidor. Não usamos as suas fotos para treinar modelos próprios.</p>
      </S>
      <S id="compartilhamento" n={++n} t="Com quem compartilhamos">
        <p>Não vendemos nem alugamos dados pessoais. Compartilhamos apenas com fornecedores necessários para operar o serviço, sob contrato e com obrigação de confidencialidade:</p>
        <div className="overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-sup2 text-texto"><tr><th className="p-3">Fornecedor</th><th className="p-3">Para quê</th><th className="p-3">Onde</th></tr></thead>
            <tbody className="divide-y divide-borda">
              {[['Supabase', 'Banco de dados e armazenamento privado das fotos', 'Brasil (São Paulo)'], ['Render', 'Servidor da aplicação (API)', 'Estados Unidos'], ['Cloudflare', 'Hospedagem do site e entrega de conteúdo', 'Rede global'], ['Google (Gemini)', 'Análise das fotos por inteligência artificial', 'Estados Unidos e outros']].map(([f, p, o]) => (
                <tr key={f}><td className="p-3 font-bold text-texto">{f}</td><td className="p-3">{p}</td><td className="p-3">{o}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Também podemos compartilhar dados quando exigido por lei, ordem judicial ou autoridade competente. O seu cliente acessa o laudo somente se você gerar e enviar o link.</p>
      </S>
      <S id="transferencia" n={++n} t="Transferência internacional">
        <p>Parte dos fornecedores processa dados fora do Brasil. Nesses casos, adotamos as salvaguardas do art. 33 da LGPD, como cláusulas contratuais e a escolha de fornecedores com padrões reconhecidos de proteção de dados.</p>
      </S>
      <S id="armazenamento" n={++n} t="Armazenamento e prazo">
        <L itens={[
          'Os dados ficam guardados enquanto a sua conta estiver ativa ou enquanto forem necessários para as finalidades acima.',
          'Laudos e fotos apagados por você são removidos do banco e do armazenamento. Cópias de segurança são sobrescritas em ciclos regulares.',
          'Registros de acesso são mantidos por 6 meses, como exige o Marco Civil da Internet (Lei nº 12.965/2014).',
          'Uma cópia também fica no seu aparelho (navegador) para o app funcionar mais rápido; ela pode ser apagada limpando os dados do site.',
        ]} />
      </S>
      <S id="seguranca" n={++n} t="Segurança">
        <L itens={[
          'conexões criptografadas (HTTPS) em todo o tráfego;',
          'senhas protegidas com Argon2id e sessões guardadas apenas como resumo SHA-256;',
          'fotos em armazenamento privado, acessível só pelo servidor;',
          'banco com controle de acesso por organização e regras de segurança por linha (RLS);',
          'chaves e senhas de infraestrutura fora do código-fonte.',
        ]} />
        <p>Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente relevante, comunicaremos você e a ANPD conforme a lei.</p>
      </S>
      <S id="direitos" n={++n} t="Seus direitos">
        <p>Pelo art. 18 da LGPD, você pode pedir a qualquer momento: confirmação e acesso aos dados; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; e revogação do consentimento. Também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
        <p>Muitos desses pedidos você mesmo resolve no app: corrigir o perfil em Ajustes, exportar tudo em <b className="text-texto">Ajustes › Dados</b> e apagar laudos. Para os demais, fale com a gente por <Contato />. Respondemos em até 15 dias.</p>
      </S>
      <S id="cookies" n={++n} t="Cookies e armazenamento local">
        <p>Não usamos cookies de publicidade. O app guarda no seu navegador (localStorage e IndexedDB) a sessão de login, suas preferências e a cópia dos laudos para funcionar inclusive com internet fraca. Fontes do site são carregadas do Google Fonts.</p>
      </S>
      <S id="terceiros" n={++n} t="Dados de terceiros nos laudos">
        <p>Laudos podem conter dados de clientes, proprietários e ocupantes, além de imagens de imóveis. Cabe a você, como profissional, ter base legal para coletá-los (por exemplo, a execução do contrato com o seu cliente) e evitar registrar dados desnecessários, como rostos e documentos pessoais que não sejam objeto da vistoria.</p>
      </S>
      <S id="menores" n={++n} t="Menores de idade">
        <p>O LaudoTech é destinado a profissionais e não é direcionado a menores de 18 anos.</p>
      </S>
      <S id="contato" n={++n} t="Contato e atualizações">
        <p>Encarregado pelo tratamento de dados (DPO) e canal de privacidade: <Contato />. Esta política pode ser atualizada; mudanças relevantes serão avisadas no aplicativo, e a data de vigência fica no topo desta página.</p>
      </S>
    </Pagina>
  );
}

/* ============================== SOBRE ============================== */

export function Sobre() {
  return (
    <Pagina titulo="Sobre o LaudoTech"
      resumo={<>Nascemos de uma conta simples: o engenheiro passa mais tempo escrevendo legenda de foto do que olhando a obra. O LaudoTech devolve esse tempo. <b className="text-texto">A IA escreve o rascunho; o profissional decide.</b></>}>
      <div className="grid gap-10">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { ic: Camera, t: 'Da foto ao laudo', d: 'Você fotografa a vistoria. A Lia identifica ambiente, anomalias, grau de risco e recomendação, e marca o ponto na imagem.' },
            { ic: ClipboardCheck, t: 'Você confere', d: 'Cada constatação passa por você: aceitar, editar ou descartar. Só entra no laudo o que você aprovou.' },
            { ic: FileCheck2, t: 'Pronto para assinar', d: 'Documento no padrão das normas ABNT, com relatório fotográfico, plano de ação, PDF, Word e link para o cliente.' },
          ].map(({ ic: Ic, t, d }) => (
            <div key={t} className="rounded-[22px] border border-borda bg-sup p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Ic className="size-5" /></span>
              <h2 className="mt-4 text-xl font-bold">{t}</h2>
              <p className="mt-1.5 text-texto2">{d}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-[24px] bg-[#121A2B] p-6 text-white md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">Nossos princípios</h2>
            <p className="mt-3 text-[#B6BECC]">Tecnologia a serviço de quem assina, nunca no lugar dele.</p>
          </div>
          <ul className="grid gap-4">
            {[
              { ic: ShieldCheck, t: 'Responsabilidade é do profissional', d: 'A IA sugere; a ART, a assinatura e a decisão técnica são suas.' },
              { ic: ScanSearch, t: 'Transparência', d: 'Cada achado mostra o grau de certeza da IA e o motivo da classificação.' },
              { ic: Lock, t: 'Seus dados, seu laudo', d: 'Fotos em armazenamento privado, nada é vendido e você exporta tudo quando quiser.' },
              { ic: Users, t: 'Feito com quem vai a campo', d: 'Pensado para o celular, com botões grandes e o mínimo de digitação.' },
            ].map(({ ic: Ic, t, d }) => (
              <li key={t} className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-obra"><Ic className="size-4" /></span><span><b className="block">{t}</b><span className="text-sm text-[#B6BECC]">{d}</span></span></li>
            ))}
          </ul>
        </section>

        <section className="grid gap-3">
          <h2 className="text-2xl font-extrabold">Para quem é</h2>
          <p className="leading-relaxed text-texto2">Engenheiros civis, arquitetos, peritos judiciais e empresas de inspeção que fazem vistorias cautelares, de entrega e de locação, inspeções prediais (NBR 16747), laudos de vícios construtivos, estruturais, de reforma (NBR 16280), avaliações (NBR 14653) e perícias (NBR 13752).</p>
        </section>

        <section className="grid gap-3">
          <h2 className="text-2xl font-extrabold">Quem faz</h2>
          <p className="leading-relaxed text-texto2">O LaudoTech é um produto da {EMPRESA.nome}, com sede em {EMPRESA.cidade}. Estamos em fase de teste aberta: cada sugestão de quem usa vira melhoria. Fale com a gente por <Contato />.</p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/entrar" className="pilula pilula-obra text-base">Entrar <ArrowRight className="size-5" /></Link>
          <span className="text-sm font-bold text-texto2">Acesso por convite do seu escritório</span>
        </div>
      </div>
    </Pagina>
  );
}

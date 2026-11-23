import type { Categoria } from './ajuda';

/** Dúvidas sobre o PRODUTO, para quem está conhecendo o LaudoTech pela página inicial. */
export const AJUDA_SITE: Categoria[] = [
  {
    id: 'produto', nome: 'O que é',
    perguntas: [
      { p: 'O que o LaudoTech faz?', r: 'Você manda as fotos da vistoria. Eu (a Lia) analiso cada uma e escrevo legenda, achados, grau de risco e recomendação. Você confere e o laudo sai pronto em PDF.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' }, chaves: 'faz serve produto' },
      { p: 'Para quem é?', r: 'Para engenheiros, arquitetos e peritos que fazem vistorias e laudos, escritórios com equipe, construtoras e reformas, e condomínios que precisam da inspeção predial.', ir: { tipo: 'ancora', id: 'para-quem', rotulo: 'Ver para quem é' }, chaves: 'quem engenheiro arquiteto perito construtora condomínio síndico escritório' },
      { p: 'Qual a diferença para outros apps de vistoria?', r: 'Os apps de vistoria organizam fotos e checklists. Aqui eu leio cada foto, aponto o problema com grau de risco, escrevo o laudo no padrão das normas e você só confere. Depois tem plano de ação, link do cliente e gestão da obra no mesmo lugar.', ir: { tipo: 'ancora', id: 'para-quem', rotulo: 'Ver a comparação' }, chaves: 'diferença concorrente outros apps comparação melhor' },
      { p: 'Dá para usar com a minha equipe?', r: 'Dá: três papéis. O admin convida por link e controla tudo; o engenheiro confere e assina; o assistente faz o campo só no que for atribuído a ele, sem ver o financeiro.', ir: { tipo: 'ancora', id: 'planos', rotulo: 'Ver os planos' }, chaves: 'equipe funcionário assistente admin empresa escritório papéis permissão' },
      { p: 'Como funciona, passo a passo?', r: '1) Você manda as fotos. 2) A Lia analisa e escreve tudo. 3) Você confere e baixa o PDF.', ir: { tipo: 'ancora', id: 'como', rotulo: 'Ver os 3 passos' }, chaves: 'funciona passo' },
      { p: 'Tem gestão de obras?', r: 'Tem: cronograma com medição, diário de obra (RDO) com fotos, financeiro orçado × gasto, compras com cotação e um link para o cliente acompanhar. As etapas vêm num padrão de consenso e você muda tudo.', ir: { tipo: 'ancora', id: 'recursos', rotulo: 'Ver os recursos' }, chaves: 'obra gestão cronograma diário rdo financeiro compras' },
      { p: 'O meu cliente consegue ver o laudo?', r: 'Consegue: você gera um link e manda no WhatsApp. O cliente lê no celular e baixa o PDF, sem criar conta. Você desliga o link quando quiser.', ir: { tipo: 'ancora', id: 'recursos', rotulo: 'Ver os recursos' }, chaves: 'cliente ver link compartilhar proprietário' },
      { p: 'Tem plano de ação para os reparos?', r: 'Tem: cada anomalia vira uma tarefa com prazo (sugerido pela gravidade), responsável e custo estimado. Entra no PDF e sai em planilha Excel.', ir: { tipo: 'ancora', id: 'recursos', rotulo: 'Ver os recursos' }, chaves: 'plano ação reparos custo prazo excel planilha' },
      { p: 'Funciona no celular? Tem app?', r: 'Funciona no navegador do celular e instala como app (sem loja). Dá para tirar a foto na hora da vistoria.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' }, chaves: 'celular app aplicativo instalar' },
      { p: 'Quais laudos dá para fazer?', r: 'Dez: cautelar, entrega de imóvel, locação, inspeção predial, vícios construtivos, estrutural, reforma, perícia judicial, avaliação e contábil.', ir: { tipo: 'ancora', id: 'tipos', rotulo: 'Ver os tipos de laudo' }, chaves: 'tipos laudos quais' },
    ],
  },
  {
    id: 'ia', nome: 'A IA',
    perguntas: [
      { p: 'A IA assina o laudo?', r: 'Não. A IA faz o rascunho; você confere cada foto e cada achado. A ART e a assinatura são suas.', ir: { tipo: 'ancora', id: 'duvidas', rotulo: 'Ver mais dúvidas' }, chaves: 'assina responsabilidade art' },
      { p: 'O que a IA encontra nas fotos?', r: 'Fissuras, trincas, infiltração, mofo, eflorescência, corrosão de armadura, destacamento de revestimento e mais, com o grau de risco e a recomendação.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' }, chaves: 'encontra detecta fissura' },
      { p: 'E se a IA errar?', r: 'Você aceita, edita ou descarta cada achado. Só entra no laudo o que você aprovou. Dá também para remarcar o ponto na foto.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' }, chaves: 'errar erro corrigir' },
    ],
  },
  {
    id: 'teste', nome: 'Testar e preço',
    perguntas: [
      { p: 'Como faço para usar?', r: 'Nesta fase o acesso é por convite: o administrador do escritório convida a equipe pelo app e cada pessoa cria a própria senha.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Entrar' }, chaves: 'testar grátis cadastro' },
      { p: 'Quanto custa?', r: 'Laudo R$ 119/mês (500 fotos com IA), Completo R$ 197/mês (1.000 fotos e gestão de obras) e Escritório R$ 399/mês (2.500 fotos, até 5 pessoas). Laudos ilimitados; você paga pelas fotos que a IA analisa. Acabou? Pacote extra de 250 fotos por R$ 49, que não vence. Na fase de testes, por convite e sem cobrança.', ir: { tipo: 'ancora', id: 'planos', rotulo: 'Ver os planos' }, chaves: 'preço custa valor plano mensalidade fotos pacote limite' },
      { p: 'Quanto tempo eu ganho?', r: 'Depende da sua rotina. A calculadora da página faz a conta com os seus números (é uma estimativa).', ir: { tipo: 'ancora', id: 'conta', rotulo: 'Fazer a conta' }, chaves: 'tempo ganho economiza' },
    ],
  },
  {
    id: 'seguranca', nome: 'Dados e segurança',
    perguntas: [
      { p: 'Onde ficam minhas fotos?', r: 'No seu aparelho e no servidor do LaudoTech, em armazenamento privado. Na análise, a foto vai para o serviço de IA (Gemini) e volta com o resultado. O cliente só vê pelo link que você criar.', ir: { tipo: 'ancora', id: 'confianca', rotulo: 'Ver confiança' }, chaves: 'fotos ficam dados privacidade lgpd segurança' },
      { p: 'O laudo tem validade? A IA tira minha responsabilidade?', r: 'O laudo é seu: você confere cada achado, emite a ART e assina. A IA só acelera o rascunho. As fotos guardam data e local para a prova ficar datada.', ir: { tipo: 'ancora', id: 'confianca', rotulo: 'Ver confiança' }, chaves: 'validade jurídica responsabilidade art crea cau juiz' },
      { p: 'Funciona no celular?', r: 'Funciona: tire a foto e confira no mesmo aparelho, com botões grandes.', ir: { tipo: 'ancora', id: 'recursos', rotulo: 'Ver recursos' }, chaves: 'celular mobile' },
      { p: 'Preciso instalar algo?', r: 'Não. Abre no navegador do computador ou do celular.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Abrir o app' }, chaves: 'instalar baixar app' },
    ],
  },
];

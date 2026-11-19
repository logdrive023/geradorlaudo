import type { Categoria } from './ajuda';

/** Dúvidas sobre o PRODUTO, para quem está conhecendo o LaudoTech pela página inicial. */
export const AJUDA_SITE: Categoria[] = [
  {
    id: 'produto', nome: 'O que é',
    perguntas: [
      { p: 'O que o LaudoTech faz?', r: 'Você manda as fotos da vistoria. Eu (a Lia) analiso cada uma e escrevo legenda, achados, grau de risco e recomendação. Você confere e o laudo sai pronto em PDF.', ir: { tipo: 'rota', para: '/cadastrar', rotulo: 'Criar conta grátis' }, chaves: 'faz serve produto' },
      { p: 'Para quem é?', r: 'Para engenheiros, arquitetos e peritos que fazem vistorias e laudos técnicos com fotos.', ir: { tipo: 'ancora', id: 'como', rotulo: 'Ver como funciona' }, chaves: 'quem engenheiro arquiteto perito' },
      { p: 'Como funciona, passo a passo?', r: '1) Você manda as fotos. 2) A Lia analisa e escreve tudo. 3) Você confere e baixa o PDF.', ir: { tipo: 'ancora', id: 'como', rotulo: 'Ver os 3 passos' }, chaves: 'funciona passo' },
      { p: 'Quais laudos dá para fazer?', r: 'Dez: cautelar, entrega de imóvel, locação, inspeção predial, vícios construtivos, estrutural, reforma, perícia judicial, avaliação e contábil.', ir: { tipo: 'ancora', id: 'tipos', rotulo: 'Ver os tipos de laudo' }, chaves: 'tipos laudos quais' },
    ],
  },
  {
    id: 'ia', nome: 'A IA',
    perguntas: [
      { p: 'A IA assina o laudo?', r: 'Não. A IA faz o rascunho; você confere cada foto e cada achado. A ART e a assinatura são suas.', ir: { tipo: 'ancora', id: 'duvidas', rotulo: 'Ver mais dúvidas' }, chaves: 'assina responsabilidade art' },
      { p: 'O que a IA encontra nas fotos?', r: 'Fissuras, trincas, infiltração, mofo, eflorescência, corrosão de armadura, destacamento de revestimento e mais, com o grau de risco e a recomendação.', ir: { tipo: 'rota', para: '/cadastrar', rotulo: 'Criar conta grátis' }, chaves: 'encontra detecta fissura' },
      { p: 'E se a IA errar?', r: 'Você aceita, edita ou descarta cada achado. Só entra no laudo o que você aprovou. Dá também para remarcar o ponto na foto.', ir: { tipo: 'rota', para: '/cadastrar', rotulo: 'Criar conta grátis' }, chaves: 'errar erro corrigir' },
    ],
  },
  {
    id: 'teste', nome: 'Testar e preço',
    perguntas: [
      { p: 'Posso testar de graça?', r: 'Pode. Crie a conta, sem cartão. Dentro do app há um laudo de exemplo já analisado para você ver tudo funcionando.', ir: { tipo: 'rota', para: '/cadastrar', rotulo: 'Criar conta grátis' }, chaves: 'testar grátis cadastro' },
      { p: 'Quanto custa?', r: 'Esta é a versão de teste: dá para usar de graça, sem cartão. Os planos serão divulgados antes de qualquer cobrança.', ir: { tipo: 'rota', para: '/cadastrar', rotulo: 'Criar conta grátis' }, chaves: 'preço custa valor plano' },
      { p: 'Quanto tempo eu ganho?', r: 'Depende da sua rotina. A calculadora da página faz a conta com os seus números (é uma estimativa).', ir: { tipo: 'ancora', id: 'conta', rotulo: 'Fazer a conta' }, chaves: 'tempo ganho economiza' },
    ],
  },
  {
    id: 'seguranca', nome: 'Dados e segurança',
    perguntas: [
      { p: 'Onde ficam minhas fotos?', r: 'Nesta versão de teste, no seu navegador. Na análise com IA, cada foto vai para o serviço de IA escolhido (Gemini ou Claude) e volta com o resultado.', ir: { tipo: 'ancora', id: 'duvidas', rotulo: 'Ver mais dúvidas' }, chaves: 'fotos ficam dados privacidade' },
      { p: 'Funciona no celular?', r: 'Funciona: tire a foto e confira no mesmo aparelho, com botões grandes.', ir: { tipo: 'ancora', id: 'recursos', rotulo: 'Ver recursos' }, chaves: 'celular mobile' },
      { p: 'Preciso instalar algo?', r: 'Não. Abre no navegador do computador ou do celular.', ir: { tipo: 'rota', para: '/entrar', rotulo: 'Abrir o app' }, chaves: 'instalar baixar app' },
    ],
  },
];

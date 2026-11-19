/**
 * Central de ajuda da Lia: perguntas simples ("onde eu mudo…", "como eu faço…"),
 * separadas por assunto. Cada resposta leva a um lugar do sistema.
 */

export type Destino =
  | { tipo: 'rota'; para: string; rotulo: string }
  | { tipo: 'aba'; aba: 'dados' | 'fotos' | 'conferir' | 'laudo'; rotulo: string }   // aba do laudo aberto
  | { tipo: 'novo'; rotulo: string }                                                  // abre "Novo laudo"
  | { tipo: 'ancora'; id: string; rotulo: string };                                   // rola até uma seção da página

export interface Pergunta { p: string; r: string; ir?: Destino; chaves?: string }
export interface Categoria { id: string; nome: string; perguntas: Pergunta[] }

const AJ = (aba: string, rotulo: string): Destino => ({ tipo: 'rota', para: `/configuracoes?aba=${aba}`, rotulo });

export const AJUDA: Categoria[] = [
  {
    id: 'comecar', nome: 'Começar',
    perguntas: [
      { p: 'Como faço meu primeiro laudo?', r: 'Toque em "Novo laudo", escolha o tipo e o endereço. Depois é só mandar as fotos: eu analiso e escrevo tudo, e você confere.', ir: { tipo: 'novo', rotulo: 'Criar novo laudo' }, chaves: 'primeiro criar começar novo' },
      { p: 'Quais tipos de laudo existem?', r: 'São 10: cautelar, entrega de imóvel, locação, inspeção predial, vícios construtivos, estrutural, reforma (NBR 16280), perícia judicial, avaliação (NBR 14653) e contábil.', ir: { tipo: 'novo', rotulo: 'Ver os tipos' }, chaves: 'tipos laudo existem' },
      { p: 'Qual é o passo a passo?', r: '1) Dados: só o essencial. 2) Fotos: você manda, eu analiso. 3) Conferir: aceite ou edite o que escrevi. 4) Laudo: revise e baixe o PDF.', chaves: 'passo etapas wizard' },
      { p: 'Onde vejo todos os meus laudos?', r: 'Na tela Laudos. Dá para buscar por endereço e filtrar por tipo e status.', ir: { tipo: 'rota', para: '/painel', rotulo: 'Ir para Laudos' }, chaves: 'lista painel meus laudos' },
      { p: 'Posso ver um exemplo pronto?', r: 'Pode. Na tela de entrar, "Ver funcionando agora" abre um laudo de exemplo já analisado.', ir: { tipo: 'rota', para: '/painel', rotulo: 'Ir para Laudos' }, chaves: 'exemplo demonstração demo' },
    ],
  },
  {
    id: 'fotos', nome: 'Fotos e IA',
    perguntas: [
      { p: 'Como mando as fotos?', r: 'Na aba Fotos: solte as fotos na tela, toque em "Adicionar fotos" ou use a Câmera no celular. Pode mandar todas de uma vez.', ir: { tipo: 'aba', aba: 'fotos', rotulo: 'Ir para Fotos' }, chaves: 'mandar enviar subir fotos upload câmera' },
      { p: 'O que a IA faz com cada foto?', r: 'Eu vejo o ambiente e escrevo a legenda, cada achado (tipo, sistema, grau de risco, causa provável e recomendação) e marco onde está na foto. Você só confere.', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'ia analisa faz escreve' },
      { p: 'Preciso apertar algum botão para analisar?', r: 'Não. Assim que a foto sobe, eu já começo a analisar. Se alguma falhar, aparece "Analisar" de novo.', ir: { tipo: 'aba', aba: 'fotos', rotulo: 'Ir para Fotos' }, chaves: 'botão analisar automático' },
      { p: 'Como ligo a IA de verdade?', r: 'Em Ajustes › IA, escolha "Claude" e cole uma chave da API da Anthropic. Sem chave, fico no modo demonstração (análise simulada).', ir: AJ('ia', 'Abrir Ajustes › IA'), chaves: 'ligar ia chave claude api demonstração' },
      { p: 'Como mudo a ordem das fotos?', r: 'Na aba Fotos, toque no "⋯" da foto e use "Mover para trás / frente". A ordem é a do relatório fotográfico.', ir: { tipo: 'aba', aba: 'fotos', rotulo: 'Ir para Fotos' }, chaves: 'ordem mover reordenar' },
      { p: 'Como apago uma foto?', r: 'Na aba Fotos, "⋯" da foto › Excluir foto. Os achados dela saem do laudo.', ir: { tipo: 'aba', aba: 'fotos', rotulo: 'Ir para Fotos' }, chaves: 'apagar excluir remover foto' },
      { p: 'A data e o GPS da foto entram?', r: 'Sim. Eu leio a data e o local gravados na própria foto. A data vai na legenda do relatório.', chaves: 'data gps local exif' },
    ],
  },
  {
    id: 'conferir', nome: 'Conferir',
    perguntas: [
      { p: 'Como confiro o que a IA escreveu?', r: 'Na aba Conferir, cada foto mostra o texto pronto. Toque em Aceitar, Descartar ou Editar em cada achado e depois em Confirmar.', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'conferir revisar aceitar' },
      { p: 'Como mudo o grau de risco de um achado?', r: 'Em Conferir, toque em Editar no achado e escolha Crítico, Médio ou Mínimo.', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'grau risco crítico médio mínimo mudar' },
      { p: 'A caixa na foto está no lugar errado', r: 'Em Conferir, toque em Editar › "Remarcar na foto" e arraste sobre o ponto certo.', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'caixa marcar remarcar lugar errado' },
      { p: 'Como adiciono algo que a IA não viu?', r: 'Em Conferir, toque em "Adicionar achado". Depois marque na foto onde está.', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'adicionar achado não viu' },
      { p: 'Dá para ditar a observação?', r: 'Dá. Em Conferir › "Editar legenda e observação", toque em Ditar (Chrome e Edge).', ir: { tipo: 'aba', aba: 'conferir', rotulo: 'Ir para Conferir' }, chaves: 'ditar voz falar microfone' },
      { p: 'O que é Crítico, Médio e Mínimo?', r: 'Crítico (Prioridade 1): risco à segurança, saúde ou funcionamento. Médio (Prioridade 2): perda parcial de desempenho. Mínimo (Prioridade 3): estético ou de manutenção.', chaves: 'crítico médio mínimo prioridade significa' },
    ],
  },
  {
    id: 'laudo', nome: 'Laudo e PDF',
    perguntas: [
      { p: 'Como baixo o PDF?', r: 'Na aba Laudo, "Baixar PDF" abre a impressão: escolha "Salvar como PDF". No celular: Compartilhar › Imprimir › Salvar PDF.', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'pdf baixar imprimir' },
      { p: 'Como edito um texto direto no laudo?', r: 'Na aba Laudo, abra "Editar A4" e toque em qualquer texto marcado. Salva sozinho; Esc desfaz.', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'editar texto a4 direto documento' },
      { p: 'Como gero a conclusão?', r: 'Na aba Laudo, "Escrever com a Lia". Eu uso só os achados que você aceitou. Depois é só ajustar.', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'conclusão gerar escrever' },
      { p: 'O que falta para assinar?', r: 'Na aba Laudo, o quadro "Pronto para assinar?" mostra só o que falta, e cada item leva ao lugar de resolver.', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'falta assinar pronto pendências' },
      { p: 'Dá para baixar em Word?', r: 'Dá: aba Laudo › Entregar › "Baixar Word (.doc)".', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'word doc docx' },
      { p: 'Como marco o laudo como concluído?', r: 'Na aba Laudo › "Marcar como concluído" (libera quando nada falta), ou pelo status no topo da tela.', ir: { tipo: 'aba', aba: 'laudo', rotulo: 'Ir para o Laudo' }, chaves: 'concluído concluir status' },
      { p: 'Onde mudo o nome do laudo?', r: 'Toque no status no topo do laudo (a bolinha colorida): lá tem o campo "Nome do laudo".', chaves: 'nome título renomear' },
    ],
  },
  {
    id: 'cadastro', nome: 'Cadastro e perfil',
    perguntas: [
      { p: 'Onde coloco meu CREA / CAU?', r: 'Em Ajustes › Perfil, campo "Registro profissional". Sem ele o laudo não fica pronto para assinar.', ir: AJ('perfil', 'Abrir meu perfil'), chaves: 'crea cau crc registro' },
      { p: 'Onde mudo meu nome e telefone?', r: 'Em Ajustes › Perfil. Vão na capa, no cabeçalho e no rodapé de todos os laudos.', ir: AJ('perfil', 'Abrir meu perfil'), chaves: 'nome telefone endereço perfil' },
      { p: 'Como coloco minha logo?', r: 'Em Ajustes › Perfil › Logo. Para um laudo só, use Dados › Capa do laudo.', ir: AJ('perfil', 'Abrir meu perfil'), chaves: 'logo marca empresa' },
      { p: 'Como coloco minha assinatura?', r: 'Em Ajustes › Perfil › Assinatura: assine num papel branco e tire uma foto bem de perto.', ir: AJ('perfil', 'Abrir meu perfil'), chaves: 'assinatura assinar imagem' },
      { p: 'Onde coloco a ART do laudo?', r: 'Na aba Dados do laudo, em "O essencial" › ART / RRT. Também dá para editar direto na folha A4.', ir: { tipo: 'aba', aba: 'dados', rotulo: 'Ir para Dados' }, chaves: 'art rrt anotação' },
      { p: 'Onde preencho os dados do imóvel?', r: 'Na aba Dados: primeiro o essencial; o resto fica em "Mais detalhes".', ir: { tipo: 'aba', aba: 'dados', rotulo: 'Ir para Dados' }, chaves: 'dados imóvel endereço preencher' },
    ],
  },
  {
    id: 'modelos', nome: 'Modelos e normas',
    perguntas: [
      { p: 'Como mudo o texto padrão de um tipo de laudo?', r: 'Em Ajustes › Modelos: escolha o tipo e edite objetivo, metodologia e normas. Vale para os laudos desse tipo.', ir: AJ('modelos', 'Abrir Modelos'), chaves: 'modelo padrão texto objetivo metodologia' },
      { p: 'Quais normas o laudo cita?', r: 'Depende do tipo: NBR 13752 (perícias), 16747 (inspeção predial), 15575 (desempenho), 16280 (reforma), 14653 (avaliação), entre outras. Você pode mudar em Modelos.', ir: AJ('modelos', 'Abrir Modelos'), chaves: 'normas nbr abnt' },
      { p: 'Mudo o texto só deste laudo?', r: 'Sim: aba Dados › "Textos do laudo", ou direto na folha A4. "Voltar ao padrão" desfaz.', ir: { tipo: 'aba', aba: 'dados', rotulo: 'Ir para Dados' }, chaves: 'só este laudo texto próprio' },
    ],
  },
  {
    id: 'conta', nome: 'Conta e segurança',
    perguntas: [
      { p: 'Como troco minha senha?', r: 'Em Ajustes › Segurança. A senha fica guardada só como resumo: ninguém consegue lê-la.', ir: AJ('seguranca', 'Abrir Segurança'), chaves: 'senha trocar mudar' },
      { p: 'Esqueci a senha, e agora?', r: 'Nesta versão de teste, o administrador define uma senha nova em Usuários.', ir: { tipo: 'rota', para: '/usuarios', rotulo: 'Abrir Usuários (admin)' }, chaves: 'esqueci senha recuperar' },
      { p: 'Como crio um usuário para minha equipe?', r: 'Se você é admin: tela Usuários › "Novo usuário". Dá para escolher Engenheiro ou Admin.', ir: { tipo: 'rota', para: '/usuarios', rotulo: 'Abrir Usuários' }, chaves: 'usuário equipe criar conta' },
      { p: 'Como deixo o app escuro?', r: 'Em Ajustes › Aparência: Claro, Escuro ou Do sistema.', ir: AJ('aparencia', 'Abrir Aparência'), chaves: 'escuro tema aparência dark' },
    ],
  },
  {
    id: 'dados', nome: 'Dados e backup',
    perguntas: [
      { p: 'Onde ficam meus dados?', r: 'Nesta versão de teste, tudo fica neste navegador, salvo automaticamente. Nada vai para um servidor.', chaves: 'onde ficam dados salvo' },
      { p: 'Como faço backup?', r: 'Em Ajustes › Dados › Exportar backup. Para trazer de volta, "Importar backup".', ir: AJ('dados', 'Abrir Dados'), chaves: 'backup exportar importar' },
      { p: 'Como levo para outro computador?', r: 'Exporte o backup aqui e importe no outro navegador, em Ajustes › Dados.', ir: AJ('dados', 'Abrir Dados'), chaves: 'outro computador levar' },
      { p: 'Como duplico um laudo?', r: 'Na tela Laudos, toque no "⋮" do laudo › Duplicar. Vem com as fotos.', ir: { tipo: 'rota', para: '/painel', rotulo: 'Ir para Laudos' }, chaves: 'duplicar copiar' },
      { p: 'Como apago um laudo?', r: 'Na tela Laudos, "⋮" do laudo › Excluir. Não dá para desfazer.', ir: { tipo: 'rota', para: '/painel', rotulo: 'Ir para Laudos' }, chaves: 'apagar excluir laudo' },
    ],
  },
];

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Acha a pergunta da central que mais combina com o que a pessoa digitou. */
export function buscarAjuda(texto: string, base: Categoria[] = AJUDA): Pergunta | undefined {
  const palavras = norm(texto).split(/\W+/).filter((w) => w.length > 2);
  if (!palavras.length) return;
  let melhor: { q: Pergunta; n: number } | undefined;
  for (const c of base) for (const q of c.perguntas) {
    const alvo = norm(`${q.p} ${q.chaves ?? ''}`);
    const n = palavras.filter((w) => alvo.includes(w)).length;
    if (n && (!melhor || n > melhor.n)) melhor = { q, n };
  }
  return melhor && melhor.n >= Math.min(2, palavras.length) ? melhor.q : undefined;
}

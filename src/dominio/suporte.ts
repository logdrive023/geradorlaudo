import type { Destino } from '../ia/ajuda';

/**
 * Suporte: contato e dúvidas do plano e da cobrança.
 * As mesmas dúvidas aparecem na aba Plano › Ajuda e na Lia (assunto "Plano e cobrança"): mudou aqui, muda nos dois.
 * Contato ainda vazio: preencha o e-mail e/ou o WhatsApp (só números, com DDI e DDD, ex.: 5511999999999).
 */
export const SUPORTE = {
  email: '',
  whatsapp: '',
  horario: 'Segunda a sexta, das 9h às 18h',
};

export type GrupoDuvida = 'cobranca' | 'fotos' | 'plano' | 'cancelar';
export const GRUPOS_DUVIDA: { id: GrupoDuvida; nome: string }[] = [
  { id: 'cobranca', nome: 'Cobrança e pagamento' },
  { id: 'fotos', nome: 'Fotos com IA e pacotes' },
  { id: 'plano', nome: 'Trocar de plano' },
  { id: 'cancelar', nome: 'Cancelar' },
];

export interface DuvidaPlano { grupo: GrupoDuvida; p: string; r: string; ir?: Destino; chaves?: string }

const cobranca = (rotulo: string): Destino => ({ tipo: 'rota', para: '/plano?parte=cobranca', rotulo });
const uso = (rotulo: string): Destino => ({ tipo: 'rota', para: '/plano', rotulo });

export const DUVIDAS_PLANO: DuvidaPlano[] = [
  { grupo: 'cobranca', p: 'Como funciona a cobrança?', r: 'A mensalidade do plano é cobrada todo mês no dia que você escolher, por Pix, boleto ou cartão. Pacotes de fotos são pagos à parte, só quando você compra.', ir: cobranca('Ver a cobrança'), chaves: 'cobrança mensalidade pagamento pix boleto cartão' },
  { grupo: 'cobranca', p: 'Posso mudar o dia da cobrança?', r: 'Pode, em Plano › Cobrança › Mudar dia. A próxima mensalidade passa para o novo dia.', ir: cobranca('Mudar o dia'), chaves: 'dia data vencimento mudar trocar' },
  { grupo: 'cobranca', p: 'Onde vejo meus recibos?', r: 'Em Plano › Cobrança › Histórico: cada pagamento tem o recibo com a nossa marca, pronto para imprimir ou salvar em PDF.', ir: cobranca('Ver o histórico'), chaves: 'recibo comprovante histórico pagamento pdf' },
  { grupo: 'cobranca', p: 'Tem nota fiscal?', r: 'Tem. Com a cobrança automática ligada, a nota de cada pagamento vai para o e-mail do administrador. Até lá, peça pelo suporte.', chaves: 'nota fiscal nfse nf' },
  { grupo: 'fotos', p: 'O que conta como "foto com IA"?', r: 'Cada foto que a IA do LaudoTech analisa. Laudos são ilimitados. Fotos do diário de obra, logo e capa não contam. Com duas IAs ligadas, cada foto conta duas.', ir: uso('Ver meu uso'), chaves: 'foto ia conta limite uso' },
  { grupo: 'fotos', p: 'E se as fotos do mês acabarem?', r: 'As fotos novas ficam na fila, sem perder nada. Você compra um pacote extra em Plano › Uso ou espera o mês seguinte, quando as do plano voltam.', ir: uso('Ver pacotes'), chaves: 'acabou acabaram limite fotos fila' },
  { grupo: 'fotos', p: 'Pacote extra vence?', r: 'Não. O saldo dos pacotes fica guardado e só é usado depois que as fotos do plano acabam.', ir: uso('Ver pacotes'), chaves: 'pacote extra vence validade saldo' },
  { grupo: 'plano', p: 'Posso mudar de plano?', r: 'Pode, a qualquer momento, em Plano › Trocar de plano. Fotos, pessoas e obras do plano novo valem na hora; o valor novo começa na próxima cobrança. Sem multa e sem cobrança proporcional.', ir: { tipo: 'rota', para: '/plano?parte=cobranca&trocar=1', rotulo: 'Trocar de plano' }, chaves: 'mudar trocar plano upgrade subir descer' },
  { grupo: 'plano', p: 'Qual plano é o ideal para mim?', r: 'Um laudo usa umas 60 fotos com IA. Laudo (500 fotos) dá uns 8 laudos por mês; Completo (1.000) uns 17 e inclui obras; Escritório (2.500) uns 42 e até 5 pessoas. Na troca de plano a Lia recomenda pelo seu uso real.', ir: { tipo: 'rota', para: '/plano?parte=cobranca&trocar=1', rotulo: 'Comparar planos' }, chaves: 'qual plano ideal melhor recomendação' },
  { grupo: 'cancelar', p: 'Como cancelo?', r: 'Em Plano › Cobrança › Cancelar plano. Não há multa: você usa tudo até o fim do período já pago e nenhuma cobrança nova é feita.', ir: cobranca('Ir para a cobrança'), chaves: 'cancelar cancelamento sair' },
  { grupo: 'cancelar', p: 'O que acontece com os meus laudos se eu cancelar?', r: 'Continuam salvos e você pode baixar tudo em Ajustes › Dados. O saldo de pacotes comprados continua valendo.', chaves: 'cancelar laudos dados perder' },
  { grupo: 'cancelar', p: 'Cancelei sem querer. E agora?', r: 'Enquanto o período pago não acabou, é só tocar em Reativar plano em Plano › Cobrança.', ir: cobranca('Reativar'), chaves: 'reativar voltar desfazer cancelamento' },
];

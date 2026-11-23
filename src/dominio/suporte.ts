/**
 * Suporte: contato e dúvidas frequentes da cobrança.
 * Contato ainda vazio: preencha o e-mail e/ou o WhatsApp (só números, com DDI e DDD, ex.: 5511999999999).
 */
export const SUPORTE = {
  email: '',
  whatsapp: '',
  horario: 'Segunda a sexta, das 9h às 18h',
};

export const DUVIDAS_COBRANCA: { p: string; r: string }[] = [
  { p: 'Como funciona a cobrança?', r: 'A mensalidade do plano é cobrada todo mês no dia que você escolher, por Pix, boleto ou cartão. Pacotes de fotos são pagos à parte, só quando você compra.' },
  { p: 'O que conta como "foto com IA"?', r: 'Cada foto que a IA do LaudoTech analisa. Laudos são ilimitados. Fotos do diário de obra, logo e capa não contam. Com duas IAs ligadas, cada foto conta duas.' },
  { p: 'E se as fotos do mês acabarem?', r: 'As fotos novas ficam na fila, sem perder nada. Você compra um pacote extra em Uso ou espera o mês seguinte, quando as do plano voltam.' },
  { p: 'Pacote extra vence?', r: 'Não. O saldo dos pacotes fica guardado e só é usado depois que as fotos do plano acabam.' },
  { p: 'Posso mudar o dia da cobrança?', r: 'Pode, aqui mesmo em Cobrança › Mudar dia. A próxima mensalidade passa para o novo dia.' },
  { p: 'Como cancelo?', r: 'Em Cobrança › Cancelar plano. Não há multa: você usa tudo até o fim do período já pago e nenhuma cobrança nova é feita.' },
  { p: 'O que acontece com os meus laudos se eu cancelar?', r: 'Continuam salvos e você pode baixar tudo em Ajustes › Dados. O saldo de pacotes comprados continua valendo.' },
  { p: 'Posso mudar de plano?', r: 'Pode, a qualquer momento. Fale com a gente pelo suporte e a troca vale a partir da próxima cobrança.' },
  { p: 'Tem nota fiscal?', r: 'Tem. Com a cobrança automática ligada, a nota de cada pagamento vai para o e-mail do administrador. Até lá, peça pelo suporte.' },
];

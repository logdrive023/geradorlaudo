import type { Cobranca, HistoricoCobranca, InfoFotos, Recibo } from '../db/organizacao';

/**
 * Exemplo da tela de Plano: na fase de testes (sem cobrança) a tela mostra como fica um escritório no plano Completo,
 * com uso, pacotes, mensalidades, recibos e a cobrança a pagar. Nada aqui vai para o servidor.
 * As datas andam com o calendário (sempre "este mês", "mês passado"...).
 */

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dia5 = (deltaMeses: number) => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth() + deltaMeses, 5, 12); };
const mes = (deltaMeses: number) => iso(dia5(deltaMeses)).slice(0, 7);
// a próxima cobrança: dia 5 deste mês se ainda não passou, senão do mês que vem
const proxDelta = () => (new Date().getDate() < 5 ? 0 : 1);

export const EXEMPLO_CLIENTE = { nome: 'Ribeiro Engenharia (exemplo)', cnpj: '12.345.678/0001-90', responsavel: 'Ana Ribeiro', email: 'financeiro@ribeiro.eng.br' };

const PLANO = { id: 'completo', nome: 'Completo', precoCentavos: 19700, fotosMes: 1000, usuariosMax: 2, obras: true };

export function exemploFotos(): InfoFotos {
  return {
    cota: { fotosMes: 1000, usadas: 812, extras: 180, restam: 368 },
    plano: PLANO,
    pacotes: [{ id: 'p250', fotos: 250, precoCentavos: 4900 }, { id: 'p1000', fotos: 1000, precoCentavos: 14900 }],
    pedidos: [{ id: 'exemplo-pacote', pacote: 'p250', fotos: 250, valorCentavos: 4900, status: 'pago', criadoEm: iso(dia5(proxDelta() - 2)) + 'T15:00:00Z', pagoEm: iso(dia5(proxDelta() - 2)) + 'T15:00:00Z' }],
    compraLigada: false,
  };
}

export function exemploCobrancas(): HistoricoCobranca {
  const p = proxDelta();
  const c = (id: string, d: number, status: Cobranca['status'], extra: Partial<Cobranca> = {}): Cobranca => ({
    id, tipo: 'mensalidade', descricao: 'Mensalidade Completo', valorCentavos: 19700, status,
    vencimento: iso(dia5(d)), referencia: mes(d), criadoEm: iso(dia5(d - 1)) + 'T12:00:00Z', ...extra,
  });
  return {
    plano: PLANO, status: 'ativa', pago: true, noGateway: false, diaCobranca: 5,
    proximaCobranca: iso(dia5(p)), proximoValorCentavos: 19700,
    cobrancas: [
      c('exemplo-aberta', p, 'pendente'),
      c('exemplo-m1', p - 1, 'pago', { pagoEm: iso(dia5(p - 1)) + 'T15:00:00Z' }),
      { id: 'exemplo-pacote', tipo: 'pacote', descricao: 'Pacote de 250 fotos com IA', valorCentavos: 4900, status: 'pago', fotos: 250, pagoEm: iso(new Date(dia5(p - 2).getTime() + 22 * 864e5)) + 'T15:00:00Z', criadoEm: iso(dia5(p - 2)) + 'T12:00:00Z' },
      c('exemplo-m2', p - 2, 'pago', { pagoEm: iso(new Date(dia5(p - 2).getTime() - 864e5)) + 'T15:00:00Z' }),
      c('exemplo-m3', p - 3, 'pago', { pagoEm: iso(dia5(p - 3)) + 'T15:00:00Z' }),
    ],
    usoMensal: [
      { mes: mes(0), total: 812, doPlano: 812, doPacote: 0 },
      { mes: mes(-1), total: 1070, doPlano: 1000, doPacote: 70 },
      { mes: mes(-2), total: 640, doPlano: 640, doPacote: 0 },
    ],
    pacotes: { comprado: 250, usado: 70, saldo: 180 },
  };
}

/** Recibo de exemplo (das cobranças pagas acima). */
export function exemploRecibo(id: string): Recibo | null {
  const c = exemploCobrancas().cobrancas.find((x) => x.id === id && x.status === 'pago');
  if (!c) return null;
  return {
    id: c.id, numero: `LT-${(c.pagoEm ?? '').slice(0, 4)}-EXEMPLO${c.id.slice(-1).toUpperCase()}`, tipo: c.tipo, descricao: c.descricao, referencia: c.referencia, fotos: c.fotos,
    valorCentavos: c.valorCentavos, pagoEm: c.pagoEm ?? c.criadoEm, forma: c.tipo === 'pacote' ? 'PIX' : 'CREDIT_CARD', transacao: 'pay_exemplo123',
    emitidoEm: new Date().toISOString(), cliente: EXEMPLO_CLIENTE,
  };
}

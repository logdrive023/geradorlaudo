import { useEffect, useState } from 'react';
import { comPaciencia } from '../../lib/paciencia';
import { Link, useParams } from 'react-router';
import { ArrowLeft, BadgeCheck, ExternalLink, Printer } from 'lucide-react';
import { lerRecibo, type Recibo as DadosRecibo } from '../../db/organizacao';
import { reaisPorExtenso } from '../../lib/extenso';
import { EMPRESA } from '../site/Legal';
import { SUPORTE } from '../../dominio/suporte';
import { Botao, Carregando, Logo } from '../../componentes/ui';

const reais = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dia = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const diaHora = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
const nomeMes = (m?: string) => {
  if (!m) return '';
  const t = new Date(`${m}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const FORMA: Record<string, string> = { PIX: 'Pix', BOLETO: 'Boleto bancário', CREDIT_CARD: 'Cartão de crédito', DEBIT_CARD: 'Cartão de débito', UNDEFINED: 'Pix, boleto ou cartão' };

/** Faixa de obra (a mesma assinatura visual do app). */
const Faixa = () => <div className="h-2.5" style={{ background: 'repeating-linear-gradient(-45deg,#FF8A1F 0 14px,#121A2B 14px 28px)' }} aria-hidden />;

function Campo({ r, v }: { r: string; v: React.ReactNode }) {
  return <div><span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7A8599]">{r}</span><span className="block text-[13px] font-semibold text-[#121A2B]">{v || '—'}</span></div>;
}

/** Recibo de pagamento: página própria, pronta para imprimir ou salvar em PDF (A4). */
export function Recibo() {
  const { tipo = '', id = '' } = useParams();
  const [r, setR] = useState<DadosRecibo | null>(null);
  const [erro, setErro] = useState('');
  const [acordando, setAcordando] = useState(false);
  useEffect(() => comPaciencia(() => lerRecibo(tipo, id), setR, setErro, setAcordando), [tipo, id]);
  useEffect(() => { if (r) document.title = `Recibo ${r.numero} · LaudoTech`; }, [r]);

  if (erro) return (
    <div className="grid min-h-dvh place-items-center bg-papel p-6 text-center">
      <div className="grid max-w-sm gap-3"><p className="text-texto2">{erro}</p><Link to="/plano?parte=cobranca" className="pilula pilula-clara">Voltar ao plano</Link></div>
    </div>
  );
  if (!r) return <Carregando texto={acordando ? 'Acordando o servidor… (pode levar até 1 minuto)' : 'Abrindo o recibo…'} />;

  const referencia = r.tipo === 'pacote' ? 'Avulso (não vence)' : nomeMes(r.referencia) || '—';
  const motivo = r.tipo === 'pacote'
    ? `compra de ${r.descricao.charAt(0).toLowerCase()}${r.descricao.slice(1)}`
    : `${r.descricao.replace(/^Mensalidade/, 'mensalidade do plano')}${r.referencia ? ` de ${nomeMes(r.referencia).toLowerCase()}` : ''}`;
  const item = r.tipo === 'pacote' ? r.descricao : `${r.descricao}${r.referencia ? ` · ${nomeMes(r.referencia)}` : ''}`;

  return (
    <div className="min-h-dvh bg-[#E9ECF2] print:bg-white">
      {/* barra de ações (não sai no papel) */}
      <div className="nao-imprimir sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/plano?parte=cobranca" className="flex items-center gap-1.5 text-sm font-extrabold text-[#1D3B70]"><ArrowLeft className="size-4" />Voltar ao plano</Link>
          <Botao variante="obra" onClick={() => window.print()}><Printer className="size-4" />Imprimir ou salvar PDF</Botao>
        </div>
      </div>

      {/* a folha */}
      <div className="mx-auto max-w-[210mm] px-2 py-6 print:p-0 sm:px-4">
        <article className="recibo-folha relative flex min-h-[297mm] flex-col overflow-hidden bg-white text-[#121A2B] shadow-[0_10px_40px_rgba(18,26,43,.12)] print:shadow-none"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          {/* topo */}
          <header className="bg-[#121A2B] px-[14mm] pb-7 pt-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <Logo claro tam={40} />
              <div className="text-right">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8A1F]">Recibo de pagamento</span>
                <span className="block font-display text-[22px] font-extrabold tracking-tight">Nº {r.numero}</span>
                <span className="block text-[12px] text-[#B6BECC]">Pago em {dia(r.pagoEm)}</span>
              </div>
            </div>
          </header>
          <Faixa />

          <div className="flex flex-1 flex-col gap-7 px-[14mm] py-9">
            {/* declaração */}
            <section className="flex flex-wrap items-start justify-between gap-5">
              <p className="max-w-[128mm] text-[14px] leading-relaxed text-[#2A3550]">
                Recebemos de <b className="text-[#121A2B]">{r.cliente.nome}</b>{r.cliente.cnpj && <>, CNPJ {r.cliente.cnpj}</>}, a importância de{' '}
                <b className="text-[#121A2B]">{reais(r.valorCentavos)}</b> ({reaisPorExtenso(r.valorCentavos)}), referente à <b className="text-[#121A2B]">{motivo}</b>, conforme descrito abaixo.
              </p>
              <span className="flex rotate-[-6deg] items-center gap-1.5 rounded-xl border-[3px] border-[#1E8E5A] px-3 py-1.5 font-display text-[18px] font-extrabold uppercase tracking-widest text-[#1E8E5A]">
                <BadgeCheck className="size-5" />Pago
              </span>
            </section>

            {/* quem pagou e quem recebeu */}
            <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <div className="grid gap-3 rounded-2xl bg-[#F4F6FA] p-5">
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#FF8A1F]">Pagador</span>
                <Campo r="Organização" v={r.cliente.nome} />
                <Campo r="CNPJ" v={r.cliente.cnpj} />
                <Campo r="Responsável" v={r.cliente.responsavel} />
                <Campo r="E-mail" v={r.cliente.email} />
              </div>
              <div className="grid gap-3 rounded-2xl bg-[#F4F6FA] p-5">
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#FF8A1F]">Recebedor</span>
                <Campo r="Empresa" v={`${EMPRESA.nome} · LaudoTech`} />
                <Campo r="CNPJ" v={EMPRESA.cnpj} />
                <Campo r="Cidade" v={EMPRESA.cidade} />
                <Campo r="Contato" v={EMPRESA.email || SUPORTE.email} />
              </div>
            </section>

            {/* o que foi pago */}
            <section>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#121A2B] text-left text-[10px] uppercase tracking-[.14em] text-white">
                    <th className="rounded-l-xl px-4 py-3 font-extrabold">Descrição</th>
                    <th className="px-4 py-3 font-extrabold">Referência</th>
                    <th className="rounded-r-xl px-4 py-3 text-right font-extrabold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E3E7EE]">
                    <td className="px-4 py-4 font-semibold">{item}</td>
                    <td className="px-4 py-4 text-[#4A5568]">{referencia}</td>
                    <td className="px-4 py-4 text-right font-bold tabular-nums">{reais(r.valorCentavos)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="px-4 pt-4 text-right text-[11px] font-extrabold uppercase tracking-[.14em] text-[#7A8599]">Total pago</td>
                    <td className="px-4 pt-4 text-right font-display text-[22px] font-extrabold tabular-nums">{reais(r.valorCentavos)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* como foi pago */}
            <section className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-[#E3E7EE] p-5 sm:grid-cols-4">
              <Campo r="Data do pagamento" v={dia(r.pagoEm)} />
              <Campo r="Forma de pagamento" v={FORMA[r.forma] ?? r.forma} />
              <Campo r="Código da transação" v={r.transacao} />
              <Campo r="Nº do recibo" v={r.numero} />
            </section>
            {r.comprovante && (
              <a href={r.comprovante} target="_blank" rel="noopener noreferrer" className="nao-imprimir flex w-fit items-center gap-1.5 text-[13px] font-extrabold text-[#1D3B70]">
                Ver o comprovante da instituição de pagamento<ExternalLink className="size-3.5" />
              </a>
            )}

            {/* rodapé */}
            <footer className="mt-auto grid gap-4 border-t border-[#E3E7EE] pt-6">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <p className="max-w-[120mm] text-[11px] leading-relaxed text-[#7A8599]">
                  Documento emitido eletronicamente pelo LaudoTech em {diaHora(r.emitidoEm)}. Este recibo comprova o pagamento descrito acima e não substitui a nota fiscal.
                  {(EMPRESA.email || SUPORTE.email) && <> Dúvidas: {EMPRESA.email || SUPORTE.email}.</>}
                </p>
                <div className="text-center">
                  <div className="mb-1 w-56 border-b border-[#121A2B]" />
                  <span className="block text-[12px] font-bold">{EMPRESA.nome} · LaudoTech</span>
                  <span className="block text-[10px] text-[#7A8599]">emitido eletronicamente</span>
                </div>
              </div>
            </footer>
          </div>
          <Faixa />
        </article>
      </div>
    </div>
  );
}

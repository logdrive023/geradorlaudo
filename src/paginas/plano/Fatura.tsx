import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Barcode, Copy, Info, Printer, QrCode } from 'lucide-react';
import { lerCobrancas, lerOrg } from '../../db/organizacao';
import { reaisPorExtenso } from '../../lib/extenso';
import { comPaciencia } from '../../lib/paciencia';
import { useSessao } from '../../lib/sessao';
import { EMPRESA } from '../site/Legal';
import { SUPORTE } from '../../dominio/suporte';
import { EXEMPLO_CLIENTE, exemploCobrancas } from '../../dominio/exemploPlano';
import { Botao, Carregando, Logo } from '../../componentes/ui';

interface DadosFatura {
  numero: string; descricao: string; referencia?: string; valorCentavos: number; vencimento: string;
  status: 'pendente' | 'vencido' | 'prevista'; cliente: { nome: string; cnpj?: string; responsavel: string; email: string }; exemplo: boolean;
}

const reais = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dia = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
const nomeMes = (m?: string) => {
  if (!m) return '';
  const t = new Date(`${m}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
/** Número pseudoaleatório estável a partir de um texto (para desenhar o QR e as barras de exemplo). */
function semente(txt: string) { let h = 2166136261; for (const ch of txt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }

const Faixa = () => <div className="h-2.5" style={{ background: 'repeating-linear-gradient(-45deg,#FF8A1F 0 14px,#121A2B 14px 28px)' }} aria-hidden />;
function Campo({ r, v }: { r: string; v: React.ReactNode }) {
  return <div><span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7A8599]">{r}</span><span className="block text-[13px] font-semibold text-[#121A2B]">{v || '—'}</span></div>;
}

/** Desenho de QR Code de exemplo (o de verdade vem do Asaas quando a cobrança for ligada). */
function QrExemplo({ chave }: { chave: string }) {
  const n = 25, r = semente(chave);
  const olho = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const cels: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!olho(x, y) && r() > 0.52) cels.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  const Olho = ({ x, y }: { x: number; y: number }) => <g><rect x={x} y={y} width="7" height="7" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" /></g>;
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="block size-full" shapeRendering="crispEdges" aria-hidden>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <g fill="#121A2B">{cels}<Olho x={0} y={0} /><Olho x={n - 7} y={0} /><Olho x={0} y={n - 7} /></g>
    </svg>
  );
}

/** Barras de exemplo (padrão de boleto, só ilustrativo). */
function BarrasExemplo({ chave }: { chave: string }) {
  const r = semente(chave + 'b');
  const barras: React.ReactNode[] = [];
  let x = 0;
  while (x < 400) { const w = 1 + Math.floor(r() * 3.2); if (r() > 0.4) barras.push(<rect key={x} x={x} y={0} width={w} height={56} />); x += w + 1; }
  return <svg viewBox="0 0 400 56" preserveAspectRatio="none" className="block h-14 w-full" aria-hidden><g fill="#121A2B">{barras}</g></svg>;
}

/** Cobrança a pagar (fatura): igual ao recibo, com Pix (QR e copia e cola) e boleto. Por enquanto é demonstração. */
export function Fatura() {
  const { tipo = '', id = '' } = useParams();
  const { usuario } = useSessao();
  const [f, setF] = useState<DadosFatura | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (tipo === 'exemplo') {
      const h = exemploCobrancas();
      const c = h.cobrancas.find((x) => x.id === id);
      const venc = c?.vencimento ?? id;
      if (!c && !/^\d{4}-\d{2}-\d{2}$/.test(id)) { setErro('Cobrança de exemplo não encontrada.'); return; }
      setF({ numero: `FT-${venc.slice(0, 4)}-EXEMPLO`, descricao: 'Mensalidade Completo', referencia: venc.slice(0, 7), valorCentavos: 19700, vencimento: venc, status: c ? 'pendente' : 'prevista', cliente: EXEMPLO_CLIENTE, exemplo: true });
      return;
    }
    return comPaciencia(async () => {
      const [h, org] = await Promise.all([lerCobrancas(), lerOrg()]);
      const cliente = { nome: org.organizacao.nome, cnpj: org.organizacao.cnpj, responsavel: usuario?.nome ?? '', email: usuario?.email ?? '' };
      if (tipo === 'prevista') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(id) || !h.pago) throw new Error('Não há mensalidade prevista nessa data.');
        return { numero: `FT-${id.slice(0, 4)}-${id.slice(5, 7)}${id.slice(8)}`, descricao: `Mensalidade ${h.plano.nome}`, referencia: id.slice(0, 7), valorCentavos: h.proximoValorCentavos, vencimento: id, status: 'prevista' as const, cliente, exemplo: false };
      }
      const c = h.cobrancas.find((x) => x.id === id && (x.status === 'pendente' || x.status === 'vencido'));
      if (!c || !c.vencimento) throw new Error('Essa cobrança não está em aberto (veja o histórico para o recibo).');
      return { numero: `FT-${c.vencimento.slice(0, 4)}-${c.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`, descricao: c.descricao, referencia: c.referencia, valorCentavos: c.valorCentavos, vencimento: c.vencimento, status: c.status as 'pendente' | 'vencido', cliente, exemplo: false };
    }, setF, setErro);
  }, [tipo, id, usuario]);
  useEffect(() => { if (f) document.title = `Cobrança ${f.numero} · LaudoTech`; }, [f]);

  if (erro) return (
    <div className="grid min-h-dvh place-items-center bg-papel p-6 text-center">
      <div className="grid max-w-sm gap-3"><p className="text-texto2">{erro}</p><Link to="/plano?parte=cobranca" className="pilula pilula-clara">Voltar ao plano</Link></div>
    </div>
  );
  if (!f) return <Carregando texto="Abrindo a cobrança…" />;

  const item = `${f.descricao}${f.referencia ? ` · ${nomeMes(f.referencia)}` : ''}`;
  const STATUS = { pendente: ['A pagar', '#B45309', '#FFF4DE'], vencido: ['Vencida', '#B42318', '#FDECEA'], prevista: ['Prevista', '#1D3B70', '#EAF1FD'] } as const;
  const [rotulo, cor, fundo] = STATUS[f.status];
  const linha = '23793.38128 60000.000003 00000.000400 1 00000000000000';

  return (
    <div className="min-h-dvh bg-[#E9ECF2] print:bg-white">
      <div className="nao-imprimir sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/plano?parte=cobranca" className="flex items-center gap-1.5 text-sm font-extrabold text-[#1D3B70]"><ArrowLeft className="size-4" />Voltar ao plano</Link>
          <Botao variante="obra" onClick={() => window.print()}><Printer className="size-4" />Imprimir ou salvar PDF</Botao>
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] px-2 py-6 print:p-0 sm:px-4">
        {/* aviso de demonstração (também sai no papel) */}
        <div className="mb-3 flex items-start gap-2 rounded-2xl border-2 border-dashed border-[#FF8A1F] bg-[#FFF6EC] px-4 py-3 text-[13px] text-[#7A3E00] print:mb-2">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span><b>Demonstração.</b> O pagamento pelo app ainda não está ligado: o QR Code, o Pix copia e cola e o código de barras abaixo são só o modelo. <b>Não pague este documento.</b>{f.exemplo && ' Os dados são de um escritório de exemplo.'}</span>
        </div>

        <article className="relative flex min-h-[297mm] flex-col overflow-hidden bg-white text-[#121A2B] shadow-[0_10px_40px_rgba(18,26,43,.12)] print:shadow-none"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          <header className="bg-[#121A2B] px-[8mm] pb-7 pt-8 text-white sm:px-[14mm]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <Logo claro tam={40} />
              <div className="text-right">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.2em] text-[#FF8A1F]">Cobrança</span>
                <span className="block font-display text-[22px] font-extrabold tracking-tight">Nº {f.numero}</span>
                <span className="block text-[12px] text-[#B6BECC]">Vencimento {dia(f.vencimento)}</span>
              </div>
            </div>
          </header>
          <Faixa />

          <div className="flex flex-1 flex-col gap-7 px-[8mm] py-9 sm:px-[14mm]">
            {/* valor e vencimento em destaque */}
            <section className="grid gap-4 rounded-2xl bg-[#F4F6FA] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#7A8599]">Valor a pagar</span>
                <b className="block font-display text-[34px] leading-tight tabular-nums">{reais(f.valorCentavos)}</b>
                <span className="text-[13px] text-[#4A5568]">({reaisPorExtenso(f.valorCentavos)}) · vence em <b className="text-[#121A2B]">{dia(f.vencimento)}</b></span>
              </div>
              <span className="justify-self-start rounded-xl px-4 py-2 font-display text-[16px] font-extrabold uppercase tracking-widest sm:justify-self-end" style={{ color: cor, background: fundo }}>{rotulo}</span>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <div className="grid gap-3 rounded-2xl border border-[#E3E7EE] p-5">
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#FF8A1F]">Pagador</span>
                <Campo r="Organização" v={f.cliente.nome} />
                <Campo r="CNPJ" v={f.cliente.cnpj} />
                <Campo r="Responsável" v={f.cliente.responsavel} />
                <Campo r="E-mail" v={f.cliente.email} />
              </div>
              <div className="grid gap-3 rounded-2xl border border-[#E3E7EE] p-5">
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#FF8A1F]">Beneficiário</span>
                <Campo r="Empresa" v={`${EMPRESA.nome} · LaudoTech`} />
                <Campo r="CNPJ" v={EMPRESA.cnpj} />
                <Campo r="Cidade" v={EMPRESA.cidade} />
                <Campo r="Contato" v={EMPRESA.email || SUPORTE.email} />
              </div>
            </section>

            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#121A2B] text-left text-[10px] uppercase tracking-[.14em] text-white">
                  <th className="rounded-l-xl px-4 py-3 font-extrabold">Descrição</th>
                  <th className="rounded-r-xl px-4 py-3 text-right font-extrabold">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E3E7EE]"><td className="px-4 py-4 font-semibold">{item}</td><td className="px-4 py-4 text-right font-bold tabular-nums">{reais(f.valorCentavos)}</td></tr>
              </tbody>
            </table>

            {/* como pagar */}
            <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <div className="grid content-start gap-3 rounded-2xl border-2 border-[#121A2B] p-5">
                <span className="flex items-center gap-2 text-[13px] font-extrabold"><QrCode className="size-5 text-[#FF8A1F]" />Pague com Pix</span>
                <div className="relative mx-auto size-44 rounded-xl border border-[#E3E7EE] p-2">
                  <QrExemplo chave={f.numero} />
                  <span className="absolute inset-0 grid place-items-center"><span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] shadow">exemplo</span></span>
                </div>
                <span className="text-[11px] text-[#7A8599]">Abra o app do banco, escolha Pix › Ler QR Code.</span>
                <div className="grid gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7A8599]">Pix copia e cola</span>
                  <div className="flex items-center gap-2 rounded-xl bg-[#F4F6FA] p-2">
                    <code className="min-w-0 flex-1 truncate text-[11px] text-[#4A5568]">00020126580014BR.GOV.BCB.PIX0136exemplo-laudotech…</code>
                    <button disabled title="Disponível quando o pagamento for ligado" className="nao-imprimir flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-extrabold text-[#7A8599]"><Copy className="size-3.5" />Copiar</button>
                  </div>
                </div>
              </div>
              <div className="grid content-start gap-3 rounded-2xl border border-[#E3E7EE] p-5">
                <span className="flex items-center gap-2 text-[13px] font-extrabold"><Barcode className="size-5 text-[#FF8A1F]" />Ou pague o boleto</span>
                <div className="grid gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7A8599]">Linha digitável (exemplo)</span>
                  <code className="break-all rounded-xl bg-[#F4F6FA] p-3 text-[12px] font-bold tracking-wide text-[#4A5568]">{linha}</code>
                </div>
                <div className="relative rounded-xl border border-[#E3E7EE] p-3">
                  <BarrasExemplo chave={f.numero} />
                  <span className="absolute inset-0 grid place-items-center"><span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] shadow">exemplo</span></span>
                </div>
                <span className="text-[11px] text-[#7A8599]">O boleto compensa em até 2 dias úteis; o Pix, na hora.</span>
              </div>
            </section>

            <footer className="mt-auto grid gap-2 border-t border-[#E3E7EE] pt-6 text-[11px] leading-relaxed text-[#7A8599]">
              <p>Depois de pago, o recibo aparece em Plano › Cobrança › Histórico. Dúvidas sobre a cobrança: {EMPRESA.email || SUPORTE.email || 'fale com o suporte pelo app'}.</p>
              <p>{f.status === 'prevista' ? 'Esta é uma prévia da próxima mensalidade: o valor e a data podem mudar se você trocar de plano ou de dia de cobrança.' : 'Pagou e ainda aparece aqui? A confirmação pode levar alguns minutos.'}</p>
            </footer>
          </div>
          <Faixa />
        </article>
      </div>
    </div>
  );
}

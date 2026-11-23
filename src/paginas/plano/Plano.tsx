import { useEffect, useState } from 'react';
import { CabecalhoTela } from '../../componentes/CabecalhoTela';
import { useSessao } from '../../lib/sessao';
import { logadoNaNuvem } from '../../db/nuvem';
import { lerFotos, ouvirPlano, type InfoFotos } from '../../db/organizacao';
import { milhar, precoBR } from '../../dominio/planos';
import { PlanoFotos } from '../config/PlanoFotos';
import { exemploFotos } from '../../dominio/exemploPlano';

/** Página do plano: quanto usou, quanto paga, trocar de plano, recibos e ajuda. */
export function Plano() {
  const { usuario } = useSessao();
  const [info, setInfo] = useState<InfoFotos | null>(null);
  useEffect(() => {
    const ler = (forcar = false) => { if (logadoNaNuvem()) lerFotos(forcar).then(setInfo).catch(() => {}); };
    ler();
    return ouvirPlano(() => ler(true));
  }, []);
  const [verExemplo, setVerExemplo] = useState<boolean | null>(null);
  if (!usuario) return null;
  const admin = usuario.papel === 'admin';
  // na fase de testes (plano Teste) a tela já abre com o exemplo de plano pago
  const exemplo = verExemplo ?? info?.plano.id === 'teste';
  const dados = exemplo && info ? exemploFotos() : info;
  const c = dados?.cota;
  const acabando = !!c && c.restam >= 0 && c.restam <= Math.max(30, c.fotosMes * 0.1);
  return (
    <div className="mx-auto max-w-5xl px-3 py-5 pb-28 sm:px-4 md:px-8 md:py-9">
      <CabecalhoTela sobre={usuario.nome} titulo="Seu" grifo="plano" humor={acabando ? 'atenta' : 'feliz'}
        lia={!info ? 'Aqui você vê o que usou no mês, quanto paga e troca de plano quando quiser.'
          : acabando ? `Restam só ${milhar(c!.restam)} fotos com IA neste mês. Um pacote extra resolve, e não vence.`
            : admin ? 'Tudo do seu plano num lugar só: uso do mês, cobranças, recibos e a troca de plano.' : 'Aqui você vê as fotos com IA do mês. A cobrança fica com o admin do escritório.'}
        numeros={dados ? [
          { n: dados.plano.nome, t: exemplo ? 'plano do exemplo' : 'seu plano' },
          { n: c!.restam < 0 ? 'sem limite' : milhar(c!.restam), t: 'fotos com IA restam' },
          { n: dados.plano.precoCentavos ? precoBR(dados.plano.precoCentavos / 100) : 'Grátis', t: dados.plano.precoCentavos ? 'por mês' : 'fase de testes' },
        ] : undefined} />
      <div className="mt-6">
        <PlanoFotos admin={admin} exemplo={exemplo} setExemplo={setVerExemplo} />
      </div>
    </div>
  );
}

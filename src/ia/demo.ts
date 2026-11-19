import { assinaturaImagem } from '../lib/imagem';
import type { AchadoIA, PedidoAnalise, ResultadoIA } from './tipos';

/**
 * Motor de DEMONSTRAÇÃO: não olha a foto de verdade.
 * Usa números simples da imagem para escolher um cenário plausível, só para testar o fluxo
 * (subir → analisar → conferir → laudo) sem chave de API. O app avisa isso na tela.
 */

type Cenario = Omit<ResultadoIA, 'semAnomalia'>;

const CENARIOS: Cenario[] = [
  {
    ambiente: 'Sala', elemento: 'Parede',
    legenda: 'Parede da sala com fissura inclinada a partir do canto da janela.',
    achados: [{ tipo: 'Fissura', sistema: 'Vedações', descricao: 'Fissura inclinada (~45°) partindo do vértice da janela, abertura estimada < 1 mm.', gravidade: 'medio', causaProvavel: 'Concentração de tensões no canto da abertura, possível ausência de verga/contraverga.', recomendacao: 'Monitorar com selo de gesso; tratar com tela de poliéster e argamassa flexível.', confianca: 0.82, regiao: { x: 52, y: 18, w: 30, h: 44 } }],
  },
  {
    ambiente: 'Banheiro', elemento: 'Teto',
    legenda: 'Teto do banheiro com mancha de umidade e bolor junto ao box.',
    achados: [
      { tipo: 'Infiltração / umidade', sistema: 'Impermeabilização', descricao: 'Mancha escura de umidade no forro, próxima ao ponto do chuveiro do pavimento superior.', gravidade: 'medio', causaProvavel: 'Falha de impermeabilização ou vazamento na instalação do andar de cima.', recomendacao: 'Fazer teste de estanqueidade no pavimento superior e refazer a impermeabilização.', confianca: 0.77, regiao: { x: 20, y: 22, w: 46, h: 34 } },
      { tipo: 'Mofo / bolor', sistema: 'Revestimentos', descricao: 'Colônias de bolor na pintura em torno da mancha.', gravidade: 'minimo', causaProvavel: 'Umidade persistente e pouca ventilação.', recomendacao: 'Limpar com solução de hipoclorito e repintar com tinta antimofo após sanar a umidade.', confianca: 0.7, regiao: { x: 58, y: 30, w: 22, h: 20 } },
    ],
  },
  {
    ambiente: 'Cozinha', elemento: 'Piso',
    legenda: 'Piso cerâmico da cozinha com placas trincadas e som cavo.',
    achados: [{ tipo: 'Piso ou cerâmica trincada', sistema: 'Pisos', descricao: 'Três placas cerâmicas trincadas em linha, com indício de descolamento.', gravidade: 'minimo', causaProvavel: 'Ausência de junta de movimentação ou assentamento sem dupla colagem.', recomendacao: 'Substituir as placas e prever juntas de movimentação conforme NBR 13753.', confianca: 0.74, regiao: { x: 14, y: 48, w: 62, h: 30 } }],
  },
  {
    ambiente: 'Fachada', elemento: 'Revestimento externo',
    legenda: 'Fachada frontal com eflorescência e destacamento de reboco.',
    achados: [
      { tipo: 'Eflorescência', sistema: 'Revestimentos', descricao: 'Depósitos esbranquiçados na base da parede externa.', gravidade: 'minimo', causaProvavel: 'Umidade ascendente por capilaridade.', recomendacao: 'Executar impermeabilização da base (barreira química) e recompor o revestimento.', confianca: 0.69, regiao: { x: 8, y: 62, w: 56, h: 30 } },
      { tipo: 'Destacamento de revestimento', sistema: 'Revestimentos', descricao: 'Reboco com som cavo e trecho destacado junto à platibanda.', gravidade: 'critico', causaProvavel: 'Perda de aderência por infiltração; risco de queda de material sobre o passeio.', recomendacao: 'Isolar a área abaixo e remover as partes soltas imediatamente; refazer o revestimento.', confianca: 0.8, regiao: { x: 60, y: 6, w: 30, h: 24 } },
    ],
  },
  {
    ambiente: 'Garagem', elemento: 'Viga',
    legenda: 'Viga da garagem com desplacamento do concreto e armadura exposta.',
    achados: [{ tipo: 'Corrosão de armadura', sistema: 'Estrutura', descricao: 'Desplacamento do cobrimento com armadura longitudinal exposta e oxidada.', gravidade: 'critico', causaProvavel: 'Cobrimento insuficiente e carbonatação do concreto.', recomendacao: 'Escorar se necessário; limpar a armadura, aplicar inibidor de corrosão e recompor com graute. Avaliação estrutural.', confianca: 0.86, regiao: { x: 26, y: 36, w: 48, h: 22 } }],
  },
  {
    ambiente: 'Dormitório', elemento: 'Esquadria',
    legenda: 'Janela do dormitório com falha de vedação no peitoril.',
    achados: [{ tipo: 'Falha de vedação', sistema: 'Esquadrias', descricao: 'Selante ressecado no encontro do caixilho com o peitoril, com marca de escorrimento.', gravidade: 'minimo', causaProvavel: 'Envelhecimento do selante.', recomendacao: 'Remover e refazer a vedação com selante PU.', confianca: 0.66, regiao: { x: 18, y: 64, w: 64, h: 16 } }],
  },
];

const SEM_ANOMALIA: Cenario[] = [
  { ambiente: 'Corredor', elemento: 'Parede', legenda: 'Corredor: paredes e piso sem anomalias aparentes.', achados: [] },
  { ambiente: 'Área de serviço', elemento: 'Vista geral', legenda: 'Área de serviço em bom estado, sem anomalias aparentes.', achados: [] },
];

const EXTERNA: Cenario = {
  ambiente: 'Área externa', elemento: 'Muro',
  legenda: 'Muro de divisa com trinca vertical e vegetação junto à base.',
  achados: [{ tipo: 'Trinca', sistema: 'Áreas externas', descricao: 'Trinca vertical passante no muro de divisa, abertura estimada de 2 mm.', gravidade: 'medio', causaProvavel: 'Movimentação diferencial da fundação ou falta de junta de dilatação.', recomendacao: 'Instalar testemunhos para verificar se está ativa; executar junta e recompor.', confianca: 0.72, regiao: { x: 40, y: 10, w: 16, h: 70 } }],
};

const DOCUMENTO: Cenario = {
  ambiente: 'Documento', elemento: 'Página',
  legenda: 'Documento fotografado para anexo (conferir conteúdo e numeração).',
  achados: [],
};

export async function analisarDemo(p: PedidoAnalise): Promise<ResultadoIA> {
  const s = await assinaturaImagem(p.imagem);
  await new Promise((r) => setTimeout(r, 700 + (s.hash % 900)));
  let c: Cenario;
  if (p.tipoLaudo === 'contabil') c = DOCUMENTO;
  else if (s.verde > 0.06) c = EXTERNA;
  else if (s.hash % 7 === 0) c = SEM_ANOMALIA[s.hash % SEM_ANOMALIA.length];
  else c = CENARIOS[s.hash % CENARIOS.length];
  // pequena variação para não parecer copiado
  const achados: AchadoIA[] = c.achados.map((a) => ({ ...a, confianca: Math.min(0.95, a.confianca + ((s.hash >> 3) % 10) / 100) }));
  return { ...c, achados, semAnomalia: achados.length === 0 };
}

import type { Gravidade, Regiao, TipoLaudo } from '../dominio/modelo';

export interface AchadoIA {
  tipo: string;
  sistema: string;
  descricao: string;
  gravidade: Gravidade;
  causaProvavel: string;
  recomendacao: string;
  confianca: number;
  aberturaMm?: number;
  regiao?: Regiao;
}

export interface ResultadoIA {
  ambiente: string;
  elemento: string;
  legenda: string;
  semAnomalia: boolean;
  qualidadeFoto?: 'boa' | 'regular' | 'ruim';
  achados: AchadoIA[];
}

export interface PedidoAnalise {
  imagem: Blob;
  tipoLaudo: TipoLaudo;
  /** o que o engenheiro já sabe (endereço, ambiente anotado, observação ditada) */
  contexto: string;
}

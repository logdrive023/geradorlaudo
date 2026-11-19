/**
 * Modelo de domínio do LaudoTech.
 * Os mesmos nomes vão para o backend Go (ver docs/ARQUITETURA.md): Laudo, Foto, Analise, Achado, Usuario.
 */

export type TipoLaudo = 'cautelar' | 'entrega' | 'locacao' | 'inspecao' | 'extrajudicial' | 'estrutural' | 'reforma' | 'pericia' | 'avaliacao' | 'contabil';
export type StatusLaudo = 'rascunho' | 'conferencia' | 'concluido';
export type Papel = 'admin' | 'engenheiro';

/** Grau de risco (IBAPE / ABNT NBR 16747): define a prioridade do reparo. */
export type Gravidade = 'critico' | 'medio' | 'minimo';

export type StatusFoto = 'pendente' | 'analisando' | 'analisada' | 'conferida' | 'erro';
export type OrigemAnalise = 'demo' | 'claude' | 'manual';

/** Região da foto onde está o achado, em % (0–100) da largura/altura. */
export interface Regiao { x: number; y: number; w: number; h: number }

export interface Achado {
  id: string;
  tipo: string;            // ex.: "Fissura", "Infiltração"
  sistema: string;         // ex.: "Vedações", "Revestimentos"
  descricao: string;
  gravidade: Gravidade;
  causaProvavel: string;
  recomendacao: string;
  confianca: number;       // 0–1 (o que a IA acha); 1 quando foi o engenheiro
  regiao?: Regiao;
  /** null = ainda não conferido; true = aceito; false = descartado pelo engenheiro */
  aceito: boolean | null;
  origem: OrigemAnalise;
}

export interface Analise {
  ambiente: string;        // ex.: "Sala", "Fachada", "Banheiro social"
  elemento: string;        // ex.: "Parede", "Teto", "Piso"
  legenda: string;         // legenda técnica da foto no laudo
  semAnomalia: boolean;    // "nada a relatar" também entra no laudo
  achados: Achado[];
  origem: OrigemAnalise;
  analisadoEm: number;
}

export interface Foto {
  id: string;
  laudoId: string;
  ordem: number;
  nomeArquivo: string;
  imagem: Blob;            // JPEG comprimido (máx. 1600 px)
  miniatura: Blob;         // JPEG pequeno para listas
  largura: number;
  altura: number;
  tiradaEm?: number;       // data do EXIF
  gps?: { lat: number; lng: number };
  status: StatusFoto;
  analise?: Analise;
  observacao?: string;     // anotação do engenheiro (pode ser ditada)
  erro?: string;
  criadoEm: number;
}

export interface Laudo {
  id: string;
  usuarioId: string;
  tipo: TipoLaudo;
  titulo: string;
  status: StatusLaudo;
  /** Campos do formulário (dependem do tipo, ver dominio/tipos.ts) */
  dados: Record<string, string>;
  conclusao: string;
  /** objetivo/metodologia ajustados só neste laudo (senão vale o modelo) */
  textos?: { objetivo?: string; metodologia?: string };
  logo?: Blob;
  imagemLocalizacao?: Blob;
  criadoEm: number;
  atualizadoEm: number;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  sal: string;
  senhaHash: string;
  profissao: string;
  registro: string;        // CREA / CAU / CRC
  telefone: string;
  endereco: string;
  cidade: string;
  uf: string;
  logo?: Blob;
  assinatura?: Blob;
  ativo: boolean;
  criadoEm: number;
}

/** Textos padrão personalizados de um tipo de laudo (Ajustes › Modelos). */
export interface ModeloTexto {
  tipo: TipoLaudo;
  objetivo?: string;
  metodologia?: string;
  normas?: string[];
}

export type MotorIA = 'demo' | 'claude';

export interface Configuracao {
  chave: 'app';
  motorIA: MotorIA;
  apiKey: string;          // só neste navegador; no backend vai para o servidor
  tema: 'claro' | 'escuro' | 'sistema';
}

export const GRAVIDADE: Record<Gravidade, { nome: string; prioridade: string; texto: string; cor: string }> = {
  critico: {
    nome: 'Crítico', prioridade: 'Prioridade 1',
    texto: 'Risco à saúde, à segurança ou ao funcionamento. Corrigir imediatamente.',
    cor: 'critico',
  },
  medio: {
    nome: 'Médio', prioridade: 'Prioridade 2',
    texto: 'Perda parcial de desempenho, sem risco imediato. Programar a correção.',
    cor: 'medio',
  },
  minimo: {
    nome: 'Mínimo', prioridade: 'Prioridade 3',
    texto: 'Estético ou de manutenção. Acompanhar e incluir na manutenção.',
    cor: 'minimo',
  },
};

export const STATUS_LAUDO: Record<StatusLaudo, string> = {
  rascunho: 'Rascunho',
  conferencia: 'Em conferência',
  concluido: 'Concluído',
};

export const SISTEMAS = [
  'Estrutura', 'Vedações', 'Revestimentos', 'Pisos', 'Forros e tetos', 'Cobertura', 'Esquadrias',
  'Impermeabilização', 'Instalações hidráulicas', 'Instalações elétricas', 'Áreas externas', 'Documentos',
] as const;

export const TIPOS_ANOMALIA = [
  'Fissura', 'Trinca', 'Rachadura', 'Infiltração / umidade', 'Mofo / bolor', 'Eflorescência',
  'Destacamento de revestimento', 'Desplacamento de concreto', 'Corrosão de armadura', 'Recalque / desnível',
  'Piso ou cerâmica trincada', 'Pintura deteriorada', 'Esquadria danificada', 'Vazamento hidráulico',
  'Instalação elétrica exposta', 'Falha de vedação', 'Outro',
] as const;

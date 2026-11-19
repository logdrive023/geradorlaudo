/**
 * Modelo de domínio do LaudoTech.
 * Os mesmos nomes vão para o backend Go (ver docs/ARQUITETURA.md): Laudo, Foto, Analise, Achado, Usuario.
 */

export type TipoLaudo = 'cautelar' | 'entrega' | 'locacao' | 'inspecao' | 'extrajudicial' | 'estrutural' | 'reforma' | 'pericia' | 'avaliacao' | 'contabil';
import type { EtapaModelo } from './etapas';

export type StatusLaudo = 'rascunho' | 'conferencia' | 'concluido';
export type Papel = 'admin' | 'engenheiro' | 'assistente';

/** Grau de risco (IBAPE / ABNT NBR 16747): define a prioridade do reparo. */
export type Gravidade = 'critico' | 'medio' | 'minimo';

export type StatusFoto = 'pendente' | 'analisando' | 'analisada' | 'conferida' | 'erro';
export type OrigemAnalise = 'demo' | 'claude' | 'gemini' | 'servidor' | 'manual';

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
  aberturaMm?: number;     // abertura estimada (fissuras), contrato analise-foto.v1
  regiao?: Regiao;
  /** null = ainda não conferido; true = aceito; false = descartado pelo engenheiro */
  aceito: boolean | null;
  origem: OrigemAnalise;
  /** Qual IA escreveu (gemini, claude, openai). Só aparece na tela quando a foto teve 2+ IAs. */
  ia?: string;
  /** Plano de ação (opcional): acompanhamento do reparo depois do laudo. */
  acompanhamento?: Acompanhamento;
}
export type StatusAcao = 'aberta' | 'andamento' | 'resolvida';
export interface Acompanhamento {
  status: StatusAcao;
  prazo?: string;        // AAAA-MM-DD
  responsavel?: string;  // construtora, síndico, proprietário…
  custo?: number;        // custo estimado do reparo, em R$
  nota?: string;
}

export interface Analise {
  ambiente: string;        // ex.: "Sala", "Fachada", "Banheiro social"
  elemento: string;        // ex.: "Parede", "Teto", "Piso"
  legenda: string;         // legenda técnica da foto no laudo
  semAnomalia: boolean;    // "nada a relatar" também entra no laudo
  qualidadeFoto?: 'boa' | 'regular' | 'ruim';
  contrato?: string;       // versão do formato da IA (ex.: analise-foto.v1)
  achados: Achado[];
  origem: OrigemAnalise;
  analisadoEm: number;
  /** Uma linha por IA que analisou a foto (só quando há 2+ IAs ligadas). */
  porIA?: ResumoIA[];
}

/** O que cada IA disse da foto (para comparar a legenda e saber de onde veio cada achado). */
export interface ResumoIA {
  ia: string;
  modelo?: string;
  ambiente?: string;
  elemento?: string;
  legenda?: string;
  achados?: number;
  erro?: string;
}

/** IAs que o servidor sabe usar. Nome bonito e cor de cada uma (a cor só aparece com 2+ IAs). */
export const IAS: Record<string, { nome: string; empresa: string; cor: string }> = {
  gemini: { nome: 'Gemini', empresa: 'Google', cor: '#3B82F6' },
  claude: { nome: 'Claude', empresa: 'Anthropic', cor: '#D97757' },
  openai: { nome: 'ChatGPT', empresa: 'OpenAI', cor: '#10A37F' },
};
export const nomeIA = (id?: string) => (id && IAS[id]?.nome) || id || 'IA';

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

export type MotorIA = 'demo' | 'claude' | 'gemini' | 'servidor';

export interface Configuracao {
  chave: 'app';
  motorIA: MotorIA;
  apiKey: string;          // chave da Anthropic (Claude) — só neste navegador; no backend vai para o servidor
  geminiKey?: string;      // chave do Google AI Studio (Gemini)
  geminiModelo?: string;
  servidorUrl?: string;    // API LaudoTech (backend Go); a chave da IA fica no servidor
  /** IAs do servidor ligadas pela pessoa (vazio = só a principal do servidor). */
  iasLigadas?: string[];
  tema: 'claro' | 'escuro' | 'sistema';
  /** Etapas de obra configuradas (vazio = padrão de consenso). Ordem = ordem do cronograma. */
  etapasObra?: EtapaModelo[];
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

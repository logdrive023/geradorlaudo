import type { TipoObra } from './obra';

/**
 * Etapas de obra: o padrão de fábrica é um CONSENSO entre referências, e a pessoa muda tudo em Ajustes.
 *
 * Referências cruzadas (a ordem segue a sequência executiva usada no Brasil):
 * - Brasil: sequência de etapas do SINAPI/Caixa e das planilhas por etapa do mercado; ABNT NBR 12721 (custos/CUB)
 * - Internacional: UniFormat II (ASTM E1557: A Substructure, B Shell, C Interiors, D Services, G Sitework)
 *   e CSI MasterFormat (divisões 01 a 33)
 * Cada etapa guarda a correspondência em `ref` (aparece como dica em Ajustes).
 */
/** Classificação da etapa: o quanto um erro nela custa (segurança, estrutura, retrabalho). */
export type NivelEtapa = 'critica' | 'intermediaria' | 'simples';
export const NIVEL_ETAPA: Record<NivelEtapa, { nome: string; cor: string; texto: string }> = {
  critica: { nome: 'Crítica', cor: 'var(--critico)', texto: 'Erro aqui afeta segurança, estrutura ou estanqueidade e é caro de refazer. Pede fiscalização de perto.' },
  intermediaria: { nome: 'Intermediária', cor: 'var(--medio)', texto: 'Afeta desempenho e acabamento; dá retrabalho, mas sem risco à segurança.' },
  simples: { nome: 'Simples', cor: 'var(--ok)', texto: 'Serviço de rotina ou acabamento, fácil de corrigir.' },
};

export interface EtapaModelo {
  id: string;
  nome: string;
  nivel: NivelEtapa;
  ref?: string;              // correspondência nas referências
  tipos: TipoObra[];         // em quais tipos de obra entra por padrão
  checklist: string[];
}

const TODOS: TipoObra[] = ['construcao', 'reforma', 'ampliacao', 'manutencao', 'interiores', 'demolicao'];
const NOVA: TipoObra[] = ['construcao', 'ampliacao'];
const ACAB: TipoObra[] = ['construcao', 'reforma', 'ampliacao', 'interiores'];

export const ETAPAS_PADRAO: EtapaModelo[] = [
  { id: 'preliminares', nivel: 'simples', nome: 'Serviços preliminares e canteiro', ref: 'SINAPI: serviços preliminares/canteiro · UniFormat Z10 · MasterFormat 01', tipos: TODOS,
    checklist: ['Alvará e ART/RRT no canteiro', 'Tapume, placa da obra e acessos', 'Ligações provisórias de água e energia', 'Canteiro, depósito e área de vivência (NR-18)'] },
  { id: 'demolicao', nivel: 'critica', nome: 'Demolições e retiradas', ref: 'UniFormat F20 · MasterFormat 02', tipos: ['reforma', 'demolicao', 'interiores'],
    checklist: ['Desligar e isolar instalações', 'Escoramento onde necessário', 'Retirada e destinação de entulho (caçamba/CTR)', 'Proteção das áreas mantidas'] },
  { id: 'terra', nivel: 'intermediaria', nome: 'Movimento de terra e locação', ref: 'UniFormat G10 · MasterFormat 31', tipos: NOVA,
    checklist: ['Limpeza do terreno', 'Corte, aterro e compactação', 'Locação da obra conferida com o projeto', 'Gabarito e níveis de referência'] },
  { id: 'fundacoes', nivel: 'critica', nome: 'Fundações (infraestrutura)', ref: 'SINAPI: infraestrutura · UniFormat A10 · MasterFormat 31/03', tipos: NOVA,
    checklist: ['Sondagem conferida com o projeto', 'Escavação na cota de projeto', 'Armadura conferida antes da concretagem', 'Impermeabilização de baldrames/vigas de fundação'] },
  { id: 'estrutura', nivel: 'critica', nome: 'Estrutura (superestrutura)', ref: 'SINAPI: superestrutura · UniFormat B10 · MasterFormat 03/05', tipos: NOVA,
    checklist: ['Formas no prumo, nível e escoradas', 'Armação conferida com o projeto', 'Concretagem com controle tecnológico (corpos de prova)', 'Cura e desforma no prazo'] },
  { id: 'alvenaria', nivel: 'intermediaria', nome: 'Alvenaria e vedações', ref: 'UniFormat B20/C10 · MasterFormat 04/09', tipos: ['construcao', 'ampliacao', 'reforma'],
    checklist: ['Marcação da primeira fiada', 'Vergas e contravergas em todos os vãos', 'Amarração com a estrutura e encunhamento', 'Prumo, nível e esquadro'] },
  { id: 'cobertura', nivel: 'intermediaria', nome: 'Cobertura', ref: 'SINAPI: cobertura · UniFormat B30 · MasterFormat 07', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao'],
    checklist: ['Estrutura do telhado (madeira/metálica)', 'Telhamento com sobreposição correta', 'Calhas, rufos e condutores', 'Teste de estanqueidade'] },
  { id: 'impermeabilizacao', nivel: 'critica', nome: 'Impermeabilização', ref: 'ABNT NBR 9575 · UniFormat B10/C30 · MasterFormat 07', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao'],
    checklist: ['Regularização com caimento para ralos', 'Aplicação do sistema conforme projeto', 'Teste de estanqueidade (72 h)', 'Proteção mecânica'] },
  { id: 'hidraulica', nivel: 'intermediaria', nome: 'Instalações hidrossanitárias', ref: 'UniFormat D20 · MasterFormat 22', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao', 'interiores'],
    checklist: ['Água fria/quente testada sob pressão', 'Esgoto com caimento e ventilação', 'Águas pluviais', 'Registros e caixas acessíveis'] },
  { id: 'eletrica', nivel: 'critica', nome: 'Instalações elétricas e dados', ref: 'ABNT NBR 5410 · UniFormat D50 · MasterFormat 26/27', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao', 'interiores'],
    checklist: ['Eletrodutos e caixas', 'Quadro com DR e disjuntores por circuito', 'Aterramento (e SPDA, se houver)', 'Teste de circuitos e tomadas'] },
  { id: 'especiais', nivel: 'critica', nome: 'Gás, climatização e incêndio', ref: 'UniFormat D30/D40 · MasterFormat 21/23', tipos: ['construcao', 'ampliacao', 'reforma'],
    checklist: ['Rede de gás testada', 'Infra de ar-condicionado (drenos e pontos)', 'Extintores, iluminação de emergência e sinalização'] },
  { id: 'esquadrias', nivel: 'intermediaria', nome: 'Esquadrias', ref: 'UniFormat B20/C10 · MasterFormat 08', tipos: ACAB,
    checklist: ['Contramarcos no prumo', 'Portas e janelas com vedação', 'Ferragens e fechaduras', 'Vidros e guarda-corpos'] },
  { id: 'revestimentos', nivel: 'intermediaria', nome: 'Revestimentos de parede e forro', ref: 'ABNT NBR 13749 · UniFormat C30 · MasterFormat 09', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao', 'interiores'],
    checklist: ['Chapisco, emboço e reboco', 'Revestimento cerâmico com dupla colagem', 'Rejuntes e juntas de movimentação', 'Forro (gesso/PVC) nivelado'] },
  { id: 'pisos', nivel: 'simples', nome: 'Pisos e contrapisos', ref: 'UniFormat C30 · MasterFormat 09', tipos: ACAB,
    checklist: ['Contrapiso nivelado e com caimento', 'Assentamento sem som cavo', 'Rodapés e soleiras', 'Juntas de dilatação'] },
  { id: 'pintura', nivel: 'simples', nome: 'Pintura', ref: 'ABNT NBR 13245 · UniFormat C30 · MasterFormat 09', tipos: ['construcao', 'ampliacao', 'reforma', 'manutencao', 'interiores'],
    checklist: ['Massa e lixamento', 'Fundo/selador', 'Demãos de acabamento', 'Retoques'] },
  { id: 'acabamentos', nivel: 'simples', nome: 'Louças, metais e acabamentos finais', ref: 'UniFormat D20/C10 · MasterFormat 10/22', tipos: ACAB,
    checklist: ['Louças e metais instalados e testados', 'Luminárias e acabamentos elétricos', 'Bancadas e arremates', 'Lista de pendências (punch list)'] },
  { id: 'externa', nivel: 'simples', nome: 'Área externa e paisagismo', ref: 'UniFormat G20/G30 · MasterFormat 32', tipos: NOVA,
    checklist: ['Calçada e acessos', 'Drenagem externa', 'Muros e portões', 'Paisagismo'] },
  { id: 'entrega', nivel: 'simples', nome: 'Limpeza final e entrega', ref: 'ABNT NBR 14037 e 5674 · MasterFormat 01 (closeout)', tipos: TODOS,
    checklist: ['Limpeza fina', 'Vistoria de entrega com o cliente', 'Manual de uso e manutenção (NBR 14037)', 'Termo de entrega e as built'] },
];

/** Etapas configuradas pela pessoa (ou o padrão, se ainda não mexeu). */
export const etapasConfiguradas = (cfg?: { etapasObra?: EtapaModelo[] }) => (cfg?.etapasObra?.length ? cfg.etapasObra : ETAPAS_PADRAO);

/** Etapas que entram por padrão num tipo de obra, na ordem configurada. */
export const etapasParaTipo = (modelos: EtapaModelo[], tipo?: TipoObra) => (tipo ? modelos.filter((e) => e.tipos.includes(tipo)) : modelos);

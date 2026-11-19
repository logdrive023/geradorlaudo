import type { TipoLaudo } from './modelo';

/**
 * O PADRÃO de cada tipo de laudo: campos, normas, objetivo e metodologia.
 * Os textos podem ser personalizados em Ajustes › Modelos (e em cada laudo).
 */

export interface Campo {
  chave: string;
  rotulo: string;
  tipo?: 'texto' | 'area' | 'data' | 'opcoes' | 'numero';
  opcoes?: string[];
  dica?: string;          // exemplo curto, embaixo do campo
  ajuda?: string;         // explicação no tooltip (i)
  obrigatorio?: boolean;
  largo?: boolean;
  curto?: boolean;        // cabe ao lado de outro curto no celular
}

export interface Secao { titulo: string; campos: Campo[] }

export type GrupoTipo = 'Vistorias' | 'Laudos técnicos' | 'Perícias e avaliações' | 'Outros';

export interface DefinicaoTipo {
  id: TipoLaudo;
  grupo: GrupoTipo;
  nome: string;
  curto: string;
  descricao: string;
  normas: string[];
  tituloPadrao: string;
  /** o que a foto mostra: o imóvel ou documentos */
  foco: 'imovel' | 'documento';
  secoes: Secao[];
  objetivo: string;
  metodologia: string;
  /** o que este laudo entrega (aparece ao escolher o tipo) */
  entrega: string[];
}

const CONSERVACAO = ['Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo'];
const PADRAO = ['Baixo', 'Normal', 'Alto'];
const USO = ['Residencial', 'Comercial', 'Misto', 'Industrial', 'Institucional'];
const EDIFICACAO = ['Casa térrea', 'Sobrado', 'Apartamento', 'Edifício', 'Galpão', 'Loja / sala', 'Terreno'];

const ENDERECO: Campo[] = [
  { chave: 'endereco', rotulo: 'Endereço do imóvel', obrigatorio: true, largo: true, dica: 'Rua, número, complemento — bairro' },
  { chave: 'cidadeUf', rotulo: 'Cidade / UF', obrigatorio: true, dica: 'São Paulo / SP' },
  { chave: 'cep', rotulo: 'CEP', curto: true },
];

const OCUPACAO: Campo[] = [
  { chave: 'ocupante', rotulo: 'Ocupante / telefone', ajuda: 'Quem mora ou usa o imóvel hoje. Ajuda a agendar o retorno.' },
  { chave: 'acompanhante', rotulo: 'Quem acompanhou a vistoria', ajuda: 'Nome de quem abriu o imóvel e acompanhou. Dá força ao laudo numa disputa.' },
];

const CARACTERIZACAO: Campo[] = [
  { chave: 'uso', rotulo: 'Uso do imóvel', tipo: 'opcoes', opcoes: USO },
  { chave: 'edificacao', rotulo: 'Tipo de edificação', tipo: 'opcoes', opcoes: EDIFICACAO },
  { chave: 'padrao', rotulo: 'Padrão construtivo', tipo: 'opcoes', opcoes: PADRAO, ajuda: 'Acabamentos e materiais: baixo (simples), normal ou alto (acabamento fino).' },
  { chave: 'conservacao', rotulo: 'Estado de conservação', tipo: 'opcoes', opcoes: CONSERVACAO },
  { chave: 'idade', rotulo: 'Idade', curto: true, dica: '15 anos (aparente)', ajuda: 'Idade real (pelo habite-se) ou aparente (pela sua avaliação). Diga qual.' },
  { chave: 'pavimentos', rotulo: 'Pavimentos', tipo: 'numero', curto: true },
  { chave: 'area', rotulo: 'Área construída (m²)', tipo: 'numero', curto: true },
  { chave: 'estrutura', rotulo: 'Sistema estrutural', dica: 'concreto armado, alvenaria estrutural…' },
];

const DILIGENCIA: Campo[] = [
  { chave: 'dataVistoria', rotulo: 'Data da vistoria', tipo: 'data', obrigatorio: true, curto: true },
  { chave: 'art', rotulo: 'ART / RRT nº', obrigatorio: true, curto: true, ajuda: 'Anotação (CREA) ou Registro (CAU) de Responsabilidade Técnica deste serviço. Sem ela o laudo não fica pronto para assinar.' },
  { chave: 'observacoes', rotulo: 'Observações gerais', tipo: 'area', largo: true, ajuda: 'Limitações da vistoria: ambientes sem acesso, chuva, móveis que impediram a visão…' },
];

export const TIPOS: Record<TipoLaudo, DefinicaoTipo> = {
  /* ------------------------- VISTORIAS ------------------------- */
  cautelar: {
    id: 'cautelar', grupo: 'Vistorias', nome: 'Vistoria Cautelar de Vizinhança', curto: 'Cautelar',
    descricao: 'Estado dos vizinhos antes da obra, para proteger construtora e vizinhos.',
    normas: ['ABNT NBR 13752 — Perícias de engenharia na construção civil', 'ABNT NBR 12722 — Discriminação de serviços para construção de edifícios', 'ABNT NBR 16280 — Reforma em edificações'],
    tituloPadrao: 'Vistoria Cautelar de Vizinhança', foco: 'imovel',
    objetivo: 'Registrar, de forma técnica e fotográfica, o estado de conservação do imóvel vizinho antes do início da obra, para servir de referência em eventual comparação futura.',
    metodologia: 'Vistoria visual, não destrutiva, de todos os ambientes acessíveis, com registro fotográfico datado. As anomalias aparentes foram identificadas, localizadas e classificadas quanto ao grau de risco. Não foram realizados ensaios nem remoção de revestimentos.',
    entrega: ['Registro de cada ambiente, com ou sem anomalia', 'Fissuras e danos preexistentes marcados na foto', 'Base para comparar depois da obra'],
    secoes: [
      { titulo: 'Quem pediu', campos: [
        { chave: 'solicitante', rotulo: 'Solicitante (construtora)', obrigatorio: true },
        { chave: 'obra', rotulo: 'Obra vizinha', largo: true, ajuda: 'O empreendimento que motivou a vistoria (nome e endereço da obra).' },
      ] },
      { titulo: 'Imóvel vistoriado', campos: [...ENDERECO, ...OCUPACAO] },
      { titulo: 'Caracterização', campos: CARACTERIZACAO },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },
  entrega: {
    id: 'entrega', grupo: 'Vistorias', nome: 'Vistoria de Entrega de Imóvel', curto: 'Entrega',
    descricao: 'Recebimento de imóvel novo: o que a construtora precisa corrigir.',
    normas: ['ABNT NBR 15575 — Desempenho de edificações habitacionais', 'ABNT NBR 17170 — Garantias na construção', 'ABNT NBR 5674 — Manutenção de edificações'],
    tituloPadrao: 'Vistoria de Entrega de Imóvel', foco: 'imovel',
    objetivo: 'Verificar as condições do imóvel no momento da entrega, apontando vícios aparentes e não conformidades para correção pela construtora dentro dos prazos de garantia.',
    metodologia: 'Vistoria visual e funcional dos ambientes, acabamentos, esquadrias e instalações aparentes (teste de pontos elétricos, hidráulicos e de escoamento), com registro fotográfico e classificação por grau de risco.',
    entrega: ['Lista de pendências para a construtora', 'Prazos de garantia (NBR 17170)', 'Fotos de cada pendência marcada'],
    secoes: [
      { titulo: 'Partes', campos: [
        { chave: 'solicitante', rotulo: 'Proprietário / comprador', obrigatorio: true },
        { chave: 'construtora', rotulo: 'Construtora / incorporadora' },
        { chave: 'unidade', rotulo: 'Unidade', curto: true, dica: 'Apto 142, Torre B' },
        { chave: 'dataEntrega', rotulo: 'Data da entrega das chaves', tipo: 'data', curto: true, ajuda: 'Os prazos de garantia contam a partir daqui (NBR 17170).' },
      ] },
      { titulo: 'Imóvel', campos: [...ENDERECO, ...CARACTERIZACAO.slice(0, 2), CARACTERIZACAO[6]] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },
  locacao: {
    id: 'locacao', grupo: 'Vistorias', nome: 'Vistoria de Locação', curto: 'Locação',
    descricao: 'Entrada ou saída do inquilino: estado de cada ambiente e item.',
    normas: ['Lei 8.245/1991 (Lei do Inquilinato), arts. 22 e 23', 'ABNT NBR 13752 — Perícias de engenharia na construção civil'],
    tituloPadrao: 'Vistoria de Locação', foco: 'imovel',
    objetivo: 'Registrar o estado do imóvel e de seus itens na entrada ou saída do locatário, servindo de referência para a devolução nas mesmas condições.',
    metodologia: 'Vistoria visual de todos os ambientes, com registro fotográfico de paredes, pisos, tetos, esquadrias, louças, metais e itens, e anotação das leituras de medidores.',
    entrega: ['Estado de cada item por ambiente', 'Leitura dos medidores', 'Comparativo para a devolução'],
    secoes: [
      { titulo: 'Contrato', campos: [
        { chave: 'momento', rotulo: 'Momento', tipo: 'opcoes', opcoes: ['Entrada', 'Saída'], obrigatorio: true },
        { chave: 'solicitante', rotulo: 'Locador / imobiliária', obrigatorio: true },
        { chave: 'locatario', rotulo: 'Locatário' },
        { chave: 'contrato', rotulo: 'Contrato nº', curto: true },
      ] },
      { titulo: 'Imóvel', campos: [...ENDERECO, CARACTERIZACAO[1], CARACTERIZACAO[3]] },
      { titulo: 'Medidores e chaves', campos: [
        { chave: 'luz', rotulo: 'Leitura de luz (kWh)', tipo: 'numero', curto: true },
        { chave: 'agua', rotulo: 'Leitura de água (m³)', tipo: 'numero', curto: true },
        { chave: 'gas', rotulo: 'Leitura de gás (m³)', tipo: 'numero', curto: true },
        { chave: 'chaves', rotulo: 'Chaves entregues', curto: true, dica: '3 chaves, 1 controle' },
      ] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },

  /* ---------------------- LAUDOS TÉCNICOS ---------------------- */
  inspecao: {
    id: 'inspecao', grupo: 'Laudos técnicos', nome: 'Inspeção Predial', curto: 'Inspeção predial',
    descricao: 'Sistemas, anomalias e manutenção do prédio, com prioridades.',
    normas: ['ABNT NBR 16747:2020 — Inspeção predial', 'ABNT NBR 5674 — Manutenção de edificações', 'Norma de Inspeção Predial do IBAPE'],
    tituloPadrao: 'Laudo de Inspeção Predial', foco: 'imovel',
    objetivo: 'Avaliar as condições técnicas, de uso, operação e manutenção da edificação, classificando as irregularidades por grau de risco e indicando as prioridades de correção.',
    metodologia: 'Inspeção sensorial dos sistemas construtivos acessíveis, conforme ABNT NBR 16747, com análise da documentação disponível, registro fotográfico e classificação das anomalias e falhas em Prioridade 1, 2 e 3 segundo o grau de risco.',
    entrega: ['Prioridades 1, 2 e 3 (NBR 16747)', 'Análise da documentação do prédio', 'Recomendações de manutenção'],
    secoes: [
      { titulo: 'Contratante', campos: [
        { chave: 'solicitante', rotulo: 'Condomínio / contratante', obrigatorio: true },
        { chave: 'sindico', rotulo: 'Síndico / responsável' },
      ] },
      { titulo: 'Edificação', campos: [...ENDERECO, ...CARACTERIZACAO] },
      { titulo: 'Documentação', campos: [
        { chave: 'documentos', rotulo: 'Documentos analisados', tipo: 'area', largo: true, dica: 'Habite-se, AVCB, manual de uso, plano de manutenção…', ajuda: 'A NBR 16747 pede a análise da documentação técnica e de manutenção do prédio.' },
        { chave: 'sistemas', rotulo: 'Sistemas inspecionados', tipo: 'area', largo: true },
      ] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },
  extrajudicial: {
    id: 'extrajudicial', grupo: 'Laudos técnicos', nome: 'Laudo de Vícios Construtivos', curto: 'Vícios construtivos',
    descricao: 'Parecer técnico sobre defeitos e danos, para acordo ou ação.',
    normas: ['ABNT NBR 13752 — Perícias de engenharia na construção civil', 'ABNT NBR 15575 — Desempenho de edificações', 'Código de Defesa do Consumidor (arts. 12 e 18)'],
    tituloPadrao: 'Laudo Técnico de Vícios Construtivos', foco: 'imovel',
    objetivo: 'Constatar, descrever e analisar as anomalias apontadas, indicando causas prováveis, responsabilidades técnicas e as medidas de correção.',
    metodologia: 'Vistoria técnica com registro fotográfico, análise da documentação apresentada e confronto com as normas aplicáveis. As constatações respondem aos quesitos formulados e as causas prováveis seguem os critérios da ABNT NBR 13752.',
    entrega: ['Causa provável de cada vício', 'Respostas aos quesitos', 'Medidas de correção'],
    secoes: [
      { titulo: 'Referência', campos: [
        { chave: 'solicitante', rotulo: 'Solicitante', obrigatorio: true },
        { chave: 'requerente', rotulo: 'Requerente' },
        { chave: 'requerido', rotulo: 'Requerido', ajuda: 'Quem responde pelo vício: construtora, incorporadora, prestador…' },
        { chave: 'processo', rotulo: 'Referência', curto: true },
        { chave: 'objeto', rotulo: 'Objeto do laudo', tipo: 'area', largo: true, obrigatorio: true, dica: 'O que se pede para analisar' },
        { chave: 'quesitos', rotulo: 'Quesitos', tipo: 'area', largo: true, dica: 'Um por linha', ajuda: 'Perguntas que o laudo precisa responder. Cada linha vira um item numerado.' },
      ] },
      { titulo: 'Imóvel', campos: [...ENDERECO, ...CARACTERIZACAO] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },
  estrutural: {
    id: 'estrutural', grupo: 'Laudos técnicos', nome: 'Laudo Estrutural', curto: 'Estrutural',
    descricao: 'Estabilidade e segurança da estrutura: trincas, recalques, corrosão.',
    normas: ['ABNT NBR 6118 — Projeto de estruturas de concreto', 'ABNT NBR 15575-2 — Desempenho: sistemas estruturais', 'ABNT NBR 13752 — Perícias de engenharia na construção civil'],
    tituloPadrao: 'Laudo de Avaliação Estrutural', foco: 'imovel',
    objetivo: 'Avaliar as condições de estabilidade e segurança estrutural da edificação, identificando manifestações patológicas, suas causas prováveis e as intervenções necessárias.',
    metodologia: 'Inspeção visual dos elementos estruturais acessíveis (fundações aparentes, pilares, vigas, lajes), mapeamento de fissuras e deformações, e, quando indicado, ensaios complementares. As manifestações foram classificadas quanto ao risco.',
    entrega: ['Mapa das manifestações patológicas', 'Risco à estabilidade', 'Intervenções e ensaios indicados'],
    secoes: [
      { titulo: 'Contratante', campos: [{ chave: 'solicitante', rotulo: 'Contratante', obrigatorio: true }, { chave: 'motivo', rotulo: 'Motivo da avaliação', tipo: 'area', largo: true, dica: 'Trincas novas, reforma, compra do imóvel…' }] },
      { titulo: 'Edificação', campos: [...ENDERECO, ...CARACTERIZACAO] },
      { titulo: 'Ensaios', campos: [{ chave: 'ensaios', rotulo: 'Ensaios realizados', tipo: 'area', largo: true, dica: 'Esclerometria, pacometria, carbonatação… (ou "não realizados")', ajuda: 'Se não houve ensaio, diga: o laudo fica limitado à inspeção visual.' }] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },
  reforma: {
    id: 'reforma', grupo: 'Laudos técnicos', nome: 'Laudo de Reforma (NBR 16280)', curto: 'Reforma',
    descricao: 'Plano de reforma para o síndico aprovar, com riscos e responsáveis.',
    normas: ['ABNT NBR 16280 — Reforma em edificações', 'ABNT NBR 5674 — Manutenção de edificações'],
    tituloPadrao: 'Laudo Técnico de Reforma', foco: 'imovel',
    objetivo: 'Descrever a reforma pretendida, avaliar seus impactos nos sistemas da edificação e definir as condições para execução segura, conforme ABNT NBR 16280.',
    metodologia: 'Vistoria da unidade antes da reforma, análise do escopo e dos projetos, identificação dos sistemas afetados e registro fotográfico do estado inicial.',
    entrega: ['Escopo e sistemas afetados', 'Riscos e cuidados na execução', 'Estado da unidade antes da obra'],
    secoes: [
      { titulo: 'Reforma', campos: [
        { chave: 'solicitante', rotulo: 'Proprietário', obrigatorio: true },
        { chave: 'unidade', rotulo: 'Unidade', curto: true },
        { chave: 'executor', rotulo: 'Responsável pela execução' },
        { chave: 'escopo', rotulo: 'O que será feito', tipo: 'area', largo: true, obrigatorio: true, dica: 'Demolições, troca de pisos, elétrica…' },
        { chave: 'sistemas', rotulo: 'Sistemas afetados', tipo: 'area', largo: true },
        { chave: 'prazo', rotulo: 'Prazo previsto', curto: true },
      ] },
      { titulo: 'Imóvel', campos: ENDERECO },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },

  /* ------------------- PERÍCIAS E AVALIAÇÕES ------------------- */
  pericia: {
    id: 'pericia', grupo: 'Perícias e avaliações', nome: 'Perícia Judicial', curto: 'Perícia judicial',
    descricao: 'Laudo para o juiz, respondendo aos quesitos do processo.',
    normas: ['Código de Processo Civil, arts. 464 a 480', 'ABNT NBR 13752 — Perícias de engenharia na construção civil'],
    tituloPadrao: 'Laudo Pericial', foco: 'imovel',
    objetivo: 'Atender à determinação do Juízo, examinando o objeto da perícia e respondendo aos quesitos formulados pelo Juízo e pelas partes.',
    metodologia: 'Diligência no local, com ciência prévia das partes e assistentes técnicos, registro fotográfico, análise dos autos e confronto com as normas técnicas aplicáveis (CPC art. 473).',
    entrega: ['Estrutura do art. 473 do CPC', 'Respostas numeradas aos quesitos', 'Registro da diligência com as partes'],
    secoes: [
      { titulo: 'Processo', campos: [
        { chave: 'processo', rotulo: 'Processo nº', obrigatorio: true, dica: '0000000-00.0000.0.00.0000' },
        { chave: 'vara', rotulo: 'Vara / comarca', obrigatorio: true },
        { chave: 'requerente', rotulo: 'Autor' },
        { chave: 'requerido', rotulo: 'Réu' },
        { chave: 'solicitante', rotulo: 'Nomeado por', dica: 'MM. Juiz(a) de Direito', obrigatorio: true },
        { chave: 'assistentes', rotulo: 'Assistentes técnicos presentes', largo: true },
        { chave: 'objeto', rotulo: 'Objeto da perícia', tipo: 'area', largo: true, obrigatorio: true },
        { chave: 'quesitos', rotulo: 'Quesitos', tipo: 'area', largo: true, dica: 'Um por linha (do Juízo e das partes)', ajuda: 'O CPC exige resposta conclusiva a todos os quesitos. Cada linha vira um item numerado.' },
      ] },
      { titulo: 'Imóvel', campos: [...ENDERECO, ...CARACTERIZACAO] },
      { titulo: 'Diligência', campos: DILIGENCIA },
    ],
  },
  avaliacao: {
    id: 'avaliacao', grupo: 'Perícias e avaliações', nome: 'Avaliação de Imóvel', curto: 'Avaliação',
    descricao: 'Valor de mercado do imóvel com método e fundamentação.',
    normas: ['ABNT NBR 14653-1 — Avaliação de bens: procedimentos gerais', 'ABNT NBR 14653-2 — Avaliação de imóveis urbanos'],
    tituloPadrao: 'Laudo de Avaliação de Imóvel', foco: 'imovel',
    objetivo: 'Determinar o valor de mercado do imóvel na data-base, conforme a ABNT NBR 14653.',
    metodologia: 'Vistoria para caracterização do imóvel e da região, pesquisa de mercado e aplicação do método indicado, com tratamento dos dados e enquadramento nos graus de fundamentação e precisão da ABNT NBR 14653-2.',
    entrega: ['Valor de mercado e data-base', 'Método e graus da NBR 14653', 'Caracterização do imóvel e da região'],
    secoes: [
      { titulo: 'Finalidade', campos: [
        { chave: 'solicitante', rotulo: 'Solicitante', obrigatorio: true },
        { chave: 'finalidade', rotulo: 'Finalidade', tipo: 'opcoes', opcoes: ['Compra e venda', 'Garantia', 'Partilha', 'Judicial', 'Locação'] },
        { chave: 'metodo', rotulo: 'Método', tipo: 'opcoes', opcoes: ['Comparativo direto', 'Evolutivo', 'Da renda', 'Involutivo'], ajuda: 'Comparativo direto (com amostras do mercado) é o preferido pela NBR 14653 quando há dados.' },
      ] },
      { titulo: 'Imóvel', campos: [...ENDERECO, ...CARACTERIZACAO, { chave: 'areaTerreno', rotulo: 'Área do terreno (m²)', tipo: 'numero', curto: true }] },
      { titulo: 'Resultado', campos: [
        { chave: 'amostras', rotulo: 'Nº de amostras', tipo: 'numero', curto: true },
        { chave: 'fundamentacao', rotulo: 'Grau de fundamentação', tipo: 'opcoes', opcoes: ['I', 'II', 'III'], ajuda: 'Mostra o quanto o laudo é embasado (quantidade e qualidade dos dados). III é o mais alto.' },
        { chave: 'precisao', rotulo: 'Grau de precisão', tipo: 'opcoes', opcoes: ['I', 'II', 'III'] },
        { chave: 'valor', rotulo: 'Valor de mercado (R$)', obrigatorio: true, curto: true, dica: '850.000,00' },
        { chave: 'dataBase', rotulo: 'Data-base', tipo: 'data', curto: true },
      ] },
      { titulo: 'Vistoria', campos: DILIGENCIA },
    ],
  },

  /* --------------------------- OUTROS --------------------------- */
  contabil: {
    id: 'contabil', grupo: 'Outros', nome: 'Laudo Contábil', curto: 'Contábil',
    descricao: 'Análise de documentos e demonstrações, com anexos fotografados.',
    normas: ['NBC TP 01 — Perícia contábil', 'NBC PP 01 — Perito contábil'],
    tituloPadrao: 'Laudo Pericial Contábil', foco: 'documento',
    objetivo: 'Examinar os documentos e registros apresentados e responder, de forma técnica, ao objeto da perícia.',
    metodologia: 'Exame documental, conferência de lançamentos e demonstrações, cálculos e análise comparativa. Os documentos fotografados estão anexados e numerados.',
    entrega: ['Documentos anexados e numerados', 'Análise patrimonial e de resultados', 'Indicadores financeiros'],
    secoes: [
      { titulo: 'Empresa', campos: [
        { chave: 'solicitante', rotulo: 'Empresa', obrigatorio: true },
        { chave: 'cnpj', rotulo: 'CNPJ', curto: true },
        { chave: 'periodo', rotulo: 'Período analisado', curto: true },
        { chave: 'endereco', rotulo: 'Endereço', largo: true },
      ] },
      { titulo: 'Análise', campos: [
        { chave: 'objeto', rotulo: 'Objeto da perícia', tipo: 'area', largo: true, obrigatorio: true },
        { chave: 'patrimonial', rotulo: 'Situação patrimonial', tipo: 'area', largo: true },
        { chave: 'resultados', rotulo: 'Análise de resultados', tipo: 'area', largo: true },
        { chave: 'indicadores', rotulo: 'Indicadores financeiros', tipo: 'area', largo: true },
      ] },
      { titulo: 'Data', campos: [
        { chave: 'dataVistoria', rotulo: 'Data', tipo: 'data', obrigatorio: true, curto: true },
        { chave: 'observacoes', rotulo: 'Observações gerais', tipo: 'area', largo: true },
      ] },
    ],
  },
};

export const LISTA_TIPOS = Object.values(TIPOS);
export const GRUPOS: GrupoTipo[] = ['Vistorias', 'Laudos técnicos', 'Perícias e avaliações', 'Outros'];

export function camposObrigatorios(tipo: TipoLaudo): Campo[] {
  return TIPOS[tipo].secoes.flatMap((s) => s.campos).filter((c) => c.obrigatorio);
}

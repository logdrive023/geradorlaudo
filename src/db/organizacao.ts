import { api } from './nuvem';
import { SERVIDOR_PADRAO } from '../ia/servidor';
import type { Papel } from '../dominio/modelo';

/* Organização com papéis, convites, autenticidade e respostas do cliente (rotas em docs/ORGANIZACAO.md). */

export const PAPEIS: Record<Papel, { nome: string; ve: string; faz: string; naoFaz: string }> = {
  admin: { nome: 'Admin', ve: 'Tudo da organização', faz: 'Convida pessoas, muda papéis, cuida do plano, das IAs e dos modelos', naoFaz: '—' },
  engenheiro: { nome: 'Engenheiro', ve: 'Os laudos e obras dele e os atribuídos a ele', faz: 'Cria, confere, conclui, emite e assina', naoFaz: 'Gerir equipe e plano' },
  assistente: { nome: 'Assistente', ve: 'Só o que for atribuído a ele', faz: 'Fotos, dados, conferência e diário de obra', naoFaz: 'Concluir ou emitir laudo, apagar, ver o financeiro' },
};

export interface UsuarioOrg { id: string; email: string; nome: string; papel: Papel; ativo: boolean; registro: string; profissao: string }
export interface ConviteOrg { email: string; nome: string; papel: Papel; organizacao?: string; criadoEm: string; expiraEm: string; pendente: boolean }
export interface EventoOrg { id: number; nome?: string; acao: string; alvoTipo?: string; alvoId?: string; detalhe?: { nome?: string }; criadoEm: string }
export interface Org {
  organizacao: { id: string; nome: string; cnpj: string };
  assinatura: { plano: string; status: string; laudosMes: number; usuariosMax: number; creditos: number };
  uso: { laudosMes: number; analisesIA: number; porMotor: Record<string, number>; usuarios: number };
  papel: Papel;
  permissoes: Record<string, boolean>;
  /** registro de atividades ligado no servidor (AUDITORIA=ligada) */
  auditoria?: boolean;
  plano?: PlanoServidor;
  cota?: CotaFotos;
}

// ---------- plano e fotos com IA ----------
export interface PlanoServidor { id: string; nome: string; precoCentavos: number; fotosMes: number; usuariosMax: number; obras: boolean }
/** restam = -1 quando o plano não tem limite */
export interface CotaFotos { fotosMes: number; usadas: number; extras: number; restam: number }
export interface PedidoFotos { id: string; pacote: string; fotos: number; valorCentavos: number; status: 'pendente' | 'pago' | 'cancelado'; link?: string; criadoEm: string; pagoEm?: string }
export interface InfoFotos { cota: CotaFotos; plano: PlanoServidor; pacotes: { id: string; fotos: number; precoCentavos: number }[]; pedidos: PedidoFotos[]; compraLigada: boolean }

let cacheFotos: { em: number; v: InfoFotos } | null = null;
/** Plano e fotos do mês (guarda 1 min para não perguntar ao servidor a cada tela). */
export async function lerFotos(forcar = false): Promise<InfoFotos> {
  if (!forcar && cacheFotos && Date.now() - cacheFotos.em < 60_000) return cacheFotos.v;
  const v = await api<InfoFotos>('/api/org/fotos');
  cacheFotos = { em: Date.now(), v };
  return v;
}
export const esquecerFotos = () => { cacheFotos = null; };
/** Pede um pacote: com a cobrança ligada vem o link de pagamento; sem, vem um aviso. */
export async function comprarFotos(pacote: string): Promise<{ link?: string; aviso?: string }> {
  cacheFotos = null;
  return api<{ link?: string; aviso?: string }>('/api/org/fotos', json({ pacote }));
}

const json = (corpo: unknown, metodo = 'POST'): RequestInit => ({ method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });

export const lerOrg = () => api<Org>('/api/org');
export const listarUsuarios = async () => (await api<{ usuarios: UsuarioOrg[] }>('/api/org/usuarios')).usuarios;
export const alterarUsuario = (id: string, p: { papel?: Papel; ativo?: boolean }) => api<void>(`/api/org/usuarios/${id}`, json(p, 'PATCH'));
export const listarConvites = async () => (await api<{ convites: ConviteOrg[] }>('/api/org/convites')).convites;
export const auditoria = async () => (await api<{ eventos: EventoOrg[] }>('/api/org/auditoria')).eventos;
/** Devolve o link pronto para mandar (só aparece uma vez). */
export async function convidar(email: string, nome: string, papel: Papel) {
  const r = await api<{ token: string }>('/api/org/convites', json({ email, nome, papel }));
  return `${location.origin}/convite/${r.token}`;
}

// ---------- público (sem login) ----------
async function publico<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(SERVIDOR_PADRAO.replace(/\/$/, '') + caminho, init);
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((corpo as { erro?: string }).erro || 'Não encontrado.');
  return corpo as T;
}
export const lerConvite = async (token: string) => (await publico<{ convite: ConviteOrg }>(`/api/convite/${token}`)).convite;
export const aceitarConvite = (token: string, nome: string, senha: string) => publico<{ usuario: UsuarioOrg }>(`/api/convite/${token}`, json({ nome, senha }));

export interface Verificacao { codigo: string; titulo: string; tipo: string; emitidoEm: string; hash: string; responsavel: string; registro: string; organizacao: string }
export const verificarCodigo = async (codigo: string) => (await publico<{ verificacao: Verificacao }>(`/api/verificar/${encodeURIComponent(codigo)}`)).verificacao;

// ---------- autenticidade ----------
export interface Emissao { codigo: string; hash: string; emitidoEm: string }
export const emitirLaudo = async (laudoId: string) => (await api<{ emissao: Emissao }>(`/api/laudos/${laudoId}/emitir`, { method: 'POST' })).emissao;
export const urlVerificacao = (codigo: string) => `${location.origin}/verificar/${codigo}`;

// ---------- respostas do cliente ----------
export interface RespostaCliente { id: string; tipo: 'aceite' | 'comentario' | 'contestacao' | 'reparo' | 'aprovacao'; achadoId?: string; nome: string; documento?: string; texto?: string; criadoEm: string; lido: boolean }
export const respostasDoLaudo = async (id: string) => (await api<{ respostas: RespostaCliente[] }>(`/api/laudos/${id}/respostas`)).respostas;
export const responderLaudo = (token: string, r: { tipo: RespostaCliente['tipo']; nome: string; documento?: string; texto?: string; achadoId?: string; hashConteudo?: string }) =>
  publico<{ resposta: RespostaCliente }>(`/api/publico/${token}/respostas`, json(r));

/** Nome amigável das ações da auditoria. */
export const ACAO: Record<string, string> = {
  'laudo.emitido': 'emitiu um laudo', 'usuario.convidado': 'convidou alguém', 'usuario.alterado': 'mudou o papel ou o acesso de alguém',
  'usuario.entrou': 'entrou na equipe', 'laudo.equipe': 'mudou a equipe de um laudo', 'obra.equipe': 'mudou a equipe de uma obra',
  'organizacao.alterada': 'alterou os dados da organização', 'cliente.aceite': 'cliente aceitou um laudo', 'cliente.contestacao': 'cliente contestou um laudo',
  'cliente.comentario': 'cliente comentou', 'cliente.reparo': 'cliente pediu reparo', 'cliente.aprovacao': 'cliente aprovou',
};

// ---------- biblioteca de textos (do escritório) ----------
export interface TextoBiblioteca { id: string; tipo: string; sistema: string; gravidade: 'critico' | 'medio' | 'minimo'; descricao: string; causaProvavel: string; recomendacao: string; usos: number }
export const listarBiblioteca = async () => (await api<{ textos: TextoBiblioteca[] }>('/api/biblioteca')).textos;
export const salvarTexto = async (t: Omit<TextoBiblioteca, 'id' | 'usos'> & { id?: string; usos?: number }) =>
  (await api<{ texto: TextoBiblioteca }>('/api/biblioteca', json({ usos: 0, ...t }))).texto;
export const apagarTexto = (id: string) => api<void>(`/api/biblioteca/${id}`, { method: 'DELETE' });

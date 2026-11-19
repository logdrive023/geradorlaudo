import Dexie, { type EntityTable } from 'dexie';
import type { Configuracao, Foto, Laudo, ModeloTexto, Usuario } from '../dominio/modelo';

/** Prompt da IA editado pelo usuário (Ajustes › Prompts da IA). */
export interface PromptSalvo { chave: string; texto: string; atualizadoEm: number }

/**
 * Banco no próprio navegador (IndexedDB). Nada sai do aparelho.
 * As tabelas espelham o Postgres planejado em docs/ARQUITETURA.md.
 */
export const db = new Dexie('laudotech') as Dexie & {
  usuarios: EntityTable<Usuario, 'id'>;
  laudos: EntityTable<Laudo, 'id'>;
  fotos: EntityTable<Foto, 'id'>;
  config: EntityTable<Configuracao, 'chave'>;
  modelos: EntityTable<ModeloTexto, 'tipo'>;
  prompts: EntityTable<PromptSalvo, 'chave'>;
};

db.version(1).stores({
  usuarios: 'id, &email, papel',
  laudos: 'id, usuarioId, tipo, status, atualizadoEm',
  fotos: 'id, laudoId, [laudoId+ordem], status',
  config: 'chave',
});
db.version(2).stores({ modelos: 'tipo' });
db.version(3).stores({ prompts: 'chave' });
// v4: o admin de fábrica passa a entrar como admin@admin (com a senha nova)
db.version(4).stores({}).upgrade(async (tx) => {
  await tx.table('usuarios').where('id').equals('admin').modify((u: Usuario) => {
    if (u.email === 'admin') { u.email = 'admin@admin'; u.sal = ADMIN.sal; u.senhaHash = ADMIN.senhaHash; }
  });
});
// v5: o Google tirou o gemini-2.5-flash de contas novas; quem tinha salvo passa para o 3.8
db.version(5).stores({}).upgrade(async (tx) => {
  await tx.table('config').where('chave').equals('app').modify((c: Configuracao) => {
    if (!c.geminiModelo || c.geminiModelo.startsWith('gemini-2.5')) c.geminiModelo = 'gemini-3.8-flash';
  });
});
// v6: quem abriu o site publicado antes e ficou na demonstração passa a usar o servidor.
db.version(6).stores({}).upgrade(async (tx) => {
  if (!import.meta.env.PROD) return;
  await tx.table('config').where('chave').equals('app').modify((c: Configuracao) => {
    if (c.motorIA === 'demo') c.motorIA = 'servidor';
  });
});

/** Admin de fábrica (login admin@admin). A senha fica só como resumo com sal. */
const ADMIN: Usuario = {
  id: 'admin',
  email: 'admin@admin',
  nome: 'Administrador',
  papel: 'admin',
  sal: 'lt-admin-2b81e6d4',
  senhaHash: 'c8f1b2a4587cced31ff6faf710da5bba5ca0fb3ba24e5147988e3b15018fa71d',
  profissao: 'Engenheiro Civil',
  registro: '',
  telefone: '',
  endereco: '',
  cidade: '',
  uf: '',
  ativo: true,
  criadoEm: 0,
};

// No site publicado a IA de verdade (servidor LaudoTech + Gemini) já vem ligada; local fica a demonstração.
const MOTOR_PADRAO: Configuracao['motorIA'] = import.meta.env.PROD ? 'servidor' : 'demo';

const CONFIG_PADRAO: Configuracao = { chave: 'app', motorIA: MOTOR_PADRAO, apiKey: '', geminiKey: '', geminiModelo: 'gemini-3.8-flash', tema: 'claro' };

db.on('populate', (tx) => {
  void tx.table('usuarios').add(ADMIN);
  void tx.table('config').add(CONFIG_PADRAO);
});

export async function lerConfig(): Promise<Configuracao> {
  return { ...CONFIG_PADRAO, ...(await db.config.get('app')) };
}

export async function salvarConfig(parcial: Partial<Configuracao>) {
  const atual = await lerConfig();
  await db.config.put({ ...atual, ...parcial, chave: 'app' });
}

/** Fotos de um laudo, na ordem do relatório. */
export function fotosDoLaudo(laudoId: string) {
  return db.fotos.where('[laudoId+ordem]').between([laudoId, Dexie.minKey], [laudoId, Dexie.maxKey]).toArray();
}

export async function tocarLaudo(id: string, mudancas: Partial<Laudo> = {}) {
  await db.laudos.update(id, { ...mudancas, atualizadoEm: Date.now() });
}

export async function excluirLaudo(id: string) {
  await db.transaction('rw', db.laudos, db.fotos, async () => {
    await db.fotos.where('laudoId').equals(id).delete();
    await db.laudos.delete(id);
  });
}

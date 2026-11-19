import Dexie, { type EntityTable } from 'dexie';
import type { Configuracao, Foto, Laudo, ModeloTexto, Usuario } from '../dominio/modelo';

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
};

db.version(1).stores({
  usuarios: 'id, &email, papel',
  laudos: 'id, usuarioId, tipo, status, atualizadoEm',
  fotos: 'id, laudoId, [laudoId+ordem], status',
  config: 'chave',
});
db.version(2).stores({ modelos: 'tipo' });

/** Admin de fábrica (usuário "admin"). A senha fica só como resumo com sal. */
const ADMIN: Usuario = {
  id: 'admin',
  email: 'admin',
  nome: 'Administrador',
  papel: 'admin',
  sal: 'lt-admin-7f3a9c21',
  senhaHash: 'df228093c4007bf384831f9ede6861b50583232c9c4761858cfaf4dc3b988d75',
  profissao: 'Engenheiro Civil',
  registro: '',
  telefone: '',
  endereco: '',
  cidade: '',
  uf: '',
  ativo: true,
  criadoEm: 0,
};

const CONFIG_PADRAO: Configuracao = { chave: 'app', motorIA: 'demo', apiKey: '', tema: 'claro' };

db.on('populate', (tx) => {
  void tx.table('usuarios').add(ADMIN);
  void tx.table('config').add(CONFIG_PADRAO);
});

export async function lerConfig(): Promise<Configuracao> {
  return (await db.config.get('app')) ?? CONFIG_PADRAO;
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

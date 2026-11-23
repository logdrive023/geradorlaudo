import type { Transaction } from 'dexie';
import { db } from './db';
import type { Foto, Laudo, Papel, Usuario } from '../dominio/modelo';
import type { FotoObra, Obra } from '../dominio/obra';
import { SERVIDOR_PADRAO } from '../ia/servidor';
import { novoId, resumoSenha } from '../lib/util';

/**
 * Nuvem LaudoTech: login no servidor e cópia dos laudos no banco (Supabase).
 * O app continua rápido e funcionando offline com o IndexedDB; cada mudança é enviada em segundo plano
 * e, ao entrar, o que está no servidor desce para o aparelho.
 */

export const MAX_FOTOS_POR_LAUDO = 1000; // trava de segurança (o servidor também confere); o plano limita as fotos com IA do mês
// tamanho máximo das listas que o servidor devolve (backend: limit 5000 / 2000)
const LIMITE_LAUDOS = 5000;
const LIMITE_OBRAS = 2000;

const CHAVE_TOKEN = 'laudotech.token';
const base = () => SERVIDOR_PADRAO.replace(/\/$/, '');

export function lerToken(): string | null {
  try { return localStorage.getItem(CHAVE_TOKEN); } catch { return null; }
}
function gravarToken(t: string | null) {
  try { if (t) localStorage.setItem(CHAVE_TOKEN, t); else localStorage.removeItem(CHAVE_TOKEN); } catch { /* modo privado */ }
}

/** Avisos da nuvem para a tela (erro de envio, sessão vencida). */
export type EventoNuvem = { tipo: 'erro'; mensagem: string } | { tipo: 'sair' } | { tipo: 'estado'; pendentes: number; enviando: boolean };
const ouvintes = new Set<(e: EventoNuvem) => void>();
export function ouvirNuvem(fn: (e: EventoNuvem) => void) { ouvintes.add(fn); return () => { ouvintes.delete(fn); }; }
const emitir = (e: EventoNuvem) => ouvintes.forEach((fn) => fn(e));

class ErroServidor extends Error { constructor(public status: number, msg: string) { super(msg); } }

export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const t = lerToken();
  const r = await fetch(base() + caminho, { ...init, headers: { ...(init.headers ?? {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
  if (r.status === 401) {
    gravarToken(null);
    emitir({ tipo: 'sair' });
    throw new ErroServidor(401, 'Sua sessão terminou. Entre de novo.');
  }
  if (r.status === 204) return undefined as T;
  const tipo = r.headers.get('Content-Type') ?? '';
  if (!r.ok) {
    const corpo = tipo.includes('json') ? await r.json().catch(() => ({})) : {};
    throw new ErroServidor(r.status, (corpo as { erro?: string }).erro || `Servidor respondeu ${r.status}.`);
  }
  return (tipo.includes('json') ? r.json() : r.blob()) as Promise<T>;
}

// ---------- login ----------

interface UsuarioServidor { id: string; email: string; nome: string; papel: Papel; profissao: string; registro: string; telefone: string; endereco: string; cidade: string; uf: string; ativo: boolean }

/**
 * Tenta entrar pelo servidor. 'sem-servidor' = servidor fora do ar ou sem banco (o app entra só no aparelho).
 * Senha errada no servidor é erro de verdade (não cai para o login local).
 */
export async function entrarNuvem(email: string, senha: string): Promise<Usuario | 'sem-servidor'> {
  let r: Response;
  try {
    r = await fetch(base() + '/api/auth/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  } catch {
    return 'sem-servidor';
  }
  if (r.status === 503 || r.status === 404 || r.status >= 500) return 'sem-servidor';
  const corpo = await r.json().catch(() => ({})) as { token?: string; usuario?: UsuarioServidor; erro?: string };
  if (!r.ok || !corpo.token || !corpo.usuario) throw new Error(corpo.erro || 'E-mail ou senha não conferem.');
  gravarToken(corpo.token);
  return guardarUsuario(corpo.usuario, senha);
}

/** Usuário do servidor vira o usuário do aparelho; laudos de uma conta local com o mesmo e-mail passam para ele. */
/** `senha`: guarda o resumo (com sal) para entrar sem internet depois, como no login local. */
async function guardarUsuario(s: UsuarioServidor, senha: string): Promise<Usuario> {
  const sal = novoId();
  const senhaHash = await resumoSenha(sal, senha);
  const antigo = await db.usuarios.where('email').equals(s.email).first();
  const u: Usuario = {
    ...(antigo ?? { sal: '', senhaHash: '', telefone: '', endereco: '', cidade: '', uf: '', criadoEm: Date.now() }),
    id: s.id, email: s.email, nome: s.nome || antigo?.nome || s.email, papel: s.papel,
    profissao: s.profissao || antigo?.profissao || 'Engenheiro Civil', registro: s.registro || antigo?.registro || '', ativo: true,
    sal, senhaHash,
  };
  await db.transaction('rw', db.usuarios, db.laudos, async () => {
    if (antigo && antigo.id !== s.id) {
      await db.laudos.where('usuarioId').equals(antigo.id).modify({ usuarioId: s.id }); // vão para a nuvem também
      await db.usuarios.delete(antigo.id);
    }
    await db.usuarios.put(u);
  });
  return u;
}

export async function sairNuvem() {
  if (!lerToken()) return;
  try { await api('/api/auth/sair', { method: 'POST' }); } catch { /* sem rede: o token vence sozinho */ }
  gravarToken(null);
}

// ---------- laudos que o servidor já conhece ----------
// Sumiu do servidor e está nesta lista = foi apagado lá: some do aparelho também (o banco manda).
// Fora da lista = criado aqui e ainda não enviado: sobe.
const CHAVE_CONHECIDOS = 'laudotech.nuvem.laudos';
function lerConhecidos(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CHAVE_CONHECIDOS) || '[]') as string[]); } catch { return new Set(); }
}
function gravarConhecidos(ids: Set<string>) {
  try { localStorage.setItem(CHAVE_CONHECIDOS, JSON.stringify([...ids])); } catch { /* modo privado */ }
}
const conhecer = (id: string) => { const c = lerConhecidos(); if (!c.has(id)) { c.add(id); gravarConhecidos(c); } };
const esquecer = (id: string) => { const c = lerConhecidos(); if (c.delete(id)) gravarConhecidos(c); };

// ---------- envio (o que mudou no aparelho sobe) ----------

// Filas de envio guardadas no aparelho: fechar o app (ou ficar sem rede) não perde o que ainda não subiu.
class FilaSet extends Set<string> {
  private chave = '';
  constructor(chave: string) {
    super();
    this.chave = chave;
    try { for (const v of JSON.parse(localStorage.getItem(chave) ?? '[]') as string[]) super.add(v); } catch { /* vazia */ }
  }
  private gravar() { if (this.chave) try { localStorage.setItem(this.chave, JSON.stringify([...this])); } catch { /* modo privado */ } }
  add(v: string) { super.add(v); this.gravar(); return this; }
  delete(v: string) { const r = super.delete(v); this.gravar(); return r; }
  clear() { super.clear(); this.gravar(); }
}
class FilaMap extends Map<string, string> {
  private chave = '';
  constructor(chave: string) {
    super();
    this.chave = chave;
    try { for (const [k, v] of JSON.parse(localStorage.getItem(chave) ?? '[]') as [string, string][]) super.set(k, v); } catch { /* vazia */ }
  }
  private gravar() { if (this.chave) try { localStorage.setItem(this.chave, JSON.stringify([...this])); } catch { /* modo privado */ } }
  set(k: string, v: string) { super.set(k, v); this.gravar(); return this; }
  delete(k: string) { const r = super.delete(k); this.gravar(); return r; }
  clear() { super.clear(); this.gravar(); }
}
const laudosPend = new FilaSet('laudotech.fila.laudos');
const laudosDel = new FilaSet('laudotech.fila.laudos-apagar');
const fotosPend = new FilaSet('laudotech.fila.fotos');
const fotosDel = new FilaMap('laudotech.fila.fotos-apagar'); // foto → laudo
let timer: ReturnType<typeof setTimeout> | undefined;
let enviando = false;

/** Gravações feitas pela própria sincronização não voltam para o servidor. */
const DA_NUVEM = Symbol('nuvem');
const daNuvem = (tx?: Transaction) => !!(tx as unknown as Record<symbol, boolean> | undefined)?.[DA_NUVEM];

function agendar(ms = 1200) {
  if (!lerToken()) return;
  clearTimeout(timer);
  timer = setTimeout(() => { void enviar(); }, ms);
  emitirEstado();
}
const emitirEstado = () => emitir({ tipo: 'estado', pendentes: laudosPend.size + laudosDel.size + fotosPend.size + fotosDel.size, enviando });

db.laudos.hook('creating', (_pk, l, tx) => { if (!daNuvem(tx)) { laudosPend.add(l.id); agendar(); } });
db.laudos.hook('updating', (_m, pk, _l, tx) => { if (!daNuvem(tx)) { laudosPend.add(pk as string); agendar(); } });
db.laudos.hook('deleting', (pk, _l, tx) => { if (!daNuvem(tx)) { laudosPend.delete(pk as string); laudosDel.add(pk as string); agendar(); } });
db.fotos.hook('creating', (_pk, f, tx) => { if (!daNuvem(tx)) { fotosPend.add(f.id); agendar(); } });
db.fotos.hook('updating', (_m, pk, _f, tx) => { if (!daNuvem(tx)) { fotosPend.add(pk as string); agendar(); } });
db.fotos.hook('deleting', (pk, f, tx) => { if (!daNuvem(tx)) { fotosPend.delete(pk as string); fotosDel.set(pk as string, f.laudoId); agendar(); } });

const registroLaudo = (l: Laudo) => ({
  tipo: l.tipo, titulo: l.titulo, status: l.status, dados: l.dados, conclusao: l.conclusao, textos: l.textos,
  criadoEm: l.criadoEm, atualizadoEm: l.atualizadoEm, versao: l.versao ?? 0,
});

/** Guarda a versão que o servidor deu, sem marcar o registro para subir de novo. */
async function guardarVersao(tabela: 'laudos' | 'obras', id: string, versao: number) {
  await db.transaction('rw', db[tabela], async (tx) => {
    (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true;
    await db[tabela].update(id, { versao });
  });
}

/**
 * Outra pessoa salvou este laudo antes (412). Nada se perde: o que estava aqui vira uma cópia
 * "(sua versão)", com as fotos, e o laudo original recebe a versão do servidor.
 */
async function conflitoLaudo(l: Laudo) {
  const id = novoId();
  const fotos = await db.fotos.where('laudoId').equals(l.id).toArray();
  const pendentes = fotos.filter((f) => fotosPend.has(f.id)).map((f) => f.id);
  pendentes.forEach((fid) => fotosPend.delete(fid)); // as fotos do original seguem a versão do servidor
  try {
    await baixarLaudo(l.id, l.usuarioId); // primeiro a versão do servidor: se a rede cair, tenta de novo sem duplicar a cópia
  } catch (e) {
    pendentes.forEach((fid) => fotosPend.add(fid));
    throw e;
  }
  await db.transaction('rw', db.laudos, db.fotos, async () => {
    await db.laudos.add({ ...l, id, titulo: `${l.titulo} (sua versão)`, versao: 0, criadoEm: Date.now(), atualizadoEm: Date.now() });
    await db.fotos.bulkAdd(fotos.map((f) => ({ ...f, id: novoId(), laudoId: id })));
  });
  emitir({ tipo: 'erro', mensagem: `"${l.titulo}" foi alterado em outro aparelho. Trouxemos a versão mais nova e guardamos a sua como "${l.titulo} (sua versão)".` });
}
const conflito = (e: unknown) => e instanceof ErroServidor && e.status === 412;
const registroFoto = (f: Foto) => ({
  ordem: f.ordem, nomeArquivo: f.nomeArquivo, largura: f.largura, altura: f.altura, tiradaEm: f.tiradaEm, gps: f.gps,
  status: f.status, analise: f.analise, observacao: f.observacao, erro: f.erro, criadoEm: f.criadoEm,
});

async function enviarFoto(f: Foto) {
  const montar = (comImagem: boolean) => {
    const d = new FormData();
    d.append('foto', JSON.stringify(registroFoto(f)));
    if (comImagem) { d.append('imagem', f.imagem, 'imagem'); d.append('miniatura', f.miniatura, 'miniatura'); }
    return d;
  };
  const caminho = `/api/laudos/${f.laudoId}/fotos/${f.id}`;
  try {
    await api(caminho, { method: 'PUT', body: montar(false) });
  } catch (e) {
    if (!(e instanceof ErroServidor) || e.status !== 428) throw e;
    await api(caminho, { method: 'PUT', body: montar(true) }); // foto nova: manda a imagem uma vez só
  }
}

async function enviar() {
  if (enviando) { agendar(); return; }
  if (!lerToken()) return;
  enviando = true;
  emitirEstado();
  let falhou = false;
  const passo = async (fn: () => Promise<void>, devolver: () => void) => {
    try { await fn(); } catch (e) {
      if (e instanceof ErroServidor && e.status === 401) throw e;
      if (e instanceof ErroServidor && (e.status === 409 || e.status === 400 || e.status === 403 || e.status === 404)) {
        emitir({ tipo: 'erro', mensagem: e.message }); // recusado de vez: não insiste
      } else { devolver(); falhou = true; }
    }
  };
  try {
    for (const id of [...laudosDel]) {
      laudosDel.delete(id);
      await passo(async () => { await api(`/api/laudos/${id}`, { method: 'DELETE' }); esquecer(id); }, () => laudosDel.add(id));
    }
    for (const [id, lid] of [...fotosDel]) {
      fotosDel.delete(id);
      if (laudosDel.has(lid)) continue;
      await passo(() => api(`/api/laudos/${lid}/fotos/${id}`, { method: 'DELETE' }), () => fotosDel.set(id, lid));
    }
    for (const id of [...laudosPend]) {
      laudosPend.delete(id);
      const l = await db.laudos.get(id);
      if (!l) continue;
      await passo(async () => {
        try {
          const r = await api<{ versao?: number }>(`/api/laudos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registroLaudo(l)) });
          if (r?.versao) await guardarVersao('laudos', id, r.versao);
        } catch (e) {
          if (!conflito(e)) throw e;
          await conflitoLaudo(l);
        }
        conhecer(id);
      }, () => laudosPend.add(id));
    }
    for (const id of [...fotosPend]) {
      const f = await db.fotos.get(id);
      fotosPend.delete(id);
      if (!f) continue;
      if (laudosPend.has(f.laudoId)) { fotosPend.add(id); continue; } // o laudo ainda não subiu
      await passo(() => enviarFoto(f), () => fotosPend.add(id));
    }
    await enviarObras(passo);
  } catch { /* 401: sessão encerrada */ } finally {
    enviando = false;
    emitirEstado();
    if (falhou) agendar(15000); // sem rede ou servidor dormindo: tenta de novo
  }
}

// ---------- download (o que está no servidor desce) ----------

interface RegistroLaudo extends Omit<Laudo, 'usuarioId' | 'logo' | 'imagemLocalizacao'> { usuarioId: string; fotos: number }
type RegistroFoto = Omit<Foto, 'imagem' | 'miniatura'>;

async function baixarLaudo(id: string, usuarioId: string) {
  const { laudo: s, fotos } = await api<{ laudo: RegistroLaudo; fotos: RegistroFoto[] }>(`/api/laudos/${id}`);
  const local = await db.laudos.get(id);
  const locais = new Map((await db.fotos.where('laudoId').equals(id).toArray()).map((f) => [f.id, f]));
  const novas: Foto[] = [];
  for (const sf of fotos) {
    const loc = locais.get(sf.id);
    if (loc && fotosPend.has(sf.id)) { novas.push(loc); continue; } // editada aqui e ainda não subiu: fica a daqui
    if (loc) { novas.push({ ...loc, ...sf, laudoId: id }); continue; }
    const [imagem, miniatura] = await Promise.all([
      api<Blob>(`/api/laudos/${id}/fotos/${sf.id}/arquivo`),
      api<Blob>(`/api/laudos/${id}/fotos/${sf.id}/arquivo?tam=mini`),
    ]);
    novas.push({ ...sf, laudoId: id, imagem, miniatura });
  }
  const noServidor = new Set(fotos.map((f) => f.id));
  await db.transaction('rw', db.laudos, db.fotos, async (tx) => {
    (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true;
    const { fotos: _n, ...campos } = s;
    await db.laudos.put({ ...(local ?? {}), ...campos, usuarioId: local?.usuarioId ?? usuarioId } as Laudo);
    const sobrando = [...locais.keys()].filter((fid) => !noServidor.has(fid) && !fotosPend.has(fid));
    if (sobrando.length) await db.fotos.bulkDelete(sobrando);
    await db.fotos.bulkPut(novas);
  });
  conhecer(id);
}

let sincronizando: Promise<void> | null = null;

/** Ao entrar (e ao abrir o app logado): baixa o que é mais novo no servidor e sobe o que só existe aqui. */
export function sincronizar(usuarioId: string): Promise<void> {
  if (!lerToken()) return Promise.resolve();
  sincronizando ??= (async () => {
    try {
      // fotos que a demonstração "analisou" voltam para a fila: com login, quem analisa é o Gemini do servidor
      await db.fotos.filter((f) => f.analise?.origem === 'demo' && f.status === 'analisada').modify({ status: 'pendente' });
      const { laudos } = await api<{ laudos: RegistroLaudo[] }>('/api/laudos');
      const locais = new Map((await db.laudos.toArray()).map((l) => [l.id, l]));
      for (const s of laudos) {
        const l = locais.get(s.id);
        if (l && laudosPend.has(s.id)) continue; // edição local ainda não subiu: não sobrescreve
        // o aparelho tem a versão mais nova (mesma versão do servidor e editado depois): sobe. Com versão diferente, desce.
        if (l && l.atualizadoEm > s.atualizadoEm && (!s.versao || (l.versao ?? 0) === s.versao)) { laudosPend.add(s.id); continue; }
        if (!l || l.atualizadoEm < s.atualizadoEm || (s.versao && (l.versao ?? 0) !== s.versao)) {
          try { await baixarLaudo(s.id, usuarioId); } catch (e) { if (e instanceof ErroServidor && e.status === 401) throw e; }
        }
      }
      const noServidor = new Set(laudos.map((l) => l.id));
      // 1ª vez nesta versão: a versão anterior já enviava tudo de quem estava logado, então tudo aqui já foi ao servidor
      let primeiraVez = false;
      try { primeiraVez = localStorage.getItem(CHAVE_CONHECIDOS) === null; } catch { /* modo privado */ }
      const conhecidos = primeiraVez ? new Set(locais.keys()) : lerConhecidos();
      const apagadosLa: string[] = [];
      const listaCheia = laudos.length >= LIMITE_LAUDOS; // lista cortada: não dá para saber o que foi apagado
      for (const l of locais.values()) {
        if (noServidor.has(l.id) || l.usuarioId !== usuarioId) continue;
        if (listaCheia && conhecidos.has(l.id)) continue;
        if (!primeiraVez && conhecidos.has(l.id)) { apagadosLa.push(l.id); continue; } // apagado no servidor: não volta
        laudosPend.add(l.id);
        (await db.fotos.where('laudoId').equals(l.id).primaryKeys()).forEach((fid) => fotosPend.add(fid as string));
      }
      if (apagadosLa.length) {
        await db.transaction('rw', db.laudos, db.fotos, async (tx) => {
          (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true; // apagar aqui não manda nada ao servidor
          await db.fotos.where('laudoId').anyOf(apagadosLa).delete();
          await db.laudos.bulkDelete(apagadosLa);
        });
        apagadosLa.forEach((id) => { esquecer(id); laudosPend.delete(id); });
      }
      laudos.forEach((l) => conhecer(l.id));
      // grava a lista mesmo vazia: sem ela, a próxima sincronização acha que é a 1ª vez e apaga laudo novo que ainda não subiu
      gravarConhecidos(lerConhecidos());
      try { await sincronizarObras(usuarioId); } catch (e) { if (e instanceof ErroServidor && e.status === 401) throw e; }
      agendar(300);
    } catch (e) {
      if (!(e instanceof ErroServidor && e.status === 401)) emitir({ tipo: 'erro', mensagem: 'Não deu para sincronizar com o servidor agora. Seus laudos continuam salvos aqui.' });
    } finally { sincronizando = null; }
  })();
  return sincronizando;
}

// ---------- link do cliente (só leitura) ----------

export const logadoNaNuvem = () => !!lerToken();

/** Cria (ou devolve) o link do laudo para o cliente. Antes, garante que o laudo e as fotos já subiram. */
export async function criarLinkCliente(laudoId: string): Promise<string> {
  if (!lerToken()) throw new Error('Entre com sua conta para gerar o link (o laudo precisa estar salvo no servidor).');
  await enviar();
  const { token } = await api<{ token: string }>(`/api/laudos/${laudoId}/link`, { method: 'POST' });
  return `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/ver/${token}`;
}

export async function desligarLinkCliente(laudoId: string) {
  await api(`/api/laudos/${laudoId}/link`, { method: 'DELETE' });
}

export interface LaudoPublico {
  laudo: Omit<Laudo, 'usuarioId' | 'logo' | 'imagemLocalizacao'>;
  fotos: Foto[];
  autor: Pick<Usuario, 'nome' | 'profissao' | 'registro' | 'telefone' | 'cidade' | 'uf'>;
}

/** Lê o laudo pelo link (sem login) e baixa as imagens. */
export async function abrirLaudoPublico(token: string): Promise<LaudoPublico> {
  const pedir = async (caminho: string) => {
    const r = await fetch(base() + caminho);
    if (!r.ok) {
      const corpo = await r.json().catch(() => ({})) as { erro?: string };
      throw new Error(corpo.erro || 'Não deu para abrir este laudo agora.');
    }
    return r;
  };
  const d = await (await pedir(`/api/publico/${encodeURIComponent(token)}`)).json() as { laudo: LaudoPublico['laudo']; fotos: RegistroFoto[]; autor: LaudoPublico['autor'] };
  const fotos = await Promise.all(d.fotos.map(async (f) => {
    const [imagem, miniatura] = await Promise.all([
      pedir(`/api/publico/${encodeURIComponent(token)}/fotos/${f.id}`).then((r) => r.blob()),
      pedir(`/api/publico/${encodeURIComponent(token)}/fotos/${f.id}?tam=mini`).then((r) => r.blob()),
    ]);
    return { ...f, imagem, miniatura } as Foto;
  }));
  return { laudo: d.laudo, fotos, autor: d.autor };
}

// ================= gestão de obras (mesmo padrão dos laudos) =================

const obrasPend = new FilaSet('laudotech.fila.obras');
const obrasDel = new FilaSet('laudotech.fila.obras-apagar');
const fotosObraPend = new FilaMap('laudotech.fila.fotos-obra'); // foto → obra
const fotosObraDel = new FilaMap('laudotech.fila.fotos-obra-apagar');
const CHAVE_OBRAS = 'laudotech.nuvem.obras';
const lerObrasConhecidas = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(CHAVE_OBRAS) || '[]') as string[]); } catch { return new Set(); } };
const gravarObrasConhecidas = (c: Set<string>) => { try { localStorage.setItem(CHAVE_OBRAS, JSON.stringify([...c])); } catch { /* modo privado */ } };
const conhecerObra = (id: string) => { const c = lerObrasConhecidas(); if (!c.has(id)) { c.add(id); gravarObrasConhecidas(c); } };
const esquecerObra = (id: string) => { const c = lerObrasConhecidas(); if (c.delete(id)) gravarObrasConhecidas(c); };

db.obras.hook('creating', (_pk, o, tx) => { if (!daNuvem(tx)) { obrasPend.add(o.id); agendar(); } });
db.obras.hook('updating', (_m, pk, _o, tx) => { if (!daNuvem(tx)) { obrasPend.add(pk as string); agendar(2000); } });
db.obras.hook('deleting', (pk, _o, tx) => { if (!daNuvem(tx)) { obrasPend.delete(pk as string); obrasDel.add(pk as string); agendar(); } });
db.obraFotos.hook('creating', (_pk, f, tx) => { if (!daNuvem(tx)) { fotosObraPend.set(f.id, f.obraId); agendar(); } });
db.obraFotos.hook('deleting', (pk, f, tx) => { if (!daNuvem(tx)) { fotosObraPend.delete(pk as string); fotosObraDel.set(pk as string, f.obraId); agendar(); } });

/** A obra trafega como {id, nome, status, dados}; "dados" é o resto do documento. */
function registroObra(o: Obra) {
  const { id, nome, status, usuarioId: _u, criadoEm, atualizadoEm, versao, ...dados } = o;
  return { id, nome, status, dados, criadoEm, atualizadoEm, versao: versao ?? 0 };
}

/** Junta a obra do servidor com a daqui: vale o servidor; entram itens que só existem aqui. */
function juntarObra(s: Obra, o: Obra): Obra {
  return {
    ...VAZIA, ...o, ...s, usuarioId: o.usuarioId,
    etapas: juntarPorId(s.etapas, o.etapas), diarios: juntarPorId(s.diarios, o.diarios),
    lancamentos: juntarPorId(s.lancamentos, o.lancamentos), compras: juntarPorId(s.compras, o.compras),
    laudoIds: [...new Set([...(s.laudoIds ?? []), ...(o.laudoIds ?? [])])],
    atualizadoEm: Math.max(Date.now(), s.atualizadoEm + 1, o.atualizadoEm + 1), versao: s.versao,
  };
}

/** Baixa as fotos do diário que a obra cita e ainda não estão no aparelho. */
async function fotosQueFaltam(o: Obra): Promise<FotoObra[]> {
  const ids = (o.diarios ?? []).flatMap((d) => d.fotoIds ?? []);
  const tem = new Set((await db.obraFotos.where('obraId').equals(o.id).primaryKeys()) as string[]);
  const novas: FotoObra[] = [];
  for (const fid of ids.filter((x) => !tem.has(x))) {
    try {
      const [imagem, miniatura] = await Promise.all([api<Blob>(`/api/obras/${o.id}/fotos/${fid}`), api<Blob>(`/api/obras/${o.id}/fotos/${fid}?tam=mini`)]);
      novas.push({ id: fid, obraId: o.id, imagem, miniatura, criadoEm: Date.now() });
    } catch (e) { if (e instanceof ErroServidor && e.status === 401) throw e; }
  }
  return novas;
}

/** Junta listas pelo id: fica o que está no servidor e entra o que só existe aqui. */
function juntarPorId<T extends { id: string }>(servidor: T[] = [], local: T[] = []): T[] {
  const ids = new Set(servidor.map((x) => x.id));
  return [...servidor, ...local.filter((x) => !ids.has(x.id))];
}

/**
 * Outra pessoa salvou esta obra antes (412). Junta as duas: vale o que está no servidor e entram
 * as etapas, diários, lançamentos e compras que só existem aqui. Depois sobe a obra juntada.
 */
async function conflitoObra(o: Obra) {
  const { obras } = await api<{ obras: RegistroObraServidor[] }>('/api/obras');
  const s = obras.find((x) => x.id === o.id);
  if (!s) throw new ErroServidor(404, 'Esta obra não está mais no servidor.');
  const servidor: Obra = { ...VAZIA, ...(s.dados as Partial<Obra>), id: s.id, nome: s.nome, status: s.status, usuarioId: o.usuarioId, criadoEm: s.criadoEm, atualizadoEm: s.atualizadoEm, versao: s.versao };
  const junta = juntarObra(servidor, o);
  const r = await api<{ versao?: number }>(`/api/obras/${o.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registroObra(junta)) });
  const novas = await fotosQueFaltam(junta); // fotos do diário que vieram da outra pessoa
  const versao = r?.versao ?? s.versao;
  // se a obra foi mexida aqui enquanto juntava, junta de novo e deixa subir (sem perder a edição nem o que veio do servidor)
  const agora = await db.obras.get(o.id);
  const mexida = !!agora && agora.atualizadoEm !== o.atualizadoEm;
  await db.transaction('rw', db.obras, db.obraFotos, async (tx) => {
    (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true;
    await db.obras.put({ ...junta, versao });
    if (novas.length) await db.obraFotos.bulkPut(novas);
  });
  if (mexida && agora) await db.obras.put(juntarObra({ ...junta, versao }, agora)); // passa pelo gancho: vai para a fila
  emitir({ tipo: 'erro', mensagem: `A obra "${s.nome}" foi alterada em outro aparelho. Juntamos as duas versões: confira.` });
}

type Passo = (fn: () => Promise<void>, devolver: () => void) => Promise<void>;
async function enviarObras(passo: Passo) {
  for (const id of [...obrasDel]) {
    obrasDel.delete(id);
    await passo(async () => { await api(`/api/obras/${id}`, { method: 'DELETE' }); esquecerObra(id); }, () => obrasDel.add(id));
  }
  for (const [id, oid] of [...fotosObraDel]) {
    fotosObraDel.delete(id);
    if (obrasDel.has(oid)) continue;
    await passo(() => api(`/api/obras/${oid}/fotos/${id}`, { method: 'DELETE' }), () => fotosObraDel.set(id, oid));
  }
  for (const id of [...obrasPend]) {
    obrasPend.delete(id);
    const o = await db.obras.get(id);
    if (!o) continue;
    await passo(async () => {
      try {
        const r = await api<{ versao?: number }>(`/api/obras/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registroObra(o)) });
        if (r?.versao) await guardarVersao('obras', id, r.versao);
      } catch (e) {
        if (!conflito(e)) throw e;
        await conflitoObra(o);
      }
      conhecerObra(id);
    }, () => obrasPend.add(id));
  }
  for (const [id, oid] of [...fotosObraPend]) {
    fotosObraPend.delete(id);
    if (obrasPend.has(oid)) { fotosObraPend.set(id, oid); continue; } // a obra ainda não subiu
    const f = await db.obraFotos.get(id);
    if (!f) continue;
    await passo(async () => {
      const d = new FormData();
      d.append('imagem', f.imagem, 'imagem');
      d.append('miniatura', f.miniatura, 'miniatura');
      await api(`/api/obras/${oid}/fotos/${id}`, { method: 'PUT', body: d });
    }, () => fotosObraPend.set(id, oid));
  }
}

interface RegistroObraServidor { id: string; nome: string; status: Obra['status']; dados: Omit<Obra, 'id' | 'nome' | 'status' | 'usuarioId' | 'criadoEm' | 'atualizadoEm' | 'versao'>; criadoEm: number; atualizadoEm: number; versao?: number }

const VAZIA = { endereco: '', cliente: '', etapas: [], diarios: [], lancamentos: [], compras: [], laudoIds: [] };

async function sincronizarObras(usuarioId: string) {
  const { obras } = await api<{ obras: RegistroObraServidor[] }>('/api/obras');
  const locais = new Map((await db.obras.toArray()).map((o) => [o.id, o]));
  for (const s of obras) {
    const l = locais.get(s.id);
    if (l && obrasPend.has(s.id)) continue; // edição local ainda não subiu: não sobrescreve
    if (l && l.atualizadoEm > s.atualizadoEm && (!s.versao || (l.versao ?? 0) === s.versao)) { obrasPend.add(s.id); continue; } // o aparelho tem a versão mais nova: sobe
    if (l && l.atualizadoEm >= s.atualizadoEm && !(s.versao && (l.versao ?? 0) !== s.versao)) continue;
    const o: Obra = { ...VAZIA, ...s.dados, id: s.id, nome: s.nome, status: s.status, usuarioId: l?.usuarioId ?? usuarioId, criadoEm: s.criadoEm, atualizadoEm: s.atualizadoEm, versao: s.versao };
    const novas = await fotosQueFaltam(o); // fotos do diário que ainda não estão no aparelho
    await db.transaction('rw', db.obras, db.obraFotos, async (tx) => {
      (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true;
      await db.obras.put(o);
      if (novas.length) await db.obraFotos.bulkPut(novas);
    });
  }
  const noServidor = new Set(obras.map((o) => o.id));
  let primeira = false;
  try { primeira = localStorage.getItem(CHAVE_OBRAS) === null; } catch { /* modo privado */ }
  const conhecidas = lerObrasConhecidas();
  const apagadas: string[] = [];
  const obrasCheia = obras.length >= LIMITE_OBRAS; // lista cortada: não dá para saber o que foi apagado
  for (const o of locais.values()) {
    if (noServidor.has(o.id) || o.usuarioId !== usuarioId) continue;
    if (obrasCheia && conhecidas.has(o.id)) continue;
    if (!primeira && conhecidas.has(o.id)) { apagadas.push(o.id); continue; } // apagada no servidor: não volta
    obrasPend.add(o.id);
    (await db.obraFotos.where('obraId').equals(o.id).primaryKeys()).forEach((fid) => fotosObraPend.set(fid as string, o.id));
  }
  if (apagadas.length) {
    await db.transaction('rw', db.obras, db.obraFotos, async (tx) => {
      (tx as unknown as Record<symbol, boolean>)[DA_NUVEM] = true;
      await db.obraFotos.where('obraId').anyOf(apagadas).delete();
      await db.obras.bulkDelete(apagadas);
    });
    apagadas.forEach((id) => { esquecerObra(id); obrasPend.delete(id); });
  }
  obras.forEach((o) => conhecerObra(o.id));
  if (primeira) gravarObrasConhecidas(lerObrasConhecidas());
}

// ---------- link do cliente da obra ----------

export async function criarLinkObra(obraId: string, financeiro: boolean): Promise<string> {
  if (!lerToken()) throw new Error('Entre com sua conta para gerar o link (a obra precisa estar salva no servidor).');
  await enviar();
  const { token } = await api<{ token: string }>(`/api/obras/${obraId}/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ financeiro }) });
  return `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/acompanhar/${token}`;
}

export async function desligarLinkObra(obraId: string) {
  await api(`/api/obras/${obraId}/link`, { method: 'DELETE' });
}

export interface ObraPublica { obra: Obra; financeiro: boolean; fotos: Map<string, Blob>; autor: LaudoPublico['autor'] }

/** Abre a obra pelo link (sem login): documento sem o que é privado e as miniaturas do diário. */
export async function abrirObraPublica(token: string): Promise<ObraPublica> {
  const r = await fetch(`${base()}/api/publico/obra/${encodeURIComponent(token)}`);
  if (!r.ok) {
    const corpo = await r.json().catch(() => ({})) as { erro?: string };
    throw new Error(corpo.erro || 'Não deu para abrir esta obra agora.');
  }
  const d = await r.json() as { obra: RegistroObraServidor; financeiro: boolean; fotos: string[]; autor: LaudoPublico['autor'] };
  const o: Obra = { ...VAZIA, ...d.obra.dados, id: d.obra.id, nome: d.obra.nome, status: d.obra.status, usuarioId: '', criadoEm: d.obra.criadoEm, atualizadoEm: d.obra.atualizadoEm };
  const fotos = new Map<string, Blob>();
  await Promise.all(d.fotos.map(async (fid) => {
    const x = await fetch(`${base()}/api/publico/obra/${encodeURIComponent(token)}/fotos/${fid}?tam=mini`);
    if (x.ok) fotos.set(fid, await x.blob());
  }));
  return { obra: o, financeiro: d.financeiro, fotos, autor: d.autor };
}

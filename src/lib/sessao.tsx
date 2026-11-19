import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Usuario } from '../dominio/modelo';
import { novoId, resumoSenha } from './util';

const CHAVE = 'laudotech.sessao';

function lerSessao(): string | null {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}
function gravarSessao(id: string | null) {
  try { if (id) localStorage.setItem(CHAVE, id); else localStorage.removeItem(CHAVE); } catch { /* modo privado */ }
}

interface Ctx {
  usuario: Usuario | null | undefined; // undefined = carregando
  entrar: (login: string, senha: string) => Promise<void>;
  cadastrar: (d: { nome: string; email: string; senha: string; profissao: string; registro: string }) => Promise<void>;
  sair: () => void;
}

const SessaoCtx = createContext<Ctx>(null!);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(lerSessao);
  // o resultado vem marcado com o id consultado: evita usar a resposta antiga logo depois de entrar
  const r = useLiveQuery(async () => ({ id, u: id ? (await db.usuarios.get(id)) ?? null : null }), [id]);
  const usuario = !r || r.id !== id ? undefined : r.u;

  // conta apagada ou desativada: encerra a sessão
  useEffect(() => { if (id && r?.id === id && (!r.u || !r.u.ativo)) { gravarSessao(null); setId(null); } }, [r, id]);

  const entrar = async (login: string, senha: string) => {
    const l = login.trim().toLowerCase();
    const u = await db.usuarios.where('email').equals(l).first();
    if (!u || (await resumoSenha(u.sal, senha)) !== u.senhaHash) throw new Error('Usuário ou senha não conferem.');
    if (!u.ativo) throw new Error('Esta conta está desativada. Fale com o administrador.');
    gravarSessao(u.id); setId(u.id);
  };

  const cadastrar: Ctx['cadastrar'] = async (d) => {
    const email = d.email.trim().toLowerCase();
    if (!email || !d.senha || !d.nome.trim()) throw new Error('Preencha nome, e-mail e senha.');
    if (d.senha.length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
    if (await db.usuarios.where('email').equals(email).count()) throw new Error('Já existe uma conta com esse e-mail neste aparelho.');
    const sal = novoId();
    const u: Usuario = {
      id: novoId(), email, nome: d.nome.trim(), papel: 'engenheiro', sal, senhaHash: await resumoSenha(sal, d.senha),
      profissao: d.profissao || 'Engenheiro Civil', registro: d.registro, telefone: '', endereco: '', cidade: '', uf: '',
      ativo: true, criadoEm: Date.now(),
    };
    await db.usuarios.add(u);
    gravarSessao(u.id); setId(u.id);
  };

  const sair = () => { gravarSessao(null); setId(null); };

  return <SessaoCtx.Provider value={{ usuario: id ? usuario : null, entrar, cadastrar, sair }}>{children}</SessaoCtx.Provider>;
}

export const useSessao = () => useContext(SessaoCtx);

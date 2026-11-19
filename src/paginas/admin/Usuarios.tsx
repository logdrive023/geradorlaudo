import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { KeyRound, Shield, UserPlus } from 'lucide-react';
import { db } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { Botao, Campo, Cartao, Entrada, Modal, Selo, useAviso } from '../../componentes/ui';
import { cx, novoId, resumoSenha } from '../../lib/util';
import type { Papel, Usuario } from '../../dominio/modelo';

/** Só o admin vê: contas deste navegador, papéis, ativar/desativar e redefinir senha. */
export function Usuarios() {
  const { usuario: eu } = useSessao();
  const { avisar, el } = useAviso();
  const dados = useLiveQuery(async () => {
    const us = await db.usuarios.orderBy('email').toArray();
    const laudos = await db.laudos.toArray();
    const cont = new Map<string, number>();
    for (const l of laudos) cont.set(l.usuarioId, (cont.get(l.usuarioId) ?? 0) + 1);
    return { us, cont };
  });
  const [senhaDe, setSenhaDe] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [criar, setCriar] = useState(false);
  const [nf, setNf] = useState({ nome: '', email: '', senha: '', papel: 'engenheiro' as Papel });
  const [erro, setErro] = useState('');

  if (!dados || !eu) return null;

  const definirSenha = async () => {
    if (!senhaDe || novaSenha.length < 6) return;
    const sal = novoId();
    await db.usuarios.update(senhaDe.id, { sal, senhaHash: await resumoSenha(sal, novaSenha) });
    setSenhaDe(null); setNovaSenha(''); avisar('Senha redefinida');
  };
  const criarUsuario = async () => {
    setErro('');
    const email = nf.email.trim().toLowerCase();
    if (!nf.nome.trim() || !email || nf.senha.length < 6) return setErro('Preencha nome, e-mail e uma senha com 6+ caracteres.');
    if (await db.usuarios.where('email').equals(email).count()) return setErro('Já existe uma conta com esse e-mail.');
    const sal = novoId();
    await db.usuarios.add({ id: novoId(), email, nome: nf.nome.trim(), papel: nf.papel, sal, senhaHash: await resumoSenha(sal, nf.senha), profissao: 'Engenheiro Civil', registro: '', telefone: '', endereco: '', cidade: '', uf: '', ativo: true, criadoEm: Date.now() });
    setCriar(false); setNf({ nome: '', email: '', senha: '', papel: 'engenheiro' }); avisar('Usuário criado');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-bold text-texto3">Administração</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl"><span className="grifo">Usuários</span></h1>
        </div>
        <Botao variante="obra" onClick={() => setCriar(true)}><UserPlus className="size-4" />Novo usuário</Botao>
      </div>
      <p className="mt-2 text-texto2">Contas criadas neste navegador. Como admin você vê e edita os laudos de todos.</p>

      <div className="mt-5 grid gap-3">
        {dados.us.map((u) => (
          <Cartao key={u.id} className={cx('flex flex-wrap items-center gap-3 p-4', !u.ativo && 'opacity-60')}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tinta font-extrabold text-white dark:text-[#0E1320]">{u.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><b className="truncate">{u.nome}</b>{u.papel === 'admin' && <Selo tom="obra"><Shield className="size-3" />Admin</Selo>}{!u.ativo && <Selo tom="critico">Desativado</Selo>}</div>
              <div className="truncate text-sm text-texto3">{u.email} · {dados.cont.get(u.id) ?? 0} laudo(s)</div>
            </div>
            {u.id !== eu.id && u.id !== 'admin' && (
              <div className="flex flex-wrap gap-1.5">
                <select value={u.papel} onChange={(e) => db.usuarios.update(u.id, { papel: e.target.value as Papel })} className="h-9 rounded-xl border border-borda-forte bg-sup px-2 text-sm font-bold">
                  <option value="engenheiro">Engenheiro</option><option value="admin">Admin</option>
                </select>
                <Botao tam="p" variante="claro" onClick={() => db.usuarios.update(u.id, { ativo: !u.ativo })}>{u.ativo ? 'Desativar' : 'Ativar'}</Botao>
                <Botao tam="p" variante="claro" onClick={() => setSenhaDe(u)}><KeyRound className="size-4" />Senha</Botao>
              </div>
            )}
          </Cartao>
        ))}
      </div>

      <Modal aberto={!!senhaDe} aoFechar={() => setSenhaDe(null)} titulo={`Nova senha para ${senhaDe?.nome}`}>
        <Campo rotulo="Nova senha" dica="Pelo menos 6 caracteres. Passe para a pessoa por um canal seguro."><Entrada type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" /></Campo>
        <div className="mt-5 flex justify-end gap-2"><Botao variante="fantasma" onClick={() => setSenhaDe(null)}>Cancelar</Botao><Botao onClick={definirSenha} disabled={novaSenha.length < 6}>Definir senha</Botao></div>
      </Modal>

      <Modal aberto={criar} aoFechar={() => setCriar(false)} titulo="Novo usuário">
        <div className="grid gap-3">
          <Campo rotulo="Nome"><Entrada value={nf.nome} onChange={(e) => setNf({ ...nf, nome: e.target.value })} /></Campo>
          <Campo rotulo="E-mail (login)"><Entrada value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} /></Campo>
          <Campo rotulo="Senha inicial"><Entrada type="password" value={nf.senha} onChange={(e) => setNf({ ...nf, senha: e.target.value })} autoComplete="new-password" /></Campo>
          <Campo rotulo="Papel">
            <select value={nf.papel} onChange={(e) => setNf({ ...nf, papel: e.target.value as Papel })} className="h-11 rounded-xl border border-borda-forte bg-sup px-3"><option value="engenheiro">Engenheiro</option><option value="admin">Admin (acesso total)</option></select>
          </Campo>
          {erro && <p className="rounded-xl bg-critico-suave px-3 py-2 text-sm font-bold text-critico-texto">{erro}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2"><Botao variante="fantasma" onClick={() => setCriar(false)}>Cancelar</Botao><Botao onClick={criarUsuario}>Criar</Botao></div>
      </Modal>
      {el}
    </div>
  );
}

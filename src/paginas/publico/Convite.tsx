import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Users } from 'lucide-react';
import { PAPEIS, aceitarConvite, lerConvite, type ConviteOrg } from '../../db/organizacao';
import { useSessao } from '../../lib/sessao';
import { Botao, Campo, Cartao, Entrada, Logo } from '../../componentes/ui';

/** Quem recebeu o convite escolhe nome e senha e já entra na equipe. */
export function Convite() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const { entrar } = useSessao();
  const [c, setC] = useState<ConviteOrg | null | undefined>();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [repete, setRepete] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { lerConvite(token).then((x) => { setC(x); setNome(x.nome); }).catch(() => setC(null)); }, [token]);

  const aceitar = async () => {
    setErro('');
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
    if (senha !== repete) return setErro('As duas senhas não são iguais.');
    setEnviando(true);
    try {
      await aceitarConvite(token, nome.trim(), senha);
      await entrar(c!.email, senha); // entra pelo servidor, como no login normal
      nav('/painel');
    } catch (e) { setErro((e as Error).message); }
    setEnviando(false);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-papel px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {c === undefined ? <div className="h-64 animate-pulse rounded-[22px] bg-sup2" /> : c === null ? (
          <Cartao className="p-6 text-center">
            <h1 className="text-xl font-bold">Convite não encontrado</h1>
            <p className="mt-2 text-texto2">O link pode ter vencido (vale 7 dias) ou já foi usado. Peça um novo ao administrador.</p>
          </Cartao>
        ) : (
          <Cartao className="grid gap-4 p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Users className="size-5" /></span>
              <div>
                <h1 className="text-xl font-bold leading-tight">Entrar na equipe {c.organizacao}</h1>
                <p className="mt-1 text-sm text-texto2">Você foi convidado como <b>{PAPEIS[c.papel]?.nome}</b>: vê {PAPEIS[c.papel]?.ve.toLowerCase()}.</p>
              </div>
            </div>
            <Campo rotulo="E-mail"><Entrada value={c.email} disabled /></Campo>
            <Campo rotulo="Seu nome"><Entrada value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" /></Campo>
            <Campo rotulo="Crie uma senha" ajuda="Pelo menos 8 caracteres. Só você sabe."><Entrada type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" /></Campo>
            <Campo rotulo="Repita a senha"><Entrada type="password" value={repete} onChange={(e) => setRepete(e.target.value)} autoComplete="new-password" /></Campo>
            {erro && <p className="rounded-xl bg-critico-suave px-3 py-2 text-sm font-bold text-critico-texto">{erro}</p>}
            <Botao variante="obra" onClick={aceitar} carregando={enviando}>Entrar na equipe</Botao>
          </Cartao>
        )}
      </div>
    </div>
  );
}

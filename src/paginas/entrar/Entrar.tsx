import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Camera, ClipboardCheck, Eye, EyeOff, KeyRound, Lock, Mail, ScanSearch, Sparkles, User } from 'lucide-react';
import { useSessao } from '../../lib/sessao';
import { Logo } from '../../componentes/ui';
import { Lia } from '../../componentes/Lia';
import { cx } from '../../lib/util';

type Modo = 'entrar' | 'criar' | 'esqueci';

const CENA: Record<Modo, { titulo: ReactNode; texto: string }> = {
  entrar: { titulo: <>Que bom te ver de <em className="grifo not-italic">novo</em>.</>, texto: 'Seus laudos continuam onde você parou.' },
  criar: { titulo: <>Seu primeiro laudo em <em className="grifo not-italic">minutos</em>.</>, texto: 'Crie a conta, suba as fotos e confira o que a IA encontrou.' },
  esqueci: { titulo: <>Sem <em className="grifo not-italic">pânico</em>.</>, texto: 'A gente te ajuda a voltar.' },
};

function CampoLogin({ rotulo, ic: Ic, children, dica }: { rotulo: string; ic: typeof Mail; children: ReactNode; dica?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-texto2">{rotulo}</span>
      <span className="flex h-12 items-center rounded-xl border border-borda-forte bg-sup transition focus-within:border-tinta focus-within:ring-3 focus-within:ring-tinta/10">
        <Ic className="ml-3.5 size-[18px] shrink-0 text-texto3" />
        {children}
      </span>
      {dica && <small className="text-xs text-texto3">{dica}</small>}
    </label>
  );
}

const INP = 'h-full min-w-0 flex-1 bg-transparent px-2.5 text-base text-texto outline-none placeholder:text-texto3';

export function Entrar({ modo }: { modo: Modo }) {
  const { usuario, entrar, cadastrar } = useSessao();
  const nav = useNavigate();
  const loc = useLocation();
  const destino = (loc.state as { de?: string } | null)?.de ?? '/painel';
  const [f, setF] = useState({ login: '', senha: '', nome: '', profissao: 'Engenheiro Civil', registro: '' });
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState<'' | 'form'>('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { if (usuario) nav(destino, { replace: true }); }, [usuario]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setErro(''), [modo]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(''); setOcupado('form');
    try {
      if (modo === 'entrar') await entrar(f.login, f.senha);
      else if (modo === 'criar') await cadastrar({ nome: f.nome, email: f.login, senha: f.senha, profissao: f.profissao, registro: f.registro });
    } catch (x) { setErro((x as Error).message); }
    setOcupado('');
  };

  const cena = CENA[modo];

  return (
    <div className="flex min-h-dvh flex-col bg-papel md:flex-row">
      {/* lado da marca (no celular vira o topo) */}
      <aside className="relative overflow-hidden bg-[#121A2B] px-5 pb-9 pt-4 text-white md:flex md:min-h-dvh md:w-[44%] md:max-w-[620px] md:flex-col md:px-12 md:py-9">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[380px] rounded-full bg-obra/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[320px] rounded-full bg-[#3b6bc4]/30 blur-3xl" aria-hidden />
        <div className="relative flex items-center justify-between">
          <Link to="/"><Logo claro tam={34} /></Link>
          <Link to="/" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[13px] font-bold text-[#C9CED8] hover:border-white/30 hover:text-white"><ArrowLeft className="size-4" />Site</Link>
        </div>
        <div className="relative mt-7 max-w-[460px] md:my-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-obra"><Sparkles className="size-3.5" />Laudo com IA</span>
          <h1 className="mt-4 text-[28px] font-bold leading-[1.1] md:text-[42px]" key={modo}>{cena.titulo}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#A9B1C1] md:text-[17px]">{cena.texto}</p>
          <Lia className="mt-5 max-w-sm" tom="escuro" tam={40} humor="feliz">Oi! Sou a Lia. Eu olho as fotos e faço o rascunho; você confere e assina.</Lia>
          <ul className="mt-8 hidden gap-3.5 md:grid">
            {[{ ic: Camera, t: 'Suba as fotos da vistoria, do celular ou do computador' }, { ic: ScanSearch, t: 'A IA aponta fissuras, umidade e o grau de risco' }, { ic: ClipboardCheck, t: 'Você confere e o laudo sai pronto para assinar' }].map(({ ic: Ic, t }) => (
              <li key={t} className="flex items-center gap-3 text-[15px] font-semibold text-[#E4E7EC]">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/10 text-obra"><Ic className="size-[18px]" /></span>{t}
              </li>
            ))}
          </ul>
        </div>
        <div className="fita absolute inset-x-0 bottom-0 h-2 md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-2" aria-hidden />
      </aside>

      <main className="flex flex-1 flex-col items-center px-4 pb-8 md:justify-center md:px-8 md:py-10">
        <div className="relative z-10 -mt-4 flex w-full max-w-[440px] flex-col gap-4 md:mt-0">
          {modo !== 'esqueci' && (
            <>
                            <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-borda bg-sup p-1" role="tablist">
                {(['entrar', 'criar'] as const).map((m) => (
                  <Link key={m} to={m === 'entrar' ? '/entrar' : '/cadastrar'} replace role="tab" aria-selected={modo === m}
                    className={cx('rounded-[10px] py-2.5 text-center text-sm font-extrabold transition', modo === m ? 'bg-[#121A2B] text-white' : 'text-texto2 hover:bg-sup2')}>
                    {m === 'entrar' ? 'Entrar' : 'Criar conta'}
                  </Link>
                ))}
              </div>
            </>
          )}

          {modo === 'esqueci' ? (
            <section className="grid gap-4 rounded-[18px] border border-borda bg-sup p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-obra-suave text-obra-texto"><KeyRound className="size-5" /></span>
              <h2 className="text-xl font-bold">Esqueceu a senha?</h2>
              <p className="text-texto2">Nesta versão de teste tudo fica guardado neste aparelho, então não há e-mail de recuperação. Peça ao <b>administrador</b> para definir uma senha nova na tela <b>Usuários</b>.</p>
              <p className="text-sm text-texto3">Quando o servidor estiver no ar, chega um link no seu e-mail.</p>
              <Link to="/entrar" className="pilula pilula-clara">Voltar para entrar</Link>
            </section>
          ) : (
            <form onSubmit={enviar} className="grid gap-3.5" noValidate>
              {modo === 'criar' && (
                <CampoLogin rotulo="Seu nome" ic={User}>
                  <input className={INP} value={f.nome} onChange={set('nome')} autoComplete="name" placeholder="Eng. Fulano de Tal" required />
                </CampoLogin>
              )}
              <CampoLogin rotulo="E-mail" ic={Mail}>
                <input className={INP} value={f.login} onChange={set('login')} autoComplete={modo === 'entrar' ? 'username' : 'email'} inputMode="email" placeholder="voce@email.com" required />
              </CampoLogin>
              <CampoLogin rotulo="Senha" ic={Lock} dica={modo === 'criar' ? 'Pelo menos 6 caracteres.' : undefined}>
                <input className={INP} type={ver ? 'text' : 'password'} value={f.senha} onChange={set('senha')} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required />
                <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'} className="mr-2 grid size-9 place-items-center rounded-lg text-texto3 hover:bg-sup2 hover:text-texto">
                  {ver ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </CampoLogin>
              {modo === 'criar' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-bold text-texto2">Profissão</span>
                    <input className="h-12 rounded-xl border border-borda-forte bg-sup px-3 text-texto outline-none focus:border-tinta" value={f.profissao} onChange={set('profissao')} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-bold text-texto2">CREA / CAU</span>
                    <input className="h-12 rounded-xl border border-borda-forte bg-sup px-3 text-texto outline-none focus:border-tinta" value={f.registro} onChange={set('registro')} placeholder="opcional" /></label>
                </div>
              )}
              {erro && <p role="alert" className="rounded-xl bg-critico-suave px-3.5 py-2.5 text-sm font-bold text-critico-texto">{erro}</p>}
              <button type="submit" disabled={!!ocupado} className="mt-1 h-12 rounded-xl bg-[#121A2B] font-extrabold text-white transition hover:bg-tinta disabled:opacity-60">
                {ocupado === 'form' ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta e começar'}
              </button>
              {modo === 'entrar' && <Link to="/esqueci" className="text-center text-sm font-bold text-texto2 underline-offset-2 hover:underline">Esqueci a senha</Link>}
            </form>
          )}

          <p className="mt-4 text-center text-xs text-texto3">Versão de teste: seus dados ficam só neste navegador.</p>
        </div>
      </main>
    </div>
  );
}

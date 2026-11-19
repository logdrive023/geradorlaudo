import { useEffect, useState } from 'react';
import { Camera, Check, ChevronDown, Copy, HardHat, Mail, MessageCircle, RotateCw, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { PAPEIS, alterarUsuario, auditoria, convidar, lerOrg, listarConvites, listarUsuarios, type ConviteOrg, type EventoOrg, type Org, type UsuarioOrg } from '../../db/organizacao';
import { Botao, Campo, Cartao, Entrada, Modal, useAviso } from '../../componentes/ui';
import { Atividades } from './Atividades';
import { CabecalhoTela } from '../../componentes/CabecalhoTela';
import { cx } from '../../lib/util';
import type { Papel } from '../../dominio/modelo';

const iniciais = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const data = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Escolha do papel com o que cada um vê e faz (para o admin não errar). */
function EscolhaPapel({ valor, aoMudar }: { valor: Papel; aoMudar: (p: Papel) => void }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Papel">
      {(Object.keys(PAPEIS) as Papel[]).map((p) => (
        <button key={p} type="button" role="radio" aria-checked={valor === p} onClick={() => aoMudar(p)}
          className={cx('rounded-2xl border p-3 text-left transition', valor === p ? 'border-tinta bg-tinta/5 ring-2 ring-tinta/15' : 'border-borda hover:border-borda-forte')}>
          <b>{PAPEIS[p].nome}</b>
          <span className="mt-0.5 block text-xs text-texto2"><b>Vê:</b> {PAPEIS[p].ve}. <b>Faz:</b> {PAPEIS[p].faz}.</span>
        </button>
      ))}
    </div>
  );
}

/** Equipe da organização (conta no servidor): pessoas, papéis, convites e registro de atividades. */
export function EquipeOrganizacao({ euId }: { euId: string }) {
  const { avisar, el } = useAviso();
  const [org, setOrg] = useState<Org>();
  const [pessoas, setPessoas] = useState<UsuarioOrg[]>([]);
  const [convites, setConvites] = useState<ConviteOrg[]>([]);
  const [eventos, setEventos] = useState<EventoOrg[]>([]);
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState<{ nome: string; email: string; papel: Papel } | null>(null);
  const [link, setLink] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [menuDe, setMenuDe] = useState<string | null>(null);

  const carregar = async () => {
    setErro('');
    try {
      const o = await lerOrg(); setOrg(o);
      setPessoas(await listarUsuarios());
      if (o.permissoes.equipe) setConvites((await listarConvites()).filter((c) => c.pendente));
      if (o.permissoes.auditoria) setEventos(await auditoria());
    } catch (e) { setErro((e as Error).message); }
  };
  useEffect(() => { void carregar(); }, []);

  const mudar = async (u: UsuarioOrg, p: { papel?: Papel; ativo?: boolean }) => {
    try { await alterarUsuario(u.id, p); avisar('Salvo'); await carregar(); } catch (e) { avisar((e as Error).message, 'erro'); }
  };
  const enviarConvite = async () => {
    if (!novo) return;
    setEnviando(true);
    try { setLink(await convidar(novo.email.trim(), novo.nome.trim(), novo.papel)); await carregar(); } catch (e) { avisar((e as Error).message, 'erro'); }
    setEnviando(false);
  };

  if (erro) return (
    <Cartao className="mx-auto mt-6 max-w-xl p-5 text-center">
      <p className="text-texto2">{erro}</p>
      <Botao className="mt-3" variante="claro" onClick={carregar}><RotateCw className="size-4" />Tentar de novo</Botao>
    </Cartao>
  );
  if (!org) return <div className="mx-auto mt-10 h-40 max-w-5xl animate-pulse rounded-2xl bg-sup2" />;
  const admin = org.permissoes.equipe;

  const ESTILO: Record<Papel, { avatar: string; selo: string; faixa: string; ic: typeof Shield }> = {
    admin: { avatar: 'bg-obra text-[#121A2B]', selo: 'bg-obra-suave text-obra-texto', faixa: 'bg-obra', ic: Shield },
    engenheiro: { avatar: 'bg-tinta text-white dark:text-[#0E1320]', selo: 'bg-tinta/10 text-tinta', faixa: 'bg-tinta', ic: HardHat },
    assistente: { avatar: 'bg-[#64748b] text-white', selo: 'bg-sup2 text-texto2', faixa: 'bg-[#64748b]', ic: Camera },
  };
  const ativos = pessoas.filter((p) => p.ativo).length;
  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 md:px-8 md:py-8">
      <CabecalhoTela sobre={org.organizacao.nome} titulo="Sua" grifo="equipe"
        acao={admin && <button onClick={() => { setNovo({ nome: '', email: '', papel: 'engenheiro' }); setLink(''); }} className="pilula pilula-obra"><UserPlus className="size-5" />Convidar</button>}
        humor={convites.length ? 'atenta' : 'feliz'}
        lia={convites.length ? `${convites.length} convite${convites.length > 1 ? 's' : ''} esperando a pessoa entrar.` : admin ? 'Convide quem trabalha com você. Cada um vê só o que o papel permite.' : 'Esta é a equipe do seu escritório.'}
        numeros={[{ n: ativos, t: ativos === 1 ? 'pessoa ativa' : 'pessoas ativas' }, { n: org.uso.laudosMes, t: 'laudos no mês' }, { n: org.uso.analisesIA, t: 'fotos com IA' }]} />

      {/* pessoas */}
      <h2 className="mt-6 text-lg font-extrabold">Pessoas</h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {pessoas.map((u) => {
          const eu = u.id === euId;
          const podeMexer = admin && !eu;
          const e = ESTILO[u.papel] ?? ESTILO.assistente;
          const Ic = e.ic;
          return (
            <div key={u.id} className={cx('relative overflow-visible rounded-[20px] border border-borda bg-sup transition', !u.ativo && 'opacity-55')}>
              <span className={cx('absolute inset-x-0 top-0 h-1 rounded-t-[20px]', e.faixa)} aria-hidden />
              <div className="flex items-center gap-3 p-4 pt-5">
                <span className={cx('relative grid size-12 shrink-0 place-items-center rounded-2xl font-display text-base font-extrabold', e.avatar)}>
                  {iniciais(u.nome || u.email)}
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-sup text-texto2 ring-2 ring-sup"><Ic className="size-3" /></span>
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block break-words leading-tight">{u.nome}</b>
                  <span className="block truncate text-xs text-texto3">{u.email}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <button disabled={!podeMexer} onClick={() => setMenuDe(menuDe === u.id ? null : u.id)} aria-label={podeMexer ? `Mudar o papel de ${u.nome}` : undefined}
                      className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold transition', e.selo, podeMexer && 'hover:ring-2 hover:ring-borda-forte')}>
                      <Ic className="size-3" />{PAPEIS[u.papel]?.nome ?? u.papel}{podeMexer && <ChevronDown className="size-3.5" />}
                    </button>
                    {eu && <span className="rounded-full bg-ok-suave px-2 py-0.5 text-[11px] font-extrabold text-ok-texto">você</span>}
                    {!u.ativo && <span className="rounded-full bg-critico-suave px-2 py-0.5 text-[11px] font-extrabold text-critico-texto">desativado</span>}
                  </span>
                </span>
              </div>
              {menuDe === u.id && (
                <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-20 overflow-hidden rounded-xl border border-borda bg-sup py-1 shadow-xl" onMouseLeave={() => setMenuDe(null)}>
                  {(Object.keys(PAPEIS) as Papel[]).map((p) => (
                    <button key={p} onClick={() => { setMenuDe(null); if (p !== u.papel) void mudar(u, { papel: p }); }}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-sup2">
                      <Check className={cx('mt-0.5 size-4 shrink-0', p === u.papel ? 'text-ok' : 'invisible')} />
                      <span><b className="block">{PAPEIS[p].nome}</b><span className="text-xs text-texto3">vê {PAPEIS[p].ve.toLowerCase()}</span></span>
                    </button>
                  ))}
                  <button onClick={() => { setMenuDe(null); void mudar(u, { ativo: !u.ativo }); }} className="flex w-full items-center gap-2 border-t border-borda px-3 py-2.5 text-sm font-bold text-critico-texto hover:bg-critico-suave">
                    {u.ativo ? <><UserX className="size-4" />Desativar acesso</> : <><UserCheck className="size-4" />Ativar acesso</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {admin && convites.map((c) => (
          <div key={c.email} className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-borda-forte p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sup2 text-texto3"><Mail className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <b className="block truncate leading-tight">{c.nome || c.email}</b>
              <span className="block truncate text-xs text-texto3">convite enviado · vale até {data(c.expiraEm)}</span>
              <span className={cx('mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold', (ESTILO[c.papel] ?? ESTILO.assistente).selo)}>{PAPEIS[c.papel]?.nome}</span>
            </span>
          </div>
        ))}
        {admin && (
          <button onClick={() => { setNovo({ nome: '', email: '', papel: 'engenheiro' }); setLink(''); }}
            className="flex min-h-[96px] items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-borda-forte font-extrabold text-texto2 transition hover:border-obra hover:text-obra-texto">
            <UserPlus className="size-5" />Convidar mais alguém
          </button>
        )}
      </div>

      {/* o que cada papel vê */}
      <h2 className="mt-7 text-lg font-extrabold">O que cada papel vê</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {(Object.keys(PAPEIS) as Papel[]).map((p) => {
          const e = ESTILO[p]; const Ic = e.ic;
          return (
            <div key={p} className="rounded-2xl border border-borda bg-sup p-3.5">
              <span className="flex items-center gap-2"><span className={cx('grid size-8 place-items-center rounded-xl', e.avatar)}><Ic className="size-4" /></span><b>{PAPEIS[p].nome}</b></span>
              <p className="mt-2 text-sm text-texto2"><b className="text-texto">Vê:</b> {PAPEIS[p].ve.toLowerCase()}.</p>
              <p className="mt-0.5 text-sm text-texto2"><b className="text-texto">Faz:</b> {PAPEIS[p].faz.charAt(0).toLowerCase() + PAPEIS[p].faz.slice(1)}.</p>
            </div>
          );
        })}
      </div>

      {org.permissoes.auditoria && org.auditoria && eventos.length > 0 && <Atividades eventos={eventos} />}

      <Modal aberto={!!novo} aoFechar={() => setNovo(null)} titulo={link ? 'Convite pronto' : 'Convidar pessoa'}>
        {link ? (
          <div className="grid gap-3">
            <p className="text-sm text-texto2">Mande este link para <b>{novo?.email}</b>. A pessoa escolhe a própria senha. Vale 7 dias e só uma vez.</p>
            <div className="flex items-center gap-2 rounded-xl bg-sup2 px-3 py-2.5"><span className="min-w-0 flex-1 truncate text-sm">{link}</span></div>
            <div className="flex flex-wrap gap-2">
              <Botao variante="obra" onClick={() => { void navigator.clipboard.writeText(link); avisar('Link copiado'); }}><Copy className="size-4" />Copiar link</Botao>
              <a className="pilula pilula-clara" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Você foi convidado para a equipe ${org.organizacao.nome} no LaudoTech: ${link}`)}`}><MessageCircle className="size-4" />WhatsApp</a>
            </div>
          </div>
        ) : novo && (
          <div className="grid gap-3">
            <Campo rotulo="Nome"><Entrada value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></Campo>
            <Campo rotulo="E-mail"><Entrada type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} /></Campo>
            <Campo rotulo="Papel"><EscolhaPapel valor={novo.papel} aoMudar={(p) => setNovo({ ...novo, papel: p })} /></Campo>
            <div className="mt-2 flex justify-end gap-2"><Botao variante="fantasma" onClick={() => setNovo(null)}>Cancelar</Botao><Botao onClick={enviarConvite} carregando={enviando} disabled={!novo.email.includes('@')}>Gerar convite</Botao></div>
          </div>
        )}
      </Modal>
      {el}
    </div>
  );
}

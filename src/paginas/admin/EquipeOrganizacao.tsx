import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, FileText, Mail, Sparkles, Users, MessageCircle, RotateCw, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { PAPEIS, alterarUsuario, auditoria, convidar, lerOrg, listarConvites, listarUsuarios, type ConviteOrg, type EventoOrg, type Org, type UsuarioOrg } from '../../db/organizacao';
import { Botao, Campo, Cartao, Entrada, Modal, useAviso } from '../../componentes/ui';
import { Atividades } from './Atividades';
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

  const COR_PAPEL: Record<Papel, string> = { admin: 'bg-obra-suave text-obra-texto', engenheiro: 'bg-tinta/10 text-tinta', assistente: 'bg-sup2 text-texto2' };
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-9">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-texto3">{org.organizacao.nome}</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl"><span className="grifo">Equipe</span></h1>
        </div>
        {admin && <Botao tam="p" variante="obra" onClick={() => { setNovo({ nome: '', email: '', papel: 'engenheiro' }); setLink(''); }}><UserPlus className="size-4" />Convidar</Botao>}
      </div>

      {/* o mês numa linha */}
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto2">
        <span className="flex items-center gap-1.5"><Users className="size-4 text-texto3" /><b className="text-texto">{org.uso.usuarios}</b> {org.uso.usuarios === 1 ? 'pessoa' : 'pessoas'}</span>
        <span className="flex items-center gap-1.5"><FileText className="size-4 text-texto3" /><b className="text-texto">{org.uso.laudosMes}</b> laudos no mês</span>
        <span className="flex items-center gap-1.5"><Sparkles className="size-4 text-texto3" /><b className="text-texto">{org.uso.analisesIA}</b> fotos com IA</span>
      </p>

      {/* pessoas e convites numa lista só */}
      <div className="mt-5 divide-y divide-borda overflow-visible rounded-2xl border border-borda bg-sup">
        {pessoas.map((u) => {
          const eu = u.id === euId;
          const podeMexer = admin && !eu;
          return (
            <div key={u.id} className={cx('relative flex items-center gap-3 px-4 py-3', !u.ativo && 'opacity-55')}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tinta text-sm font-extrabold text-white dark:text-[#0E1320]">{iniciais(u.nome || u.email)}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate leading-tight">{u.nome}{eu && <span className="ml-1.5 text-xs font-bold text-ok-texto">você</span>}</b>
                <span className="block truncate text-xs text-texto3">{u.ativo ? u.email : 'desativado'}</span>
              </span>
              <button disabled={!podeMexer} onClick={() => setMenuDe(menuDe === u.id ? null : u.id)} aria-label={podeMexer ? `Mudar o papel de ${u.nome}` : undefined}
                className={cx('flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold', COR_PAPEL[u.papel], podeMexer && 'hover:ring-2 hover:ring-borda-forte')}>
                {u.papel === 'admin' && <Shield className="size-3" />}{PAPEIS[u.papel]?.nome ?? u.papel}{podeMexer && <ChevronDown className="size-3.5" />}
              </button>
              {menuDe === u.id && (
                <div className="absolute right-3 top-full z-20 -mt-1 w-56 overflow-hidden rounded-xl border border-borda bg-sup py-1 shadow-xl" onMouseLeave={() => setMenuDe(null)}>
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
          <div key={c.email} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-dashed border-borda-forte text-texto3"><Mail className="size-4" /></span>
            <span className="min-w-0 flex-1"><b className="block truncate leading-tight">{c.nome || c.email}</b><span className="block truncate text-xs text-texto3">convite enviado · vale até {data(c.expiraEm)}</span></span>
            <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold', COR_PAPEL[c.papel])}>{PAPEIS[c.papel]?.nome}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-texto3">{(Object.keys(PAPEIS) as Papel[]).map((p) => `${PAPEIS[p].nome}: ${PAPEIS[p].ve.toLowerCase()}`).join(' · ')}.</p>

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

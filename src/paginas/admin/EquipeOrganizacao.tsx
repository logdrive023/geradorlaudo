import { useEffect, useState } from 'react';
import { Copy, History, Mail, MessageCircle, RotateCw, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { ACAO, PAPEIS, alterarUsuario, auditoria, convidar, lerOrg, listarConvites, listarUsuarios, type ConviteOrg, type EventoOrg, type Org, type UsuarioOrg } from '../../db/organizacao';
import { Botao, Campo, Cartao, Dica, Entrada, Modal, Selo, useAviso } from '../../componentes/ui';
import { Recolhivel } from '../../componentes/Wizard';
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-bold text-texto3">{org.organizacao.nome}</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl"><span className="grifo">Equipe</span></h1>
        </div>
        {admin && <Botao variante="obra" onClick={() => { setNovo({ nome: '', email: '', papel: 'engenheiro' }); setLink(''); }}><UserPlus className="size-4" />Convidar pessoa</Botao>}
      </div>

      {/* o mês em números */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[['Pessoas', org.uso.usuarios], ['Laudos no mês', org.uso.laudosMes], ['Análises de IA no mês', org.uso.analisesIA]].map(([r, v]) => (
          <Cartao key={r} className="p-3"><span className="block text-[11px] font-extrabold uppercase tracking-wider text-texto3">{r}</span><b className="font-display text-2xl">{v}</b></Cartao>
        ))}
      </div>

      {/* pessoas */}
      <h2 className="mt-7 flex items-center gap-1.5 text-lg font-bold">Pessoas<Dica texto={<>{(Object.keys(PAPEIS) as Papel[]).map((p) => <span key={p} className="block"><b>{PAPEIS[p].nome}:</b> vê {PAPEIS[p].ve.toLowerCase()}.</span>)}</>} /></h2>
      <div className="mt-2 grid gap-2">
        {pessoas.map((u) => (
          <Cartao key={u.id} className={cx('flex flex-wrap items-center gap-3 p-4', !u.ativo && 'opacity-60')}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tinta font-extrabold text-white dark:text-[#0E1320]">{iniciais(u.nome || u.email)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><b className="truncate">{u.nome}</b>
                {u.papel === 'admin' && <Selo tom="obra"><Shield className="size-3" />Admin</Selo>}
                {u.papel !== 'admin' && <Selo>{PAPEIS[u.papel]?.nome ?? u.papel}</Selo>}
                {u.id === euId && <Selo tom="ok">Você</Selo>}
                {!u.ativo && <Selo tom="critico">Desativado</Selo>}
              </div>
              <div className="truncate text-sm text-texto3">{u.email}</div>
            </div>
            {admin && u.id !== euId && (
              <div className="flex flex-wrap gap-1.5">
                <select value={u.papel} onChange={(e) => mudar(u, { papel: e.target.value as Papel })} aria-label={`Papel de ${u.nome}`}
                  className="h-9 rounded-xl border border-borda-forte bg-sup px-2 text-sm font-bold">
                  {(Object.keys(PAPEIS) as Papel[]).map((p) => <option key={p} value={p}>{PAPEIS[p].nome}</option>)}
                </select>
                <Botao tam="p" variante="claro" onClick={() => mudar(u, { ativo: !u.ativo })}>{u.ativo ? <><UserX className="size-4" />Desativar</> : <><UserCheck className="size-4" />Ativar</>}</Botao>
              </div>
            )}
          </Cartao>
        ))}
      </div>

      {admin && convites.length > 0 && (
        <>
          <h2 className="mt-7 text-lg font-bold">Convites esperando</h2>
          <div className="mt-2 grid gap-2">
            {convites.map((c) => (
              <Cartao key={c.email} className="flex flex-wrap items-center gap-3 p-3.5">
                <Mail className="size-5 text-texto3" />
                <span className="min-w-0 flex-1"><b className="block truncate">{c.nome || c.email}</b><span className="text-sm text-texto3">{c.email} · {PAPEIS[c.papel]?.nome} · vale até {data(c.expiraEm)}</span></span>
              </Cartao>
            ))}
          </div>
        </>
      )}

      {org.permissoes.auditoria && eventos.length > 0 && (
        <Recolhivel className="mt-7" titulo={<span className="flex items-center gap-1.5"><History className="size-4" />Atividades recentes</span>} resumo="Quem fez o quê, com data e hora">
          <ul className="grid gap-1.5 text-sm">
            {eventos.slice(0, 40).map((e) => (
              <li key={e.id} className="flex gap-2 rounded-xl bg-sup2 px-3 py-2"><span className="shrink-0 text-texto3">{data(e.criadoEm)}</span><span><b>{e.nome || 'Cliente'}</b> {ACAO[e.acao] ?? e.acao}</span></li>
            ))}
          </ul>
        </Recolhivel>
      )}

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

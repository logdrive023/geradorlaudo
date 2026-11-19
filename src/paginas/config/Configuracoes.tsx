import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Download, FileStack, ImagePlus, KeyRound, Monitor, Moon, Palette, ShieldCheck, Sparkles, Sun, Trash2, Upload, User } from 'lucide-react';
import { db, lerConfig, salvarConfig } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { Botao, Campo, Cartao, Entrada, Modal, useAviso, useUrl } from '../../componentes/ui';
import { baixar, cx, novoId, resumoSenha } from '../../lib/util';
import { prepararFoto } from '../../lib/imagem';
import type { Configuracao, Usuario } from '../../dominio/modelo';
import { Modelos } from './Modelos';

// lista dos modelos sem carregar o SDK do Gemini nesta tela
const MODELOS_GEMINI_UI = [
  { id: 'gemini-2.5-flash', nome: 'Gemini 2.5 Flash', nota: 'recomendado no grátis' },
  { id: 'gemini-2.5-flash-lite', nome: 'Gemini 2.5 Flash-Lite', nota: 'mais rápido, mais limite' },
  { id: 'gemini-3.5-flash', nome: 'Gemini 3.5 Flash', nota: 'mais novo (confira se o seu plano cobre)' },
];

type Aba = 'perfil' | 'modelos' | 'ia' | 'aparencia' | 'seguranca' | 'dados';
const ABAS: { id: Aba; rotulo: string; ic: typeof User }[] = [
  { id: 'perfil', rotulo: 'Perfil', ic: User },
  { id: 'modelos', rotulo: 'Modelos', ic: FileStack },
  { id: 'ia', rotulo: 'IA', ic: Sparkles },
  { id: 'aparencia', rotulo: 'Aparência', ic: Palette },
  { id: 'seguranca', rotulo: 'Segurança', ic: ShieldCheck },
  { id: 'dados', rotulo: 'Dados', ic: Download },
];

function ImagemPerfil({ rotulo, dica, valor, aoMudar }: { rotulo: string; dica: string; valor?: Blob; aoMudar: (b?: Blob) => void }) {
  const url = useUrl(valor);
  const inp = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-borda bg-white">{url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="size-6 text-texto3" />}</div>
      <div>
        <b className="block">{rotulo}</b><small className="text-texto3">{dica}</small>
        <div className="mt-2 flex gap-1.5">
          <Botao tam="p" variante="claro" onClick={() => inp.current?.click()}>{valor ? 'Trocar' : 'Enviar'}</Botao>
          {valor && <Botao tam="p" variante="fantasma" onClick={() => aoMudar(undefined)}><Trash2 className="size-4" /></Botao>}
        </div>
      </div>
      <input ref={inp} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) aoMudar((await prepararFoto(f)).imagem); e.target.value = ''; }} />
    </div>
  );
}

function Perfil({ u }: { u: Usuario }) {
  const [f, setF] = useState(u);
  const { avisar, el } = useAviso();
  useEffect(() => setF(u), [u.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof Usuario) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const mudou = (['nome', 'profissao', 'registro', 'telefone', 'endereco', 'cidade', 'uf'] as const).some((k) => f[k] !== u[k]);
  const salvar = async () => {
    await db.usuarios.update(u.id, { nome: f.nome, profissao: f.profissao, registro: f.registro, telefone: f.telefone, endereco: f.endereco, cidade: f.cidade, uf: f.uf.toUpperCase() });
    avisar('Perfil salvo');
  };
  const assinatura = useUrl(u.assinatura);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-4">
        <Cartao className="p-5">
          <h2 className="text-lg font-bold">Quem assina</h2>
          <p className="mb-4 text-sm text-texto2">Vai na capa, no cabeçalho e na assinatura de todos os seus laudos.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome completo" className="sm:col-span-2" ajuda="Como deve aparecer na assinatura. Ex.: Eng. Civil Ana Ribeiro."><Entrada value={f.nome} onChange={set('nome')} autoComplete="name" /></Campo>
            <Campo rotulo="Profissão" ajuda="Ex.: Engenheiro Civil, Arquiteta e Urbanista, Perito Contador."><Entrada value={f.profissao} onChange={set('profissao')} /></Campo>
            <Campo rotulo="Registro profissional" ajuda="CREA, CAU ou CRC com a UF e o número. Sem ele o laudo não fica pronto para assinar."><Entrada value={f.registro} onChange={set('registro')} placeholder="CREA-SP 5070574267" /></Campo>
          </div>
        </Cartao>
        <Cartao className="p-5">
          <h2 className="text-lg font-bold">Contato</h2>
          <p className="mb-4 text-sm text-texto2">Aparece no rodapé de cada página.</p>
          <div className="grid grid-cols-[1fr_88px] gap-4 sm:grid-cols-2">
            <Campo rotulo="Telefone" className="col-span-2 sm:col-span-1"><Entrada value={f.telefone} onChange={set('telefone')} inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" /></Campo>
            <Campo rotulo="Endereço" className="col-span-2 sm:col-span-1"><Entrada value={f.endereco} onChange={set('endereco')} autoComplete="street-address" /></Campo>
            <Campo rotulo="Cidade"><Entrada value={f.cidade} onChange={set('cidade')} autoComplete="address-level2" /></Campo>
            <Campo rotulo="UF"><Entrada value={f.uf} onChange={set('uf')} maxLength={2} className="uppercase" autoComplete="address-level1" /></Campo>
          </div>
        </Cartao>
        <Cartao className="grid gap-5 p-5">
          <div><h2 className="text-lg font-bold">Logo e assinatura</h2><p className="text-sm text-texto2">Salvam na hora.</p></div>
          <ImagemPerfil rotulo="Logo" dica="Vai na capa de todos os laudos." valor={u.logo} aoMudar={(b) => db.usuarios.update(u.id, { logo: b })} />
          <ImagemPerfil rotulo="Assinatura" dica="Assine num papel branco e tire uma foto bem de perto." valor={u.assinatura} aoMudar={(b) => db.usuarios.update(u.id, { assinatura: b })} />
        </Cartao>
      </div>

      <aside className="grid content-start gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-texto3">Como aparece no laudo</span>
        <div className="rounded-[18px] border border-borda bg-white p-5 text-center text-[#1b1f29] shadow-[0_10px_30px_rgba(18,26,43,.08)]">
          <div className="flex h-14 items-end justify-center">{assinatura ? <img src={assinatura} alt="" className="max-h-14 object-contain" /> : <span className="font-serif text-2xl italic text-[#9aa3b5]">sua assinatura</span>}</div>
          <div className="mx-auto mt-1 w-4/5 border-t border-[#121A2B] pt-2">
            <b className="block">{f.nome || 'Seu nome'}</b>
            <span className="text-sm text-[#526079]">{[f.profissao, f.registro || 'registro profissional'].filter(Boolean).join(' · ')}</span>
          </div>
          <div className="mt-4 border-t border-[#e3e8f0] pt-2 text-[11px] text-[#6b7890]">{[f.endereco, f.cidade && `${f.cidade}${f.uf ? `/${f.uf.toUpperCase()}` : ''}`, f.telefone].filter(Boolean).join(' · ') || 'endereço · cidade/UF · telefone'}</div>
        </div>
      </aside>

      {mudou && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-borda bg-sup/95 p-3 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <span className="text-sm font-bold text-texto2">Você tem alterações não salvas</span>
            <div className="flex gap-2"><Botao variante="fantasma" onClick={() => setF(u)}>Descartar</Botao><Botao variante="obra" onClick={salvar}>Salvar</Botao></div>
          </div>
        </div>
      )}
      {el}
    </div>
  );
}

function IA({ cfg }: { cfg: Configuracao }) {
  const [chave, setChave] = useState(cfg.apiKey);
  const [gKey, setGKey] = useState(cfg.geminiKey ?? '');
  const [testando, setTestando] = useState(false);
  const { avisar, el } = useAviso();
  const testarClaude = async () => {
    setTestando(true);
    try { const { testarChave } = await import('../../ia/claude'); await testarChave(chave.trim()); await salvarConfig({ apiKey: chave.trim(), motorIA: 'claude' }); avisar('Chave válida. Claude ligado!'); }
    catch (e) { avisar((e as Error).message, 'erro'); }
    setTestando(false);
  };
  const testarGemini = async () => {
    setTestando(true);
    try { const { testarChaveGemini } = await import('../../ia/gemini'); await testarChaveGemini(gKey.trim(), cfg.geminiModelo); await salvarConfig({ geminiKey: gKey.trim(), motorIA: 'gemini' }); avisar('Chave válida. Gemini ligado!'); }
    catch (e) { avisar((e as Error).message, 'erro'); }
    setTestando(false);
  };
  const opcoes = [
    { id: 'demo', t: 'Demonstração', selo: 'grátis', d: 'Sem chave e sem internet. A análise é simulada, só para testar o fluxo.' },
    { id: 'gemini', t: 'Gemini (Google)', selo: 'tem faixa grátis', d: 'IA de verdade com a faixa grátis do Google AI Studio. Ótimo para começar.' },
    { id: 'claude', t: 'Claude (Anthropic)', selo: 'pago por uso', d: 'IA de verdade, a mais precisa em patologia. Cobra por foto analisada.' },
  ] as const;
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {opcoes.map((o) => (
          <button key={o.id} onClick={() => salvarConfig({ motorIA: o.id })}
            className={cx('rounded-2xl border p-4 text-left transition', cfg.motorIA === o.id ? 'border-tinta bg-tinta/5 ring-2 ring-tinta/15' : 'border-borda bg-sup hover:border-borda-forte')}>
            <div className="flex items-center justify-between gap-2"><b>{o.t}</b>{cfg.motorIA === o.id && <CheckCircle2 className="size-5 shrink-0 text-tinta" />}</div>
            <span className={cx('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold', o.id === 'claude' ? 'bg-sup2 text-texto2' : 'bg-ok-suave text-ok-texto')}>{o.selo}</span>
            <p className="mt-1.5 text-sm text-texto2">{o.d}</p>
          </button>
        ))}
      </div>

      {cfg.motorIA === 'gemini' && (
        <Cartao className="grid gap-4 p-5">
          <ol className="grid gap-2 text-sm">
            <li className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-obra text-xs font-extrabold text-[#121A2B]">1</span><span>Abra o <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-extrabold text-tinta underline underline-offset-2">Google AI Studio › API keys</a> com a sua conta Google.</span></li>
            <li className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-obra text-xs font-extrabold text-[#121A2B]">2</span><span>Toque em <b>Create API key</b> e copie a chave.</span></li>
            <li className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-obra text-xs font-extrabold text-[#121A2B]">3</span><span>Cole aqui embaixo e toque em <b>Testar e salvar</b>.</span></li>
          </ol>
          <Campo rotulo="Chave do Gemini" ajuda="Fica só neste navegador. Quando o servidor existir, a chave sai daqui e fica só nele.">
            <Entrada type="password" value={gKey} onChange={(e) => setGKey(e.target.value)} placeholder="AIza…" autoComplete="off" />
          </Campo>
          <Campo rotulo="Modelo" ajuda="O Flash é o que a faixa grátis cobre melhor. Se der erro de limite, troque para o Flash-Lite.">
            <select value={cfg.geminiModelo} onChange={(e) => salvarConfig({ geminiModelo: e.target.value })} className="h-11 rounded-xl border border-borda-forte bg-sup px-3 text-texto outline-none focus:border-tinta">
              {MODELOS_GEMINI_UI.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.nota}</option>)}
            </select>
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={testarGemini} carregando={testando} disabled={!gKey.trim()}><KeyRound className="size-4" />Testar e salvar</Botao>
            {cfg.geminiKey && <Botao variante="fantasma" onClick={async () => { setGKey(''); await salvarConfig({ geminiKey: '', motorIA: 'demo' }); }}>Remover chave</Botao>}
          </div>
          <p className="rounded-xl bg-medio-suave p-3 text-sm text-medio-texto"><b>Atenção:</b> no plano grátis o Google pode usar o que é enviado para melhorar os produtos dele, e há limite de pedidos por minuto e por dia. Bom para testar; para fotos de clientes em produção, use o plano pago.</p>
        </Cartao>
      )}

      {cfg.motorIA === 'claude' && (
        <Cartao className="grid gap-4 p-5">
          <Campo rotulo="Chave da API da Anthropic" dica="Fica só neste navegador. Use uma chave de teste com limite de gasto: no navegador ela pode ser lida por quem usar este aparelho.">
            <Entrada type="password" value={chave} onChange={(e) => setChave(e.target.value)} placeholder="sk-ant-…" autoComplete="off" />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={testarClaude} carregando={testando} disabled={!chave.trim()}><KeyRound className="size-4" />Testar e salvar</Botao>
            {cfg.apiKey && <Botao variante="fantasma" onClick={async () => { setChave(''); await salvarConfig({ apiKey: '', motorIA: 'demo' }); }}>Remover chave</Botao>}
          </div>
          <p className="text-sm text-texto2">Modelo: <b>Claude Opus 5.5</b> · cada foto é uma chamada.</p>
        </Cartao>
      )}
      {el}
    </div>
  );
}

function Seguranca({ u }: { u: Usuario }) {
  const [f, setF] = useState({ atual: '', nova: '', conf: '' });
  const [erro, setErro] = useState('');
  const { avisar, el } = useAviso();
  const salvar = async () => {
    setErro('');
    if ((await resumoSenha(u.sal, f.atual)) !== u.senhaHash) return setErro('A senha atual não confere.');
    if (f.nova.length < 6) return setErro('A nova senha precisa de pelo menos 6 caracteres.');
    if (f.nova !== f.conf) return setErro('A confirmação não bate com a nova senha.');
    const sal = novoId();
    await db.usuarios.update(u.id, { sal, senhaHash: await resumoSenha(sal, f.nova) });
    setF({ atual: '', nova: '', conf: '' });
    avisar('Senha alterada');
  };
  return (
    <Cartao className="grid max-w-lg gap-4 p-5">
      <h2 className="text-lg font-bold">Alterar senha</h2>
      <Campo rotulo="Senha atual"><Entrada type="password" value={f.atual} onChange={(e) => setF({ ...f, atual: e.target.value })} autoComplete="current-password" /></Campo>
      <Campo rotulo="Nova senha"><Entrada type="password" value={f.nova} onChange={(e) => setF({ ...f, nova: e.target.value })} autoComplete="new-password" /></Campo>
      <Campo rotulo="Confirmar nova senha"><Entrada type="password" value={f.conf} onChange={(e) => setF({ ...f, conf: e.target.value })} autoComplete="new-password" /></Campo>
      {erro && <p className="rounded-xl bg-critico-suave px-3 py-2 text-sm font-bold text-critico-texto">{erro}</p>}
      <Botao onClick={salvar}>Alterar senha</Botao>
      <p className="text-xs text-texto3">A senha é guardada só como resumo (SHA-256 com sal). Ninguém, nem o administrador, consegue lê-la.</p>
      {el}
    </Cartao>
  );
}

/* ---------- backup: exporta/importa tudo deste navegador ---------- */
async function blobPara(b: unknown) { return b instanceof Blob ? { __blob: await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(b); }) } : b; }
async function serializar(o: Record<string, unknown>) { const x: Record<string, unknown> = {}; for (const [k, v] of Object.entries(o)) x[k] = await blobPara(v); return x; }
async function desserializar(o: Record<string, unknown>) {
  const x: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) x[k] = v && typeof v === 'object' && '__blob' in v ? await (await fetch((v as { __blob: string }).__blob)).blob() : v;
  return x;
}

function Dados({ u }: { u: Usuario }) {
  const inp = useRef<HTMLInputElement>(null);
  const [apagar, setApagar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const { avisar, el } = useAviso();
  const admin = u.papel === 'admin';
  const exportar = async () => {
    setOcupado(true);
    const laudos = admin ? await db.laudos.toArray() : await db.laudos.where('usuarioId').equals(u.id).toArray();
    const fotos = await db.fotos.where('laudoId').anyOf(laudos.map((l) => l.id)).toArray();
    const json = JSON.stringify({ versao: 1, laudos: await Promise.all(laudos.map((l) => serializar(l as never))), fotos: await Promise.all(fotos.map((f) => serializar(f as never))) });
    baixar(`laudotech-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([json], { type: 'application/json' }));
    setOcupado(false);
  };
  const importar = async (f: File) => {
    setOcupado(true);
    try {
      const o = JSON.parse(await f.text()) as { laudos: Record<string, unknown>[]; fotos: Record<string, unknown>[] };
      const laudos = await Promise.all(o.laudos.map(desserializar));
      const fotos = await Promise.all(o.fotos.map(desserializar));
      await db.transaction('rw', db.laudos, db.fotos, async () => {
        await db.laudos.bulkPut(laudos.map((l) => ({ ...l, usuarioId: admin ? l.usuarioId : u.id })) as never);
        await db.fotos.bulkPut(fotos as never);
      });
      avisar(`${laudos.length} laudo(s) importado(s)`);
    } catch { avisar('Arquivo de backup inválido', 'erro'); }
    setOcupado(false);
  };
  return (
    <div className="grid gap-5">
      <Cartao className="grid gap-3 p-5">
        <h2 className="text-lg font-bold">Backup</h2>
        <p className="text-sm text-texto2">Tudo fica neste navegador. Exporte um arquivo para guardar ou levar para outro computador{admin ? ' (como admin, exporta os laudos de todos)' : ''}.</p>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={exportar} carregando={ocupado}><Download className="size-4" />Exportar backup</Botao>
          <Botao variante="claro" onClick={() => inp.current?.click()}><Upload className="size-4" />Importar backup</Botao>
          <input ref={inp} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = ''; }} />
        </div>
      </Cartao>
      <Cartao className="grid gap-3 border-critico/30 p-5">
        <h2 className="text-lg font-bold">Apagar meus laudos</h2>
        <p className="text-sm text-texto2">Remove os seus laudos e fotos deste navegador.</p>
        <div><Botao variante="perigo" onClick={() => setApagar(true)}><Trash2 className="size-4" />Apagar meus laudos</Botao></div>
      </Cartao>
      <Modal aberto={apagar} aoFechar={() => setApagar(false)} titulo="Apagar todos os seus laudos?">
        <p className="text-texto2">Todos os seus laudos e fotos serão apagados deste navegador. Não dá para desfazer. Exporte um backup antes, se quiser guardar.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={() => setApagar(false)}>Cancelar</Botao>
          <Botao variante="perigo" onClick={async () => {
            const ids = await db.laudos.where('usuarioId').equals(u.id).primaryKeys();
            await db.transaction('rw', db.laudos, db.fotos, async () => { await db.fotos.where('laudoId').anyOf(ids).delete(); await db.laudos.bulkDelete(ids); });
            setApagar(false); avisar('Laudos apagados');
          }}>Apagar</Botao>
        </div>
      </Modal>
      {el}
    </div>
  );
}

export function Configuracoes() {
  const { usuario } = useSessao();
  const cfg = useLiveQuery(lerConfig);
  const [busca, setBusca] = useSearchParams();
  const aba = (busca.get('aba') as Aba) || 'perfil';
  if (!usuario || !cfg) return null;
  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 md:px-8 md:py-9 pb-28">
      <h1 className="text-3xl font-extrabold md:text-4xl"><span className="grifo">Ajustes</span></h1>
      <p className="mt-1 text-texto2">Seu perfil, os modelos de laudo, a IA e os seus dados.</p>
      <nav className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-borda bg-sup p-1 sm:flex sm:w-fit" role="tablist">
        {ABAS.map(({ id, rotulo, ic: Ic }) => (
          <button key={id} role="tab" aria-selected={aba === id} onClick={() => setBusca({ aba: id }, { replace: true })}
            className={cx('flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-extrabold transition sm:flex-row sm:gap-2 sm:px-4 sm:text-sm', aba === id ? 'bg-[#121A2B] text-white dark:bg-tinta dark:text-[#0E1320]' : 'text-texto2 hover:bg-sup2 hover:text-texto')}>
            <Ic className="size-5 sm:size-4" />{rotulo}
          </button>
        ))}
      </nav>
      <div className="mt-5">
        {aba === 'perfil' && <Perfil u={usuario} />}
        {aba === 'modelos' && <Modelos />}
        {aba === 'ia' && <IA cfg={cfg} />}
        {aba === 'aparencia' && (
          <Cartao className="p-5">
            <h2 className="mb-4 text-lg font-bold">Tema</h2>
            <div className="grid grid-cols-3 gap-2">
              {([{ id: 'claro', t: 'Claro', ic: Sun }, { id: 'escuro', t: 'Escuro', ic: Moon }, { id: 'sistema', t: 'Do sistema', ic: Monitor }] as const).map(({ id, t, ic: Ic }) => (
                <button key={id} onClick={() => salvarConfig({ tema: id })} className={cx('flex flex-col items-center gap-2 rounded-2xl border p-4 font-bold transition', cfg.tema === id ? 'border-tinta bg-tinta/5 ring-2 ring-tinta/15' : 'border-borda hover:bg-sup2')}>
                  <Ic className="size-6" />{t}
                </button>
              ))}
            </div>
          </Cartao>
        )}
        {aba === 'seguranca' && <Seguranca u={usuario} />}
        {aba === 'dados' && <Dados u={usuario} />}
      </div>
    </div>
  );
}

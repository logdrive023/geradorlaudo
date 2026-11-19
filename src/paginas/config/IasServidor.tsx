import { useEffect, useState } from 'react';
import { Power, PowerOff, RotateCw, Sparkles } from 'lucide-react';
import { salvarConfig } from '../../db/db';
import { IAS, type Configuracao } from '../../dominio/modelo';
import { saudeServidor, SERVIDOR_PADRAO, type MotorServidor } from '../../ia/servidor';
import { Cartao, Dica } from '../../componentes/ui';
import { cx } from '../../lib/util';

const CHAVE_ENV: Record<string, string> = { gemini: 'GEMINI_API_KEY', claude: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY' };

/** Selo redondo com a inicial e a cor da IA. */
export function SeloIA({ id, tam = 36, apagado }: { id: string; tam?: number; apagado?: boolean }) {
  const ia = IAS[id];
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white', apagado && 'opacity-40 grayscale')}
      style={{ width: tam, height: tam, background: ia?.cor ?? '#64748b', fontSize: tam * 0.42 }} aria-hidden>
      {(ia?.nome ?? id).slice(0, 1)}
    </span>
  );
}

/**
 * Quais IAs do servidor analisam as fotos. Duas listas: Ligadas e Desligadas.
 * Pelo menos uma fica ligada. IA sem chave no servidor aparece desligada, sem botão.
 */
export function IasServidor({ cfg }: { cfg: Configuracao }) {
  const [motores, setMotores] = useState<MotorServidor[] | null>(null);
  const [principal, setPrincipal] = useState('');
  const [falhou, setFalhou] = useState(false);
  const carregar = () => {
    setFalhou(false); setMotores(null);
    saudeServidor(cfg.servidorUrl || SERVIDOR_PADRAO)
      .then((s) => { setPrincipal(s.ia); setMotores(s.motores ?? [{ nome: s.ia, modelo: s.modelo, pronta: true }]); })
      .catch(() => setFalhou(true));
  };
  useEffect(carregar, [cfg.servidorUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const prontas = (motores ?? []).filter((m) => m.pronta).map((m) => m.nome);
  const escolhidas = (cfg.iasLigadas ?? []).filter((n) => prontas.includes(n));
  const ligadas = escolhidas.length ? escolhidas : prontas.includes(principal) ? [principal] : prontas.slice(0, 1);
  const lista = motores ?? [];
  const on = lista.filter((m) => ligadas.includes(m.nome));
  const off = lista.filter((m) => !ligadas.includes(m.nome));
  const mudar = (nome: string, ligar: boolean) => salvarConfig({ iasLigadas: ligar ? [...ligadas, nome] : ligadas.filter((n) => n !== nome) });

  const Linha = ({ m, ligada }: { m: MotorServidor; ligada: boolean }) => {
    const ia = IAS[m.nome];
    const unica = ligada && ligadas.length === 1;
    return (
      <li className={cx('flex items-center gap-3 rounded-2xl border p-3 transition', ligada ? 'border-ok/40 bg-ok-suave/40' : 'border-borda bg-sup')}>
        <SeloIA id={m.nome} apagado={!ligada} />
        <span className="min-w-0 flex-1">
          <b className={cx('block truncate leading-tight', !ligada && 'text-texto2')}>{ia?.nome ?? m.nome}</b>
          <span className="block truncate text-xs text-texto3">{[ia?.empresa, m.modelo].filter(Boolean).join(' · ')}</span>
        </span>
        {ligada ? (
          unica
            ? <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2.5 py-1 text-xs font-extrabold text-white"><Power className="size-3.5" />Ligada</span>
            : <button onClick={() => mudar(m.nome, false)} className="inline-flex items-center gap-1 rounded-full border border-borda-forte bg-sup px-3 py-1.5 text-xs font-extrabold text-texto2 hover:border-critico hover:text-critico-texto"><PowerOff className="size-3.5" />Desligar</button>
        ) : m.pronta ? (
          <button onClick={() => mudar(m.nome, true)} className="inline-flex items-center gap-1 rounded-full bg-[#121A2B] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-obra hover:text-[#121A2B] dark:bg-tinta dark:text-[#0E1320]"><Power className="size-3.5" />Ligar</button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sup2 px-2.5 py-1 text-xs font-bold text-texto3">
            Sem chave<Dica texto={<>Para usar, coloque a chave <b>{CHAVE_ENV[m.nome] ?? 'da IA'}</b> no servidor (Render › Environment). A chave nunca fica no navegador.</>} />
          </span>
        )}
      </li>
    );
  };

  return (
    <Cartao className="grid gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-obra-suave text-obra-texto"><Sparkles className="size-5" /></span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">IAs que analisam suas fotos</h2>
          <p className="text-sm text-texto2">Ligue uma ou mais. Com mais de uma, cada achado mostra de qual IA veio e você escolhe na conferência.</p>
        </div>
      </div>

      {falhou ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-medio-suave p-3 text-sm text-medio-texto">
          Não deu para falar com o servidor agora (ele pode estar acordando).
          <button onClick={carregar} className="inline-flex items-center gap-1 font-extrabold underline underline-offset-2"><RotateCw className="size-3.5" />Tentar de novo</button>
        </p>
      ) : !motores ? (
        <div className="grid gap-2">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-sup2" />)}</div>
      ) : (
        <div className="grid gap-4">
          <section className="grid gap-2">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ok-texto"><span className="size-2 rounded-full bg-ok" />Ligadas · {on.length}</h3>
            <ul className="grid gap-2">{on.map((m) => <Linha key={m.nome} m={m} ligada />)}</ul>
          </section>
          {off.length > 0 && (
            <section className="grid gap-2">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-texto3"><span className="size-2 rounded-full bg-texto3" />Desligadas · {off.length}</h3>
              <ul className="grid gap-2">{off.map((m) => <Linha key={m.nome} m={m} ligada={false} />)}</ul>
            </section>
          )}
          {on.length > 1 && <p className="rounded-xl bg-sup2 px-3 py-2 text-xs text-texto2">Com {on.length} IAs, cada foto leva um pouco mais e é analisada {on.length} vezes. Você confere tudo na tela Conferir.</p>}
        </div>
      )}
    </Cartao>
  );
}

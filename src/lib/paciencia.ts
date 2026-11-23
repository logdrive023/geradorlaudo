import { semConexao } from '../db/nuvem';

/**
 * Pede ao servidor com paciência: sem resposta (sem internet ou o servidor grátis acordando),
 * tenta de novo a cada 5 s por até ~1 minuto antes de desistir. "aoEsperar" avisa a tela para mostrar "acordando".
 * Devolve uma função para cancelar (a tela saiu).
 */
export function comPaciencia<T>(pedir: () => Promise<T>, ok: (v: T) => void, falhou: (msg: string) => void, aoEsperar?: (esperando: boolean) => void) {
  let cancelado = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tentar = (n: number) => {
    pedir().then((v) => { if (!cancelado) { aoEsperar?.(false); ok(v); } }).catch((e) => {
      if (cancelado) return;
      if (semConexao(e) && n < 12) {
        aoEsperar?.(true);
        timer = setTimeout(() => tentar(n + 1), 5000);
        return;
      }
      aoEsperar?.(false);
      falhou((e as Error).message);
    });
  };
  tentar(0);
  return () => { cancelado = true; clearTimeout(timer); };
}

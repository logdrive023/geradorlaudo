export const novoId = () => crypto.randomUUID();

export const hoje = () => new Date().toISOString().slice(0, 10);

export function dataBR(v?: string | number): string {
  if (v === undefined || v === '') return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [a, m, d] = v.split('-');
    return `${d}/${m}/${a}`;
  }
  return new Date(v).toLocaleDateString('pt-BR');
}

export function dataExtenso(v?: string): string {
  const d = v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date();
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function haQuanto(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export const dois = (n: number) => String(n).padStart(2, '0');

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/** Resumo da senha: SHA-256 de "sal:senha". O app nunca guarda a senha. */
export async function resumoSenha(sal: string, senha: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sal}:${senha}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function baixar(nome: string, conteudo: Blob) {
  const url = URL.createObjectURL(conteudo);
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

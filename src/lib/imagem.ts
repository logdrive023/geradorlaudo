import exifr from 'exifr';

async function carregar(arquivo: Blob): Promise<ImageBitmap> {
  return createImageBitmap(arquivo, { imageOrientation: 'from-image' });
}

/**
 * Comprime para WebP (bem menor que JPEG na mesma qualidade). Se o navegador não gerar WebP
 * (o canvas devolve PNG nesse caso), cai para JPEG.
 */
async function comprimir(bmp: ImageBitmap, max: number, qualidade: number): Promise<{ blob: Blob; w: number; h: number }> {
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  const gerar = (tipo: string, q: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, tipo, q));
  let blob = await gerar('image/webp', qualidade);
  if (!blob || blob.type !== 'image/webp') blob = await gerar('image/jpeg', Math.min(0.85, qualidade + 0.06));
  if (!blob) throw new Error('Não deu para ler a imagem');
  return { blob, w, h };
}

/** Tamanhos: o suficiente para ler fissuras no laudo A4 e para a IA, sem gastar espaço à toa. */
export const FOTO_MAX_PX = 1280;
export const MINI_MAX_PX = 320;

/** Comprime a foto (WebP, máx. 1280 px ≈ 100–180 KB), gera a miniatura (≈ 10 KB) e lê data/GPS do EXIF. */
export async function prepararFoto(arquivo: File) {
  const bmp = await carregar(arquivo);
  const grande = await comprimir(bmp, FOTO_MAX_PX, 0.74);
  const mini = await comprimir(bmp, MINI_MAX_PX, 0.6);
  bmp.close();
  let tiradaEm: number | undefined;
  let gps: { lat: number; lng: number } | undefined;
  try {
    const exif = await exifr.parse(arquivo, { pick: ['DateTimeOriginal', 'latitude', 'longitude'], gps: true });
    if (exif?.DateTimeOriginal instanceof Date) tiradaEm = exif.DateTimeOriginal.getTime();
    if (typeof exif?.latitude === 'number' && typeof exif?.longitude === 'number') gps = { lat: exif.latitude, lng: exif.longitude };
  } catch { /* foto sem EXIF */ }
  return { imagem: grande.blob, miniatura: mini.blob, largura: grande.w, altura: grande.h, tiradaEm, gps };
}

/** Tipo de imagem aceito pelas IAs (o Blob guarda o tipo real: webp ou jpeg). */
export const tipoImagem = (b: Blob) => (b.type === 'image/webp' || b.type === 'image/png' ? b.type : 'image/jpeg') as 'image/webp' | 'image/png' | 'image/jpeg';

export function blobParaBase64(b: Blob): Promise<string> {
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] ?? '');
    r.onerror = () => falha(r.error);
    r.readAsDataURL(b);
  });
}

export function blobParaDataUrl(b: Blob): Promise<string> {
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => falha(r.error);
    r.readAsDataURL(b);
  });
}

/** Números simples da imagem, usados pelo motor de demonstração. */
export async function assinaturaImagem(b: Blob): Promise<{ hash: number; brilho: number; quente: number; verde: number }> {
  const bmp = await createImageBitmap(b);
  const c = document.createElement('canvas');
  c.width = 24; c.height = 24;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, 24, 24);
  bmp.close();
  const d = ctx.getImageData(0, 0, 24, 24).data;
  let hash = 2166136261, br = 0, q = 0, v = 0;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, bl] = [d[i], d[i + 1], d[i + 2]];
    br += (r + g + bl) / 3; q += r - bl; v += g - (r + bl) / 2;
    hash = Math.imul(hash ^ (r >> 3) ^ (g >> 2) ^ (bl >> 4), 16777619) >>> 0;
  }
  const n = d.length / 4;
  return { hash, brilho: br / n / 255, quente: q / n / 255, verde: v / n / 255 };
}

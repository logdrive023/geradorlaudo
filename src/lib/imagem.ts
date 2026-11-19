import exifr from 'exifr';

async function carregar(arquivo: Blob): Promise<ImageBitmap> {
  return createImageBitmap(arquivo, { imageOrientation: 'from-image' });
}

function paraJpeg(bmp: ImageBitmap, max: number, qualidade: number): Promise<{ blob: Blob; w: number; h: number }> {
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return new Promise((ok, falha) => c.toBlob((b) => (b ? ok({ blob: b, w, h }) : falha(new Error('Não deu para ler a imagem'))), 'image/jpeg', qualidade));
}

/** Comprime a foto (máx. 1600 px), gera a miniatura e lê data/GPS do EXIF. */
export async function prepararFoto(arquivo: File) {
  const bmp = await carregar(arquivo);
  const grande = await paraJpeg(bmp, 1600, 0.82);
  const mini = await paraJpeg(bmp, 360, 0.7);
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

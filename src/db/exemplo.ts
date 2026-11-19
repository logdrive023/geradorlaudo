import { db } from './db';
import type { Achado, Foto, Laudo } from '../dominio/modelo';
import { novoId, hoje } from '../lib/util';

/**
 * Laudo de exemplo com fotos DESENHADAS no navegador (parede com fissura, teto com umidade…),
 * já analisadas, para mostrar a conferência sem precisar de fotos reais.
 */

const W = 1200, H = 900;
type Ctx = CanvasRenderingContext2D;

function ruido(ctx: Ctx, base: [number, number, number], forca = 18, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = `rgb(${base.join(',')})`;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    const d = (rnd() - 0.5) * forca;
    ctx.fillStyle = `rgba(${base[0] + d},${base[1] + d},${base[2] + d},0.5)`;
    ctx.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 6, 3 + rnd() * 6);
  }
  return rnd;
}

function fissura(ctx: Ctx, rnd: () => number, x: number, y: number, dx: number, dy: number, passos: number, larg = 3) {
  ctx.strokeStyle = 'rgba(40,36,32,.85)';
  ctx.lineCap = 'round';
  let px = x, py = y;
  for (let i = 0; i < passos; i++) {
    const nx = px + dx + (rnd() - 0.5) * 14, ny = py + dy + (rnd() - 0.5) * 14;
    ctx.lineWidth = Math.max(0.8, larg * (1 - i / passos));
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
    if (rnd() > 0.82) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + (rnd() - 0.5) * 50, ny + rnd() * 40); ctx.stroke(); }
    px = nx; py = ny;
  }
}

function mancha(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, 0.3, 0, Math.PI * 2); ctx.fill();
}

const DESENHOS: Record<string, (ctx: Ctx) => void> = {
  sala: (ctx) => {
    const rnd = ruido(ctx, [232, 226, 214], 14, 3);
    ctx.fillStyle = '#c9d6e6'; ctx.fillRect(220, 180, 380, 300); // janela
    ctx.strokeStyle = '#f4f4f2'; ctx.lineWidth = 18; ctx.strokeRect(220, 180, 380, 300);
    ctx.beginPath(); ctx.moveTo(410, 180); ctx.lineTo(410, 480); ctx.stroke();
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, 800, W, 100); // rodapé/piso
    fissura(ctx, rnd, 610, 185, 18, -6, 6, 3);
    fissura(ctx, rnd, 610, 470, 22, 24, 13, 3.5);
  },
  banheiro: (ctx) => {
    ruido(ctx, [238, 238, 234], 10, 7);
    ctx.fillStyle = '#e2e6e8';
    for (let y = 560; y < H; y += 60) for (let x = 0; x < W; x += 60) { ctx.fillRect(x + 2, y + 2, 56, 56); }
    mancha(ctx, 480, 320, 210, 'rgba(120,110,80,.55)');
    mancha(ctx, 520, 300, 120, 'rgba(90,80,60,.5)');
    for (let i = 0; i < 260; i++) { ctx.fillStyle = 'rgba(30,40,30,.55)'; ctx.beginPath(); ctx.arc(720 + Math.sin(i) * 120 + (i % 13) * 6, 330 + Math.cos(i * 1.7) * 70, 2 + (i % 4), 0, 7); ctx.fill(); }
  },
  cozinha: (ctx) => {
    const rnd = ruido(ctx, [214, 206, 192], 10, 11);
    ctx.strokeStyle = '#bdb3a3'; ctx.lineWidth = 6;
    for (let x = 0; x <= W; x += 200) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 200) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    fissura(ctx, rnd, 180, 470, 40, 8, 16, 2.5);
    fissura(ctx, rnd, 520, 540, 30, 10, 10, 2);
  },
  fachada: (ctx) => {
    const rnd = ruido(ctx, [206, 178, 140], 22, 19);
    for (let i = 0; i < 50; i++) mancha(ctx, 120 + rnd() * 640, 640 + rnd() * 220, 30 + rnd() * 60, 'rgba(255,255,255,.55)');
    ctx.fillStyle = '#9a8f80'; ctx.fillRect(720, 60, 360, 200);
    ctx.fillStyle = '#7d7468'; ctx.beginPath(); ctx.moveTo(740, 80); ctx.lineTo(1040, 70); ctx.lineTo(1000, 220); ctx.lineTo(780, 240); ctx.fill();
    ctx.fillStyle = '#5b6f86'; ctx.fillRect(180, 200, 260, 320);
  },
  garagem: (ctx) => {
    ruido(ctx, [168, 168, 164], 26, 23);
    ctx.fillStyle = '#b8b8b3'; ctx.fillRect(0, 300, W, 260);
    ctx.fillStyle = '#6e5a46'; ctx.fillRect(320, 330, 560, 190);
    ctx.strokeStyle = '#8a4b22'; ctx.lineWidth = 12;
    for (const y of [380, 460]) { ctx.beginPath(); ctx.moveTo(330, y); ctx.lineTo(870, y + 6); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(150,70,30,.6)'; ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(400, 560); ctx.lineTo(420, 760); ctx.stroke();
  },
  corredor: (ctx) => {
    ruido(ctx, [236, 232, 224], 8, 29);
    ctx.fillStyle = '#d9cdb8'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(420, 560); ctx.lineTo(780, 560); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(470, 250, 260, 310);
  },
};

const EXEMPLO: { desenho: string; ambiente: string; elemento: string; legenda: string; achados: Omit<Achado, 'id' | 'aceito' | 'origem'>[] }[] = [
  { desenho: 'sala', ambiente: 'Sala', elemento: 'Parede', legenda: 'Sala: fissuras partindo dos cantos da janela.', achados: [
    { tipo: 'Fissura', sistema: 'Vedações', descricao: 'Fissura inclinada a partir do canto inferior direito da janela, abertura estimada < 1 mm.', gravidade: 'medio', causaProvavel: 'Ausência ou insuficiência de contraverga.', recomendacao: 'Tratar com tela de poliéster e argamassa flexível; monitorar com selo de gesso.', confianca: 0.86, regiao: { x: 49, y: 50, w: 28, h: 40 } },
    { tipo: 'Fissura', sistema: 'Vedações', descricao: 'Fissura curta no canto superior direito da janela.', gravidade: 'minimo', causaProvavel: 'Concentração de tensões na verga.', recomendacao: 'Tratar junto com a fissura inferior.', confianca: 0.71, regiao: { x: 49, y: 13, w: 14, h: 10 } },
  ] },
  { desenho: 'banheiro', ambiente: 'Banheiro', elemento: 'Teto', legenda: 'Banheiro: mancha de umidade e bolor no teto.', achados: [
    { tipo: 'Infiltração / umidade', sistema: 'Impermeabilização', descricao: 'Mancha de umidade extensa no forro, com halo amarelado.', gravidade: 'medio', causaProvavel: 'Vazamento ou falha de impermeabilização no pavimento superior.', recomendacao: 'Teste de estanqueidade no andar de cima e correção da impermeabilização.', confianca: 0.81, regiao: { x: 22, y: 12, w: 40, h: 46 } },
    { tipo: 'Mofo / bolor', sistema: 'Revestimentos', descricao: 'Pontos de bolor concentrados à direita da mancha.', gravidade: 'minimo', causaProvavel: 'Umidade persistente e pouca ventilação.', recomendacao: 'Limpeza com hipoclorito e pintura antimofo após sanar a umidade.', confianca: 0.74, regiao: { x: 50, y: 26, w: 22, h: 22 } },
  ] },
  { desenho: 'cozinha', ambiente: 'Cozinha', elemento: 'Piso', legenda: 'Cozinha: placas cerâmicas trincadas.', achados: [
    { tipo: 'Piso ou cerâmica trincada', sistema: 'Pisos', descricao: 'Trinca atravessando três placas cerâmicas.', gravidade: 'minimo', causaProvavel: 'Falta de junta de movimentação ou assentamento sem dupla colagem.', recomendacao: 'Substituir as placas e prever juntas conforme NBR 13753.', confianca: 0.78, regiao: { x: 13, y: 46, w: 62, h: 22 } },
  ] },
  { desenho: 'fachada', ambiente: 'Fachada', elemento: 'Revestimento externo', legenda: 'Fachada: eflorescência na base e reboco destacado no alto.', achados: [
    { tipo: 'Destacamento de revestimento', sistema: 'Revestimentos', descricao: 'Trecho de reboco destacado junto à platibanda, com material solto.', gravidade: 'critico', causaProvavel: 'Perda de aderência por infiltração; risco de queda sobre o passeio.', recomendacao: 'Isolar a área abaixo e remover as partes soltas imediatamente; refazer o revestimento.', confianca: 0.84, regiao: { x: 59, y: 5, w: 32, h: 25 } },
    { tipo: 'Eflorescência', sistema: 'Revestimentos', descricao: 'Depósitos esbranquiçados na base da parede.', gravidade: 'minimo', causaProvavel: 'Umidade ascendente por capilaridade.', recomendacao: 'Barreira química na base e recomposição do revestimento.', confianca: 0.72, regiao: { x: 8, y: 66, w: 58, h: 30 } },
  ] },
  { desenho: 'garagem', ambiente: 'Garagem', elemento: 'Viga', legenda: 'Garagem: viga com armadura exposta e oxidada.', achados: [
    { tipo: 'Corrosão de armadura', sistema: 'Estrutura', descricao: 'Desplacamento do cobrimento com duas barras longitudinais expostas e oxidadas.', gravidade: 'critico', causaProvavel: 'Cobrimento insuficiente e carbonatação do concreto.', recomendacao: 'Avaliação estrutural; limpeza da armadura, inibidor de corrosão e recomposição com graute.', confianca: 0.88, regiao: { x: 26, y: 36, w: 48, h: 23 } },
  ] },
  { desenho: 'corredor', ambiente: 'Corredor', elemento: 'Vista geral', legenda: 'Corredor: sem anomalias aparentes.', achados: [] },
];

function desenhar(nome: string): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  DESENHOS[nome](c.getContext('2d')!);
  return new Promise((ok) => c.toBlob((b) => ok(b!), 'image/webp', 0.74));
}

async function miniatura(b: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(b);
  const c = document.createElement('canvas');
  c.width = 360; c.height = 270;
  c.getContext('2d')!.drawImage(bmp, 0, 0, 360, 270);
  return new Promise((ok) => c.toBlob((x) => ok(x!), 'image/webp', 0.6));
}

export async function criarLaudoExemplo(usuarioId: string): Promise<string> {
  const id = novoId();
  const agora = Date.now();
  const laudo: Laudo = {
    id, usuarioId, tipo: 'cautelar', titulo: 'Vistoria — Rua das Acácias, 120', status: 'conferencia',
    dados: {
      solicitante: 'Construtora Horizonte Ltda.', obra: 'Edifício Residencial Jardim das Acácias (terreno vizinho)',
      endereco: 'Rua das Acácias, 120 — Vila Mariana', cidadeUf: 'São Paulo / SP', cep: '04101-000',
      ocupante: 'Maria Souza — (11) 90000-0000', acompanhante: 'Maria Souza (proprietária)',
      uso: 'Residencial', edificacao: 'Sobrado', padrao: 'Normal / convencional', conservacao: 'Regular',
      idade: '30 anos (aparente)', pavimentos: '2', area: '180', estrutura: 'Concreto armado e alvenaria de vedação',
      dataVistoria: hoje(), art: '', observacoes: 'Imóvel ocupado. Todos os ambientes foram acessados, exceto o telhado.',
    },
    conclusao: '', criadoEm: agora, atualizadoEm: agora,
  };
  const fotos: Foto[] = [];
  for (const [i, e] of EXEMPLO.entries()) {
    const imagem = await desenhar(e.desenho);
    fotos.push({
      id: novoId(), laudoId: id, ordem: i, nomeArquivo: `${e.desenho}.jpg`, imagem, miniatura: await miniatura(imagem),
      largura: W, altura: H, tiradaEm: agora - (6 - i) * 60000, status: i === 0 ? 'conferida' : 'analisada',
      analise: {
        ambiente: e.ambiente, elemento: e.elemento, legenda: e.legenda, semAnomalia: e.achados.length === 0,
        achados: e.achados.map((a) => ({ ...a, id: novoId(), aceito: i === 0 ? true : null, origem: 'demo' as const })),
        origem: 'demo', analisadoEm: agora,
      },
      criadoEm: agora,
    });
  }
  await db.transaction('rw', db.laudos, db.fotos, async () => {
    await db.laudos.add(laudo);
    await db.fotos.bulkAdd(fotos);
  });
  return id;
}

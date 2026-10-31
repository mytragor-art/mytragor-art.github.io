import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { normalizeLogo } from '../scripts/logo-image.mjs';

test('logo oficial recortado e transparente mantém detalhes brancos internos', async () => {
  const pixels = Buffer.alloc(7 * 7 * 4, 255);
  for (let y = 1; y < 6; y++) for (let x = 1; x < 6; x++) {
    if (x !== 1 && x !== 5 && y !== 1 && y !== 5) continue;
    const i = (y * 7 + x) * 4; pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
  }
  const source = await sharp(pixels, { raw:{width:7,height:7,channels:4} }).png().toBuffer();
  const {data,info} = await sharp(await normalizeLogo(source)).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width, 11); assert.equal(info.height, 11);
  assert.equal(data[3], 0);
  assert.deepEqual([...data.subarray((5 * 11 + 5) * 4, (5 * 11 + 5) * 4 + 4)], [255,255,255,255]);
});
test('todas as páginas usam o logo oficial no cabeçalho e rodapé', async () => {
  for (const file of ['index.html','cartas/index.html','baralho/index.html','comojogar/index.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal((html.match(/src="\/media\/logo-mytragor.webp"/g) || []).length, 2, file);
    assert.ok(!html.includes('◈ MYTRAGOR'), file);
  }
  const meta = await sharp(fileURLToPath(new URL('../media/logo-mytragor.webp', import.meta.url))).metadata();
  assert.ok(meta.width < 500 && meta.height < 120);
  assert.equal(meta.hasAlpha, true);
});

test('recorte limpa espaços brancos fechados e remove o halo cinza do contorno', async () => {
  const width = 24, height = 24;
  const pixels = Buffer.alloc(width * height * 4, 255);
  for (let y = 2; y <= 21; y++) for (let x = 2; x <= 21; x++) {
    const edge = x === 2 || x === 21 || y === 2 || y === 21;
    const border = x <= 4 || x >= 19 || y <= 4 || y >= 19;
    if (!border) continue;
    const offset = (y * width + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = edge ? 180 : 0;
  }
  const source = await sharp(pixels, { raw:{width,height,channels:4} }).png().toBuffer();
  const {data,info} = await sharp(await normalizeLogo(source)).raw().toBuffer({resolveWithObject:true});
  const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * 4;
  assert.equal(data[center + 3], 0, 'O espaço fechado entre os contornos deve ser transparente.');
  const fringe = (3 * info.width + 3) * 4;
  assert.deepEqual([...data.subarray(fringe, fringe + 4)], [0,0,0,75], 'O antisserrilhado não deve carregar o fundo branco.');
});
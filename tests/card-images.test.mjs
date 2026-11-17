import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { cards } from '../data/cards.js';
import { CARD_WIDTH, CARD_HEIGHT, visibleBounds, normalizeCard } from '../scripts/card-images.mjs';

test('recorte considera somente alpha e preserva borda, branco e pixels semitransparentes', () => {
  const data = Buffer.alloc(8 * 8 * 4);
  const pixel = (x, y, rgba) => data.set(rgba, (y * 8 + x) * 4);
  pixel(2, 1, [0, 0, 0, 1]);
  pixel(5, 6, [255, 255, 255, 255]);
  pixel(0, 0, [255, 255, 255, 0]);
  assert.deepEqual(visibleBounds(data, { width: 8, height: 8, channels: 4 }), { left: 2, top: 1, width: 4, height: 6 });
  assert.throws(() => visibleBounds(Buffer.alloc(16), { width: 2, height: 2, channels: 4 }), /transparente/);
});

test('margens diferentes geram a mesma carta, sem distorcer a arte', async () => {
  const source = await sharp({ create: { width: 40, height: 56, channels: 4, background: '#542335' } }).png().toBuffer();
  const padded = await sharp(source).extend({ left: 30, right: 12, top: 7, bottom: 3, background: '#00000000' }).png().toBuffer();
  const [plain, trimmed] = await Promise.all([normalizeCard(source), normalizeCard(padded)]);
  assert.deepEqual(plain, trimmed);
});

test('todas as cartas publicadas têm 650 × 900 e enquadramento proporcional ao original', async () => {
  for (const card of cards) {
    const source = fileURLToPath(new URL(`..${card.image}`, import.meta.url));
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, CARD_WIDTH, card.name);
    assert.equal(info.height, CARD_HEIGHT, card.name);
    const bounds = visibleBounds(data, info);
    const original = sharp(fileURLToPath(new URL(`..${card.original}`, import.meta.url)));
    if (card.crop) original.extract(card.crop);
    const raw = await original.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const content = visibleBounds(raw.data, raw.info);
    const scale = Math.min(CARD_WIDTH / content.width, CARD_HEIGHT / content.height);
    const width = Math.round(content.width * scale);
    const height = Math.round(content.height * scale);
    assert.ok(Math.abs(bounds.width - width) <= 2 && Math.abs(bounds.height - height) <= 2, `${card.name}: tamanho visível inconsistente`);
    assert.ok(Math.abs(bounds.left - (CARD_WIDTH - width) / 2) <= 2 &&
      Math.abs(bounds.top - (CARD_HEIGHT - height) / 2) <= 2, `${card.name}: carta descentralizada`);
  }
});

test('equipamentos publicados usam o layout atual nas três resoluções', async () => {
  for (const card of cards.filter(entry => entry.type === 'Equipamento')) {
    const source = fileURLToPath(new URL(`..${card.original}`, import.meta.url));
    const image = await normalizeCard(source, { crop: card.crop });
    const thumbnail = await sharp(image).resize(325, 450).webp({ quality: 72 }).toBuffer();
    const reading = await normalizeCard(source, { crop: card.crop, width: 1300, height: 1800, quality: 84 });
    for (const [url, expected] of [[card.image, image], [card.thumbnail, thumbnail], [card.reading, reading]]) {
      assert.ok((await readFile(new URL(`..${url}`, import.meta.url))).equals(expected), `${card.name}: ${url}`);
    }
  }
});

test('Redoma Santa preserva o layout completo sem borda branca inferior', async () => {
  const card = cards.find(entry => entry.id === 'redomasanta');
  assert.equal(card.crop, undefined);
  for (const url of [card.image, card.thumbnail, card.reading]) {
    const output = await sharp(fileURLToPath(new URL(`..${url}`, import.meta.url)))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let x = 0; x < output.info.width; x++) {
      const offset = ((output.info.height - 1) * output.info.width + x) * 4;
      assert.ok(output.data[offset + 3] === 0 || Math.min(...output.data.subarray(offset, offset + 3)) < 235,
        `${url}: borda branca inferior`);
    }
  }
});
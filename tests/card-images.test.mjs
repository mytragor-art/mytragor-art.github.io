import { test } from 'node:test';
import assert from 'node:assert/strict';
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

test('todas as cartas publicadas têm 650 × 900 e preenchimento visual uniforme', async () => {
  for (const card of cards) {
    const source = fileURLToPath(new URL(`..${card.image}`, import.meta.url));
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, CARD_WIDTH, card.name);
    assert.equal(info.height, CARD_HEIGHT, card.name);
    const bounds = visibleBounds(data, info);
    assert.ok(bounds.left <= 2 && bounds.top <= 2, `${card.name}: margem inicial excessiva`);
    assert.ok(bounds.width >= CARD_WIDTH - 3 && bounds.height >= CARD_HEIGHT - 3, `${card.name}: tamanho visível inconsistente`);
  }
});
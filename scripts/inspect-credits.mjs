import sharp from 'sharp';
import { cards } from '../data/cards.js';
import { collectionVariants, fragments } from '../data/gallery.js';
import { tmpdir } from 'node:os';
import path from 'node:path';

const entries = process.argv.includes('--variants') ? [...collectionVariants, ...fragments] : cards;
for (let start = 0; start < entries.length; start += 18) {
  const composites = [];
  for (const [index, card] of entries.slice(start, start + 18).entries()) {
    const source = path.resolve(`.${card.reading}`);
    const { width, height } = await sharp(source).metadata();
    const crop = await sharp(source).extract({ left: Math.floor(width * .32), top: Math.floor(height * .935), width: Math.floor(width * .68), height: Math.floor(height * .065) }).resize(680, 90, { fit: 'contain' }).png().toBuffer();
    const label = Buffer.from(`<svg width="680" height="32"><rect width="100%" height="100%" fill="#fff"/><text x="12" y="23" font-size="20">${card.id}</text></svg>`);
    const left = index % 2 * 680, top = Math.floor(index / 2) * 122;
    composites.push({ input: label, left, top }, { input: crop, left, top: top + 32 });
  }
  const output = path.join(tmpdir(), `mytragor-credits-${process.argv.includes('--variants') ? 'variants-' : ''}${start}.png`);
  await sharp({ create: { width: 1360, height: Math.ceil(Math.min(18, entries.length - start) / 2) * 122, channels: 3, background: '#ffffff' } }).composite(composites).png().toFile(output);
  console.log(output);
}
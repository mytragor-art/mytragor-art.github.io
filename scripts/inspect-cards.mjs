import sharp from 'sharp';
import { cards } from '../data/cards.js';
import { fileURLToPath } from 'node:url';
import { visibleBounds } from './card-images.mjs';

for (const card of cards) {
  const { data, info } = await sharp(fileURLToPath(new URL(`..${card.original}`, import.meta.url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = visibleBounds(data, info);
  const sample = (x, y) => [...data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4)];
  console.log(JSON.stringify({ id: card.id, width: info.width, height: info.height, bounds, corners: [sample(0,0), sample(info.width - 1,0), sample(0,info.height - 1), sample(info.width - 1,info.height - 1)] }));
}
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeCard } from './card-images.mjs';
import { cardById } from '../data/cards.js';

const ids = process.argv.slice(2);
if (!ids.length || ids.some(id => !cardById.has(id))) throw new Error('Informe IDs válidos das cartas a atualizar.');
const local = url => fileURLToPath(new URL(`..${url}`, import.meta.url));
for (const id of ids) {
  const card = cardById.get(id);
  const source = local(card.original);
  await writeFile(local(card.image), await normalizeCard(source));
  await writeFile(local(card.thumbnail), await sharp(local(card.image)).resize(325, 450).webp({ quality: 72 }).toBuffer());
  await writeFile(local(card.reading), await normalizeCard(source, { width: 1300, height: 1800, quality: 84 }));
  console.log(`${card.name}: carta, miniatura e ampliação atualizadas; ilustração sem moldura preservada.`);
}
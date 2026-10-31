import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { normalizeCard } from './card-images.mjs';
import { collectionVariants, fragments } from '../data/gallery.js';
import { normalizeLogo } from './logo-image.mjs';
import { buildArchive } from './build-archive.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'media');
await mkdir(path.join(output, 'cartas'), { recursive: true });
await mkdir(path.join(output, 'manual'), { recursive: true });
await mkdir(path.join(output, 'cartas', 'thumbs'), { recursive: true });
await mkdir(path.join(output, 'cartas', 'leitura'), { recursive: true });
await writeFile(path.join(output, 'logo-mytragor.webp'), await normalizeLogo(path.join(root, 'Ilustraçoes', 'logo.png')));
const cards = (await readdir(path.join(root, 'cartas.png')))
  .filter(name => /^layout-/i.test(name) && /\.png$/i.test(name) && !/^layout-(branco|fragmento_)/i.test(name))
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));

for (const name of cards) {
  const image = await normalizeCard(path.join(root, 'cartas.png', name));
  await writeFile(path.join(output, 'cartas', name.replace(/\.png$/i, '.webp')), image);
}
for (const entry of [...collectionVariants, ...fragments]) {
  const image = await normalizeCard(path.join(root, entry.original.slice(1)), { crop: entry.crop });
  await writeFile(path.join(root, entry.image.slice(1)), image);
}
// Small catalog previews and readable zooms share exactly the same framing.
const { cards: baseCards } = await import('../data/cards.js');
for (const entry of [...baseCards, ...collectionVariants, ...fragments]) {
  const file = path.basename(entry.image);
  const thumbnail = await sharp(path.join(root, entry.image.slice(1))).resize(325, 450).webp({ quality: 72 }).toBuffer();
  await writeFile(path.join(output, 'cartas', 'thumbs', file), thumbnail);
  const reading = await normalizeCard(path.join(root, entry.original.slice(1)), { crop: entry.crop, width: 1300, height: 1800, quality: 84 });
  await writeFile(path.join(output, 'cartas', 'leitura', file), reading);
}
await buildArchive(root);
const manual = ['manual_capa.png', ...Array.from({ length: 21 }, (_, i) => `manual_pg${i + 1}.${i === 10 ? 'jpg' : 'png'}`)];
for (const [index, name] of manual.entries()) {
  await sharp(path.join(root, 'manual', name)).resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 85 }).toFile(path.join(output, 'manual', `${index + 1}.webp`));
}
await sharp(path.join(root, 'Ilustraçoes', 'CaminhosPerigosos-final.png'))
  .resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(output, 'mundo.webp'));
await sharp(path.join(root, 'Ilustraçoes', 'valvrakvick.png'))
  .resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(output, 'valbrak.webp'));
console.log(`Geradas ${cards.length} cartas base, ${collectionVariants.length} versões de coleção, ${fragments.length} Fragmentos, ${manual.length} páginas e 2 ilustrações. Originais preservados.`);

// Contact sheets are diagnostic artifacts, written outside the published website.
if (process.argv.includes('--contact-sheet')) {
  const { tmpdir } = await import('node:os');
  for (let start = 0; start < cards.length; start += 24) {
    const batch = cards.slice(start, start + 24);
    const tiles = await Promise.all(batch.map(async (name, i) => {
      const source = sharp(path.join(root, 'cartas.png', name));
      const { width, height } = await source.metadata();
      const title = await source.clone().extract({ left: 0, top: 0, width, height: Math.round(height * .17) }).resize(400, 90, { fit: 'contain' }).png().toBuffer();
      const band = await source.clone().extract({ left: 0, top: Math.round(height * .62), width, height: Math.round(height * .15) }).resize(400, 90, { fit: 'contain' }).png().toBuffer();
      const label = Buffer.from(`<svg width="400" height="25"><rect width="400" height="25" fill="white"/><text x="5" y="18" font-size="13">${name.replaceAll('&', '&amp;')}</text></svg>`);
      const tile = await sharp({ create: { width: 400, height: 205, channels: 3, background: '#dddddd' } }).composite([{ input: label, top: 0, left: 0 }, { input: title, top: 25, left: 0 }, { input: band, top: 115, left: 0 }]).png().toBuffer();
      return { input: tile, left: (i % 3) * 400, top: Math.floor(i / 3) * 205 };
    }));
    const target = path.join(tmpdir(), `mytragor-catalog-${start}.jpg`);
    await sharp({ create: { width: 1200, height: Math.ceil(batch.length / 3) * 205, channels: 3, background: 'white' } }).composite(tiles).jpeg().toFile(target);
    console.log(target);
  }
}
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../media/propagandas/', import.meta.url);
await mkdir(output, { recursive: true });
await sharp(fileURLToPath(new URL('../propagandas/Mytragor-Pre-Campanha-Simulador.png', import.meta.url)))
  .webp({ quality: 92, effort: 6 })
  .toFile(fileURLToPath(new URL('mytragor-pre-campanha.webp', output)));
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Dedicated landscape crop: keep Gamboa from the arrow tip upward.
await sharp(fileURLToPath(new URL('../media/acervo/ilustracoes/gamboa full.png.webp', import.meta.url)))
  .extract({ left: 0, top: 0, width: 1143, height: 650 })
  .webp({ quality: 88 })
  .toFile(fileURLToPath(new URL('../media/acervo/ilustracoes/gamboa-banner.webp', import.meta.url)));
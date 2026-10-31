import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Official promotional artwork from https://conexaotcgbrasil.com.br/.
const output = new URL('../media/eventos/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [source, filename, width] of [
  ['aaf3233a-b397-4724-820d-e526fcbbbf57/logo-horizontal.png', 'conexao-tcg-logo.webp', 720],
  ['8dff31b4-26dc-4521-9be2-f295256ecfe3/mascote-conexao-tcg.webp', 'conexao-tcg-nanda.webp', 600]
]) {
  const response = await fetch(`https://conexaotcgbrasil.com.br/__l5e/assets-v1/${source}`);
  if (!response.ok) throw new Error(`Failed to download ${filename}: ${response.status}`);
  const image = Buffer.from(await response.arrayBuffer());
  await sharp(image).trim().resize({ width, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6 })
    .toFile(fileURLToPath(new URL(filename, output)));
}
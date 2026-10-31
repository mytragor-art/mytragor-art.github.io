import sharp from 'sharp';

export const CARD_WIDTH = 650;
export const CARD_HEIGHT = 900;

// Inspect alpha only: dark frames, white artwork, text and credits are content,
// not a background to trim. Keep even partially transparent anti-aliased edges.
export function visibleBounds(data, { width, height, channels }) {
  if (channels !== 4) throw new Error('O recorte requer uma imagem RGBA.');
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * channels;
    let first = 0;
    while (first < width && data[row + first * channels + 3] === 0) first++;
    if (first === width) continue;
    let last = width - 1;
    while (last > first && data[row + last * channels + 3] === 0) last--;
    left = Math.min(left, first);
    right = Math.max(right, last);
    top = Math.min(top, y);
    bottom = y;
  }
  if (right < left) throw new Error('A imagem da carta está completamente transparente.');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export async function normalizeCard(source, { crop, width = CARD_WIDTH, height = CARD_HEIGHT, quality = 85 } = {}) {
  const input = sharp(source);
  if (crop) input.extract(crop);
  const { data, info } = await input.toColourspace('srgb').ensureAlpha()
    .raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
  const bounds = visibleBounds(data, info);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extract(bounds)
    .resize({ width, height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality }).toBuffer();
}
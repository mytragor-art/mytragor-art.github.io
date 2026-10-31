import sharp from 'sharp';
import { visibleBounds } from './card-images.mjs';

// The supplied logo is flattened on white, not a transparent PNG. Remove
// white negative spaces too, while retaining small specular highlights.
export async function normalizeLogo(source) {
  const { data, info } = await sharp(source).toColourspace('srgb').ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height);
  const background = new Uint8Array(width * height);
  function neighbors(index) {
    const x = index % width, y = Math.floor(index / width);
    return [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1,
      y > 0 ? index - width : -1, y < height - 1 ? index + width : -1].filter(i => i >= 0);
  }
  for (let start = 0; start < width * height; start++) {
    if (seen[start]) continue;
    const queue = [start], region = [];
    let touchesEdge = false;
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], offset = index * 4;
      if (Math.min(data[offset], data[offset + 1], data[offset + 2]) < 235) continue;
      region.push(index);
      const x = index % width, y = Math.floor(index / width);
      touchesEdge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
      for (const next of neighbors(index)) if (!seen[next]) { seen[next] = 1; queue.push(next); }
    }
    if (touchesEdge || region.length >= 40) for (const index of region) {
      background[index] = 1; data[index * 4 + 3] = 0;
    }
  }
  // Undo the white matte on the anti-aliased black outline. Simply deleting
  // white pixels leaves an ugly grey/white halo against the site's dark theme.
  const fringe = new Set();
  for (let index = 0; index < background.length; index++) if (!background[index] && neighbors(index).some(i => background[i])) fringe.add(index);
  for (const index of fringe) {
    const offset = index * 4;
    const min = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const max = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    if (max - min > 30 || min === 255) continue;
    const alpha = 1 - min / 255;
    for (let channel = 0; channel < 3; channel++) data[offset + channel] = Math.round((data[offset + channel] - min) / alpha);
    data[offset + 3] = Math.round(data[offset + 3] * alpha);
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .extract(visibleBounds(data, info))
    .extend({ top: 3, bottom: 3, left: 3, right: 3, background: '#00000000' })
    .webp({ lossless: true }).toBuffer();
}
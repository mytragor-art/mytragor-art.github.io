import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
const manifest = JSON.parse(await readFile(new URL('../media/acervo/index.json', import.meta.url)));
const entries = manifest.entries.filter(entry => entry.source.startsWith('/Ilustraçoes/'));
for (let start = 0; start < entries.length; start += 24) {
  const composites = [];
  for (const [i, entry] of entries.slice(start, start + 24).entries()) {
    const image = await sharp(path.resolve(`.${entry.image}`)).resize(250, 210, { fit: 'contain', background: '#252525' }).png().toBuffer();
    const name = entry.source.split('/').pop().replace(/[<>&]/g, '');
    const label = Buffer.from(`<svg width="250" height="46"><rect width="100%" height="100%" fill="white"/><text x="5" y="17" font-size="11">${start+i}: ${name.slice(0,37)}</text><text x="5" y="34" font-size="11">${name.slice(37)}</text></svg>`);
    const left = i % 4 * 250, top = Math.floor(i / 4) * 256;
    composites.push({input:image,left,top},{input:label,left,top:top+210});
  }
  const output = path.join(tmpdir(), `mytragor-art-${start}.jpg`);
  await sharp({create:{width:1000,height:Math.ceil(Math.min(24, entries.length-start)/4)*256,channels:3,background:'#fff'}}).composite(composites).jpeg({quality:90}).toFile(output);
  console.log(output);
}
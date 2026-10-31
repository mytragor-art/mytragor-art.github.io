import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildArchive } from '../scripts/build-archive.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const groups = [
  { source: 'Ilustraçoes', output: 'ilustracoes', width: 1600, height: 1600 },
  { source: 'cartas.png', output: 'cartas', width: 1300, height: 1800 },
];

// Independent enumeration: do not let an omission in the builder hide missing sources.
async function sources(directory, prefix = '') {
  let children;
  try {
    children = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT' && !prefix) return null;
    throw error;
  }
  const result = [];
  for (const child of children) {
    const name = prefix ? `${prefix}/${child.name}` : child.name;
    if (child.isDirectory()) result.push(...await sources(path.join(directory, child.name), name));
    else if (child.isFile() && /\.(jpg|jpeg|png|webp|tif|tiff)$/i.test(child.name)) result.push(name);
  }
  return result.sort();
}

test('acervo publicado cobre originais, conserva dimensões e reduz o tamanho total', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'media/acervo/index.json'), 'utf8'));
  assert.equal(manifest.version, 1);
  assert.ok(Array.isArray(manifest.entries));
  assert.ok(manifest.entries.length > 0, 'O manifesto publicado não pode estar vazio');
  assert.deepEqual(manifest.entries.map(entry => entry.source),
    [...new Set(manifest.entries.map(entry => entry.source))].sort(), 'Fontes únicas em ordem determinística');

  for (const group of groups) {
    const names = await sources(path.join(root, group.source));
    if (names !== null) {
      assert.deepEqual(manifest.entries.filter(entry => entry.source.startsWith(`/${group.source}/`))
        .map(entry => entry.source).sort(), names.map(name => `/${group.source}/${name}`).sort(),
      `Cobertura exata de ${group.source}, incluindo logo`);
    }
  }

  const totals = { count: 0, bytes: 0, thumbnailBytes: 0, sourceBytes: 0 };
  for (const entry of manifest.entries) {
    const group = groups.find(candidate => entry.source.startsWith(`/${candidate.source}/`));
    assert.ok(group, `Fonte inesperada: ${entry.source}`);
    const name = entry.source.slice(group.source.length + 2);
    assert.ok(name && !name.split('/').some(part => part === '..' || part === '.') && !name.includes('\\'));
    assert.equal(entry.image, `/media/acervo/${group.output}/${name}.webp`);
    assert.equal(entry.thumbnail, `/media/acervo/${group.output}/thumbs/${name}.webp`);
    for (const [field, bytesField, maxWidth, maxHeight] of [
      ['image', 'bytes', group.width, group.height],
      ['thumbnail', 'thumbnailBytes', 360, 360],
    ]) {
      const filename = path.join(root, entry[field].slice(1));
      const info = await stat(filename);
      assert.ok(info.isFile());
      assert.equal(info.size, entry[bytesField], filename);
      assert.ok(info.size > 0 && info.size <= 5 * 1024 * 1024, `${filename}: limite de 5 MB`);
      const metadata = await sharp(filename).metadata();
      assert.equal(metadata.format, 'webp');
      assert.ok(metadata.width > 0 && metadata.width <= maxWidth, filename);
      assert.ok(metadata.height > 0 && metadata.height <= maxHeight, filename);
      if (field === 'image') {
        assert.equal(entry.width, metadata.width);
        assert.equal(entry.height, metadata.height);
      } else {
        assert.ok(metadata.width <= entry.width && metadata.height <= entry.height);
      }
    }
    assert.ok(Number.isSafeInteger(entry.sourceBytes) && entry.sourceBytes > 0);
    // Sources may be absent from CI clones; published outputs are always mandatory.
    let original;
    try { original = await stat(path.join(root, entry.source.slice(1))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (original) {
      assert.equal(entry.sourceBytes, original.size, entry.source);
      let metadata;
      try { metadata = await sharp(path.join(root, entry.source.slice(1))).metadata(); }
      catch (error) {
        const bytes = await readFile(path.join(root, entry.source.slice(1)));
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', error.message);
      }
      if (metadata) {
      const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
      const width = rotated ? metadata.height : metadata.width;
      const height = rotated ? metadata.width : metadata.height;
      const scale = Math.min(1, group.width / width, group.height / height);
      assert.ok(Math.abs(entry.width - width * scale) <= 1, entry.source);
      assert.ok(Math.abs(entry.height - height * scale) <= 1, entry.source);
      }
    }
    totals.count++;
    totals.bytes += entry.bytes;
    totals.thumbnailBytes += entry.thumbnailBytes;
    totals.sourceBytes += entry.sourceBytes;
  }
  assert.deepEqual(manifest.totals, totals);
  assert.ok(totals.bytes + totals.thumbnailBytes < totals.sourceBytes,
    'Leitura e thumbnails juntas devem ser menores que os originais no total');
});

test('builder preserva originais, evita colisões e invalida cache por parâmetros e datas', async t => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'mytragor-archive-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(fixture, 'Ilustraçoes/nested'), { recursive: true });
  await mkdir(path.join(fixture, 'cartas.png'), { recursive: true });
  const originals = new Map();
  for (const [name, format] of [
    ['Ilustraçoes/logo.PNG', 'png'], ['Ilustraçoes/logo.jpg', 'jpeg'],
    ['Ilustraçoes/nested/arte.JPEG', 'jpeg'], ['Ilustraçoes/arte.WEBP', 'webp'],
    ['cartas.png/carta.TIF', 'tiff'], ['cartas.png/carta.TIFF', 'tiff'],
  ]) {
    const buffer = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#754137' } })
      .toFormat(format).toBuffer();
    await writeFile(path.join(fixture, name), buffer);
    originals.set(`/${name}`, buffer);
  }
  const first = await buildArchive(fixture);
  assert.deepEqual(first.entries.map(entry => entry.source), [...originals.keys()].sort());
  assert.equal(new Set(first.entries.map(entry => entry.image)).size, originals.size);
  for (const entry of first.entries) {
    assert.deepEqual(await readFile(path.join(fixture, entry.source.slice(1))), originals.get(entry.source));
    assert.equal(entry.width, 64);
    assert.equal(entry.height, 48);
    assert.equal((await sharp(path.join(fixture, entry.thumbnail.slice(1))).metadata()).width, 64);
  }
  const entry = first.entries[0];
  const image = path.join(fixture, entry.image.slice(1));
  const thumbnail = path.join(fixture, entry.thumbnail.slice(1));
  const marker = new Date(Date.now() + 60_000);
  await utimes(image, marker, marker);
  await utimes(thumbnail, marker, marker);
  const cachedTime = (await stat(image)).mtimeMs;
  assert.deepEqual(await buildArchive(fixture), first);
  assert.equal((await stat(image)).mtimeMs, cachedTime, 'Cache não deve regravar saída válida');

  const manifestPath = path.join(fixture, 'media/acervo/index.json');
  await writeFile(manifestPath, JSON.stringify({ ...first, parameters: { quality: 1 } }));
  await buildArchive(fixture);
  assert.notEqual((await stat(image)).mtimeMs, cachedTime, 'Mudança de parâmetros invalida cache');

  const old = new Date(0);
  await utimes(image, old, old);
  await buildArchive(fixture);
  assert.ok((await stat(image)).mtimeMs > 0, 'Saída anterior à fonte deve ser refeita');
  await rm(thumbnail);
  await buildArchive(fixture);
  assert.ok((await stat(thumbnail)).isFile(), 'Thumbnail ausente deve ser recuperada');
});
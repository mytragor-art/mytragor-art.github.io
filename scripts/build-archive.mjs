import sharp from 'sharp';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = 1;
// Persist every encoding parameter so changing one also invalidates the cache.
const parameters = {
  pdfRendering: 'first-page-1600-v1',
  illustrations: { width: 1600, height: 1600 },
  cards: { width: 1300, height: 1800 },
  thumbnail: { width: 360, height: 360, quality: 72 },
  fit: 'inside', withoutEnlargement: true, autoOrient: true,
  colourspace: 'srgb', quality: 82,
};
const groups = [
  { source: 'Ilustraçoes', output: 'ilustracoes', size: parameters.illustrations },
  { source: 'cartas.png', output: 'cartas', size: parameters.cards },
];
const supported = /\.(jpe?g|png|webp|tiff?)$/i;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

async function optionalStat(file) {
  try {
    return await stat(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function imageInput(file, size) {
  try {
    await sharp(file).metadata();
    return file;
  } catch (error) {
    // Aerin fragmento.png is actually a PDF. Detect bytes, not its extension.
    const bytes = await readFile(file);
    if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error(`Não foi possível converter ${file}: ${error.message}`);
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');
    const loadingTask = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
    const pdf = await loadingTask.promise;
    try {
      const page = await pdf.getPage(1);
      const initial = page.getViewport({ scale: 1 });
      const scale = Math.min(size.width / initial.width, size.height / initial.height, 2);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      return canvas.toBuffer('image/png');
    } finally { await loadingTask.destroy(); }
  }
}

async function enumerate(directory, prefix = '') {
  let children;
  try {
    children = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT' && !prefix) return [];
    throw error;
  }
  const files = [];
  for (const child of children.sort((a, b) => compare(a.name, b.name))) {
    const relative = prefix ? `${prefix}/${child.name}` : child.name;
    if (child.isDirectory()) {
      files.push(...await enumerate(path.join(directory, child.name), relative));
    } else if (child.isFile() && supported.test(child.name)) {
      files.push(relative);
    }
  }
  return files.sort(compare);
}

/** Generate reading copies and thumbnails without writing to source directories. */
export async function buildArchive(root) {
  // libvips' file cache holds read handles across rebuilds on Windows, which
  // prevents overwriting a previously inspected output. Keep memory cache only.
  sharp.cache({ files: 0 });
  root = path.resolve(root);
  const archive = path.join(root, 'media', 'acervo');
  const manifestPath = path.join(archive, 'index.json');
  let previous;
  try {
    previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  const cacheValid = previous?.version === VERSION
    && JSON.stringify(previous.parameters) === JSON.stringify(parameters);
  const cachedSources = new Set(cacheValid ? (previous.entries ?? []).map(entry => entry.source) : []);
  const entries = [];
  await mkdir(archive, { recursive: true });

  // Deliberately sequential: large TIFF/PNG originals must not decode concurrently.
  for (const group of groups) {
    for (const name of await enumerate(path.join(root, group.source))) {
      const source = `/${group.source}/${name}`;
      const image = `/media/acervo/${group.output}/${name}.webp`;
      const thumbnail = `/media/acervo/${group.output}/thumbs/${name}.webp`;
      const originalPath = path.join(root, group.source, name);
      const imagePath = path.join(root, image.slice(1));
      const thumbnailPath = path.join(root, thumbnail.slice(1));
      const sourceInfo = await stat(originalPath);
      let imageInfo = await optionalStat(imagePath);
      let thumbnailInfo = await optionalStat(thumbnailPath);
      const reuse = cachedSources.has(source)
        && imageInfo?.isFile() && thumbnailInfo?.isFile()
        && imageInfo.mtimeMs >= sourceInfo.mtimeMs
        && thumbnailInfo.mtimeMs >= sourceInfo.mtimeMs
        && thumbnailInfo.mtimeMs >= imageInfo.mtimeMs;

      if (!reuse) {
        await mkdir(path.dirname(imagePath), { recursive: true });
        await mkdir(path.dirname(thumbnailPath), { recursive: true });
        await sharp(await imageInput(originalPath, group.size)).autoOrient().toColourspace(parameters.colourspace)
          .resize({ ...group.size, fit: parameters.fit, withoutEnlargement: parameters.withoutEnlargement })
          .webp({ quality: parameters.quality }).toFile(imagePath);
        await sharp(imagePath)
          .resize({ width: parameters.thumbnail.width, height: parameters.thumbnail.height,
            fit: parameters.fit, withoutEnlargement: parameters.withoutEnlargement })
          .webp({ quality: parameters.thumbnail.quality }).toFile(thumbnailPath);
        imageInfo = await stat(imagePath);
        thumbnailInfo = await stat(thumbnailPath);
      }
      const { width, height } = await sharp(imagePath).metadata();
      entries.push({ source, image, thumbnail, width, height,
        bytes: imageInfo.size, thumbnailBytes: thumbnailInfo.size, sourceBytes: sourceInfo.size });
    }
  }

  entries.sort((a, b) => compare(a.source, b.source));
  const totals = entries.reduce((total, entry) => ({
    count: total.count + 1,
    bytes: total.bytes + entry.bytes,
    thumbnailBytes: total.thumbnailBytes + entry.thumbnailBytes,
    sourceBytes: total.sourceBytes + entry.sourceBytes,
  }), { count: 0, bytes: 0, thumbnailBytes: 0, sourceBytes: 0 });
  const manifest = { version: VERSION, parameters, entries, totals };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url));
  const { totals } = await buildArchive(root);
  console.log(`Acervo: ${totals.count} imagens e thumbnails geradas/verificadas. Originais preservados.`);
}
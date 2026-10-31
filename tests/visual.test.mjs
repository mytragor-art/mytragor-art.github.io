import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

test('banner da Gamboa mantém apenas a cena acima da ponta da flecha', async () => {
  const html = await readFile(new URL('../cartas/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('src="/media/acervo/ilustracoes/gamboa-banner.webp"'));
  const image = await sharp(fileURLToPath(new URL('../media/acervo/ilustracoes/gamboa-banner.webp', import.meta.url))).metadata();
  assert.equal(image.width, 1143);
  assert.equal(image.height, 650);
});

test('home ilustrada preserva os quatro líderes e usa artes leves fora das molduras', async () => {
  const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
  const chosen = html.slice(html.indexOf('<div class="chosen-grid">'),html.indexOf('<p class="section-note">'));
  assert.equal((chosen.match(/class="chosen chosen--/g)||[]).length,4);
  assert.equal((chosen.match(/src="\/media\/acervo\/ilustracoes\//g)||[]).length,4);
  assert.ok(html.includes('class="lore-art"'));
  assert.ok(html.includes('class="community-art"'));
  assert.ok(html.includes('Katarina Banffy'));
  for (const [,src] of html.matchAll(/src="(\/media\/acervo\/[^"?]+)"/g)) {
    await access(new URL(`..${decodeURIComponent(src)}`,import.meta.url));
  }
});

test('tipografia usa fantasia literária suave, sem as fontes rígidas anteriores', async () => {
  const css = await readFile(new URL('../styles.css',import.meta.url),'utf8');
  assert.ok(css.includes('family=Alegreya:ital'));
  assert.ok(css.includes('family=Source+Sans+3'));
  assert.ok(!/Montserrat|Cinzel/.test(css));
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('páginas internas usam capítulos ilustrados leves com créditos e funções preservadas', async () => {
  const pages = [
    ['cartas/index.html','gallery-page','id="cardSearch"'],
    ['baralho/index.html','builder-page','id="chosenSelect"'],
    ['comojogar/index.html','guide-page','id="ruleSearch"']
  ];
  const artworks = new Set();
  for (const [file, theme, control] of pages) {
    const html = await readFile(new URL(`../${file}`,import.meta.url),'utf8');
    assert.ok(html.includes(`class="inner-page ${theme}"`));
    assert.ok(html.includes('class="page-art-credit"'));
    assert.ok(html.includes(control));
    const image = html.match(/<img[^>]*class="page-intro-art"[^>]*>/)?.[0];
    assert.ok(image && !image.includes('loading="lazy"'),file);
    const src = image.match(/src="([^"]+)"/)[1];
    artworks.add(src);
    assert.ok(src.startsWith('/media/acervo/ilustracoes/'));
    await access(new URL(`..${decodeURIComponent(src)}`,import.meta.url));
    for (const [,url] of html.matchAll(/src="(\/media\/acervo\/[^"?]+)"/g)) await access(new URL(`..${decodeURIComponent(url)}`,import.meta.url));
  }
  assert.equal(artworks.size,3,'Cada página tem uma arte própria.');
  const guide = await readFile(new URL('../comojogar/index.html',import.meta.url),'utf8');
  assert.ok(guide.includes('class="study-illustration"'));
});
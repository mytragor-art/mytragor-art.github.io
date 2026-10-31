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

test('pré-campanha aparece após a abertura e antes do Conexão, com banner inteiro e link seguro', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const campaign = html.match(/<section class="campaign"[\s\S]*?<\/section>/)?.[0];
  assert.ok(campaign);
  assert.ok(html.indexOf('class="hero"') < html.indexOf('class="campaign"'));
  assert.ok(html.indexOf('class="campaign"') < html.indexOf('id="primeiro-evento"'));
  assert.equal((html.match(/id="pre-campanha"/g) || []).length, 1);
  assert.ok(html.indexOf('class="campaign"') < html.indexOf('class="section chosen-section"'));
  assert.match(campaign, /href="https:\/\/meeplestarter\.com\.br\/mytragor" target="_blank" rel="noopener noreferrer"/);
  assert.match(campaign, /alt="[^"]*pré-campanha[^"]*Sam Trioni/);
  assert.match(campaign, /Seguir na Meeple Starter/);
  assert.match(css, /\.campaign-link img\{[^}]*width:100%;height:auto/);
  const image = await sharp(fileURLToPath(new URL('../media/propagandas/mytragor-pre-campanha.webp', import.meta.url))).metadata();
  assert.equal(image.width, 1600);
  assert.equal(image.height, 700);
});

test('primeiro evento destaca data e local oficiais, com ingressos e informações externas', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const event = html.match(/<section class="event-announcement"[\s\S]*?<\/section>/)?.[0];
  assert.ok(event);
  assert.ok(html.indexOf('id="primeiro-evento"') < html.indexOf('id="jogo"'));
  assert.match(event, /aria-labelledby="eventTitle"/);
  assert.match(event, /Nosso primeiro evento presencial/);
  assert.match(event, /datetime="2026-11-07"/);
  assert.match(event, /Conexão TCG Brasil/);
  assert.match(event, /Tuzzy Cards Lounge · Barueri, SP/);
  assert.match(event, /1119 — 23º andar, Tamboré/);
  assert.match(event, /href="https:\/\/conexaotcgbrasil\.com\.br\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(event, /href="https:\/\/www\.sympla\.com\.br\/evento\/conexao-tcg-brasil-tuzzy-lounge\/3617978\?share_id=copiarlink" target="_blank" rel="noopener noreferrer"/);
  assert.match(css, /\.event-card\{display:grid/);
  for (const [name, alt] of [['logo', 'Conexão TCG Brasil'], ['nanda', 'Nanda, mascote']]) {
    assert.ok(event.includes(`/media/eventos/conexao-tcg-${name}.webp`));
    assert.ok(event.includes(`alt="${alt}`));
    const artwork = await sharp(fileURLToPath(new URL(`../media/eventos/conexao-tcg-${name}.webp`, import.meta.url))).metadata();
    assert.ok(artwork.width > 0 && artwork.height > 0);
    assert.equal(artwork.hasAlpha, true, 'Transparência das artes oficiais preservada');
  }
  assert.match(css, /\.event-mascot img\{[^}]*height:auto;[^}]*object-fit:contain/);
});

test('tipografia usa fantasia literária suave, sem as fontes rígidas anteriores', async () => {
  const css = await readFile(new URL('../styles.css',import.meta.url),'utf8');
  assert.ok(css.includes('family=Alegreya:ital'));
  assert.ok(css.includes('family=Source+Sans+3'));
  assert.ok(!/Montserrat|Cinzel/.test(css));
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('banners no celular mantêm a proporção natural e ficam separados do texto', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const mobile = css.slice(css.lastIndexOf('@media(max-width:600px)'));
  const artwork = mobile.match(/\.inner-page \.page-intro-art,\.gallery-page \.page-intro-art\{([^}]+)\}/)?.[1];
  assert.ok(artwork);
  for (const rule of ['position:relative', 'height:auto', 'aspect-ratio:auto', 'object-fit:contain']) {
    assert.ok(artwork.includes(rule), rule);
  }
  assert.ok(mobile.includes('.inner-page .page-intro::before{content:none}'));
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
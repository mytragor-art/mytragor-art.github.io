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

test('campanha aberta substitui a pré-campanha, com banner inteiro e link seguro', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const campaign = html.match(/<section class="campaign"[\s\S]*?<\/section>/)?.[0];
  assert.ok(campaign);
  assert.ok(html.indexOf('class="hero"') < html.indexOf('class="campaign"'));
  assert.ok(html.indexOf('class="campaign"') < html.indexOf('id="jogo"'));
  assert.equal((html.match(/id="pre-campanha"/g) || []).length, 1);
  assert.ok(html.indexOf('class="campaign"') < html.indexOf('class="section chosen-section"'));
  assert.match(campaign, /href="https:\/\/meeplestarter\.com\.br\/mytragor" target="_blank" rel="noopener noreferrer"/);
  assert.match(campaign, /alt="[^"]*financiamento coletivo aberto[^"]*ras_art_11/);
  assert.match(campaign, /Apoiar na Meeple Starter/);
  assert.ok(!campaign.includes('mytragor-pre-campanha.webp'));
  assert.match(css, /\.campaign-link img\{[^}]*width:100%;height:auto/);
  const image = await sharp(fileURLToPath(new URL('../media/propagandas/mytragor-campanha-aberta.webp', import.meta.url))).metadata();
  assert.equal(image.width, 1600);
  assert.equal(image.height, 700);
  const original = await sharp(fileURLToPath(new URL('../propagandas/Mytragor-Campanha-Aberta-Simulador.png', import.meta.url))).metadata();
  assert.equal(image.width, original.width);
  assert.equal(image.height, original.height);
});

test('Conexão fica arquivado nos concluídos, preservando data, local e artes oficiais', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const html = await readFile(new URL('../eventos/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const event = html.match(/<article class="event-card"[\s\S]*?<\/article>/)?.[0];
  assert.ok(event);
  assert.ok(!home.includes('id="primeiro-evento"'));
  assert.ok(!home.includes('conexao-tcg-logo.webp'));
  assert.ok(html.indexOf('id="concluidos"') < html.indexOf('id="primeiro-evento"'));
  assert.ok(!html.slice(html.indexOf('id="proximos"'), html.indexOf('id="concluidos"')).includes('event-card'));
  assert.match(html, /Nenhum próximo evento anunciado/);
  assert.match(html, /href="#proximos"/);
  assert.match(html, /href="#concluidos"/);
  assert.match(event, /aria-labelledby="eventTitle"/);
  assert.match(event, /Concluído/);
  assert.match(event, /Mytragor participou/);
  assert.match(event, /Nosso primeiro evento presencial/);
  assert.match(event, /datetime="2026-11-07"/);
  assert.match(event, /Conexão TCG Brasil/);
  assert.match(event, /Tuzzy Cards Lounge · Barueri, SP/);
  assert.match(event, /1119 — 23º andar, Tamboré/);
  assert.match(event, /href="https:\/\/conexaotcgbrasil\.com\.br\/" target="_blank" rel="noopener noreferrer"/);
  assert.ok(!/Ver ingressos|Mytragor estará|Vamos nos encontrar/.test(event));
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
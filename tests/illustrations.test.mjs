import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('ilustrações: identidades únicas, créditos explícitos e recursos locais existentes', async () => {
  const { illustrations } = await import('../data/illustrations.js');
  assert.ok(illustrations.length > 0);
  assert.equal(new Set(illustrations.map(art => art.id)).size, illustrations.length);
  for (const art of illustrations) {
    assert.ok(typeof art.id === 'string' && art.id.trim(), 'ID obrigatório');
    assert.ok(typeof art.title === 'string' && art.title.trim(), art.id);
    assert.ok(art.artist === null || (typeof art.artist === 'string' && art.artist.trim()), art.id);
    assert.ok(Number.isInteger(art.width) && art.width > 0, art.id);
    assert.ok(Number.isInteger(art.height) && art.height > 0, art.id);
    for (const path of [art.image, art.thumbnail]) {
      assert.match(path, /^\/media\/acervo\/ilustracoes\/(?:thumbs\/)?[^?#]+\.webp$/i, art.id);
      assert.ok(!path.includes('..') && !path.includes('\\'), art.id);
      await access(new URL(`.${path}`, root));
    }
    const full = await sharp(fileURLToPath(new URL(`.${art.image}`, root))).metadata();
    assert.equal(full.width, art.width, art.id);
    assert.equal(full.height, art.height, art.id);
    const thumb = await sharp(fileURLToPath(new URL(`.${art.thumbnail}`, root))).metadata();
    assert.ok(Math.abs(thumb.width / thumb.height - art.width / art.height) < .02, `${art.id}: proporção natural da miniatura`);
  }
});

test('artes são distintas das cartas e cada versão preserva seu ilustrador confirmado', async () => {
  const { illustrations } = await import('../data/illustrations.js');
  const byCard = new Map(illustrations.map(art => [art.cardId, art]));
  assert.equal(illustrations.length, 84);
  assert.equal(new Set(illustrations.map(art => art.image)).size, illustrations.length);
  for (const art of illustrations) {
    assert.ok(art.artist && art.creditSource === 'card', art.id);
    assert.equal(art.creditCardId, art.cardId);
    assert.ok(!art.image.includes('/cartas/') && !art.image.includes('logo.png'));
  }
  for (const [id, author] of [
    ['Gamboa', 'Sam Trioni'], ['gamboa-full-art', 'Two Rey'],
    ['escolhido_katsuvingador', 'Artur Bohrer'], ['katsu-full-art', 'Letícia Machado'],
    ['escolhido_leafaefloresta', 'Katarina Banffy'], ['leafae-full-art', 'Sam Trioni'],
    ['porcoespinho', 'Ruam Costa'], ['porco-espinho-full-art', 'Diogo Roesberg'],
    ['valbrak-full-art-v3', 'André Martuscelli'], ['valbrak-prestigio', 'Diego Fernando'],
    ['ursonegro', 'Enzo Anael']
  ]) assert.equal(byCard.get(id)?.artist, author, id);
});

test('busca combina título, artista sem acentos e filtro de autoria; crédito desconhecido não é inventado', async () => {
  const { filterIllustrations, creditFor, pendingCredit } = await import('../ilustracoes/script.js');
  const fixtures = [
    { id: 'a', title: 'Árvore antiga', artist: 'André Teste' },
    { id: 'b', title: 'O viajante', artist: null },
    { id: 'c', title: '<script>texto</script>', artist: 'Outra Pessoa' }
  ];
  assert.equal(pendingCredit, 'Crédito em conferência');
  assert.equal(creditFor(fixtures[1]), pendingCredit);
  assert.equal(creditFor({ artist: '  ' }), pendingCredit);
  assert.equal(creditFor({ artist: undefined }), pendingCredit);
  assert.deepEqual(filterIllustrations(fixtures, { query: ' ARVORE ' }).map(art => art.id), ['a']);
  assert.deepEqual(filterIllustrations(fixtures, { query: 'andre', artist: 'André Teste' }).map(art => art.id), ['a']);
  assert.equal(filterIllustrations(fixtures, { query: 'arvore', artist: 'Outra Pessoa' }).length, 0);
  assert.equal(filterIllustrations(fixtures, { artist: pendingCredit })[0].id, 'b');
  assert.equal(filterIllustrations(fixtures, { query: 'inexistente' }).length, 0);
  assert.equal(filterIllustrations(fixtures).length, fixtures.length);
});

test('links opcionais usam somente identidades válidas e o parâmetro real da galeria de cartas', async () => {
  const { cardLinkFor } = await import('../ilustracoes/script.js');
  const { galleryEntries } = await import('../data/gallery.js');
  const { illustrations } = await import('../data/illustrations.js');
  const gallery = await read('lib/gallery.js');
  assert.match(gallery, /searchParams\.set\('carta', card\.id\)/);
  assert.equal(cardLinkFor({}), null);
  assert.equal(cardLinkFor({ cardId: 'javascript:alert(1)' }), null);
  for (const art of illustrations.filter(art => art.cardId)) {
    assert.ok(galleryEntries.some(card => card.id === art.cardId), art.id);
    assert.equal(cardLinkFor(art), `/cartas/?carta=${encodeURIComponent(art.cardId)}`);
  }
  assert.equal(cardLinkFor({ cardId: galleryEntries[0].id }), `/cartas/?carta=${encodeURIComponent(galleryEntries[0].id)}`);
});

test('HTML: galeria separada, controles rotulados, diálogo nativo e navegação completa', async () => {
  const html = await read('ilustracoes/index.html');
  assert.match(html, /lang="pt-BR"/);
  assert.match(html, /<h1>A arte de Mytragor<\/h1>/);
  assert.match(html, /transcritos dos créditos nas cartas/);
  assert.match(html, /Crédito em conferência/);
  for (const id of ['artSearch', 'artistFilter']) {
    assert.ok(html.includes(`for="${id}"`));
    assert.ok(html.includes(`id="${id}"`));
  }
  for (const id of ['artGrid', 'artCount', 'artEmpty', 'resetArtFilters', 'resetArtEmpty', 'closeArtDialog']) assert.ok(html.includes(`id="${id}"`));
  assert.match(html, /id="artCount"[^>]*role="status"/);
  assert.match(html, /<dialog[^>]*aria-labelledby="artDialogTitle"[^>]*aria-describedby="artDialogCredit"/);
  assert.match(html, /id="artFullImage"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(html, /<noscript>/);
  assert.ok(!html.includes('page-intro-art'));
  for (const area of [html.match(/<header[\s\S]*?<\/header>/)[0], html.match(/<footer[\s\S]*?<\/footer>/)[0]]) {
    for (const path of ['/', '/#jogo', '/cartas/', '/ilustracoes/', '/comojogar/', '/baralho/', '/#universo', '/simuladordebatalha/']) assert.ok(area.includes(`href="${path}"`), path);
    assert.ok(area.includes('href="/ilustracoes/" aria-current="page"'));
  }
  for (const [, path] of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    await access(new URL(`.${path}${path.endsWith('/') ? 'index.html' : ''}`, root));
  }
});

test('renderização segura, miniaturas diferidas e imagens sem distorção em qualquer tamanho', async () => {
  const script = await read('ilustracoes/script.js');
  const css = await read('ilustracoes/gallery.css');
  assert.match(script, /import \{ normalize \} from '\.\.\/data\/cards\.js'/);
  assert.match(script, /import \{ illustrations \} from '\.\.\/data\/illustrations\.js'/);
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(/.test(script));
  assert.match(script, /title\.textContent = art\.title/);
  assert.match(script, /credit\.textContent = creditFor\(art\)/);
  assert.match(script, /image\.loading = 'lazy'/);
  assert.match(script, /image\.src = art\.thumbnail/);
  assert.match(script, /image\.src = art\.image/);
  assert.match(script, /dialog\.showModal\(\)/);
  assert.match(script, /dialog\.close\(\)/);
  assert.match(script, /event\.target !== dialog/);
  assert.match(css, /\.art-open img\{[^}]*height:auto;[^}]*object-fit:contain/);
  assert.match(css, /\.art-dialog \.art-image-stage img\{[^}]*height:auto;[^}]*object-fit:contain/);
  assert.match(css, /columns:1/);
  assert.ok(!/object-fit:cover/.test(css));
});
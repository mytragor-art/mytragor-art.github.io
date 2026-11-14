import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { cards, cardById, filterCards } from '../data/cards.js';
import { emptyDeck, deckTotal, canAdd, isCompatible, parseDeck, validateDeck, builderCards } from '../lib/deck.js';
import { rules, pageTitles } from '../data/rules.js';
const root = new URL('../', import.meta.url);
test('a abertura da home apresenta os quatro Escolhidos', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const hero = html.match(/<div class="hero-cards[\s\S]*?<\/div>/)?.[0] || '';
  const chosen = cards.filter(card => card.type === 'Escolhido');
  assert.equal((hero.match(/class="hero-card /g) || []).length, chosen.length);
  for (const card of chosen) assert.ok(hero.includes(card.image), `${card.name} deve aparecer na abertura`);
});
test('catálogo: IDs e nomes únicos e imagens existentes', async () => {
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  assert.equal(new Set(cards.map(c => c.name)).size, cards.length);
  for (const card of cards) {
    await access(new URL(`.${card.image}`, root)); await access(new URL(`.${card.original}`, root));
    if (card.type !== 'Escolhido') assert.ok(Number.isInteger(card.cost) && card.cost >= 0);
  }
});
test('busca ignora acentos e combina filiação e tipo', () => {
  assert.ok(filterCards(cards, {query:'lamina'}).some(c => c.name === 'Lâmina Serrilhada'));
  assert.equal(filterCards(cards, { affiliation:'Arcano',type:'Escolhido' }).length, 1);
  assert.equal(filterCards(cards, { query:'zzzzzz' }).length, 0);
});
test('busca do montador funciona sem líder e respeita a filiação após seleção', () => {
  const all = builderCards('');
  assert.ok(all.length > 0);
  assert.ok(all.every(card => card.type !== 'Escolhido' && !card.token));
  assert.equal(filterCards(all, { query: 'maos', type: 'Magia' })[0]?.id, 'maosflamejantes');
  const arcane = builderCards('escolhido_valbrak');
  assert.ok(arcane.every(card => ['Arcano', 'Neutra'].includes(card.affiliation)));
  assert.equal(filterCards(arcane, { query: 'maos' }).length, 1);
  assert.equal(filterCards(builderCards('escolhido_katsuvingador'), { query: 'maos' }).length, 0);
  assert.ok(builderCards('escolhido_katsuvingador').some(card => card.affiliation === 'Neutra'));
});
test('montador impõe líder, filiação, cópias, Totens e 40 cartas', () => {
  const deck = emptyDeck();
  assert.equal(canAdd(deck, cardById.get('maosflamejantes')), false);
  deck.chosen = 'escolhido_valbrak';
  assert.equal(canAdd(deck, cardById.get('maosflamejantes')), true);
  assert.equal(canAdd(deck, cardById.get('aerinnieloyl')), false);
  assert.equal(canAdd(deck, cardById.get('aranhastoken')), false);
  assert.equal(canAdd(deck, cardById.get('escolhido_valbrak')), false);
  deck.cards.maosflamejantes = 3;
  assert.equal(canAdd(deck, cardById.get('maosflamejantes')), false);
  const compatible = cards.filter(c => isCompatible(c, cardById.get(deck.chosen)));
  deck.cards = Object.fromEntries(compatible.slice(0,13).map(c => [c.id,3]));
  deck.cards[compatible[13].id] = 1;
  assert.equal(deckTotal(deck),40); assert.deepEqual(validateDeck(deck),[]);
  assert.equal(canAdd(deck,compatible[14]),false);
  assert.deepEqual(parseDeck(deck),deck);
});
test('imports inválidos não são aceitos', () => {
  for (const value of [null,{}, {version:1,chosen:'xxx',cards:{}}, {version:1,chosen:'escolhido_valbrak',cards:{maosflamejantes:4}}, {version:1,chosen:'escolhido_valbrak',cards:{aerinnieloyl:1}}, {version:1,chosen:'escolhido_valbrak',cards:{aranhastoken:1}}, {version:1,chosen:'escolhido_valbrak',cards:{maosflamejantes:'2'}}]) assert.throws(() => parseDeck(value));
});
test('todas as páginas do manual e referências de regras existem', async () => {
  assert.equal(pageTitles.length,22);
  for (let i=1;i<=pageTitles.length;i++) await access(new URL(`media/manual/${i}.webp`,root));
  for (const rule of rules) assert.ok(rule.page >= 1 && rule.page <= pageTitles.length);
});
test('HTML: recursos e links internos existem; sem loja nem assets removidos', async () => {
  for (const file of ['index.html','cartas/index.html','comojogar/index.html','baralho/index.html','ilustracoes/index.html','calculadora/index.html','eventos/index.html']) {
    const html = await readFile(new URL(file,root),'utf8');
    assert.ok(!html.includes('/assets/')); assert.ok(!/loja|comprar produto|carrinho/i.test(html));
    assert.equal((html.match(/<option(?:\s|>)/g) || []).length, (html.match(/<\/option>/g) || []).length, `${file}: opções de formulário devem ter abertura e fechamento`);
    for (const [,url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const target = decodeURIComponent(url); await access(new URL(`.${target}${target.endsWith('/')?'index.html':''}`,root));
    }
  }
});
test('calculadora integrada: navegação, recursos locais e app offline', async () => {
  for (const file of ['index.html', 'cartas/index.html', 'comojogar/index.html', 'baralho/index.html', 'ilustracoes/index.html', 'eventos/index.html']) {
    const html = await readFile(new URL(file, root), 'utf8');
    const menu = html.match(/<nav class="main-menu"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(menu?.includes('href="/calculadora/"'), file);
    assert.ok(menu?.includes('href="/eventos/"'), file);
    assert.ok(!html.includes('http://mytragor.com.br/calculadora-mytragor/'));
  }
  const calculatorRoot = new URL('calculadora/', root);
  const html = await readFile(new URL('index.html', calculatorRoot), 'utf8');
  for (const [, resource] of html.matchAll(/(?:href|src)="((?:\.\/)?(?:data\/|icons\/|manifest)[^"]+)"/g)) {
    await access(new URL(resource, calculatorRoot));
  }
  const grid = { innerHTML: '' };
  const generation = html.match(/function generateAllies\(\)\{[\s\S]*?\n  generateAllies\(\)/)?.[0];
  assert.ok(generation);
  runInNewContext(generation, { get: () => grid });
  assert.equal((grid.innerHTML.match(/class="ally"/g) || []).length, 10);
  for (const player of ['p1', 'p2']) {
    assert.equal((grid.innerHTML.match(new RegExp(`data-p="${player}"`, 'g')) || []).length, 5);
  }
  assert.ok(html.includes('href="/">← Voltar ao site'));
  assert.ok(html.includes('id="d20btn"'));
  assert.ok(html.includes('id="installDialog"'));
  assert.ok(html.includes('Adicionar à Tela de Início'));
  assert.ok(html.includes('id="installNow"'));
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', calculatorRoot), 'utf8'));
  assert.equal(manifest.id, '/calculadora/');
  assert.equal(manifest.scope, '/calculadora/');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) await access(new URL(icon.src, calculatorRoot));
  const worker = await readFile(new URL('sw.js', calculatorRoot), 'utf8');
  for (const [, asset] of worker.matchAll(/'(\.\/[^']*)'/g)) {
    await access(new URL(asset === './' ? 'index.html' : asset, calculatorRoot));
  }
  assert.ok(worker.includes('key.startsWith(CACHE_PREFIX)'));
  assert.ok(worker.includes('e.request.url.startsWith(self.registration.scope)'));
});
test('a escolha do líder fica junto à busca, antes das cartas, e fora do resumo', async () => {
  const html = await readFile(new URL('baralho/index.html', root), 'utf8');
  const controls = html.slice(html.indexOf('class="builder-controls"'), html.indexOf('class="builder-results"'));
  assert.ok(controls.includes('id="chosenSelect"'));
  assert.ok(controls.indexOf('id="chosenSelect"') < controls.indexOf('id="cardSearch"'));
  assert.ok(!html.slice(html.indexOf('<aside')).includes('id="chosenSelect"'));
  assert.equal((html.match(/id="chosenSelect"/g) || []).length, 1);
});
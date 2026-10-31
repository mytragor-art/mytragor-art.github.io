import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { cards, cardById, filterCards } from '../data/cards.js';
import { galleryEntries, collectionVariants, fragments, editions } from '../data/gallery.js';
import { emptyDeck, builderCards, canAdd, parseDeck } from '../lib/deck.js';
import { visibleBounds } from '../scripts/card-images.mjs';

test('galeria inclui Full Art, Prestígio e Fragmentos, mas não Art Cards', () => {
  assert.equal(new Set(galleryEntries.map(entry => entry.id)).size, galleryEntries.length);
  assert.equal(collectionVariants.filter(entry => entry.edition === 'Prestígio').length, 4);
  assert.equal(fragments.length, 5);
  assert.ok(collectionVariants.some(entry => entry.edition === 'Full Art'));
  assert.ok(!editions.includes('Art Card'));
  assert.ok(galleryEntries.every(entry => !entry.token));
  assert.ok(galleryEntries.some(entry => entry.id === 'valbrak-full-art-v3' && entry.editionLabel === 'Promo'));
  assert.ok(galleryEntries.some(entry => entry.id === 'katsu-full-art-peb' && entry.editionLabel === 'Promo — PeB'));
  for (const entry of galleryEntries) assert.ok(!/art card/i.test(entry.original), entry.original);
  for (const entry of collectionVariants) assert.ok(cardById.has(entry.baseId), entry.id);
});
test('filtros de edição, tipo, nome sem acentos e filiação se combinam', () => {
  assert.equal(filterCards(galleryEntries, { query:'valbrak', edition:'Prestígio', type:'Escolhido', affiliation:'Arcano' }).length, 1);
  assert.equal(filterCards(galleryEntries, { type:'Fragmento' }).length, 5);
  assert.equal(filterCards(galleryEntries, { type:'Fragmento', affiliation:'Marcial' }).length, 2);
  assert.equal(filterCards(galleryEntries, { query:'prestigio' }).length, 4);
  assert.equal(filterCards(galleryEntries, { query:'valbrak' }).length, 4);
  assert.equal(filterCards(galleryEntries, { query:'PeB' }).length, 1);
});
test('as quatro cartas promocionais são filtradas como Promo, não Full Art', () => {
  const promoIds = ['valbrak-full-art-v3','picapau-dourado','katsu-full-art-peb','fragmento_marcial_aerin'];
  assert.deepEqual(filterCards(galleryEntries, { edition:'Promo' }).map(card => card.id).sort(), promoIds.sort());
  for (const id of promoIds) assert.ok(!filterCards(galleryEntries, { edition:'Full Art' }).some(card => card.id === id));
});
test('raridades e recursos não criam novas identidades nem vagas no baralho', () => {
  assert.equal(cards.length, 70);
  for (const entry of [...collectionVariants, ...fragments]) {
    const deck = emptyDeck();
    deck.chosen = (cards.find(card => card.type === 'Escolhido' && card.affiliation === entry.affiliation) || cards.find(card => card.type === 'Escolhido')).id;
    assert.equal(canAdd(deck, entry), false, entry.id);
    assert.ok(!builderCards(deck.chosen).some(card => card.id === entry.id));
    assert.throws(() => parseDeck({ version:1, chosen:deck.chosen, cards:{[entry.id]:1} }));
  }
});
test('imagens de coleção e Fragmentos existem, são WebP 650 × 900 e preservam originais', async () => {
  for (const entry of [...collectionVariants, ...fragments]) {
    for (const [image, width, height] of [[entry.thumbnail,325,450],[entry.reading,1300,1800]]) {
      assert.ok(image.startsWith('/media/'));
      await access(new URL(`..${image}`, import.meta.url));
      const meta = await sharp(fileURLToPath(new URL(`..${image}`, import.meta.url))).metadata();
      assert.equal(meta.width,width,entry.id); assert.equal(meta.height,height,entry.id);
    }
    const meta = await sharp(fileURLToPath(new URL(`..${entry.image}`, import.meta.url))).metadata();
    assert.equal(meta.width, 650, entry.id); assert.equal(meta.height, 900, entry.id);
  }
});
test('Ademais Full Art ocupa o mesmo quadro das cartas, sem a inscrição externa do arquivo de trabalho', async () => {
  const entry = galleryEntries.find(card => card.id === 'ademais-full-art');
  const { data, info } = await sharp(fileURLToPath(new URL(`..${entry.image}`, import.meta.url))).ensureAlpha().raw().toBuffer({ resolveWithObject:true });
  const bounds = visibleBounds(data, info);
  assert.ok(bounds.width >= 648 && bounds.height >= 898, JSON.stringify(bounds));
  const original = fileURLToPath(new URL(`..${entry.original}`, import.meta.url));
  // Publication clones intentionally do not contain the local working masters.
  try { await stat(original); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  const source = sharp(original).extract(entry.crop);
  const expected = await source.resize(650,900,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:85}).toBuffer();
  const actual = await sharp(fileURLToPath(new URL(`..${entry.image}`, import.meta.url))).raw().toBuffer();
  assert.deepEqual(actual, await sharp(expected).raw().toBuffer());
});
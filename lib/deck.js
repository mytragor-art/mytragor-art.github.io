import { cards, cardById } from '../data/cards.js';

export const emptyDeck = () => ({ version: 1, chosen: '', cards: {} });
export function deckTotal(deck) { return Object.values(deck.cards).reduce((sum, count) => sum + count, 0); }
export function isCompatible(card, chosen) {
  return Boolean(card && chosen && card.type !== 'Escolhido' && !card.token && !card.galleryOnly && (card.affiliation === 'Neutra' || card.affiliation === chosen.affiliation));
}
export function builderCards(chosenId) {
  const chosen = cardById.get(chosenId);
  return cards.filter(card => card.type !== 'Escolhido' && !card.token && (!chosen || isCompatible(card, chosen)));
}
export function canAdd(deck, card) {
  return isCompatible(card, cardById.get(deck.chosen)) && (deck.cards[card.id] || 0) < 3 && deckTotal(deck) < 40;
}
export function validateDeck(deck) {
  const errors = [];
  const chosen = cardById.get(deck.chosen);
  if (!chosen || chosen.type !== 'Escolhido') errors.push('Escolha um Escolhido para liderar o baralho.');
  const total = deckTotal(deck);
  if (total !== 40) errors.push(`O baralho precisa de exatamente 40 cartas (atualmente ${total}).`);
  for (const [id, count] of Object.entries(deck.cards)) {
    const card = cardById.get(id);
    if (!card || !Number.isInteger(count) || count < 1 || count > 3) errors.push('Cada carta deve ter entre 1 e 3 cópias e existir no catálogo.');
    else if (!isCompatible(card, chosen)) errors.push(`${card.name} não pode fazer parte deste baralho.`);
  }
  return errors;
}
// Reject malformed or hostile imports instead of silently turning them into a different deck.
export function parseDeck(value) {
  if (!value || value.version !== 1 || typeof value.chosen !== 'string' || !value.cards || typeof value.cards !== 'object' || Array.isArray(value.cards)) throw new Error('Formato de baralho inválido. Use um JSON exportado por este montador.');
  if (value.chosen && cardById.get(value.chosen)?.type !== 'Escolhido') throw new Error('Escolhido não encontrado.');
  const deck = emptyDeck();
  deck.chosen = value.chosen;
  for (const [id, count] of Object.entries(value.cards)) {
    if (!cardById.has(id) || !Number.isInteger(count) || count < 1 || count > 3 || !isCompatible(cardById.get(id), cardById.get(deck.chosen))) throw new Error('O arquivo contém cartas, quantidades ou filiações inválidas.');
    deck.cards[id] = count;
  }
  if (deckTotal(deck) > 40) throw new Error('O arquivo excede o limite de 40 cartas.');
  return deck;
}
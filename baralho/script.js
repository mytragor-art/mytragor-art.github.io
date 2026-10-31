import { cards, cardById } from '../data/cards.js';
import { setupFilters, setupDialog } from '../lib/gallery.js';
import { emptyDeck, deckTotal, validateDeck, parseDeck, canAdd, isCompatible, builderCards } from '../lib/deck.js';

const storageKey = 'mytragor-deck-v1';
const message = document.querySelector('#deckMessage');
const chosenSelect = document.querySelector('#chosenSelect');
const catalogHint = document.createElement('p');
catalogHint.id = 'catalogHint'; catalogHint.className = 'notice';
catalogHint.setAttribute('role', 'status');
document.querySelector('.builder-controls').append(catalogHint);
document.querySelector('#cardSearch').setAttribute('aria-describedby', catalogHint.id);
let deck = emptyDeck();
let storageNotice = '';
try { const stored = localStorage.getItem(storageKey); if (stored) deck = parseDeck(JSON.parse(stored)); }
catch { storageNotice = 'Não foi possível restaurar um rascunho. Use exportar para guardar sua lista.'; }
for (const chosen of cards.filter(card => card.type === 'Escolhido')) chosenSelect.add(new Option(`${chosen.name} · ${chosen.affiliation}`, chosen.id));

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(deck)); }
  catch { storageNotice = 'O navegador bloqueou o salvamento local. Exporte o JSON para guardar este rascunho.'; }
}
function choose(id) {
  const chosen = cardById.get(id);
  deck.chosen = chosen?.type === 'Escolhido' ? id : '';
  let removed = 0;
  for (const [cardId, count] of Object.entries(deck.cards)) {
    if (!isCompatible(cardById.get(cardId), chosen)) { removed += count; delete deck.cards[cardId]; }
  }
  return removed;
}
const params = new URLSearchParams(location.search);
if (cardById.get(params.get('escolhido'))?.type === 'Escolhido') {
  const removed = choose(params.get('escolhido'));
  if (removed) message.textContent = `${removed} cartas incompatíveis removidas ao selecionar o novo Escolhido.`;
  save();
}
if (params.has('carta')) {
  const card = cardById.get(params.get('carta'));
  if (canAdd(deck, card)) { deck.cards[card.id] = (deck.cards[card.id] || 0) + 1; message.textContent = `${card.name} adicionada.`; save(); }
  else message.textContent = 'Escolha um líder compatível e adicione a carta desejada no catálogo abaixo. Totens não fazem parte do baralho.';
}
if (params.has('escolhido') || params.has('carta')) history.replaceState(null, '', location.pathname);

function updatePanel() {
  chosenSelect.value = deck.chosen;
  const chosen = cardById.get(deck.chosen);
  const preview = document.querySelector('#chosenPreview');
  preview.hidden = !chosen;
  if (chosen) { preview.src = chosen.image; preview.alt = `Seu líder: ${chosen.name}`; }
  else { preview.removeAttribute('src'); preview.alt = ''; }
  document.querySelector('#deckLeader').textContent = chosen ? `${chosen.name} · ${chosen.affiliation}` : 'Nenhum líder selecionado';
  document.querySelector('#deckCount').textContent = `${deckTotal(deck)} / 40`;
  const errors = validateDeck(deck);
  document.querySelector('#deckStatus').textContent = errors.length ? 'Rascunho em construção' : 'Baralho válido pelas regras de montagem!';
  const validation = document.querySelector('#deckValidation'); validation.replaceChildren();
  for (const error of errors) { const li = document.createElement('li'); li.textContent = error; validation.append(li); }
  const list = document.querySelector('#deckList'); list.replaceChildren();
  for (const [id, count] of Object.entries(deck.cards).sort(([a],[b]) => cardById.get(a).name.localeCompare(cardById.get(b).name, 'pt-BR'))) {
    const card = cardById.get(id);
    const li = document.createElement('li');
    const name = document.createElement('span'); name.textContent = card.name;
    const controls = document.createElement('div'); controls.className = 'deck-controls';
    const minus = document.createElement('button'); minus.type = 'button'; minus.className = 'icon-button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Remover uma cópia de ${card.name}`);
    const number = document.createElement('span'); number.textContent = count;
    const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'icon-button'; plus.textContent = '+'; plus.disabled = !canAdd(deck, card); plus.setAttribute('aria-label', `Adicionar uma cópia de ${card.name}`);
    minus.addEventListener('click', () => { if (--deck.cards[id] === 0) delete deck.cards[id]; persistAndRender(); });
    plus.addEventListener('click', () => add(id));
    controls.append(minus, number, plus); li.append(name, controls); list.append(li);
  }
  if (storageNotice) message.textContent = storageNotice;
}
function add(id) {
  const card = cardById.get(id);
  if (!canAdd(deck, card)) return;
  deck.cards[id] = (deck.cards[id] || 0) + 1;
  message.textContent = `${card.name} adicionada. ${deckTotal(deck)} de 40 cartas.`;
  persistAndRender();
}
const renderGallery = setupFilters({
  source: () => {
    const chosen = cardById.get(deck.chosen);
    catalogHint.textContent = chosen
      ? `Mostrando cartas ${chosen.affiliation} e Neutras, compatíveis com ${chosen.name}. Cartas de outras filiações não aparecem. Para vê-las, troque o Escolhido ou consulte a galeria de Cartas.`
      : 'Você pode buscar todas as cartas de baralho. Escolha seu líder logo acima para habilitar a adição de cartas compatíveis.';
    return builderCards(deck.chosen);
  },
  emptyMessage: () => deck.chosen
    ? `Nenhuma carta corresponde à busca e ao tipo selecionado entre as opções ${cardById.get(deck.chosen).affiliation} e Neutras. Limpe os filtros ou confira a filiação da carta na galeria de Cartas.`
    : 'Nenhuma carta corresponde à busca e ao tipo selecionado. Limpe os filtros ou tente outro nome. Escolhidos são selecionados acima da busca; Totens não entram no baralho.',
  decorate: (tile, card) => {
    const addButton = document.createElement('button'); addButton.type = 'button'; addButton.className = 'add-card';
    const count = deck.cards[card.id] || 0;
    addButton.textContent = !deck.chosen ? 'Escolha um líder para adicionar' : count === 3 ? 'Limite de 3 cópias' : `+ Adicionar${count ? ` (${count}/3)` : ''}`;
    addButton.setAttribute('aria-label', `Adicionar ${card.name} ao baralho`);
    addButton.disabled = !canAdd(deck, card); addButton.addEventListener('click', () => add(card.id)); tile.append(addButton);
  }
});
function persistAndRender() { save(); updatePanel(); renderGallery(); }
chosenSelect.addEventListener('change', () => {
  const removed = choose(chosenSelect.value);
  message.textContent = removed ? `${removed} cartas incompatíveis removidas; cartas Neutras foram mantidas.` : 'Escolhido atualizado.';
  persistAndRender();
});
document.querySelector('#exportDeck').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'mytragor-baralho.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message.textContent = 'JSON exportado. Guarde o arquivo para importar depois.';
});
document.querySelector('#copyDeck').addEventListener('click', async () => {
  const text = [`Mytragor — ${deckTotal(deck)}/40 cartas`, `Escolhido: ${cardById.get(deck.chosen)?.name || 'não selecionado'}`, ...Object.entries(deck.cards).map(([id,count]) => `${count}x ${cardById.get(id).name}`)].join('\n');
  try { await navigator.clipboard.writeText(text); message.textContent = 'Lista copiada para compartilhar.'; }
  catch { message.textContent = 'Não foi possível copiar. Use Exportar JSON para guardar a lista.'; }
});
document.querySelector('#importDeck').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Arquivo muito grande. Importe um JSON de baralho de até 100 KB.');
    const imported = parseDeck(JSON.parse(await file.text()));
    deck = imported; message.textContent = 'Baralho importado e conferido. O rascunho anterior foi substituído.'; persistAndRender();
  } catch (error) { message.textContent = error instanceof SyntaxError ? 'JSON inválido. O rascunho atual foi preservado.' : `${error.message} O rascunho atual foi preservado.`; }
  event.target.value = '';
});
let clearArmed = false;
document.querySelector('#clearDeck').addEventListener('click', event => {
  if (!clearArmed) { clearArmed = true; event.target.textContent = 'Confirmar limpeza'; message.textContent = 'Clique novamente em Confirmar limpeza para apagar o rascunho.'; return; }
  deck = emptyDeck(); clearArmed = false; event.target.textContent = 'Limpar baralho'; message.textContent = 'Rascunho limpo.'; persistAndRender();
});
setupDialog(); updatePanel();
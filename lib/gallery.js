import { cards, cardById, filterCards, typeDescriptions } from '../data/cards.js';

export function createTile(card) {
  const tile = document.createElement('article');
  tile.className = 'card-tile';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'card-open'; button.dataset.card = card.id;
  button.setAttribute('aria-label', `Ampliar ${card.name}${card.edition ? ` — ${card.editionLabel || card.edition}` : ''}`);
  const image = new Image();
  image.src = card.thumbnail || card.image;
  image.srcset = `${card.thumbnail || card.image} 325w, ${card.image} 650w`;
  image.sizes = '(max-width: 520px) 44vw, (max-width: 860px) 40vw, 260px';
  image.alt = `Carta ${card.name}${card.edition ? ` — ${card.editionLabel || card.edition}` : ''}`; image.loading = 'lazy'; image.decoding = 'async'; image.width = 650; image.height = 900;
  const heading = document.createElement('h3'); heading.textContent = card.name;
  button.append(image, heading);
  if (card.edition) {
    const badge = document.createElement('span'); badge.className = 'edition-badge';
    badge.dataset.edition = card.edition; badge.textContent = card.editionLabel || card.edition;
    button.append(badge);
  }
  const meta = document.createElement('p'); meta.className = 'card-meta';
  meta.textContent = `${card.token ? 'Totem' : card.type} · ${card.affiliation}${card.cost === null ? '' : ` · Custo ${card.cost}`}`;
  tile.append(button, meta);
  return tile;
}

export function setupDialog({ updateURL = false, collection = cards } = {}) {
  const dialog = document.querySelector('#cardDialog');
  if (!dialog) return () => {};
  const byId = new Map(collection.map(card => [card.id, card]));
  const editionField = document.createElement('div'); editionField.className = 'field dialog-editions';
  const editionLabel = document.createElement('label'); editionLabel.htmlFor = 'dialogEdition'; editionLabel.textContent = 'Versões desta carta';
  const editionSelect = document.createElement('select'); editionSelect.id = 'dialogEdition';
  editionField.append(editionLabel, editionSelect);
  dialog.querySelector('#dialogDescription').after(editionField);
  editionSelect.addEventListener('change', () => open(editionSelect.value));
  const close = () => dialog.close();
  dialog.querySelector('.dialog-close').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open) { event.preventDefault(); close(); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    if (updateURL) { const url = new URL(location.href); url.searchParams.delete('carta'); history.replaceState(null, '', url); }
  });
  function open(id) {
    const card = byId.get(id); if (!card) return;
    const image = dialog.querySelector('#dialogImage'); image.src = card.reading || card.image; image.alt = `Carta completa ${card.name}${card.edition ? ` — ${card.editionLabel || card.edition}` : ''}`;
    dialog.querySelector('#dialogTitle').textContent = card.name;
    dialog.querySelector('#dialogMeta').textContent = `${card.type} · ${card.affiliation}${card.edition ? ` · ${card.editionLabel || card.edition}` : ''}${card.cost === null ? '' : ` · ${card.cost} Fragmentos`}${card.token ? ' · Totem' : ''}`;
    dialog.querySelector('#dialogDescription').textContent = card.description || typeDescriptions[card.type];
    const fullImage = dialog.querySelector('#dialogOriginal');
    fullImage.href = card.reading || card.image;
    fullImage.textContent = 'Abrir imagem ampliada ↗';
    const related = collection.filter(entry => (entry.baseId || entry.id) === (card.baseId || card.id));
    editionSelect.replaceChildren(...related.map(entry => new Option(entry.editionLabel || entry.edition || 'Padrão', entry.id)));
    editionSelect.value = card.id; editionField.hidden = related.length < 2;
    const build = dialog.querySelector('#dialogBuild');
    if (build) {
      const base = cardById.get(card.baseId || card.id);
      build.hidden = !base || card.token;
      build.textContent = card.edition && card.edition !== 'Padrão' ? 'Usar carta base no montador →' : 'Usar no montador →';
      if (base) build.href = `/baralho/?${base.type === 'Escolhido' ? 'escolhido' : 'carta'}=${encodeURIComponent(base.id)}`;
      else build.removeAttribute('href');
    }
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (updateURL) { const url = new URL(location.href); url.searchParams.set('carta', card.id); history.replaceState(null, '', url); }
  }
  document.querySelector('#cardGrid')?.addEventListener('click', event => { const trigger = event.target.closest('[data-card]'); if (trigger) open(trigger.dataset.card); });
  return open;
}

export function setupFilters({ source = () => cards, decorate = () => {}, emptyMessage = () => 'Nenhuma carta encontrada. Experimente outro nome ou limpe os filtros.' } = {}) {
  const grid = document.querySelector('#cardGrid');
  const query = document.querySelector('#cardSearch');
  const affiliation = document.querySelector('#affiliationFilter');
  const type = document.querySelector('#typeFilter');
  const edition = document.querySelector('#editionFilter');
  const count = document.querySelector('#resultCount');
  function render() {
    const result = filterCards(source(), { query: query.value, affiliation: affiliation.value, type: type.value, edition: edition?.value || '' });
    grid.replaceChildren();
    for (const card of result) { const tile = createTile(card); decorate(tile, card); grid.append(tile); }
    if (!result.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = emptyMessage(); grid.append(empty); }
    count.textContent = edition ? `${result.length} ${result.length === 1 ? 'carta ou versão encontrada' : 'cartas e versões encontradas'}` : `${result.length} ${result.length === 1 ? 'carta encontrada' : 'cartas encontradas'}`;
  }
  [query, affiliation, type, edition].filter(Boolean).forEach(field => field.addEventListener('input', render));
  document.querySelector('#resetFilters')?.addEventListener('click', () => { query.value = ''; affiliation.value = ''; type.value = ''; if (edition) edition.value = ''; render(); query.focus(); });
  render(); return render;
}
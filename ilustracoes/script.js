import { normalize } from '../data/cards.js';
import { illustrations } from '../data/illustrations.js';
import { galleryEntries } from '../data/gallery.js';

export const pendingCredit = 'Crédito em conferência';
const galleryIds = new Set(galleryEntries.map(card => card.id));

export function creditFor(art) {
  return typeof art.artist === 'string' && art.artist.trim() ? art.artist.trim() : pendingCredit;
}

export function filterIllustrations(collection, { query = '', artist = '' } = {}) {
  const search = normalize(query.trim());
  return collection.filter(art => (!artist || creditFor(art) === artist)
    && normalize(`${art.title} ${creditFor(art)}`).includes(search));
}

export function cardLinkFor(art) {
  return galleryIds.has(art.cardId) ? `/cartas/?carta=${encodeURIComponent(art.cardId)}` : null;
}

function createTile(art, open) {
  const tile = document.createElement('article');
  tile.className = 'art-tile';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'art-open';
  button.setAttribute('aria-label', `Ampliar ${art.title}${art.variant ? ` — ${art.variant}` : ''}. ${creditFor(art)}`);
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'artDialog');
  const image = document.createElement('img');
  image.src = art.thumbnail;
  image.alt = art.title;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = art.width;
  image.height = art.height;
  const thumbnail = document.createElement('div');
  thumbnail.className = 'art-thumbnail';
  thumbnail.append(image);
  const caption = document.createElement('div');
  caption.className = 'art-tile-caption';
  const title = document.createElement('h2');
  title.textContent = art.title;
  const credit = document.createElement('span');
  credit.className = 'art-credit';
  credit.textContent = creditFor(art);
  caption.append(title);
  if (art.variant) {
    const variant = document.createElement('span');
    variant.className = 'art-variant';
    variant.textContent = art.variant;
    caption.append(variant);
  }
  caption.append(credit);
  button.append(thumbnail, caption);
  button.addEventListener('click', () => open(art));
  tile.append(button);
  return tile;
}

function setupGallery() {
  const search = document.querySelector('#artSearch');
  const artist = document.querySelector('#artistFilter');
  const grid = document.querySelector('#artGrid');
  const count = document.querySelector('#artCount');
  const empty = document.querySelector('#artEmpty');
  const dialog = document.querySelector('#artDialog');
  const image = document.querySelector('#artDialogImage');
  const close = document.querySelector('#closeArtDialog');
  let previousOverflow;

  const artists = [...new Set(illustrations.map(creditFor))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const name of artists) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    artist.append(option);
  }

  function open(art) {
    image.src = art.image;
    image.alt = art.title;
    image.width = art.width;
    image.height = art.height;
    document.querySelector('#artDialogTitle').textContent = art.title;
    document.querySelector('#artDialogCredit').textContent = creditFor(art);
    const variant = document.querySelector('#artDialogVariant');
    variant.textContent = art.variant || '';
    variant.hidden = !art.variant;
    document.querySelector('#artFullImage').href = art.image;
    const card = document.querySelector('#artCardLink');
    const href = cardLinkFor(art);
    card.hidden = !href;
    if (href) card.href = href;
    else card.removeAttribute('href');
    if (!dialog.open) {
      previousOverflow = document.documentElement.style.overflow;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }
  }

  close.addEventListener('click', () => dialog.close());
  // Keep the native focus trap and return-to-trigger behavior.
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow ?? '';
  });

  function render() {
    const result = filterIllustrations(illustrations, { query: search.value, artist: artist.value });
    grid.replaceChildren(...result.map(art => createTile(art, open)));
    count.textContent = `${result.length} ${result.length === 1 ? 'ilustração encontrada' : 'ilustrações encontradas'} · ${illustrations.length} no acervo`;
    empty.hidden = result.length !== 0;
  }
  function reset() {
    search.value = '';
    artist.value = '';
    render();
    search.focus();
  }
  search.addEventListener('input', render);
  artist.addEventListener('change', render);
  document.querySelector('#resetArtFilters').addEventListener('click', reset);
  document.querySelector('#resetArtEmpty').addEventListener('click', reset);
  render();
}

if (typeof document !== 'undefined' && document.querySelector('#artGrid')) setupGallery();
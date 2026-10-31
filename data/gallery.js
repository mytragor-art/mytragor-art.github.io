import { cards, cardById } from './cards.js';

// Collection versions are not additional playable identities. Art Cards and
// Totems intentionally do not belong to this gallery.
const variants = [
  ['valbrak-full-art','escolhido_valbrak','Full Art','Valbrak_Full(versão4).png'],
  ['valbrak-full-art-v3','escolhido_valbrak','Promo','Valbrak_Full(versão3).png'],
  ['katsu-full-art','escolhido_katsuvingador','Full Art','Katsufull.png'],
  ['katsu-full-art-peb','escolhido_katsuvingador','Promo','katsu full PeB.png','Promo — PeB'],
  ['ademais-full-art','escolhido_Ademais','Full Art','Ademais_fullart.png'],
  ['leafae-full-art','escolhido_leafaefloresta','Full Art','Leafaefull.png'],
  ['thorn-full-art','thornmontanha','Full Art','Thorn full.png'],
  ['executor-full-art','Executor','Full Art','executor full.png'],
  ['gamboa-full-art','Gamboa','Full Art','gamboa_Full.png'],
  ['sede-vinganca-full-art','sedevinganca','Full Art','full sededevinganca.png'],
  ['protetor-full-art','protetor','Full Art','protetor full.png'],
  ['porco-espinho-full-art','porcoespinho','Full Art','porco-espinho full.Diogo.png'],
  ['valbrak-prestigio','escolhido_valbrak','Prestígio','Valbrak prestígio.png'],
  ['katsu-prestigio','escolhido_katsuvingador','Prestígio','prestigio katsu.png'],
  ['ademais-prestigio','escolhido_Ademais','Prestígio','Ademais prestigio.png'],
  ['leafae-prestigio','escolhido_leafaefloresta','Prestígio','leafae prestigio.png'],
  ['picapau-dourado','picapau','Promo','picapaudourado2.png']
];
export const collectionVariants = variants.map(([id, baseId, edition, file, editionLabel = edition]) => ({
  ...cardById.get(baseId), id, baseId, edition, editionLabel, galleryOnly: true,
  // This source contains stray lettering outside the actual 1843px card frame.
  // Crop only this verified export; retain every pixel of the card and credits.
  ...(id === 'ademais-full-art' ? { crop: { left: 0, top: 0, width: 1843, height: 2552 } } : {}),
  image: `/media/cartas/${id}.webp`, thumbnail: `/media/cartas/thumbs/${id}.webp`,
  reading: `/media/cartas/leitura/${id}.webp`, original: `/cartas.png/${file}`
}));
const fragmentSources = [
  ['fragmento_arcano','Fragmento Arcano','Arcano','layout-fragmento_arcano.png','Padrão'],
  ['fragmento_marcial','Fragmento Marcial','Marcial','layout-fragmento_marcial.png','Padrão'],
  ['fragmento_religioso','Fragmento Religioso','Religioso','layout-fragmento_religioso.png','Padrão'],
  ['fragmento_sombras','Fragmento Sombras','Sombras','layout-fragmento_sombras.png','Padrão'],
  ['fragmento_marcial_aerin','Fragmento Marcial — Aerin Nieloy','Marcial','fragmento marcial Aerin.png','Promo']
];
export const fragments = fragmentSources.map(([id, name, affiliation, file, edition]) => ({
  id, baseId: id === 'fragmento_marcial_aerin' ? 'fragmento_marcial' : id,
  name, affiliation, edition, type: 'Fragmento', cost: null, token: false, galleryOnly: true,
  description: 'Carta de Fragmento para representar os recursos da partida. Não integra as 40 cartas do baralho e não é um Escolhido.',
  image: `/media/cartas/${id}.webp`, thumbnail: `/media/cartas/thumbs/${id}.webp`,
  reading: `/media/cartas/leitura/${id}.webp`, original: `/cartas.png/${file}`
}));
export const galleryEntries = [
  ...cards.filter(card => !card.token).flatMap(card => [{ ...card, baseId: card.id, edition: 'Padrão' }, ...collectionVariants.filter(variant => variant.baseId === card.id)]),
  ...fragments
];
export const galleryById = new Map(galleryEntries.map(entry => [entry.id, entry]));
export const editions = ['Padrão', 'Full Art', 'Prestígio', 'Promo'];
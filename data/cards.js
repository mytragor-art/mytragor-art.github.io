// Names, affiliations and types checked against the supplied card images.
// Alternative art, old duplicate layouts and Fragment resource markers are not separate deck cards.
const entries = [
  ['escolhido_valbrak','Valbrak, o Mago Popular','Escolhido','Arcano',null,'Reúna Cidadãos: Valbrak permite comprar cartas ao convocá-los e pode fortalecer o Ataque deles.'],
  ['escolhido_katsuvingador','Katsu, o Vingador','Escolhido','Marcial',null,'Seus Guerreiros podem atacar inimigos Dispostos. Katsu também recompensa vitórias em combate.'],
  ['escolhido_Ademais','Ademais, Aranhas Negras','Escolhido','Sombras',null,'Convocar Aranhas Negras gera marcadores que Ademais pode transformar em dano ao Escolhido inimigo.'],
  ['escolhido_leafaefloresta','Leafae, o Guardião da Floresta','Escolhido','Religioso',null,'Curar seus Aliados gera marcadores Elo Vital, que podem ser usados para novas curas.'],
  ['aerinnieloyl','Aerin Nieloy','Aliado','Marcial',3],
  ['agiota','Aranhas Negras, Agiota','Aliado','Neutra',3],
  ['ajudapovo','Ajuda do Povo','Magia','Arcano',3],
  ['ambiente-caminhos','Caminhos Perigosos','Ambiente','Sombras',3],
  ['ambiente-campos','Caminhos Ensanguentados','Ambiente','Marcial',4],
  ['ambiente-catedral','Catedral Ensolarada','Ambiente','Religioso',3],
  ['ambiente-tempestade','Tempestade Arcana','Ambiente','Arcano',3],
  ['aprendizmagia','Aprendiz de Magia','Aliado','Neutra',1],
  ['aranhastoken','Aranhas Negras','Aliado','Neutra',0,'Totem gerado por efeito de carta; não faz parte do baralho original.',true],
  ['Arnoldescudeiro','Arnold, o Escudeiro','Aliado','Marcial',2],
  ['bartolomeu','Bartolomeu, o Inspirador','Aliado','Arcano',4],
  ['batedorkobold','Batedor Kobold','Aliado','Sombras',1],
  ['bomfruto','Bom Fruto','Magia','Religioso',2],
  ['caoferoz','Cão de Caça Feroz','Aliado','Neutra',4],
  ['cervobranco','Cervo de Galhos Brancos','Aliado','Religioso',3],
  ['charlataovila','Charlatão da Vila','Aliado','Arcano',2],
  ['cidadaostoken','Cidadãos Unidos','Aliado','Neutra',0,'Totem gerado por efeito de carta; não faz parte do baralho original.',true],
  ['constricao','Constrição','Truque','Religioso',4],
  ['controlecorrenteza','Controle de Correntezas','Magia','Religioso',4],
  ['espionagemsorrateira','Espionagem Sorrateira','Magia','Sombras',4],
  ['estudantearcano','Estudante Arcano','Aliado','Arcano',1],
  ['Executor','Aranhas Negras, Executor','Aliado','Sombras',5],
  ['frutoabencoadoai','Fruto Abençoado','Magia','Neutra',0],
  ['Gamboa','Gamboa, a Caçadora','Aliado','Neutra',4],
  ['gladiadoraposentado','Gladiador Aposentado','Aliado','Neutra',7],
  ['gladiadorimpenetravel','Gladiador Impenetrável','Aliado','Marcial',4],
  ['gladiadorimplacavel','Gladiador Implacável','Aliado','Marcial',5],
  ['gladiadorousado','Gladiador Ousado','Aliado','Neutra',4],
  ['gladiadorveloz','Gladiador Veloz','Aliado','Marcial',4],
  ['goblinsabotador','Goblin Sabotador','Aliado','Neutra',3],
  ['Hienacarniceira','Hiena Carniceira','Aliado','Neutra',3],
  ['informante','Aranhas Negras, Informante','Aliado','Sombras',5],
  ['informantebeco','Informante do Beco','Aliado','Neutra',2],
  ['invasaocativeiro','Invasão de Cativeiro','Magia','Neutra',3],
  ['Jabutibarreira','Jabuti Barreira','Aliado','Religioso',4],
  ['laminaserrilhada','Lâmina Serrilhada','Equipamento','Marcial',2],
  ['leãoreibarreira','Leão Rei Sagrado','Aliado','Religioso',6],
  ['livroarcanoinstavel','Livro Arcano Instável','Equipamento','Arcano',2],
  ['magia_bemtreinado','Bem Treinado','Magia','Marcial',5],
  ['magia_quebraaco','Quebra Aço','Magia','Neutra',1],
  ['mantocouro','Manto de Couro','Equipamento','Neutra',1],
  ['maosflamejantes','Mãos Flamejantes','Magia','Arcano',2],
  ['mascota','Aranhas Negras, Mascote','Aliado','Sombras',7],
  ['milicia','Aranhas Negras, Milícia','Magia','Sombras',3],
  ['milicianovila','Miliciano da Vila','Aliado','Neutra',2],
  ['novato','Aranhas Negras, Novato','Aliado','Neutra',1],
  ['observadora','Aranhas Negras, Observadora','Aliado','Sombras',1],
  ['orbeabsorcao','Orbe de Absorção','Equipamento','Arcano',4],
  ['picapau','Pica-pau Agulheiro','Aliado','Neutra',2],
  ['porcoespinho','Porco-Espinho Furioso','Aliado','Religioso',3],
  ['profanacaoterreno','Profanação de Terreno','Magia','Neutra',3],
  ['protetor','O Protetor','Aliado','Arcano',3],
  ['Queliceras','Aranhas Negras, Quelíceras','Equipamento','Sombras',3],
  ['redomasanta','Redoma Santa','Equipamento','Religioso',5],
  ['sedevinganca','Sede de Vingança','Magia','Marcial',5],
  ['tamandua','Tamanduá Guardião','Aliado','Religioso',2],
  ['thornmontanha','Thorn, o Martelo da Montanha','Aliado','Neutra',7],
  ['tonicorevigorante','Tônico Revigorante','Magia','Arcano',2],
  ['Toupeiraescavadora','Toupeira Escavadora','Aliado','Neutra',1],
  ['trocaenergia','Troca de Energia','Magia','Religioso',4],
  ['truque_alertadefuga','Alerta de Fuga','Truque','Marcial',2],
  ['truque_emboscada','Aranhas Negras, Emboscada','Truque','Sombras',3],
  ['truque_interrupçãoperfeita','Interrupção Perfeita','Truque','Arcano',2],
  ['ursonegro','Urso Negro','Aliado','Neutra',5],
  ['xamakobold','Xamã Kobold','Aliado','Sombras',2],
  ['Yohanronin','Yohan, Ronin Vigilante','Aliado','Marcial',2]
];

export const affiliations = ['Arcano', 'Marcial', 'Sombras', 'Religioso', 'Neutra'];
export const types = ['Escolhido', 'Aliado', 'Magia', 'Ambiente', 'Truque', 'Equipamento'];
export const typeDescriptions = {
  Escolhido: 'Seu líder começa em campo, fora das 40 cartas. Não ataca, mas pode usar as habilidades indicadas na carta.',
  Aliado: 'Um personagem que luta ao lado do seu Escolhido. Pague o custo em Fragmentos e coloque-o em um espaço livre. O limite é de cinco Aliados em campo.',
  Magia: 'Uma carta de efeito imediato. Resolva seu efeito e envie-a ao Cemitério.',
  Ambiente: 'Uma carta que altera a arena. Seus efeitos permanecem ativos enquanto estiver em campo.',
  Truque: 'Uma resposta que pode ser ativada da mão no turno de qualquer jogador, quando a condição da carta for atendida e o custo pago.',
  Equipamento: 'Uma carta de suporte acoplada a um personagem, concedendo os bônus ou habilidades descritos nela.'
};
export const cards = entries.map(([id, name, type, affiliation, cost, description = '', token = false]) => ({
  id, name, type, affiliation, cost, description, token,
  image: `/media/cartas/layout-${id}.webp`,
  thumbnail: `/media/cartas/thumbs/layout-${id}.webp`,
  reading: `/media/cartas/leitura/layout-${id}.webp`,
  original: `/cartas.png/layout-${id}.png`
}));
export const cardById = new Map(cards.map(card => [card.id, card]));
export function normalize(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
export function filterCards(list, { query = '', affiliation = '', type = '', edition = '' } = {}) {
  const term = normalize(query);
  return list.filter(card => (!affiliation || card.affiliation === affiliation) && (!type || card.type === type) && (!edition || card.edition === edition) &&
    (!term || normalize(`${card.name} ${card.description} ${card.type} ${card.affiliation} ${card.editionLabel || card.edition || ''}`).includes(term)));
}

# Site oficial Mytragor

Site estático em português para GitHub Pages no domínio `mytragor.com.br`. HTML, CSS e JavaScript nativos, sem backend, loja, contas ou rastreadores.

## Experiência e rotas

- `/`: apresentação, Escolhidos, percurso iniciante, universo, ferramentas, FAQ e compartilhamento.
- A home destaca a campanha de financiamento coletivo aberta na Meeple Starter. O banner original está em `propagandas/Mytragor-Campanha-Aberta-Simulador.png`; `node scripts/build-campaign.mjs` gera o WebP sem recortar a arte ou os créditos. O endereço `/#pre-campanha` permanece válido para links antigos.
- `/cartas/`: 90 entradas: 68 cartas base, 17 versões Full Art, Prestígio e Promo e cinco Fragmentos. Inclui Valbrak Full versão 3 e Katsu Full PeB, com rótulos próprios. Busca sem acentos, filtros combinados de edição/tipo/filiação, ampliação, seletor de versões e links diretos (`?carta=valbrak-prestigio`). Art Cards e Totens não entram na galeria. Versões não criam novas identidades no montador; Fragmentos são somente para consulta.
- `/comojogar/`: guia rápido, 23 assuntos pesquisáveis e manual com 22 páginas, incluindo capa. `?pagina=18#manual` abre uma página específica. Setas do teclado funcionam com o leitor em foco.
- `/baralho/`: montador com um Escolhido, 40 cartas, até três cópias e filiação compatível. Totens não entram no baralho. Rascunho local, exportação/importação JSON e cópia de lista textual; sem integração automática com o simulador.
- `/eventos/`: agenda e arquivo separados em Próximos e Concluídos. O Conexão TCG Brasil de 7 de novembro de 2026 está arquivado em `/eventos/#primeiro-evento`, sem chamada para ingressos. Não há próximos eventos anunciados; inclua apenas informações confirmadas.
- `/simuladordebatalha/`: redireciona ao simulador externo em `https://mytragor-battle-sim.vercel.app/index.html`.
- `/calculadora/`: calculadora de mesa integrada a partir de [mytragor-art/calculadora-mytragor](https://github.com/mytragor-art/calculadora-mytragor), revisão `5981fbd47a2922c45da0e3d8df376ae7175d7980`. Mantém Vida dos dois jogadores, cinco aliados por jogador, seleção de Escolhidos, d20, aviso de vitória e salvamento automático local. Acesso pelo menu e pelas ferramentas da home, com retorno ao site. O botão **Instalar app** oferece instalação no Android quando disponível e instruções para adicionar à Tela de Início pelo Safari no iPhone/iPad. Abra uma vez com internet para preparar o uso offline; requer HTTPS (ou localhost no desenvolvimento). O cache é exclusivo da calculadora e tenta buscar a versão atual online antes de usar a cópia offline.
- A rota integrada usa `/calculadora/` porque `/calculadora-mytragor/` é atendida pelo GitHub Pages do repositório original, mesmo com uma pasta homônima neste site.

Não foram inventados canais sociais, eventos, depoimentos, notícias ou duração estimada de partidas. A seção de comunidade permite compartilhar o site. Esses conteúdos só devem ser incluídos quando houver informação oficial verificável.

## Desenvolvimento e validação

Requer Node.js 20.9+ (testado com Node 24). No Windows, utilize `npm.cmd` se a política do PowerShell bloquear `npm.ps1`.

1. `npm.cmd install`: instala apenas as ferramentas de desenvolvimento.
2. `npm.cmd start`: inicia servidor em `http://127.0.0.1:4173`.
3. `npm.cmd test`: testa catálogo, imagens, busca, montagem, importações e links internos.
4. `npm.cmd run assets`: regenera imagens WebP com Sharp sem alterar os originais.

Também existem tarefas do VS Code **Prévia Mytragor** e **Testar Mytragor**. Use servidor HTTP, não abertura direta por `file://`: módulos JavaScript precisam de uma origem HTTP.

## Conteúdo e imagens

- `data/cards.js`: nomes, tipos, filiações e custos conferidos nas cartas, descrições dos Escolhidos e indicação de Totens. Atualize quando uma carta mudar.
- `data/gallery.js`: versões de coleção e Fragmentos, separados das identidades jogáveis. Full Art e Prestígio encaminham à carta base no montador. Valbrak da versão 3 (arte de André Martuscelli), Pica-pau dourado, Katsu PeB e Fragmento Aerin são Promo. Valbrak versão 4 continua Full Art. IDs antigos são mantidos para preservar links compartilhados. Totens e Art Cards ficam de fora. O Ademais Full Art tem recorte explícito do quadro 1843 × 2552 para excluir uma inscrição externa ao quadro da carta; o original permanece intacto.
- `data/rules.js`: resumos do manual com referências à numeração do leitor. PDF e cartas permanecem como fontes completas. Atropelar é uma palavra-chave, não uma regra geral de dano excedente.
- `cartas.png/` e `Ilustraçoes/`: acervo original, preservado. Imagens originais podem ser abertas pela galeria; créditos permanecem nas imagens.
- `manual/`: PDF, páginas originais e OCR original. A busca usa resumos revisados, não exibe OCR ruidoso como regra.
- `media/`: derivados WebP para publicação. Devem ser versionados; o site publicado não depende do Node ou do Sharp.
- As cartas WebP são recortadas pelos limites do canal alpha e enquadradas em 650 × 900, sem esticar a arte. Bordas, textos e créditos são preservados; apenas margens totalmente transparentes são removidas. `scripts/inspect-cards.mjs` permite conferir os limites dos originais.
- Os seis equipamentos usam os layouts atuais de `cartas.png/`, nas imagens de catálogo, miniaturas e ampliações. A versão atual da Redoma Santa dispensa o antigo recorte da linha branca inferior e preserva o layout completo. Para regenerar apenas esses derivados: `node scripts/update-cards.mjs laminaserrilhada livroarcanoinstavel mantocouro orbeabsorcao Queliceras redomasanta`.
- `lib/`: componentes da galeria e regras puras de montagem.
- `scripts/`: geração de imagens e servidor local.
- `tests/`: testes com executor nativo do Node.

O leitor usa `manual_capa.png`, páginas 1–21 (a 11 é JPG) e gera `media/manual/1.webp` até `22.webp`. As antigas referências a `/assets/` foram removidas em favor do acervo atual.

## Privacidade e publicação

O montador guarda somente o rascunho no `localStorage` do próprio navegador. Bloqueio ou corrupção do armazenamento não impede o uso nem a exportação. Trocar de Escolhido remove cartas incompatíveis, mantendo as Neutras. Limpar o baralho exige confirmação por segundo clique. Importação inválida preserva o rascunho atual.

Publique arquivos estáticos e mantenha `CNAME` e `.nojekyll` na raiz. Não publique `node_modules`. Não é necessário build no servidor. As fontes são solicitadas ao Google Fonts, com fontes de sistema como alternativa; o simulador é um serviço externo independente. A calculadora salva a partida somente no navegador e seu service worker usa um cache próprio, restrito à sua rota. Nenhum deploy é feito pelos testes locais.
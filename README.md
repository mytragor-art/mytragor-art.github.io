# Site oficial Mytragor

Site estático em português para GitHub Pages no domínio `mytragor.com.br`. HTML, CSS e JavaScript nativos, sem backend, loja, contas ou rastreadores.

## Experiência e rotas

- `/`: apresentação, Escolhidos, percurso iniciante, universo, ferramentas, FAQ e compartilhamento.
- `/cartas/`: 90 entradas: 68 cartas base, 17 versões Full Art, Prestígio e Promo e cinco Fragmentos. Inclui Valbrak Full versão 3 e Katsu Full PeB, com rótulos próprios. Busca sem acentos, filtros combinados de edição/tipo/filiação, ampliação, seletor de versões e links diretos (`?carta=valbrak-prestigio`). Art Cards e Totens não entram na galeria. Versões não criam novas identidades no montador; Fragmentos são somente para consulta.
- `/comojogar/`: guia rápido, 23 assuntos pesquisáveis e manual com 22 páginas, incluindo capa. `?pagina=18#manual` abre uma página específica. Setas do teclado funcionam com o leitor em foco.
- `/baralho/`: montador com um Escolhido, 40 cartas, até três cópias e filiação compatível. Totens não entram no baralho. Rascunho local, exportação/importação JSON e cópia de lista textual; sem integração automática com o simulador.
- `/simuladordebatalha/`: redireciona ao simulador externo em `https://mytragor-battle-sim.vercel.app/index.html`.
- Calculadora externa existente: `http://mytragor.com.br/calculadora-mytragor/`. Não está implementada neste repositório.

Não foram inventados canais sociais, eventos, depoimentos, notícias ou duração estimada de partidas. A seção de comunidade permite compartilhar o site. Esses conteúdos só devem ser incluídos quando houver informação oficial verificável.

## Desenvolvimento e validação

Requer Node.js 22.13+ (testado com Node 24). No Windows, utilize `npm.cmd` se a política do PowerShell bloquear `npm.ps1`.

1. `npm.cmd install`: instala apenas as ferramentas de desenvolvimento.
2. `npm.cmd start`: inicia servidor em `http://127.0.0.1:4173`.
3. `npm.cmd test`: testa catálogo, imagens, busca, montagem, importações e links internos.
4. `npm.cmd run assets`: regenera imagens WebP com Sharp sem alterar os originais.

Também existem tarefas do VS Code **Prévia Mytragor** e **Testar Mytragor**. Use servidor HTTP, não abertura direta por `file://`: módulos JavaScript precisam de uma origem HTTP.

## Conteúdo e imagens

- `data/cards.js`: nomes, tipos, filiações e custos conferidos nas cartas, descrições dos Escolhidos e indicação de Totens. Atualize quando uma carta mudar.
- `data/gallery.js`: versões de coleção e Fragmentos, separados das identidades jogáveis. Full Art e Prestígio encaminham à carta base no montador. Valbrak da versão 3 (arte de André Martuscelli), Pica-pau dourado, Katsu PeB e Fragmento Aerin são Promo. Valbrak versão 4 continua Full Art. IDs antigos são mantidos para preservar links compartilhados. Totens e Art Cards ficam de fora. O Ademais Full Art tem recorte explícito do quadro 1843 × 2552 para excluir uma inscrição externa ao quadro da carta; o original permanece intacto.
- `data/rules.js`: resumos do manual com referências à numeração do leitor. PDF e cartas permanecem como fontes completas. Atropelar é uma palavra-chave, não uma regra geral de dano excedente.
- `cartas.png/` e `Ilustraçoes/`: acervo original preservado apenas no computador, ignorado pelo Git. Não enviar os PNG/TIFF pesados. A galeria abre cópias WebP ampliadas, mantendo textos e créditos.
- `manual/`: o PDF e o índice são publicados; as páginas PNG/JPG de trabalho ficam apenas no computador. A busca usa resumos revisados, não exibe OCR ruidoso como regra.
- `media/`: derivados WebP para publicação. Devem ser versionados; o site publicado não depende do Node ou do Sharp.
- `media/cartas/thumbs/`: miniaturas 325 × 450 para listas, com seleção responsiva. `media/cartas/leitura/`: versões 1300 × 1800 carregadas apenas na ampliação. A versão intermediária continua 650 × 900.
- `media/acervo/`: versões leves de **todas** as cartas e ilustrações, inclusive as que não estão na galeria pública. Ilustrações até 1600 × 1600 e cartas até 1300 × 1800, sem distorção; thumbs até 360 × 360. O manifesto registra correspondências e economia de bytes. Converter o acervo não adiciona Art Cards nem Totens à galeria.
- `scripts/build-archive.mjs`: conversão sequencial com cache por data e parâmetros. Detecta o PDF salvo como Aerin fragmento.png e renderiza a primeira página localmente. Usa PDF.js e canvas apenas no desenvolvimento.
- As cartas WebP são recortadas pelos limites do canal alpha e enquadradas em 650 × 900, sem esticar a arte. Bordas, textos e créditos são preservados; apenas margens totalmente transparentes são removidas. `scripts/inspect-cards.mjs` permite conferir os limites dos originais.
- `lib/`: componentes da galeria e regras puras de montagem.
- `scripts/`: geração de imagens e servidor local.
- `tests/`: testes com executor nativo do Node.

O leitor usa `manual_capa.png`, páginas 1–21 (a 11 é JPG) e gera `media/manual/1.webp` até `22.webp`. As antigas referências a `/assets/` foram removidas em favor do acervo atual.

## Privacidade e publicação

O montador guarda somente o rascunho no `localStorage` do próprio navegador. Bloqueio ou corrupção do armazenamento não impede o uso nem a exportação. Trocar de Escolhido remove cartas incompatíveis, mantendo as Neutras. Limpar o baralho exige confirmação por segundo clique. Importação inválida preserva o rascunho atual.

Publique arquivos estáticos e mantenha `CNAME` e `.nojekyll` na raiz. Não publique `node_modules` nem os originais ignorados. Não é necessário build no servidor: um clone recebe os derivados prontos; para regenerá-los é preciso ter o acervo original local. As fontes são solicitadas ao Google Fonts, com fontes de sistema como alternativa; simulador e calculadora são serviços externos independentes. Nenhum deploy é feito pelos testes locais.
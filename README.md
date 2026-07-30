# Site oficial Mytragor

Site estático principal do Mytragor, preparado para publicação no GitHub Pages com o domínio `mytragor.com.br`.

## Rotas

- `/`: página inicial e navegação principal
- `/comojogar/`: leitor visual do guia Como Jogar
- `/calculadora-mytragor/`: calculadora oficial de mesa
- `https://mytragor-battle-sim.vercel.app/lobby.html`: simulador oficial publicado separadamente

## Testar antes de publicar

Abra o arquivo `index.html` no navegador. Para uma simulação mais fiel, use um servidor local, por exemplo, a extensão **Live Server** do VS Code.

## Estrutura

```text
/
├── index.html
├── styles.css
├── script.js
├── CNAME
├── assets/
│   ├── logo-dourado.png
│   ├── logo.png
│   └── manual_capa.png, manual_pg1.png ... manual_pg17.png
├── comojogar/
│   ├── index.html
│   ├── styles.css
│   └── script.js
```

O arquivo `CNAME` deve permanecer na raiz e conter somente `mytragor.com.br`. As páginas do guia ficam centralizadas em `assets/`; qualquer alteração em seus nomes deve ser refletida em `comojogar/script.js`.

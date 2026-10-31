import { rules, pageTitles } from '../data/rules.js';
import { normalize } from '../data/cards.js';
const ruleSearch = document.querySelector('#ruleSearch');
const ruleList = document.querySelector('#ruleList');
function renderRules() {
  const query = normalize(ruleSearch.value);
  const results = rules.filter(rule => normalize(`${rule.title} ${rule.text}`).includes(query));
  ruleList.replaceChildren();
  for (const rule of results) {
    const details = document.createElement('details'); details.className = 'rule'; details.open = Boolean(query);
    const summary = document.createElement('summary'); summary.textContent = rule.title;
    const text = document.createElement('p'); text.textContent = rule.text;
    const link = document.createElement('a'); link.className = 'text-link'; link.href = `?pagina=${rule.page}#manual`; link.textContent = `Consultar página ${rule.page} do leitor →`;
    link.addEventListener('click', event => { event.preventDefault(); setPage(rule.page); document.querySelector('#manual').scrollIntoView(); });
    details.append(summary, text, link); ruleList.append(details);
  }
  document.querySelector('#ruleCount').textContent = results.length ? `${results.length} ${results.length === 1 ? 'assunto encontrado' : 'assuntos encontrados'}` : 'Nenhuma regra encontrada. Experimente outro termo ou consulte o PDF.';
}
ruleSearch.addEventListener('input', renderRules);
document.querySelector('#resetRules').addEventListener('click', () => { ruleSearch.value = ''; renderRules(); ruleSearch.focus(); });
const select = document.querySelector('#manualPage');
const image = document.querySelector('#manualImage');
const status = document.querySelector('#readerStatus');
let current = 1;
for (const [index, title] of pageTitles.entries()) { const option = new Option(`${index + 1} / ${pageTitles.length} — ${title}`, String(index + 1)); select.add(option); }
function setPage(value, updateURL = true) {
  const parsed = Number(value);
  current = Number.isFinite(parsed) ? Math.min(pageTitles.length, Math.max(1, Math.trunc(parsed))) : 1;
  select.value = String(current);
  status.textContent = `Carregando página ${current}…`;
  image.src = `/media/manual/${current}.webp`;
  image.alt = `Página ${current} do leitor: ${pageTitles[current - 1]}`;
  document.querySelector('#pageLink').href = image.src;
  document.querySelector('#previousPage').disabled = current === 1;
  document.querySelector('#nextPage').disabled = current === pageTitles.length;
  if (updateURL) { const url = new URL(location.href); url.searchParams.set('pagina', current); history.replaceState(null, '', url); }
  if (image.complete && image.naturalWidth) status.textContent = `Página ${current} de ${pageTitles.length} — ${pageTitles[current - 1]}`;
}
image.addEventListener('load', () => { status.textContent = `Página ${current} de ${pageTitles.length} — ${pageTitles[current - 1]}`; });
image.addEventListener('error', () => { status.textContent = 'Não foi possível carregar a página. Tente novamente ou abra o manual em PDF.'; });
select.addEventListener('change', () => setPage(select.value));
document.querySelector('#previousPage').addEventListener('click', () => setPage(current - 1));
document.querySelector('#nextPage').addEventListener('click', () => setPage(current + 1));
document.querySelector('.reader').addEventListener('keydown', event => {
  if (event.target.matches('select,input,textarea')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setPage(current + (event.key === 'ArrowLeft' ? -1 : 1)); }
});
setPage(new URLSearchParams(location.search).get('pagina') || 1, false);
renderRules();
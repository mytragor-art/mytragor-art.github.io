const menuToggle = document.querySelector('.menu-toggle');
const mainMenu = document.querySelector('#mainMenu');
function closeMenu() {
  mainMenu?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Abrir menu');
}
menuToggle?.addEventListener('click', () => {
  const open = mainMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
mainMenu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mainMenu?.classList.contains('open')) { closeMenu(); menuToggle.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 861px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const currentYear = document.querySelector('#currentYear');
if (currentYear) currentYear.textContent = new Date().getFullYear();
document.querySelector('#shareGame')?.addEventListener('click', async () => {
  const status = document.querySelector('#shareStatus');
  const url = 'https://mytragor.com.br/';
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Mytragor Card Game', text: 'Escolha seu Escolhido e conheça Mytragor.', url });
      status.textContent = 'Obrigado por compartilhar Mytragor!';
    } else if (navigator.clipboard && isSecureContext) {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Link copiado. Envie para quem vai jogar com você!';
    } else status.textContent = `Compartilhe este endereço: ${url}`;
  } catch (error) {
    if (error.name !== 'AbortError') status.textContent = `Compartilhe este endereço: ${url}`;
  }
});
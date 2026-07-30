const pages = [
  { src: "/assets/manual_capa.png", label: "Capa" },
  ...Array.from({ length: 17 }, (_, index) => ({
    src: `/assets/manual_pg${index + 1}.png`,
    label: `Página ${index + 1}`,
  })),
];

const pageImage = document.querySelector("#manualPage");
const pageLabel = document.querySelector("#pageLabel");
const currentPage = document.querySelector("#currentPage");
const totalPages = document.querySelector("#totalPages");
const viewer = document.querySelector("#viewer");
const loading = document.querySelector("#loading");
const previousButtons = [
  document.querySelector("#previousButton"),
  document.querySelector("#footerPrevious"),
];
const nextButtons = [
  document.querySelector("#nextButton"),
  document.querySelector("#footerNext"),
];

let activeIndex = getInitialPage();
let touchStartX = 0;
let touchStartY = 0;
let isChanging = false;

totalPages.textContent = pages.length;

function getInitialPage() {
  const match = window.location.hash.match(/^#pagina-(\d+)$/);
  if (!match) return 0;

  const requestedPage = Number(match[1]);
  return Math.min(Math.max(requestedPage - 1, 0), pages.length - 1);
}

function updateControls() {
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === pages.length - 1;

  previousButtons.forEach((button) => {
    button.disabled = isFirst;
  });

  nextButtons.forEach((button) => {
    button.disabled = isLast;
  });

  document.querySelector("#footerNext").innerHTML = isLast
    ? 'Fim do manual <span aria-hidden="true">✓</span>'
    : 'Próxima <span aria-hidden="true">→</span>';
}

function updatePageInformation() {
  const page = pages[activeIndex];
  pageLabel.textContent = page.label;
  currentPage.textContent = activeIndex + 1;
  pageImage.alt = activeIndex === 0
    ? "Capa do manual Mytragor"
    : `${page.label} do manual Mytragor`;
  document.title = `${page.label} | Como Jogar Mytragor`;
  updateControls();
}

function preloadNearbyPages() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType)) return;

  [activeIndex - 1, activeIndex + 1].forEach((index) => {
    if (pages[index]) {
      const image = new Image();
      image.src = pages[index].src;
    }
  });
}

function showPage(nextIndex, direction = "next", updateHash = true) {
  const validIndex = Math.min(Math.max(nextIndex, 0), pages.length - 1);
  if (validIndex === activeIndex || isChanging) return;

  isChanging = true;
  pageImage.classList.add(direction === "previous" ? "changing-previous" : "changing-next");
  loading.classList.add("visible");

  const nextPage = pages[validIndex];
  const nextImage = new Image();

  nextImage.onload = () => {
    window.setTimeout(() => {
      activeIndex = validIndex;
      pageImage.src = nextPage.src;
      updatePageInformation();

      if (updateHash) {
        history.replaceState(null, "", `#pagina-${activeIndex + 1}`);
      }

      requestAnimationFrame(() => {
        pageImage.classList.remove("changing-next", "changing-previous");
        loading.classList.remove("visible");
        isChanging = false;
        preloadNearbyPages();
      });
    }, 110);
  };

  nextImage.onerror = () => {
    pageImage.classList.remove("changing-next", "changing-previous");
    loading.classList.remove("visible");
    isChanging = false;
    window.alert("Não foi possível carregar esta página. Verifique sua conexão e tente novamente.");
  };

  nextImage.src = nextPage.src;
}

function goToPreviousPage() {
  showPage(activeIndex - 1, "previous");
}

function goToNextPage() {
  showPage(activeIndex + 1, "next");
}

previousButtons.forEach((button) => button.addEventListener("click", goToPreviousPage));
nextButtons.forEach((button) => button.addEventListener("click", goToNextPage));

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    goToPreviousPage();
  }

  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    goToNextPage();
  }

  if (event.key === "Home") {
    event.preventDefault();
    showPage(0, "previous");
  }

  if (event.key === "End") {
    event.preventDefault();
    showPage(pages.length - 1, "next");
  }
});

viewer.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

viewer.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const distanceX = touch.clientX - touchStartX;
  const distanceY = touch.clientY - touchStartY;

  if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
  if (distanceX < 0) goToNextPage();
  if (distanceX > 0) goToPreviousPage();
}, { passive: true });

window.addEventListener("hashchange", () => {
  const requestedIndex = getInitialPage();
  if (requestedIndex !== activeIndex) {
    showPage(requestedIndex, requestedIndex < activeIndex ? "previous" : "next", false);
  }
});

pageImage.addEventListener("load", () => {
  loading.classList.remove("visible");
});

updatePageInformation();
if (!window.location.hash) {
  history.replaceState(null, "", "#pagina-1");
}
preloadNearbyPages();

const menuToggle = document.querySelector(".menu-toggle");
const mainMenu = document.querySelector("#mainMenu");

if (menuToggle && mainMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainMenu.addEventListener("click", () => {
    mainMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
}

const currentYear = document.querySelector("#currentYear");
if (currentYear) currentYear.textContent = new Date().getFullYear();

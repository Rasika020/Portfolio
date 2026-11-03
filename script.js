document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#site-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menuButton.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
      navigation.classList.toggle("is-open", !open);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      });
    });
  }

  const filters = Array.from(document.querySelectorAll("[data-filter]"));
  const projects = Array.from(document.querySelectorAll(".project[data-category]"));

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.filter || "all";

      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      projects.forEach((project) => {
        project.hidden = category !== "all" && project.dataset.category !== category;
      });
    });
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
});
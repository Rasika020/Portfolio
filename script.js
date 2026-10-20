document.addEventListener("DOMContentLoaded", () => {
  // Progressive enhancement: reveal content only when the browser supports observers.
  const revealTargets = document.querySelectorAll(".section, .project, .systems, .impact-strip, .contact");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("visible"));
  }

  const filters = document.querySelectorAll("[data-filter]");
  const projects = document.querySelectorAll(".project[data-category]");
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.filter || "all";
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      projects.forEach((project) => {
        const show = category === "all" || project.dataset.category === category;
        project.hidden = !show;
      });
    });
  });
});
document.documentElement.classList.add("js");

const scrollRegions = document.querySelectorAll(".table-scroll");

function updateScrollableState(region) {
  const isScrollable = region.scrollWidth > region.clientWidth + 1;
  region.toggleAttribute("data-scrollable", isScrollable);

  if (isScrollable) {
    region.setAttribute(
      "aria-description",
      "Таблица прокручивается по горизонтали. Используйте свайп или клавиши со стрелками."
    );
  } else {
    region.removeAttribute("aria-description");
  }
}

scrollRegions.forEach((region) => {
  updateScrollableState(region);

  region.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    region.scrollBy({
      left: event.key === "ArrowRight" ? 180 : -180,
      behavior: "smooth"
    });
  });
});

window.addEventListener("resize", () => {
  scrollRegions.forEach(updateScrollableState);
});

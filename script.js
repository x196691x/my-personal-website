document.documentElement.classList.add("js");

const hangingWordPattern = /(^|[\s(\[{«„"'])((?:а|без|бы|в|во|для|до|же|за|и|из|или|к|как|ко|ли|либо|на|над|не|ни|но|о|об|обо|от|по|под|при|про|с|со|у|что|чтобы))[ \t]+(?=\S)/giu;

function preventHangingWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!node.nodeValue.trim() || parent?.closest("script, style, code, pre")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    let text = node.nodeValue;
    let formattedText;

    // Several passes handle chains such as "и в приложении".
    do {
      formattedText = text.replace(hangingWordPattern, "$1$2\u00a0");

      if (formattedText === text) break;
      text = formattedText;
    } while (true);

    node.nodeValue = formattedText;
  });
}

document.querySelectorAll(".site-header, main").forEach(preventHangingWords);

document.querySelectorAll("[data-expandable-table]").forEach((tableBlock) => {
  const button = tableBlock.querySelector(".table-toggle");
  const label = tableBlock.querySelector("[data-table-toggle-label]");

  if (!button || !label) return;

  // Overlapping masked layers approximate a continuous 0–8 px backdrop blur.
  const control = button.parentElement;
  const blurLayers = document.createDocumentFragment();

  for (let step = 1; step <= 6; step += 1) {
    const layer = document.createElement("span");
    layer.className = "table-blur-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--blur-radius", `${(step / 6) * 8}px`);
    layer.style.setProperty("--blur-start", `${((step - 1) / 7) * 100}%`);
    layer.style.setProperty("--blur-solid", `${(step / 7) * 100}%`);
    layer.style.setProperty("--blur-end", `${((step + 1) / 7) * 100}%`);
    layer.style.setProperty("--blur-out", `${Math.min((step + 2) / 7, 1) * 100}%`);
    blurLayers.append(layer);
  }

  control.prepend(blurLayers);

  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const nextExpandedState = !isExpanded;

    tableBlock.classList.toggle("is-expanded", nextExpandedState);
    button.setAttribute("aria-expanded", String(nextExpandedState));
    label.textContent = nextExpandedState ? "Показать меньше" : "Показать больше";
  });
});

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

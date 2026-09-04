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

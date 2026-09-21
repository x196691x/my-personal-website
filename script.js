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

document.querySelector("[data-go-up]")?.addEventListener("click", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "instant" : "smooth" });
});

const caseNav = document.querySelector("[data-case-nav]");

if (caseNav) {
  const trigger = caseNav.querySelector(".case-nav__trigger");
  const links = [...caseNav.querySelectorAll(".case-nav__link")];
  const bars = [...caseNav.querySelectorAll(".case-nav__bar")];
  const targets = links.map((link) => document.querySelector(link.hash));
  let activeIndex = -1;
  let scrollTicking = false;

  function setNavOpen(isOpen) {
    caseNav.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));
  }

  function setActiveSection(index) {
    if (index === activeIndex) return;
    activeIndex = index;

    links.forEach((link, linkIndex) => {
      const isActive = linkIndex === index;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    bars.forEach((bar, barIndex) => {
      bar.classList.toggle("is-active", barIndex === index);
    });
  }

  function updateActiveSection() {
    const activationPoint = window.scrollY + Math.min(window.innerHeight * 0.35, 320);
    let nextIndex = 0;

    targets.forEach((target, index) => {
      if (target && target.offsetTop <= activationPoint) nextIndex = index;
    });

    setActiveSection(nextIndex);
    scrollTicking = false;
  }

  trigger.addEventListener("click", () => {
    setNavOpen(!caseNav.classList.contains("is-open"));
  });

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      const target = targets[index];
      if (!target) return;

      event.preventDefault();
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (index === 0) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "instant" : "smooth" });
      } else {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "instant" : "smooth", block: "start" });
      }

      setActiveSection(index);
      setNavOpen(false);
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    });
  });

  caseNav.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (!caseNav.contains(document.activeElement)) setNavOpen(false);
    });
  });

  caseNav.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setNavOpen(false);
    trigger.focus();
  });

  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateActiveSection);
  }, { passive: true });

  window.addEventListener("resize", updateActiveSection);
  updateActiveSection();
}

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

const imageLightbox = document.querySelector(".image-lightbox");

if (imageLightbox) {
  const enlargedImage = imageLightbox.querySelector(".image-lightbox__image");
  const closeButton = imageLightbox.querySelector(".image-lightbox__close");
  let imageTrigger = null;
  let savedScrollY = 0;
  let backgroundElements = [];

  // Only case illustrations are zoomable; the cover and UI icons stay unchanged.
  document.querySelectorAll(".case-article .case-image").forEach((image, index) => {
    if (index === 0) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-image-trigger";
    button.setAttribute("aria-label", `Увеличить: ${image.alt}`);
    button.setAttribute("aria-haspopup", "dialog");
    image.before(button);
    button.append(image);

    const zoomIcon = document.createElement("img");
    zoomIcon.className = "case-image-zoom-icon";
    zoomIcon.src = "assets/zoom-in.svg";
    zoomIcon.alt = "";
    zoomIcon.width = 24;
    zoomIcon.height = 24;
    button.append(zoomIcon);

    button.addEventListener("click", () => {
      imageTrigger = button;
      savedScrollY = window.scrollY;
      enlargedImage.src = image.currentSrc || image.src;
      enlargedImage.alt = image.alt;
      document.documentElement.style.setProperty("--lightbox-scroll-top", `-${savedScrollY}px`);
      document.documentElement.classList.add("lightbox-open");
      backgroundElements = [...document.body.children].filter(
        (element) => element !== imageLightbox && !element.inert && element.tagName !== "SCRIPT"
      );
      backgroundElements.forEach((element) => { element.inert = true; });
      imageLightbox.hidden = false;
      closeButton.focus({ preventScroll: true });
    });
  });

  closeButton.addEventListener("click", closeImageLightbox);
  imageLightbox.addEventListener("click", (event) => {
    if (event.target === imageLightbox) closeImageLightbox();
  });

  imageLightbox.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeImageLightbox();
    } else if (event.key === "Tab") {
      // The close button is the only focusable control in the dialog.
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    }
  });

  function closeImageLightbox() {
    if (imageLightbox.hidden) return;
    imageLightbox.hidden = true;
    backgroundElements.forEach((element) => { element.inert = false; });
    document.documentElement.classList.remove("lightbox-open");
    document.documentElement.style.removeProperty("--lightbox-scroll-top");
    window.scrollTo({ top: savedScrollY, behavior: "instant" });
    imageTrigger?.focus({ preventScroll: true });
    enlargedImage.removeAttribute("src");
    enlargedImage.alt = "";
  }
}

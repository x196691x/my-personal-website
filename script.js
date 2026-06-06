document.documentElement.classList.add("js");

const internalLinks = document.querySelectorAll('a[href$=".html"]');

internalLinks.forEach((link) => {
  link.addEventListener("click", () => {
    link.setAttribute("aria-current", "page");
  });
});

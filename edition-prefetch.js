/*
Prefetches an edition's team photo the moment the visitor
hovers its link, so the image is already cached by the time
they land on the page.

Skipped on touch devices: without real hover there's no early
signal to prefetch on, so the fetch would just compete with the
mobile connection for no benefit.
*/

const canHover = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

if (canHover.matches) {
  const editionLinks = document.querySelectorAll(
    "[data-prefetch-image]"
  );

  editionLinks.forEach(
    (link) => {
      link.addEventListener(
        "pointerenter",
        () => {
          const image = new Image();
          image.src = link.dataset.prefetchImage;
        },
        { once: true }
      );
    }
  );
}

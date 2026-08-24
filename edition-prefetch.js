/*
Prefetches an edition's team photo the moment the visitor
hovers its link, so the image is already cached by the time
they land on the page.

Skipped on touch devices: without real hover there's no early
signal to prefetch on, so the fetch would just compete with the
mobile connection for no benefit. This already rules out phones
regardless of any data-saving setting, since touchscreens don't
match (hover: hover) in the first place.

Also skipped when the browser reports a data-saving preference
(Chrome/Android's Data Saver, mainly) — covers the remaining
case of a hover-capable device, like a laptop, on a constrained
connection. Safari doesn't support this API at all, so it's a
no-op there rather than a gate.
*/

const canHover = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

const wantsReducedData = Boolean(
  navigator.connection && navigator.connection.saveData
);

if (canHover.matches && !wantsReducedData) {
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

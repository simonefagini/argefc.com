/*
Click-to-enlarge gallery: one shared lightbox overlay is filled in
with whichever image was clicked, rather than linking to a page per
image. Prev/next just walk the same .gallery-item list, wrapping
around at the ends.
*/

const items = Array.from(document.querySelectorAll(".gallery-item"));
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector(".lightbox-image");

let currentIndex = -1;

function open(index) {
  currentIndex = (index + items.length) % items.length;

  const img = items[currentIndex].querySelector("img");
  lightboxImage.src = img.src;
  lightboxImage.alt = img.alt;

  lightbox.hidden = false;
  lightbox.querySelector(".lightbox-close").focus();
}

function close() {
  lightbox.hidden = true;
  lightboxImage.src = "";

  if (currentIndex >= 0) {
    items[currentIndex].focus();
  }
  currentIndex = -1;
}

items.forEach((item, index) => {
  item.addEventListener("click", () => open(index));
});

lightbox.querySelector(".lightbox-close").addEventListener("click", close);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => open(currentIndex - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => open(currentIndex + 1));

// Click the dark backdrop (not the image itself) to close.
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    close();
  }
});

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) {
    return;
  }

  if (event.key === "Escape") {
    close();
  } else if (event.key === "ArrowLeft") {
    open(currentIndex - 1);
  } else if (event.key === "ArrowRight") {
    open(currentIndex + 1);
  }
});

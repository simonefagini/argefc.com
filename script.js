const introTrigger = document.querySelector("#intro-trigger");
const beeFlight = document.querySelector(".bee-flight");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

let isExiting = false;


/* Enable hover after all entrance animations */

if (reducedMotion) {
  document.body.classList.add("intro-ready");
} else {
  window.setTimeout(() => {
    document.body.classList.add("intro-ready");
  }, 2200);
}


/* Exit animation, then open the linked page */

introTrigger.addEventListener("click", (event) => {
  event.preventDefault();

  if (isExiting) return;

  isExiting = true;

  const destination = introTrigger.href;

  if (reducedMotion) {
    window.location.assign(destination);
    return;
  }

  document.body.classList.remove("intro-ready");
  document.body.classList.add("is-exiting");

  beeFlight.addEventListener(
    "animationend",
    () => {
      window.location.assign(destination);
    },
    { once: true }
  );
});

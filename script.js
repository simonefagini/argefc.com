const introTrigger = document.querySelector("#intro-trigger");
const beeFlight = document.querySelector(".bee-flight");

const INTRO_READY_DELAY = 2200;
const EXIT_FALLBACK_DELAY = 3500;

let isExiting = false;


/* Enable desktop hover after the complete entrance */

window.setTimeout(() => {
  document.body.classList.add("intro-ready");
}, INTRO_READY_DELAY);


/* Exit animation, then open the linked page */

introTrigger.addEventListener("click", (event) => {
  event.preventDefault();

  if (isExiting) return;

  isExiting = true;

  const destination = introTrigger.href;

  document.body.classList.remove("intro-ready");
  document.body.classList.add("is-exiting");

  let hasNavigated = false;

  const navigate = () => {
    if (hasNavigated) return;

    hasNavigated = true;
    window.location.assign(destination);
  };

  beeFlight.addEventListener(
    "animationend",
    navigate,
    { once: true }
  );

  /* Fallback in case animationend is not fired */
  window.setTimeout(navigate, EXIT_FALLBACK_DELAY);
});

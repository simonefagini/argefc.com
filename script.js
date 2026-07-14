const introTrigger = document.querySelector("#intro-trigger");
const logo = document.querySelector(".logo");
const sticker = document.querySelector(".sticker");

const INTRO_READY_DELAY = 3250;
const EXIT_FALLBACK_DELAY = 1800;
const BOUNCE_DELAY = 800;

let isExiting = false;


/* Bounce automatically after sticker reveal */

sticker.addEventListener("animationend", (event) => {
  if (event.animationName !== "sticker-reveal") {
    return;
  }

  window.setTimeout(() => {
    if (!isExiting) {
      introTrigger.classList.add("intro-bounce");
    }
  }, BOUNCE_DELAY);
});


/* Remove the temporary class after the bounce */

introTrigger.addEventListener("animationend", (event) => {
  if (event.animationName !== "hover-bounce") {
    return;
  }

  introTrigger.classList.remove("intro-bounce");
});


/* Enable click after the sticker has entered */

window.setTimeout(() => {
  document.body.classList.add("intro-ready");

  introTrigger.setAttribute("aria-disabled", "false");
  introTrigger.removeAttribute("tabindex");
}, INTRO_READY_DELAY);


/* Click, animate the bee, then navigate */

introTrigger.addEventListener("click", (event) => {
  event.preventDefault();

  const isReady =
    document.body.classList.contains("intro-ready");

  if (!isReady || isExiting) {
    return;
  }

  isExiting = true;

  const destination = introTrigger.href;

  document.body.classList.remove("intro-ready");
  document.body.classList.add("is-exiting");

  introTrigger.classList.remove("intro-bounce");
  introTrigger.setAttribute("aria-disabled", "true");

  let hasNavigated = false;

  const navigate = () => {
    if (hasNavigated) {
      return;
    }

    hasNavigated = true;
    window.location.assign(destination);
  };

  const handleAnimationEnd = (animationEvent) => {
    if (animationEvent.animationName === "bee-horizontal") {
      navigate();
    }
  };

  logo.addEventListener(
    "animationend",
    handleAnimationEnd,
    { once: true }
  );

  window.setTimeout(
    navigate,
    EXIT_FALLBACK_DELAY
  );
});

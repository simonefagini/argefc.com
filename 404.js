const errorLink = document.querySelector("#error-link");
const errorEnter = document.querySelector(".error-enter");

/*
Slightly longer than the 600ms error-exit CSS animation,
so animationend normally wins the race. Also covers
prefers-reduced-motion, where that animation never plays.
*/
const EXIT_FALLBACK_DELAY = 650;

/*
Auto-redirect home if the visitor doesn't click.
*/
const AUTO_REDIRECT_DELAY = 30000;

let isExiting = false;
let autoRedirectTimer = null;


/* Play the exit animation, then navigate */

function startExit() {
  if (isExiting) {
    return;
  }

  isExiting = true;

  window.clearTimeout(autoRedirectTimer);

  const destination = errorLink.href;

  document.body.classList.add("is-exiting");

  let hasNavigated = false;

  const navigate = () => {
    if (hasNavigated) {
      return;
    }

    hasNavigated = true;
    window.location.assign(destination);
  };

  const handleAnimationEnd = (animationEvent) => {
    if (animationEvent.animationName === "error-exit") {
      navigate();
    }
  };

  errorEnter.addEventListener(
    "animationend",
    handleAnimationEnd,
    { once: true }
  );

  window.setTimeout(
    navigate,
    EXIT_FALLBACK_DELAY
  );
}


/* Click */

errorLink.addEventListener("click", (event) => {
  event.preventDefault();
  startExit();
});


/* Auto-redirect */

autoRedirectTimer = window.setTimeout(
  startExit,
  AUTO_REDIRECT_DELAY
);

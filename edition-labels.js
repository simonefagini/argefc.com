/*
Reveals a team photo's name labels (see .edition-labels in
edition.css) on long-press. Desktop gets a plain CSS :hover for
this; touch devices have no hover state at all, so pressing and
holding is the equivalent here — release, or dragging off the
photo, hides the labels again.
*/

const LONG_PRESS_DURATION = 400;

const frames = document.querySelectorAll(".image-frame");

frames.forEach(
  (frame) => {
    let pressTimer = null;

    const reveal = () => {
      frame.classList.add("is-revealed");
    };

    const cancel = () => {
      window.clearTimeout(pressTimer);
      frame.classList.remove("is-revealed");
    };

    frame.addEventListener(
      "pointerdown",
      () => {
        pressTimer = window.setTimeout(reveal, LONG_PRESS_DURATION);
      }
    );

    frame.addEventListener("pointerup", cancel);
    frame.addEventListener("pointercancel", cancel);
    frame.addEventListener("pointerleave", cancel);
  }
);

const svg = document.querySelector("#fly-svg");
const trailGroup = document.querySelector("#trail-group");
const bee = document.querySelector("#flying-bee");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";


/* ---------------------------------
   Controls
--------------------------------- */

/*
Higher values = slower bee.

16000 means that one flight lasts
approximately 16 seconds.
*/
const MIN_FLIGHT_DURATION = 18000;
const MAX_FLIGHT_DURATION = 21000;


/*
Corrects the orientation of the PNG.

Use -90 instead if the bee points
in the opposite direction.
*/
const BEE_ROTATION_OFFSET = 90;


/*
How quickly each dash disappears.
*/
const TRAIL_LIFETIME = 3500;


/*
Distance between the dashes.
*/
const DASH_SPACING = 20;


/*
Length of each dash.
*/
const DASH_LENGTH = 5;


/*
Thickness of each dash.
*/
const DASH_THICKNESS = 2.2;


/*
How far behind the bee's current position the trail's
leading dot sits — a gap, rather than starting right
under the bee.
*/
const TRAIL_GAP = 5;


/*
Pause between one flight and the next.
*/
const MIN_FLIGHT_DELAY = 1000;
const MAX_FLIGHT_DELAY = 5000;


/*
Keeps flights gentle: a route is only accepted if its heading
never has to turn more than this much overall, and never gets
closer than MIN_ANGLE_FROM_VERTICAL to straight up/down — both
are exactly the situations where the anchor-based rotation is
most visible if it's ever slightly off.
*/
const MAX_HEADING_SWEEP = 90;
const MIN_ANGLE_FROM_VERTICAL = 25;
const MAX_ROUTE_ATTEMPTS = 30;


/* ---------------------------------
   State
--------------------------------- */

let animationFrame = null;
let nextFlightTimer = null;
let endFlightTimer = null;
let resizeTimer = null;

let lastDashDistance = 0;

/*
Mobile browsers change window.innerHeight (and fire "resize")
when the address bar shows/hides on scroll. Tracking the width
lets us ignore those height-only wobbles and only react to an
actual resize (window resizing, orientation change).
*/
let lastViewportWidth = window.innerWidth;

/*
On narrow screens the page is much taller than it is wide,
so a fully random entry side could start the first flight
far below the fold. Force the very first flight to enter
from the top there, so the bee is visible without scrolling.
*/
let isFirstFlight = true;
const MOBILE_BREAKPOINT = 700;

const activeDashes = new Map();


/* ---------------------------------
   Invisible route
--------------------------------- */

const routePath = document.createElementNS(
  SVG_NAMESPACE,
  "path"
);

routePath.setAttribute("fill", "none");
routePath.setAttribute("stroke", "none");

svg.appendChild(routePath);


/* ---------------------------------
   Helpers
--------------------------------- */

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}


/*
Reads the --bee-anchor-x / --bee-anchor-y custom properties
from home.css, so the translate offset below always matches
whatever transform-origin is currently using — tunable live
in DevTools without the pivot and the anchor drifting apart.
*/
function getAnchorPercent(propertyName, fallback) {
  const raw = getComputedStyle(bee)
    .getPropertyValue(propertyName)
    .trim();

  const parsed = parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : fallback;
}


function getRandomSidePoint(
  side,
  width,
  height,
  margin
) {
  switch (side) {
    case 0:
      return {
        x: randomBetween(0, width),
        y: -margin
      };

    case 1:
      return {
        x: width + margin,
        y: randomBetween(0, height)
      };

    case 2:
      return {
        x: randomBetween(0, width),
        y: height + margin
      };

    default:
      return {
        x: -margin,
        y: randomBetween(0, height)
      };
  }
}


/*
Exact tangent direction of a cubic Bezier at parameter t
(0 = start, 1 = end), in degrees. Used to vet a candidate
route before committing to it — cheap since it's plain math,
no DOM/SVG measurement involved.
*/
function cubicTangentAngle(
  p0,
  p1,
  p2,
  p3,
  t
) {
  const mt = 1 - t;

  const dx =
    3 * mt * mt * (p1.x - p0.x) +
    6 * mt * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);

  const dy =
    3 * mt * mt * (p1.y - p0.y) +
    6 * mt * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);

  return Math.atan2(dy, dx) * (180 / Math.PI);
}


/*
Rejects routes that would need a sharp overall turn or that
pass too close to straight up/down at any sampled point.
*/
function isRouteHeadingSafe(
  start,
  controlOne,
  controlTwo,
  end
) {
  const samples = [0, 0.25, 0.5, 0.75, 1].map(
    (t) =>
      cubicTangentAngle(
        start,
        controlOne,
        controlTwo,
        end,
        t
      )
  );

  // Unwrap so consecutive samples don't jump by ±360.
  const unwrapped = [samples[0]];

  for (let i = 1; i < samples.length; i++) {
    let angle = samples[i];
    const previous = unwrapped[i - 1];

    while (angle - previous > 180) angle -= 360;
    while (angle - previous < -180) angle += 360;

    unwrapped.push(angle);
  }

  const sweep =
    Math.max(...unwrapped) - Math.min(...unwrapped);

  if (sweep > MAX_HEADING_SWEEP) {
    return false;
  }

  return !samples.some((angle) => {
    const normalized = ((angle % 180) + 180) % 180;
    return (
      Math.abs(normalized - 90) <
      MIN_ANGLE_FROM_VERTICAL
    );
  });
}


/* ---------------------------------
   Create random curved route
--------------------------------- */

function createRoute() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const margin = 100;

  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );

  const forceTopStart =
    isFirstFlight &&
    width <= MOBILE_BREAKPOINT;

  isFirstFlight = false;

  let start;
  let end;
  let controlOne;
  let controlTwo;

  for (
    let attempt = 0;
    attempt < MAX_ROUTE_ATTEMPTS;
    attempt++
  ) {
    const startSide = forceTopStart
      ? 0 // top
      : Math.floor(Math.random() * 4);

    let endSide = Math.floor(
      Math.random() * 4
    );

    while (endSide === startSide) {
      endSide = Math.floor(
        Math.random() * 4
      );
    }

    start = getRandomSidePoint(
      startSide,
      width,
      height,
      margin
    );

    end = getRandomSidePoint(
      endSide,
      width,
      height,
      margin
    );

    controlOne = {
      x: randomBetween(
        width * 0.1,
        width * 0.9
      ),
      y: randomBetween(
        height * 0.08,
        height * 0.92
      )
    };

    controlTwo = {
      x: randomBetween(
        width * 0.1,
        width * 0.9
      ),
      y: randomBetween(
        height * 0.08,
        height * 0.92
      )
    };

    if (
      isRouteHeadingSafe(
        start,
        controlOne,
        controlTwo,
        end
      )
    ) {
      break;
    }

    // Otherwise: loop and try a fresh random route.
  }

  return `
    M ${start.x} ${start.y}
    C ${controlOne.x} ${controlOne.y},
      ${controlTwo.x} ${controlTwo.y},
      ${end.x} ${end.y}
  `;
}


/* ---------------------------------
   Create one fading dash
--------------------------------- */

function createTrailDash(
  distance,
  totalLength
) {
  const endDistance = Math.min(
    distance,
    totalLength
  );

  const startDistance = Math.max(
    endDistance - DASH_LENGTH,
    0
  );

  const startPoint =
    routePath.getPointAtLength(
      startDistance
    );

  const endPoint =
    routePath.getPointAtLength(
      endDistance
    );

  const dash = document.createElementNS(
    SVG_NAMESPACE,
    "line"
  );

  dash.classList.add("trail-dash");

  dash.setAttribute("x1", startPoint.x);
  dash.setAttribute("y1", startPoint.y);
  dash.setAttribute("x2", endPoint.x);
  dash.setAttribute("y2", endPoint.y);

  /*
  These properties are also defined here,
  so the trail works even if the CSS class
  is accidentally missing.
  */

  dash.style.stroke = "var(--orange)";
  dash.style.strokeWidth = DASH_THICKNESS;
  dash.style.strokeLinecap = "round";
  dash.style.opacity = "0.5";

  trailGroup.appendChild(dash);

  const fadeAnimation = dash.animate(
    [
      {
        opacity: 0.5
      },
      {
        opacity: 0
      }
    ],
    {
      duration: TRAIL_LIFETIME,
      easing: "linear",
      fill: "forwards"
    }
  );

  activeDashes.set(
    dash,
    fadeAnimation
  );

  fadeAnimation.finished
    .catch(() => {
      /*
      Animation cancellation is expected
      when the page is hidden or resized.
      */
    })
    .finally(() => {
      dash.remove();
      activeDashes.delete(dash);
    });
}


/* ---------------------------------
   Add dashes up to current position
--------------------------------- */

function updateTrail(
  currentDistance,
  totalLength
) {
  const targetDistance = Math.max(
    currentDistance - TRAIL_GAP,
    0
  );

  while (
    targetDistance - lastDashDistance >=
    DASH_SPACING
  ) {
    lastDashDistance += DASH_SPACING;

    createTrailDash(
      lastDashDistance,
      totalLength
    );
  }
}


/* ---------------------------------
   Remove current flight
--------------------------------- */

function stopFlight() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  clearTimeout(endFlightTimer);

  bee.style.opacity = "0";

  activeDashes.forEach(
    (animation, dash) => {
      animation.cancel();
      dash.remove();
    }
  );

  activeDashes.clear();
  trailGroup.replaceChildren();

  routePath.setAttribute("d", "");
  lastDashDistance = 0;
}


/* ---------------------------------
   Schedule next flight
--------------------------------- */

function scheduleNextFlight(delay) {
  clearTimeout(nextFlightTimer);

  const selectedDelay =
    delay ??
    randomBetween(
      MIN_FLIGHT_DELAY,
      MAX_FLIGHT_DELAY
    );

  nextFlightTimer = window.setTimeout(
    startFlight,
    selectedDelay
  );
}


/* ---------------------------------
   Start one flight
--------------------------------- */

function startFlight() {
  if (
    reducedMotion.matches ||
    document.hidden
  ) {
    scheduleNextFlight();
    return;
  }

  stopFlight();

  routePath.setAttribute(
    "d",
    createRoute()
  );

  const totalLength =
    routePath.getTotalLength();

  const duration = randomBetween(
    MIN_FLIGHT_DURATION,
    MAX_FLIGHT_DURATION
  );

  const startTime = performance.now();

  bee.style.opacity = "0";


  function animate(currentTime) {
    const elapsed =
      currentTime - startTime;

    const progress = Math.min(
      elapsed / duration,
      1
    );

    const currentDistance =
      totalLength * progress;

    const point =
      routePath.getPointAtLength(
        currentDistance
      );


    /*
    Calculate the tangent using one point
    before and one point after the bee.
    */

    const tangentDistance = 5;

    const previousPoint =
      routePath.getPointAtLength(
        Math.max(
          currentDistance -
          tangentDistance,
          0
        )
      );

    const nextPoint =
      routePath.getPointAtLength(
        Math.min(
          currentDistance +
          tangentDistance,
          totalLength
        )
      );

    const tangentAngle =
      Math.atan2(
        nextPoint.y - previousPoint.y,
        nextPoint.x - previousPoint.x
      ) *
      (180 / Math.PI);

    const beeAngle =
      tangentAngle +
      BEE_ROTATION_OFFSET;


    /* Fade the bee in and out */

    let opacity = 1;

    if (progress < 0.05) {
      opacity = progress / 0.05;
    }

    if (progress > 0.95) {
      opacity =
        (1 - progress) / 0.05;
    }

    bee.style.opacity = String(
      Math.max(
        0,
        Math.min(1, opacity)
      )
    );


    /*
    Position and rotate the PNG so that
    it remains tangent to the route.
    */

    const anchorX = getAnchorPercent(
      "--bee-anchor-x",
      50
    );

    const anchorY = getAnchorPercent(
      "--bee-anchor-y",
      50
    );

    bee.style.transform = `
      translate3d(
        ${point.x}px,
        ${point.y}px,
        0
      )
      translate(${-anchorX}%, ${-anchorY}%)
      rotate(${beeAngle}deg)
    `;


    /*
    The most recent dash ends at the bee,
    while older dashes disappear individually.
    */

    updateTrail(
      currentDistance,
      totalLength
    );


    if (progress < 1) {
      animationFrame =
        requestAnimationFrame(
          animate
        );

      return;
    }


    animationFrame = null;
    bee.style.opacity = "0";


    /*
    Wait for the final dashes to fade,
    then schedule a new flight.
    */

    endFlightTimer = window.setTimeout(
      () => {
        scheduleNextFlight();
      },
      TRAIL_LIFETIME
    );
  }


  animationFrame =
    requestAnimationFrame(animate);
}


/* ---------------------------------
   Page visibility
--------------------------------- */

document.addEventListener(
  "visibilitychange",
  () => {
    clearTimeout(nextFlightTimer);
    stopFlight();

    if (!document.hidden) {
      scheduleNextFlight(1500);
    }
  }
);


/* ---------------------------------
   Window resizing
--------------------------------- */

window.addEventListener(
  "resize",
  () => {
    const currentWidth = window.innerWidth;

    if (currentWidth !== lastViewportWidth) {
      /*
      A real resize is happening (as opposed to a mobile
      address-bar height wobble) — hide the bee right away
      instead of waiting for the debounce below.
      */
      clearTimeout(nextFlightTimer);
      stopFlight();
    }

    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(
      () => {
        const settledWidth = window.innerWidth;

        if (settledWidth === lastViewportWidth) {
          // Height-only change (mobile address bar on scroll) — ignore.
          return;
        }

        lastViewportWidth = settledWidth;

        if (!reducedMotion.matches) {
          scheduleNextFlight(1200);
        }
      },
      200
    );
  }
);


/* ---------------------------------
   Reduced-motion preference
--------------------------------- */

reducedMotion.addEventListener(
  "change",
  () => {
    clearTimeout(nextFlightTimer);
    stopFlight();

    if (!reducedMotion.matches) {
      scheduleNextFlight(1500);
    }
  }
);


/* ---------------------------------
   First flight
--------------------------------- */

if (!reducedMotion.matches) {
  scheduleNextFlight(1800);
}

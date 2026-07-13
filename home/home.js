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
const MIN_FLIGHT_DURATION = 16000;
const MAX_FLIGHT_DURATION = 22000;


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
Pause between one flight and the next.
*/
const MIN_FLIGHT_DELAY = 5000;
const MAX_FLIGHT_DELAY = 10000;


/* ---------------------------------
   State
--------------------------------- */

let animationFrame = null;
let nextFlightTimer = null;
let endFlightTimer = null;
let resizeTimer = null;

let lastDashDistance = 0;

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

  const startSide = Math.floor(
    Math.random() * 4
  );

  let endSide = Math.floor(
    Math.random() * 4
  );

  while (endSide === startSide) {
    endSide = Math.floor(
      Math.random() * 4
    );
  }

  const start = getRandomSidePoint(
    startSide,
    width,
    height,
    margin
  );

  const end = getRandomSidePoint(
    endSide,
    width,
    height,
    margin
  );

  const controlOne = {
    x: randomBetween(
      width * 0.1,
      width * 0.9
    ),
    y: randomBetween(
      height * 0.08,
      height * 0.92
    )
  };

  const controlTwo = {
    x: randomBetween(
      width * 0.1,
      width * 0.9
    ),
    y: randomBetween(
      height * 0.08,
      height * 0.92
    )
  };

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
  dash.style.strokeWidth = "1.8";
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
  while (
    currentDistance - lastDashDistance >=
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

    bee.style.transform = `
      translate3d(
        ${point.x}px,
        ${point.y}px,
        0
      )
      translate(-47%, -50%)
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
    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(
      () => {
        clearTimeout(nextFlightTimer);
        stopFlight();

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

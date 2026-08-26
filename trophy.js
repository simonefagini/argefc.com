/*
Touch devices get a separate model: resources/sam-cup-mobile.glb,
exported with metalness baked to 0 directly in the material, rather
than patched at runtime — the default model's fully metallic material
depends on environment-map reflections that were never confirmed to
render correctly on mobile GPUs/browsers (see git history).

Swapping the src attribute here, before model-viewer's custom element
definition has necessarily finished loading, means the desktop file
is never even fetched on mobile.
*/

const isTouchDevice = !window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

if (isTouchDevice) {
  const model = document.querySelector(".trophy-model");

  if (model) {
    model.setAttribute("src", "/resources/sam-cup-mobile.glb");
  }
}

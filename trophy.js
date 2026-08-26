/*
The trophy's material is fully metallic, so its appearance comes
almost entirely from reflected environment light rather than the
base texture itself. model-viewer generates that environment map at
runtime via half-float render targets, which some mobile GPUs/
browsers (older iOS Safari included) fail to do — leaving a metal
surface with nothing to reflect, i.e. solid black, even once the
geometry and textures themselves are rendering fine.

WebGL2 doesn't have this failure mode, so this only steps in where
WebGL2 itself isn't available, swapping in model-viewer's simpler
"legacy" lighting there instead of the richer generated environment —
leaving the desktop appearance untouched.
*/

const supportsWebGL2 = Boolean(
  document.createElement("canvas").getContext("webgl2")
);

if (!supportsWebGL2) {
  const model = document.querySelector(".trophy-model");

  if (model) {
    model.setAttribute("environment-image", "legacy");
  }
}

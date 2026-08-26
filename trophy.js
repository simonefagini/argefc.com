/*
The trophy's material is fully metallic, so its appearance normally
comes almost entirely from reflected environment light rather than
direct lighting. model-viewer generates that environment map at
runtime, and that generation has proven unreliable across mobile
GPUs/browsers (see git history for two earlier attempts at pinning
down exactly why and gating around it — neither fixed it). Rather
than keep chasing the specific GPU/driver quirk, touch devices get
the material's metalness dialled to zero and roughness maxed out
instead: a fully diffuse/matte surface is lit by model-viewer's
ordinary direct+ambient lighting, no environment map involved at
all, so this side-steps the problem instead of depending on
detecting it correctly.
*/

const isTouchDevice = !window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

if (isTouchDevice) {
  const model = document.querySelector(".trophy-model");

  if (model) {
    model.addEventListener("load", () => {
      const [material] = model.model.materials;

      if (material) {
        material.pbrMetallicRoughness.setMetallicFactor(0);
        material.pbrMetallicRoughness.setRoughnessFactor(1);
      }
    });
  }
}

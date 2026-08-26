/*
The trophy's material is fully metallic, and its appearance depends
on model-viewer's runtime-generated environment map for reflections,
which has never been confirmed to render correctly on mobile (see
git history for two earlier, inconclusive attempts at pinning that
down). Rather than keep chasing it, touch devices get the material's
metalness dialled to zero and roughness maxed out instead: a fully
diffuse/matte surface is lit by model-viewer's ordinary
direct+ambient lighting, no environment map involved at all.

The base color texture itself was a separate problem, now fixed at
the source instead of worked around here: it's a PNG with an
embedded ICC color profile, which is a known trip-up for Safari's
image-decode-to-WebGL-texture pipeline and was very likely the real
cause of the trophy rendering fully black on iPhone even before the
metalness above was ever a factor. The profile has been stripped
from resources/sam-cup.glb directly (metadata only — the pixel data
itself is untouched), so the texture no longer needs to be worked
around here.
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

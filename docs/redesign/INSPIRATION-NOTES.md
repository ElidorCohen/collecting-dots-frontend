# Future interaction references

## Lando Norris portrait opener — reviewed 2026-10-20

Source: [landonorris.com](https://landonorris.com/)

Status: optional inspiration for another page, not a requirement or a change to the approved Collecting Dots opener.

Observed in the desktop browser: a large, close-cropped portrait fills the opening screen. Helmet and visor sections sit over the face, with faint contour graphics behind it. Inspection showed both an exposed-face state and a visor-across-the-eyes state, with small shifts in orientation and background alignment while the pointer was repositioned. The rendered DOM includes a Three.js canvas.

Verification limit: the available browser controls exposed click/drag, not an isolated hover/mousemove action. The precise mapping of pointer movement to rotation, visor changes and any idle motion was not established. Do not treat those details as a confirmed specification.

Possible OMRI applications:

- An artist/profile page portrait with restrained pointer depth; clean dots drift across separate foreground/background layers.
- A label roster card that reveals an alternate editorial portrait through a small moving dot-shaped window.

These are adaptation ideas. Use our own media, keep identity natural, and provide a still/tap alternative for touch and reduced motion. No source assets were copied and no interaction was implemented.

## Artists gallery follow-up — 2026-10-21

The user requested multiple visible portraits, expanding artist details and a stronger hover background. Revisited the reference's organic contour background and layered portrait/visor. Implemented our own shared contour field, pointer lighting, graphic dots, depth and colour reveal behind a four-portrait gallery. Click expands the selected real photograph into a modal profile. See `ARTISTS-GALLERY-2026-10-21.md`. The earlier optional/no-implementation status above records the original review, not the current gallery status.

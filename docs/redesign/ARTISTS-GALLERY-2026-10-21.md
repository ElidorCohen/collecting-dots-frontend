# Artists gallery — local review

Supersedes the single-portrait layout in `ARTISTS-IMPLEMENTATION-2026-10-20.md`. The previous component, styles and notes are preserved in `media-inbox/artists/before-gallery/`.

## Gallery and hover

Four portraits appear together: an alternating-height editorial row on desktop, two by two on phone. Search and paging cover the entire live dashboard roster (currently 21). The gallery has no mandatory scroll pass for each artist. Empty/loading/unavailable states and a retry action remain available.

Each portrait retains the pointer depth, foreground dots and moving colour reveal. Stronger tilt, a broad colour window and reflected light replace the previous small lens. A shared background adds original organic contours, pointer-lit dots, warm orange light and the hovered artist's name. The background layers move at different rates through GSAP quickTo setters. Bounds are cached; there is no perpetual animation loop. Inactive portraits stay opaque and legible.

Lando Norris's opener was reviewed again on 2026-10-21: faint organic contour graphics behind the portrait and layered helmet/visor elements were visible at different pointer positions. This implementation adapts the layered background idea using our own code-native contours, photographs and label colours. It does not copy the reference's assets or claim an exact recreation of its 3D renderer.

## Click transformation

Click/tap a photograph to open a native modal artist profile. The same photograph travels from its measured gallery rectangle into a large colour portrait on a dark composition. Artist name, role and all available profile links enter in sequence. Close/Escape animates the photograph back to the same card. Links remain the dashboard/Spotify destinations; no biography or artist claims have been invented.

The detail transition is triggered explicitly by click. The chapter entrance and existing videos remain controlled directly by scroll. Native modal behaviour isolates the background, with Escape/back controls, keyboard activation and focus restoration. Body scroll is locked with scrollbar-width compensation and restored on unmount. Reduced motion opens details without travel and disables pointer motion; touch shows colour without depending on hover. The reduced-motion branch was inspected in code, not tested by changing the user's system settings.

## Omri photo change

OMRI's gallery and profile now use supplied `B97A4165 1.jpg`: seated, white vest, patterned trousers and sunglasses. Source: https://drive.google.com/file/d/1F3lKd7Asmr7EQJN4vBhxEgZiQS6gwYly/view . Retrieved through the connected Google Drive plugin as the original 4,556,938-byte, 3648×5472 JPEG. Original retained in `media-inbox/artists/originals/`; quality-95 WebP derivatives at 640, 1280 and 1920px use proportional Lanczos resizing and retain the source ICC profile. No generation, retouching or upscaling. Exact hashes and provenance are in `artists-media.json`. Previous portrait derivatives are retained. Opener/About media were not replaced.

## Verification

- Production build and standalone TypeScript checks passed after the final code change.
- Browser reviewed at 1440×900, 1280×720 and 390×844 and the default narrow in-app pane; portraits, paging and links fit, with no horizontal overflow.
- OMRI, Rafael, TOBEHONEST and The Botanist gallery photographs loaded; second page displayed Adaru, Dor Danino, N.O.Y and Balanka. Searching Abel reached artist 21; empty search displayed its message.
- OMRI and Dor Danino detail views exposed the correct artist names and four stored profile destinations. Enter opens details; Escape/back closes. Native modal AX exposes only detail controls while open.
- Real pointer input verified gallery colour/depth, shared background activation, SVG contour transform and moving light coordinates.
- Native clicks preserved phone scroll exactly at 13539.5px and clock 1 through opening and closing, restoring focus to `Explore OMRI.`. Desktop Escape similarly preserved 14883px and clock 1. Locator-based test clicks can centre a button before clicking; that testing movement is not native website behaviour.
- Reverse scrolling reached clock .222222 and paused hero videos at 9s and 8.572916s; the held state was compared across tool calls.
- Screenshots in `media-inbox/artists/`: `gallery-hover-desktop.png`, `gallery-detail-desktop.png`, `gallery-mobile-390.png`, `gallery-detail-mobile-390.png`.

No dashboard/API schema changes, new dependency, deployment, commit, generation or work on later sections.

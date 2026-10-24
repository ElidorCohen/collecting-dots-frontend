# Artists — local review

## Composition and interaction

The Releases progress line hands its orange dot to the Artists heading. A paper panel rises as one composition, carrying the artist index and a large portrait. The heading and index enter with the panel rather than revealing through a mask across their letters.

- CSS sticky stage; 125vh scroll range, with the first 90vh bringing the chapter into place. One paused GSAP clock, `scrub: true`, `ease: "none"`. Stop holds the exact state and reverse retraces it. Geometry is cached outside animation updates.
- The connector's origin is measured from the actual Releases ruler. Its destination and final size match the Artists heading's orange period, including responsive/font changes.
- Desktop has a searchable index of twelve names per page. Pagination exposes the complete dashboard roster without requiring a separate scroll scene for every artist. Explicit click/keyboard focus selects an artist; passive pointer movement across names does not change the selection.
- The portrait has subtle pointer-driven tilt and separate foreground dot movement. A circular window reveals the same photograph in colour over its monochrome base. No facial deformation, replacement person, automatic loop, or AI media is used.
- Clicking/tapping the portrait toggles full colour. Keyboard focus exposes colour directly. On narrow screens, a native artist selector contains the entire roster, and profile links stay visible.
- Reduced motion uses ordinary document flow and a still, colour portrait; no entrance pinning, pointer depth or moving lens. This branch was inspected in source; OS motion preferences were not changed during QA.

## Reference

[Lando Norris](https://landonorris.com/) was reviewed in the desktop browser. Adapt the sense of layered portrait depth, not its helmet/visor, 3D model, assets, typography or layout. The Collecting Dots treatment uses our own photographs and dot motif. Prior verification limits for the reference's exact hover mapping remain recorded in `INSPIRATION-NOTES.md`.

## Data and media

- Production still uses `/api/get-artists-data`: dashboard artist records in Dropbox, with Spotify profile image enrichment. No changes to the dashboard, its schema, artist CRUD or that API.
- Local review uses `/api/artists-preview`, restricted to localhost hostnames, reading the existing public production roster with a five-minute server cache. No Dropbox credentials are copied, exposed or required for the local experiment.
- The live feed currently contains 21 artists. Preserve its ordering and all four profile destinations: Instagram, SoundCloud, Spotify and Beatport. New/removed artist records flow through the same mapping. No fixed runtime roster snapshot.
- OMRI uses supplied `B97A4949.jpg` (Drive identity master), retained unmodified at `public/media/hero/omri-editorial-original.jpg`. Quality-95 WebP variants are 960, 1440 and 1920px wide. The closer portrait composition is a CSS crop, shared exactly by monochrome and colour layers.
- Other artists retain the highest available Spotify image returned by the existing service. No generated substitute portraits or image upscaling.
- Full source URLs, the OMRI override's Spotify identity and derivative information are saved in `artists-media.json`. Prior source files are in `media-inbox/artists/before`.

## Integration and checks

Integrated into `/`, `/opener` and `/opener/original`. Releases and header links now reach the local Artists chapter inside the preview. The original opener comparison remains available. Hero/after-movie assets and frame controllers are unchanged. Events and every subsequent page section remain byte-identical to the saved version.

- Production build and standalone TypeScript checks passed. Existing Next config/metadata warnings remain unrelated.
- Data checks verified 21 artists, duplicate/empty row handling, original dashboard order, all four profile destinations, exact Spotify image URLs and the OMRI editorial override.
- Browser checked desktop 1440×900, short desktop 1280×720 and phone 390×844. Portrait and profile links fit on phone without horizontal overflow.
- Artist switching, second roster page (13–21), search, empty results, mobile selection and portrait reveal were exercised.
- A real pointer drag into the portrait confirmed its tilt, lens coordinates/radius and foreground movement. Scroll-back returned to Releases; a held intermediate state preserved clock, panel transform and connector transform exactly, then forward scrolling restored the Artists chapter with the same selection.
- Screenshots are saved in `media-inbox/artists/`: `desktop-hover-1440.png`, `mobile-390.png` and `scroll-transition-1440.png`. Native viewport overrides are reset after testing.

No deployment, external message, generation charge or work on later sections was performed.

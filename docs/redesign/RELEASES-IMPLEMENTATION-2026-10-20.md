# Releases chapter — local review

## Selection and data

- Use the existing same-origin `/api/get-playlist-data` endpoint. Spotify supplies track metadata and artwork; its existing Deezer ISRC fallback supplies available preview URLs. No new external data proxy, no new dashboard configuration.
- Playlist: https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ
- Sort the display by Spotify album release date, newest first. Keep playlist order for equal dates. Do not change the source playlist.
- Feature at most eight distinct Spotify album/release IDs, selecting only tracks with preview URLs. Skip missing previews before grouping, so a playable track from an EP can represent that release.
- Keep every valid unique track in the searchable full catalogue, including tracks without previews. Those offer a Spotify link instead of a disabled preview button. No tracks are deleted from the source.
- Load on page visit through the existing live API. The catalogue count and featured selection update from the response. A larger playlist never adds more than eight cards to the scroll journey.
- Preserve original Spotify artwork variants, choose the largest available image, and supply responsive srcsets. No generated or manually substituted cover art.
- Local credentials are only in ignored `.env.local`; never put them in client code or documentation.

## Composition and scrolling

- Paper About chapter transitions into a near-black catalogue panel with a horizontal reveal. Full-width Releases masthead, square cover-art rail, orange progress line, arrows and catalogue access.
- Moscoman reference checked at `/Users/elidorcohen/Downloads/video-editing/moscoman-story-site/src/scripts/site.ts` (horizontal album travel) and `src/styles/global.css` (sticky album stage), plus the live Music chapter. Reuse only the vertical-to-horizontal behavior; do not copy its HAPPY/SAD backdrop or bottom-left introduction/right-side rail composition.
- One paused normalized GSAP clock, `scrub: true`, `ease: "none"`. Cached geometry, quick setters, CSS sticky stage, no automatic progression or numeric catch-up. Stop holds the exact state; reverse retraces it.
- Intro range is 0.85 viewport heights. Rail range depends only on the selected eight cards; final hold is 0.22 heights. Geometry refreshes on real size/font changes. No layout reads in scroll updates.
- Native horizontal scrolling and ordinary layout for reduced motion. Native dialog provides a separate full catalogue, title/artist/album search, explicit preview playback, links and sharing.
- Audio only starts from a user action. It is separate from the paused scroll-controlled hero films, which retain their existing behavior and source media.
- Integrated into `/`, `/opener`, and `/opener/original`; original hero comparison remains available. No changes to Artists or subsequent sections, APIs, dashboard, deployment or production content.

## Review evidence

- Live local Spotify endpoint returned 60 tracks using the authorized server environment.
- Standalone TypeScript validation and production build passed (existing Next config/metadata warnings remain).
- Data checks cover chronological sorting, duplicate IDs, null rows, eight distinct albums, skipping/replacing unavailable previews, all-unavailable selection, original artwork and Spotify links.
- Browser checked the 390px phone breakpoint, short desktop viewport, final-card fit, forward/reverse motion and an exact stop/hold comparison. Native viewport overrides are temporary and reset after testing.
- Catalogue search returned seven OMRI tracks, displayed a useful zero-results state, and preview playback returned real ~30-second audio with no media error. Explicit pause tested.
- Final UI check found eight enabled preview controls and no unavailable-preview labels in the rail. The catalogue contains all 60 tracks and uses Spotify links for unavailable previews. Opening/closing now preserves the measured section width, height, progress and scroll position exactly by compensating for the hidden scrollbar.
- Both hero video elements remained paused. Original and generated media assets were not altered by this section work.
- Saved originals and prior source files remain in `media-inbox/releases/before`; public feed snapshots are review evidence only, never runtime substitutes.


## About dot handoff — 2026-10-21

The existing orange dot beside About's “Collecting Dots Records” eyebrow now travels to the period after RELEASES during the existing horizontal section reveal. Both endpoints are measured from their real DOM geometry; a sibling overlay allows the dot to cross the panel's clip boundary. The same normalized release clock owns the cubic path, opacity ownership and scale. Before departure, only the About dot is visible; in transit only the connector is visible; after landing only the Releases punctuation is visible. Scroll-back reverses that ownership. Reduced motion retains static section dots and skips the travelling overlay. No second ScrollTrigger, autoplay, media change or extra scroll length.

Source and destination are remeasured with viewport/font changes. Explicit scaleX/scaleY setters preserve exact circle diameter. Phone browser verification held y=9794.5, clock .065821, position and 7.31369px diameter unchanged between tool calls. Reversing restored About source opacity 1 with connector/destination opacity 0. Landing was measured at destination centre (270.109,157.812), matching its 8.1875px diameter. Screenshot: media-inbox/releases/about-dot-handoff/phone-midflight.png.

Prior source is preserved in media-inbox/releases/about-dot-handoff/before/.

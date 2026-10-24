# Media archive: working channel data and the next scroll chapter

**Playback update:** the local playback failure below is resolved. Numeric `127.0.0.1` caused these recordings to fail; all four sets played inline on `localhost`. Local page requests now redirect to the working hostname automatically. See `ARCHIVE-PLAYBACK-FIX-2026-10-21.md` for the A/B test and verification. No channel setting or replacement media was required.

The archive follows Events on the main page and both opener previews. Existing `#sets` links remain valid. The Events period leaves its heading, crosses the scene and becomes the orange On Record light. The final event photograph contracts into the viewing frame and fades into an official recording cover. The entrance takes 0.96 viewport heights plus a 0.12 hold; browsing the collection does not demand more pinned scrolling.

## Archive data repair

The old `/api/get-youtube-videos` endpoint returned success with zero videos. The official label channel has four recordings, but its current page uses `lockupViewModel` instead of the old `videoRenderer`. The parser only understood the latter and did not invoke its feed fallback after an empty result.

`lib/services/youtube.ts` now supports both structures, balanced multiline initial JSON, duplicate prevention and the official RSS feed. Empty parsing falls through to RSS rather than silently becoming an empty archive. Requests have timeouts and 15-minute Next fetch caching. A checked-in, timestamped selection of this channel's four verified recordings remains available if both provider requests fail. This fallback is scoped to Collecting Dots; unrelated channel requests never receive the label's saved content. Channel-ID URLs are also handled correctly.

The API response retains its existing fields and adds `source` and `fetchedAt`. Actual local endpoint verification returned `success: true`, `source: channel`, and four real IDs. The frontend refreshes from this endpoint; saved data is identified as a saved selection with a refresh control. The channel link remains available for the entire YouTube catalogue.

No YouTube API key or new media is required for this first selection. Originals and source references are preserved in `archive-media.json` and `lib/youtube-archive-snapshot.json`.

## Presentation and interaction

- Four featured recordings alongside a large cover, with direct selection. OMRI's Cape Town recording leads, followed by the other available recordings. A searchable library exposes every returned video and original watch URL.
- Official full-resolution YouTube covers: all four verified at 1280×720. No downloaded copies, AI imagery or upscale. Progressive thumbnail fallback handles missing future max-resolution covers.
- One paused GSAP clock, `scrub: true`, linear progress, and cached geometry. The photograph's rectangular contraction, dot flight, heading, chrome and footer remain tied directly to scroll. No autoplay is used in the narrative section.
- Only an explicit recording choice loads the official YouTube player. Playback then uses normal video controls independently of scrolling. Closing/dismissing the modal destroys the player and restores document scrolling and focus.
- A separate visibility flag controls departure of the Events period, preserving its existing arrival animation. Backward scroll restores the period. Transparent archive layers allow interaction with Events before entry begins.
- Phone layout places the recording selector below the viewing frame. Reduced motion uses a static, ordinary-flow layout. The reduced-motion path was reviewed in source; system settings were not changed.
- Initial `#sets` navigation waits for upstream feed layout and fonts. It is cancelled by user input, preventing later scroll jumps while browsing. Upstream sections now expose their existing loading state through `aria-busy`; their timing/content is unchanged.

## Playback limitation and fallback

The in-app browser returned YouTube error 150 for OMRI Cape Town, Dor Danino Cape Town and OMRI Mexico City. OMRI Cape Town's original YouTube watch page played normally (2:41:35 duration, advanced to 0:03, then paused). The service response also reported the original as playable in embed, so the precise provider/context restriction remains unresolved. Chrome's embed stalled in a separate check. Do not describe inline playback as verified or guaranteed.

The UI detects official player errors and a 15-second load timeout. It destroys rejected players, removes the broken iframe, and replaces it with the original cover and a prominent original-watch link. The Mexico City fallback was checked in the browser with status `error-150` and zero remaining player iframes. There is also an always-visible original-watch link. Enabling inline playback may require channel/recording embedding settings or testing on the deployed origin; these settings were not changed and no deployment was made.

Official reference: https://developers.google.com/youtube/iframe_api_reference#onError

## Verification

- Production build, standalone TypeScript check, `git diff --check`, and six regression tests passed. Run tests with `node --test tests/youtube-archive.test.cjs`.
- Tests cover modern/legacy video structures, multiline JSON/quoted braces, RSS/entity decoding, channel URLs, empty-parser feed fallback, saved selection during outages, and isolation of unrelated channels.
- Checked desktop 1440×900 and 1280×720, and phone 390×844 / 390×667. Full-resolution covers loaded and there was no horizontal document overflow. The viewing frame is capped by available stage height to preserve space for its caption and footer.
- Search `Mexico` returned exactly the Mexico City recording. All four original recording names, lengths and destinations are present in the library.
- Exact hold comparison at progress 0.425926: document position, dot transform, photo clipping, source visibility and both paused hero video times remained identical across observations. Reverse to zero hid the connector and restored the Events period.
- Initial archive hash resolved to progress 0.888889 after all three upstream feeds reported ready.
- Root content from Merchandise onwards is byte-identical to the previous implementation. Dashboard schema, demo submission, merchandise links and other existing API routes are unchanged.

Screenshots: `media-inbox/archive/desktop-1440x900.png`, `phone-390x844.png`, `events-archive-bridge.png`, `player-fallback.png`. Backups are in `media-inbox/archive/before/`.

No generation, dependencies, dashboard writes, publication or later-section design work in this pass.

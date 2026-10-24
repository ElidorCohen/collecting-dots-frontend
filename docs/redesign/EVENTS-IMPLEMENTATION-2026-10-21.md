# Events chapter and shorter About handoff

The Events chapter follows the complete artist rail. The orange period leaves ARTISTS, travels through two incoming photographic panels, and lands in EVENTS. Real archive photography fills the stage while paper event tickets rise away to reveal the next gathering. Three featured events keep the sequence short; selectors and the full programme offer direct browsing.

## Scroll and interaction

- One paused GSAP clock with `scrub: true` and linear progress owns the split panels, dot, photo crossfades, city names and tickets. There is no autoplay, delayed scrub or perpetual animation loop.
- Entrance takes 0.78 screen heights, each ticket change 0.72, final hold 0.16. Three featured events therefore use 2.38 screen heights of scroll (2142px at a 900px stage).
- Geometry is measured on refresh/resize. Scroll rendering uses cached values and transform/opacity setters. Photography is responsive and lazy loaded. The invisible entrance allows clicks through to the last artist portraits.
- Artists retains ownership of the period's arrival opacity. Events uses a separate departure visibility flag so late artist renders cannot leave a duplicate dot. Reverse restores the source.
- Programme is a native modal dialog with focus management, body scroll locking, Escape dismissal and focus restoration. It contains upcoming/past lists, event details, and the existing real website/Instagram destinations when live data is used.
- Reduced motion uses normal document flow and static tickets instead of the pinned scene. This branch was reviewed in source; system motion preferences were not changed for testing.

## Data and media

- `/opener` and `/opener/original` explicitly show mock events. The root page uses the same mocks on localhost; deployed root reads the existing `/api/get-events-data` response from Dropbox. The dashboard fields, API route and stored event schema are unchanged.
- Four clearly labelled fictional fixtures: three upcoming (Cape Town, Tel Aviv, Amsterdam), one past (Berlin). Dates, venues and lineups are design placeholders. No mock ticket sales links are present. Archive photos are illustrative and do not verify the sample events.
- Live data has strict date validation, duplicate removal, chronological future/past sorting, and HTTP/HTTPS link validation. Production request errors show a retry state, without fictional fallback events.
- Three supplied archive originals remain intact. Responsive WebP derivatives preserve proportions, retain supplied colour profiles where present, and do not upscale. Exact Drive references, source files, dimensions, sizes and SHA256 hashes are in `events-media.json`.
- Original implementation backups: `media-inbox/events/before/` (use explicitly named page backups).
- Integration covers both opener previews and the root page. All root content from Collecting Dots Sounds onwards is byte-identical to the prior implementation.

## About timing fix

The About visuals finished well before its pinned scroll ended. The story endpoint changes from 1.65 to 1.52 timeline units, cutting 91svh (819px at 900px height) from the settled tail. The portrait/lightbox finishes by 1.50, followed by about 14svh of breathing room. Earlier portrait, flick, real-film and text-clearance scheduling remain intact, including the smoother first-shot comparison. Text and both images were fully settled when Releases started in browser QA.

## Verification

- Production build and standalone TypeScript check passed. Existing Next configuration/metadata and baseline mapping warnings remain.
- Desktop 1440×900: inspected all three event scenes, city typography, ticket details and programme. Amsterdam remains on one line at the smaller long-name size.
- Phone 390×844 and 390×667: tickets, city names, selectors and programme controls fit; no horizontal document overflow. Programme list and heading focus checked on phone.
- Exact freeze comparison: event progress 0.743464, event position 1.3742282222222224, ticket styles, document scroll and both paused hero video times were identical across separate observations. Backward scroll reversed the sequence.
- Final dot handoff: at progress 0.15943 the moving dot was visible and the artist source hidden. Reversing to zero hid the connector and restored the artist period. The last artist (Abel) remained clickable before Events entered.
- Native event details opened the correct fixture. Upcoming/past programme lists matched the fixtures. Escape restored the previous document position and the initiating control. No body scroll lock remained after closing.
- Data checks passed: impossible dates rejected, duplicate records removed, same-day events retained as upcoming, future ascending/past descending, real URLs preserved, unsafe URLs rejected, mock URLs absent.

Screenshots in `media-inbox/events/`: `desktop-cape-town.png`, `mobile-cape-town.png`, `programme-past.png`, `artists-events-bridge.png`, `about-shortened-handoff.png`.

No deployment, generation, dependency installation, dashboard edits or later-section changes in this pass.

# Collecting Dots redesign plan

Planning draft, 14 October 2026. Rebuild the public site's presentation around a cinematic scroll story, retain the current sections and dashboard workflows, and develop the visual direction from supplied media. Hero implementation was authorized on 20 October 2026, using the approved OMRI-and-crowd shot and real aftermovie footage. After approving the opener, the user authorized the next label/About chapter on 20 October. This chapter now continues the same scroll timeline; sections from Releases onward remain unchanged pending their own design passes. See ABOUT-IMPLEMENTATION-2026-10-20.md. See [hero implementation notes](HERO-IMPLEMENTATION-2026-10-20.md). Both apps remain on the user's personal Vercel account.

## Current system

Two separate Next.js 16 / React 19 applications and Git repositories share external services. The public app is `collecting-dots-frontend`; the management app is `collecting-dots-dashboard`. The public browser calls its own `/api` routes; it does not depend on a browser connection to the dashboard. Dashboard edits reach the frontend through Dropbox records and the shared Redis setting.

| Content or workflow | Current source | Code reference |
| --- | --- | --- |
| Releases, artwork, artists, track links | Spotify playlist `253UKTc95dhq8FvVbLvroJ` | `app/api/get-playlist-data/route.ts`, `lib/services/spotify.ts`, `components/releases-carousel.tsx` |
| Audio previews | Spotify when supplied; Deezer fallback matched by ISRC | `lib/services/deezer.ts`, `app/api/get-playlist-data/route.ts` |
| Artist roster and profile links | Dropbox `/artists/artist_urls.json`, editable in dashboard | Public `app/api/get-artists-data/route.ts`; dashboard `app/api/artists/route.ts` |
| Artist photographs | Spotify artist profile, highest resolution image | `lib/services/spotify.ts:getArtistsData` |
| Events and destinations | Dropbox `/events/events.json`, editable in dashboard | Public `app/api/get-events-data/route.ts`; dashboard `app/api/events/route.ts` |
| Media archive | YouTube `@CollectingDotsRecords`; HTML scraper with RSS fallback | `app/api/get-youtube-videos/route.ts`, `lib/services/youtube.ts`, `components/horizontal-sets-carousel.tsx` |
| Merchandise | Six hardcoded products and images from Float's CDN; all shop links use the same collection URL | `app/page.tsx`, merchandise section |
| Logo and font | Local `public/CD - main logo white.svg`, `public/CD_icon.png`, `public/fonts/BNBobbieSans.otf` | `app/page.tsx`, `app/layout.tsx` |
| About image | Existing Vercel Blob brand-pattern image | `app/page.tsx`, about section |
| Demo files and metadata | Dropbox `/demos/submitted/`, audio plus `.metadata.json` sidecar | `lib/services/dropbox.ts`, `app/api/get-upload-link/route.ts`, `app/api/confirm-demo-upload/route.ts` |
| Submission availability | Upstash Redis `settings:demo_submission_enabled`, managed in dashboard | Public `lib/redis.ts`; dashboard `lib/services/settings-service.ts` |
| Dashboard login | Clerk hosted sign-in and sign-up components | Dashboard `app/sign-in/[[...sign-in]]/page.tsx`, `middleware.ts` |
| Demo notifications | Gmail API with OAuth token refresh | Both apps' `lib/services/email.ts` and email templates |
| Spam protection | Cloudflare Turnstile | Public `lib/services/turnstile.ts`, upload-link route |
| Dashboard caching and cleanup | Upstash Redis demo/token caches; Vercel daily rejected-file cleanup | Dashboard `lib/redis.ts`, `vercel.json`, `app/api/cron/cleanup-rejected/route.ts` |

Source paths in the table are relative to their named app. [Current source references](current-source-references.json) preserves literal URLs with file/line locations and hashes of local public assets. [Current public data](current-public-data.json) preserves the live roster, events, release artwork, Spotify destinations, ISRCs, and Deezer track IDs as a dated snapshot. Signed preview URLs expire, so the snapshot records provider availability and stable identifiers instead. These files are provenance records; the rebuilt site should continue reading live sources.

Preserve the existing destinations:

- Spotify: https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ
- Label Beatport: https://www.beatport.com/label/collecting-dots/126941
- Instagram: https://www.instagram.com/collectingdotsrecords/
- YouTube: https://www.youtube.com/@CollectingDotsRecords
- Merchandise: https://www.floatapparel.co.za/collections/collecting-dots-x-float
- Brand pattern: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lightbox%20design%202-tLk2nI9k00LkPEO5mMmfreb7XvAS5e.png

## Archive finding

On 14 October, `https://www.collectingdots.com/api/get-youtube-videos` returned HTTP 200, `success: true`, and zero videos. Channel resolution succeeded with ID `UCaGuYQtXVNBHV2Ko2VcSB1Q`. The channel's `/videos` page contained four rich-grid items using `lockupViewModel`, while the scraper reads only `richItemRenderer.content.videoRenderer`. It skips every item and returns an empty array; no exception triggers its RSS fallback. This directly explains the observed empty archive.

Video IDs observed on the public channel: `KDMoWIpuitA`, `1zMYUk8E3Mw`, `oLuQXGdWsgc`, `8FIIqSgCi8w`. They are discovery references, not an approved editorial selection.

Planned repair: use a stable channel ID and an official uploads-feed integration, cache the latest successful list, and provide an explicit failure state with a channel link. An empty parse must not be treated as successful discovery when known uploads exist. The [YouTube playlistItems API](https://developers.google.com/youtube/v3/docs/playlistItems/list) supports listing and paginating uploads. Choose the integration and credentials during implementation; do not silently add a new service now.

## Moscoman reference

Production: https://moscoman-story-site.vercel.app/

Source: `/Users/elidorcohen/Downloads/video-editing/moscoman-story-site`

The reference uses Astro, GSAP ScrollTrigger, CSS sticky scenes, scroll-driven video seeking, large typography, artwork rails, chapter navigation, and deliberate changes of pace. Relevant files are `src/pages/index.astro`, `src/scripts/site.ts`, `src/styles/global.css`, and the motion/storyboard documents under `planning/`. The live hero advances its video as the visitor scrolls. The source's full cinematic layout begins at 1180px; smaller viewports use a lighter view.

Carry over the cinematic pacing, media craft, and transitions. Create a distinct Collecting Dots composition, typography, palette, and narrative. Keep the existing Next.js application and service contracts. Design the full mobile journey alongside desktop.

## Proposed visual story

Working concept: **each release, artist, and dance floor adds a dot to a growing collective**. Use the dot as a recurring aperture, typographic mark, and transition shape. Build the atmosphere from real crowd footage, strong portraits, tactile artwork, and merchandise photography. Determine the final palette and type after seeing the brand material. Avoid making the dot a generic space/starfield effect.

| Existing section | Proposed experience | Media to gather |
| --- | --- | --- |
| Hero | A small dot opens onto a real dance-floor scene; scrolling expands the frame and reveals the label identity | One strong uninterrupted hero shot, matching still, logo masters |
| About | Short manifesto over an evolving photographic composition; OMRI appears as curator within the label story | OMRI portraits, studio footage, label history and approved copy |
| Releases | A moving record-sleeve wall that resolves into a browsable catalogue, with usable preview and listening controls | Original sleeves, release campaigns, optional vinyl/product footage |
| Artists | An editorial contact sheet with portraits that assemble into the collective; individual profiles remain easy to open | Named portraits and optional short artist clips |
| Events | Large city/date typography, a featured next event, and an expandable past-events ledger paired with venue footage | Event posters, venue/crowd clips, city photos; existing ticket and Instagram links |
| Media archive | A screening room with a featured recording and a clear thumbnail index; players load on selection | Approved recordings, posters and optional short teasers |
| Merchandise | A fashion editorial: oversized details, full looks, and a scroll reveal through the collection | High-resolution campaign images, garment details, optional turntable clips; same Float links |
| Demo submission | The closing invitation: “Add your dot.” Selecting tracks builds a small visual composition, then a calm guided upload ends in a submission receipt | Optional studio/background scene; no decorative animation competing with file selection or progress |
| Footer | Compact contact and listening destinations integrated into the final chapter | Approved contact copy and existing links |

The existing Sounds section is commented out. Keep it recorded as inactive unless the user chooses to restore it.

Higgsfield shot ideas to develop after the media arrives: a camera move through a physical dot installation; a restrained transition from a real crowd photograph to a sleeve wall; a macro fabric move for the merchandise chapter. Use original photographs as references, preserve artist identity and artwork, and keep generated transitions distinct from documentary footage. Real media should lead the story. No media generation is authorized or needed during this planning pass.

## Functionality to retain

- Dashboard artist/event create, edit, and delete operations, including all profile, ticket, and Instagram destinations.
- Release browsing, preview playback where available, and outbound listening links; missing previews must not prevent browsing.
- Archive playback and external viewing links.
- Demo batches of up to ten MP3/WAV files, current 150 MB per-file UI limit, track names, artist/contact/social metadata, CAPTCHA, progress, error recovery, and confirmation.
- Direct browser-to-Dropbox uploads through temporary links, followed by metadata confirmation. Keep audio away from Vercel request bodies.
- Demo availability checks in the UI and server routes, using the dashboard's shared Redis switch.
- Dashboard listening, status tabs, assistant shortlist, owner approval, rejection/undo, email notifications, and paired audio/metadata moves across `submitted`, `assistant_liked`, `owner_liked`, and `rejected` folders.
- Existing cleanup behavior: daily job deletes rejected-folder files whose Dropbox `server_modified` is over 24 hours old. Retention changes require a separate decision.

Phone login belongs to the dashboard in the current architecture: the public demo form has no customer login. Plan to migrate existing Clerk accounts to verified phone/SMS access without losing their identities. Keep submitter contact email and notification emails unless explicitly changed. [Clerk authentication options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options) provide the configuration reference. Confirm SMS availability and account migration details during the auth phase.

The current dashboard authorizes any authenticated Clerk user and uses a client-side owner/assistant mode switch. Define intended staff access and server permissions as part of the phone-login work; the visual mode switch does not establish separate permissions today.

Current artist records have profile links but no editorial photograph field; event records have text and links but no media field. New portraits and event imagery will need an explicit media mapping or coordinated optional dashboard fields. Preserve existing records and controls while adding those capabilities. Releases, archive, merchandise, and page storytelling are not currently dashboard-managed; adding their editorial controls would be additional scope.

## Media handoff

Drop originals into `/Users/elidorcohen/collectingdots/media-inbox/`, organized into `brand`, `hero`, `artists`, `releases`, `events`, `archive`, `merchandise`, and `higgsfield`.

This folder sits outside both app repositories and outside `public`. Retain original names and the highest quality available. Artist folders can use artist names; event folders can use date and city. Identify preferred hero choices, credits, source links, and any usage restrictions in a text note. Supply horizontal and vertical framing when available; conversion and crop choices come after the storyboard. Production will serve optimized derivatives, with source attribution and crop notes maintained in an asset manifest.

## Planning sequence and completion criteria

1. Gather the user's detailed changes, brand files, imagery, footage, and copy. Confirm the role of OMRI, preferred chapter order, and the desired staff login/access rules.
2. Audit media and produce a chapter storyboard specifying framing, typography, scroll beats, original versus generated shots, and desktop/mobile behavior.
3. Prepare visual composition studies and a precise media shot list. Settle the direction with the user before building.
4. Implement the new frontend presentation in a later phase, retaining data/service contracts. Repair the archive integration and coordinate media fields with the dashboard as needed.
5. Handle dashboard phone login and further dashboard design work in their agreed phase. Verify existing-account access and management workflows.
6. Validate desktop, mobile, keyboard use, reduced motion, slow connections, media fallbacks, all links, demo batches, and dashboard edits on a Vercel preview before production release.

Success means a distinct label-led story, usable sections on mobile, smooth media transitions, a working archive, unchanged shop destinations, and preserved dashboard operations. Load only nearby media, serve posters before video, avoid autoplay sound, and avoid locking the submission form inside a scroll scene. Set media budgets once the supplied footage and target devices are known.

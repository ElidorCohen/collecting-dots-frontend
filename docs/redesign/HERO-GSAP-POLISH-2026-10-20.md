# GSAP opener polish — 2026-10-20

Review: http://127.0.0.1:3101/opener. The homepage uses the same component. Stop here for user review before other sections; no Vercel deployment.

## Changes

GSAP 3.15.0, ScrollTrigger and @gsap/react 2.1.2 coordinate one normalized timeline with named phases. The direct scrub:true linkage preserves freeze and reverse behavior without a numeric catch-up delay or snap. The approved wrist-snap frame (6 + 19/24 seconds) cues graphic release; individual rows retain their small stagger. Intro, portrait crossfade, footage handoff, captions and replay visibility share that timeline. CSS sticky still holds the stage, with no extra GSAP pin or duplicate scroll handler.

The native paused video helper, media encodings and all approved originals are unchanged. Portrait targets still map 5.5–61.5% of scroll to the nine-second take; the real film holds during the ribbon reveal and scrubs at 65–99%. The reduced-motion variant keeps the still portrait, simpler crossfade, no graphic dots or mask, and direct scroll seeking for the real film.

## Per-scroll work

Responsive stage, portrait-frame and punctuation geometry is cached until layout changes, fonts finish or ScrollTrigger refreshes. All layout reads happen outside the render loop. Graphic dots retain fixed 8px layout dimensions and use transforms for size and position. The single compound SVG path is constructed only during the ribbon reveal and stops changing after the viewport is filled. The clip-path will-change hint is only present during that reveal. Initial loads beyond the hero do not fetch offscreen motion unnecessarily.

These changes reduce repeated browser work. No physical-phone FPS measurement is claimed.

## Verification

Production build and separate TypeScript check pass. Browser console had no warnings/errors in the isolated opener. Desktop layout was checked at 1272×720 CSS pixels; phone at 382×844. Twelve points remain aligned above the hand and the responsive event source switches to 608×1080.

Desktop paused portrait holds at 5.791666s; the ribbon state holds at 8.041665s. Reversing to collection and returning restores identical progress, mask path, dot transforms, intro style and video times. Real footage advances 1.125→4.583333s and reverses to exactly 1.125s. Phone footage advances 2.25→5.958333s and reverses to exactly 2.25s; held and returned geometry is identical. Every observed video is paused. Replay restores progress and both video times to zero. Reduced motion is source-reviewed; no OS preference was changed.

All public media hashes match the existing source record, including the original approved flick archive. The native video helper is byte-identical to the pre-pass backup. Homepage content from About onward is byte-identical to HEAD. Existing unrelated Next.js ESLint/metadata/browser-baseline warnings remain.

Evidence and rollback: /Users/elidorcohen/collectingdots/media-inbox/hero/gsap-opener-pass/ (before/, scroll-verification.json, media-hashes.json, desktop and phone screenshots).

# Cinematic opener skill review — 2026-10-20

User requested a parallel skills review, then explicitly authorized installing only the five recommended official GSAP skills on 2026-10-20. Installed and read: gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-react, gsap-performance, from greensock/gsap-skills into /Users/elidorcohen/.codex/skills/. Verified all five SKILL.md files and their declared names. Vercel and other skills were not installed. No website package dependencies or animation code were changed for this installation.

Recommended additions, from primary maintainers:

- Official GSAP skills: gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-react, gsap-performance. Source: https://github.com/greensock/gsap-skills. Closest fit for pinned chapters, coordinated reversible choreography, React cleanup and performance.
- Vercel React Best Practices: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices. Useful for Next.js loading, rendering and animation event handling.
- Vercel Web Design Guidelines: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines. Useful for keyboard, touch, reduced-motion and accessibility review.

Already available: frontend-design for visual direction, and the Higgsfield plugin for generation. The installed artifact-template-cinematic-story-scroll contains relevant reference material, but its actual workflow creates a new Sites project from an Astro template; do not apply that workflow wholesale to this existing Next.js/Vercel repository.

GSAP runtime dependencies were added in the subsequent user-authorized opener polish. The skills installation itself did not change website dependencies. The tested native video scrubber is preserved. If GSAP becomes useful for later chapters, direct scrub linkage is appropriate; numeric catch-up smoothing would violate the user's freeze-on-stop requirement.

Remotion's official skill (https://www.remotion.dev/docs/ai/skills) is useful later for rendered trailers or exports, rather than this website's scroll controller. The curated Playwright Interactive skill currently depends on a different runtime/setup; the existing CUA browser QA is suitable here. The checked official catalog did not provide a dedicated cinematic-scroll or FFmpeg specialist. Preserve the project's specific, verified encoding and cleanup recipes instead of adding an unverified generic media bundle.

## Assessment after reading the five installed skills

The creative direction remains: approved portrait, twelve graphic dots, a real flick, and real aftermovie footage controlled by scrolling. GSAP is especially relevant as the remaining sections become one coordinated journey. Prefer named timeline stages (Intro, Collect, Flick, Reveal) so overlap and timing can be adjusted without scattered numeric thresholds.

Preserve the existing paused, native-frame video scrubber and its short-GOP media. A GSAP timeline may drive its target progress, while direct scrubbing (scrub: true) keeps the user’s strict freeze-and-reverse behavior. Do not introduce numeric catch-up smoothing, automatic snapping or a competing playback clock into this experience. Ordinary GSAP easing within a scroll-linked stage is compatible with freezing; post-scroll catch-up is the behavior to avoid.

Before a larger motion refactor, make a focused performance pass: the current hero reads responsive geometry each render, updates dot width/height per frame, and reads the punctuation width inside the dot loop. Cache stable measurements until layout changes, batch reads before writes, and use fixed dot geometry plus scale transforms where possible. Profile on phones before claiming performance improvement. Retain the custom SVG film-window geometry unless replacing it provides a concrete benefit.

For future GSAP integration, keep one clear owner of scroll progress. Use component-scoped React setup and cleanup; refresh measurements after fonts, responsive layout or dashboard-driven content changes. Handle desktop, phone and reduced-motion variants explicitly. The skills’ generic global kill-all examples should not remove unrelated page animations.

Recommended next work: polish the current opener’s timing and per-scroll work first, then use GSAP timelines for transitions into the remaining sections. GSAP npm packages can be added when that implementation starts; installing these instruction skills alone does not add runtime code. The Lando-style interaction remains optional inspiration on a later profile/artist page, with a renderer chosen to suit its actual depth effect. These animation skills do not change Higgsfield acting or video cleanup quality.

## Implemented opener pass

Added gsap 3.15.0 and @gsap/react 2.1.2 via npm (only these two runtime dependencies and their lockfile entries). Component-scoped useGSAP and matchMedia provide lifecycle cleanup and reduced-motion rebuilding. One normalized timeline names intro, motion, collect, collected, windup, snap, reveal, film, controls and end. ScrollTrigger uses direct scrub:true with the existing CSS sticky stage. The snap cue is now the approved 6s + 19/24 native frame. The same paused video helper receives timeline targets, with no playback clock or smooth-scroll library.

The renderer caches layout until ResizeObserver, fonts or ScrollTrigger refresh require new measurements. It sizes fixed 8px dots with transforms, calculates SVG window geometry only during the reveal, and releases its will-change hint outside that phase. No repeated dimensions or width/height changes remain in the scroll renderer. This reduces work structurally; no device FPS benchmark is claimed. Desktop and phone browser checks confirm frozen holds, backward seeking and exact state restoration. See HERO-GSAP-POLISH-2026-10-20.md for evidence and rollback.

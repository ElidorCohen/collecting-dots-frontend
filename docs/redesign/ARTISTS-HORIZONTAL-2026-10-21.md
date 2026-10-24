# Scroll through the full artist collection

This pass replaces gallery pagination with one continuous rail containing the live roster. The prior gallery source remains in `media-inbox/artists/before-horizontal/`. The existing API, artist order, image sources, profile destinations and click-to-expand details remain intact.

- Vertical scrolling carries portraits horizontally with `scrub: true` and `ease: none`. A paused normalized GSAP clock owns the entrance and rail; stop holds, reverse retraces. No autoplay, snapping or inertial catch-up.
- Desktop retains four large portraits across an alternating-height row. Phone uses two rows carried horizontally, preserving the photo dimensions from the approved gallery.
- The horizontal travel uses 0.38 vertical pixels per horizontal pixel, versus 0.95 for Releases: approximately 2.5 times faster. With the current 21 artists, desktop 1440×900 measured a 3193.78px scroll range (about 3.55 screenfuls including entrance/hold) and 5804px horizontal travel. Phone 390×844 measured about 1540.58px of scrolling (1.83 screenfuls), with 1611px horizontal travel.
- Arrow buttons move approximately one visible group; search reaches any artist directly. Filtering preserves the full roster's document scroll budget, preventing the section from collapsing around the user. The complete live roster is rendered, so dashboard additions/removals do not require a code change.
- A restrained progress line and visible-range count reflect the current rail position. Keyboard focus brings an off-screen artist into view. Reduced motion uses native horizontal browsing and arrows without scroll-driven travel; the reduced-motion branch was checked in source, not by changing system preferences.
- The hover colour circle's radius is now 34% of portrait width, down from 60% (roughly 43% smaller). Measured desktop radius 101.4px on a 298px portrait. Portrait sizes themselves remain unchanged; profiles provide the larger view.
- Native click on Parker Page in the middle of the rail opened the correct four profile links. Closing preserved y=16071.5 and rail travel=3959.2851488784295 exactly. Native previous-artists controls successfully traversed the phone rail back to the first group.
- Scroll-back reached clock .724327; the clock, rail transform/travel, scroll position and paused video times were identical across tool calls. Both hero videos remained paused (9s and 8.572916s).
- Browser checked desktop and phone endpoints; all 21 artist cards present, Abel reachable at the end, no horizontal document overflow. Searching Abel reduced results to one while retaining the 4093.78px desktop section height.

Screenshots: `media-inbox/artists/horizontal-hover-desktop.png`, `horizontal-phone-start.png`, `horizontal-phone-end.png`.

Production build and standalone TypeScript checks passed. No deployment, dependencies, dashboard/schema edits, generation or later-section work.

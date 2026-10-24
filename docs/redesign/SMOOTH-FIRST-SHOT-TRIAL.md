# Smooth first-shot comparison

Trial: http://127.0.0.1:3101/opener
Saved baseline: http://127.0.0.1:3101/opener/original

The homepage keeps the approved v3 until the trial is chosen. Both preview routes share the same current opener and label-chapter component; smoothFirstShot enables only the trial treatment.

## Media

Only the reversed first shot receives motion-compensated interpolation. Its original 45 frames (source 271 down to 227) become 180 frame positions at 96fps, including the original frames at every fourth position. Exact decoded hash checks confirm all 45 original frames are retained in the lossless intermediate; 177 frames are distinct, with the final close-up held for the last three positions. FFmpeg uses bidirectional motion estimation, adaptive overlapping block compensation and variable-size blocks at the original 1920×1080 dimensions. No interpolation crosses a cut.

The remaining source shots retain their original order and native frame content. These frames repeat in the 96fps stream, so a single existing film node can seek throughout the edit. Both movies remain 824 frames / 96fps, or 8.583333s. Desktop is 1920×1080 and phone keeps the prior 608×1080 crops. H.264 CRF16, no B frames, GOP24 (0.25s), faststart and no audio. The desktop trial is about 25MB. Lossless posters remain the native source-frame-271 images.

Optical flow does not remove motion blur already present in the fast close-up. Intermediate moving contours may be softer; this is a comparison trial, with the approved v3 movies and original source preserved.

## Scroll behavior

The existing paused scene timeline retains all approved positions and animation values. A single directly scrubbed GSAP driver seeks its time, stretching only the first shot interval by 2×; the physical sticky range increases by that interval. Before the film, physical scroll distances are unchanged. Later shots keep their earlier scroll speed and the label handoff follows after the extra first-shot distance. The same mapping is applied to the reduced-motion timeline and matching CSS height.

The portrait keeps its 24fps controller. The trial film uses the controller’s existing fps option at 96, so intermediate frames are reachable. Both media remain paused; there is no autoplay, catch-up easing, scroll snap or autonomous animation. useGSAP/matchMedia clean up both driver and scene timelines. Baseline mode does not create the timing driver and still uses the original 24fps media.

## Validation

Production build and separate TypeScript check pass. Both encoded movies have 824 frames at 96fps, with source-sample checks covering the wide and close first-shot endpoints, the arms-raised cut at output 180, the sign cut at 284 and the final crowd frame at 823. Source comparisons have mean RGB error below 4/255 after high-quality encoding; the pre-encode native key frames match exactly.

Browser checks at 3500px desktop scroll position show baseline film time 1.125s and trial 0.5625s, confirming half the first-shot speed. A tiny scroll reaches 0.572916s, a 1/96s increment, and reversing restores 0.5625s exactly. The scene holds while idle with both videos paused. The final chapter reaches its unchanged logical progress 1.65 with visible restored copy and photos. The actual 415×730 phone view loads the 96fps portrait trial; a PageDown/PageUp cycle returns exactly to 1.895833s, then the first-shot close-up is reachable at 1.677083s with both media paused. Desktop and phone screenshots are saved. Reduced motion is source-reviewed; the OS setting was not changed.

Backups, interpolation/assembly scripts, lossless intermediate, hashes, frame checks, browser records and screenshots: /Users/elidorcohen/collectingdots/media-inbox/hero/smooth-first-shot/. Current source references and trial asset hashes: hero-media.json.

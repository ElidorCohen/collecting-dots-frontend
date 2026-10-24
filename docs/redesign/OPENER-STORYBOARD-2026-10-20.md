# Opener storyboard for review

The user asked for a continuous scroll-controlled story after reviewing the first circle-reveal implementation. The selected real aftermovie remains approved. Three composed keyframes are available separately at `http://127.0.0.1:3102/`; the current website is still at `http://127.0.0.1:3101/opener`.

## Keyframes

- **OMRI. A single dot.** Original seated portrait with the label name. The coral punctuation dot is the story's starting point. It detaches as scrolling begins.
- **The dots gather.** Lettering recedes, the camera advances slightly, and a few dots collect into a deliberate composition around OMRI. The portrait remains restrained; the graphic choreography carries the story.
- **Into the dance floor.** The points converge into one circular opening containing the approved real aftermovie frame. It grows until the real event fills the viewport. Scrolling then advances the footage, stopping holds the frame, and reverse scrolling rewinds it.

The intended implementation follows Moscoman's paused-video, scroll-to-currentTime behavior rather than the autoplay behavior in the first Collecting Dots preview. Portrait motion, graphic motion, and event footage should share one continuous timeline.

## Portrait choice

Selected: `B97A4949.jpg`, native 3648 × 5472. The face is clear and the seated pose is calm. The dark background works with the existing brand direction. This source supports subtle camera/portrait motion without asking a model to invent complex hand actions.

Also inspected `B97A5001.jpg`, native 3441 × 5161. Its reaching hand is an interesting alternative, but its dominant foreground gesture makes identity and hand stability more difficult. It is not used in the three composed frames.

Both full-resolution originals and their Drive references, dimensions, sizes, and SHA-256 hashes are retained under `media-inbox/hero/storyboard-v2/`. The aftermovie still uses original source frame 426 at 17.75 seconds, matching the approved hero edit. The HTML composes original photography with vector dots and CSS masks; no generated asset or raster retouching was used.

## Approval and implementation

The user approved this direction on 20 October 2026 and authorized continuing with the opener, explicitly requiring the entire journey and video to freeze when scrolling stops and reverse when scrolling back. The still-frame storyboard remains separately available for reference. The implemented opener is now at `http://127.0.0.1:3101/opener` and on the homepage through the same shared component. See `HERO-IMPLEMENTATION-2026-10-20.md` for the final behavior and verification.

The original storyboard version moved the still portrait with a scroll-controlled camera transform. A subsequent approved Higgsfield test now supplies the portrait gesture in the current opener: clean graphic dots gather above his hand and five expanding film strips replace the large circle. The event footage remains entirely real. The original motion clip and prior circle implementation are both archived. See HERO-IMPLEMENTATION-2026-10-20.md for this revision and its verification.

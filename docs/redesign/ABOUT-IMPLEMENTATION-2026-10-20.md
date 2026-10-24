# Label chapter and continuous opener handoff

Local review: http://127.0.0.1:3101/opener. The homepage shares the same combined scene. The old About block is replaced; Releases onward, all service contracts and dashboard workflows are unchanged. No Vercel deployment.

## Story and motion

The original opener keeps its absolute scroll distances, native 24fps video seeking, orange punctuation departure, eleven offscreen white-dot paths, approved collecting/flick motion, and real-film reveal. The normalized timeline extends from 1 to 1.65 with a continuation enabled on both page routes. CSS sticky holds one stage throughout.

At the end of the film, its existing element draws back uniformly into the lower-left editorial frame. It retains its aspect ratio and holds the same last frame. The surrounding canvas changes to warm paper; the header becomes dark for contrast. “Collecting Dots, Curating Sound”, the original About paragraph, OMRI portrait and real lightbox photograph arrive in staggered phases. The chapter closes with the existing Releases anchor. All motion derives from the same scrub:true playhead; no autoplay, snap, delayed catch-up, duplicate video or new scroll smoother. A second small ScrollTrigger only switches header contrast beyond the scene, including direct links into existing dark sections.

Reduced motion crossfades the film between its full and inset positions while invisible instead of running the large pullback. Titles/photos only fade, without sliding, zooming or wipe masks. This variant is source-reviewed; no OS setting was changed.

## Media

The supplied B97A4862.jpg portrait and CD PROFILE PHOTO.jpg lightbox are preserved in media-inbox/about/originals/. Responsive 640/1280/1920px WebP derivatives use quality 95, source color profiles where present, proportional resizing and no upscaling. The desktop and phone versions keep native photo proportions or use explicit CSS object-fit crops; no person edits or AI images. Existing event and Higgsfield files remain byte-identical. Source URLs, hashes, sizes, old About-image URL and derivative recipes are in about-media.json. The additional downloaded crowd photo is archived, not served in this chapter.

## Layout and lifecycle

Desktop uses an asymmetric editorial composition; phone uses the film and two photographic columns below the text. Viewport-relative caps keep text and image frames separate on shorter screens and tablets. Measurements remain outside the scroll renderer. useGSAP/matchMedia clean up timelines, listeners and header overrides. Image boxes reserve their dimensions; lazy images use responsive srcset/sizes.

## Validation and rollback

Production build and separate TypeScript checks pass. Desktop and responsive-phone browser checks verify the same two paused video nodes throughout; exact transition styles and video times return after reverse scrolling. A held phone assembly state does not change. Native real-film time reverses back to 7.625s before the handoff and returns to 8.5s at the pullback. The existing media and new-original/derivative hashes all match their records. Releases onward is byte-identical to the pre-chapter page backup. Browser screenshots and scroll-verification.json are stored in media-inbox/about/.

Rollback: /Users/elidorcohen/collectingdots/media-inbox/about/before/ contains both hero files and both page files. The former About content and remote source are preserved there and in current-source-references.json.

Existing Next.js warnings about legacy ESLint config, metadataBase and browser baseline data are unrelated. This pass introduces no runtime dependencies.

Final layout checks include 1272×720 desktop, 382×844 phone, 382×600 short phone and 760×1024 tablet CSS views. Short-phone/tablet DOM bounds confirm title, text, film and both photo blocks do not overlap. Header contrast and the existing Releases navigation were checked on the full homepage (heading top 96px, white header beyond the light story). Local API-backed lists were empty during this presentation check; this pass does not claim end-to-end production data or submission verification.

Portrait sizing follow-up: at the user’s request, the desktop portrait is about 13% larger (252px wide in the 1272×720 view), preserving its top/left anchor. Phone width allows 32% of the stage, with the image height capped to reserve caption clearance above the lightbox. The short-phone check retains an 8.4px gap. The source image, quality and scroll animation are unchanged. Prior story files and layout evidence are in media-inbox/about/portrait-size-pass/. The center image remains CD PROFILE PHOTO.jpg from the supplied Drive’s BRANDED TEXTURES folder, as recorded in about-media.json.

Original-copy follow-up: restored the exact original heading and full paragraph from the archived homepage. Four inline sentence spans fade in sequentially on the existing scrubbed timeline (1.18–1.46); reversing scroll reverses the reveal and stopping holds it. The paragraph stays whole in one accessible paragraph, with no reflow as sentences reveal. The title is resized to fit, and the inset film moves slightly lower/smaller to reserve reading space. Both photos keep their positions and the enlarged portrait dimensions. Opener timings, duration, video sources and media are unchanged.

This pass passes production build and standalone TypeScript checks. Desktop (1272×720), phone (382×844), short phone (382×600) and tablet (760×1024) were visually checked. The short-phone paragraph ends at 247.7px before the portrait at 252px and film at 258px. At progress 1.357071, a forward/back scroll returned exactly the same sentence opacity values and film transform; both videos remained paused at 9s and 8.5s. Exact paragraph wording and unchanged Releases-onward source were verified. Backup, screenshots and scroll evidence are in media-inbox/about/original-copy-pass/.

Connected-photo follow-up: changed “It's not just music; it's a culture, a movement.” to “It's not just music. It's a culture, a movement.” at the user's request. Desktop now presents OMRI and the lightbox as a layered pair: portrait left 57%/top 18%, width capped at 27vw or 42svh; lightbox left 77.5%/top 52%, capped at 18vw or 27svh. A paper-colored 8px edge separates the overlapping photographs. The label image overlaps the lower shoulder area, with the face and both captions clear. Releases link aligns below the portrait; responsive image sizes reflect the new widths. Phone/tablet retain the earlier stacked pair without the paper edge. No video, scroll timing or service changes.

Production build and TypeScript pass. Browser checks cover 1272×720 and 1016×720 desktop CSS views plus 382×600 phone; captions and Releases link stay separate from the intentional photo overlap. Before files, screenshots and compact-desktop bounds are saved under media-inbox/about/connected-layout-pass/. The existing event video's nine visible shots were mapped read-only in media-inbox/about/scene-order-review/; no scene reorder has been applied.


Text-reveal correction: the user reported later paragraph text appearing while the heading was partially clipped, with reverse scrolling looking correct. The heading now fades as complete lines instead of translating through a mask. Every label text node has an explicit hidden CSS starting state. Eyebrow, both heading lines and four paragraph phrases derive opacity directly from the existing GSAP scene clock through cached quick setters; they do not rely on staggered fromTo initialization.

The final choreography overlaps the film pullback, as requested. On layout/font/viewport changes, cached text bounds and the film's final top edge determine when each whole phrase is clear. Inverting the same smoothstep easing used by the pullback gives its clearance time, with an 8px margin. Reading order adds a small gap after each previous phrase. Only opacity changes during scroll; there are no layout reads in the renderer or independent playback. Reduced motion uses its stationary-film crossfade clearance at 1.14. Photos, typography, wording, media, film movement and first-shot trial remain unchanged.

Build and standalone TypeScript checks pass. At desktop logical progress 1.175607, the heading is revealing while the film is still moving, and every body phrase is hidden. At 1.218463 the first paragraph phrase is fading in while the film is still moving; both heading lines are complete and later phrases are hidden. At 1.361317 only the final phrase remains in progress after all earlier text is fully visible. All sampled visible text stays clear of the moving frame, with no heading transforms. Reverse scrolling and a fresh reload restore the 1.218463 state exactly. The actual 415×730 phone layout passes the same reading-order and clearance checks during transition and at the fully revealed end. Both video controllers remain unchanged. Evidence, screenshots and pre-fix files are under media-inbox/about/text-reveal-fix/.

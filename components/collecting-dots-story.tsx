import { ArrowDownRight } from "lucide-react"
import type { RevealFocus } from "@/lib/liquid-glass"
import LiquidGlassFrame from "./liquid-glass-frame"
import StoryGeometry from "./story-geometry"
import styles from "./collecting-dots-story.module.css"

// The colour portrait's sunglasses land on the black-and-white portrait's eyes.
const CURATOR_FOCUS = { from: [0.54, 0.178], to: [0.5, 0.36], zoom: 2.6 } satisfies RevealFocus

export default function CollectingDotsStory({ preview = false }: { preview?: boolean }) {
  return (
    <section className={styles.story} data-label-story aria-labelledby="cd-story-title">
      <p className={styles.eyebrow} data-story-eyebrow><span aria-hidden="true" data-story-handoff-dot />Collecting Dots Records</p>
      <h2 className={styles.title} id="cd-story-title">
        <span className={styles.line}><span data-story-line>COLLECTING DOTS,</span></span>
        <span className={styles.line}><span data-story-line>CURATING SOUND</span></span>
      </h2>
      <div className={styles.manifesto} data-story-copy>
        <p className={styles.body}>
          <span data-story-sentence>This is where boundaries blur and creativity flows.</span>{" "}
          <span data-story-sentence>Every beat is a pulse, every mix a thread, binding us in a shared rhythm.</span>{" "}
          <span data-story-sentence>It's not just music. It's a culture, a movement.</span>{" "}
          <span data-story-sentence>Join us as we push limits, redefine connection, and journey into a space where sound becomes meaning and every dot tells a story.</span>
        </p>
      </div>
      <StoryGeometry className={styles.geometry} />
      <figure className={styles.curator} data-story-curator>
        <LiquidGlassFrame className={styles.imageWindow} reveal="/media/artists/omri-seated-1920.webp" revealFocus={CURATOR_FOCUS}>
          <img src="/media/about/omri-editorial-1280.webp" srcSet="/media/about/omri-editorial-640.webp 640w, /media/about/omri-editorial-1280.webp 1280w, /media/about/omri-editorial-1920.webp 1920w" sizes="(max-width: 899px) 32vw, (max-aspect-ratio: 6/5) 32vw, 27vw" width="3648" height="5472" alt="A black-and-white editorial portrait of OMRI" loading="lazy" decoding="async" data-story-photo />
        </LiquidGlassFrame>
        <figcaption><span>OMRI</span><span>Founder &amp; curator</span></figcaption>
      </figure>
      <figure className={styles.lightbox} data-story-lightbox>
        <LiquidGlassFrame className={styles.imageWindow} reveal="/media/events/after-dark-960.webp">
          <img src="/media/about/label-lightbox-1280.webp" srcSet="/media/about/label-lightbox-640.webp 640w, /media/about/label-lightbox-1280.webp 1280w, /media/about/label-lightbox-1920.webp 1920w" sizes="(max-width: 899px) 30vw, (max-aspect-ratio: 6/5) 30vw, 18vw" width="3915" height="5872" alt="The Collecting Dots lightbox reflected in the night" loading="lazy" decoding="async" data-story-photo />
        </LiquidGlassFrame>
        <figcaption>Made to connect.</figcaption>
      </figure>
      <p className={styles.filmCaption} data-story-film-caption>The people. The moments. The connection.</p>
      <a className={styles.next} href="#releases" data-story-next>Explore the releases<ArrowDownRight size={20} aria-hidden="true" /></a>
    </section>
  )
}

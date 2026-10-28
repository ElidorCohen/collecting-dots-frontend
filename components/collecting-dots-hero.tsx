"use client"

import { Fragment, useEffect, useId, useRef, useState, type CSSProperties } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { ArrowDown, ArrowUpRight, RotateCcw } from "lucide-react"
import { createLiquidReveal, MAX_DROPS } from "@/lib/liquid-reveal"
import { createScrollVideo } from "@/lib/scroll-video"
import CollectingDotsStory from "./collecting-dots-story"
import dotTracks from "./omri-dot-tracks.json"
import styles from "./collecting-dots-hero.module.css"
import LogoWordmarkLine from "./logo-wordmark-line"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const PHONE_FRAMING = "(max-width: 899px), (max-aspect-ratio: 6/5)"
const MOTION = "/media/hero/omri-gather-flick-v2-clean-scroll-r3.mp4"
const MOTION_POSTER = "/media/hero/omri-motion-poster.webp"
const FILM = "/media/hero/cd-hero-scroll-v3-1080.mp4"
const PHONE_FILM = "/media/hero/cd-hero-scroll-v3-portrait.mp4"
const SMOOTH_FILM = "/media/hero/cd-hero-smooth-first-1080.mp4"
// Phones get half the frames with a keyframe every fourth: each seek decodes at most four frames.
const SMOOTH_PHONE_FILM = "/media/hero/cd-hero-smooth-first-portrait-48.mp4"
// Touch devices hold both scrubbed videos in memory, so a fast flick never waits on a range request.
const TOUCH = "(pointer: coarse)"
// The first 180 of 824 encoded frames cover the 45 original source frames.
const FIRST_SHOT_SHARE = 180 / 823
const sections = [
  ["Releases", "releases"], ["Artists", "artists"], ["Events", "events"],
  ["Media archive", "sets"], ["Merchandise", "merchandise"], ["Drop it like it’s dot", "demo-submission"],
] as const
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (t: number) => t * t * (3 - 2 * t)
// One normalized timeline: these positions also map to the approved native frames.
const JOURNEY = {
  intro: 0, motion: 0.055, motionDuration: 0.56,
  collect: 0.055 + 3.8 / 9 * 0.56,
  collected: 0.055 + 4.9 / 9 * 0.56,
  windup: 0.055 + 6.1 / 9 * 0.56,
  snap: 0.055 + (6 + 19 / 24) / 9 * 0.56,
  reveal: 0.493, film: 0.65, controls: 0.69, end: 1,
} as const
// Where Skip lands: the story fully composed, just before the hero releases the page.
const STORY_REST = 1.5
// The chapter rail: each chapter starts on the journey clock; a click lands on its target.
const CHAPTERS = [
  { label: "Collect", start: 0, target: 0 },
  { label: "Connect", start: JOURNEY.reveal, target: JOURNEY.reveal + 0.08 },
  { label: "Film", start: JOURNEY.film, target: JOURNEY.film + 0.01 },
  { label: "Story", start: 1, target: STORY_REST },
] as const
// The middle caption is cut out of darkness so the crowd plays inside the letters.
const KNOCKOUT_LINES = ["THE ", "PEOPLE."]
const KNOCKOUT_ZOOM_LETTER = KNOCKOUT_LINES.join("").indexOf("L")
const DOT_DIAMETER = 8
const DOT_FORMATION = [[227, 645], [288, 612], [357, 638], [394, 699], [372, 766], [306, 797], [234, 766], [197, 705], [263, 697], [326, 654], [337, 748], [300, 706]]
// White-dot origins and curve offsets: eight left, one above, one below,
// and one low on the right. The coral point comes from the title punctuation.
const DOT_ENTRIES = [
  [-0.12, 0.18, 0.02, -0.12], [-0.28, 0.72, 0.05, 0.14],
  [-0.18, 0.43, -0.03, -0.09], [0.26, -0.16, -0.14, 0.02],
  [-0.34, 0.9, 0.08, 0.09], [-0.14, 0.59, -0.04, 0.13],
  [-0.24, 0.07, 0.06, -0.08], [0.14, 1.16, -0.12, 0.02],
  [-0.2, 0.83, 0.04, -0.13], [1.14, 0.88, 0.08, 0.18],
  [-0.3, 0.32, -0.02, 0.1],
] as const
const ENTRY_ORDER = [0, 4, 1, 7, 2, 8, 5, 3, 9, 6, 10]
const ROW_ORDER = [2, 0, 1, 5, 9, 11, 10, 6, 4, 3, 8, 7]
const roundedWindow = (x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const left = x - width / 2, right = x + width / 2, top = y - height / 2, bottom = y + height / 2
  const n = (value: number) => value.toFixed(5)
  return `M${n(left + r)} ${n(top)}H${n(right - r)}Q${n(right)} ${n(top)} ${n(right)} ${n(top + r)}V${n(bottom - r)}Q${n(right)} ${n(bottom)} ${n(right - r)} ${n(bottom)}H${n(left + r)}Q${n(left)} ${n(bottom)} ${n(left)} ${n(bottom - r)}V${n(top + r)}Q${n(left)} ${n(top)} ${n(left + r)} ${n(top)}Z`
}

export default function CollectingDotsHero({ preview = false, continueStory = false, smoothFirstShot = false }: { preview?: boolean; continueStory?: boolean; smoothFirstShot?: boolean }) {
  const headerRef = useRef<HTMLElement>(null)
  const journeyLength = continueStory ? 1.52 : 1
  const scrollLength = journeyLength + (smoothFirstShot ? 0.34 * FIRST_SHOT_SHARE : 0)
  const reducedScrollLength = journeyLength + (smoothFirstShot ? 0.73 * FIRST_SHOT_SHARE : 0)
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const portraitFrameRef = useRef<HTMLDivElement>(null)
  const portraitVideoRef = useRef<HTMLVideoElement>(null)
  const filmRef = useRef<HTMLVideoElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null)
  const seedRef = useRef<HTMLSpanElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<SVGPathElement>(null)
  const liquidRef = useRef<HTMLCanvasElement>(null)
  const knockoutRef = useRef<HTMLDivElement>(null)
  const knockoutSvgRef = useRef<SVGSVGElement>(null)
  const knockoutWordRef = useRef<SVGGElement>(null)
  const knockoutTextRef = useRef<SVGTextElement>(null)
  const knockoutProbeRef = useRef<SVGTextElement>(null)
  const chaptersRef = useRef<HTMLElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const skipVeilRef = useRef<HTMLDivElement>(null)
  const scrollForTimeRef = useRef<(time: number) => number | null>(() => null)
  const menuRef = useRef<HTMLDetailsElement>(null)
  const retryRef = useRef<() => void>(() => undefined)
  const [motionReady, setMotionReady] = useState(false)
  const [filmReady, setFilmReady] = useState(false)
  const [motionError, setMotionError] = useState(false)
  const [filmError, setFilmError] = useState(false)
  const revealId = `cd-hand-reveal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const knockoutId = `cd-knockout-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const chapters = continueStory ? CHAPTERS : CHAPTERS.slice(0, 3)

  useGSAP(() => {
    const header = headerRef.current
    const section = sectionRef.current
    const stage = stageRef.current
    const portraitFrame = portraitFrameRef.current
    const portraitVideo = portraitVideoRef.current
    const film = filmRef.current
    const period = periodRef.current
    const seed = seedRef.current
    if (!section || !stage || !portraitFrame || !portraitVideo || !film || !period || !seed) return
    const phoneFraming = window.matchMedia(PHONE_FRAMING)
    const dots = [...Array.from(dotsRef.current?.children ?? []) as HTMLElement[], seed]
    const intro = stage.querySelector<HTMLElement>(`.${styles.intro}`)!
    const portrait = stage.querySelector<HTMLElement>(`.${styles.portraitScene}`)!
    const footage = stage.querySelector<HTMLElement>(`.${styles.footage}`)!
    const shade = stage.querySelector<HTMLElement>(`.${styles.filmShade}`)!
    const controls = stage.querySelector<HTMLElement>(`.${styles.controls}`)!
    const story = stage.querySelector<HTMLElement>("[data-label-story]")
    const captions = Array.from(stage.querySelectorAll<HTMLElement>(`.${styles.caption} p`))
    const storyText = Array.from(story?.querySelectorAll<HTMLElement>("[data-story-eyebrow], [data-story-line], [data-story-sentence]") ?? [])
    const posterImage = footage.querySelector<HTMLImageElement>("img")
    const liquidCanvas = liquidRef.current
    // WebGL droplets replace the rounded windows; without WebGL the windows remain.
    const liquid = liquidCanvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? createLiquidReveal(liquidCanvas) : null
    const drops = new Float32Array(MAX_DROPS * 3)
    const knockoutLayer = knockoutRef.current, knockoutSvg = knockoutSvgRef.current, knockoutWord = knockoutWordRef.current
    const knockoutText = knockoutTextRef.current, knockoutProbe = knockoutProbeRef.current
    const chapterRail = chaptersRef.current
    const chapterButtons = Array.from(chapterRail?.querySelectorAll<HTMLButtonElement>("[data-chapter]") ?? [])
    let textCues: { start: number; duration: number }[] = []
    let reducedStoryText = false
    let disposed = false
    let refreshFrame = 0
    let trigger: ScrollTrigger | undefined
    let renderCurrent: () => void = () => undefined
    const inMemory = () => window.matchMedia(TOUCH).matches
    const portraitScrubber = createScrollVideo(portraitVideo, {
      inMemory,
      onReady: ready => { setMotionReady(ready); if (ready) setMotionError(false) },
      onError: () => setMotionError(true),
    })
    const filmScrubber = createScrollVideo(film, {
      fps: () => !smoothFirstShot ? 24 : phoneFraming.matches ? 48 : 96,
      inMemory,
      onReady: ready => { setFilmReady(ready); if (ready) setFilmError(false) },
      onError: () => setFilmError(true),
    })
    // Buffer both videos once the page has loaded, unless the visitor asked to save data.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    let preloadTimer = 0, idleHandle = 0
    const preloadFilm = () => { window.clearTimeout(preloadTimer); if (!disposed) filmScrubber.preload() }
    const preloadMedia = () => {
      if (disposed) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { preloadFilm(); return }
      portraitScrubber.preload()
      // The film follows once the portrait can play through, or after a short head start.
      portraitVideo.addEventListener("canplaythrough", preloadFilm, { once: true })
      preloadTimer = window.setTimeout(preloadFilm, 2500)
    }
    const schedulePreload = () => {
      // Safari has no requestIdleCallback; a short timeout plays the same role there.
      if (typeof window.requestIdleCallback === "function") idleHandle = window.requestIdleCallback(preloadMedia, { timeout: 2000 })
      else preloadTimer = window.setTimeout(preloadMedia, 200)
    }
    if (!connection?.saveData && !/2g/.test(connection?.effectiveType ?? "")) {
      if (document.readyState === "complete") schedulePreload()
      else window.addEventListener("load", schedulePreload, { once: true })
    }

    // The knockout zoom is written by hand: a cached SVG origin kept stale offsets
    // across re-measures and could leave the word shifted towards the top-left.
    const knockoutZoom = { scale: 1, x: 0, y: 0 }
    let lastZoom = ""
    const applyKnockoutZoom = () => {
      const { scale, x, y } = knockoutZoom
      const transform = `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`
      if (transform !== lastZoom) knockoutWord?.setAttribute("transform", lastZoom = transform)
    }
    // Fit the knockout word to the stage (one line, or two stacked on phones) and zoom
    // from inside the stem of its L. Only the hidden probe is reset for measuring, so a
    // failed measurement leaves the visible word where it was.
    function measureKnockout() {
      if (!knockoutSvg || !knockoutWord || !knockoutText || !knockoutProbe) return
      const width = stage!.clientWidth, height = stage!.clientHeight, stacked = phoneFraming.matches
      try {
        knockoutProbe.setAttribute("font-size", "100"); knockoutProbe.setAttribute("x", "0"); knockoutProbe.setAttribute("y", "0")
        knockoutProbe.querySelectorAll("tspan").forEach(line => { line.removeAttribute("x"); line.removeAttribute("y") })
        // Not laid out yet: fonts or the next resize will measure again.
        if (!knockoutProbe.getNumberOfChars()) return
        const natural = knockoutProbe.getComputedTextLength()
        // Stacked lines centre on their visible glyphs, ignoring the joining space.
        const lineWidths = stacked ? Array.from(knockoutProbe.querySelectorAll("tspan"), line => line.getSubStringLength(0, line.textContent!.trimEnd().length)) : []
        if (!natural || lineWidths.some(lineWidth => !lineWidth)) return
        const size = stacked ? Math.min(width * .8 / Math.max(...lineWidths) * 100, height * .3) : Math.min(width * .86 / natural * 100, height * .42)
        const lineHeight = size * .88
        knockoutSvg.setAttribute("viewBox", `0 0 ${width} ${height}`)
        for (const node of [knockoutProbe, knockoutText]) {
          node.setAttribute("font-size", String(size))
          node.setAttribute("x", stacked ? "0" : String((width - natural * size / 100) / 2))
          node.setAttribute("y", stacked ? "0" : String(height / 2 + size * .34))
          node.querySelectorAll("tspan").forEach((line, index) => {
            if (!stacked) { line.removeAttribute("x"); line.removeAttribute("y"); return }
            line.setAttribute("x", String((width - lineWidths[index] * size / 100) / 2))
            line.setAttribute("y", String(height / 2 + (index - .5) * lineHeight + size * .34))
          })
        }
        const stem = knockoutProbe.getExtentOfChar(KNOCKOUT_ZOOM_LETTER)
        knockoutZoom.x = stem.x + stem.width * .24; knockoutZoom.y = stem.y + stem.height * .62
        applyKnockoutZoom()
      } catch {
        // Keep the last good layout; the next layout change measures again.
      }
    }
    // All layout reads happen on layout changes, never in the scroll renderer.
    const geometry = { width: 1, height: 1, frameX: 0, frameY: 0, frameWidth: 1, frameHeight: 1, originX: 0, originY: 0, seedRadius: 4, headerHeight: 90, range: 1, phone: false }
    const measure = () => {
      const stageBounds = stage.getBoundingClientRect()
      const frameBounds = portraitFrame.getBoundingClientRect()
      const periodBounds = period.getBoundingClientRect()
      // Remove the fading title's translation so refreshes preserve the departure point.
      const introX = Number(gsap.getProperty(intro, "x")) || 0
      const introY = Number(gsap.getProperty(intro, "y")) || 0
      Object.assign(geometry, {
        width: stage.clientWidth, height: stage.clientHeight,
        frameX: frameBounds.left - stageBounds.left, frameY: frameBounds.top - stageBounds.top,
        frameWidth: frameBounds.width, frameHeight: frameBounds.height,
        originX: periodBounds.left - stageBounds.left + periodBounds.width / 2 - introX,
        originY: periodBounds.top - stageBounds.top + periodBounds.height / 2 - introY,
        seedRadius: periodBounds.width / 2, headerHeight: header?.offsetHeight ?? 90,
        range: Math.max(1, section.offsetHeight - stage.clientHeight), phone: phoneFraming.matches,
      })
      liquid?.resize()
      measureKnockout()
      // Schedule whole phrases only after the moving film clears their bounds.
      // This runs on layout changes; scrolling only writes cached opacities.
      const filmTop = geometry.height * (geometry.phone ? 0.43 : 0.56)
      let previousEnd = 1.07
      textCues = storyText.map((node, index) => {
        const bottom = node.getBoundingClientRect().bottom - stageBounds.top + 8
        const target = clamp(bottom / filmTop)
        let low = 0, high = 1
        for (let iteration = 0; iteration < 16; iteration++) {
          const middle = (low + high) / 2
          if (smoothstep(middle) < target) low = middle
          else high = middle
        }
        const clearance = reducedStoryText ? 1.14 : 1.01 + 0.24 * (low + high) / 2
        const duration = index === 0 ? 0.025 : index <= 2 ? 0.035 : 0.04
        const start = Math.max(clearance, previousEnd + (index <= 2 ? 0.004 : 0.008))
        previousEnd = start + duration
        return { start, duration }
      })
    }
    measure()
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      const reduced = Boolean(context.conditions?.reduced)
      reducedStoryText = reduced
      measure()
      if (storyText.length) gsap.set(storyText, { opacity: 0 })
      const textOpacity = storyText.map(node => gsap.quickSetter(node, "opacity"))
      const curator = story?.querySelector<HTMLElement>("[data-story-curator]")
      const lightbox = story?.querySelector<HTMLElement>("[data-story-lightbox]")
      const filmCaption = story?.querySelector<HTMLElement>("[data-story-film-caption]")
      const next = story?.querySelector<HTMLElement>("[data-story-next]")
      const drawing = story?.querySelector<HTMLElement>("[data-story-geometry]")
      const photos = Array.from(story?.querySelectorAll<HTMLElement>("[data-story-photo]") ?? [])
      const alpha = (node: HTMLElement | null | undefined) => node ? {
        opacity: gsap.quickSetter(node, "opacity"), visibility: gsap.quickSetter(node, "visibility"),
      } : undefined
      const storyAlpha = alpha(story), curatorAlpha = alpha(curator), lightboxAlpha = alpha(lightbox)
      const filmCaptionAlpha = alpha(filmCaption), nextAlpha = alpha(next), drawingAlpha = alpha(drawing)
      const curatorClip = curator ? gsap.quickSetter(curator, "clipPath") : undefined
      const lightboxY = lightbox ? gsap.quickSetter(lightbox, "y", "px") : undefined
      const photoScale = photos.map(photo => ({ x: gsap.quickSetter(photo, "scaleX"), y: gsap.quickSetter(photo, "scaleY") }))
      const reveal = (set: ReturnType<typeof alpha>, amount: number) => {
        set?.opacity(amount); set?.visibility(amount > 0 ? "visible" : "hidden")
      }
      const clock = { progress: 0, motion: 0, film: 0, collect: 0, windup: 0, detach: 0 }
      const points = dots.map((_, index) => ({
        arrival: 0, release: 0, opening: 0, opacity: 1,
        offsetX: index >= 4 && index !== 11 ? Math.sin(index * 2.4) * 0.075 : 0,
        offsetY: index >= 4 && index !== 11 ? Math.cos(index * 2.1) * 0.065 : 0,
      }))
      let lastPath = ""
      let lastControls = ""
      let lastReveal = ""
      let lastChapter = -1
      let lastTone = ""
      let lastSkip = ""
      let dotsHidden = false
      const chapterFills = Array.from(chapterRail?.querySelectorAll<HTMLElement>("[data-chapter-fill]") ?? []).map(node => gsap.quickSetter(node, "scaleY"))
      // The film source for the droplets: the decoded frame when ready, else its poster.
      const filmSource = () => film.dataset.visible === "true" && film.readyState >= 2 ? film
        : posterImage?.complete && posterImage.naturalWidth ? posterImage : null
      const render = () => {
        if (disposed) return
        const { progress, motion, collect, windup, detach } = clock
        const { width, height, frameX, frameY, frameWidth, frameHeight, originX, originY, seedRadius, phone } = geometry
        const revealing = !reduced && progress >= JOURNEY.reveal && progress < JOURNEY.film
        const revealState = String(revealing)
        if (lastReveal !== revealState) { stage.dataset.revealing = lastReveal = revealState }
        const controlsState = String(progress > (reduced ? 0.3 : JOURNEY.controls) && (!continueStory || progress < 1.06))
        if (lastControls !== controlsState) { stage.dataset.controls = lastControls = controlsState }
        stage.dataset.journeyProgress = String(progress)
        applyKnockoutZoom()
        let chapter = 0
        chapters.forEach(({ start }, index) => {
          if (progress >= start) chapter = index
          const next = chapters[index + 1]
          if (next) chapterFills[index]?.(clamp((progress - start) / (next.start - start)))
        })
        if (chapter !== lastChapter) {
          lastChapter = chapter
          chapterButtons.forEach((button, index) => {
            if (index === chapter) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current")
            button.dataset.done = String(index < chapter)
          })
        }
        const tone = continueStory && progress >= 1.04 ? "light" : "dark"
        if (tone !== lastTone) stage.dataset.tone = lastTone = tone
        const skipState = String(continueStory && progress < .99)
        if (skipState !== lastSkip) stage.dataset.skip = lastSkip = skipState
        textOpacity.forEach((setOpacity, index) => {
          const cue = textCues[index]
          setOpacity(smoothstep(clamp((progress - cue.start) / cue.duration)))
        })
        // Write every About reveal from the same clock, including after refresh.
        // Future fromTo tweens can otherwise expose their CSS defaults when reverted.
        if (continueStory && story) {
          const curatorReveal = smoothstep(clamp((progress - 1.26) / .18))
          const lightboxReveal = smoothstep(clamp((progress - 1.34) / .16))
          reveal(storyAlpha, smoothstep(clamp((progress - 1.08) / .04)))
          reveal(curatorAlpha, curatorReveal)
          // Release the clip once revealed so the hovered photo can tilt past its edges.
          curatorClip?.(reduced || curatorReveal >= 1 ? "none" : `inset(${100 * (1 - curatorReveal)}% 0% 0% 0%)`)
          reveal(lightboxAlpha, lightboxReveal)
          lightboxY?.(reduced ? 0 : 32 * (1 - lightboxReveal))
          photoScale.forEach((set, index) => {
            const scale = reduced ? 1 : 1.08 - .08 * smoothstep(clamp((progress - 1.26 - index * .04) / .18))
            set.x(scale); set.y(scale)
          })
          reveal(filmCaptionAlpha, smoothstep(clamp((progress - 1.27) / .08)))
          reveal(nextAlpha, smoothstep(clamp((progress - 1.43) / .07)))
          // The drawing builds itself from here; it only needs to become visible.
          reveal(drawingAlpha, smoothstep(clamp((progress - 1.14) / .04)))
        }

        let path = progress >= JOURNEY.film ? "M0 0H1V1H0Z" : "M0 0Z"
        // Once the handoff is complete, neither dots nor the SVG need per-scroll work.
        const source = liquid && revealing ? filmSource() : null
        if ((!reduced && progress < 0.58) || revealing) {
          dotsHidden = false
          const sample = clamp(motion * 9 / 5) * (dotTracks.frames.length - 1)
          const first = Math.floor(sample)
          const next = Math.min(first + 1, dotTracks.frames.length - 1)
          const mix = sample - first
          if (revealing) path = source ? "M0 0Z" : ""
          dots.forEach((dot, index) => {
            const point = points[index]
            const isSeed = index === 11
            const sourceIndex = index < 4 ? index : isSeed ? 4 : (index - 4) % 4
            const a = dotTracks.frames[first][sourceIndex]
            const b = dotTracks.frames[next][sourceIndex]
            const [collectedX, collectedY] = DOT_FORMATION[index]
            const nativeX = lerp(lerp(a[0], b[0], mix) + point.offsetX, collectedX / 1248, collect) + windup * 0.014
            const nativeY = lerp(lerp(a[1], b[1], mix) + point.offsetY, collectedY / 1664, collect) + windup * 0.012
            const projectedX = frameX + nativeX * frameWidth
            const projectedY = frameY + nativeY * frameHeight
            let x: number, y: number
            if (isSeed) {
              x = lerp(originX, projectedX, detach)
              y = lerp(originY, projectedY, detach) - Math.sin(detach * Math.PI) * height * 0.09
            } else {
              const [entryX, entryY, bendX, bendY] = DOT_ENTRIES[index]
              const startX = entryX * width, startY = entryY * height
              const controlX = lerp(startX, projectedX, 0.5) + bendX * width
              const controlY = lerp(startY, projectedY, 0.5) + bendY * height
              const arrival = point.arrival, remaining = 1 - arrival
              // White points enter from the edges and meet the tracked hand trajectory.
              x = remaining * remaining * startX + 2 * remaining * arrival * controlX + arrival * arrival * projectedX
              y = remaining * remaining * startY + 2 * remaining * arrival * controlY + arrival * arrival * projectedY
            }
            x -= point.release * width * (0.58 + index * 0.008)
            y += point.release * height * (ROW_ORDER[index] / 11 - 0.5) * 0.18
            const radius = isSeed ? lerp(seedRadius, phone ? 4 : 5, detach) : (phone ? 2.4 : 3.2) + index % 3 * 0.18
            const scale = radius * 2 / DOT_DIAMETER
            // Fixed 8px geometry; size and streaking use compositor transforms only.
            dot.style.transform = `translate3d(${x - DOT_DIAMETER / 2}px, ${y - DOT_DIAMETER / 2}px, 0) scale(${scale * (1 + point.release * 2.8)}, ${scale * (1 - point.release * 0.3)})`
            dot.style.opacity = String(point.opacity)
            if (!revealing) return
            const opening = point.opening
            if (source) {
              // Each dot becomes a glass droplet that drifts to its own part of the frame and swells until they merge.
              // Fixed per-drop offsets keep the scatter organic but identical on every scrub.
              const slot = ROW_ORDER[index], spread = smoothstep(clamp(opening * 1.7))
              const scatterX = Math.sin(slot * 12.9898) * 0.075, scatterY = Math.cos(slot * 4.1414) * 0.1
              drops[index * 3] = lerp(x, ((slot % 4) + 0.5 + scatterX * 4) / 4 * width, spread)
              drops[index * 3 + 1] = lerp(y, (Math.floor(slot / 4) + 0.5 + scatterY * 3) / 3 * height, spread)
              drops[index * 3 + 2] = lerp(radius * 1.15, Math.hypot(width, height) * (0.38 + (slot % 3) * 0.04), Math.pow(opening, 2.6))
              return
            }
            // Twelve windows sample one unchanged real video, then join seamlessly.
            const windowX = lerp(x / width, 0.5, opening)
            const windowY = lerp(y / height, (ROW_ORDER[index] + 0.5) / 12, opening)
            const windowWidth = lerp(radius * 2 / width, 1.002, opening)
            const windowHeight = lerp(radius * 2 / height, 1 / 12 + 1 / height, opening)
            path += roundedWindow(windowX, windowY, windowWidth, windowHeight, (1 - opening) * Math.min(windowWidth, windowHeight) * 0.5)
          })
        } else if (!dotsHidden) {
          dots.forEach(dot => { dot.style.opacity = "0" })
          dotsHidden = true
        }
        if (source) liquid?.render(drops, progress * 6, source)
        else liquid?.clear()
        stage.dataset.seedReady = String(!reduced)
        if (path !== lastPath) { revealRef.current?.setAttribute("d", path); lastPath = path }
        const onScreen = trigger ? window.scrollY < trigger.end + height : progress < 1
        portraitScrubber.setProgress(motion, !reduced && progress > 0.012 && onScreen)
        filmScrubber.setProgress(clock.film, progress > 0.2 && onScreen)
      }
      renderCurrent = render
      // A single direct-scrub owner. No play(), inertial catch-up, snapping, or second clock.
      const timeline = gsap.timeline({ paused: true, defaults: { ease: smoothstep }, onUpdate: render })
      Object.entries(JOURNEY).filter(([label]) => label !== "motionDuration").forEach(([label, position]) => timeline.addLabel(label, position))
      timeline.fromTo(clock, { progress: 0 }, { progress: journeyLength, duration: journeyLength, ease: "none" }, 0)
      if (!reduced) {
        timeline.fromTo(clock, { motion: 0 }, { motion: 1, duration: JOURNEY.motionDuration, ease: "none" }, "motion")
        timeline.fromTo(clock, { collect: 0 }, { collect: 1, duration: JOURNEY.collected - JOURNEY.collect }, "collect")
        timeline.fromTo(clock, { windup: 0 }, { windup: 1, duration: 0.55 / 9 * JOURNEY.motionDuration }, "windup")
        timeline.fromTo(clock, { detach: 0 }, { detach: 1, duration: 0.18 }, 0.025)
        points.forEach((point, index) => {
          const stagger = ROW_ORDER[index] * 0.0012
          timeline.fromTo(point, { release: 0 }, { release: 1, duration: 0.555 - JOURNEY.snap }, JOURNEY.snap + stagger)
          timeline.fromTo(point, { opening: 0 }, { opening: 1, duration: JOURNEY.film - JOURNEY.reveal - stagger }, JOURNEY.reveal + stagger)
          if (index !== 11) timeline.fromTo(point, { arrival: 0 }, { arrival: 1, duration: 0.18 + index % 3 * 0.018, ease: "power2.inOut" }, 0.065 + ENTRY_ORDER[index] * 0.007)
          timeline.fromTo(point, { opacity: 1 }, { opacity: 0, duration: 0.054 }, 0.508 + stagger)
        })
      }
      const filmStart = reduced ? 0.27 : JOURNEY.film
      timeline.fromTo(clock, { film: 0 }, { film: 1, duration: reduced ? 0.73 : 0.34, ease: "none" }, filmStart)
      timeline.fromTo(intro, { opacity: 1 }, { opacity: 0, duration: reduced ? 0.05 : 0.14 }, reduced ? 0.2 : 0.065)
      if (!reduced) timeline.fromTo(intro, { x: 0, y: 0 }, { x: () => -geometry.width * 0.045, y: () => -geometry.height * 0.025, duration: 0.18 }, 0.04)
      timeline.fromTo(portrait, { opacity: 1 }, { opacity: 0, duration: reduced ? 0.04 : 0.085 }, reduced ? 0.23 : 0.565)
      timeline.fromTo(liquidCanvas ? [footage, liquidCanvas] : footage, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.04 : 0.022 }, reduced ? 0.23 : JOURNEY.reveal)
      timeline.fromTo([shade, controls], { opacity: 0 }, { opacity: 1, duration: reduced ? 0.1 : 0.05 }, reduced ? 0.3 : JOURNEY.controls)
      const beats = reduced ? [[0.36, 0.53], [0.57, 0.75], [0.79, 1.08]] : [[0.695, 0.78], [0.8, 0.885], [0.91, 1.04]]
      beats.forEach(([start, end], index) => {
        if (index === 1 && !reduced && knockoutLayer && knockoutWord) {
          // Darkness closes around the giant word, then the camera flies through its L.
          timeline.fromTo(knockoutLayer, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, start - 0.005)
          timeline.fromTo(knockoutZoom, { scale: 1.45 }, { scale: 1, duration: 0.035, ease: "power3.out" }, start - 0.005)
          timeline.fromTo(knockoutZoom, { scale: 1 }, { scale: 34, duration: 0.03, ease: "power3.in", immediateRender: false }, end - 0.03)
          timeline.to(knockoutLayer, { autoAlpha: 0, duration: 0.012, ease: "none" }, end - 0.012)
          return
        }
        const enter = reduced ? 0.04 : 0.025
        timeline.fromTo(captions[index], { opacity: 0, y: reduced ? 0 : 28 }, { opacity: 1, y: 0, duration: enter }, start)
        // The final caption stays on screen as the opener hands over to the page.
        if (end <= 1) timeline.to(captions[index], { opacity: 0, y: reduced ? 0 : -18, duration: 0.02 }, end - 0.02)
      })
      if (continueStory && story && header) {
        timeline.addLabel("label", 1.08).addLabel("connection", 1.425).addLabel("curator", 1.26).addLabel("reading", 1.5)
        timeline.fromTo(stage, { backgroundColor: "#0b0c0b" }, { backgroundColor: "#e9e5dc", duration: 0.22 }, 1)
        timeline.to(captions[2], { opacity: 0, y: reduced ? 0 : -24, duration: 0.05 }, 1)
        timeline.to(shade, { opacity: 0, duration: 0.12 }, 1)
        timeline.to(controls, { opacity: 0, duration: 0.05 }, 1)
        // The original film remains the same element and keeps its aspect ratio.
        const filmFrame = {
          x: () => geometry.phone ? 24 : geometry.width * 0.038,
          y: () => geometry.height * (geometry.phone ? 0.43 : 0.56),
          scale: () => geometry.phone ? 0.47 : 0.38, transformOrigin: "0 0",
        }
        if (reduced) {
          timeline.to(footage, { opacity: 0, duration: 0.06 }, 1)
          timeline.set(footage, filmFrame, 1.06)
          timeline.to(footage, { opacity: 1, duration: 0.06 }, 1.08)
        } else {
          timeline.fromTo(footage, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, { ...filmFrame, duration: 0.24 }, 1.01)
        }
        timeline.fromTo(header, { color: "#f1eee7", "--brand-invert": 0, "--header-wash": 0.38 }, { color: "#20221d", "--brand-invert": 1, "--header-wash": 0, duration: 0.14 }, 1.08)
      }
      // The scene stays paused. One scroll-owned driver seeks its time directly;
      // only the first real shot receives twice the scroll distance.
      let scrollTimeline = timeline
      const firstShotDuration = (reduced ? 0.73 : 0.34) * FIRST_SHOT_SHARE
      const firstShotEnd = filmStart + firstShotDuration
      if (smoothFirstShot) {
        scrollTimeline = gsap.timeline({ paused: true, defaults: { ease: "none" } })
          .to(timeline, { time: filmStart, duration: filmStart }, 0)
          .to(timeline, { time: firstShotEnd, duration: firstShotDuration * 2 })
          .to(timeline, { time: journeyLength, duration: journeyLength - firstShotEnd })
      }
      trigger = ScrollTrigger.create({
        trigger: section, animation: scrollTimeline, start: "top top", end: () => `+=${geometry.range}`,
        scrub: true, invalidateOnRefresh: true, onRefreshInit: measure, onRefresh: render,
      })
      // Only this class switch runs beyond the story; the scroll clock is unchanged.
      if (continueStory && header) ScrollTrigger.create({
        trigger: section, start: () => `bottom top+=${geometry.headerHeight / 2}`, end: "max",
        onEnter: () => { header.dataset.afterStory = "true" },
        onEnterBack: () => { header.dataset.afterStory = "true" },
        onLeaveBack: () => { header.dataset.afterStory = "false" },
        onRefresh: self => { header.dataset.afterStory = String(self.scroll() >= self.start) },
      })
      // Skip and the chapter rail land on journey times, through the same scroll remapping.
      scrollForTimeRef.current = time => {
        if (!trigger) return null
        const scrollTime = !smoothFirstShot || time <= filmStart ? time
          : time <= firstShotEnd ? filmStart + (time - filmStart) * 2 : time + firstShotDuration
        return trigger.start + (trigger.end - trigger.start) * Math.min(1, scrollTime / scrollTimeline.duration())
      }
      scrollTimeline.progress(trigger.progress)
      render()
      return () => {
        renderCurrent = () => undefined; trigger = undefined
        scrollForTimeRef.current = () => null
        liquid?.clear()
        for (const node of [story, curator, lightbox, filmCaption, next, drawing]) {
          node?.style.removeProperty("opacity"); node?.style.removeProperty("visibility")
        }
        curator?.style.removeProperty("clip-path")
        lightbox?.style.removeProperty("transform")
        photos.forEach(photo => photo.style.removeProperty("transform"))
      }
    })
    const refresh = () => {
      refreshFrame = 0
      if (!disposed) { measure(); trigger?.refresh(); renderCurrent() }
    }
    const scheduleRefresh = () => { if (!refreshFrame && !disposed) refreshFrame = window.requestAnimationFrame(refresh) }
    const updateFraming = () => { filmScrubber.refreshSource(); scheduleRefresh() }
    retryRef.current = () => { setMotionError(false); setFilmError(false); portraitScrubber.reload(); filmScrubber.reload(); renderCurrent() }
    const observer = new ResizeObserver(scheduleRefresh)
    observer.observe(stage)
    observer.observe(portraitFrame)
    observer.observe(period)
    observer.observe(section)
    void document.fonts.ready.then(scheduleRefresh)
    phoneFraming.addEventListener("change", updateFraming)
    document.addEventListener("visibilitychange", scheduleRefresh)
    return () => {
      disposed = true
      window.cancelAnimationFrame(refreshFrame)
      observer.disconnect()
      media.revert()
      portraitScrubber.dispose()
      filmScrubber.dispose()
      phoneFraming.removeEventListener("change", updateFraming)
      document.removeEventListener("visibilitychange", scheduleRefresh)
      window.removeEventListener("load", schedulePreload)
      portraitVideo.removeEventListener("canplaythrough", preloadFilm)
      window.clearTimeout(preloadTimer)
      if (idleHandle) window.cancelIdleCallback?.(idleHandle)
      liquid?.dispose()
      retryRef.current = () => undefined
      if (header) delete header.dataset.afterStory
    }
  }, { scope: sectionRef, dependencies: [continueStory, smoothFirstShot], revertOnUpdate: true })

  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false
        menuRef.current.querySelector("summary")?.focus()
      }
    }
    const dismissMenu = (event: PointerEvent) => {
      const menu = menuRef.current
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false
    }
    document.addEventListener("keydown", closeMenu)
    document.addEventListener("pointerdown", dismissMenu)
    return () => {
      document.removeEventListener("keydown", closeMenu)
      document.removeEventListener("pointerdown", dismissMenu)
    }
  }, [])

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

  function skipIntro() {
    const top = scrollForTimeRef.current(STORY_REST), veil = skipVeilRef.current, button = skipRef.current, stage = stageRef.current
    if (top === null) return
    const land = () => {
      window.scrollTo({ top, behavior: "instant" })
      // The story is hidden until the scroll clock renders it, and hidden headings refuse focus.
      ScrollTrigger.update()
      requestAnimationFrame(() => document.getElementById("cd-story-title")?.focus({ preventScroll: true }))
    }
    if (!veil || !button || !stage || reducedMotion()) { land(); return }
    // A paper-coloured wipe grows from the button, the page lands, and the story appears.
    const from = button.getBoundingClientRect(), bounds = stage.getBoundingClientRect()
    const x = from.left - bounds.left + 10, y = from.top - bounds.top + from.height / 2
    const radius = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y))
    gsap.timeline()
      .set(veil, { autoAlpha: 1, clipPath: `circle(0px at ${x}px ${y}px)` })
      .to(veil, { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: .6, ease: "power3.inOut" })
      .add(land)
      .to(veil, { autoAlpha: 0, duration: .55, ease: "power2.out" }, "+=.08")
  }

  function goToChapter(index: number) {
    const top = scrollForTimeRef.current(chapters[index].target)
    if (top !== null) window.scrollTo({ top, behavior: reducedMotion() ? "instant" : "smooth" })
  }

  function replay() {
    const section = sectionRef.current
    if (!section) return
    section.querySelector("h1")?.focus({ preventScroll: true })
    window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top, behavior: "instant" })
  }

  return (
    <>
      <header className={styles.header} ref={headerRef} data-story-header>
        <a className={styles.brand} href={preview ? "/opener" : "#top"} aria-label="Collecting Dots home"><img src="/CD%20-%20main%20logo%20white.svg" alt="Collecting Dots" width="146" height="30" /></a>
        <div className={styles.headerLinks}>
          <a className={styles.listen} href="https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ" target="_blank" rel="noopener noreferrer">Listen <ArrowUpRight size={14} aria-hidden="true" /></a>
          <details className={styles.menu} ref={menuRef}>
            <summary>Explore <span className={styles.menuMark} aria-hidden="true"><i /><i /><i /><i /></span></summary>
            <nav aria-label="Main navigation" className={styles.menuPanel}>
              <span className={styles.menuEyebrow}>Connect the dots</span>
              {sections.map(([label, id]) => <a key={id} href={`${preview && !["releases", "artists", "events", "sets", "merchandise", "demo-submission"].includes(id) ? "/" : ""}#${id}`} onClick={() => { if (menuRef.current) menuRef.current.open = false }}>{label}<ArrowUpRight size={18} aria-hidden="true" /></a>)}
            </nav>
          </details>
        </div>
      </header>
      <section id="top" ref={sectionRef} className={styles.hero} style={{ "--journey-length": scrollLength, "--reduced-journey-length": reducedScrollLength } as CSSProperties} data-film-version={smoothFirstShot ? "smooth" : "original"} aria-labelledby="cd-hero-title">
        <div className={styles.stage} ref={stageRef}>
          <svg className={styles.maskDefinitions} aria-hidden="true" focusable="false"><defs><clipPath id={revealId} clipPathUnits="objectBoundingBox"><path ref={revealRef} d="M0 0Z" /></clipPath></defs></svg>
          <div className={styles.portraitScene}>
            <div className={styles.portraitFrame} ref={portraitFrameRef}>
              <img className={styles.portrait} src={MOTION_POSTER} alt="OMRI, founder and curator of Collecting Dots" width="1248" height="1664" fetchPriority="high" />
              <video className={styles.portraitMotion} ref={portraitVideoRef} data-visible={motionReady} src={MOTION} preload="none" muted playsInline disablePictureInPicture aria-hidden="true" tabIndex={-1} />
            </div>
            <div className={styles.portraitShade} aria-hidden="true" />
          </div>
          <div className={styles.intro}><h1 id="cd-hero-title" tabIndex={-1}><span className={styles.srOnly}>Collecting Dots</span><LogoWordmarkLine line="collecting" /><br /><LogoWordmarkLine line="dots" /><span ref={periodRef} className={styles.period} aria-hidden="true" /></h1></div>
          <div className={styles.particles} ref={dotsRef} aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div>
          <span className={styles.seed} ref={seedRef} aria-hidden="true" />
          <div className={styles.footage} style={{ "--reveal-mask": `url(#${revealId})` } as CSSProperties} data-hero-footage>
            <picture className={styles.poster}><source media={PHONE_FRAMING} srcSet="/media/hero/cd-hero-poster-v3-portrait.webp" /><img src="/media/hero/cd-hero-poster-v3.webp" alt="OMRI at the decks with the real Collecting Dots crowd" width="1920" height="1080" /></picture>
            <video className={styles.film} ref={filmRef} data-visible={filmReady} preload="none" muted playsInline disablePictureInPicture aria-hidden="true" tabIndex={-1}><source media={PHONE_FRAMING} src={smoothFirstShot ? SMOOTH_PHONE_FILM : PHONE_FILM} type="video/mp4" /><source src={smoothFirstShot ? SMOOTH_FILM : FILM} type="video/mp4" /></video>
          </div>
          <canvas className={styles.liquid} ref={liquidRef} aria-hidden="true" />
          <div className={styles.filmShade} aria-hidden="true" />
          <div className={styles.knockout} ref={knockoutRef} aria-hidden="true">
            <svg ref={knockoutSvgRef} preserveAspectRatio="none" focusable="false">
              <defs>
                <mask id={knockoutId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                  <rect width="100%" height="100%" fill="#fff" />
                  <g ref={knockoutWordRef}><text ref={knockoutTextRef} fill="#000">{KNOCKOUT_LINES.map(line => <tspan key={line}>{line}</tspan>)}</text></g>
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="#0b0c0b" mask={`url(#${knockoutId})`} />
              <text ref={knockoutProbeRef} visibility="hidden">{KNOCKOUT_LINES.map(line => <tspan key={line}>{line}</tspan>)}</text>
            </svg>
          </div>
          <div className={styles.caption} aria-hidden="true">{["THE MUSIC.", "THE PEOPLE.", "THE MOMENTS."].map((text, index) => <p key={text} className={styles[`beat${index}`]}>{text}</p>)}</div>
          <div className={styles.controls}><button onClick={replay} aria-label="Replay opener"><RotateCcw size={15} aria-hidden="true" /><span>Replay</span></button></div>
          {continueStory && <button className={styles.skip} ref={skipRef} onClick={skipIntro}>Skip intro<ArrowDown size={14} aria-hidden="true" /></button>}
          {continueStory && <CollectingDotsStory preview={preview} />}
          <nav className={styles.chapters} ref={chaptersRef} aria-label="Opener chapters">
            {chapters.map((chapter, index) => <Fragment key={chapter.label}>
              <button type="button" className={styles.chapter} data-chapter={index} onClick={() => goToChapter(index)}><span>{chapter.label}</span><i aria-hidden="true" /></button>
              {index < chapters.length - 1 && <span className={styles.chapterLine} aria-hidden="true"><span data-chapter-fill /></span>}
            </Fragment>)}
          </nav>
          <div className={styles.skipVeil} ref={skipVeilRef} aria-hidden="true" />
          {(motionError || filmError) && <div className={styles.mediaNotice} role="status"><p>{motionError ? "The portrait motion couldn’t load." : "The film couldn’t load."}</p><button onClick={() => retryRef.current()}>Retry media</button></div>}
        </div>
      </section>
    </>
  )
}

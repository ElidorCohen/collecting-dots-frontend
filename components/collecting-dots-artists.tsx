"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from "lucide-react"
import { fetchLabelArtists, type LabelArtist } from "@/lib/artists"
import styles from "./collecting-dots-artists.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const ARTIST_SCROLL_RATIO = .38
const DOTS = [[9,18,6],[88,9,3],[92,41,8],[14,58,3],[84,77,5],[22,91,9],[49,7,2],[6,79,2],[96,91,3]]
const clamp = gsap.utils.clamp(0, 1)

function Portrait({ artist, onOpen }: { artist: LabelArtist; onOpen: (artist: LabelArtist, origin: HTMLButtonElement) => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const surfaceRef = useRef<HTMLSpanElement>(null)
  const foregroundRef = useRef<HTMLSpanElement>(null)
  const [broken, setBroken] = useState<Set<string>>(new Set())


  useGSAP(() => {
    const button = buttonRef.current, surface = surfaceRef.current, foreground = foregroundRef.current
    if (!button || !surface || !foreground) return
    const media = gsap.matchMedia()
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const point = { left: 0, top: 0, width: 1, height: 1 }
      const measure = () => {
        const rect = button.getBoundingClientRect()
        Object.assign(point, { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
      }
      const x = gsap.quickTo(surface, "x", { duration: .3, ease: "power3.out" })
      const y = gsap.quickTo(surface, "y", { duration: .3, ease: "power3.out" })
      const rotateY = gsap.quickTo(surface, "rotationY", { duration: .3, ease: "power3.out" })
      const rotateX = gsap.quickTo(surface, "rotationX", { duration: .3, ease: "power3.out" })
      const foregroundX = gsap.quickTo(foreground, "x", { duration: .35, ease: "power3.out" })
      const foregroundY = gsap.quickTo(foreground, "y", { duration: .35, ease: "power3.out" })
      const lensX = gsap.quickTo(surface, "--lens-x", { duration: .2, ease: "power2.out" })
      const lensY = gsap.quickTo(surface, "--lens-y", { duration: .2, ease: "power2.out" })
      const radius = gsap.quickTo(surface, "--lens-radius", { duration: .24, ease: "power2.out" })
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return
        const px = clamp((event.clientX - point.left) / point.width)
        const py = clamp((event.clientY - point.top) / point.height)
        x((px - .5) * 10); y((py - .5) * 8)
        rotateY((px - .5) * 10); rotateX((.5 - py) * 8)
        foregroundX((px - .5) * -20); foregroundY((py - .5) * -16)
        lensX(px * 100); lensY(py * 100); radius(point.width * .34)
      }
      const enter = (event: PointerEvent) => { measure(); move(event) }
      const leave = () => { x(0); y(0); rotateY(0); rotateX(0); foregroundX(0); foregroundY(0); radius(0) }
      button.addEventListener("pointerenter", enter)
      button.addEventListener("pointermove", move)
      button.addEventListener("pointerleave", leave)
      // Re-cache bounds on scrolling; pointer movement never reads layout.
      button.addEventListener("focus", measure)
      const update = () => { if (button.matches(":hover")) measure() }
      window.addEventListener("scroll", update, { passive: true })
      const observer = new ResizeObserver(measure)
      observer.observe(button)
      return () => {
        button.removeEventListener("pointerenter", enter)
        button.removeEventListener("pointermove", move)
        button.removeEventListener("pointerleave", leave)
        button.removeEventListener("focus", measure)
        window.removeEventListener("scroll", update)
        observer.disconnect()
      }
    })
    return () => media.revert()
  }, { scope: buttonRef })

  const image = artist?.image && !broken.has(artist.id)
  const imageSizes = artist.editorial ? "(max-width: 699px) 80vw, 45vw" : "(max-width: 699px) 44vw, 24vw"
  return <button ref={buttonRef} className={styles.portrait} data-editorial={artist?.editorial || false} data-artist-portrait={artist.name}
    aria-haspopup="dialog" aria-label={`Explore ${artist.name}`}
    onClick={event => onOpen(artist, event.currentTarget)}>
    <span className={styles.photoSurface} ref={surfaceRef} data-portrait-frame>
      {image ? <>
        <img className={styles.monochrome} src={artist.image} srcSet={artist.imageSet} sizes={imageSizes} alt={`Portrait of ${artist.name}`} width={720} height={960} decoding="async" draggable={false}
          onError={() => setBroken(previous => new Set([...previous, artist.id]))} />
        <span className={styles.colourLayer} aria-hidden="true"><img src={artist.image} srcSet={artist.imageSet} sizes={imageSizes} alt="" width={720} height={960} decoding="async" draggable={false} /></span>
      </> : <span className={styles.monogram} aria-hidden="true">{artist?.name.slice(0, 2) || "CD"}<span>.</span></span>}
      <span className={styles.focusRing} aria-hidden="true" />
      <span className={styles.sheen} aria-hidden="true" /><span className={styles.photoFrame} aria-hidden="true" />
    </span>
    <span className={styles.foreground} ref={foregroundRef} aria-hidden="true">{DOTS.map(([left, top, size], index) => <i key={index} style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }} />)}</span>
    <span className={styles.portraitHint} aria-hidden="true"><span className={styles.hoverHint}>Explore artist</span><span className={styles.touchHint}>Explore</span><ArrowUpRight size={14} /></span>
  </button>
}

// Deterministic, code-native contour artwork; no texture downloads or perpetual render loop.
const CONTOURS = Array.from({ length: 24 }, (_, index) => {
  const cluster = index % 2, radius = 90 + Math.floor(index / 2) * 78
  return Array.from({ length: 121 }, (_, point) => {
    const angle = point / 120 * Math.PI * 2
    const wave = 1 + .16 * Math.sin(angle * 3 + cluster) + .08 * Math.cos(angle * 5 - radius / 350)
    const x = (cluster ? 1350 : 60) + Math.cos(angle) * radius * wave * 1.2
    const y = (cluster ? 680 : 220) + Math.sin(angle) * radius * wave * .85
    return `${point ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ") + " Z"
})

function GalleryAtmosphere() {
  const fieldRef = useRef<HTMLDivElement>(null)
  const contoursRef = useRef<SVGGElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const field = fieldRef.current, panel = field?.parentElement, contours = contoursRef.current, name = nameRef.current
    if (!panel || !field || !contours || !name) return
    const media = gsap.matchMedia()
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      let bounds = panel.getBoundingClientRect(), active = ""
      const measure = () => { bounds = panel.getBoundingClientRect() }
      const x = gsap.quickTo(contours, "x", { duration: .8, ease: "power3.out" })
      const y = gsap.quickTo(contours, "y", { duration: .8, ease: "power3.out" })
      const rotate = gsap.quickTo(contours, "rotation", { duration: 1, ease: "power3.out" })
      const scale = gsap.quickTo(contours, "scale", { duration: .8, ease: "power3.out" })
      const lightX = gsap.quickTo(panel, "--field-x", { duration: .5, ease: "power2.out" })
      const lightY = gsap.quickTo(panel, "--field-y", { duration: .5, ease: "power2.out" })
      gsap.set(contours, { transformOrigin: "50% 50%" })
      const move = (event: PointerEvent) => {
        const tile = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-artist-portrait]") : null
        if (!tile || event.pointerType !== "mouse") { leave(); return }
        if (active !== tile.dataset.artistPortrait) {
          active = tile.dataset.artistPortrait || ""
          name.textContent = active
          panel.dataset.immersed = "true"
          measure()
        }
        const px = clamp((event.clientX - bounds.left) / bounds.width), py = clamp((event.clientY - bounds.top) / bounds.height)
        lightX(px * 100); lightY(py * 100)
        x((px - .5) * -180); y((py - .5) * -120); rotate((px - .5) * 12); scale(1.04 + py * .08)
      }
      const leave = () => { if (!active) return; active = ""; panel.dataset.immersed = "false"; x(0); y(0); rotate(0); scale(1) }
      panel.addEventListener("pointermove", move)
      panel.addEventListener("pointerleave", leave)
      window.addEventListener("resize", measure)
      return () => { panel.removeEventListener("pointermove", move); panel.removeEventListener("pointerleave", leave); window.removeEventListener("resize", measure); delete panel.dataset.immersed }
    })
    return () => media.revert()
  }, { scope: fieldRef })
  return <div ref={fieldRef} className={styles.atmosphere} aria-hidden="true"><div className={styles.fieldLight} /><div className={styles.fieldDots} /><svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><g ref={contoursRef}>{CONTOURS.map((path, index) => <path key={index} d={path} />)}</g></svg><span ref={nameRef} className={styles.fieldName} /></div>
}

interface ArtistSelection {
  artist: LabelArtist
  origin: HTMLButtonElement
  bounds: { left: number; top: number; width: number; height: number }
}

function ArtistDetails({ selection, onClose }: { selection: ArtistSelection; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const requestClose = useRef<() => void>(() => undefined)
  const [broken, setBroken] = useState(false)
  const { artist, origin, bounds } = selection

  useGSAP((context, contextSafe) => {
    const dialog = dialogRef.current, image = imageRef.current, backdrop = backdropRef.current, content = contentRef.current
    if (!dialog || !image || !backdrop || !content || !contextSafe) return
    const body = document.body
    const original = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const originalVisibility = origin.style.visibility
    const gutter = window.innerWidth - document.documentElement.clientWidth
    const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0
    body.style.overflow = "hidden"
    if (gutter > 0) body.style.paddingRight = `${padding + gutter}px`
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    const target = image.getBoundingClientRect()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const pieces = Array.from(content.querySelectorAll<HTMLElement>("[data-detail-reveal]"))
    let closing = false
    origin.style.visibility = "hidden"
    const timeline = gsap.timeline({ defaults: { ease: "power3.inOut" } })
    if (!reduced) {
      timeline.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .55 }, 0)
        .fromTo(image, { x: bounds.left - target.left, y: bounds.top - target.top, scaleX: bounds.width / target.width, scaleY: bounds.height / target.height, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .8 }, 0)
        .fromTo(pieces, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .065, ease: "power2.out" }, .3)
    }
    const finish = () => { origin.style.visibility = originalVisibility; dialog.close(); onClose() }
    requestClose.current = contextSafe(() => {
      if (closing) return
      closing = true
      timeline.kill()
      if (reduced) { finish(); return }
      // Page scroll stays locked: measure the same tile and return the photograph to it.
      const tile = origin.querySelector<HTMLElement>("[data-portrait-frame]")?.getBoundingClientRect()
      const destination = tile || bounds
      // offset geometry is independent of any in-flight entrance transform.
      const layout = { left: image.offsetLeft, top: image.offsetTop, width: image.offsetWidth, height: image.offsetHeight }
      gsap.timeline({ onComplete: finish, defaults: { ease: "power3.inOut" } })
        .to(pieces, { opacity: 0, y: 16, duration: .22, stagger: .025 }, 0)
        .to(image, { x: destination.left - layout.left, y: destination.top - layout.top, scaleX: destination.width / layout.width, scaleY: destination.height / layout.height, duration: .65 }, .06)
        .to(backdrop, { opacity: 0, duration: .4 }, .25)
    })
    const resize = () => {
      if (closing) return
      timeline.progress(1)
      gsap.set(image, { x: 0, y: 0, scaleX: 1, scaleY: 1 })
    }
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      requestClose.current = () => undefined
      origin.style.visibility = originalVisibility
      body.style.overflow = original.overflow; body.style.paddingRight = original.paddingRight
      dialog.close()
      // Native dialogs restore focus; prevent a viewport jump from an explicit fallback.
      if (origin.isConnected) origin.focus({ preventScroll: true })
    }
  }, { scope: dialogRef })

  return <dialog ref={dialogRef} className={styles.detailDialog} aria-labelledby="cd-artist-detail-name"
    onCancel={event => { event.preventDefault(); requestClose.current() }}>
    <div ref={backdropRef} className={styles.detailBackdrop} onClick={() => requestClose.current()} aria-hidden="true" />
    <button ref={closeRef} className={styles.detailClose} onClick={() => requestClose.current()} autoFocus><ArrowLeft size={17} /><span>Back to artists</span><X size={18} /></button>
    <div ref={imageRef} className={styles.detailImage} data-editorial={artist.editorial}>
      {!broken && artist.image ? <img src={artist.image} srcSet={artist.imageSet} sizes={artist.editorial ? "(max-width: 699px) 110vw, 80vw" : "(max-width: 699px) 65vw, 42vw"} alt={`Portrait of ${artist.name}`} width={720} height={960} decoding="async" onError={() => setBroken(true)} /> : <span className={styles.monogram}>{artist.name.slice(0, 2)}<span>.</span></span>}
    </div>
    <div ref={contentRef} className={styles.detailContent}>
      <p className={styles.detailKicker} data-detail-reveal><span />Collecting Dots Records</p>
      <p className={styles.detailRole} data-detail-reveal>{artist.editorial ? "Founder & curator" : "Label artist"}</p>
      <h3 id="cd-artist-detail-name" data-detail-reveal>{artist.name}</h3>
      <div className={styles.detailLinks}>{artist.links.map((link, index) => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${artist.name} on ${link.label}`} data-detail-reveal><span className={styles.linkNumber}>0{index + 1}</span><span>{link.label}</span><ArrowUpRight size={23} /></a>)}</div>
      <p className={styles.detailFootnote} data-detail-reveal>Part of the collection<span aria-hidden="true">.</span></p>
    </div>
  </dialog>
}

export default function CollectingDotsArtists() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const titleDotRef = useRef<HTMLSpanElement>(null)
  const connectorRef = useRef<HTMLSpanElement>(null)
  const indexRef = useRef<HTMLDivElement>(null)
  const identityRef = useRef<HTMLDivElement>(null)
  const portraitEntryRef = useRef<HTMLDivElement>(null)
  const [artists, setArtists] = useState<LabelArtist[]>([])
  const [selection, setSelection] = useState<ArtistSelection | null>(null)
  const [query, setQuery] = useState("")
  const trackRef = useRef<HTMLUListElement>(null)
  const galleryViewportRef = useRef<HTMLDivElement>(null)
  const moveGallery = useRef<(direction: number) => void>(() => undefined)
  const [range, setRange] = useState({ start: 0, end: 4, atStart: true, atEnd: false })
  const [loadKey, setLoadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const filtered = useMemo(() => artists.filter(artist => artist.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [artists, query])


  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setFailed(false)
    fetchLabelArtists(controller.signal).then(setArtists).catch(() => { if (!controller.signal.aborted) setFailed(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [loadKey])

  const openArtist = (artist: LabelArtist, origin: HTMLButtonElement) => {
    const frame = origin.querySelector<HTMLElement>("[data-portrait-frame]") || origin
    const { left, top, width, height } = frame.getBoundingClientRect()
    setSelection({ artist, origin, bounds: { left, top, width, height } })
  }

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, panel = panelRef.current
    const heading = titleRef.current, period = titleDotRef.current, connector = connectorRef.current
    const index = indexRef.current, identity = identityRef.current, portrait = portraitEntryRef.current
    const viewport = galleryViewportRef.current, track = trackRef.current
    if (!section || !stage || !panel || !heading || !period || !connector || !index || !identity || !portrait || !viewport || !track) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const geometry = { width: 1, height: 1, range: 1, intro: 1, travel: 0, fullTravel: 0, step: 1, rows: 1, cardWidth: 1, contentWidth: 1, top: 0, startX: 0, startY: 0, targetX: 0, targetY: 0, targetSize: 10, gutter: 24, headerHeight: 80 }
    let disposed = false, frame = 0, reduced = false
    let cards: HTMLElement[] = [], offsets: number[] = []
    let renderCurrent: () => void = () => undefined
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.gutter = Number.parseFloat(getComputedStyle(panel).paddingLeft) || 24
      geometry.headerHeight = header?.offsetHeight || 80
      cards = Array.from(track.querySelectorAll<HTMLElement>("[data-artist-card]"))
      const grid = getComputedStyle(track), gap = Number.parseFloat(grid.columnGap) || 0
      geometry.rows = window.matchMedia("(max-width: 699px)").matches ? 2 : 1
      geometry.cardWidth = cards[0]?.offsetWidth || geometry.cardWidth
      geometry.step = geometry.cardWidth + gap
      geometry.contentWidth = viewport.clientWidth - geometry.gutter * 2
      offsets = cards.map(card => card.offsetLeft - geometry.gutter)
      geometry.travel = Math.max(0, track.scrollWidth - viewport.clientWidth)
      // Keep the document's scroll budget stable while filtering the roster.
      geometry.fullTravel = Math.max(0, Math.ceil(artists.length / geometry.rows) * geometry.step - gap - geometry.contentWidth)
      geometry.intro = geometry.height * .9
      geometry.range = geometry.intro + geometry.fullTravel * ARTIST_SCROLL_RATIO + geometry.height * .2
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      const ruler = document.querySelector<HTMLElement>("#releases [data-release-ruler]")
      const releaseStage = ruler?.closest("section")?.firstElementChild
      const rulerBounds = ruler?.getBoundingClientRect(), releaseBounds = releaseStage?.getBoundingClientRect()
      geometry.startX = rulerBounds && releaseBounds ? rulerBounds.right - releaseBounds.left : geometry.width - geometry.gutter
      geometry.startY = rulerBounds && releaseBounds ? rulerBounds.top - releaseBounds.top + rulerBounds.height / 2 : geometry.height * .94
      const dot = period.getBoundingClientRect(), bounds = stage.getBoundingClientRect()
      geometry.targetX = dot.left - bounds.left + dot.width / 2 - Number(gsap.getProperty(heading, "x"))
      geometry.targetY = dot.top - bounds.top + dot.height / 2 - Number(gsap.getProperty(panel, "y"))
      geometry.targetSize = dot.width
    }
    const updateRange = (travelled: number) => {
      let first = cards.findIndex((_, position) => offsets[position] + geometry.cardWidth > travelled + 1)
      if (first < 0) first = 0
      let last = first
      for (let position = first; position < cards.length; position++) {
        if (offsets[position] < travelled + geometry.contentWidth - 1) last = position
      }
      const next = { start: first, end: cards.length ? last + 1 : 0, atStart: travelled <= 1, atEnd: travelled >= geometry.travel - 1 }
      setRange(previous => previous.start === next.start && previous.end === next.end && previous.atStart === next.atStart && previous.atEnd === next.atEnd ? previous : next)
      stage.style.setProperty("--artist-travel", String(geometry.travel ? travelled / geometry.travel : 0))
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced)
      measure()
      if (reduced) {
        gsap.set(panel, { clipPath: "none" })
        gsap.set(connector, { opacity: 0 })
        const update = () => updateRange(viewport.scrollLeft)
        renderCurrent = update
        viewport.addEventListener("scroll", update, { passive: true })
        moveGallery.current = direction => viewport.scrollBy({ left: direction * geometry.contentWidth, behavior: "instant" })
        ScrollTrigger.create({ trigger: section, start: () => `top top+=${geometry.headerHeight / 2}`, end: () => `bottom top+=${geometry.headerHeight / 2}`,
          onToggle: self => { if (header) header.dataset.artistTone = self.isActive ? "light" : "" },
          onRefresh: self => { if (header) header.dataset.artistTone = self.isActive ? "light" : "" },
        })
        update()
        return () => viewport.removeEventListener("scroll", update)
      }
      const clock = { progress: 0 }
      gsap.set(panel, { clipPath: "none", y: geometry.height })
      gsap.set([heading, index, identity, portrait], { opacity: 0 })
      gsap.set([heading, index], { x: 0 })
      gsap.set(portrait, { x: 0, y: 0, rotation: 0, scale: 1 })
      gsap.set(track, { x: 0 })
      gsap.set(connector, { x: 0, y: 0, opacity: 0, scale: 1 })
      gsap.set(period, { opacity: 0 })
      const panelY = gsap.quickSetter(panel, "y", "px")
      const headingX = gsap.quickSetter(heading, "x", "px"), headingOpacity = gsap.quickSetter(heading, "opacity")
      const indexX = gsap.quickSetter(index, "x", "px"), indexOpacity = gsap.quickSetter(index, "opacity")
      const identityOpacity = gsap.quickSetter(identity, "opacity")
      const portraitY = gsap.quickSetter(portrait, "y", "px"), portraitOpacity = gsap.quickSetter(portrait, "opacity")
      const trackX = gsap.quickSetter(track, "x", "px")
      const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px"), dotOpacity = gsap.quickSetter(connector, "opacity")
      const dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY")
      const periodOpacity = gsap.quickSetter(period, "opacity")
      const travelAt = () => clamp((clock.progress * geometry.range - geometry.intro) / (geometry.fullTravel * ARTIST_SCROLL_RATIO || 1)) * geometry.travel
      const goTo = (offset: number) => {
        const travelProgress = geometry.travel ? clamp(offset / geometry.travel) : 0
        window.scrollTo({ top: geometry.top + geometry.intro + travelProgress * geometry.fullTravel * ARTIST_SCROLL_RATIO, behavior: "instant" })
      }
      const render = () => {
        const reveal = clamp(clock.progress * geometry.range / geometry.intro)
        panelY(geometry.height * (1 - reveal))
        const titleProgress = clamp(reveal / .25)
        headingX(-36 * (1 - titleProgress)); headingOpacity(titleProgress)
        const indexProgress = clamp((reveal - .12) / .5)
        indexX(-24 * (1 - indexProgress)); indexOpacity(indexProgress)
        identityOpacity(clamp((reveal - .35) / .55))
        const portraitProgress = clamp((reveal - .12) / .85)
        portraitY(30 * (1 - portraitProgress)); portraitOpacity(clamp(reveal / .45))
        const travelled = travelAt()
        trackX(-travelled); updateRange(travelled)
        const t = reveal, inverse = 1 - t
        dotX(inverse ** 3 * geometry.startX + 3 * inverse ** 2 * t * (geometry.startX * .9 + geometry.targetX * .1) + 3 * inverse * t ** 2 * (geometry.targetX + geometry.width * .12) + t ** 3 * geometry.targetX)
        dotY(inverse ** 3 * geometry.startY + 3 * inverse ** 2 * t * geometry.height * .4 + (3 * inverse * t ** 2 + t ** 3) * geometry.targetY)
        dotOpacity(reveal > .001 && reveal < 1 ? 1 : 0)
        const scale = 1 + (geometry.targetSize / 10 - 1) * reveal
        dotScaleX(scale); dotScaleY(scale)
        periodOpacity(reveal >= 1 ? 1 : 0)
        stage.dataset.artistProgress = String(clock.progress)
        stage.dataset.artistTravel = String(travelled)
        if (header) header.dataset.artistBridge = String(reveal > 0 && reveal < 1)
      }
      renderCurrent = render
      const animation = gsap.to(clock, { progress: 1, duration: 1, ease: "none", paused: true, onUpdate: render })
      const trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: () => `+=${geometry.range}`, scrub: true, animation,
        onRefreshInit: measure, onRefresh: render, onToggle: render,
      })
      ScrollTrigger.create({ trigger: section,
        start: () => geometry.top + geometry.intro * (1 - geometry.headerHeight / 2 / geometry.height),
        end: () => `bottom top+=${geometry.headerHeight / 2}`,
        onToggle: self => { if (header) header.dataset.artistTone = self.isActive ? "light" : "" },
        onRefresh: self => { if (header) header.dataset.artistTone = self.isActive ? "light" : "" },
      })
      const focus = (event: FocusEvent) => {
        if (!(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")) return
        const card = event.target.closest<HTMLElement>("[data-artist-card]")
        const position = card ? cards.indexOf(card) : -1, travelled = travelAt()
        if (clock.progress * geometry.range < geometry.intro) { goTo(position >= 0 ? offsets[position] : 0); return }
        if (position >= 0 && (offsets[position] < travelled - 1 || offsets[position] + geometry.cardWidth > travelled + geometry.contentWidth + 1)) {
          goTo(offsets[position])
        }
      }
      panel.addEventListener("focusin", focus)
      moveGallery.current = direction => {
        const columns = Math.max(1, Math.floor((geometry.contentWidth + geometry.step - geometry.cardWidth) / geometry.step))
        goTo(travelAt() + direction * columns * geometry.step)
      }
      animation.progress(trigger.progress); render()
      return () => panel.removeEventListener("focusin", focus)
    })
    const schedule = () => {
      if (frame || disposed) return
      frame = requestAnimationFrame(() => { frame = 0; if (!disposed) { measure(); ScrollTrigger.refresh(); renderCurrent() } })
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(stage); observer.observe(heading); observer.observe(track)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); media.revert()
      section.style.removeProperty("height")
      moveGallery.current = () => undefined
      if (header) { delete header.dataset.artistTone; delete header.dataset.artistBridge }
    }
  }, { scope: sectionRef, dependencies: [artists], revertOnUpdate: true })

  return <>
    <section id="artists" ref={sectionRef} className={styles.section} aria-labelledby="cd-artists-title" aria-describedby="cd-artists-instructions" aria-busy={loading}>
      <p className={styles.srOnly} id="cd-artists-instructions">Scroll down to move horizontally through the artists. Use the arrow buttons or search to reach an artist directly. Select a portrait for details.</p>
      <div className={styles.stage} ref={stageRef} data-artist-stage>
        <div className={styles.panel} ref={panelRef} data-artist-panel>
          <GalleryAtmosphere />
          <div className={styles.heading} ref={titleRef} data-artist-heading><p className={styles.kicker}>The people behind the dots</p><h2 id="cd-artists-title">ARTISTS<span ref={titleDotRef} data-artist-handoff-dot aria-hidden="true">.</span></h2></div>
          <div className={styles.index} ref={indexRef}>
            <p className={styles.galleryInstruction}>Different minds. A shared frequency.<span>Choose a portrait to explore.</span></p>
            <label className={styles.search}><Search size={14} aria-hidden="true" /><span className={styles.srOnly}>Find an artist</span><input type="search" placeholder="Find an artist" value={query} onChange={event => setQuery(event.target.value)} /></label>
          </div>
          <div className={styles.gallery} ref={portraitEntryRef}>
            <div className={styles.galleryViewport} ref={galleryViewportRef}><ul ref={trackRef} className={styles.roster} aria-label="Label artists">{filtered.map(artist => <li key={artist.id} className={styles.artistCard} data-artist-card>
              <Portrait artist={artist} onOpen={openArtist} />
              <div className={styles.cardCaption}><span className={styles.cardNumber}>{String(artists.indexOf(artist) + 1).padStart(2, "0")}</span><h3>{artist.name}</h3><ArrowUpRight size={17} aria-hidden="true" /></div>
            </li>)}</ul></div>
            {loading && <p className={styles.empty} role="status">Gathering the artists…</p>}
            {!loading && !failed && !filtered.length && <p className={styles.empty} role="status">No artists found. Try another name.</p>}
            {!loading && failed && <p className={styles.empty} role="status">The roster is taking a moment. <button onClick={() => setLoadKey(value => value + 1)}>Try again</button></p>}
          </div>
          <div className={styles.footer} ref={identityRef}>
            <p className={styles.collectionCount}>{artists.length} artists<span>One collection.</span></p>
            <div className={styles.railProgress} aria-hidden="true"><span /></div>
            <div className={styles.pagination}><p role="status">{filtered.length ? `${String(range.start + 1).padStart(2, "0")}—${String(Math.min(filtered.length, range.end)).padStart(2, "0")} / ${String(filtered.length).padStart(2, "0")}` : "00 / 00"}</p><div><button disabled={range.atStart} onClick={() => moveGallery.current(-1)} aria-label="Previous artists"><ArrowLeft size={19} /></button><button disabled={range.atEnd || !filtered.length} onClick={() => moveGallery.current(1)} aria-label="More artists"><ArrowRight size={19} /></button></div></div>
          </div>
        </div>
        <span ref={connectorRef} className={styles.connector} aria-hidden="true" />
      </div>
    </section>
    {selection && <ArtistDetails selection={selection} onClose={() => setSelection(null)} />}
  </>
}

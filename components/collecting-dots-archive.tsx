"use client"

import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, ArrowUpRight, Play, Search, X } from "lucide-react"
import { ARCHIVE_CHANNEL, SAVED_RECORDINGS, featureRecordings, mapArchiveVideos, type ArchiveVideo } from "@/lib/archive"
import { buildApiUrl } from "@/lib/api"
import ArchivePlayer from "./archive-player"
import styles from "./collecting-dots-archive.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)
const clamp = gsap.utils.clamp(0, 1)
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
function thumbnailFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.src.includes("maxresdefault")) image.src = image.src.replace("maxresdefault", "hq720")
  else if (image.src.includes("hq720")) image.src = image.src.replace("hq720", "hqdefault")
}

export default function CollectingDotsArchive() {
  const sectionRef = useRef<HTMLElement>(null), stageRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<HTMLDivElement>(null), bridgeImageRef = useRef<HTMLImageElement>(null)
  const headingRef = useRef<HTMLDivElement>(null), contentRef = useRef<HTMLDivElement>(null), footerRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLButtonElement>(null), lightRef = useRef<HTMLSpanElement>(null), connectorRef = useRef<HTMLSpanElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null), dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const enterArchive = useRef<() => void>(() => undefined)
  const [videos, setVideos] = useState<ArchiveVideo[]>(SAVED_RECORDINGS)
  const [selectedId, setSelectedId] = useState("1zMYUk8E3Mw")
  const [saved, setSaved] = useState(false), [refreshing, setRefreshing] = useState(true), [loadKey, setLoadKey] = useState(0)
  const [mode, setMode] = useState<"library" | "player" | null>(null)
  const [playing, setPlaying] = useState<ArchiveVideo | null>(null)
  const [query, setQuery] = useState("")
  const featured = useMemo(() => featureRecordings(videos), [videos])
  const selected = videos.find(video => video.id === selectedId) || featured[0]
  const listed = useMemo(() => videos.filter(video => `${video.title} ${video.location}`.toLowerCase().includes(query.trim().toLowerCase())), [videos, query])

  useEffect(() => {
    const controller = new AbortController()
    setRefreshing(true)
    fetch(buildApiUrl("/api/get-youtube-videos"), { signal: controller.signal }).then(async response => {
      const result = await response.json()
      if (!response.ok || !result.success || !Array.isArray(result.data?.videos)) throw new Error("Archive unavailable")
      const recordings = mapArchiveVideos(result.data.videos)
      if (!recordings.length) throw new Error("Archive unavailable")
      setVideos(recordings); setSaved(result.data.source === "saved")
    }).catch(() => { if (!controller.signal.aborted) setSaved(true) })
      .finally(() => { if (!controller.signal.aborted) setRefreshing(false) })
    return () => controller.abort()
  }, [loadKey])

  const open = mode !== null
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const body = document.body, before = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gutter = window.innerWidth - document.documentElement.clientWidth
    if (gutter > 0) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + gutter}px`
    body.style.overflow = "hidden"; dialog.showModal()
    return () => { dialog.close(); body.style.overflow = before.overflow; body.style.paddingRight = before.paddingRight }
  }, [open])
  useEffect(() => { if (open) dialogTitleRef.current?.focus({ preventScroll: true }) }, [mode, open, playing?.id])

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, bridge = bridgeRef.current
    const heading = headingRef.current, content = contentRef.current, footer = footerRef.current
    const frame = frameRef.current, light = lightRef.current, connector = connectorRef.current
    if (!section || !stage || !bridge || !heading || !content || !footer || !frame || !light || !connector) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const source = document.querySelector<HTMLElement>("[data-event-handoff-dot]")
    const geometry = { width: 1, height: 1, top: 0, range: 1, intro: 1, left: 0, right: 0, bottom: 0, frameTop: 0, sourceX: 0, sourceY: 0, sourceSize: 10, targetX: 0, targetY: 0, targetSize: 6 }
    let reduced = false, disposed = false, refreshFrame = 0
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.intro = geometry.height * .96; geometry.range = geometry.intro + geometry.height * .12
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      const bounds = stage.getBoundingClientRect(), target = frame.getBoundingClientRect(), lamp = light.getBoundingClientRect()
      geometry.left = target.left - bounds.left; geometry.right = bounds.right - target.right
      geometry.frameTop = target.top - bounds.top; geometry.bottom = bounds.bottom - target.bottom
      geometry.targetX = lamp.left - bounds.left + lamp.width / 2; geometry.targetY = lamp.top - bounds.top + lamp.height / 2
      geometry.targetSize = lamp.width
      const origin = source?.getBoundingClientRect(), eventStage = source?.closest<HTMLElement>("[data-event-stage]")
      const eventBounds = eventStage?.getBoundingClientRect(), eventHeading = source?.closest<HTMLElement>("[data-event-heading]")
      geometry.sourceX = origin && eventBounds ? origin.left - eventBounds.left + origin.width / 2 : geometry.width * .25
      geometry.sourceY = origin && eventBounds ? origin.top - eventBounds.top + origin.height / 2 - (eventHeading ? Number(gsap.getProperty(eventHeading, "y")) || 0 : 0) : geometry.height * .2
      geometry.sourceSize = origin?.width || 10
      const photo = eventStage?.querySelector<HTMLImageElement>("[data-event-photo]:last-child img")
      if (photo && bridgeImageRef.current) {
        const url = photo.currentSrc || photo.src
        if (bridgeImageRef.current.src !== url) bridgeImageRef.current.src = url
        bridgeImageRef.current.style.objectPosition = photo.style.objectPosition || "50% 50%"
      }
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced); measure()
      if (reduced) {
        if (source) delete source.dataset.archiveDeparted
        gsap.set(connector, { opacity: 0 }); stage.dataset.archiveReady = "true"
        enterArchive.current = () => undefined
      } else {
        const clock = { progress: 0 }
        const bridgeOpacity = gsap.quickSetter(bridge, "opacity"), bridgeClip = gsap.quickSetter(bridge, "clipPath")
        const headingOpacity = gsap.quickSetter(heading, "opacity"), headingY = gsap.quickSetter(heading, "y", "px")
        const contentOpacity = gsap.quickSetter(content, "opacity"), footerOpacity = gsap.quickSetter(footer, "opacity")
        const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px"), dotOpacity = gsap.quickSetter(connector, "opacity")
        const dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY"), lightOpacity = gsap.quickSetter(light, "opacity")
        const render = () => {
          const intro = clamp(clock.progress * geometry.range / geometry.intro), collapse = smooth(intro / .82)
          stage.style.setProperty("--archive-entry", String(clamp(intro / .32)))
          bridgeClip(`inset(${geometry.frameTop * collapse}px ${geometry.right * collapse}px ${geometry.bottom * collapse}px ${geometry.left * collapse}px)`)
          bridgeOpacity(intro > 0 ? 1 - clamp((intro - .62) / .3) : 0)
          const text = clamp((intro - .28) / .42)
          headingOpacity(text); headingY(22 * (1 - text))
          contentOpacity(clamp((intro - .52) / .4)); footerOpacity(clamp((intro - .72) / .28))
          const t = clamp(intro / .92), inverse = 1 - t
          dotX(inverse ** 3 * geometry.sourceX + 3 * inverse ** 2 * t * geometry.width * .5 + 3 * inverse * t ** 2 * geometry.width * .18 + t ** 3 * geometry.targetX)
          dotY(inverse ** 3 * geometry.sourceY + 3 * inverse ** 2 * t * geometry.height * .34 + 3 * inverse * t ** 2 * geometry.height * .4 + t ** 3 * geometry.targetY)
          const scale = (geometry.sourceSize + (geometry.targetSize - geometry.sourceSize) * t) / 10
          dotScaleX(scale); dotScaleY(scale); dotOpacity(t > 0 && t < 1 ? 1 : 0); lightOpacity(t >= 1 ? 1 : 0)
          if (source) source.dataset.archiveDeparted = String(intro > 0)
          stage.dataset.archiveReady = String(intro >= .99)
          stage.dataset.archiveProgress = String(clock.progress)
        }
        const animation = gsap.to(clock, { progress: 1, duration: 1, ease: "none", paused: true, onUpdate: render })
        const trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: () => `+=${geometry.range}`, animation, scrub: true, onRefreshInit: measure, onRefresh: render, onToggle: render })
        enterArchive.current = () => window.scrollTo({ top: geometry.top + geometry.intro, behavior: "instant" })
        const focus = (event: FocusEvent) => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && clock.progress * geometry.range < geometry.intro) enterArchive.current() }
        stage.addEventListener("focusin", focus)
        animation.progress(trigger.progress); render()
        context.add(() => () => stage.removeEventListener("focusin", focus))
      }
      ScrollTrigger.create({ trigger: section, start: () => geometry.top + geometry.intro * .3, end: "bottom top+=40",
        onToggle: self => { if (header) header.dataset.archiveTone = self.isActive ? "dark" : "" },
        onRefresh: self => { if (header) header.dataset.archiveTone = self.isActive ? "dark" : "" },
      })
    })
    const schedule = () => { if (disposed || refreshFrame) return; refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) { measure(); ScrollTrigger.refresh() } }) }
    const observer = new ResizeObserver(schedule); observer.observe(stage); observer.observe(frame)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame); observer.disconnect(); media.revert(); section.style.removeProperty("height")
      enterArchive.current = () => undefined
      if (source) delete source.dataset.archiveDeparted
      if (header) delete header.dataset.archiveTone
    }
  }, { scope: sectionRef })

  // Upstream Spotify/artist feeds change their scroll ranges after hydration.
  // Resolve an initial archive deep link once that layout is ready; never pull
  // someone back after they have started navigating the page themselves.
  useEffect(() => {
    if (window.location.hash !== "#sets") return
    let cancelled = false, completed = false, fontsReady = false, first = 0, second = 0
    const upstream = ["releases", "artists", "events"].map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const cancel = () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(first); cancelAnimationFrame(second) }
    const settle = () => {
      if (cancelled || completed || !fontsReady || upstream.some(node => node.getAttribute("aria-busy") === "true")) return
      cancelAnimationFrame(first); cancelAnimationFrame(second)
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (cancelled || completed || !section || window.location.hash !== "#sets") return
        completed = true; observer.disconnect(); ScrollTrigger.refresh()
        const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0
        window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - margin, behavior: "instant" })
      }) })
    }
    const observer = new MutationObserver(settle)
    upstream.forEach(node => observer.observe(node, { attributes: true, attributeFilter: ["aria-busy"] }))
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    inputs.forEach(type => window.addEventListener(type, cancel, { once: true, passive: true }))
    void document.fonts.ready.then(() => { fontsReady = true; settle() })
    return () => { cancel(); inputs.forEach(type => window.removeEventListener(type, cancel)) }
  }, [])

  function watch(video: ArchiveVideo) { setPlaying(video); setMode("player") }
  function poster(video: ArchiveVideo, small = false) { return <img src={video.thumbnail} alt={small ? "" : `YouTube cover for ${video.title}`} loading="lazy" decoding="async" width="1280" height="720" onError={thumbnailFallback} draggable={false} /> }

  return <>
    <section id="sets" ref={sectionRef} className={styles.section} aria-labelledby="cd-archive-title">
      <div ref={stageRef} className={styles.stage} data-archive-stage>
        <div className={styles.matte} />
        <div className={styles.bridge} ref={bridgeRef} aria-hidden="true"><img ref={bridgeImageRef} src="/media/events/cape-dusk-2048.webp" alt="" loading="lazy" width="2048" height="3072" /></div>
        <div className={styles.heading} ref={headingRef}><div><p className={styles.kicker}>The recordings</p><h2 id="cd-archive-title" aria-label="Collecting Dots Media Archive">MEDIA ARCHIVE</h2></div><p className={styles.introduction}>Live sets from<br />the DOT family.</p></div>
        <div className={styles.content} ref={contentRef}>
          <div className={styles.screenColumn}>
            <div className={styles.screenChrome}><span><i ref={lightRef} aria-hidden="true" data-archive-handoff-dot />On record</span><span>Collecting Dots / {String(videos.length).padStart(2, "0")} recordings</span></div>
            {selected && <><button className={styles.screen} ref={frameRef} onClick={() => watch(selected)} aria-label={`Play ${selected.title}`} data-archive-screen>{poster(selected)}<span className={styles.screenShade} /><span className={styles.play}><Play size={22} fill="currentColor" /><span>Watch the full set</span></span><span className={styles.frameCorner} aria-hidden="true" /><span className={styles.screenDuration}>{selected.duration || "Full recording"}</span></button><div className={styles.screenCaption}><p>{selected.artist}<span>{selected.chapter}</span></p><span>{selected.location}</span></div></>}
          </div>
          <div className={styles.index}><p className={styles.indexLabel}>Select a recording<span>01 — {String(featured.length).padStart(2, "0")}</span></p><div className={styles.recordings} aria-label="Featured recordings">{featured.map((video, index) => <button key={video.id} aria-pressed={selected?.id === video.id} aria-label={`Select ${video.title}`} onClick={() => setSelectedId(video.id)}><span className={styles.recordNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.miniature}>{poster(video, true)}</span><span className={styles.recordTitle}>{video.artist}<span>{video.chapter}</span><small>{video.location}</small></span><ArrowUpRight size={17} /></button>)}</div></div>
        </div>
        <footer className={styles.footer} ref={footerRef}><p>The moments pass.<br /><span>The music stays.</span></p><div className={styles.feedStatus} role="status">{refreshing ? "Updating the collection…" : saved ? <>Saved selection<button onClick={() => setLoadKey(value => value + 1)}>Refresh</button></> : "From our YouTube channel"}</div><button onClick={() => { setQuery(""); setMode("library") }}>All recordings<span>({videos.length})</span><ArrowUpRight size={17} /></button></footer>
        <span className={styles.connector} ref={connectorRef} aria-hidden="true" data-archive-connector />
      </div>
    </section>
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="cd-archive-dialog-title" onClose={() => { setMode(null); setPlaying(null) }}>
      <header className={styles.dialogHeader}><div><p className={styles.kicker}>Collecting Dots Records</p><h2 id="cd-archive-dialog-title" ref={dialogTitleRef} tabIndex={-1}>{mode === "player" && playing ? playing.artist : "THE RECORDINGS"}</h2></div><button onClick={() => dialogRef.current?.close()} aria-label="Close media archive" autoFocus><X size={24} /></button></header>
      {mode === "player" && playing ? <><button className={styles.back} onClick={() => setMode("library")}><ArrowLeft size={16} />All recordings</button><ArchivePlayer key={playing.id} video={playing} /></> : <><div className={styles.libraryTools}><label><Search size={17} /><span className={styles.srOnly}>Search recordings</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Artist, recording or place" type="search" /></label><a href={ARCHIVE_CHANNEL} target="_blank" rel="noopener noreferrer">YouTube channel<ArrowUpRight size={17} /></a></div><p className={styles.resultCount}>{listed.length} {listed.length === 1 ? "recording" : "recordings"}</p><div className={styles.library}>{listed.map(video => <button key={video.id} onClick={() => watch(video)} aria-label={`Play ${video.title}`}><span className={styles.libraryImage}>{poster(video)}<i><Play size={22} fill="currentColor" /></i><span>{video.duration}</span></span><strong>{video.artist}</strong><span>{video.chapter}</span><small>{video.location}</small></button>)}</div>{!listed.length && <p className={styles.noResults}>No recordings match that search.<button onClick={() => setQuery("")}>Clear search</button></p>}</>}
    </dialog>
  </>
}

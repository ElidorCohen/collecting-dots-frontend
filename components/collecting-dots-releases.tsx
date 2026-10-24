"use client"

import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Pause, Play, Search, Share2, X } from "lucide-react"
import { fetchLabelReleases, selectFeaturedReleases, LABEL_PLAYLIST, type LabelRelease } from "@/lib/releases"
import styles from "./collecting-dots-releases.module.css"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function CollectingDotsReleases({ preview = false }: { preview?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<HTMLSpanElement>(null)
  const titleDotRef = useRef<HTMLSpanElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playRequest = useRef(0)
  const moveTo = useRef<(index: number) => void>(() => undefined)
  const revealFocus = useRef<(index: number) => void>(() => undefined)
  const [releases, setReleases] = useState<LabelRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [loadKey, setLoadKey] = useState(0)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [notice, setNotice] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [catalogueOpen, setCatalogueOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selected = selectFeaturedReleases(releases)
  const search = query.trim().toLocaleLowerCase()
  const catalogue = releases.filter(release => `${release.title} ${release.artist} ${release.albumTitle}`.toLocaleLowerCase().includes(search))

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)
    fetchLabelReleases(controller.signal).then(setReleases).catch(() => {
      if (!controller.signal.aborted) setFailed(true)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [loadKey])

  useEffect(() => {
    if (!catalogueOpen) return
    const body = document.body
    const original = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gutter = window.innerWidth - document.documentElement.clientWidth
    const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0
    // Keep the rail's measured width stable while the modal locks page scrolling.
    body.style.overflow = "hidden"
    if (gutter > 0) body.style.paddingRight = `${padding + gutter}px`
    return () => { body.style.overflow = original.overflow; body.style.paddingRight = original.paddingRight }
  }, [catalogueOpen])

  useEffect(() => {
    const audio = audioRef.current
    return () => { ++playRequest.current; audio?.pause() }
  }, [])

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, panel = panelRef.current
    const viewport = viewportRef.current, track = trackRef.current
    if (!section || !stage || !panel || !viewport || !track) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-release-card]"))
    const heading = panel.querySelector<HTMLElement>("[data-release-heading]")
    const connector = connectorRef.current, period = titleDotRef.current
    const source = document.querySelector<HTMLElement>("[data-story-handoff-dot]")
    const geometry = { startX: 0, startY: 0, startSize: 7, targetX: 0, targetY: 0, targetSize: 10, width: 1, height: 1, travel: 0, intro: 1, distance: 1, top: 0, offsets: [] as number[], cardWidth: 1, gutter: 24 }
    let trigger: ScrollTrigger | undefined
    let frame = 0, disposed = false, reduced = false, lastActive = -1
    const measure = () => {
      geometry.width = stage.clientWidth
      geometry.height = stage.clientHeight
      geometry.gutter = Number.parseFloat(getComputedStyle(track).paddingLeft) || 24
      geometry.offsets = cards.map(card => card.offsetLeft - geometry.gutter)
      geometry.cardWidth = cards[0]?.offsetWidth || 1
      geometry.travel = Math.max(0, track.scrollWidth - viewport.clientWidth)
      geometry.intro = geometry.height * 0.85
      geometry.distance = geometry.intro + geometry.travel * 0.95 + geometry.height * 0.22
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.distance}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      // Measure within the settled About composition, independent of its sticky stage's current offset.
      const sourceBounds = source?.getBoundingClientRect(), storyBounds = source?.closest("[data-label-story]")?.getBoundingClientRect()
      if (sourceBounds && storyBounds) {
        geometry.startX = sourceBounds.left - storyBounds.left + sourceBounds.width / 2
        geometry.startY = sourceBounds.top - storyBounds.top + sourceBounds.height / 2
        geometry.startSize = sourceBounds.width
      }
      const target = period?.getBoundingClientRect(), stageBounds = stage.getBoundingClientRect()
      if (target) {
        geometry.targetX = target.left - stageBounds.left + target.width / 2 - (heading ? Number(gsap.getProperty(heading, "x")) || 0 : 0)
        geometry.targetY = target.top - stageBounds.top + target.height / 2
        geometry.targetSize = target.width
      }
    }
    const clamp = gsap.utils.clamp(0, 1)
    const updateActive = (progress: number) => {
      const last = Math.max(0, cards.length - 1)
      // Account for subpixel scroll rounding without disabling Next early.
      const tolerance = last * 0.75 / Math.max(1, geometry.travel)
      const index = Math.min(last, Math.floor(clamp(progress) * last + tolerance))
      if (index !== lastActive) { lastActive = index; setActive(index) }
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced)
      measure()
      if (reduced) {
        if (connector) gsap.set(connector, { opacity: 0 })
        gsap.set(panel, { clipPath: "none" })
        moveTo.current = index => viewport.scrollTo({ left: index / Math.max(1, cards.length - 1) * geometry.travel, behavior: "instant" })
        revealFocus.current = () => undefined
        const update = () => {
          const progress = geometry.travel ? viewport.scrollLeft / geometry.travel : 0
          updateActive(progress)
          stage.style.setProperty("--catalogue-progress", String(progress))
        }
        viewport.addEventListener("scroll", update, { passive: true })
        return () => viewport.removeEventListener("scroll", update)
      }
      const clock = { progress: 0 }
      const handoff = Boolean(source && connector && period)
      if (source) gsap.set(source, { opacity: 1 })
      if (period) gsap.set(period, { opacity: 1 })
      if (connector) gsap.set(connector, { x: 0, y: 0, scale: 1, opacity: 0 })
      const sourceOpacity = source ? gsap.quickSetter(source, "opacity") : () => undefined
      const periodOpacity = period ? gsap.quickSetter(period, "opacity") : () => undefined
      const dotX = connector ? gsap.quickSetter(connector, "x", "px") : () => undefined
      const dotY = connector ? gsap.quickSetter(connector, "y", "px") : () => undefined
      const dotScaleX = connector ? gsap.quickSetter(connector, "scaleX") : () => undefined
      const dotScaleY = connector ? gsap.quickSetter(connector, "scaleY") : () => undefined
      const dotOpacity = connector ? gsap.quickSetter(connector, "opacity") : () => undefined
      gsap.set(panel, { clipPath: "inset(0% 0% 0% 100%)" })
      gsap.set(track, { x: 0 })
      if (heading) gsap.set(heading, { x: 0, opacity: 0 })
      const setClip = gsap.quickSetter(panel, "clipPath")
      const setTrackX = gsap.quickSetter(track, "x", "px")
      const setHeadingX = heading ? gsap.quickSetter(heading, "x", "px") : () => undefined
      const setHeadingOpacity = heading ? gsap.quickSetter(heading, "opacity") : () => undefined
      const render = () => {
        const distance = clock.progress * geometry.distance
        const intro = clamp(distance / geometry.intro)
        const travel = clamp((distance - geometry.intro) / (geometry.travel * 0.95 || 1))
        setClip(`inset(0% 0% 0% ${100 * (1 - intro)}%)`)
        setTrackX(intro < 1 ? geometry.width * 0.18 * (1 - intro) : -geometry.travel * travel)
        const headingProgress = clamp(intro / 0.8)
        setHeadingX(geometry.width * 0.09 * (1 - headingProgress))
        setHeadingOpacity(headingProgress)
        if (handoff) {
          const t = intro, inverse = 1 - t
          dotX(inverse ** 3 * geometry.startX + 3 * inverse ** 2 * t * (geometry.startX + geometry.width * .45) + 3 * inverse * t ** 2 * (geometry.targetX + geometry.width * .12) + t ** 3 * geometry.targetX)
          dotY(inverse ** 3 * geometry.startY + 3 * inverse ** 2 * t * (geometry.startY + geometry.height * .08) + 3 * inverse * t ** 2 * (geometry.targetY + geometry.height * .23) + t ** 3 * geometry.targetY)
          const scale = (geometry.startSize + (geometry.targetSize - geometry.startSize) * t) / 10
          dotScaleX(scale); dotScaleY(scale)
          dotOpacity(intro > 0 && intro < 1 ? 1 : 0)
          sourceOpacity(intro > 0 ? 0 : 1)
          periodOpacity(intro >= 1 ? 1 : 0)
        }
        updateActive(travel)
        stage.style.setProperty("--catalogue-progress", String(travel))
        stage.dataset.releaseProgress = String(clock.progress)
        panel.dataset.bridging = String(intro > 0 && intro < 1)
        if (header) header.dataset.releaseBridge = String(Boolean(trigger?.isActive))
      }
      // A normalized clock keeps resize geometry independent of animation duration.
      const timeline = gsap.to(clock, { progress: 1, duration: 1, paused: true, ease: "none", onUpdate: render })
      trigger = ScrollTrigger.create({
        trigger: section, animation: timeline, start: "top top", end: () => `+=${geometry.distance}`,
        scrub: true, invalidateOnRefresh: true, onRefreshInit: measure, onRefresh: render,
        onToggle: render,
      })
      const focusPanel = () => {
        if (clock.progress * geometry.distance < geometry.intro) {
          window.scrollTo({ top: geometry.top + geometry.intro, behavior: "instant" })
        }
      }
      panel.addEventListener("focusin", focusPanel)
      moveTo.current = index => {
        const offset = clamp(index / Math.max(1, cards.length - 1)) * geometry.travel
        window.scrollTo({ top: geometry.top + geometry.intro + offset * 0.95, behavior: "instant" })
      }
      revealFocus.current = index => {
        const distance = clock.progress * geometry.distance
        const travelled = clamp((distance - geometry.intro) / (geometry.travel * 0.95 || 1)) * geometry.travel
        const offset = Math.min(geometry.travel, Math.max(0, geometry.offsets[index] || 0))
        const left = (geometry.offsets[index] || 0) - travelled + geometry.gutter
        if (distance < geometry.intro || left < geometry.gutter - 1 || left + geometry.cardWidth > geometry.width - geometry.gutter + 1) {
          window.scrollTo({ top: geometry.top + geometry.intro + offset * 0.95, behavior: "instant" })
        }
      }
      timeline.progress(trigger.progress)
      render()
      return () => { trigger = undefined; panel.removeEventListener("focusin", focusPanel); if (header) delete header.dataset.releaseBridge }
    })
    const refresh = () => {
      frame = 0
      if (!disposed) { measure(); ScrollTrigger.refresh() }
    }
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(refresh) }
    const observer = new ResizeObserver(schedule)
    observer.observe(stage)
    observer.observe(track)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      media.revert()
      section.style.removeProperty("height")
      if (header) delete header.dataset.releaseBridge
      moveTo.current = revealFocus.current = () => undefined
    }
  }, { scope: sectionRef, dependencies: [releases], revertOnUpdate: true })

  async function playPreview(release: LabelRelease) {
    const audio = audioRef.current
    if (!audio || !release.previewUrl) return
    setNotice("")
    const request = ++playRequest.current
    if (playing === release.id) { audio.pause(); setPlaying(null); return }
    audio.pause()
    audio.src = release.previewUrl
    setAudioProgress(0)
    setPlaying(release.id)
    try { await audio.play() } catch {
      if (request === playRequest.current) { setPlaying(null); setNotice("Preview unavailable. You can listen on Spotify.") }
    }
  }

  async function shareRelease(release: LabelRelease) {
    try {
      if (navigator.share) await navigator.share({ title: `${release.title} — ${release.artist}`, url: release.url })
      else { await navigator.clipboard.writeText(release.url); setCopied(release.id) }
    } catch { /* Cancelling the native share sheet leaves the section unchanged. */ }
  }

  function openCatalogue() { dialogRef.current?.showModal(); setCatalogueOpen(true) }
  function closeCatalogue() { dialogRef.current?.close() }

  function record(release: LabelRelease, index: number, rail: boolean) {
    return <article className={styles.record} key={release.id} data-release-card={rail ? "" : undefined} onFocus={rail ? () => revealFocus.current(index) : undefined}>
      <a className={styles.artwork} href={release.url} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${release.title} by ${release.artist} on Spotify`}>
        <img src={release.artwork} srcSet={release.artworkSet || undefined} sizes={rail ? "(max-width: 899px) 72vw, 33vw" : "(max-width: 600px) 80vw, 25vw"} width="640" height="640" alt={`${release.title} — ${release.artist}`} loading="lazy" decoding="async" />
        <span className={styles.artworkLink} aria-hidden="true"><ArrowUpRight size={18} /></span>
      </a>
      <div className={styles.recordHeading}><h3>{release.title}</h3><span>{release.year}</span></div>
      <p className={styles.artist}>{release.artist}</p>
      <div className={styles.recordActions}>
        {release.previewUrl ? <button className={styles.preview} onClick={() => playPreview(release)} aria-label={`${playing === release.id ? "Pause" : "Play"} preview of ${release.title}`}>
          <span className={styles.playDot}>{playing === release.id ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}</span>
          {playing === release.id ? "Pause" : "Preview"}
        </button> : <a className={styles.preview} href={release.url} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${release.title} on Spotify`}>Listen on Spotify <ArrowUpRight size={12} /></a>}
        <span className={styles.duration}>{release.duration}</span>
        <button className={styles.share} onClick={() => shareRelease(release)} aria-label={`Share ${release.title}`}>{copied === release.id ? <Check size={15} /> : <Share2 size={15} />}</button>
      </div>
      <div className={styles.audioProgress} aria-hidden="true"><span style={{ transform: `scaleX(${playing === release.id ? audioProgress : 0})` }} /></div>
    </article>
  }

  return <>
    <section id="releases" ref={sectionRef} className={styles.section} aria-labelledby="cd-releases-title" aria-describedby="cd-release-instructions" aria-busy={loading}>
      <div ref={stageRef} className={styles.stage}>
        <div ref={panelRef} className={styles.panel}>
          <div className={styles.masthead} data-release-heading>
            <div><p className={styles.kicker}>The latest from Collecting Dots</p><h2 id="cd-releases-title">RELEASES<span className={styles.titleDot} ref={titleDotRef} aria-hidden="true">.</span></h2></div>
            <a className={styles.spotify} href={LABEL_PLAYLIST} target="_blank" rel="noopener noreferrer">Listen on Spotify <ArrowUpRight size={16} /></a>
          </div>
          <p className={styles.srOnly} id="cd-release-instructions">Scroll down to move through the records horizontally. Use the arrow buttons or open the full catalogue to browse every release.</p>
          <div ref={viewportRef} className={styles.viewport}>
            <div ref={trackRef} className={styles.track}>{selected.map((release, index) => record(release, index, true))}</div>
            {loading && <p className={styles.state} role="status">Loading the catalogue…</p>}
            {!loading && (failed || !selected.length) && <div className={styles.state}><p>{failed ? "The catalogue is taking a moment." : releases.length ? "Explore the complete catalogue on Spotify." : "New releases are on their way."}</p><a href={LABEL_PLAYLIST} target="_blank" rel="noopener noreferrer">Explore on Spotify <ArrowUpRight size={16} /></a>{failed && <button onClick={() => setLoadKey(key => key + 1)}>Try again</button>}</div>}
          </div>
          <footer className={styles.footer}>
            <span className={styles.position}>{String(selected.length ? active + 1 : 0).padStart(2, "0")}<span> / {String(selected.length).padStart(2, "0")}</span></span>
            <div className={styles.ruler} data-release-ruler aria-hidden="true"><span /></div>
            <button className={styles.catalogueButton} disabled={!releases.length} onClick={openCatalogue}>View all releases <span>({releases.length})</span><ArrowUpRight size={16} /></button>
            <div className={styles.arrows}><button disabled={!selected.length || active === 0} onClick={() => moveTo.current(active - 1)} aria-label="Previous release"><ArrowLeft size={20} /></button><button disabled={!selected.length || active === selected.length - 1} onClick={() => moveTo.current(active + 1)} aria-label="Next release"><ArrowRight size={20} /></button></div>
            <a className={styles.nextChapter} href="#artists">Artists <ArrowRight size={16} /></a>
          </footer>
          <p className={styles.notice} role="status">{notice || (copied ? "Release link copied." : "")}</p>
        </div>
        <span className={styles.connector} ref={connectorRef} data-about-release-dot aria-hidden="true" />
      </div>
    </section>
    <dialog ref={dialogRef} className={styles.catalogue} aria-labelledby="cd-catalogue-title" onClose={() => setCatalogueOpen(false)}>
      <header className={styles.catalogueHeader}><div><p className={styles.kicker}>Collecting Dots Records</p><h2 id="cd-catalogue-title">THE CATALOGUE<span>.</span></h2></div><button onClick={closeCatalogue} aria-label="Close catalogue"><X size={24} /></button></header>
      <div className={styles.catalogueTools}><label className={styles.search}><Search size={18} aria-hidden="true" /><span className={styles.srOnly}>Search releases or artists</span><input type="search" placeholder="Search a release or artist" value={query} onChange={event => setQuery(event.target.value)} /></label><span role="status">{catalogue.length} {catalogue.length === 1 ? "track" : "tracks"} · Newest first</span></div>
      <div className={styles.catalogueGrid}>{catalogue.map((release, index) => record(release, index, false))}</div>
      {!catalogue.length && <p className={styles.emptySearch}>No releases found. Try a different title or artist.</p>}
      <a className={styles.catalogueSpotify} href={LABEL_PLAYLIST} target="_blank" rel="noopener noreferrer">Open the complete playlist on Spotify <ArrowUpRight size={16} /></a>
    </dialog>
    <audio ref={audioRef} preload="none" onEnded={() => { setPlaying(null); setAudioProgress(0) }} onTimeUpdate={() => { const audio = audioRef.current; if (audio?.duration) setAudioProgress(audio.currentTime / audio.duration) }} onError={() => { setPlaying(null); setNotice("Preview unavailable. You can listen on Spotify.") }} />
  </>
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, ArrowUpRight, X } from "lucide-react"
import { buildApiUrl } from "@/lib/api"
import { EVENT_BACKDROPS, MOCK_EVENTS, featuredEvents, mapLabelEvents, partitionEvents, type LabelEvent } from "@/lib/events"
import styles from "./collecting-dots-events.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)
const clamp = gsap.utils.clamp(0, 1)

export default function CollectingDotsEvents({ mock = false }: { mock?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null)
  const connectorRef = useRef<HTMLSpanElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const darkRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const programmeTitleRef = useRef<HTMLHeadingElement>(null)
  const moveTo = useRef<(index: number) => void>(() => undefined)
  const [events, setEvents] = useState<LabelEvent[]>(mock ? MOCK_EVENTS : [])
  const [mocked, setMocked] = useState(mock)
  const [loading, setLoading] = useState(!mock)
  const [failed, setFailed] = useState(false)
  const [loadKey, setLoadKey] = useState(0)
  const [active, setActive] = useState(0)
  const [reducedMode, setReducedMode] = useState(false)
  const [programmeOpen, setProgrammeOpen] = useState(false)
  const [programmeTab, setProgrammeTab] = useState<"upcoming" | "past">("upcoming")
  const [detailId, setDetailId] = useState<string | null>(null)
  const programme = useMemo(() => partitionEvents(events), [events])
  const featured = useMemo(() => featuredEvents(events), [events])
  const detail = events.find(event => event.id === detailId)
  const listed = programme[programmeTab]
  const current = Math.min(active, Math.max(0, featured.length - 1))

  useEffect(() => {
    const controller = new AbortController()
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
    if (mock || local) { setMocked(true); setEvents(MOCK_EVENTS); setLoading(false); return () => controller.abort() }
    setMocked(false); setLoading(true); setFailed(false)
    fetch(buildApiUrl("/api/get-events-data"), { signal: controller.signal }).then(async response => {
      const result = await response.json()
      if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error("Events unavailable")
      setEvents(mapLabelEvents(result.data))
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [mock, loadKey])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!programmeOpen || !dialog) return
    const body = document.body, before = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gutter = window.innerWidth - document.documentElement.clientWidth
    const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0
    body.style.overflow = "hidden"
    if (gutter > 0) body.style.paddingRight = `${padding + gutter}px`
    dialog.showModal()
    return () => { dialog.close(); body.style.overflow = before.overflow; body.style.paddingRight = before.paddingRight }
  }, [programmeOpen])

  useEffect(() => {
    if (programmeOpen) programmeTitleRef.current?.focus({ preventScroll: true })
  }, [detailId, programmeOpen])

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, heading = headingRef.current
    const left = leftRef.current, right = rightRef.current, dark = darkRef.current, footer = footerRef.current
    const period = periodRef.current, connector = connectorRef.current
    if (!section || !stage || !heading || !left || !right || !dark || !footer || !period || !connector) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const source = document.querySelector<HTMLElement>("[data-artist-handoff-dot]")
    const tickets = Array.from(stage.querySelectorAll<HTMLElement>("[data-event-ticket]"))
    const cities = Array.from(stage.querySelectorAll<HTMLElement>("[data-event-city]"))
    const photos = Array.from(stage.querySelectorAll<HTMLElement>("[data-event-photo]"))
    const geometry = { width: 1, height: 1, top: 0, intro: 1, step: 1, range: 1, sourceX: 0, sourceY: 0, sourceSize: 10, targetX: 0, targetY: 0, targetSize: 10, headerHeight: 80 }
    let disposed = false, refreshFrame = 0, reduced = false, lastActive = -1
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.intro = geometry.height * .78; geometry.step = geometry.height * .72
      geometry.range = geometry.intro + Math.max(0, tickets.length - 1) * geometry.step + geometry.height * .16
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      geometry.headerHeight = header?.offsetHeight || 80
      const origin = source?.getBoundingClientRect(), sourceStage = source?.closest("section")?.querySelector("[data-artist-stage]")?.getBoundingClientRect()
      const sourceHeading = source?.closest<HTMLElement>("[data-artist-heading]"), sourcePanel = source?.closest<HTMLElement>("[data-artist-panel]")
      geometry.sourceX = origin && sourceStage ? origin.left - sourceStage.left + origin.width / 2 - (sourceHeading ? Number(gsap.getProperty(sourceHeading, "x")) || 0 : 0) : geometry.width * .3
      geometry.sourceY = origin && sourceStage ? origin.top - sourceStage.top + origin.height / 2 - (sourcePanel ? Number(gsap.getProperty(sourcePanel, "y")) || 0 : 0) : geometry.height * .2
      geometry.sourceSize = origin?.width || 10
      const target = period.getBoundingClientRect(), bounds = stage.getBoundingClientRect()
      geometry.targetX = target.left - bounds.left + target.width / 2
      geometry.targetY = target.top - bounds.top + target.height / 2 - (Number(gsap.getProperty(heading, "y")) || 0)
      geometry.targetSize = target.width
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced); setReducedMode(reduced); measure()
      if (reduced) {
        if (source) delete source.dataset.eventDeparted
        gsap.set(connector, { opacity: 0 })
        gsap.set(stage, { "--events-entry": 1 })
        gsap.set(photos, { opacity: (_, element) => Number(element.dataset.eventPhoto) === 0 ? 1 : 0 })
        moveTo.current = index => tickets[index]?.scrollIntoView({ block: "center", behavior: "instant" })
        ScrollTrigger.create({ trigger: section, start: () => `top top+=${geometry.headerHeight / 2}`, end: "bottom top",
          onToggle: self => { if (header) header.dataset.eventTone = self.isActive ? "dark" : "" },
          onRefresh: self => { if (header) header.dataset.eventTone = self.isActive ? "dark" : "" },
        })
        return
      }
      const clock = { progress: 0 }
      gsap.set([left, right, dark, heading, footer, ...tickets, ...cities], { opacity: 0 })
      gsap.set(stage, { "--events-entry": 0 })
      gsap.set(connector, { x: 0, y: 0, scale: 1, opacity: 0 })
      gsap.set(period, { opacity: 0 })
      const leftX = gsap.quickSetter(left, "x", "px"), rightX = gsap.quickSetter(right, "x", "px")
      const leftY = gsap.quickSetter(left, "y", "px"), rightY = gsap.quickSetter(right, "y", "px")
      const leftRotation = gsap.quickSetter(left, "rotation", "deg"), rightRotation = gsap.quickSetter(right, "rotation", "deg")
      const leftOpacity = gsap.quickSetter(left, "opacity"), rightOpacity = gsap.quickSetter(right, "opacity")
      const darkOpacity = gsap.quickSetter(dark, "opacity"), headingOpacity = gsap.quickSetter(heading, "opacity"), headingY = gsap.quickSetter(heading, "y", "px"), footerOpacity = gsap.quickSetter(footer, "opacity")
      const photoOpacity = photos.map(photo => gsap.quickSetter(photo, "opacity"))
      const ticketSetters = tickets.map(ticket => ({ y: gsap.quickSetter(ticket, "y", "px"), scaleX: gsap.quickSetter(ticket, "scaleX"), scaleY: gsap.quickSetter(ticket, "scaleY"), rotate: gsap.quickSetter(ticket, "rotation", "deg"), opacity: gsap.quickSetter(ticket, "opacity") }))
      const citySetters = cities.map(city => ({ y: gsap.quickSetter(city, "y", "px"), opacity: gsap.quickSetter(city, "opacity") }))
      const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px"), dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY"), dotOpacity = gsap.quickSetter(connector, "opacity")
      const periodOpacity = gsap.quickSetter(period, "opacity")
      const render = () => {
        const distance = clock.progress * geometry.range, intro = clamp(distance / geometry.intro)
        const position = Math.min(Math.max(0, tickets.length - 1), Math.max(0, (distance - geometry.intro) / geometry.step))
        const entry = clamp(intro / .92), remaining = 1 - entry
        leftX(-geometry.width * .56 * remaining); rightX(geometry.width * .56 * remaining)
        leftY(-geometry.height * .08 * remaining); rightY(geometry.height * .08 * remaining)
        leftRotation(-4 * remaining); rightRotation(4 * remaining)
        leftOpacity(clamp(intro / .15)); rightOpacity(clamp(intro / .15)); darkOpacity(clamp(intro / .55))
        headingOpacity(clamp((intro - .38) / .5)); headingY(24 * (1 - clamp((intro - .38) / .5)))
        footerOpacity(clamp((intro - .65) / .35))
        photos.forEach((photo, i) => photoOpacity[i](Math.max(0, 1 - Math.abs(position - Number(photo.dataset.eventPhoto)))))
        ticketSetters.forEach((set, i) => {
          const delta = i - position, scale = 1 - Math.min(1, Math.abs(delta)) * .06
          set.y(delta * geometry.height * .85 + (1 - clamp((intro - .45) / .55)) * geometry.height * .45)
          set.rotate(delta * 5); set.scaleX(scale); set.scaleY(scale)
          set.opacity(clamp(1 - Math.abs(delta) * .65) * clamp((intro - .45) / .55))
        })
        citySetters.forEach((set, i) => { set.y((i - position) * 80 + (1 - intro) * 35); set.opacity(clamp(1 - Math.abs(i - position) * 2.5) * clamp((intro - .5) / .5)) })
        const selected = Math.min(Math.max(0, tickets.length - 1), Math.floor(position + .5))
        if (selected !== lastActive) { lastActive = selected; setActive(selected) }
        const t = intro, inverse = 1 - t
        dotX(inverse ** 3 * geometry.sourceX + 3 * inverse ** 2 * t * geometry.width * .68 + 3 * inverse * t ** 2 * geometry.width * .54 + t ** 3 * geometry.targetX)
        dotY(inverse ** 3 * geometry.sourceY + 3 * inverse ** 2 * t * geometry.height * .48 + 3 * inverse * t ** 2 * geometry.height * .38 + t ** 3 * geometry.targetY)
        const scale = (geometry.sourceSize + (geometry.targetSize - geometry.sourceSize) * intro) / 10
        dotScaleX(scale); dotScaleY(scale); dotOpacity(intro > 0 && intro < 1 ? 1 : 0)
        // Artists owns the source's arrival opacity; use a separate handoff flag
        // so a late artist render cannot restore a second dot during departure.
        if (source) source.dataset.eventDeparted = String(intro > 0)
        periodOpacity(intro >= 1 ? 1 : 0)
        stage.style.setProperty("--events-entry", String(clamp(intro / .55)))
        stage.dataset.eventsReady = String(intro >= .99)
        stage.dataset.eventProgress = String(clock.progress); stage.dataset.eventPosition = String(position)
        if (header) header.dataset.eventBridge = String(intro > 0 && intro < 1)
      }
      const animation = gsap.to(clock, { progress: 1, duration: 1, paused: true, ease: "none", onUpdate: render })
      const trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: () => `+=${geometry.range}`, animation, scrub: true,
        onRefreshInit: measure, onRefresh: render, onToggle: render,
      })
      ScrollTrigger.create({ trigger: section, start: () => geometry.top + geometry.intro * .9, end: () => `bottom top+=${geometry.headerHeight / 2}`,
        onToggle: self => { if (header) header.dataset.eventTone = self.isActive ? "dark" : "" },
        onRefresh: self => { if (header) header.dataset.eventTone = self.isActive ? "dark" : "" },
      })
      moveTo.current = index => window.scrollTo({ top: geometry.top + geometry.intro + Math.max(0, Math.min(tickets.length - 1, index)) * geometry.step, behavior: "instant" })
      const focus = (event: FocusEvent) => {
        if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && clock.progress * geometry.range < geometry.intro) moveTo.current(0)
      }
      stage.addEventListener("focusin", focus)
      animation.progress(trigger.progress); render()
      return () => stage.removeEventListener("focusin", focus)
    })
    const schedule = () => {
      if (disposed || refreshFrame) return
      refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) { measure(); ScrollTrigger.refresh() } })
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(stage); observer.observe(heading)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame); observer.disconnect(); media.revert(); section.style.removeProperty("height")
      moveTo.current = () => undefined
      if (source) delete source.dataset.eventDeparted
      if (header) { delete header.dataset.eventBridge; delete header.dataset.eventTone }
    }
  }, { scope: sectionRef, dependencies: [featured], revertOnUpdate: true })

  function showProgramme(event?: LabelEvent) { setDetailId(event?.id || null); setProgrammeOpen(true) }
  function destinations(event: LabelEvent) {
    return <div className={styles.eventLinks}>{event.url && <a href={event.url} target="_blank" rel="noopener noreferrer">Event website<ArrowUpRight size={17} /></a>}{event.instagram && <a href={event.instagram} target="_blank" rel="noopener noreferrer">Instagram post<ArrowUpRight size={17} /></a>}</div>
  }
  const backdrops = featured.length ? featured.map((_, index) => EVENT_BACKDROPS[index % EVENT_BACKDROPS.length]) : [EVENT_BACKDROPS[0]]
  function photographs() { return backdrops.map((photo, index) => <div key={photo.base} className={styles.photoLayer} data-event-photo={index}><img src={`${photo.base}-${photo.width}.webp`} srcSet={`${photo.base}-960.webp 960w, ${photo.base}-1600.webp 1600w, ${photo.base}-${photo.width}.webp ${photo.width}w`} sizes="100vw" alt={photo.alt} width={photo.width} height={photo.height} style={{ objectPosition: photo.position }} loading="lazy" decoding="async" draggable={false} /></div>) }

  return <>
    <section id="events" className={styles.section} ref={sectionRef} aria-labelledby="cd-events-title" aria-describedby="cd-events-instructions" aria-busy={loading}>
      <p className={styles.srOnly} id="cd-events-instructions">Scroll to move through the featured events. Use the event selector or open the full programme to browse directly.</p>
      <div className={styles.stage} ref={stageRef} data-event-stage>
        <div className={styles.dark} ref={darkRef} />
        <div className={styles.photoLeft} ref={leftRef} aria-hidden="true">{photographs()}</div>
        <div className={styles.photoRight} ref={rightRef} aria-hidden="true">{photographs()}</div>
        <div className={styles.shade} />
        <div className={styles.heading} ref={headingRef} data-event-heading><div><p className={styles.kicker}>The gathering</p><h2 id="cd-events-title">EVENTS<span ref={periodRef} data-event-handoff-dot aria-hidden="true">.</span></h2></div>{mocked && <p className={styles.mockNotice}>Mock events<span>Design preview</span></p>}</div>
        <div className={styles.cities} aria-hidden="true">{featured.map(event => <div key={event.id} className={styles.city} data-event-city data-long={!event.city.includes(" ") && event.city.length > 8}><p>{event.country}</p><span>{event.city}</span></div>)}</div>
        <div className={styles.ticketStack}>{featured.map((event, index) => <article key={event.id} className={styles.ticket} data-event-ticket aria-hidden={!reducedMode && current !== index} inert={!reducedMode && current !== index} style={{ zIndex: featured.length - index }}>
          <div className={styles.ticketTop}><span>Collecting Dots Records</span><span>{String(index + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}</span></div>
          <div className={styles.ticketDate}><strong>{event.day}</strong><span>{event.month}<br />{event.year}</span></div>
          <div className={styles.ticketBody}><p className={styles.ticketStatus}>{event.mock ? "Sample event · not announced" : event.timestamp < new Date().setHours(0, 0, 0, 0) ? "From the archive" : "Upcoming gathering"}</p><h3>{event.title}</h3><p className={styles.venue}>{event.venue}</p><p className={styles.time}>{event.time}</p><ul className={styles.lineup}>{event.artists.map(artist => <li key={artist}>{artist}</li>)}</ul></div>
          <button className={styles.detailsButton} onClick={() => showProgramme(event)}>Event details<ArrowUpRight size={18} /></button>
          <div className={styles.ticketStub}><span>{event.city}</span><i aria-hidden="true" /><span>{event.mock ? "PREVIEW" : "COLLECTING DOTS"}</span></div>
        </article>)}</div>
        {!featured.length && <div className={styles.empty} role="status">{loading ? "Gathering the programme…" : failed ? <>The programme is taking a moment.<button onClick={() => setLoadKey(value => value + 1)}>Try again</button></> : "The next gathering is taking shape. Check back for new dates."}</div>}
        <footer ref={footerRef} className={styles.footer}><p>From the collection.<br /><span>Into the crowd.</span></p><div className={styles.selectors} aria-label="Featured events">{featured.map((event, index) => <button key={event.id} aria-label={`Show ${event.city} event`} aria-pressed={current === index} onClick={() => moveTo.current(index)}><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true" /></button>)}</div><button className={styles.programmeButton} onClick={() => { setProgrammeTab(programme.upcoming.length ? "upcoming" : "past"); showProgramme() }} disabled={!events.length}>Full programme<span>({events.length})</span><ArrowUpRight size={18} /></button></footer>
        <span className={styles.connector} ref={connectorRef} aria-hidden="true" data-events-connector />
      </div>
    </section>
    <dialog className={styles.programme} ref={dialogRef} aria-labelledby="cd-events-programme-title" onClose={() => setProgrammeOpen(false)}>
      <header className={styles.programmeHeader}><div><p className={styles.kicker}>Collecting Dots Records</p><h2 id="cd-events-programme-title" ref={programmeTitleRef} tabIndex={-1}>{detail ? "THE GATHERING." : "THE PROGRAMME."}</h2></div><button onClick={() => dialogRef.current?.close()} aria-label="Close event programme" autoFocus><X size={24} /></button></header>
      {mocked && <p className={styles.previewMessage}>Design preview. These events, dates, venues and lineups are fictional. Photography is from the real Collecting Dots archive.</p>}
      {detail ? <div className={styles.eventDetail}><button className={styles.backToProgramme} onClick={() => { setDetailId(null); setProgrammeTab(detail.timestamp >= new Date().setHours(0, 0, 0, 0) ? "upcoming" : "past") }}><ArrowLeft size={16} />All events</button><p className={styles.detailDate}>{detail.date} · {detail.time}</p><h3>{detail.title}</h3><p>{detail.location}</p><ul>{detail.artists.map(artist => <li key={artist}>{artist}</li>)}</ul>{destinations(detail)}</div> : <>
        <div className={styles.programmeTabs}><button aria-pressed={programmeTab === "upcoming"} onClick={() => setProgrammeTab("upcoming")}>Upcoming ({programme.upcoming.length})</button><button aria-pressed={programmeTab === "past"} onClick={() => setProgrammeTab("past")}>Past ({programme.past.length})</button></div>
        <ul className={styles.programmeList}>{listed.map(event => <li key={event.id}><time>{event.date}</time><div><h3>{event.title}</h3><p>{event.location}</p><p>{event.time}</p><p>{event.artists.join(" · ")}</p>{destinations(event)}</div><button onClick={() => setDetailId(event.id)} aria-label={`Details for ${event.title}`}><ArrowUpRight size={24} /></button></li>)}</ul>
        {!listed.length && <p className={styles.programmeEmpty}>No {programmeTab} events to show yet.</p>}
      </>}
    </dialog>
  </>
}

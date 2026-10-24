"use client"

import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowUpRight, ArrowDown } from "lucide-react"
import DemoSubmissionForm from "./demo-submission-form"
import styles from "./collecting-dots-demos.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)
const clamp = gsap.utils.clamp(0, 1)
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

export default function CollectingDotsDemos() {
  const sectionRef = useRef<HTMLElement>(null), stageRef = useRef<HTMLDivElement>(null), matteRef = useRef<HTMLDivElement>(null), roomRef = useRef<HTMLDivElement>(null)
  const sleeveRef = useRef<HTMLDivElement>(null), coverRef = useRef<HTMLSpanElement>(null), holeRef = useRef<HTMLSpanElement>(null), connectorRef = useRef<HTMLSpanElement>(null), footerRef = useRef<HTMLElement>(null)
  const enter = useRef<() => void>(() => undefined)
  const [open, setOpen] = useState(false), [incoming, setIncoming] = useState<File[]>([]), [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(true), [enabled, setEnabled] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    void fetch("/api/settings/demo-submission-enabled", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Could not load submission availability")
      const data = await response.json(); setEnabled(Boolean(data.enabled))
    }).catch(() => { if (!controller.signal.aborted) setEnabled(true) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, matte = matteRef.current, room = roomRef.current
    const sleeve = sleeveRef.current, cover = coverRef.current, hole = holeRef.current, connector = connectorRef.current, footer = footerRef.current
    if (!section || !stage || !matte || !room || !sleeve || !cover || !hole || !connector || !footer) return
    const sleeveButton = sleeve.querySelector("button")
    if (!sleeveButton) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const source = document.querySelector<HTMLElement>("[data-merch-handoff-dot]")
    const lines = Array.from(stage.querySelectorAll<HTMLElement>("[data-demo-line]"))
    const geometry = { width: 1, height: 1, top: 0, intro: 1, range: 1, sourceX: 0, sourceY: 0, sourceSize: 8, targetX: 0, targetY: 0 }
    let disposed = false, reduced = false, refreshFrame = 0
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.intro = geometry.height * .95; geometry.range = geometry.intro + geometry.height * .12
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      const bounds = stage.getBoundingClientRect(), frame = sleeve.getBoundingClientRect()
      geometry.targetX = frame.left - bounds.left + frame.width / 2; geometry.targetY = frame.top - bounds.top + frame.width / 2
      const origin = source?.getBoundingClientRect(), merch = source?.closest<HTMLElement>("[data-merch-stage]")?.getBoundingClientRect()
      geometry.sourceX = origin && merch ? origin.left - merch.left + origin.width / 2 : geometry.width * .5
      geometry.sourceY = origin && merch ? origin.top - merch.top + origin.height / 2 : geometry.height * .2
      geometry.sourceSize = origin?.width || 8
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced); measure()
      let focus: ((event: FocusEvent) => void) | undefined
      if (reduced) {
        gsap.set([matte, room, ...lines, sleeveButton, cover, hole, footer], { clearProps: "transform,opacity" })
        gsap.set(connector, { opacity: 0 }); stage.dataset.demoReady = "true"; enter.current = () => undefined
        if (source) delete source.dataset.demoDeparted
        if (header) delete header.dataset.demoBridge
      } else {
        const clock = { progress: 0 }
        const matteY = gsap.quickSetter(matte, "y", "px"), roomX = gsap.quickSetter(room, "x", "px")
        const text = lines.map(line => ({ x: gsap.quickSetter(line, "x", "px"), opacity: gsap.quickSetter(line, "opacity") }))
        const coverY = gsap.quickSetter(sleeveButton, "y", "px"), coverRotation = gsap.quickSetter(cover, "rotation", "deg"), coverOpacity = gsap.quickSetter(cover, "opacity"), footerOpacity = gsap.quickSetter(footer, "opacity")
        const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px"), dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY"), dotOpacity = gsap.quickSetter(connector, "opacity"), holeOpacity = gsap.quickSetter(hole, "opacity")
        const render = () => {
          const intro = clamp(clock.progress * geometry.range / geometry.intro)
          matteY(geometry.height * (1 - smooth(intro / .64)))
          roomX(geometry.width * .48 * (1 - smooth((intro - .12) / .54)))
          text.forEach((set, index) => { const t = clamp((intro - .3 - index * .06) / .3); set.x(-55 * (1 - smooth(t))); set.opacity(t) })
          const arrival = smooth((intro - .28) / .62)
          coverY(geometry.height * .32 * (1 - arrival)); coverRotation(-22 + 16 * arrival); coverOpacity(clamp((intro - .28) / .3))
          footerOpacity(clamp((intro - .7) / .3))
          const t = clamp(intro / .96), inverse = 1 - t
          dotX(inverse ** 3 * geometry.sourceX + 3 * inverse ** 2 * t * geometry.width * .7 + 3 * inverse * t ** 2 * geometry.width * .92 + t ** 3 * geometry.targetX)
          dotY(inverse ** 3 * geometry.sourceY + 3 * inverse ** 2 * t * geometry.height * .06 + 3 * inverse * t ** 2 * geometry.height * .22 + t ** 3 * geometry.targetY)
          const scale = (geometry.sourceSize + (16 - geometry.sourceSize) * t) / 10
          dotScaleX(scale); dotScaleY(scale)
          dotOpacity(t > 0 && t < 1 ? 1 : 0); holeOpacity(t >= 1 ? 1 : 0)
          if (source) source.dataset.demoDeparted = String(intro > 0)
          stage.dataset.demoReady = String(intro >= .99); stage.dataset.demoProgress = String(clock.progress)
          if (header) header.dataset.demoBridge = String(intro > 0 && intro < .65)
        }
        const animation = gsap.to(clock, { progress: 1, duration: 1, paused: true, ease: "none", onUpdate: render })
        const trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: () => `+=${geometry.range}`, animation, scrub: true, onRefreshInit: measure, onRefresh: render, onToggle: render })
        enter.current = () => window.scrollTo({ top: geometry.top + geometry.intro, behavior: "instant" })
        focus = event => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && clock.progress * geometry.range < geometry.intro) enter.current() }
        stage.addEventListener("focusin", focus); animation.progress(trigger.progress); render()
      }
      ScrollTrigger.create({ trigger: section, start: () => geometry.top + (reduced ? 0 : geometry.intro * .6), end: "bottom top+=40", onToggle: self => { if (header) header.dataset.demoTone = self.isActive ? "split" : "" }, onRefresh: self => { if (header) header.dataset.demoTone = self.isActive ? "split" : "" } })
      return () => { if (focus) stage.removeEventListener("focusin", focus) }
    })
    const schedule = () => { if (disposed || refreshFrame) return; refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) { measure(); ScrollTrigger.refresh() } }) }
    const observer = new ResizeObserver(schedule); observer.observe(stage); observer.observe(sleeve)
    void document.fonts.ready.then(schedule)
    return () => { disposed = true; cancelAnimationFrame(refreshFrame); observer.disconnect(); media.revert(); section.style.removeProperty("height"); enter.current = () => undefined; if (source) delete source.dataset.demoDeparted; if (header) { delete header.dataset.demoTone; delete header.dataset.demoBridge } }
  }, { scope: sectionRef })

  useEffect(() => {
    if (window.location.hash !== "#demo-submission") return
    let cancelled = false, completed = false, fontsReady = false, first = 0, second = 0
    const upstream = ["releases", "artists", "events"].map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const cancel = () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(first); cancelAnimationFrame(second) }
    const settle = () => {
      if (cancelled || completed || !fontsReady || upstream.some(node => node.getAttribute("aria-busy") === "true")) return
      cancelAnimationFrame(first); cancelAnimationFrame(second)
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (cancelled || completed || !section || window.location.hash !== "#demo-submission") return
        completed = true; observer.disconnect(); ScrollTrigger.refresh()
        window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - (parseFloat(getComputedStyle(section).scrollMarginTop) || 0), behavior: "instant" })
      }) })
    }
    const observer = new MutationObserver(settle); upstream.forEach(node => observer.observe(node, { attributes: true, attributeFilter: ["aria-busy"] }))
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    inputs.forEach(type => window.addEventListener(type, cancel, { once: true, passive: true })); void document.fonts.ready.then(() => { fontsReady = true; settle() })
    return () => { cancel(); inputs.forEach(type => window.removeEventListener(type, cancel)) }
  }, [])

  return <>
    <section id="demo-submission" className={styles.section} ref={sectionRef} aria-labelledby="cd-demo-title">
      <div className={styles.stage} ref={stageRef} data-demo-stage>
        <div className={styles.matte} ref={matteRef} aria-hidden="true" /><div className={styles.room} ref={roomRef} aria-hidden="true"><span>Every record<br />starts somewhere.</span></div>
        <div className={styles.heading}><p className={styles.micro} data-demo-line>The next dot could be yours / Demos</p><h2 id="cd-demo-title"><span data-demo-line>DROP</span><span data-demo-line>YOUR</span><span data-demo-line>DOT<span className={styles.titlePeriod}>.</span></span></h2><p className={styles.introduction} data-demo-line>A new sound. A different perspective.<br /> Send us something only you could make.</p></div>
        <div className={styles.sleeve} ref={sleeveRef} data-demo-sleeve data-dragging={dragging}>
          <button className={styles.sleeveButton} aria-haspopup="dialog" aria-label="Drop your dot — open demo submission" onClick={() => setOpen(true)} onDragOver={event => { event.preventDefault(); if (enabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!loading && enabled) { setIncoming(Array.from(event.dataTransfer.files)); setOpen(true) } }}>
            <span className={styles.cover} ref={coverRef}><span className={styles.sleeveLabel}><span>Collecting Dots Records</span><span>Original music / New discoveries</span></span><span className={styles.record} aria-hidden="true"><i /><span className={styles.recordHole} ref={holeRef} data-demo-handoff-dot /></span><span className={styles.sleeveBottom}><span>Your sound<br />belongs here.</span><ArrowDown size={24} /><span className={styles.barcode} aria-hidden="true" /></span></span>
            <span className={styles.sleeveCaption} data-demo-line><span>{loading ? "Opening the inbox…" : enabled ? "Choose your tracks" : "Submissions are taking a breather"}<small>MP3 / WAV · Up to 10 tracks · 150 MB each</small></span><ArrowUpRight size={23} /></span>
          </button>
        </div>
        <footer className={styles.footer} ref={footerRef}><p>Independent minds.<br /><span>A shared frequency.</span></p><span className={styles.dotSignature} aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map(dot => <i key={dot} />)}<span>→</span></span><p>From your studio<br /><span>to our collection.</span></p></footer>
        <span ref={connectorRef} className={styles.connector} data-demo-connector aria-hidden="true" />
      </div>
    </section>
    <DemoSubmissionForm open={open} onClose={() => setOpen(false)} incoming={incoming} loading={loading} enabled={enabled} />
  </>
}

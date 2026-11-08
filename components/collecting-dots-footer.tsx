"use client"

import { useEffect, useRef, type MouseEvent } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowUp, ArrowUpRight } from "lucide-react"
import styles from "./collecting-dots-footer.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)
const clamp = gsap.utils.clamp(0, 1)
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
const links = [
  { label: "Instagram", detail: "The moments", href: "https://www.instagram.com/collectingdotsrecords/" },
  { label: "Spotify", detail: "The collection", href: "https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ" },
  { label: "Beatport", detail: "The records", href: "https://www.beatport.com/label/collecting-dots/126941" },
]

export default function CollectingDotsFooter() {
  const footerRef = useRef<HTMLElement>(null), stageRef = useRef<HTMLDivElement>(null), matteRef = useRef<HTMLDivElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null), connectorRef = useRef<HTMLSpanElement>(null), ruleRef = useRef<HTMLDivElement>(null)
  const enter = useRef<() => void>(() => undefined)

  useGSAP(() => {
    const footer = footerRef.current, stage = stageRef.current, matte = matteRef.current, period = periodRef.current, connector = connectorRef.current, rule = ruleRef.current
    if (!footer || !stage || !matte || !period || !connector || !rule) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const source = document.querySelector<HTMLElement>("[data-demo-handoff-dot]")
    const sourceStage = source?.closest<HTMLElement>("[data-demo-stage]")
    const sourceSleeve = sourceStage?.querySelector<HTMLElement>("[data-demo-sleeve]")
    const words = Array.from(stage.querySelectorAll<HTMLElement>("[data-footer-word]"))
    const pieces = Array.from(stage.querySelectorAll<HTMLElement>("[data-footer-reveal]"))
    const geometry = { width: 1, height: 1, top: 0, intro: 1, range: 1, sourceX: 0, sourceY: 0, sourceSize: 16, targetX: 0, targetY: 0, targetSize: 24 }
    let disposed = false, reduced = false, refreshFrame = 0
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.intro = geometry.height * .9; geometry.range = geometry.intro + geometry.height * .1
      footer.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = footer.getBoundingClientRect().top + window.scrollY
      const bounds = stage.getBoundingClientRect(), target = period.getBoundingClientRect()
      const wordX = words[1] ? Number(gsap.getProperty(words[1], "x")) || 0 : 0
      geometry.targetX = target.left - bounds.left + target.width / 2 - wordX
      geometry.targetY = target.top - bounds.top + target.height / 2; geometry.targetSize = target.width
      const originStage = sourceStage?.getBoundingClientRect(), sleeve = sourceSleeve?.getBoundingClientRect(), origin = source?.getBoundingClientRect()
      // The sleeve frame is static; its animated cover may still be arriving during refresh.
      geometry.sourceX = originStage && sleeve ? sleeve.left - originStage.left + sleeve.width / 2 : origin && originStage ? origin.left - originStage.left + origin.width / 2 : geometry.width * .79
      geometry.sourceY = originStage && sleeve ? sleeve.top - originStage.top + sleeve.width / 2 : origin && originStage ? origin.top - originStage.top + origin.height / 2 : geometry.height * .52
      geometry.sourceSize = source?.offsetWidth || 16
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced); measure()
      let focus: ((event: FocusEvent) => void) | undefined
      if (reduced) {
        gsap.set([matte, ...words, ...pieces, period, rule], { clearProps: "transform,opacity,visibility" })
        gsap.set(connector, { opacity: 0 }); stage.dataset.footerReady = "true"; enter.current = () => undefined
        if (source) delete source.dataset.footerDeparted
        if (header) delete header.dataset.footerBridge
      } else {
        const clock = { progress: 0 }
        const matteY = gsap.quickSetter(matte, "y", "px")
        const word = words.map(node => ({ x: gsap.quickSetter(node, "x", "px"), opacity: gsap.quickSetter(node, "opacity") }))
        const piece = pieces.map(node => ({ y: gsap.quickSetter(node, "y", "px"), opacity: gsap.quickSetter(node, "opacity"), visibility: gsap.quickSetter(node, "visibility") }))
        const ruleScale = gsap.quickSetter(rule, "scaleX"), ruleOpacity = gsap.quickSetter(rule, "opacity")
        const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px")
        const dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY"), dotOpacity = gsap.quickSetter(connector, "opacity"), periodOpacity = gsap.quickSetter(period, "opacity")
        const render = () => {
          const intro = clamp(clock.progress * geometry.range / geometry.intro)
          matteY(geometry.height * (1 - smooth(intro / .66)))
          word.forEach((set, index) => {
            const t = smooth((intro - .2 - index * .09) / .46)
            set.x((index ? 1 : -1) * geometry.width * .13 * (1 - t)); set.opacity(clamp((intro - .22 - index * .09) / .3))
          })
          piece.forEach((set, index) => {
            const t = clamp((intro - .42 - index * .045) / .3)
            set.y(22 * (1 - smooth(t))); set.opacity(t); set.visibility(t > 0 ? "visible" : "hidden")
          })
          ruleScale(smooth((intro - .45) / .4)); ruleOpacity(clamp((intro - .4) / .25))
          const t = clamp(intro / .96), inverse = 1 - t
          dotX(inverse ** 3 * geometry.sourceX + 3 * inverse ** 2 * t * geometry.width * .92 + 3 * inverse * t ** 2 * geometry.width * .57 + t ** 3 * geometry.targetX)
          dotY(inverse ** 3 * geometry.sourceY + 3 * inverse ** 2 * t * geometry.height * .17 + 3 * inverse * t ** 2 * geometry.height * .24 + t ** 3 * geometry.targetY)
          const scale = (geometry.sourceSize + (geometry.targetSize - geometry.sourceSize) * t) / 10
          dotScaleX(scale); dotScaleY(scale); dotOpacity(t > 0 && t < 1 ? 1 : 0); periodOpacity(t >= 1 ? 1 : 0)
          if (source) source.dataset.footerDeparted = String(intro > 0)
          stage.dataset.footerReady = String(intro >= .99); stage.dataset.footerProgress = String(clock.progress)
          if (header) header.dataset.footerBridge = String(intro > 0 && intro < .63)
        }
        const animation = gsap.to(clock, { progress: 1, duration: 1, paused: true, ease: "none", onUpdate: render })
        const trigger = ScrollTrigger.create({ trigger: footer, start: "top top", end: () => `+=${geometry.range}`, animation, scrub: true, onRefreshInit: measure, onRefresh: render, onToggle: render })
        enter.current = () => window.scrollTo({ top: geometry.top + geometry.intro, behavior: "instant" })
        focus = event => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && clock.progress * geometry.range < geometry.intro) enter.current() }
        stage.addEventListener("focusin", focus); animation.progress(trigger.progress); render()
      }
      ScrollTrigger.create({ trigger: footer, start: () => geometry.top + (reduced ? 0 : geometry.intro * .6), end: "bottom top+=40", onToggle: self => { if (header) header.dataset.footerTone = self.isActive ? "dark" : "" }, onRefresh: self => { if (header) header.dataset.footerTone = self.isActive ? "dark" : "" } })
      return () => { if (focus) stage.removeEventListener("focusin", focus) }
    })
    const schedule = () => { if (disposed || refreshFrame) return; refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) { measure(); ScrollTrigger.refresh() } }) }
    const observer = new ResizeObserver(schedule); observer.observe(stage); observer.observe(period)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame); observer.disconnect(); media.revert(); footer.style.removeProperty("height"); enter.current = () => undefined
      if (source) delete source.dataset.footerDeparted
      if (header) { delete header.dataset.footerTone; delete header.dataset.footerBridge }
    }
  }, { scope: footerRef })

  useEffect(() => {
    if (window.location.hash !== "#connect") return
    let cancelled = false, completed = false, fontsReady = false, first = 0, second = 0
    const upstream = ["releases", "artists", "events"].map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const cancel = () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(first); cancelAnimationFrame(second) }
    const settle = () => {
      if (cancelled || completed || !fontsReady || upstream.some(node => node.getAttribute("aria-busy") === "true")) return
      cancelAnimationFrame(first); cancelAnimationFrame(second)
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
        const footer = footerRef.current
        if (cancelled || completed || !footer || window.location.hash !== "#connect") return
        completed = true; observer.disconnect(); ScrollTrigger.refresh()
        window.scrollTo({ top: window.scrollY + footer.getBoundingClientRect().top - (parseFloat(getComputedStyle(footer).scrollMarginTop) || 0), behavior: "instant" })
      }) })
    }
    const observer = new MutationObserver(settle); upstream.forEach(node => observer.observe(node, { attributes: true, attributeFilter: ["aria-busy"] }))
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    inputs.forEach(type => window.addEventListener(type, cancel, { once: true, passive: true })); void document.fonts.ready.then(() => { fontsReady = true; settle() })
    return () => { cancel(); inputs.forEach(type => window.removeEventListener(type, cancel)) }
  }, [])

  function returnToStart(event: MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.preventDefault(); document.getElementById("top")?.scrollIntoView({ behavior: "instant" })
    }
  }

  return <footer id="connect" className={styles.footer} ref={footerRef} aria-labelledby="cd-footer-title">
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.matte} ref={matteRef} aria-hidden="true" />
      <p className={styles.eyebrow} data-footer-reveal>The story keeps going.</p>
      <h2 className={styles.wordmark} id="cd-footer-title" aria-label="Collecting Dots Records"><span data-footer-word>COLLECTING</span><span data-footer-word>DOTS<span className={styles.period} ref={periodRef} data-footer-handoff-dot aria-hidden="true" /></span></h2>
      <p className={styles.curator} data-footer-reveal>Independent music record label.<br /><span>Curated by OMRI.</span></p>
      <div className={styles.rule} ref={ruleRef} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.contact} data-footer-reveal><p>Keep in touch</p><a href="mailto:office@collectingdots.com" target="_blank" rel="noopener noreferrer">office@collectingdots.com<ArrowUpRight size={22} /></a></div>
        <nav className={styles.links} aria-label="Follow Collecting Dots">{links.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" data-footer-reveal><span>{link.label}<small>{link.detail}</small></span><ArrowUpRight size={19} /></a>)}</nav>
      </div>
      <div className={styles.colophon} data-footer-reveal><p>© {new Date().getFullYear()} Collecting Dots.<span>All rights reserved.</span></p><span className={styles.signoff}>Collecting Dots Records</span><a href="#top" onClick={returnToStart}>Back to the start<ArrowUp size={17} /></a></div>
      <span className={styles.connector} ref={connectorRef} data-footer-connector aria-hidden="true" />
    </div>
  </footer>
}

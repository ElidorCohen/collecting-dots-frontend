"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowUpRight, ArrowRight } from "lucide-react"
import { BUNDLED_MERCH, fetchMerch, type MerchImage, type MerchProduct } from "@/lib/merchandise"
import styles from "./collecting-dots-merchandise.module.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)
const clamp = gsap.utils.clamp(0, 1)
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"]
const count = (n: number) => WORDS[n] ?? String(n)
// Shopify image links accept a width; anything else is used as it is
function sized(src: string, width: number) {
  try { const url = new URL(src); if (url.hostname !== "cdn.shopify.com" && !url.pathname.includes("/cdn/shop/")) return src; url.searchParams.set("width", String(width)); return url.href } catch { return src }
}
function imageSet(image: MerchImage) { return [360, 720, 1080, image.width].filter((width, index, all) => width <= image.width && all.indexOf(width) === index).map(width => `${sized(image.src, width)} ${width}w`).join(", ") }

export default function CollectingDotsMerchandise() {
  const sectionRef = useRef<HTMLElement>(null), stageRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null), nextRef = useRef<HTMLButtonElement>(null)
  const tagRef = useRef<HTMLDivElement>(null), holeRef = useRef<HTMLSpanElement>(null), connectorRef = useRef<HTMLSpanElement>(null)
  const footerRef = useRef<HTMLElement>(null), enter = useRef<() => void>(() => undefined)
  const [products, setProducts] = useState<MerchProduct[]>(BUNDLED_MERCH)
  const [selected, setSelected] = useState(0), [view, setView] = useState(0)
  // The dashboard's list replaces the bundled pieces; it keeps their order and look
  useEffect(() => {
    const controller = new AbortController()
    fetchMerch(controller.signal).then(list => {
      if (JSON.stringify(list) === JSON.stringify(BUNDLED_MERCH)) return
      setProducts(list); setSelected(0); setView(0)
    }).catch(() => { /* The bundled pieces stay. */ })
    return () => controller.abort()
  }, [])
  const brands = new Set(products.map(item => item.brandName)).size
  const product = products[selected], nextIndex = (selected + 1) % products.length, next = products[nextIndex]
  function select(index: number) { setSelected(index); setView(0) }

  useGSAP(() => {
    const section = sectionRef.current, stage = stageRef.current, main = mainRef.current, next = nextRef.current
    const tag = tagRef.current, hole = holeRef.current, connector = connectorRef.current, footer = footerRef.current
    if (!section || !stage || !main || !next || !tag || !hole || !connector || !footer) return
    const header = document.querySelector<HTMLElement>("[data-story-header]")
    const source = document.querySelector<HTMLElement>("[data-archive-handoff-dot]")
    const panels = Array.from(stage.querySelectorAll<HTMLElement>("[data-merch-paper]"))
    const lines = Array.from(stage.querySelectorAll<HTMLElement>("[data-merch-line]"))
    const choices = Array.from(stage.querySelectorAll<HTMLElement>("[data-merch-choice]"))
    const geometry = { width: 1, height: 1, top: 0, intro: 1, range: 1, sourceX: 0, sourceY: 0, sourceSize: 6, targetX: 0, targetY: 0, targetSize: 8 }
    let disposed = false, reduced = false, refreshFrame = 0
    const measure = () => {
      geometry.width = stage.clientWidth; geometry.height = stage.clientHeight
      geometry.intro = geometry.height * 1.05; geometry.range = geometry.intro + geometry.height * .12
      section.style.height = reduced ? "auto" : `${geometry.height + geometry.range}px`
      geometry.top = section.getBoundingClientRect().top + window.scrollY
      const bounds = stage.getBoundingClientRect(), target = hole.getBoundingClientRect()
      geometry.targetX = target.left - bounds.left + target.width / 2; geometry.targetY = target.top - bounds.top + target.height / 2; geometry.targetSize = target.width
      const origin = source?.getBoundingClientRect(), archive = source?.closest<HTMLElement>("[data-archive-stage]")?.getBoundingClientRect()
      geometry.sourceX = origin && archive ? origin.left - archive.left + origin.width / 2 : geometry.width * .04
      geometry.sourceY = origin && archive ? origin.top - archive.top + origin.height / 2 : geometry.height * .28
      geometry.sourceSize = origin?.width || 6
    }
    const media = gsap.matchMedia()
    media.add({ reduced: "(prefers-reduced-motion: reduce)", standard: "(prefers-reduced-motion: no-preference)" }, context => {
      reduced = Boolean(context.conditions?.reduced); measure()
      let focus: ((event: FocusEvent) => void) | undefined
      if (reduced) {
        gsap.set([...panels, ...lines, ...choices, main, next, tag, hole, footer], { clearProps: "transform,opacity" })
        if (header) delete header.dataset.merchBridge
        if (source) delete source.dataset.merchDeparted
        gsap.set(connector, { opacity: 0 }); stage.dataset.merchReady = "true"; enter.current = () => undefined
      } else {
        const clock = { progress: 0 }
        const paper = panels.map(panel => gsap.quickSetter(panel, "y", "px"))
        const text = lines.map(line => ({ y: gsap.quickSetter(line, "y", "px"), opacity: gsap.quickSetter(line, "opacity") }))
        const choice = choices.map(item => ({ y: gsap.quickSetter(item, "y", "px"), opacity: gsap.quickSetter(item, "opacity") }))
        const mainY = gsap.quickSetter(main, "y", "px"), mainRotation = gsap.quickSetter(main, "rotation", "deg"), mainOpacity = gsap.quickSetter(main, "opacity")
        const nextX = gsap.quickSetter(next, "x", "px"), nextOpacity = gsap.quickSetter(next, "opacity")
        const tagOpacity = gsap.quickSetter(tag, "opacity"), footerOpacity = gsap.quickSetter(footer, "opacity")
        const dotX = gsap.quickSetter(connector, "x", "px"), dotY = gsap.quickSetter(connector, "y", "px"), dotOpacity = gsap.quickSetter(connector, "opacity")
        const dotScaleX = gsap.quickSetter(connector, "scaleX"), dotScaleY = gsap.quickSetter(connector, "scaleY"), holeOpacity = gsap.quickSetter(hole, "opacity")
        // Controls answer as soon as they are clearly visible, not only after the whole entrance.
        const live = (node: HTMLElement, opacity: number) => { const value = String(opacity >= .5); if (node.dataset.live !== value) node.dataset.live = value }
        const render = () => {
          const intro = clamp(clock.progress * geometry.range / geometry.intro)
          paper.forEach((set, i) => set(geometry.height * (1 - smooth((intro - i * .065) / .62))))
          text.forEach((set, i) => { const t = clamp((intro - .25 - i * .065) / .3); set.y(28 * (1 - t)); set.opacity(t); live(lines[i], t) })
          choice.forEach((set, i) => { const t = clamp((intro - .48 - i * .035) / .28); set.y(16 * (1 - t)); set.opacity(t); live(choices[i], t) })
          const photo = smooth((intro - .22) / .65)
          mainY(geometry.height * .16 * (1 - photo)); mainRotation(-5 * (1 - photo)); mainOpacity(clamp((intro - .25) / .32))
          const accessory = smooth((intro - .42) / .48)
          nextX(geometry.width * .12 * (1 - accessory)); nextOpacity(clamp((intro - .48) / .35)); live(next, clamp((intro - .48) / .35))
          tagOpacity(clamp((intro - .56) / .3)); footerOpacity(clamp((intro - .72) / .28)); live(footer, clamp((intro - .72) / .28))
          const t = clamp(intro / .94), inverse = 1 - t
          dotX(inverse ** 3 * geometry.sourceX + 3 * inverse ** 2 * t * geometry.width * .22 + 3 * inverse * t ** 2 * geometry.width * .48 + t ** 3 * geometry.targetX)
          dotY(inverse ** 3 * geometry.sourceY + 3 * inverse ** 2 * t * geometry.height * .08 + 3 * inverse * t ** 2 * geometry.height * .08 + t ** 3 * geometry.targetY)
          const scale = (geometry.sourceSize + (geometry.targetSize - geometry.sourceSize) * t) / 10
          dotScaleX(scale); dotScaleY(scale); dotOpacity(t > 0 && t < 1 ? 1 : 0); holeOpacity(t >= 1 ? 1 : 0)
          if (source) source.dataset.merchDeparted = String(intro > 0)
          stage.dataset.merchReady = String(intro >= .99); stage.dataset.merchProgress = String(clock.progress)
          if (header) header.dataset.merchBridge = String(intro > 0 && intro < .6)
        }
        const animation = gsap.to(clock, { progress: 1, duration: 1, paused: true, ease: "none", onUpdate: render })
        const trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: () => `+=${geometry.range}`, animation, scrub: true, onRefreshInit: measure, onRefresh: render, onToggle: render })
        enter.current = () => window.scrollTo({ top: geometry.top + geometry.intro, behavior: "instant" })
        focus = event => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && clock.progress * geometry.range < geometry.intro) enter.current() }
        stage.addEventListener("focusin", focus)
        animation.progress(trigger.progress); render()
      }
      ScrollTrigger.create({ trigger: section, start: () => geometry.top + (reduced ? 0 : geometry.intro * .5), end: "bottom top+=40",
        onToggle: self => { if (header) header.dataset.merchTone = self.isActive ? "light" : "" },
        onRefresh: self => { if (header) header.dataset.merchTone = self.isActive ? "light" : "" },
      })
      return () => { if (focus) stage.removeEventListener("focusin", focus) }
    })
    const schedule = () => { if (disposed || refreshFrame) return; refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) { measure(); ScrollTrigger.refresh() } }) }
    const observer = new ResizeObserver(schedule); observer.observe(stage); observer.observe(tag)
    void document.fonts.ready.then(schedule)
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame); observer.disconnect(); media.revert(); section.style.removeProperty("height"); enter.current = () => undefined
      if (source) delete source.dataset.merchDeparted
      if (header) { delete header.dataset.merchTone; delete header.dataset.merchBridge }
    }
  }, { scope: sectionRef, dependencies: [products], revertOnUpdate: true })

  useEffect(() => {
    if (window.location.hash !== "#merchandise") return
    let cancelled = false, completed = false, fontsReady = false, first = 0, second = 0
    const upstream = ["releases", "artists", "events"].map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const cancel = () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(first); cancelAnimationFrame(second) }
    const settle = () => {
      if (cancelled || completed || !fontsReady || upstream.some(node => node.getAttribute("aria-busy") === "true")) return
      cancelAnimationFrame(first); cancelAnimationFrame(second)
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (cancelled || completed || !section || window.location.hash !== "#merchandise") return
        completed = true; observer.disconnect(); ScrollTrigger.refresh()
        window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - (parseFloat(getComputedStyle(section).scrollMarginTop) || 0), behavior: "instant" })
      }) })
    }
    const observer = new MutationObserver(settle)
    upstream.forEach(node => observer.observe(node, { attributes: true, attributeFilter: ["aria-busy"] }))
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    inputs.forEach(type => window.addEventListener(type, cancel, { once: true, passive: true }))
    void document.fonts.ready.then(() => { fontsReady = true; settle() })
    return () => { cancel(); inputs.forEach(type => window.removeEventListener(type, cancel)) }
  }, [])

  function photograph(image: MerchImage, name: string, small = false) {
    return <img src={image.src} srcSet={imageSet(image)} sizes={small ? "(max-width: 699px) 20vw, 15vw" : "(max-width: 699px) 58vw, (max-width: 1000px) 34vw, 47vh"} width={image.width} height={image.height} alt={`${name} — ${image.label}`} loading="lazy" decoding="async" draggable={false} />
  }

  return <section id="merchandise" className={styles.section} ref={sectionRef} aria-labelledby="cd-merch-title">
    <div className={styles.stage} ref={stageRef} data-merch-stage>
      <div className={styles.papers} aria-hidden="true">{[0, 1, 2].map(index => <div data-merch-paper key={index} />)}</div>
      <div className={styles.heading}>
        <p className={styles.kicker} data-merch-line>The collection / Merchandise</p>
        <h2 id="cd-merch-title" style={{ "--title-scale": Math.min(1, 11 / (6 + product.brand.length)) } as CSSProperties}><span data-merch-line>COLLECTING</span><span data-merch-line>DOTS <i>×</i> {product.brand.toUpperCase()}</span></h2>
        <p className={styles.introduction} data-merch-line>Premium apparel and accessories<br />in collaboration with {product.brandName}.</p>
      </div>
      <div className={styles.selection}>
        <div className={styles.choices} aria-label="Choose a product">{products.map((item, index) => <button key={item.id} data-merch-choice aria-label={`View ${item.shortName}`} aria-pressed={selected === index} onClick={() => select(index)}><span>{String(index + 1).padStart(2, "0")}</span><span>{item.shortName}</span><i aria-hidden="true" /></button>)}</div>
        <a className={styles.shop} href={product.url} target="_blank" rel="noopener noreferrer" data-merch-line aria-label={`View ${product.shortName} at ${product.brandName}`}>View at {product.brand}<ArrowUpRight size={19} /></a>
        <p className={styles.shopNote} data-merch-line>Sizes, current prices and availability at {product.brand}.</p>
      </div>
      <figure className={styles.mainFigure}>
        <div className={styles.photoWindow}><div className={styles.photoMotion} ref={mainRef}>{products.map((item, index) => <div key={item.id} className={styles.productImages} data-active={selected === index} aria-hidden={selected !== index}>{item.images.map((image, angle) => <div key={image.src} data-angle={angle} data-active={view === angle} aria-hidden={view !== angle}>{photograph(image, item.shortName)}</div>)}</div>)}</div></div>
        <figcaption className={styles.caption} data-merch-line><h3 aria-live="polite">{product.shortName}<span>{product.category}</span></h3><div className={styles.angles} aria-label="Product photographs">{product.images.map((image, index) => <button key={image.src} onClick={() => setView(index)} aria-pressed={view === index}>{image.label}</button>)}</div></figcaption>
        <div className={styles.tag} ref={tagRef} aria-hidden="true"><span className={styles.tagHole} ref={holeRef} data-merch-handoff-dot /><span>COLLECTING<br />DOTS</span><i>×</i><strong>{product.brand.toUpperCase()}</strong><small>{String(selected + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</small></div>
      </figure>
      <button className={styles.nextPiece} ref={nextRef} onClick={() => select(nextIndex)} aria-label={`Next piece: ${next.shortName}`}><span className={styles.nextImage}>{photograph(next.images[0], next.shortName, true)}</span><span className={styles.nextCaption}><span>Next piece<small>{next.shortName}</small></span><ArrowRight size={18} /></span></button>
      <footer className={styles.footer} ref={footerRef}><p>Collecting Dots × {product.brandName}<span>{count(products.length)} pieces. {brands === 1 ? "One collection." : `${count(brands)} collaborations.`}</span></p><span className={styles.counter}>{String(selected + 1).padStart(2, "0")}<i />{String(products.length).padStart(2, "0")}</span><a href={product.url} target="_blank" rel="noopener noreferrer">{product.url.includes("/collections/") ? "Shop full collection" : "Shop this piece"}<ArrowUpRight size={18} /></a></footer>
      <span className={styles.connector} ref={connectorRef} aria-hidden="true" data-merch-connector />
    </div>
  </section>
}

"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"
import { createLiquidGlass, type LiquidGlass, type RevealFocus } from "@/lib/liquid-glass"
import styles from "./liquid-glass-frame.module.css"

const FINE_POINTER = "(hover: hover) and (pointer: fine)"

/** Wraps a single <img>; the canvas reuses that image and adds the liquid reveal on top. */
export default function LiquidGlassFrame({ className, reveal, revealFocus, children }: {
  className?: string
  reveal: string
  revealFocus?: RevealFocus
  children: ReactNode
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const frame = frameRef.current, canvas = canvasRef.current
    const base = frame?.querySelector("img")
    if (!frame || !canvas || !base || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let glass: LiquidGlass | null = null
    let started = false
    const start = () => {
      if (started) return
      started = true
      glass = createLiquidGlass(canvas, { base, revealSrc: reveal, revealFocus })
      if (!glass) canvas.hidden = true
    }
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { start(); visibility.disconnect() }
    }, { rootMargin: "300px" })
    visibility.observe(frame)
    const resize = new ResizeObserver(() => glass?.resize())
    resize.observe(frame)

    const fine = window.matchMedia(FINE_POINTER).matches
    const ease = { duration: .7, ease: "power3.out" }
    gsap.set(frame, { transformPerspective: 900 })
    const drift = {
      x: gsap.quickTo(frame, "x", ease), y: gsap.quickTo(frame, "y", ease),
      rotationX: gsap.quickTo(frame, "rotationX", ease), rotationY: gsap.quickTo(frame, "rotationY", ease),
    }
    // The liquid follows the visible canvas; the tilt reads the resting box so it never feeds back.
    const local = (event: PointerEvent, resting = false) => {
      const rect = canvas.getBoundingClientRect()
      const x = resting ? gsap.getProperty(frame, "x") as number : 0, y = resting ? gsap.getProperty(frame, "y") as number : 0
      return [(event.clientX - rect.left + x) / rect.width, 1 - (event.clientY - rect.top + y) / rect.height] as const
    }
    const enter = (event: PointerEvent) => {
      start()
      if (event.pointerType !== "mouse" || !fine) return
      glass?.enter(...local(event))
      gsap.to(frame, { scale: 1.025, ...ease })
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !fine) return
      glass?.move(...local(event))
      const [x, y] = local(event, true)
      drift.x((x - .5) * 18); drift.y(-(y - .5) * 18)
      drift.rotationY((x - .5) * 9); drift.rotationX((y - .5) * 9)
    }
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      glass?.leave()
      drift.x(0); drift.y(0); drift.rotationX(0); drift.rotationY(0)
      gsap.to(frame, { scale: 1, ...ease })
    }
    // Touch keeps native scrolling; a tap drops a splash of liquid instead.
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      start()
      glass?.burst(...local(event))
    }
    frame.addEventListener("pointerenter", enter)
    frame.addEventListener("pointermove", move)
    frame.addEventListener("pointerleave", leave)
    frame.addEventListener("pointerdown", down)
    return () => {
      visibility.disconnect()
      resize.disconnect()
      frame.removeEventListener("pointerenter", enter)
      frame.removeEventListener("pointermove", move)
      frame.removeEventListener("pointerleave", leave)
      frame.removeEventListener("pointerdown", down)
      gsap.killTweensOf(frame)
      gsap.set(frame, { clearProps: "transform" })
      glass?.dispose()
    }
  // revealFocus is read once per mount; the story passes static values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal])

  return (
    <div className={`${className ?? ""} ${styles.frame}`} ref={frameRef} data-liquid-frame>
      {children}
      <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />
    </div>
  )
}

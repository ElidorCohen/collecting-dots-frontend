"use client"

import { useEffect, useRef } from "react"

type Point = [number, number]
type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number }

const INK = "32, 34, 29"
const CORAL = "250, 85, 60"
const LENS_RADIUS = 120
const LENS_STRENGTH = 30

/**
 * A drafting-table construction around the two story photos: nested frames, circumscribed
 * orbits, extended edges with ticks and a field of dots. The cursor bends it like a lens
 * and collects the nearest dots, while the photos tilt and pour liquid glass above it.
 */
export default function StoryGeometry({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const story = canvas?.closest<HTMLElement>("[data-label-story]")
    const context = canvas?.getContext("2d")
    if (!canvas || !story || !context) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const frames = () => Array.from(story.querySelectorAll<HTMLElement>("[data-story-curator], [data-story-lightbox]"))
    const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, active: 0, target: 0 }
    let width = 1, height = 1, ratio = 1, frame = 0, spin = 0, lastTime = 0
    const mono = getComputedStyle(story).getPropertyValue("--font-jetbrains-mono").trim() || "monospace"

    const measure = (): Box[] => {
      const origin = canvas.getBoundingClientRect()
      return frames().map(figure => {
        const rect = figure.getBoundingClientRect()
        const photo = figure.querySelector<HTMLElement>("[data-liquid-frame]")
        const w = photo?.offsetWidth ?? rect.width, h = photo?.offsetHeight ?? rect.height
        const x = rect.left - origin.left, y = rect.top - origin.top
        return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }
      })
    }
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth; height = canvas.clientHeight
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      schedule()
    }

    // Lens: everything near the cursor swells outward, as if seen through the glass.
    const warp = ([x, y]: Point): Point => {
      if (pointer.active < .001) return [x, y]
      const dx = x - pointer.sx, dy = y - pointer.sy
      const distance = Math.hypot(dx, dy) + .001
      const push = LENS_STRENGTH * pointer.active * Math.exp(-(distance * distance) / (2 * LENS_RADIUS * LENS_RADIUS))
      return [x + dx / distance * push, y + dy / distance * push]
    }
    const rotateAround = (center: Point, angle: number) => ([x, y]: Point): Point => {
      const cos = Math.cos(angle), sin = Math.sin(angle), dx = x - center[0], dy = y - center[1]
      return [center[0] + dx * cos - dy * sin, center[1] + dx * sin + dy * cos]
    }
    const stroke = (points: Point[], alpha: number, closed = false, color = INK, dash: number[] = []) => {
      context.beginPath()
      points.forEach((point, index) => {
        const [x, y] = warp(point)
        if (index) context.lineTo(x, y); else context.moveTo(x, y)
      })
      if (closed) context.closePath()
      context.setLineDash(dash)
      context.strokeStyle = `rgba(${color}, ${alpha})`
      context.stroke()
    }
    const rectangle = (x: number, y: number, w: number, h: number, transform = (p: Point) => p) => {
      const points: Point[] = []
      const corners: Point[] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
      corners.forEach((corner, index) => {
        const next = corners[(index + 1) % 4]
        const steps = Math.max(2, Math.ceil(Math.hypot(next[0] - corner[0], next[1] - corner[1]) / 10))
        for (let step = 0; step < steps; step++) points.push(transform([corner[0] + (next[0] - corner[0]) * step / steps, corner[1] + (next[1] - corner[1]) * step / steps]))
      })
      return points
    }
    const circle = (cx: number, cy: number, r: number, from = 0, to = Math.PI * 2) => {
      const steps = Math.max(24, Math.ceil(r * (to - from) / 8))
      return Array.from({ length: steps + 1 }, (_, index) => {
        const angle = from + (to - from) * index / steps
        return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as Point
      })
    }
    const line = (a: Point, b: Point) => {
      const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12))
      return Array.from({ length: steps + 1 }, (_, index) => [a[0] + (b[0] - a[0]) * index / steps, a[1] + (b[1] - a[1]) * index / steps] as Point)
    }

    const draw = () => {
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      const boxes = measure()
      if (!boxes.length) return
      context.lineWidth = 1
      context.lineCap = "round"
      const dots: { point: Point; size: number; accent?: boolean }[] = []
      const tilt = pointer.active * (pointer.sx - boxes[0].cx) / Math.max(width, 1) * .12

      boxes.forEach((box, boxIndex) => {
        const unit = Math.max(6, box.w * .055)
        const center: Point = [box.cx, box.cy]
        const turn = rotateAround(center, tilt * (boxIndex ? -1.4 : 1))
        // Nested frames that open up like ripples around the photograph.
        ;[1, 2.2, 3.8, 5.8].forEach((step, index) => {
          const pad = unit * step
          stroke(rectangle(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, index > 1 ? turn : undefined), .2 - index * .04)
        })
        // The circumscribed orbit touches the photo corners; a dashed one drifts outside it.
        const radius = Math.hypot(box.w, box.h) / 2
        stroke(circle(box.cx, box.cy, radius), .16, true)
        stroke(circle(box.cx, box.cy, radius + unit * 2.6), .12, true, INK, [2, 7])
        context.lineDashOffset = 0
        const arcStart = -Math.PI * .62 + spin + tilt * 4
        stroke(circle(box.cx, box.cy, radius + unit * 1.3, arcStart, arcStart + Math.PI * .55), .55, false, boxIndex ? INK : CORAL)
        // Corner rays project the frame's diagonals out to the orbit.
        const corners: Point[] = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]]
        corners.forEach(([x, y]) => {
          const dx = x - box.cx, dy = y - box.cy, length = Math.hypot(dx, dy)
          const end: Point = [box.cx + dx / length * (radius + unit * 4.4), box.cy + dy / length * (radius + unit * 4.4)]
          stroke(line([x, y], end), .14)
          dots.push({ point: end, size: 1.6 })
        })
        // Edges continue across the page like drafting guides, with measured ticks.
        if (boxIndex === 0) {
          // Guides stay in the photo column so they never cross the copy or the film.
          const left = box.x - unit * 7, top = box.y - unit * 7
          stroke(line([left, box.y], [width, box.y]), .07)
          stroke(line([left, box.y + box.h], [width, box.y + box.h]), .07)
          stroke(line([box.x, top], [box.x, height]), .07)
          stroke(line([box.x + box.w, top], [box.x + box.w, height]), .07)
          for (let x = box.x + box.w; x < width; x += unit * .8) {
            const major = Math.round((x - box.x - box.w) / (unit * .8)) % 5 === 0
            stroke(line([x, box.y - (major ? 7 : 3)], [x, box.y]), major ? .3 : .16)
          }
          for (let y = box.y + box.h; y < height; y += unit * .8) {
            const major = Math.round((y - box.y - box.h) / (unit * .8)) % 5 === 0
            stroke(line([box.x - (major ? 7 : 3), y], [box.x, y]), major ? .3 : .16)
          }
        }
        for (let index = 0; index < 9; index++) {
          const angle = index / 9 * Math.PI * 2 + boxIndex * .7 + spin * .4
          const r = radius + unit * (index % 2 ? 2.6 : 1.3)
          dots.push({ point: turn([box.cx + Math.cos(angle) * r, box.cy + Math.sin(angle) * r]), size: index % 3 ? 1.8 : 2.6, accent: index === 4 && boxIndex === 0 })
        }
      })
      // A bridge joins the two frames: the connection the section talks about.
      if (boxes[1]) {
        const [a, b] = boxes
        stroke(line([a.x + a.w, a.y + a.h], [b.x, b.y]), .22, false, INK, [3, 5])
        dots.push({ point: [b.x, b.y], size: 3, accent: true })
      }

      // Collect the nearest dots to the cursor.
      const cursor: Point = [pointer.sx, pointer.sy]
      if (pointer.active > .01) {
        const nearest = dots
          .map(dot => ({ dot, distance: Math.hypot(dot.point[0] - cursor[0], dot.point[1] - cursor[1]) }))
          .sort((a, b) => a.distance - b.distance).slice(0, 4)
        nearest.forEach(({ dot, distance }, index) => {
          const alpha = pointer.active * Math.max(0, 1 - distance / 520) * (index ? .35 : .6)
          if (alpha <= 0) return
          context.setLineDash([])
          context.strokeStyle = `rgba(${index ? INK : CORAL}, ${alpha})`
          context.beginPath(); context.moveTo(...cursor); context.lineTo(...warp(dot.point)); context.stroke()
        })
      }
      dots.forEach(({ point, size, accent }) => {
        const [x, y] = warp(point)
        const near = pointer.active * Math.exp(-((x - cursor[0]) ** 2 + (y - cursor[1]) ** 2) / (2 * 90 * 90))
        context.fillStyle = `rgba(${accent || near > .4 ? CORAL : INK}, ${.45 + near * .5})`
        context.beginPath(); context.arc(x, y, size * (1 + near * 1.4), 0, Math.PI * 2); context.fill()
      })

      if (pointer.active > .01) {
        const [x, y] = cursor
        context.setLineDash([])
        context.strokeStyle = `rgba(${INK}, ${.35 * pointer.active})`
        context.beginPath(); context.arc(x, y, 22 + 8 * (1 - pointer.active), 0, Math.PI * 2); context.stroke()
        context.beginPath(); context.moveTo(x - 34, y); context.lineTo(x - 26, y); context.moveTo(x + 26, y); context.lineTo(x + 34, y)
        context.moveTo(x, y - 34); context.lineTo(x, y - 26); context.moveTo(x, y + 26); context.lineTo(x, y + 34); context.stroke()
        context.fillStyle = `rgba(${INK}, ${.55 * pointer.active})`
        context.font = `9px ${mono}, monospace`
        context.fillText(`X ${(x / width).toFixed(3)}  Y ${(y / height).toFixed(3)}`, x + 30, y + 30)
      }
    }

    const tick = (now: number) => {
      frame = 0
      const dt = Math.min((now - (lastTime || now)) / 1000, 1 / 20)
      lastTime = now
      pointer.active += (pointer.target - pointer.active) * Math.min(1, dt * 6)
      pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 10)
      pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 10)
      spin += dt * .05 * (.2 + pointer.active)
      draw()
      const settling = Math.abs(pointer.target - pointer.active) > .002 || Math.hypot(pointer.x - pointer.sx, pointer.y - pointer.sy) > .5
      if (settling || pointer.target > 0) frame = requestAnimationFrame(tick)
      else lastTime = 0
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(tick) }

    const visible = () => story.style.visibility === "visible" && Number(story.style.opacity || 0) > .05
    const move = (event: PointerEvent) => {
      if (reduced || !fine || event.pointerType !== "mouse" || !visible()) return
      const origin = canvas.getBoundingClientRect()
      const x = event.clientX - origin.left, y = event.clientY - origin.top
      const near = measure().some(box => x > box.x - 160 && x < box.x + box.w + 160 && y > box.y - 160 && y < box.y + box.h + 160)
      if (pointer.target === 0 && near) { pointer.sx = x; pointer.sy = y }
      pointer.x = x; pointer.y = y; pointer.target = near ? 1 : 0
      schedule()
    }
    const leave = () => { pointer.target = 0; schedule() }
    const scroll = () => { if (visible()) schedule() }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    frames().forEach(figure => observer.observe(figure))
    window.addEventListener("pointermove", move, { passive: true })
    document.documentElement.addEventListener("pointerleave", leave)
    window.addEventListener("scroll", scroll, { passive: true })
    resize()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("pointermove", move)
      document.documentElement.removeEventListener("pointerleave", leave)
      window.removeEventListener("scroll", scroll)
    }
  }, [])

  return <canvas className={className} ref={canvasRef} aria-hidden="true" data-story-geometry />
}

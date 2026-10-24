"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import type { ArchiveVideo } from "@/lib/archive"
import styles from "./collecting-dots-archive.module.css"

interface Player { destroy(): void }
interface PlayerAPI { Player: new (element: HTMLElement, options: { events: Record<string, (event: { data: number }) => void> }) => Player }
declare global { interface Window { YT?: PlayerAPI; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<PlayerAPI> | undefined
function loadPlayerAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<PlayerAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const timer = window.setTimeout(() => { apiPromise = undefined; reject(new Error("Player unavailable")) }, 15000)
    window.onYouTubeIframeAPIReady = () => {
      previous?.(); clearTimeout(timer)
      if (window.YT?.Player) resolve(window.YT)
      else { apiPromise = undefined; reject(new Error("Player unavailable")) }
    }
    let script = document.getElementById("cd-youtube-player-api") as HTMLScriptElement | null
    if (!script) { script = document.createElement("script"); script.id = "cd-youtube-player-api"; script.src = "https://www.youtube.com/iframe_api"; script.async = true; document.head.appendChild(script) }
    script.onerror = () => { clearTimeout(timer); apiPromise = undefined; script?.remove(); reject(new Error("Player unavailable")) }
  })
  return apiPromise
}

export default function ArchivePlayer({ video }: { video: ArchiveVideo }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState(false)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false, failed = false, player: Player | undefined
    setStatus("loading"); setError(false)
    const iframe = document.createElement("iframe")
    iframe.title = video.title
    iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    iframe.allowFullscreen = true
    iframe.referrerPolicy = "strict-origin-when-cross-origin"
    host.appendChild(iframe)
    const fail = (code: string) => {
      if (disposed || failed) return
      failed = true; clearTimeout(timeout); player?.destroy(); player = undefined; iframe.remove()
      setError(true); setStatus(`error-${code}`)
    }
    const timeout = window.setTimeout(() => fail("timeout"), 15000)
    void loadPlayerAPI().then(api => {
      if (disposed || failed) return
      player = new api.Player(iframe, { events: {
        onReady: () => { if (!disposed && !failed) { clearTimeout(timeout); setStatus("ready") } },
        onStateChange: event => { if (!disposed && !failed) { clearTimeout(timeout); setStatus(event.data === 1 ? "playing" : event.data === 2 ? "paused" : event.data === 0 ? "ended" : "ready") } },
        onAutoplayBlocked: () => { if (!disposed && !failed) { clearTimeout(timeout); setStatus("ready") } },
        onError: event => fail(String(event.data)),
      } })
    }).catch(() => fail("network"))
    return () => { disposed = true; clearTimeout(timeout); player?.destroy(); iframe.remove() }
  }, [video.id, video.title])
  return <div className={styles.playback} data-archive-playback={status}>
    <div className={styles.playerHost} ref={hostRef} hidden={error} />
    {error && <a className={styles.playerFallback} href={video.videoUrl} target="_blank" rel="noopener noreferrer"><img src={video.thumbnail} alt={`Cover for ${video.title}`} width="1280" height="720" /><span><ArrowUpRight size={26} />Watch the full set on YouTube</span></a>}
    <div className={styles.playerMeta}><p>{video.artist}<span>{video.chapter} · {video.location}</span></p><a href={video.videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube<ArrowUpRight size={16} /></a></div>
    <p className={styles.playerStatus} role="status">{error ? status === "error-150" || status === "error-101" ? "YouTube has restricted in-page playback for this recording. The full set is available on YouTube." : "The embedded player is unavailable here. Open the original recording on YouTube to watch." : status === "loading" ? "Opening the recording…" : "Use the player controls to play, pause or watch fullscreen."}</p>
  </div>
}

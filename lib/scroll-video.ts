/** A paused video whose only clock is its owner's scroll timeline. */
export function createScrollVideo(
  video: HTMLVideoElement,
  { onReady, onError, fps = 24, inMemory = () => false }: {
    onReady: (ready: boolean) => void; onError: () => void
    /** The encoded frame rate; a function when the chosen source can change. */
    fps?: number | (() => number)
    /** Download the whole file before scrubbing, so no seek waits on the network. */
    inMemory?: () => boolean
  },
) {
  let fraction = 0
  let frame = 0
  let loaded = false
  let disposed = false
  let lastSeek = -Infinity
  let objectUrl = ""
  let download: AbortController | undefined
  const originalSrc = video.getAttribute("src")
  const rate = () => typeof fps === "function" ? fps() : fps

  const flush = (now: number) => {
    frame = 0
    if (disposed || video.readyState < 2 || !Number.isFinite(video.duration) || video.seeking) return
    const fps = rate(), step = 1 / fps
    const end = Math.max(0, video.duration - step)
    const time = Math.min(end, Math.round(fraction * end / step) * step)
    if (Math.abs(video.currentTime - time) < step * 0.45) return
    if (now - lastSeek < 1000 / fps) {
      frame = window.requestAnimationFrame(flush)
      return
    }
    lastSeek = now
    video.currentTime = time
  }
  const schedule = () => {
    if (!frame && !disposed) frame = window.requestAnimationFrame(flush)
  }
  // The URL the browser would pick: the src attribute, else the first matching <source>.
  const pickSource = () => originalSrc ?? Array.from(video.querySelectorAll("source"))
    .find(source => !source.media || window.matchMedia(source.media).matches)?.src
  const release = () => {
    download?.abort(); download = undefined
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = "" }
  }
  const stream = (src?: string) => {
    if (src) video.src = src
    // Without a downloaded copy, the authored source lets <source> media queries choose again.
    else if (video.getAttribute("src") !== originalSrc) {
      if (originalSrc) video.src = originalSrc
      else video.removeAttribute("src")
    }
    video.preload = "auto"
    video.load()
  }
  const prepare = () => {
    if (loaded || disposed) return
    loaded = true
    release()
    const url = inMemory() ? pickSource() : undefined
    if (!url) { stream(); return }
    const controller = download = new AbortController()
    fetch(url, { signal: controller.signal })
      .then(response => response.ok ? response.blob() : Promise.reject(new Error(String(response.status))))
      .then(blob => {
        if (disposed || download !== controller) return
        download = undefined
        stream(objectUrl = URL.createObjectURL(blob))
      })
      // Streaming still works, only with network waits on unbuffered seeks.
      .catch(() => { if (!disposed && download === controller) { download = undefined; stream() } })
  }
  const ready = () => { if (!disposed) { onReady(true); schedule() } }
  const failed = () => { if (!disposed && video.error) { onReady(false); onError() } }
  const pause = () => video.pause()
  video.pause()
  video.addEventListener("play", pause)
  video.addEventListener("loadeddata", ready)
  video.addEventListener("loadedmetadata", schedule)
  video.addEventListener("seeked", schedule)
  video.addEventListener("error", failed)

  return {
    setProgress(value: number, shouldLoad: boolean) {
      fraction = Math.max(0, Math.min(1, value))
      if (shouldLoad) prepare()
      if (loaded) schedule()
    },
    /** Starts buffering before the scroll reaches this video. */
    preload: prepare,
    reload() {
      onReady(false)
      loaded = false
      prepare()
    },
    refreshSource() {
      if (!loaded) return
      onReady(false)
      loaded = false
      prepare()
    },
    dispose() {
      disposed = true
      window.cancelAnimationFrame(frame)
      release()
      video.pause()
      video.removeEventListener("play", pause)
      video.removeEventListener("loadeddata", ready)
      video.removeEventListener("loadedmetadata", schedule)
      video.removeEventListener("seeked", schedule)
      video.removeEventListener("error", failed)
    },
  }
}

/** A paused video whose only clock is its owner's scroll timeline. */
export function createScrollVideo(
  video: HTMLVideoElement,
  { onReady, onError, fps = 24 }: { onReady: (ready: boolean) => void; onError: () => void; fps?: number },
) {
  let fraction = 0
  let frame = 0
  let loaded = false
  let disposed = false
  let lastSeek = -Infinity
  const step = 1 / fps

  const flush = (now: number) => {
    frame = 0
    if (disposed || video.readyState < 2 || !Number.isFinite(video.duration) || video.seeking) return
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
  const prepare = () => {
    if (loaded || disposed) return
    loaded = true
    video.preload = "auto"
    video.load()
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
      video.pause()
      video.removeEventListener("play", pause)
      video.removeEventListener("loadeddata", ready)
      video.removeEventListener("loadedmetadata", schedule)
      video.removeEventListener("seeked", schedule)
      video.removeEventListener("error", failed)
    },
  }
}

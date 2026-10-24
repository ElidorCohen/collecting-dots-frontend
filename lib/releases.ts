export const LABEL_PLAYLIST = "https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ"

export interface LabelRelease {
  id: string
  title: string
  artist: string
  albumId: string
  albumTitle: string
  artwork: string
  artworkSet: string
  year: string
  releaseDate: string
  duration: string
  url: string
  previewUrl: string | null
}

type FeedTrack = {
  id?: string
  name?: string
  artists?: { name: string }[]
  album?: { id?: string; name?: string; images?: { url: string; width: number; height: number }[]; release_date?: string }
  duration_ms?: number
  external_urls?: { spotify?: string }
  preview_url?: string | null
  deezer_preview_url?: string | null
}

export function mapLabelReleases(rows: { track?: FeedTrack | null }[]): LabelRelease[] {
  const seen = new Set<string>()
  return rows.flatMap(({ track }) => {
    if (!track?.id || !track.name || seen.has(track.id)) return []
    seen.add(track.id)
    const images = [...(track.album?.images ?? [])].filter(image => image.url).sort((a, b) => b.width - a.width)
    const duration = track.duration_ms
      ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor(track.duration_ms % 60000 / 1000)).padStart(2, "0")}`
      : ""
    return [{
      id: track.id, title: track.name,
      artist: track.artists?.map(artist => artist.name).join(", ") || "Collecting Dots",
      albumId: track.album?.id || track.id,
      albumTitle: track.album?.name || track.name,
      artwork: images[0]?.url || "/placeholder.svg",
      artworkSet: images.filter(image => image.width > 0).map(image => `${image.url} ${image.width}w`).join(", "),
      year: track.album?.release_date?.slice(0, 4) || "",
      releaseDate: track.album?.release_date || "",
      duration,
      url: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
      previewUrl: track.preview_url || track.deezer_preview_url || null,
    }]
  }).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
}

export function selectFeaturedReleases(releases: LabelRelease[], limit = 8): LabelRelease[] {
  const albums = new Set<string>()
  return releases.filter(release => {
    if (!release.previewUrl || albums.has(release.albumId)) return false
    albums.add(release.albumId)
    return true
  }).slice(0, limit)
}

export async function fetchLabelReleases(signal: AbortSignal): Promise<LabelRelease[]> {
  const response = await fetch("/api/get-playlist-data", { signal })
  const result = await response.json()
  if (!response.ok || !result.success || !Array.isArray(result.data?.tracks)) throw new Error("Releases unavailable")
  return mapLabelReleases(result.data.tracks)
}

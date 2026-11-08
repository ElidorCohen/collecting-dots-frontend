export interface LabelArtist {
  id: string
  name: string
  image: string
  imageSet?: string
  editorial: boolean
  /** Spotify's 0–100 score, when Spotify sends one. */
  popularity: number | null
  links: { label: string; url: string }[]
}

interface ArtistRow {
  artist_name?: string
  artist_instagram_username?: string
  artist_soundcloud?: string
  artist_spotify?: string
  artist_beatport?: string
  image?: string
  popularity?: number | null
}

const OMRI_ID = "36jn1T9teX1BHEJYcPoazX"

function externalUrl(value?: string) {
  try {
    const url = new URL(value || "")
    return ["https:", "http:"].includes(url.protocol) ? url.href : ""
  } catch { return "" }
}

export function mapLabelArtists(rows: ArtistRow[]): LabelArtist[] {
  const seen = new Set<string>()
  const artists = rows.flatMap(row => {
    const name = row.artist_name?.trim()
    if (!name) return []
    const id = row.artist_spotify?.match(/\/artist\/([a-zA-Z0-9]+)/)?.[1] || name.toLocaleLowerCase()
    if (seen.has(id)) return []
    seen.add(id)
    const editorial = id === OMRI_ID
    const instagram = row.artist_instagram_username?.trim().replace(/^@/, "")
    const links = [
      { label: "Instagram", url: instagram ? externalUrl(`https://instagram.com/${instagram}`) : "" },
      { label: "SoundCloud", url: externalUrl(row.artist_soundcloud) },
      { label: "Spotify", url: externalUrl(row.artist_spotify) },
      { label: "Beatport", url: externalUrl(row.artist_beatport) },
    ].filter(link => link.url)
    return [{
      id, name, editorial, links,
      popularity: typeof row.popularity === "number" ? row.popularity : null,
      image: editorial ? "/media/artists/omri-seated-1920.webp" : externalUrl(row.image),
      imageSet: editorial ? [640, 1280, 1920].map(width => `/media/artists/omri-seated-${width}.webp ${width}w`).join(", ") : undefined,
    }]
  })
  // OMRI. leads; then the most popular, with unscored artists keeping the dashboard's order
  return artists.sort((a, b) => Number(b.editorial) - Number(a.editorial) || (b.popularity ?? -1) - (a.popularity ?? -1))
}

export async function fetchLabelArtists(signal: AbortSignal): Promise<LabelArtist[]> {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
  // The local preview reads the public live roster without copying Dropbox secrets.
  // Deployed hosts retain the existing dashboard -> Dropbox -> Spotify endpoint.
  const response = await fetch(local ? "/api/artists-preview" : "/api/get-artists-data", { signal })
  const result = await response.json()
  if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error("Artists unavailable")
  return mapLabelArtists(result.data)
}

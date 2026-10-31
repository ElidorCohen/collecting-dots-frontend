export interface LabelEvent {
  id: string
  title: string
  venue: string
  city: string
  country: string
  location: string
  date: string
  day: string
  month: string
  year: string
  timestamp: number
  time: string
  artists: string[]
  url: string
  instagram: string
  mock: boolean
  /** Position in the events file; the dashboard appends, so higher means added later. */
  added: number
}
export interface EventRow {
  event_title?: string
  location?: string
  date?: string
  times?: string
  artists?: string
  event_external_url?: string
  event_instagram_post?: string
}

function publicUrl(value?: string) {
  try { const url = new URL(value || ""); return ["http:", "https:"].includes(url.protocol) ? url.href : "" } catch { return "" }
}

export function mapLabelEvents(rows: EventRow[], mock = false): LabelEvent[] {
  const seen = new Set<string>()
  return rows.flatMap((row, added) => {
    if (!row || typeof row.event_title !== "string" || typeof row.date !== "string") return []
    const title = row.event_title.trim(), match = row.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!title || !match) return []
    const [day, month, year] = match.slice(1).map(Number), date = new Date(year, month - 1, day, 12)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return []
    const location = typeof row.location === "string" ? row.location.trim() : ""
    const places = location.split(",").map(value => value.trim()).filter(Boolean)
    const id = `${row.date}:${title}:${location}`
    if (seen.has(id)) return []
    seen.add(id)
    return [{ id, title, venue: places[0] || "Venue to be announced", city: places[1] || places[0] || "To be announced", country: places.slice(2).join(", "), location,
      date: `${String(day).padStart(2, "0")} ${date.toLocaleDateString("en-GB", { month: "long" })} ${year}`,
      day: String(day).padStart(2, "0"), month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(), year: String(year), timestamp: date.getTime(),
      time: typeof row.times === "string" ? row.times : "", artists: typeof row.artists === "string" ? row.artists.split(",").map(value => value.trim()).filter(Boolean) : [],
      url: mock ? "" : publicUrl(row.event_external_url), instagram: mock ? "" : publicUrl(row.event_instagram_post), mock, added,
    }]
  })
}

export function partitionEvents(events: LabelEvent[], today = new Date()) {
  const boundary = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return { upcoming: events.filter(event => event.timestamp >= boundary).sort((a, b) => a.timestamp - b.timestamp), past: events.filter(event => event.timestamp < boundary).sort((a, b) => b.timestamp - a.timestamp) }
}

/** The main section: upcoming events, latest additions first, then those from the last 30 days. */
export function featuredEvents(events: LabelEvent[], today = new Date()) {
  const { upcoming, past } = partitionEvents(events, today)
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30).getTime()
  const current = [...upcoming.sort((a, b) => b.added - a.added), ...past.filter(event => event.timestamp >= cutoff)]
  return (current.length ? current : past).slice(0, 3)
}

export const MOCK_EVENTS = mapLabelEvents([
  { event_title: "Collecting Dots · Cape Town", location: "The Harbour — concept venue, Cape Town, South Africa", date: "14/11/2026", times: "18:00 — Late", artists: "OMRI., Rafael, The Botanist" },
  { event_title: "Collecting Dots · Tel Aviv", location: "After Dark — concept venue, Tel Aviv, Israel", date: "28/11/2026", times: "22:00 — Late", artists: "OMRI., N.O.Y, Dor Danino" },
  { event_title: "Collecting Dots · Amsterdam", location: "The Warehouse — concept venue, Amsterdam, Netherlands", date: "12/12/2026", times: "21:00 — Late", artists: "OMRI., TOBEHONEST, Balanka" },
  { event_title: "Collecting Dots · Berlin", location: "Night Studies — concept venue, Berlin, Germany", date: "19/09/2026", times: "23:00 — Late", artists: "OMRI., Adaru, Bonafique" },
], true)

export const EVENT_BACKDROPS = [
  { base: "/media/events/gathering", width: 2400, height: 1600, alt: "A real Collecting Dots crowd gathered around the decks under warm venue lights", position: "50% 50%" },
  { base: "/media/events/after-dark", width: 2400, height: 3200, alt: "Hands raised in a real Collecting Dots crowd at night", position: "50% 55%" },
  { base: "/media/events/cape-dusk", width: 2048, height: 3072, alt: "The supplied Cape Town venue photograph at dusk", position: "50% 65%" },
]

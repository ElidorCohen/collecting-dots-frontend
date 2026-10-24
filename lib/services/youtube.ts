import savedArchive from "@/lib/youtube-archive-snapshot.json"

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  duration: string
  viewCount: string
  videoUrl: string
}
export interface YouTubeChannelVideosResponse {
  videos: YouTubeVideo[]
  channelId: string
  channelTitle: string
  totalVideos: number
  source: "channel" | "feed" | "saved"
  fetchedAt: string
}

export const DEFAULT_CHANNEL_HANDLE = "@CollectingDotsRecords"
const VIDEO_ID = /^[\w-]{11}$/
const CHANNEL_ID = /^UC[\w-]{22}$/
const text = (value: any): string => typeof value === "string" ? value : value?.simpleText || value?.content || value?.runs?.map((run: any) => run.text || "").join("") || ""
const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }
  if (!code.startsWith("#")) return named[code.toLowerCase()] || entity
  const number = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
  return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity
})

export function channelPath(input: string): string {
  let value = input.trim()
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value)
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) throw new Error("Invalid YouTube channel")
    value = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\/(videos|featured|streams|shorts)$/, "")
  }
  if (CHANNEL_ID.test(value)) return `channel/${value}`
  if (/^(channel\/UC[\w-]{22}|(?:c|user)\/[\w.-]+)$/.test(value)) return value
  value = value.replace(/^@/, "")
  if (!/^[\p{L}\p{N}_.-]{3,100}$/u.test(value)) throw new Error("Invalid YouTube channel")
  return `@${encodeURIComponent(value)}`
}

// Read balanced JSON: scripts may span lines and contain braces inside strings.
export function extractInitialData(html: string): any {
  const assignment = /(?:var\s+ytInitialData|window\[\s*["']ytInitialData["']\s*\]|ytInitialData)\s*=\s*/g.exec(html)
  if (!assignment) return null
  const start = html.indexOf("{", assignment.index + assignment[0].length)
  let depth = 0, quoted = false, escaped = false
  for (let i = start; i >= 0 && i < html.length; i++) {
    const char = html[i]
    if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; continue }
    if (char === '"') quoted = true
    else if (char === "{") depth++
    else if (char === "}" && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)) } catch { return null } }
  }
  return null
}

export function parseChannelVideos(data: any, limit = 50): YouTubeVideo[] {
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || []
  const tab = tabs.find((item: any) => item.tabRenderer?.selected)?.tabRenderer || tabs.find((item: any) => item.tabRenderer?.content)?.tabRenderer
  const videos: YouTubeVideo[] = [], seen = new Set<string>()
  const add = (id: string, title: string, duration: string, viewCount: string, publishedAt: string, thumbnail: string) => {
    if (!VIDEO_ID.test(id || "") || !title || seen.has(id) || videos.length >= limit) return
    seen.add(id); videos.push({ id, title, duration, viewCount, publishedAt, thumbnail: thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, description: "", videoUrl: `https://www.youtube.com/watch?v=${id}` })
  }
  const walk = (node: any) => {
    if (!node || typeof node !== "object" || videos.length >= limit) return
    if (node.videoRenderer) {
      const video = node.videoRenderer
      add(video.videoId, text(video.title), text(video.lengthText), text(video.viewCountText).replace(/\s+views?$/i, ""), text(video.publishedTimeText), video.thumbnail?.thumbnails?.at(-1)?.url || "")
      return
    }
    if (node.lockupViewModel) {
      const video = node.lockupViewModel, metadata = video.metadata?.lockupMetadataViewModel
      const parts = metadata?.metadata?.contentMetadataViewModel?.metadataRows?.flatMap((row: any) => row.metadataParts || []) || []
      const badges = video.contentImage?.thumbnailViewModel?.overlays?.flatMap((overlay: any) => overlay.thumbnailBottomOverlayViewModel?.badges || []) || []
      add(video.contentId, text(metadata?.title), text(badges.find((badge: any) => /^\d+(?::\d{2}){1,2}$/.test(badge.thumbnailBadgeViewModel?.text || ""))?.thumbnailBadgeViewModel?.text), text(parts.find((part: any) => /views?/i.test(part.accessibilityLabel || ""))?.text), text(parts.find((part: any) => /ago/i.test(part.accessibilityLabel || ""))?.text), video.contentImage?.thumbnailViewModel?.image?.sources?.at(-1)?.url || "")
      return
    }
    Object.values(node).forEach(walk)
  }
  walk(tab?.content)
  return videos
}

export function parseVideoFeed(xml: string): YouTubeVideo[] {
  const value = (entry: string, tag: string) => decodeXml(entry.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "")
  return Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)).flatMap(match => {
    const entry = match[1], id = value(entry, "yt:videoId")
    if (!VIDEO_ID.test(id)) return []
    return [{ id, title: value(entry, "title"), description: value(entry, "media:description"), publishedAt: value(entry, "published"), thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, duration: "", viewCount: "", videoUrl: `https://www.youtube.com/watch?v=${id}` }]
  })
}

export class YouTubeService {
  async getChannelVideos(input = DEFAULT_CHANNEL_HANDLE, maxResults = 50): Promise<YouTubeChannelVideosResponse> {
    const path = channelPath(input), limit = Math.max(1, Math.min(50, Math.floor(maxResults) || 50))
    const defaultChannel = path.toLowerCase() === "@collectingdotsrecords" || path === `channel/${savedArchive.channelId}`
    let channelId = path.startsWith("channel/") ? path.slice(8) : defaultChannel ? savedArchive.channelId : ""
    let channelTitle = defaultChannel ? savedArchive.channelTitle : input
    const request = async (url: string) => {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(10000), next: { revalidate: 900 } })
      if (!response.ok) throw new Error(`YouTube returned ${response.status}`)
      return response.text()
    }
    try {
      const html = await request(`https://www.youtube.com/${path}/videos`), data = extractInitialData(html)
      const metadata = data?.metadata?.channelMetadataRenderer
      channelId = metadata?.externalId || channelId
      channelTitle = metadata?.title || channelTitle
      const videos = parseChannelVideos(data, limit)
      // Empty parser output must not become a successful empty archive.
      if (videos.length) return { videos, channelId, channelTitle, totalVideos: videos.length, source: "channel", fetchedAt: new Date().toISOString() }
    } catch { /* Try the official feed next. */ }
    if (CHANNEL_ID.test(channelId)) {
      try {
        const videos = parseVideoFeed(await request(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)).slice(0, limit)
        if (videos.length) return { videos, channelId, channelTitle, totalVideos: videos.length, source: "feed", fetchedAt: new Date().toISOString() }
      } catch { /* The verified selection is available for the default channel. */ }
    }
    if (defaultChannel) {
      const videos = savedArchive.videos.slice(0, limit)
      return { videos, channelId, channelTitle, totalVideos: videos.length, source: "saved", fetchedAt: savedArchive.checkedAt }
    }
    throw new Error("The YouTube archive is temporarily unavailable")
  }
}

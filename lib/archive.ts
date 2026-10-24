import snapshot from "./youtube-archive-snapshot.json"
import type { YouTubeVideo } from "./services/youtube"

export interface ArchiveVideo extends YouTubeVideo { artist: string; chapter: string; location: string }
export const ARCHIVE_CHANNEL = "https://www.youtube.com/@CollectingDotsRecords/videos"

export function mapArchiveVideos(input: YouTubeVideo[]): ArchiveVideo[] {
  const seen = new Set<string>()
  return input.flatMap(video => {
    if (!/^[\w-]{11}$/.test(video.id || "") || !video.title || seen.has(video.id)) return []
    seen.add(video.id)
    const parts = video.title.split("|").map(part => part.trim()).filter(Boolean)
    return [{ ...video, artist: parts.length > 1 ? parts[0] : "Collecting Dots", chapter: parts.length > 1 ? parts[1] : video.title, location: parts.length > 2 ? parts.at(-1)! : "Live recording", thumbnail: `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`, videoUrl: `https://www.youtube.com/watch?v=${video.id}` }]
  })
}
export const SAVED_RECORDINGS = mapArchiveVideos(snapshot.videos)
export function featureRecordings(videos: ArchiveVideo[]) {
  const opener = videos.find(video => video.id === "1zMYUk8E3Mw")
  return (opener ? [opener, ...videos.filter(video => video.id !== opener.id)] : videos).slice(0, 4)
}

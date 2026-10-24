export const MAX_DEMO_FILES = 10
export const MAX_DEMO_BYTES = 150 * 1024 * 1024
export const DEMOS_CLOSED_MESSAGE = "We're currently under high load and will be accepting demos again soon."
export const DEMO_ACCEPT = ".mp3,.wav,audio/mpeg,audio/wav"
export type DemoTrack = { file: File; trackTitle: string }
export type DemoDetails = { artistName: string; fullName: string; email: string; instagram: string; beatport: string; facebook: string; x: string }
export const EMPTY_DEMO_DETAILS: DemoDetails = { artistName: "", fullName: "", email: "", instagram: "", beatport: "", facebook: "", x: "" }
export const validDemoEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
export function demoExtension(name: string) { const index = name.lastIndexOf("."); return index < 0 ? "" : name.slice(index).toLowerCase() }
export function collectDemoFiles(files: File[], existingCount: number) {
  const accepted: DemoTrack[] = [], errors: string[] = []
  for (const file of files) {
    const extension = demoExtension(file.name)
    if (![".mp3", ".wav"].includes(extension)) { errors.push(`${file.name}: choose an MP3 or WAV file.`); continue }
    if (file.size > MAX_DEMO_BYTES) { errors.push(`${file.name}: the limit is 150 MB per track.`); continue }
    if (existingCount + accepted.length >= MAX_DEMO_FILES) { errors.push(`${file.name}: a submission can contain up to 10 tracks.`); continue }
    accepted.push({ file, trackTitle: file.name.slice(0, -extension.length) })
  }
  return { accepted, error: errors.join(" ") }
}
export function validDemoDetails(details: DemoDetails) {
  return Boolean(details.artistName.trim() && details.fullName.trim() && validDemoEmail(details.email) && details.instagram.trim())
}
export function demoFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

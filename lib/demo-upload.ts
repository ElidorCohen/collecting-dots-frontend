import { demoExtension, type DemoDetails, type DemoTrack } from "./demo-submission"

export type DemoUploadStep = "idle" | "verifying" | "getting_link" | "uploading" | "confirming"
export type DemoUploadProgress = { step: DemoUploadStep; percent: number; index: number; name: string }
type UploadOptions = {
  tracks: DemoTrack[]; details: DemoDetails
  getToken: (index: number) => Promise<string>
  onProgress: (progress: DemoUploadProgress) => void
  request?: typeof fetch
  upload?: (url: string, file: File, progress: (fraction: number) => void) => Promise<{ content_hash?: string }>
}

async function responseJson(response: Response) {
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(await response.text() || `Unexpected server response (${response.status}).`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`)
  return data
}

// Keep audio bytes out of the Vercel request body: send directly to the temporary Dropbox URL.
export function uploadDemoBinary(url: string, file: File, progress: (fraction: number) => void): Promise<{ content_hash?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener("progress", event => { if (event.lengthComputable) progress(event.loaded / event.total) })
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({}) }
      } else reject(new Error(xhr.status === 410 ? "Upload link expired. Please try again." : xhr.status === 409 ? "Upload conflict. Please try a different track title." : `Upload failed (${xhr.status}).`))
    })
    xhr.addEventListener("error", () => reject(new Error("Network error during upload. Please check your connection and try again.")))
    xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")))
    xhr.open("POST", url); xhr.setRequestHeader("Content-Type", "application/octet-stream"); xhr.send(file)
  })
}

export async function uploadDemoBatch({ tracks, details, getToken, onProgress, request = fetch, upload = uploadDemoBinary }: UploadOptions) {
  let demoId: string | undefined
  for (let index = 0; index < tracks.length; index++) {
    const { file, trackTitle } = tracks[index]
    const percent = (fraction = 0) => Math.round(((index + fraction) / tracks.length) * 100)
    const report = (step: DemoUploadStep, fraction = 0) => onProgress({ step, percent: percent(fraction), index: index + 1, name: file.name })
    try {
      report("verifying")
      const token = await getToken(index)
      report("getting_link")
      const link = await responseJson(await request("/api/get-upload-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_name: details.artistName, track_title: trackTitle, file_extension: demoExtension(file.name), cf_turnstile_response: token }),
      }))
      report("uploading")
      const result = await upload(link.upload_url, file, fraction => report("uploading", fraction))
      report("confirming", 1)
      const confirmation = await responseJson(await request("/api/confirm-demo-upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: link.session_id, file_path: link.file_path, content_hash: result.content_hash || null,
          suppress_email: index < tracks.length - 1, artist_name: details.artistName, track_title: trackTitle,
          email: details.email, full_name: details.fullName, instagram_username: details.instagram,
          beatport: details.beatport || undefined, facebook: details.facebook || undefined, x_twitter: details.x || undefined }),
      }))
      demoId = confirmation.demo_id
    } catch (error) { throw new Error(`Failed on "${file.name}": ${error instanceof Error ? error.message : "Please try again."}`) }
  }
  return { demoId, count: tracks.length }
}

// Run with: node --test tests/youtube-archive.test.cjs
const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const root = path.resolve(__dirname, "..")
const snapshot = require("../lib/youtube-archive-snapshot.json")
const output = ts.transpileModule(fs.readFileSync(path.join(root, "lib/services/youtube.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
const loaded = { exports: {} }
new Function("require", "exports", "module", output)(name => {
  if (name === "@/lib/youtube-archive-snapshot.json") return snapshot
  throw new Error(`Unexpected import: ${name}`)
}, loaded.exports, loaded)
const { extractInitialData, parseChannelVideos, parseVideoFeed, channelPath, YouTubeService } = loaded.exports
const id = "1zMYUk8E3Mw"
const wrap = contents => ({ contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { selected: true, content: { richGridRenderer: { contents } } } }] } } })
const modern = { richItemRenderer: { content: { lockupViewModel: {
  contentId: id,
  metadata: { lockupMetadataViewModel: { title: { content: "OMRI. | Dots On Cape Town" }, metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: { content: "34K" }, accessibilityLabel: "34 thousand views" }, { text: { content: "10mo ago" }, accessibilityLabel: "10 months ago" }] }] } } } },
  contentImage: { thumbnailViewModel: { image: { sources: [{ url: "https://i.ytimg.com/vi/1zMYUk8E3Mw/hq720.jpg" }] }, overlays: [{ thumbnailBottomOverlayViewModel: { badges: [{ thumbnailBadgeViewModel: { text: "2:41:36" } }] } }] } },
} } } }
const feed = `<feed><entry><yt:videoId>${id}</yt:videoId><title>OMRI. &amp; Friends &#x26; Dots</title><published>2025-12-10T16:16:00Z</published></entry></feed>`

test("current lockup format returns videos instead of a successful empty archive", () => {
  const videos = parseChannelVideos(wrap([modern, modern]))
  assert.equal(videos.length, 1)
  assert.equal(videos[0].id, id)
  assert.equal(videos[0].duration, "2:41:36")
  assert.equal(videos[0].viewCount, "34K")
})

test("legacy renderer and multiline JSON with quoted braces remain supported", () => {
  const title = 'A {live} set with "quotes"'
  const data = wrap([{ richItemRenderer: { content: { videoRenderer: { videoId: id, title: { runs: [{ text: title }] }, lengthText: { simpleText: "2:41:36" } } } } }])
  const parsed = extractInitialData(`var ytInitialData =\n${JSON.stringify(data, null, 2)};`)
  assert.equal(parseChannelVideos(parsed)[0].title, title)
  assert.equal(extractInitialData("var ytInitialData = {broken}"), null)
})

test("official feed decodes entities and retains original watch URL", () => {
  const video = parseVideoFeed(feed)[0]
  assert.equal(video.title, "OMRI. & Friends & Dots")
  assert.equal(video.videoUrl, `https://www.youtube.com/watch?v=${id}`)
  assert.equal(parseVideoFeed("<entry><yt:videoId>bad</yt:videoId></entry>").length, 0)
})

test("handles and channel-ID URLs resolve on YouTube only", () => {
  assert.equal(channelPath("@CollectingDotsRecords"), "@CollectingDotsRecords")
  assert.equal(channelPath(`https://www.youtube.com/channel/${snapshot.channelId}`), `channel/${snapshot.channelId}`)
  assert.equal(channelPath("https://www.youtube.com/@CollectingDotsRecords/videos"), "@CollectingDotsRecords")
  assert.throws(() => channelPath("https://example.com/@CollectingDotsRecords"))
  assert.throws(() => channelPath("../private"))
})

test("an empty channel parser falls through to the official feed", async () => {
  const previous = global.fetch
  global.fetch = async url => ({ ok: true, text: async () => url.includes("/feeds/") ? feed : "<html>changed format</html>" })
  try {
    const result = await new YouTubeService().getChannelVideos()
    assert.equal(result.source, "feed")
    assert.equal(result.totalVideos, 1)
  } finally { global.fetch = previous }
})

test("a provider outage retains the verified label selection, with a saved marker", async () => {
  const previous = global.fetch
  global.fetch = async () => { throw new Error("Provider offline") }
  try {
    const result = await new YouTubeService().getChannelVideos(undefined, 2)
    assert.equal(result.source, "saved")
    assert.equal(result.fetchedAt, snapshot.checkedAt)
    assert.equal(result.totalVideos, 2)
    await assert.rejects(() => new YouTubeService().getChannelVideos("@UnrelatedChannel"))
  } finally { global.fetch = previous }
})

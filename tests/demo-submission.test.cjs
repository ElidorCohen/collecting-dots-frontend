const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
function load(relative) {
  const filename = path.join(__dirname, "..", relative)
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const loaded = { exports: {} }
  new Function("require", "exports", "module", code)(name => name.startsWith(".") ? load(path.relative(path.join(__dirname, ".."), path.resolve(path.dirname(filename), `${name}.ts`))) : require(name), loaded.exports, loaded)
  return loaded.exports
}
const { collectDemoFiles, MAX_DEMO_BYTES, validDemoDetails } = load("lib/demo-submission.ts")
const { uploadDemoBatch, uploadDemoBinary } = load("lib/demo-upload.ts")
const file = (name, size = 100, type = "") => ({ name, size, type })
const details = { artistName: "Test Artist", fullName: "Test Person", email: "test@example.com", instagram: "@example", beatport: "https://example.com/artist", facebook: "https://example.com/page", x: "https://example.com/profile" }
const ok = data => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })

test("audio selection respects extension, 150 MB per file and ten-track batch across selections", () => {
  const result = collectDemoFiles([file("Keep.Me.WAV", MAX_DEMO_BYTES), file("not-audio.png"), file("too-large.mp3", MAX_DEMO_BYTES + 1), file("last.mp3"), file("overflow.wav")], 8)
  assert.deepEqual(result.accepted.map(track => track.trackTitle), ["Keep.Me", "last"])
  for (const name of ["not-audio.png", "too-large.mp3", "overflow.wav"]) assert.ok(result.error.includes(name))
  assert.equal(collectDemoFiles([file("mime-only", 100, "audio/mpeg")], 0).accepted.length, 0)
})
test("all existing required details remain mandatory; optional profiles stay optional", () => {
  assert.ok(validDemoDetails({ ...details, beatport: "", facebook: "", x: "" }))
  for (const name of ["artistName", "fullName", "email", "instagram"]) assert.equal(validDemoDetails({ ...details, [name]: " " }), false)
  assert.equal(validDemoDetails({ ...details, email: "invalid" }), false)
})
test("two-track upload keeps original API payloads, direct binary transfer, fresh tokens and one confirmation email", async () => {
  const requests = [], binaries = [], tokens = [], progress = []
  const tracks = [{ file: file("first.WAV"), trackTitle: "First" }, { file: file("second.mp3"), trackTitle: "Second" }]
  const result = await uploadDemoBatch({ tracks, details,
    getToken: async index => { tokens.push(index); return `unique-token-${index}` },
    request: async (url, options) => {
      const body = JSON.parse(options.body); requests.push({ url, body })
      return url.endsWith("get-upload-link") ? ok({ upload_url: `https://dropbox.example/${body.track_title}`, file_path: `/demos/submitted/${body.track_title}`, session_id: body.track_title }) : ok({ demo_id: body.track_title })
    },
    upload: async (url, binary, report) => { binaries.push({ url, binary }); report(.5); return { content_hash: "hash" } },
    onProgress: value => progress.push(value),
  })
  assert.deepEqual(tokens, [0, 1])
  assert.equal(result.demoId, "Second"); assert.equal(result.count, 2)
  assert.equal(binaries[0].binary, tracks[0].file); assert.equal(binaries[1].binary, tracks[1].file)
  const links = requests.filter(entry => entry.url.endsWith("get-upload-link")), confirmations = requests.filter(entry => entry.url.endsWith("confirm-demo-upload"))
  assert.deepEqual(links.map(entry => entry.body.file_extension), [".wav", ".mp3"])
  assert.deepEqual(links.map(entry => entry.body.cf_turnstile_response), ["unique-token-0", "unique-token-1"])
  assert.deepEqual(confirmations.map(entry => entry.body.suppress_email), [true, false])
  assert.equal(confirmations[0].body.email, details.email); assert.equal(confirmations[0].body.instagram_username, details.instagram)
  for (const key of ["full_name", "beatport", "facebook", "x_twitter", "session_id", "file_path", "content_hash"]) assert.ok(confirmations[0].body[key])
  assert.ok(progress.some(entry => entry.percent === 25)); assert.ok(progress.some(entry => entry.percent === 75)); assert.equal(progress.at(-1).percent, 100)
})
test("closed-inbox response blocks binary upload and later batch files", async () => {
  let uploads = 0, requests = 0
  await assert.rejects(uploadDemoBatch({ tracks: [{ file: file("first.mp3"), trackTitle: "First" }, { file: file("second.mp3"), trackTitle: "Second" }], details,
    getToken: async () => "token", onProgress: () => {},
    request: async () => { requests++; return new Response(JSON.stringify({ error: "Submissions are closed" }), { status: 503, headers: { "Content-Type": "application/json" } }) },
    upload: async () => { uploads++; return {} },
  }), /first.mp3.*Submissions are closed/)
  assert.equal(uploads, 0); assert.equal(requests, 1)
})
test("binary transfer sends raw audio, reports progress, parses the Dropbox hash and reports expired links", async () => {
  const previous = global.XMLHttpRequest
  let xhr
  global.XMLHttpRequest = class {
    constructor() { xhr = this; this.events = {}; this.upload = { addEventListener: (event, callback) => { this.progress = callback } } }
    addEventListener(event, callback) { this.events[event] = callback }
    open(method, url) { this.method = method; this.url = url }
    setRequestHeader(name, value) { this.header = [name, value] }
    send(body) { this.body = body }
  }
  try {
    const fractions = [], audio = file("demo.wav"), pending = uploadDemoBinary("https://dropbox.example/upload", audio, fraction => fractions.push(fraction))
    assert.equal(xhr.body, audio); assert.equal(xhr.method, "POST"); assert.deepEqual(xhr.header, ["Content-Type", "application/octet-stream"])
    xhr.progress({ lengthComputable: true, loaded: 25, total: 100 }); assert.deepEqual(fractions, [.25])
    xhr.status = 200; xhr.responseText = '{"content_hash":"verified"}'; xhr.events.load(); assert.equal((await pending).content_hash, "verified")
    const expired = uploadDemoBinary("https://dropbox.example/expired", audio, () => {})
    xhr.status = 410; xhr.events.load(); await assert.rejects(expired, /expired/)
  } finally { global.XMLHttpRequest = previous }
})

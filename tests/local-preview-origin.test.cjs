const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const { NextRequest } = require("next/server")
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../proxy.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = { exports: {} }
new Function("require", "exports", "module", compiled)(require, loaded.exports, loaded)
const { proxy } = loaded.exports
function request(url, method = "GET") { return new NextRequest(url, { method, headers: { host: new URL(url).host } }) }

test("numeric local pages redirect to localhost, retaining port/path/query", () => {
  const response = proxy(request("http://127.0.0.1:3101/opener/original?compare=1"))
  assert.equal(response.status, 307)
  assert.equal(response.headers.get("location"), "http://localhost:3101/opener/original?compare=1")
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.equal(proxy(request("http://127.0.0.1:4200/", "HEAD")).headers.get("location"), "http://localhost:4200/")
})
test("localhost and public deployment hosts are not redirected", () => {
  for (const host of ["localhost:3101", "collectingdots.com", "www.collectingdots.com", "collecting-dots-preview.vercel.app"]) {
    assert.equal(proxy(request(`http://${host}/opener`)).headers.get("location"), null)
  }
})
test("API, assets and writes are not redirected", () => {
  for (const path of ["/api/get-youtube-videos", "/media/hero/film.mp4", "/_next/static/app.js"]) {
    assert.equal(proxy(request(`http://127.0.0.1:3101${path}`)).headers.get("location"), null)
  }
  assert.equal(proxy(request("http://127.0.0.1:3101/", "POST")).headers.get("location"), null)
})

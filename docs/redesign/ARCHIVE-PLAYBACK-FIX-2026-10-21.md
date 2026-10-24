# Inline YouTube playback: local origin fix

The failure was specific to the numeric local embedding origin, rather than the recordings or the GSAP/archive integration.

An isolated HTML page containing a plain official YouTube iframe reproduced the unavailable error on `http://127.0.0.1:3104`. YouTube's own developer example loaded there. Loading the same HTML and the same OMRI Cape Town recording on `http://localhost:3104` played successfully; the underlying video reached 16.22s with `paused: false` and a 9695.521s duration.

The unchanged archive player on `http://localhost:3101/opener#sets` also played all four sets:

| Recording | YouTube ID | Observed duration | Player state |
| --- | --- | --- | --- |
| OMRI Cape Town | 1zMYUk8E3Mw | 9695.521s | playing; advanced to 53.74s |
| Dor Danino Cape Town | KDMoWIpuitA | 4943.521s | playing; video unpaused |
| OMRI Mexico City | oLuQXGdWsgc | 9156.121s | playing; video unpaused |
| OMRI Los Angeles | 8FIIqSgCi8w | 5765.041s | playing; video unpaused |

`proxy.ts` now sends local GET/HEAD page visits on literal `127.0.0.1` to `localhost`. It preserves the requested port, path and query; the browser retains the fragment. The redirect is temporary and not cached. The matcher is limited to the root and opener pages. Requests already on localhost, public domains, API routes, assets and writes are unchanged. It does not falsify a production origin or proxy YouTube media; the real containing page is served on localhost.

No iframe or playback changes were required. The existing error/timeout fallback remains for actual deleted/private/restricted recordings or network errors. There is no redirect to YouTube during normal playback. The previously observed 150 error did not establish that the owner had disabled embedding; the successful same-recording comparison resolves that earlier uncertainty.

Verification: production build and standalone TypeScript passed. Three new regression tests passed (`node --test tests/local-preview-origin.test.cjs`): redirect preservation, public/localhost host isolation, and exclusion of API/assets/writes. HTTP checks returned 307 for the numeric preview URL with query preserved; localhost and a local request with the public Host header returned 200 without redirect. The isolated diagnostic server was stopped. No deployment, channel settings change, dependencies or source-video modification.

The user's existing `127.0.0.1:3101/opener#sets` browser tab was reloaded after the build. It automatically reached `localhost:3101/opener#sets`, retaining the archive fragment. The on-site player reached `playing` with the correct full duration, then was paused at 49.06s for review. Playback controls and seeking were checked. Temporary viewport overrides were reset.

Evidence: `media-inbox/archive/playback-fix/omri-cape-town-playing.png` and `on-site-player-verified.png`. The prior player source is retained in `media-inbox/archive/playback-fix/before/`.

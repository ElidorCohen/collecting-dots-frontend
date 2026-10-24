/**
 * A small WebGL2 stable-fluids simulation whose dye becomes a liquid-glass mask.
 * The base photo is refracted through a bevelled rim and the reveal photo shows inside.
 * Outside the liquid the canvas is fully transparent, so the real <img> stays visible.
 */

type Target = { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number }
type DoubleTarget = { read: Target; write: Target; swap: () => void }
type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }

/** Lands the reveal photo's `from` point (0–1, top-left origin) on the frame's `to` point at `zoom`. */
export type RevealFocus = { from: [number, number]; to: [number, number]; zoom: number }

export type LiquidGlassOptions = {
  base: HTMLImageElement
  revealSrc: string
  revealFocus?: RevealFocus
}

export type LiquidGlass = {
  move: (x: number, y: number) => void
  enter: (x: number, y: number) => void
  leave: () => void
  burst: (x: number, y: number) => void
  resize: () => void
  dispose: () => void
}

const SIM_RESOLUTION = 128
const DYE_RESOLUTION = 640
const PRESSURE_ITERATIONS = 18
const CURL = 10
const VELOCITY_DISSIPATION = 0.9
const DYE_DISSIPATION = 0.75
const SPLAT_FORCE = 5200
const TRAIL_RADIUS = 0.0045
const LENS_RADIUS = 0.009
const IDLE_AFTER = 3600

const vertexShader = `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 texelSize;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const header = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
`

const shaders = {
  splat: `${header}
uniform sampler2D uTarget;
uniform float aspectRatio, radius, clampMax;
uniform vec3 color;
uniform vec2 point;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 value = texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color;
  if (clampMax > 0.0) value = min(value, vec3(clampMax));
  fragColor = vec4(value, 1.0);
}`,
  advection: `${header}
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,
  divergence: `${header}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  curl: `${header}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${header}
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${header}
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  fragColor = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${header}
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  fragColor = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`,
  fade: `${header}
uniform sampler2D uTexture;
uniform float value;
void main() { fragColor = value * texture(uTexture, vUv); }`,
  composite: `${header}
uniform sampler2D uBase, uReveal, uDye;
uniform vec4 uBaseCover, uRevealCover;
uniform float uAspect, uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// Dye density, roughened by drifting noise so the edge reads as liquid rather than a blur.
float field(vec2 uv) {
  float d = texture(uDye, uv).r;
  vec2 q = vec2(uv.x * uAspect, uv.y);
  float n = noise(q * 5.0 + vec2(uTime * 0.18, -uTime * 0.11)) * 0.7 + noise(q * 11.0 - uTime * 0.23) * 0.3;
  return d + (n - 0.5) * 0.16 * smoothstep(0.02, 0.35, d);
}
vec2 cover(vec2 uv, vec4 c) { return uv * c.xy + c.zw; }
vec3 dispersed(sampler2D image, vec4 c, vec2 uv, vec2 offset) {
  return vec3(
    texture(image, cover(uv + offset * 1.22, c)).r,
    texture(image, cover(uv + offset, c)).g,
    texture(image, cover(uv + offset * 0.78, c)).b
  );
}
void main() {
  float f = field(vUv);
  float alpha = smoothstep(0.25, 0.3, f);
  if (alpha <= 0.0) { fragColor = vec4(0.0); return; }

  vec2 e = vec2(0.008 / uAspect, 0.008);
  vec2 slope = vec2(field(vUv + vec2(e.x, 0.0)) - field(vUv - vec2(e.x, 0.0)), field(vUv + vec2(0.0, e.y)) - field(vUv - vec2(0.0, e.y)));
  float inside = smoothstep(0.36, 0.41, f);
  float rim = smoothstep(0.25, 0.37, f) * (1.0 - smoothstep(0.41, 0.66, f));

  // Glass thickness bends both photos along the slope of the liquid.
  vec2 bend = -slope * (0.14 * rim + 0.02);
  vec3 base = dispersed(uBase, uBaseCover, vUv, bend * 1.4);
  vec3 reveal = dispersed(uReveal, uRevealCover, (vUv - 0.5) * 0.965 + 0.5, bend);
  vec3 color = mix(base, reveal, inside);

  vec3 normal = normalize(vec3(-slope * 9.0, 1.0));
  vec3 light = normalize(vec3(-0.55, 0.65, 0.75));
  float diffuse = dot(normal, light);
  float specular = pow(max(dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  float fresnel = pow(1.0 - normal.z, 1.6);
  float edge = 1.0 - smoothstep(0.0, 0.03, abs(f - 0.385));

  color *= mix(1.0, 0.7 + 0.42 * diffuse, rim);
  color += specular * rim * 0.9 + fresnel * rim * 0.4 + edge * 0.28;
  color = mix(color, color * vec3(0.99, 1.0, 1.03), rim);
  fragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
}`,
}

export function createLiquidGlass(canvas: HTMLCanvasElement, { base, revealSrc, revealFocus }: LiquidGlassOptions): LiquidGlass | null {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" })
  if (!gl) return null
  if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return null

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed")
    return shader
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexShader)
  const createProgram = (source: string): Program => {
    const program = gl.createProgram()!
    gl.attachShader(program, vertex)
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source))
    gl.bindAttribLocation(program, 0, "aPosition")
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Program failed")
    const uniforms: Program["uniforms"] = {}
    for (let index = 0; index < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); index++) {
      const name = gl.getActiveUniform(program, index)!.name
      uniforms[name] = gl.getUniformLocation(program, name)
    }
    return { program, uniforms }
  }

  let programs: Record<keyof typeof shaders, Program>
  try {
    programs = Object.fromEntries(Object.entries(shaders).map(([name, source]) => [name, createProgram(source)])) as typeof programs
  } catch (error) {
    console.warn("Liquid glass disabled:", error)
    return null
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)
  gl.disable(gl.BLEND)

  const createTarget = (width: number, height: number): Target => {
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { texture, fbo, width, height }
  }
  const createDouble = (width: number, height: number): DoubleTarget => {
    const pair = { read: createTarget(width, height), write: createTarget(width, height), swap() { [pair.read, pair.write] = [pair.write, pair.read] } }
    return pair
  }
  const destroyTarget = (target?: Target) => {
    if (!target) return
    gl.deleteTexture(target.texture)
    gl.deleteFramebuffer(target.fbo)
  }
  const createImageTexture = (image?: HTMLImageElement) => {
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([233, 229, 220, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, image ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    if (image) gl.generateMipmap(gl.TEXTURE_2D)
    return texture
  }

  let disposed = false
  const textures = { base: createImageTexture(), reveal: createImageTexture() }
  const aspects = { base: 1, reveal: 1 }
  const loadInto = (key: "base" | "reveal", image: HTMLImageElement) => {
    if (disposed || !image.naturalWidth) return
    gl.deleteTexture(textures[key])
    textures[key] = createImageTexture(image)
    aspects[key] = image.naturalWidth / image.naturalHeight
  }
  const onBaseLoad = () => loadInto("base", base)
  if (base.complete) onBaseLoad()
  else base.addEventListener("load", onBaseLoad, { once: true })
  const reveal = new Image()
  reveal.decoding = "async"
  reveal.onload = () => loadInto("reveal", reveal)
  reveal.src = revealSrc

  let velocity: DoubleTarget, dye: DoubleTarget, pressure: DoubleTarget, divergence: Target, curl: Target
  let width = 1, height = 1, aspect = 1
  const basePosition: [number, number] = [0.5, 0.5]

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const nextWidth = Math.max(1, Math.round(canvas.clientWidth * ratio)), nextHeight = Math.max(1, Math.round(canvas.clientHeight * ratio))
    const position = getComputedStyle(base).objectPosition.split(" ").map(value => value.endsWith("%") ? parseFloat(value) / 100 : 0.5)
    basePosition[0] = position[0] ?? 0.5
    basePosition[1] = position[1] ?? 0.5
    if (nextWidth === width && nextHeight === height && velocity) return
    width = canvas.width = nextWidth
    height = canvas.height = nextHeight
    aspect = width / height
    const scale = (resolution: number) => aspect >= 1 ? [Math.round(resolution * aspect), resolution] : [resolution, Math.round(resolution / aspect)]
    const [simWidth, simHeight] = scale(SIM_RESOLUTION)
    const [dyeWidth, dyeHeight] = scale(Math.min(DYE_RESOLUTION, Math.min(width, height)))
    for (const pair of [velocity, dye, pressure]) { destroyTarget(pair?.read); destroyTarget(pair?.write) }
    destroyTarget(divergence); destroyTarget(curl)
    velocity = createDouble(simWidth, simHeight)
    pressure = createDouble(simWidth, simHeight)
    dye = createDouble(dyeWidth, dyeHeight)
    divergence = createTarget(simWidth, simHeight)
    curl = createTarget(simWidth, simHeight)
  }

  const use = ({ program }: Program) => gl.useProgram(program)
  const bind = (program: Program, name: string, target: Target, unit: number) => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, target.texture)
    gl.uniform1i(program.uniforms[name], unit)
  }
  const draw = (target: Target | null) => {
    if (target) { gl.viewport(0, 0, target.width, target.height); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo) }
    else { gl.viewport(0, 0, width, height); gl.bindFramebuffer(gl.FRAMEBUFFER, null) }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  const splat = (x: number, y: number, dx: number, dy: number, amount: number, radius: number) => {
    const program = programs.splat
    use(program)
    gl.uniform1f(program.uniforms.aspectRatio, aspect)
    gl.uniform2f(program.uniforms.point, x, y)
    gl.uniform1f(program.uniforms.radius, radius)
    gl.uniform2f(program.uniforms.texelSize, 1 / velocity.read.width, 1 / velocity.read.height)
    bind(program, "uTarget", velocity.read, 0)
    gl.uniform3f(program.uniforms.color, dx * SPLAT_FORCE, dy * SPLAT_FORCE, 0)
    gl.uniform1f(program.uniforms.clampMax, 0)
    draw(velocity.write); velocity.swap()
    if (amount <= 0) return
    gl.uniform2f(program.uniforms.texelSize, 1 / dye.read.width, 1 / dye.read.height)
    bind(program, "uTarget", dye.read, 0)
    gl.uniform3f(program.uniforms.color, amount, 0, 0)
    gl.uniform1f(program.uniforms.clampMax, 1)
    draw(dye.write); dye.swap()
  }

  const step = (dt: number) => {
    const texel = [1 / velocity.read.width, 1 / velocity.read.height] as const
    let program = programs.curl
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uVelocity", velocity.read, 0); draw(curl)

    program = programs.vorticity
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uVelocity", velocity.read, 0); bind(program, "uCurl", curl, 1)
    gl.uniform1f(program.uniforms.curl, CURL); gl.uniform1f(program.uniforms.dt, dt)
    draw(velocity.write); velocity.swap()

    program = programs.divergence
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uVelocity", velocity.read, 0); draw(divergence)

    program = programs.fade
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uTexture", pressure.read, 0); gl.uniform1f(program.uniforms.value, 0.8)
    draw(pressure.write); pressure.swap()

    program = programs.pressure
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uDivergence", divergence, 0)
    for (let index = 0; index < PRESSURE_ITERATIONS; index++) {
      bind(program, "uPressure", pressure.read, 1)
      draw(pressure.write); pressure.swap()
    }

    program = programs.gradient
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel)
    bind(program, "uPressure", pressure.read, 0); bind(program, "uVelocity", velocity.read, 1)
    draw(velocity.write); velocity.swap()

    program = programs.advection
    use(program); gl.uniform2f(program.uniforms.texelSize, ...texel); gl.uniform1f(program.uniforms.dt, dt)
    bind(program, "uVelocity", velocity.read, 0); bind(program, "uSource", velocity.read, 0)
    gl.uniform1f(program.uniforms.dissipation, VELOCITY_DISSIPATION)
    draw(velocity.write); velocity.swap()
    bind(program, "uVelocity", velocity.read, 0); bind(program, "uSource", dye.read, 1)
    gl.uniform1f(program.uniforms.dissipation, DYE_DISSIPATION)
    draw(dye.write); dye.swap()
  }

  // object-fit: cover with object-position, expressed as uv * scale + offset.
  const cover = (imageAspect: number, [px, py]: [number, number]) => {
    const sx = Math.min(1, aspect / imageAspect), sy = Math.min(1, imageAspect / aspect)
    return [sx, sy, (1 - sx) * px, (1 - sy) * (1 - py)] as const
  }
  const focus = (imageAspect: number) => {
    if (!revealFocus) return cover(imageAspect, [0.5, 0.5])
    const [sx, sy] = cover(imageAspect, [0.5, 0.5])
    const { from, to, zoom } = revealFocus
    return [sx / zoom, sy / zoom, from[0] - to[0] * sx / zoom, 1 - from[1] - (1 - to[1]) * sy / zoom] as const
  }
  const composite = (time: number) => {
    const program = programs.composite
    use(program)
    gl.uniform2f(program.uniforms.texelSize, 1 / dye.read.width, 1 / dye.read.height)
    gl.uniform1f(program.uniforms.uAspect, aspect)
    gl.uniform1f(program.uniforms.uTime, time)
    gl.uniform4f(program.uniforms.uBaseCover, ...cover(aspects.base, basePosition))
    gl.uniform4f(program.uniforms.uRevealCover, ...focus(aspects.reveal))
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures.base); gl.uniform1i(program.uniforms.uBase, 0)
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures.reveal); gl.uniform1i(program.uniforms.uReveal, 1)
    bind(program, "uDye", dye.read, 2)
    gl.clearColor(0, 0, 0, 0)
    draw(null)
  }

  let frame = 0
  let lastTime = 0
  let hovering = false
  let lastInput = 0
  const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false }
  const bursts: [number, number][] = []

  const tick = (now: number) => {
    frame = 0
    if (disposed) return
    const dt = Math.min((now - (lastTime || now)) / 1000 || 1 / 60, 1 / 30)
    lastTime = now
    if (pointer.moved) {
      const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py
      const travel = Math.hypot(dx * aspect, dy)
      // Interpolate fast strokes so the trail stays a continuous ribbon.
      const steps = Math.min(8, Math.max(1, Math.ceil(travel / 0.025)))
      for (let index = 1; index <= steps; index++) {
        const t = index / steps
        splat(pointer.px + dx * t, pointer.py + dy * t, dx / steps, dy / steps, 0.85 / steps + 0.12, TRAIL_RADIUS)
      }
      pointer.px = pointer.x; pointer.py = pointer.y; pointer.moved = false
    }
    // A resident drop keeps a glass lens under a resting cursor.
    if (hovering) splat(pointer.x, pointer.y, 0, 0, 3.2 * dt, LENS_RADIUS)
    while (bursts.length) {
      const [x, y] = bursts.pop()!
      for (let index = 0; index < 5; index++) {
        const angle = index / 5 * Math.PI * 2 + Math.random()
        splat(x, y, Math.cos(angle) * 0.012, Math.sin(angle) * 0.012, 0.5, LENS_RADIUS * 1.4)
      }
    }
    step(dt)
    composite(now / 1000)
    if (hovering || now - lastInput < IDLE_AFTER) frame = requestAnimationFrame(tick)
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); lastTime = 0 }
  }
  const wake = () => {
    lastInput = performance.now()
    if (!frame && !disposed) frame = requestAnimationFrame(tick)
  }

  const onContextLost = (event: Event) => { event.preventDefault(); disposed = true; cancelAnimationFrame(frame) }
  canvas.addEventListener("webglcontextlost", onContextLost)
  resize()

  return {
    enter(x, y) { hovering = true; pointer.x = pointer.px = x; pointer.y = pointer.py = y; wake() },
    move(x, y) { pointer.x = x; pointer.y = y; pointer.moved = true; wake() },
    leave() { hovering = false; wake() },
    burst(x, y) { bursts.push([x, y]); pointer.x = pointer.px = x; pointer.y = pointer.py = y; wake() },
    resize() { if (!disposed) { resize(); if (!frame) wake() } },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      base.removeEventListener("load", onBaseLoad)
      reveal.onload = null
      canvas.removeEventListener("webglcontextlost", onContextLost)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

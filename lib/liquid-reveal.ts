/**
 * Full-screen metaball reveal: each collected dot becomes a glass droplet of the film.
 * The droplets merge and flood the screen; outside them the canvas is transparent.
 * It is driven by the scroll clock only, so scrubbing backwards replays it exactly.
 */

export const MAX_DROPS = 12

export type LiquidReveal = {
  /** drops: [x, y, radius] triples in CSS pixels from the top-left of the canvas. */
  render: (drops: Float32Array, time: number, source: TexImageSource & { width?: number }) => void
  clear: () => void
  resize: () => void
  dispose: () => void
}

const vertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() { vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`

const fragmentShader = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uImage;
uniform vec4 uCover;
uniform vec2 uResolution;
uniform vec3 uDrops[${MAX_DROPS}];
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec3 sampleFilm(vec2 uv, vec2 offset) {
  return vec3(
    texture(uImage, (uv + offset * 1.25) * uCover.xy + uCover.zw).r,
    texture(uImage, (uv + offset) * uCover.xy + uCover.zw).g,
    texture(uImage, (uv + offset * 0.75) * uCover.xy + uCover.zw).b
  );
}
void main() {
  vec2 p = vUv * uResolution;
  float field = 0.0;
  vec2 gradient = vec2(0.0);
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    vec3 drop = uDrops[i];
    if (drop.z <= 0.0) continue;
    vec2 d = p - drop.xy;
    float d2 = dot(d, d) + 1.0;
    // A steep (r/d)^4 falloff keeps droplets distinct until they truly touch.
    float v = drop.z * drop.z / d2;
    field += v * v;
    gradient += -4.0 * v * v / d2 * d;
  }
  // Half the log of the field is 0 on the surface; its slope gives a scale-free normal.
  float level = 0.5 * log(max(field, 1e-10));
  float wobble = noise(p / 85.0 + vec2(uTime, -uTime * 0.7)) * 0.65 + noise(p / 33.0 - uTime * 1.3) * 0.35;
  level += (wobble - 0.5) * 0.32 * (1.0 - smoothstep(0.15, 0.9, level));
  float alpha = smoothstep(-0.1, 0.0, level);
  if (alpha <= 0.0) { fragColor = vec4(0.0); return; }

  vec2 inward = 0.5 * gradient / max(field, 1e-10);
  float slope = length(inward);
  vec2 direction = slope > 0.0 ? inward / slope : vec2(0.0);
  float rim = smoothstep(-0.1, 0.06, level) * (1.0 - smoothstep(0.06, 0.55, level));
  // The thick edge of each droplet bends the film towards its centre.
  vec2 bend = -direction * rim * 22.0 / uResolution;
  vec3 color = sampleFilm(vUv, bend);

  vec3 normal = normalize(vec3(-direction * rim * 1.35, 1.0));
  vec3 light = normalize(vec3(-0.5, 0.7, 0.8));
  float specular = pow(max(dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  float edge = 1.0 - smoothstep(0.0, 0.05, abs(level - 0.01));
  color *= mix(1.0, 0.68 + 0.45 * dot(normal, light), rim);
  color += specular * rim * 0.85 + edge * 0.3 + pow(1.0 - normal.z, 1.5) * rim * 0.4;
  fragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
}`

export function createLiquidReveal(canvas: HTMLCanvasElement): LiquidReveal | null {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
  if (!gl) return null
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed")
    return shader
  }
  const program = gl.createProgram()!
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader))
    gl.bindAttribLocation(program, 0, "aPosition")
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Program failed")
  } catch (error) {
    console.warn("Liquid reveal disabled:", error)
    return null
  }
  gl.useProgram(program)
  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const uniforms = { image: uniform("uImage"), cover: uniform("uCover"), resolution: uniform("uResolution"), drops: uniform("uDrops"), time: uniform("uTime") }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(uniforms.image, 0)

  let width = 1, height = 1, cssWidth = 1, cssHeight = 1, lost = false, empty = true
  let uploaded: unknown = null
  const flipped = new Float32Array(MAX_DROPS * 3)
  const resize = () => {
    cssWidth = Math.max(1, canvas.clientWidth); cssHeight = Math.max(1, canvas.clientHeight)
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    width = canvas.width = Math.round(cssWidth * ratio)
    height = canvas.height = Math.round(cssHeight * ratio)
    empty = true
  }
  const onLost = (event: Event) => { event.preventDefault(); lost = true }
  canvas.addEventListener("webglcontextlost", onLost)
  resize()

  return {
    render(drops, time, source) {
      if (lost) return
      // A paused video only needs a fresh upload when it may show a different frame.
      if (source instanceof HTMLVideoElement || uploaded !== source) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
        uploaded = source
      }
      const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : (source as HTMLImageElement).naturalWidth
      const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : (source as HTMLImageElement).naturalHeight
      const aspect = cssWidth / cssHeight, imageAspect = sourceWidth / Math.max(1, sourceHeight)
      const sx = Math.min(1, aspect / imageAspect), sy = Math.min(1, imageAspect / aspect)
      for (let index = 0; index < MAX_DROPS; index++) {
        flipped[index * 3] = drops[index * 3]
        flipped[index * 3 + 1] = cssHeight - drops[index * 3 + 1]
        flipped[index * 3 + 2] = drops[index * 3 + 2]
      }
      gl.viewport(0, 0, width, height)
      gl.uniform4f(uniforms.cover, sx, sy, (1 - sx) / 2, (1 - sy) / 2)
      gl.uniform2f(uniforms.resolution, cssWidth, cssHeight)
      gl.uniform3fv(uniforms.drops, flipped)
      gl.uniform1f(uniforms.time, time)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      empty = false
    },
    clear() {
      if (lost || empty) return
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      empty = true
    },
    resize,
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

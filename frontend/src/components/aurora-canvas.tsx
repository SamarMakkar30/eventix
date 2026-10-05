/* ═══════════════════════════════════════════════════════════════════════════
   AURORA CANVAS — hand-written WebGL shader backdrop for the hero.
   Silk-like domain-warped noise in burgundy / crimson / brass over
   obsidian, with a faint starfield. Zero dependencies.

   Behaviour:
   · Falls back silently (renders nothing) when WebGL is unavailable —
     the CSS gradient behind the canvas carries the look.
   · Pauses when the tab is hidden or the canvas leaves the viewport.
   · Renders a single static frame under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_pointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res.xy) / min(u_res.x, u_res.y);

  // gentle pointer parallax
  vec2 drift = (u_pointer - 0.5) * 0.12;
  vec2 q = p * 1.6 + drift;

  // domain-warped silk
  float t = u_time * 0.05;
  vec2 w1 = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, 1.3 - t)));
  vec2 w2 = vec2(fbm(q + 3.4 * w1 + vec2(1.7, 9.2) + 0.3 * t),
                 fbm(q + 3.4 * w1 + vec2(8.3, 2.8) - 0.26 * t));
  float silk = fbm(q + 2.6 * w2);

  // aurora bands
  float band1 = smoothstep(0.42, 0.78, silk + 0.18 * sin(p.x * 2.4 + t * 3.0));
  float band2 = smoothstep(0.55, 0.9, fbm(q * 0.7 - w1 * 1.4 + t * 0.6));
  float band3 = smoothstep(0.62, 0.95, fbm(q * 1.3 + w2 * 0.9 - t * 0.4));

  // palette — obsidian base, burgundy/crimson silks, brass highlight
  vec3 base    = vec3(0.055, 0.035, 0.042);
  vec3 wine    = vec3(0.30, 0.075, 0.115);
  vec3 crimson = vec3(0.52, 0.14, 0.21);
  vec3 brass   = vec3(0.72, 0.56, 0.30);

  vec3 col = base;
  col = mix(col, wine,    band1 * 0.62);
  col = mix(col, crimson, band2 * 0.42);
  col = mix(col, brass,   band3 * band1 * 0.35);

  // horizon glow
  float glow = exp(-abs(p.y + 0.62 + 0.08 * sin(p.x + t)) * 2.6);
  col += wine * glow * 0.34;
  col += brass * pow(glow, 3.0) * 0.22;

  // starfield (upper half)
  vec2 sp = gl_FragCoord.xy / u_res.y * 220.0;
  float star = pow(max(hash(floor(sp)), 0.001), 42.0);
  float twinkle = 0.75 + 0.25 * sin(u_time * (0.6 + hash(floor(sp)) * 1.7));
  col += vec3(0.9, 0.87, 0.8) * star * twinkle * smoothstep(-0.05, 0.65, p.y) * 0.7;

  // vignette
  float vig = smoothstep(1.35, 0.35, length(p * vec2(0.85, 1.05)));
  col *= 0.45 + 0.55 * vig;

  // filmic-ish tone, kept moody — this sits behind hero copy
  col = clamp(col, 0.0, 4.0);
  col = col / (col + 0.95);
  col *= 0.82;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // CSS fallback stays visible

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), // fullscreen triangle
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uPointer = gl.getUniformLocation(prog, "u_pointer");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    let raf = 0;
    const running = true;
    let visible = true;
    let start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (now: number) => {
      if (!running) return;
      if (visible) {
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, (now - start) / 1000);
        gl.uniform2f(uPointer, pointer.x, pointer.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = 1 - e.clientY / window.innerHeight;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !reduced) {
        start = performance.now() - lastElapsed;
        if (!raf) raf = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    let lastElapsed = 0;
    const wrapDraw = (now: number) => {
      lastElapsed = now - start;
      draw(now);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    resize();
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(reduced ? wrapDraw : draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

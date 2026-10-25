// Print pass — turns any picture (codex art, a video frame, a pixel-play frame) into a Sunday-funnies panel:
// four press plates (black line art solid, cyan, magenta, yellow at their screen angles as Ben-Day dots),
// a touch of misregistration, aged newsprint. `amount` runs the press: 0 = the source, 1 = fully printed.
import * as THREE from 'three';

export const INK = { paper: '#f2e8d0', c: '#3fa3cf', m: '#e0507a', y: '#f7d64a', k: '#1d1a1c' };
const rgb = hex => new THREE.Vector3(...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));

const FRAG = /* glsl */`
  uniform sampler2D tSrc, tLight; uniform vec2 res, srcRes, origin; uniform vec4 crop;
  uniform float cell, amount, exposure, flash, levels, misreg, nearest, grain, lightOn;
  uniform vec3 paper, inkC, inkM, inkY, inkK;
  vec3 src(vec2 px) {                                         // output px (top-left origin) → source colour
    vec2 uv = crop.xy + px / res * crop.zw;
    if (nearest > 0.5) uv = (floor(uv * srcRes) + 0.5) / srcRes;
    vec3 c = clamp(texture2D(tSrc, vec2(uv.x, 1.0 - uv.y)).rgb * exposure + flash, 0.0, 1.0);
    // light falling on the picture (a map over the output): a spot in a dim room is several times the light the picture
    // was painted in, so it multiplies what it lands on (a lit black suit stays darkish, a cream tile burns white), plus a
    // little scatter. It goes in before the plates are made, so it prints in dots like everything else.
    if (lightOn > 0.5) c = min(c + texture2D(tLight, vec2(px.x / res.x, 1.0 - px.y / res.y)).rgb * (c * 4.0 + 0.12), 1.0);
    return c;
  }
  vec4 cmyk(vec3 c) { float k = 1.0 - max(max(c.r, c.g), c.b); return vec4(k < 0.999 ? (1.0 - c - k) / (1.0 - k) : vec3(0.0), k); }
  float post(float v) { return floor(v * levels + 0.5) / levels; }
  float screen(vec2 px, float ang, float v) {                // one plate's dot at this pixel for coverage v
    if (v < 0.04) return 0.0;
    float s = sin(ang), c = cos(ang);
    vec2 p = mat2(c, -s, s, c) * (px - origin) / cell;
    // dot area tracks coverage (a 50% tint really is half ink), merging into solid only near 100%
    float r = mix(sqrt(v / 3.14159), 0.75, smoothstep(0.7, 1.0, v)), d = length(fract(p) - 0.5), aa = 0.8 / cell;
    return 1.0 - smoothstep(r - aa, r + aa, d);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
    vec3 base = src(px);
    vec2 oc = vec2(0.8, -0.5) * misreg, om = vec2(-0.6, 0.7) * misreg, oy = vec2(0.4, 0.4) * misreg;
    float vy = post(cmyk(src(px + oy)).z), vm = post(cmyk(src(px + om)).y), vc = post(cmyk(src(px + oc)).x);
    float k = cmyk(base).w;
    float line = smoothstep(0.70, 0.80, k);                   // ink lines and spotted blacks print solid
    float kd = screen(px, 0.785, post(clamp(k * 1.2, 0.0, 0.85))) * (1.0 - line);
    // the black plate goes down first, then cyan, magenta, yellow: a dark frame stays dark the whole way (no flash of bare paper)
    float wK = smoothstep(0.0, 0.45, amount), wC = smoothstep(0.15, 0.6, amount), wM = smoothstep(0.3, 0.75, amount), wY = smoothstep(0.45, 0.9, amount);
    float n = hash(floor(px / 2.0)) - 0.5;
    // the plates print onto the frame itself, which only turns into newsprint as they go down: never a frame paler than both ends
    vec3 col = mix(base, paper * (1.0 + grain * n), smoothstep(0.25, 0.85, amount));
    col *= mix(vec3(1.0), inkY, screen(px, 0.0, vy) * wY);
    col *= mix(vec3(1.0), inkM, screen(px, 1.309, vm) * wM);
    col *= mix(vec3(1.0), inkC, screen(px, 0.262, vc) * wC);
    col *= mix(vec3(1.0), inkK, max(line, kd) * wK * (0.94 + 0.12 * n));
    gl_FragColor = vec4(col, 1.0);
  }`;

// uv rect [x, y, w, h] (top-left origin) that covers a dw×dh box from a sw×sh source, centred on (fx, fy), zoomed in by `zoom`
export function coverCrop(sw, sh, dw, dh, fx = 0.5, fy = 0.5, zoom = 1) {
  const sa = sw / sh, da = dw / dh;
  let w = 1, h = 1;
  if (sa > da) w = da / sa; else h = sa / da;
  w /= zoom; h /= zoom;
  return [Math.min(1 - w, Math.max(0, fx - w / 2)), Math.min(1 - h, Math.max(0, fy - h / 2)), w, h];
}

export class Print {
  // canvas: draw straight onto a visible canvas (the live transition); omit for an offscreen baker that copies into targets
  constructor(canvas) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false });
    this.r.setPixelRatio(1);
    this.r.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.u = {
      tSrc: { value: null }, tLight: { value: null }, lightOn: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, srcRes: { value: new THREE.Vector2(1, 1) }, origin: { value: new THREE.Vector2() },
      crop: { value: new THREE.Vector4(0, 0, 1, 1) }, cell: { value: 8 }, amount: { value: 1 }, exposure: { value: 1 }, flash: { value: 0 },
      levels: { value: 4 }, misreg: { value: 1.6 }, nearest: { value: 0 }, grain: { value: 0.06 },
      paper: { value: rgb(INK.paper) }, inkC: { value: rgb(INK.c) }, inkM: { value: rgb(INK.m) }, inkY: { value: rgb(INK.y) }, inkK: { value: rgb(INK.k) },
    };
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.u, depthTest: false, depthWrite: false,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG,
    })));
    this.cam = new THREE.Camera();
    this.tex = new Map();
  }
  texOf(src, nearest) {
    let t = this.tex.get(src);
    if (!t) {
      t = src instanceof HTMLVideoElement ? new THREE.VideoTexture(src) : new THREE.Texture(src);
      t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace;
      this.tex.set(src, t);
    }
    // a picture never changes, so it goes to the GPU once (a panel re-printed every frame would otherwise send its art
    // again each time); canvases and video frames go every time
    const f = nearest ? THREE.NearestFilter : THREE.LinearFilter;
    if (t.version === 0 || t.minFilter !== f || !(src instanceof HTMLImageElement)) { t.minFilter = t.magFilter = f; t.needsUpdate = true; }
    return t;
  }
  forget(src) { this.tex.get(src)?.dispose(); this.tex.delete(src); }
  // renders src at w×h (device px); returns the canvas holding the result
  // inks: override the paper / plate colours for this print (covers ran on whiter, slicker stock than the newsprint inside)
  // light: a canvas of light (black = none) laid over the output before it's printed
  render(src, w, h, { crop, cell = 8, amount = 1, exposure = 1, flash = 0, nearest = false, origin = [0, 0], misreg = 1.6, levels = 4, inks, light } = {}) {
    const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
    if (this.r.domElement.width !== w || this.r.domElement.height !== h) this.r.setSize(w, h, false);
    const u = this.u;
    u.tSrc.value = this.texOf(src, nearest); u.res.value.set(w, h); u.srcRes.value.set(sw, sh);
    u.tLight.value = light ? this.texOf(light, false) : null; u.lightOn.value = light ? 1 : 0;
    u.crop.value.set(...(crop || coverCrop(sw, sh, w, h)));
    u.cell.value = cell; u.amount.value = amount; u.exposure.value = exposure; u.flash.value = flash;
    u.nearest.value = nearest ? 1 : 0; u.origin.value.set(...origin); u.misreg.value = misreg; u.levels.value = levels;
    const k = { ...INK, ...inks };
    u.paper.value.copy(rgb(k.paper)); u.inkC.value.copy(rgb(k.c)); u.inkM.value.copy(rgb(k.m)); u.inkY.value.copy(rgb(k.y)); u.inkK.value.copy(rgb(k.k));
    this.r.render(this.scene, this.cam);
    return this.r.domElement;
  }
  // render into a 2D canvas target (sized to it)
  into(dst, src, opts) {
    const out = this.render(src, dst.width, dst.height, opts);
    const g = dst.getContext('2d'); g.drawImage(out, 0, 0);
    return dst;
  }
}

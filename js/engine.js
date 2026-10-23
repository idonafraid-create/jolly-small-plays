// Small Plays · shared engine — low-res WebGL pass, quantize/HUD post pass, rigs, props, weather.
import * as THREE from 'three';

// ───────────────────────── math & time helpers ─────────────────────────
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
export const win = (t, a, b, f = 0.2) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));
export const bump = (t, a, d) => (t < a || t > a + d ? 0 : Math.sin(Math.PI * (t - a) / d));
export const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
export function hash1(n) {
  let h = Math.imul(n | 0, 2654435761) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
export function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function lastIdx(list, t, key = x => x) {
  let lo = 0, hi = list.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (key(list[m]) <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}
export const sinceEv = (list, t, key = x => x) => { const i = lastIdx(list, t, key); return i < 0 ? 99 : t - key(list[i]); };
// a stepped "random but deterministic" value that changes every `period` seconds
export const stepRand = (t, period, seed = 0) => hash1(Math.floor(t / period) * 97 + seed * 7919);
// beat clock from a cue list (extrapolates past both ends)
export function beatClock(beats) {
  const P = beats.length > 1 ? (beats.at(-1) - beats[0]) / (beats.length - 1) : 0.51;
  return t => {
    if (!beats.length) return { i: 0, ph: 0, since: 99 };
    let i = lastIdx(beats, t), b, n;
    if (i < 0) { const k = Math.ceil((beats[0] - t) / P); i = -k; b = beats[0] - k * P; n = b + P; }
    else { b = beats[i]; n = beats[i + 1]; if (n === undefined) { const k = Math.floor((t - b) / P); i += k; b += k * P; n = b + P; } }
    return { i, ph: (t - b) / (n - b), since: t - b };
  };
}
export function vnoise(x, y) {
  const h2 = (a, b) => hash1(Math.imul(a, 374761393) + Math.imul(b, 668265263));
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1 + 17, y * 2.1 + 5) * 0.3 + vnoise(x * 4.7 + 3, y * 4.7 + 29) * 0.15;
export function envSampler(arr, t0, fps = 60) {
  return t => { const f = (t - t0) * fps; if (f < 0 || f >= arr.length - 1) return 0; const i = Math.floor(f); return lerp(arr[i], arr[i + 1], f - i); };
}

// ───────────────────────── palette & 5×7 bitmap font ─────────────────────────
export const COL = { coral: '#e97780', lime: '#ade408', wine: '#8e1b2c', cream: '#f6efe2', ink: '#1e1a18', gold: '#c9a24a', paper: '#f3efe6' };
const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'], ',': ['..', '..', '..', '..', '..', '.#', '#.'], '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'], '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '-': ['...', '...', '...', '###', '...', '...', '...'], '·': ['.', '.', '.', '#', '.', '.', '.'], ':': ['.', '#', '.', '.', '.', '#', '.'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'], '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'], '"': ['#.#', '#.#', '...', '...', '...', '...', '...'], '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'],
  '♡': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'], '▶': ['#...', '##..', '###.', '####', '###.', '##..', '#...'],
  '→': ['.....', '...#.', '....#', '#####', '....#', '...#.', '.....'], '★': ['..#..', '..#..', '#####', '.###.', '.#.#.', '#...#', '.....'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};
export const FONT = Object.fromEntries(Object.entries(GLYPHS).map(([k, rows]) => [k, { w: rows[0].length, rows }]));
export const glyph = ch => FONT[ch] || FONT[ch.toUpperCase()] || FONT[' '];
export function textW(s, sc = 1) { let w = 0; for (const ch of s) w += (glyph(ch).w + 1) * sc; return w - sc; }
export function drawText(g, s, x, y, color, sc = 1, sy = sc) {
  g.fillStyle = color;
  for (const ch of s) {
    const gl = glyph(ch);
    for (let r = 0; r < 7; r++) for (let c = 0; c < gl.w; c++) if (gl.rows[r][c] === '#') g.fillRect(x + c * sc, y + r * sy, sc, sy);
    x += (gl.w + 1) * sc;
  }
}
export function drawTextOutlined(g, s, x, y, color, outline, sc = 1) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) drawText(g, s, x + dx * sc, y + dy * sc, outline, sc);
  drawText(g, s, x, y, color, sc);
}
export const typed = (s, t, t0, dur = 0.3) => s.slice(0, Math.ceil(clamp((t - t0) / dur) * s.length));

// ───────────────────────── materials & canvas textures ─────────────────────────
const MATS = new Map();
export function mat(hex, opts) {
  const key = hex + (opts ? JSON.stringify(opts) : '');
  let m = MATS.get(key);
  if (!m) {
    m = opts?.basic ? new THREE.MeshBasicMaterial({ color: hex }) : new THREE.MeshLambertMaterial({ color: hex, emissive: opts?.emissive || '#000000' });
    MATS.set(key, m);
  }
  return m;
}
export const glow = hex => mat(hex, { basic: true });
export function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function canvasTex(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
export const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixHex = (a, b, k) => '#' + hexRGB(a).map((v, i) => Math.round(lerp(v, hexRGB(b)[i], k)).toString(16).padStart(2, '0')).join('');
export function grit(g, w, h, amt, rnd = Math.random) {
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (rnd() - 0.5) * amt;
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  g.putImageData(img, 0, 0);
}
// paint a canvas per pixel: fn(x, y) → '#rrggbb' | [r,g,b] | null
export function paint(w, h, fn) {
  const c = canvasOf(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = fn(x, y); if (!v) continue;
    if (typeof v === 'string') v = hexRGB(v);
    const o = (y * w + x) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = v[3] ?? 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ───────────────────────── geometry helpers ─────────────────────────
export function pivot(parent, x = 0, y = 0, z = 0) { const o = new THREE.Group(); o.position.set(x, y, z); parent.add(o); return o; }
export function addBox(parent, w, h, d, material, x, y, z, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const part = (parent, w, h, d, material, x = 0, y = 0, z = 0) => addBox(parent, w, h, d, material, x, y, z, true);
export function addCyl(parent, rt, rb, h, seg, material, x, y, z, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function addSphere(parent, r, material, x, y, z, seg = 8) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
export function addCone(parent, r, h, seg, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
// a flat textured quad (floor decals, signs, posters)
export function quad(parent, w, h, tex, { x = 0, y = 0, z = 0, rx = 0, ry = 0, basic = false, alpha = false } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: alpha, alphaTest: alpha ? 0.5 : 0 })
    : new THREE.MeshLambertMaterial({ map: tex, transparent: alpha, alphaTest: alpha ? 0.5 : 0 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true;
  parent.add(m);
  return m;
}
// box whose UVs come from world position, so split wall pieces share one texture
export function uvBox(parent, w, h, d, pos, faceIndex, faceMat, otherMat, uvFn) {
  const geo = new THREE.BoxGeometry(w, h, d), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const [u, v] = uvFn(p.getX(i) + pos.x, p.getY(i) + pos.y, p.getZ(i) + pos.z); uv.setXY(i, u, v); }
  const m = new THREE.Mesh(geo, [0, 1, 2, 3, 4, 5].map(f => (f === faceIndex ? faceMat : otherMat)));
  m.position.copy(pos); m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
// rooms: a wall along x (back, faces +z) or along z (left, faces +x) with rectangular openings
export function wallWithHoles(parent, { axis, at, from, to, h, thick = 0.18, tex, cut, holes = [] }) {
  const len = to - from;
  const faceMat = new THREE.MeshLambertMaterial({ map: tex });
  faceMat.shadowSide = THREE.DoubleSide;
  const uv = axis === 'x' ? (x, y) => [(x - from) / len, y / h] : (x, y, z) => [(z - from) / len, y / h];
  const piece = (a0, a1, y0, y1) => {
    if (a1 - a0 < 0.001 || y1 - y0 < 0.001) return;
    const c = (a0 + a1) / 2, cy = (y0 + y1) / 2;
    if (axis === 'x') uvBox(parent, a1 - a0, y1 - y0, thick, new THREE.Vector3(c, cy, at - thick / 2), 4, faceMat, cut, uv);
    else uvBox(parent, thick, y1 - y0, a1 - a0, new THREE.Vector3(at - thick / 2, cy, c), 0, faceMat, cut, uv);
  };
  const hs = [...holes].sort((a, b) => a.a0 - b.a0);
  let a = from;
  for (const ho of hs) {
    piece(a, ho.a0, 0, h);
    piece(ho.a0, ho.a1, 0, ho.y0);
    piece(ho.a0, ho.a1, ho.y1, h);
    a = ho.a1;
  }
  piece(a, to, 0, h);
}

// ───────────────────────── rigs ─────────────────────────
export function eye(head, x, y, z, w, h, sclera, pupil) {
  const s = part(head, w, h, 0.02, sclera, x, y, z);
  const p = part(head, w * 0.6, h * 0.85, 0.02, pupil, x, y, z + 0.006);
  return { s, p, y, h };
}
export function setEye(e, state) {
  const { s, p, y, h } = e;
  s.visible = true; s.scale.set(1, 1, 1); s.position.y = y;
  p.scale.set(1, 1, 1); p.position.y = y; p.position.x = s.position.x;
  if (state === 'closed') { s.visible = false; p.scale.set(1.5, 0.3, 1); p.position.y = y - h * 0.2; }
  else if (state === 'half') { s.scale.y = 0.55; s.position.y = y - h * 0.22; p.scale.y = 0.55; p.position.y = y - h * 0.22; }
  else if (state === 'wide') { s.scale.set(1.3, 1.4, 1); p.scale.set(0.55, 0.55, 1); }
  else if (state === 'roll') { p.scale.y = 0.5; p.position.y = y + h * 0.3; }
  else if (state === 'side') { p.position.x = s.position.x + Math.sign(s.position.x || 1) * -0.012; }
}

export const POSE0 = {
  x: 0, y: 0, z: 0, h: 0, rootY: 0, bodyY: 0, crouch: 0, sit: 0, seatY: 0.46, lean: 0, twist: 0, side: 0, headX: 0, headY: 0, headZ: 0,
  hipLx: 0, hipLz: 0, kneeL: 0, hipRx: 0, hipRz: 0, kneeR: 0, shLx: 0, shLz: 0, elL: 0, shRx: 0, shRz: 0, elR: 0, mouth: 0, a: 0, b: 0, c: 0, d: 0,
};
export const P = over => Object.assign({}, POSE0, { eyes: 'open', wink: false }, over);
export function mixPose(a, b, k) {
  const o = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] ?? b[key], vb = b[key] ?? va;
    o[key] = typeof va === 'number' ? va + (vb - va) * k : (k < 0.5 ? va : vb);
  }
  return o;
}
// segs: [{ t0, fn, xf }] — each segment runs until the next; crossfades over xf seconds
export function blendSegs(t, segs) {
  let i = lastIdx(segs, t, s => s.t0);
  if (i < 0) i = 0;
  const p = segs[i].fn(t), xf = segs[i].xf ?? 0.22, tin = t - segs[i].t0;
  if (i > 0 && tin < xf) return mixPose(segs[i - 1].fn(t), p, smooth(tin / xf));
  return p;
}
export const headToward = (p, tx, tz, max = 1.2) => clamp(wrapA(Math.atan2(tx - p.x, tz - p.z) - p.h), -max, max);
// locomotion overlay: phase in radians, a = 0..1 amplitude
export function walkCycle(p, ph, a = 1, arms = true) {
  p.hipLx += -0.62 * Math.sin(ph) * a; p.hipRx += 0.62 * Math.sin(ph) * a;
  p.kneeL += a * (0.15 + 0.8 * Math.max(0, Math.cos(ph))); p.kneeR += a * (0.15 + 0.8 * Math.max(0, -Math.cos(ph)));
  if (arms) { p.shLx += 0.5 * Math.sin(ph) * a; p.shRx -= 0.5 * Math.sin(ph) * a; }
  p.bodyY += 0.03 * a * Math.abs(Math.cos(ph)); p.lean += 0.08 * a;
  return p;
}

export class Biped {
  constructor(parent, S) {
    this.S = S;
    this.root = new THREE.Group(); parent.add(this.root);
    this.root.rotation.order = 'YXZ';
    this.body = pivot(this.root, 0, S.hip, 0);
    part(this.body, S.torsoW * 0.92, 0.16, S.torsoD * 0.92, S.pants, 0, -0.04, 0);
    this.spine = pivot(this.body, 0, 0.02, 0);
    this.torso = part(this.spine, S.torsoW, S.torsoH, S.torsoD, S.jacket, 0, S.torsoH / 2, 0);
    this.head = pivot(this.spine, 0, S.neckY ?? S.torsoH - 0.01, S.headZ || 0);
    this.head.rotation.order = 'YXZ';
    this.arms = [this.arm(1), this.arm(-1)];
    this.legs = [this.leg(1), this.leg(-1)];
    if (S.scale) this.root.scale.setScalar(S.scale);
  }
  arm(side) {
    const S = this.S, sh = pivot(this.spine, side * S.shoulderX, S.shoulderY, 0);
    part(sh, S.armW, S.upper, S.armW, S.sleeve, 0, -S.upper / 2, 0);
    const el = pivot(sh, 0, -S.upper, 0);
    part(el, S.armW * 0.92, S.fore, S.armW * 0.92, S.cuff || S.sleeve, 0, -S.fore / 2, 0);
    part(el, S.pawW, S.pawW * 0.9, S.pawW, S.paw, 0, -S.fore - S.pawW * 0.35, 0.01);
    return { sh, el, hand: pivot(el, 0, -S.fore - S.pawW * 0.4, 0) };
  }
  leg(side) {
    const S = this.S, shin = S.hip - S.thigh - S.shoeH - 0.02;
    const hip = pivot(this.body, side * S.legX, -0.02, 0);
    part(hip, S.legW, S.thigh, S.legW * 1.05, S.pants, 0, -S.thigh / 2, 0);
    const knee = pivot(hip, 0, -S.thigh, 0);
    part(knee, S.legW * 0.96, shin, S.legW, S.shins || S.pants, 0, -shin / 2, 0);
    const ankle = pivot(knee, 0, -shin, 0);
    (S.shoe || ((a) => part(a, S.legW * 0.82, S.shoeH, S.legW * 1.3, S.shoeCol || '#141414', 0, -S.shoeH / 2, S.legW * 0.25)))(ankle, side);
    return { hip, knee, ankle, shin };
  }
  apply(p) {
    const S = this.S, c = p.crouch, L = S.thigh + this.legs[0].shin, sit = p.sit;
    this.root.position.set(p.x, p.y + p.rootY, p.z);
    this.root.rotation.set(p.pitch || 0, p.h, p.roll || 0);
    const sitDrop = sit * (S.hip - (p.seatY - 0.02) / (S.scale || 1));
    this.body.position.y = S.hip + p.bodyY - L * (1 - Math.cos(c)) - sitDrop;
    this.spine.rotation.set(p.lean, p.twist, p.side);
    this.head.rotation.set(p.headX - p.lean * 0.5, p.headY, p.headZ);
    const [aL, aR] = this.arms, [lL, lR] = this.legs;
    aL.sh.rotation.set(p.shLx, 0, p.shLz); aL.el.rotation.x = p.elL;
    aR.sh.rotation.set(p.shRx, 0, p.shRz); aR.el.rotation.x = p.elR;
    const hx = -c - 1.5 * sit, kx = 2 * c + 1.5 * sit;
    lL.hip.rotation.set(p.hipLx + hx, 0, p.hipLz); lL.knee.rotation.x = p.kneeL + kx;
    lR.hip.rotation.set(p.hipRx + hx, 0, p.hipRz); lR.knee.rotation.x = p.kneeR + kx;
    lL.ankle.rotation.x = clamp(-(p.hipLx + hx + p.kneeL + kx), -0.9, 0.9);
    lR.ankle.rotation.x = clamp(-(p.hipRx + hx + p.kneeR + kx), -0.9, 0.9);
    this.lastPose = p;
    if (this.eyes) this.eyes.forEach((e, i) => setEye(e, p.wink && i === 1 ? 'closed' : p.eyes));
    if (this.jaw) this.jaw.rotation.x = 0.6 * p.mouth;
    this.after?.(p);
    this.root.updateMatrixWorld(true);
  }
}

// a prop that leaves its owner at time t0 and flies a closed-form arc to the ground
export function makeArc(anchorObj, poseAt, t0, v, spin, ground) {
  poseAt(t0);
  const p0 = anchorObj.getWorldPosition(new THREE.Vector3()), q0 = anchorObj.getWorldQuaternion(new THREE.Quaternion());
  let tl = 2.5;
  for (let k = 0.01; k < 3; k += 0.002) {
    const y = p0.y + v.y * k - 4.9 * k * k;
    if (v.y - 9.8 * k < 0 && y < ground(p0.x + v.x * k, p0.z + v.z * k) + 0.02) { tl = k; break; }
  }
  return { p0, q0, v, spin, tl, ground, t0 };
}
export function placeFlying(obj, anchorObj, arc, t) {
  const k = t - arc.t0;
  if (k < 0) { anchorObj.getWorldPosition(obj.position); anchorObj.getWorldQuaternion(obj.quaternion); return; }
  const kk = Math.min(k, arc.tl);
  obj.position.set(arc.p0.x + arc.v.x * kk, arc.p0.y + arc.v.y * kk - 4.9 * kk * kk, arc.p0.z + arc.v.z * kk);
  obj.quaternion.copy(arc.q0);
  obj.rotateX(arc.spin * kk);
  if (k >= arc.tl) { obj.position.y = arc.ground(obj.position.x, obj.position.z) + 0.01; obj.rotation.set(0.2, arc.spin, 0.1); }
}

// ───────────────────────── particles ─────────────────────────
const NOTE_ROWS = ['..##..', '..#.#.', '..#..#', '..#...', '.##...', '###...', '.#....'];
let noteTex;
export class Notes {
  constructor(parent, events, pxPerM = 24, size = 36) {
    if (!noteTex) {
      const c = canvasOf(6, 7), g = c.getContext('2d');
      NOTE_ROWS.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') { g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); } }));
      noteTex = canvasTex(c);
    }
    this.events = events.map((e, i) => ({ ...e, seed: hash1(i * 7 + 3) }));
    this.pool = Array.from({ length: size }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, alphaTest: 0.5, transparent: true }));
      s.scale.set(6 / pxPerM * 1.15, 7 / pxPerM * 1.15, 1); s.visible = false; parent.add(s); return s;
    });
    this.life = 1.5;
  }
  // events: { t, from: Vector3 | () => Vector3, color }
  update(t) {
    let k = 0;
    for (const n of this.events) {
      const u = (t - n.t) / this.life;
      if (u < 0 || u >= 1 || k >= this.pool.length) continue;
      const s = this.pool[k++], o = typeof n.from === 'function' ? n.from(n) : n.from;
      const r = n.radial ? easeOut(u * 2) * n.radial : 0, a = n.seed * Math.PI * 2;
      s.position.set(o.x + Math.cos(a) * r + Math.sin(u * 6 + n.seed * 9) * 0.12, o.y + 0.9 * u, o.z + Math.sin(a) * r + Math.cos(u * 5 + n.seed * 7) * 0.08);
      s.material.color.set(n.color);
      s.visible = u < 0.78 || Math.floor(t * 16) % 2 === 0;
    }
    for (; k < this.pool.length; k++) this.pool[k].visible = false;
  }
}

// deterministic rain: streaks + splash pixels
export class Rain {
  // wind / windZ: horizontal drift per metre fallen, so the streaks fall on a slant
  constructor(parent, { count = 700, x0, x1, z0, z1, top = 6, ground = () => 0, speed = 9, len = 0.32, wind = 0.25, windZ = 0, color = '#9fb4c8', opacity = 0.7, splash = true }) {
    this.o = { x0, x1, z0, z1, top, ground, speed, len, wind, windZ };
    const r = mulberry32(77);
    this.drops = Array.from({ length: count }, () => {
      const x = lerp(x0, x1, r()), z = lerp(z0, z1, r());           // where it lands
      return { x, z, ph: r() * 10, sp: speed * (0.85 + r() * 0.3), g: ground(x, z) };
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    this.lines.frustumCulled = false;
    parent.add(this.lines);
    if (splash) {
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      this.splash = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#d7e3ee', size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false }));
      this.splash.frustumCulled = false;
      parent.add(this.splash);
    }
  }
  update(t, amount = 1) {
    const { top, len, wind, windZ } = this.o, pos = this.lines.geometry.attributes.position.array;
    const sp = this.splash?.geometry.attributes.position.array;
    const n = Math.floor(this.drops.length * clamp(amount));
    const k = len / Math.hypot(1, wind, windZ);
    this.drops.forEach((d, i) => {
      const H = top - d.g, cyc = (t * d.sp + d.ph * H) % (H + 1.2);
      const y = top - cyc, o = i * 6;
      if (i >= n || y < d.g) {
        pos.fill(0, o, o + 6);
        if (sp) { const near = i < n && y < d.g && y > d.g - 0.35; sp[i * 3] = d.x; sp[i * 3 + 1] = near ? d.g + 0.02 : -50; sp[i * 3 + 2] = d.z; }
        return;
      }
      const left = y - d.g, hx = d.x - wind * left, hz = d.z - windZ * left;          // drifts toward its landing spot
      pos[o] = hx; pos[o + 1] = y; pos[o + 2] = hz;
      pos[o + 3] = hx - wind * k; pos[o + 4] = y + k; pos[o + 5] = hz - windZ * k;
      if (sp) sp[i * 3 + 1] = -50;
    });
    this.lines.geometry.attributes.position.needsUpdate = true;
    if (sp) this.splash.geometry.attributes.position.needsUpdate = true;
  }
}

// wet floor: planar reflection for an orthographic camera (three's Reflector assumes perspective),
// masked by puddles and rippled by rain. Objects flagged userData.noReflect are hidden from the mirror pass.
export function makeWetFloor(parent, w, d, maskCanvas, { x = 0, z = 0, y = 0.004, tint = '#ffffff', strength = 0.8, sky = '#0b0e17' } = {}) {
  const rt = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
  const mask = canvasTex(maskCanvas); mask.colorSpace = THREE.NoColorSpace; mask.magFilter = mask.minFilter = THREE.LinearFilter;
  const material = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, tMask: { value: mask }, textureMatrix: { value: new THREE.Matrix4() }, time: { value: 0 }, strength: { value: strength }, color: { value: new THREE.Color(tint) } },
    vertexShader: /* glsl */`
      uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vUv2;
      void main() { vUv = textureMatrix * vec4(position, 1.0); vUv2 = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 color; uniform sampler2D tDiffuse, tMask; uniform float time, strength; varying vec4 vUv; varying vec2 vUv2;
      void main() {
        float m = texture2D(tMask, vUv2).r;
        vec2 off = vec2(sin(vUv2.y * 300.0 + time * 6.0), cos(vUv2.x * 260.0 + time * 5.0)) * 0.0035 * (0.3 + m);
        vec3 r = texture2D(tDiffuse, vUv.xy / vUv.w + off).rgb;
        gl_FragColor = vec4(r * color, clamp(m, 0.0, 1.0) * strength);
      }`,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z);
  mesh.userData.noReflect = true;
  parent.add(mesh);
  const vcam = new THREE.OrthographicCamera(), skyCol = new THREE.Color(sky);
  const n = new THREE.Vector3(0, 1, 0), camPos = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3(), rot = new THREE.Matrix4();
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  let busy = false;
  mesh.onBeforeRender = (renderer, scene, camera) => {
    if (busy || !camera.isOrthographicCamera) return;
    busy = true;
    const py = mesh.getWorldPosition(look).y;
    camPos.setFromMatrixPosition(camera.matrixWorld); camPos.y = 2 * py - camPos.y;
    rot.extractRotation(camera.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rot).reflect(n).add(camPos);
    up.set(0, 1, 0).applyMatrix4(rot).reflect(n);
    vcam.copy(camera); vcam.position.copy(camPos); vcam.up.copy(up); vcam.lookAt(look);
    vcam.updateMatrixWorld(); vcam.projectionMatrix.copy(camera.projectionMatrix);
    material.uniforms.textureMatrix.value.copy(bias).multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse).multiply(mesh.matrixWorld);
    const hidden = [];
    scene.traverse(o => { if (o.userData.noReflect && o.visible) { o.visible = false; hidden.push(o); } });
    const bg = scene.background, prevRT = renderer.getRenderTarget();
    scene.background = skyCol;
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, vcam);
    renderer.setRenderTarget(prevRT);
    scene.background = bg;
    hidden.forEach(o => { o.visible = true; });
    busy = false;
  };
  mesh.setSize = (wpx, hpx) => rt.setSize(wpx, hpx);
  return mesh;
}

// a slowly spinning inverted 3D triangle that hovers over a character's head
export function makeMarker(parent, color) {
  const geo = new THREE.ConeGeometry(0.12, 0.22, 3); geo.rotateX(Math.PI);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.55) }));
  m.castShadow = false; m.receiveShadow = false;
  parent.add(m);
  return m;
}

// ───────────────────────── surroundings: a ragged ground patch, foliage, hanging vines ─────────────────────────
// pattern(x, z, dRoom, dEdge) → colour for the ground outside the room (dRoom: metres from the room's edge,
// dEdge: metres inside the ragged outer edge). Returns { mesh, inGround(x, z), edgePoints(n), roomEdgePoints(n) }.
export function makeSurround(parent, { hw, hd, margin = 2, y = -0.012, pattern, seed = 1, ragged = 0.9, room = true }) {
  const W = hw + margin, D = hd + margin, N = Math.round(W * 2 * 20), M = Math.round(D * 2 * 20), r = mulberry32(seed);
  const sdRect = (x, z, a, b, rad = 0) => { const qx = Math.abs(x) - (a - rad), qz = Math.abs(z) - (b - rad); return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rad; };
  const edgeAt = (x, z) => sdRect(x, z, W - 0.35, D - 0.35, 0.8) + (fbm(x * 0.7 + seed, z * 0.7 + seed * 3) - 0.5) * ragged * 1.4;
  const tex = canvasTex(paint(N, M, (i, j) => {
    const x = i / 20 - W, z = j / 20 - D;
    if (room && Math.abs(x) < hw - 0.02 && Math.abs(z) < hd - 0.02) return null;
    const e = edgeAt(x, z) + (r() - 0.5) * 0.22;
    if (e > 0) return null;
    return pattern(x, z, Math.max(0, sdRect(x, z, hw, hd)), -e, r);
  }));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, D * 2), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.receiveShadow = true; mesh.userData.noReflect = true;
  parent.add(mesh);
  const inGround = (x, z) => edgeAt(x, z) < -0.1;
  const edgePoints = (n, band = 0.5) => { const out = []; for (let k = 0; out.length < n && k < n * 60; k++) { const x = (r() * 2 - 1) * W, z = (r() * 2 - 1) * D, e = edgeAt(x, z); if (e < 0 && e > -band && !(Math.abs(x) < hw && Math.abs(z) < hd)) out.push([x, z]); } return out; };
  const roomEdgePoints = (n, sides = ['+x', '+z']) => Array.from({ length: n }, () => {
    const s = sides[Math.floor(r() * sides.length)], u = r() * 2 - 1, o = 0.05 + r() * 0.25;
    return s === '+x' ? [hw + o, u * hd] : s === '-x' ? [-hw - o, u * hd] : s === '+z' ? [u * hw, hd + o] : [u * hw, -hd - o];
  });
  return { mesh, inGround, edgePoints, roomEdgePoints, W, D, rnd: r };
}
// leafy clumps (instanced) at the given points; scale ~ clump size
export function foliage(parent, pts, { cols = ['#3f6a2a', '#4f7f33', '#5f9238', '#76a446', '#2f5a24'], size = 0.22, y = 0, seed = 5, tall = 1 } = {}) {
  const r = mulberry32(seed), geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), pts.length * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  for (const [x, z, yy] of pts) for (let k = 0; k < 3; k++) {
    const sz = size * (0.5 + r() * 0.8);
    p.set(x + (r() - 0.5) * size * 1.6, (yy ?? y) + sz * 0.4 * tall + (k === 2 ? sz * 0.5 * tall : 0), z + (r() - 0.5) * size * 1.6);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 3);
    s.set(sz, sz * 0.8 * tall, sz);
    m4.compose(p, q, s); mesh.setMatrixAt(n, m4); mesh.setColorAt(n, c.set(cols[Math.floor(r() * cols.length)])); n++;
  }
  mesh.count = n; mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.noReflect = true;
  parent.add(mesh);
  return mesh;
}
// vines that hang from points, n leaves each, swinging a little
export function vines(parent, pts, { len = 1.0, cols = ['#3f6a2a', '#4f7f33', '#5f9238', '#2f5a24'], seed = 7 } = {}) {
  const r = mulberry32(seed), geo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
  const per = Math.max(3, Math.round(len / 0.12));
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), pts.length * per);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  let n = 0;
  for (const [x, y, z] of pts) {
    const L = len * (0.4 + r() * 0.8), steps = Math.round(per * L / len);
    for (let k = 0; k < steps; k++) {
      m4.makeTranslation(x + (r() - 0.5) * 0.06, y - k * 0.11, z + (r() - 0.5) * 0.06);
      mesh.setMatrixAt(n, m4); mesh.setColorAt(n, c.set(cols[Math.floor(r() * cols.length)])); n++;
    }
  }
  mesh.count = n; mesh.userData.noReflect = true;
  parent.add(mesh);
  return mesh;
}

// clipping planes that keep effects (light shafts) inside a room's footprint and above its floor
export const roomClip = (hw, hd) => [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), hw), new THREE.Plane(new THREE.Vector3(-1, 0, 0), hw),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), hd), new THREE.Plane(new THREE.Vector3(0, 0, -1), hd), new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
];
// fake light shaft (additive cone). mode 'stage': a theatre beam, strongest where it lands;
// mode 'torch': a hand-held beam, hot at the lens, soft-edged, dying off with distance.
export function lightShaft(parent, color, pos, target, angle, clip = null, mode = 'stage') {
  const len = pos.distanceTo(target), r = Math.tan(angle) * len;
  const geo = new THREE.ConeGeometry(r, len, 24, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: 0 }, len: { value: len }, torch: { value: mode === 'torch' ? 1 : 0 } },
    vertexShader: /* glsl */`
      #include <common>
      #include <clipping_planes_pars_vertex>
      varying float vk; varying vec3 vN; uniform float len;
      void main() { vk = -position.y / len; vN = normalize(normalMatrix * normal); vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
      #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <clipping_planes_pars_fragment>
      uniform vec3 color; uniform float opacity, torch; varying float vk; varying vec3 vN;
      void main() {
      #include <clipping_planes_fragment>
      float stage = smoothstep(0.2, 1.0, vk);
      float core = pow(abs(vN.z), 1.6);                                   // brighter through the middle of the cone
      float beam = pow(1.0 - vk, 1.3) * smoothstep(0.0, 0.06, vk) * (0.35 + 0.65 * core);
      gl_FragColor = vec4(color * opacity * mix(stage, beam, torch), 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: mode === 'torch' ? THREE.DoubleSide : THREE.FrontSide,
    clipping: !!clip, clippingPlanes: clip,
  }));
  m.position.copy(pos);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), target.clone().sub(pos).normalize());
  parent.add(m);
  return m;
}
// dust drifting inside a beam (local to the beam's parent), twinkling as it crosses the light
export function beamDust(parent, pos, target, angle, count = 40, color = '#fff2d0') {
  const r = mulberry32(13), dir = target.clone().sub(pos), len = dir.length(); dir.normalize();
  const side = new THREE.Vector3(0, 1, 0).cross(dir); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
  const up = dir.clone().cross(side).normalize();
  const motes = Array.from({ length: count }, () => ({ u: 0.06 + r() * 0.7, a: r() * Math.PI * 2, rr: Math.sqrt(r()) * 0.85, s: r() }));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 1, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.userData.noReflect = true;
  parent.add(pts);
  pts.update = t => {
    const a = geo.attributes.position.array;
    motes.forEach((m, i) => {
      const u = (m.u + t * 0.01 * (0.5 + m.s)) % 0.8 + 0.05, R = Math.tan(angle) * len * u * m.rr, aa = m.a + t * 0.25 * (m.s - 0.5);
      const on = Math.sin(t * (2 + m.s * 3) + i) > -0.2;
      const px = pos.x + dir.x * len * u + (side.x * Math.cos(aa) + up.x * Math.sin(aa)) * R;
      a[i * 3] = px; a[i * 3 + 1] = on ? pos.y + dir.y * len * u + (side.y * Math.cos(aa) + up.y * Math.sin(aa)) * R : -999; a[i * 3 + 2] = pos.z + dir.z * len * u + (side.z * Math.cos(aa) + up.z * Math.sin(aa)) * R;
    });
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}
export function makeSpot(parent, color, pos, target, angle, { shadow = true, penumbra = 0.35, shaft = true, distance = 16, clip = null, beam = 'stage' } = {}) {
  const s = new THREE.SpotLight(color, 0, distance, angle, penumbra, 1.2);
  s.position.copy(pos); s.target.position.copy(target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; }
  parent.add(s, s.target);
  if (shaft) s.userData.shaft = lightShaft(parent, color, pos, target, angle, clip, beam);
  return s;
}

// ───────────────────────── stage: renderer + post + HUD layer ─────────────────────────
export class Stage {
  static ZOOM_MIN = 0.55;
  static ZOOM_MAX = 3.0;
  constructor(container, { capture = false, captureSize = [480, 270], pxPerM = 24 } = {}) {
    this.container = container; this.capture = capture; this.captureSize = captureSize; this.pxPerM = pxPerM;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: capture });
    r.setPixelRatio(1);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.BasicShadowMap;
    r.localClippingEnabled = true;
    container.appendChild(r.domElement);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
    this.rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
    this.hud = canvasOf(1, 1); this.hg = this.hud.getContext('2d');
    this.hudTex = new THREE.CanvasTexture(this.hud);
    this.hudTex.magFilter = this.hudTex.minFilter = THREE.NearestFilter; this.hudTex.generateMipmaps = false;
    this.post = new THREE.ShaderMaterial({
      uniforms: {
        tSrc: { value: this.rt.texture }, tHud: { value: this.hudTex }, res: { value: new THREE.Vector2(1, 1) }, levels: { value: 30 }, dither: { value: 0.65 },
        flash: { value: 0 }, flashCol: { value: new THREE.Vector3(1, 1, 1) }, shake: { value: new THREE.Vector2() }, paper: { value: new THREE.Vector3(...hexRGB(COL.paper).map(v => v / 255)) },
        vignette: { value: 0 }, lens: { value: new THREE.Vector4(0, 0, 0, 0) }, mono: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tSrc, tHud; uniform vec2 res, shake; uniform float levels, dither, flash, vignette, mono; uniform vec3 flashCol, paper; uniform vec4 lens;
        // paper and flashCol arrive as sRGB
        varying vec2 vUv;
        float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
        float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
        vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        void main() {
          vec3 c = toSRGB(texture2D(tSrc, vUv + shake / res).rgb);
          float isPaper = step(distance(c, paper), 0.012);
          c = mix(c, flashCol, flash * (1.0 - isPaper));
          if (mono > 0.0) c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))) * vec3(0.9, 1.0, 0.85), mono * (1.0 - isPaper));
          if (lens.z > 0.0) {                                   // opera-glass view: two circles, outside goes dark
            vec2 p = (vUv * res - lens.xy); float rr = lens.z;
            float d1 = length(p - vec2(-rr * 0.72, 0.0)), d2 = length(p - vec2(rr * 0.72, 0.0));
            float inside = step(min(d1, d2), rr);
            c = mix(c * 0.3 + vec3(0.02, 0.015, 0.01), c, inside);
            c = mix(c, vec3(0.79, 0.64, 0.29), step(abs(min(d1, d2) - rr), 0.7) * lens.w);
          }
          float d = (bayer4(gl_FragCoord.xy) - 0.5) * dither;
          vec3 q = floor(c * (levels - 1.0) + 0.5 + d) / (levels - 1.0);
          c = mix(q, paper, isPaper * step(lens.z, 0.0));
          vec4 h = texture2D(tHud, vUv);
          gl_FragColor = vec4(mix(clamp(c, 0.0, 1.0), h.rgb, h.a), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.postScene = new THREE.Scene();
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
    this.postCam = new THREE.Camera();
    this.lowW = this.lowH = 1;
    this.v = new THREE.Vector3();
  }
  setScene(def) {
    this.def = def;
    const az = Math.PI / 4, el = Math.PI / 6;
    this.camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(80).add(def.target);
    this.camera.lookAt(def.target);
    this.setFlash(0);
    this.resize();
  }
  // the page colour behind the diorama (light / dark theme); kept exact by the post pass
  setPaper(hex) {
    this.paperHex = hex;
    this.paperColor = new THREE.Color(hex);
    this.post.uniforms.paper.value.set(...hexRGB(hex).map(v => v / 255));
  }
  // post-pass colour flash; colours are sRGB like the rest of the post pass
  setFlash(amount, hex = '#ffffff') {
    this.post.uniforms.flash.value = amount;
    this.post.uniforms.flashCol.value.set(...hexRGB(hex).map(v => v / 255));
  }
  resize() {
    const def = this.def; if (!def) return;
    const cv = this.renderer.domElement;
    let ps, hh;
    if (this.capture) {
      [this.lowW, this.lowH] = this.captureSize; ps = 4;
      const halfH = Math.max(def.fit.h / 2, def.fit.w / 2 / (this.lowW / this.lowH));
      hh = halfH;
      cv.style.width = (this.lowW * ps / (devicePixelRatio || 1)) + 'px'; cv.style.height = (this.lowH * ps / (devicePixelRatio || 1)) + 'px';
    } else {
      const dpr = devicePixelRatio || 1, rect = this.container.getBoundingClientRect();
      const dw = Math.max(1, Math.round(rect.width * dpr)), dh = Math.max(1, Math.round(rect.height * dpr));
      const halfH = Math.max(def.fit.h / 2, def.fit.w / 2 / (dw / dh));
      ps = Math.max(2, Math.round(dh / (2 * halfH * this.pxPerM)));           // never below 2: keep the pixels chunky
      this.lowW = Math.ceil(dw / ps); this.lowH = Math.ceil(dh / ps);
      hh = halfH * (this.lowH * ps) / dh;
      cv.style.width = (this.lowW * ps / dpr) + 'px'; cv.style.height = (this.lowH * ps / dpr) + 'px';
      cv.style.left = ((rect.width - this.lowW * ps / dpr) / 2) + 'px'; cv.style.top = ((rect.height - this.lowH * ps / dpr) / 2) + 'px';
    }
    this.ps = ps;
    this.renderer.setSize(this.lowW, this.lowH, false);
    this.rt.setSize(this.lowW, this.lowH);
    this.hud.width = this.lowW; this.hud.height = this.lowH;
    this.post.uniforms.res.value.set(this.lowW, this.lowH);
    this.baseH = hh; this.baseW = hh * this.lowW / this.lowH;
    this.applyView();
    def.onResize?.(this.lowW, this.lowH);
  }
  // wheel zoom: same art-pixel size, narrower frustum → more detail when closer
  zoomAt(factor, nx = 0, ny = 0) {
    const z0 = this.zoomT ?? 1, z1 = clamp(z0 * factor, Stage.ZOOM_MIN, Stage.ZOOM_MAX);
    const px = this.panT ?? { x: 0, y: 0 };
    this.panT = { x: px.x + nx * this.baseW * (1 / z0 - 1 / z1), y: px.y + ny * this.baseH * (1 / z0 - 1 / z1) };
    this.zoomT = z1;
    this.clampPan();
  }
  panBy(dxPx, dyPx) {
    const z = this.zoomT ?? 1, u = 2 * this.baseH / z / this.lowH / this.ps * (devicePixelRatio || 1);
    const p = this.panT ?? { x: 0, y: 0 };
    this.panT = { x: p.x - dxPx * u, y: p.y + dyPx * u };
    this.clampPan();
  }
  clampPan() {
    const z = this.zoomT, mx = Math.max(0, this.baseW * (1 - 1 / z)) + 0.6, my = Math.max(0, this.baseH * (1 - 1 / z)) + 0.6;
    this.panT.x = clamp(this.panT.x, -mx, mx); this.panT.y = clamp(this.panT.y, -my, my);
  }
  resetView() { this.zoomT = 1; this.panT = { x: 0, y: 0 }; }
  // eases toward the target view; call once per frame (dt in seconds)
  stepView(dt) {
    this.zoomT ??= 1; this.panT ??= { x: 0, y: 0 };
    this.zoom ??= 1; this.pan ??= { x: 0, y: 0 };
    const k = 1 - Math.exp(-dt * 14);
    this.zoom += (this.zoomT - this.zoom) * k;
    this.pan.x += (this.panT.x - this.pan.x) * k; this.pan.y += (this.panT.y - this.pan.y) * k;
    this.applyView();
  }
  applyView() {
    const z = this.capture ? 1 : (this.zoom ?? 1), pan = this.capture ? { x: 0, y: 0 } : (this.pan ?? { x: 0, y: 0 });
    const hw = this.baseW / z, hh = this.baseH / z, unit = 2 * hh / this.lowH;     // snap the pan to whole art pixels
    const cx = Math.round(pan.x / unit) * unit, cy = Math.round(pan.y / unit) * unit;
    Object.assign(this.camera, { left: cx - hw, right: cx + hw, top: cy + hh, bottom: cy - hh });
    this.camera.updateProjectionMatrix();
  }
  screenOf(obj, up = 0) {
    const v = this.v;
    if (obj.isVector3) v.copy(obj); else obj.getWorldPosition(v);
    v.y += up; v.project(this.camera);
    return [Math.round((v.x + 1) / 2 * this.lowW), Math.round((1 - v.y) / 2 * this.lowH)];
  }
  render(scene3, drawHud) {
    const r = this.renderer;
    if (this.paperColor && scene3.background !== this.paperColor) scene3.background = this.paperColor;
    r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true;       // once per frame, even when reflectors re-render the scene
    r.setRenderTarget(this.rt);
    r.render(scene3, this.camera);
    this.hg.clearRect(0, 0, this.lowW, this.lowH);
    drawHud?.(this.hg);
    this.hudTex.needsUpdate = true;
    r.setRenderTarget(null);
    r.render(this.postScene, this.postCam);
  }
  // in-canvas pixel tag with a leader line toward the anchor
  tag(text, t, t0, t1, anchor, bg, fg, side = 'right', dy = 0) {
    if (t < t0 || t >= t1) return;
    const g = this.hg, s = typed(text, t, t0), w = textW(text) + 6, h = 11, [ax, ay] = anchor;
    const x = clamp(side === 'left' ? ax - w - 9 : ax + 9, 2, this.lowW - w - 2), y = clamp(ay - 12 + dy, 2, this.lowH - h - 2);
    const l0 = side === 'left' ? x + w + 1 : ax + 3, l1 = side === 'left' ? ax - 3 : x - 1;
    g.fillStyle = COL.ink; g.fillRect(Math.min(l0, l1), y + 6, Math.abs(l1 - l0) + 1, 1);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    drawText(g, s, x + 3, y + 2, fg);
  }
  caption(text, x, y, color, outline = COL.ink, sc = 1) { drawTextOutlined(this.hg, text, x, y, color, outline, sc); }
  // small boxless name label centred above a screen point
  label(text, [x, y], color, outline = COL.ink) { drawTextOutlined(this.hg, text, Math.round(x - textW(text) / 2), y - 8, color, outline); }
  centerText(text, y, color, sc = 1, outline) {
    const x = Math.round((this.lowW - textW(text, sc)) / 2);
    if (outline) drawTextOutlined(this.hg, text, x, y, color, outline, sc); else drawText(this.hg, text, x, y, color, sc);
  }
}

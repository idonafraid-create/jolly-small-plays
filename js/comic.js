// Comic mode — every floor gets a Sunday-funnies page. The pixel play is the footage, the page is the case report.
// When a floor ends (or on READ / C) the frame runs through the press, shrinks into its panel and the camera pulls
// back to the whole page; clicks then walk the camera panel by panel, each panel replaying its chapter's audio.
// Pages live in js/comics/<scene>.js: rects in page px, element positions as fractions of their panel.
import { Print, coverCrop } from './print.js';
import { clamp, lerp, mulberry32 } from './engine.js';
import { WEAR, wornShape, wearLayers, spreadLight, wornSpread, spreadWear } from './wear.js';

export const COMICS = ['bar', 'alley', 'cellar', 'motel'];
const Q = 2;                 // printed px per page px
const CELL = 2.4;            // halftone cell, page px (fine: the dots read as texture, and as dots only up close)
const MISREG = 0.5;          // plate misregistration, page px
const PAD = 30;              // css px kept around a focused panel
// the closest the camera comes (css px per page px). On a big window a lean-in went past 4×: the page was then too big to
// re-raster between frames, so the move stalled, and the move back out from it could show a frame with no page at all
// (1F's tie clip, the piano keys, the alley's glasses). The wheel can still go closer by hand.
const MAX_S = 2.6;
const STAGGER = 420;         // ms between the elements of one step
const NS = 'http://www.w3.org/2000/svg';
const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const wait = ms => new Promise(r => setTimeout(r, ms));
function anim(ms, fn) {
  return new Promise(done => {
    const t0 = performance.now();
    const tick = () => { const k = clamp((performance.now() - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(tick); else done(); };
    requestAnimationFrame(tick);
  });
}
function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
}
// an issue's own colours (css custom properties: --band, --logo, --tag, --ribbon, --roundel …; see index.html)
const paint = (e, palette = {}) => { for (const [k, v] of Object.entries(palette)) e.style.setProperty('--' + k, v); };
function svgEl(tag, parent, attrs = {}) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; }
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
// a smooth line through page points (Catmull-Rom), walked at even speed: k ∈ [0, 1] → [x, y]
export function trail(pts, n = 24) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], dense = [];
  for (let i = 1; i < P.length - 2; i++) for (let j = 0; j < n; j++) {
    const t = j / n, [a, b, c, d] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    dense.push([0, 1].map(e => 0.5 * (2 * b[e] + (c[e] - a[e]) * t + (2 * a[e] - 5 * b[e] + 4 * c[e] - d[e]) * t * t + (3 * b[e] - a[e] - 3 * c[e] + d[e]) * t * t * t)));
  }
  dense.push(pts[pts.length - 1]);
  const len = [0];
  for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = len[len.length - 1] || 1;
  const at = k => {
    const d = clamp(k) * L; let i = 1;
    while (i < len.length - 1 && len[i] < d) i++;
    const u = (d - len[i - 1]) / ((len[i] - len[i - 1]) || 1);
    return [lerp(dense[i - 1][0], dense[i][0], u), lerp(dense[i - 1][1], dense[i][1], u)];
  };
  at.points = dense; at.total = L;
  return at;
}
const fontsReady = () => Promise.all(['Bangers', 'Special Elite', 'Patrick Hand SC', 'Permanent Marker'].map(f => document.fonts.load(`20px "${f}"`))).catch(() => {});

// stand-in art until the real panel exists: a flat card with the shot description
function placeholder(w, h, text, fill = '#a9c9c2') {
  const c = el('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = fill; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(29,26,28,.18)'; g.lineWidth = w / 70;
  for (let x = -h; x < w; x += w / 7) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
  g.fillStyle = '#1d1a1c'; g.textAlign = 'center'; g.font = `${Math.round(h / 16)}px "Special Elite", monospace`;
  const words = text.split(' '), lines = [];
  let line = '';
  for (const wd of words) { if (g.measureText(line + ' ' + wd).width > w * 0.8 && line) { lines.push(line); line = wd; } else line = line ? line + ' ' + wd : wd; }
  lines.push(line);
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * h / 12));
  return c;
}

// balloon outlines: an ellipse, a spiky burst (shouts), a cloud (thoughts)
function ellipsePath(cx, cy, a, b) { return `M${cx - a},${cy}A${a},${b} 0 1 0 ${cx + a},${cy}A${a},${b} 0 1 0 ${cx - a},${cy}Z`; }
function burstPath(cx, cy, a, b, seed = 3) {
  const r = mulberry32(seed), n = 22, pts = [];
  for (let i = 0; i < n * 2; i++) { const t = i / (n * 2) * Math.PI * 2, k = i % 2 ? 0.8 + r() * 0.06 : 1.1 + r() * 0.14; pts.push(`${(cx + Math.cos(t) * a * k).toFixed(1)},${(cy + Math.sin(t) * b * k).toFixed(1)}`); }
  return 'M' + pts.join('L') + 'Z';
}
function cloudPath(cx, cy, a, b) {
  const n = 11; let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n * Math.PI * 2, x = cx + Math.cos(t) * a, y = cy + Math.sin(t) * b;
    d += i ? `A${a * 0.32},${b * 0.36} 0 0 1 ${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
}

// ── hand lettering: balanced line breaks (no long-line-then-stub), boxes drawn like ruled ink ──
const meas = document.createElement('canvas').getContext('2d');
// break `text` into lines of near-equal width whose block is about `aspect` wide per unit of height
function letterLines(txt, text, aspect, maxW) {
  const cs = getComputedStyle(txt), up = cs.textTransform === 'uppercase';
  meas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  meas.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1;
  const words = text.split(/\s+/).filter(Boolean), W = t => meas.measureText(up ? t.toUpperCase() : t).width;
  const ws = words.map(W), sp = W(' ');
  const pack = lim => { const out = []; let cur = null; words.forEach((wd, i) => { if (cur && cur.w + sp + ws[i] <= lim + 0.5) { cur.t += ' ' + wd; cur.w += sp + ws[i]; } else out.push(cur = { t: wd, w: ws[i] }); }); return out; };
  let best = null;
  for (let n = 1; n <= Math.min(words.length, 7); n++) {
    let lo = Math.max(...ws), hi = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; if (pack(mid).length <= n) hi = mid; else lo = mid; }
    const lines = pack(hi), w = Math.max(...lines.map(l => l.w));
    const score = Math.abs(Math.log(w / (lines.length * lh) / aspect)) + (w > maxW ? 9 : 0);
    if (!best || score < best.score) best = { lines: lines.map(l => l.t), score };
  }
  return best.lines;
}
// where a horizontal line at height y crosses a (convex) panel outline: [leftmost, rightmost] x inside it
function rowSpan(shape, y) {
  const xs = [];
  shape.forEach(([x0, y0], i) => {
    const [x1, y1] = shape[(i + 1) % shape.length];
    if ((y0 <= y && y <= y1) || (y1 <= y && y <= y0)) xs.push(y0 === y1 ? x0 : x0 + (x1 - x0) * (y - y0) / (y1 - y0));
  });
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 0];
}
// caption outline in its own px box: a slightly wobbly ruled box, a slanted one, or one with a clipped corner
function capPath(w, h, shape, seed, flush) {
  const r = mulberry32(seed * 7 + 1), j = flush ? 0 : 1.5, J = () => (r() - 0.5) * 2 * j;
  const s = Math.min(16, h * 0.4), c = Math.min(18, h * 0.5);
  const base = shape === 'slant' ? [[s, 0], [w, 0], [w - s, h], [0, h]] : shape === 'tab' ? [[0, 0], [w - c, 0], [w, c], [w, h], [0, h]] : [[0, 0], [w, 0], [w, h], [0, h]];
  const pts = base.map(([x, y]) => [x + J(), y + J()]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    d += `Q${((a[0] + b[0]) / 2 + J()).toFixed(1)},${((a[1] + b[1]) / 2 + J()).toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  }
  return d + 'Z';
}

// the page's own sounds: CC0 recordings in assets/sfx (cut and levelled by tools/sfx_prep.py), decoded once. Until a
// recording has loaded, or if it fails to, the old kinds fall back to a tiny synth. The panels play the floor's own audio.
const SFX = ['page', 'swish', 'whip', 'pop', 'thud', 'press', 'squeak', 'crack', 'rumble', 'horn', 'toots', 'train', 'rain', 'hiss',
  'oink', 'caw', 'hoot', 'meow', 'clink', 'drip', 'creak', 'ting', 'stamp', 'click', 'lights', 'flash', 'bark', 'purr'];
const ALIAS = { thump: 'thud', clack: 'press', whistle: 'horn' };
// how loud each sits against the floor's soundtrack
const GAIN = { swish: 0.16, page: 0.75, whip: 0.45, pop: 0.32, thud: 0.42, press: 0.5, squeak: 0.4, crack: 0.8, rumble: 0.7, horn: 0.5, toots: 0.55,
  train: 0.55, rain: 0.35, hiss: 0.6, oink: 0.55, caw: 0.5, hoot: 0.55, meow: 0.5, clink: 0.55, drip: 0.45, creak: 0.4, ting: 0.45, stamp: 0.9,
  click: 0.7, lights: 0.6, flash: 0.6, bark: 0.6, purr: 0.5 };
class Foley {
  constructor(audio) { this.audio = audio; this.buf = {}; }
  // the audio context (made on first use, resumed after the first gesture) and the recordings it plays
  ctx() {
    if (!this.c) {
      this.c = new AudioContext();
      for (const n of SFX) fetch(`assets/sfx/${n}.mp3`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then(b => this.c.decodeAudioData(b)).then(b => { this.buf[n] = b; }).catch(() => {});
    }
    if (this.c.state === 'suspended') this.c.resume().catch(() => {});
    return this.c;
  }
  // kind: a recording's name (or an old synth kind); gain and rate scale it; at delays it (s). Returns the source node.
  play(kind, { gain = 1, rate = 1, at = 0 } = {}) {
    if (this.audio.muted || !kind) return null;
    try {
      const c = this.ctx(), name = ALIAS[kind] || kind;
      if (kind === 'boom') { this.play('crack', { gain, at }); return this.play('rumble', { gain, at: at + 0.12 }); }
      const b = this.buf[name];
      if (!b) { this.synth(c, kind); return null; }
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.playbackRate.value = rate * (1 + (Math.random() - 0.5) * 0.06);     // never quite the same twice
      g.gain.value = (GAIN[name] ?? 0.6) * gain;
      s.connect(g).connect(c.destination); s.start(c.currentTime + at);
      return s;
    } catch { return null; }
  }
  synth(c, kind) {
    const t = c.currentTime, out = c.createGain();
    out.connect(c.destination);
    const noise = (dur, f0, f1, q, vol) => {
      const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = b; f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.value = vol; s.connect(f).connect(g).connect(out); s.start(t);
    };
    const tone = (f0, f1, dur, vol, type = 'sine', at = 0) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(out); o.start(t + at); o.stop(t + at + dur + 0.05);
    };
    if (kind === 'swish' || kind === 'page' || kind === 'whip') noise(0.32, 600, 2400, 0.8, 0.12);
    else if (kind === 'thump' || kind === 'thud' || kind === 'stamp') { tone(110, 45, 0.3, 0.5); noise(0.12, 900, 300, 0.7, 0.25); }
    else if (kind === 'clack' || kind === 'press') for (let i = 0; i < 4; i++) tone(2400 - i * 300, 900, 0.05, 0.08, 'square', i * 0.16);
    else if (kind === 'squeak') { tone(1700, 2600, 0.12, 0.05, 'triangle'); tone(2100, 1500, 0.1, 0.04, 'triangle', 0.18); }
    else if (kind === 'pop') tone(500, 900, 0.07, 0.06);
    else if (kind === 'ting') { tone(2650, 2600, 0.5, 0.05); tone(3960, 3900, 0.3, 0.02); }
    else if (kind === 'whistle' || kind === 'horn' || kind === 'toots') { tone(392, 400, 0.9, 0.05, 'triangle'); tone(494, 500, 0.9, 0.04, 'triangle'); }
  }
}

export class Comic {
  // grab({ t, zoom, at }) → { canvas, pts }: a copy of the pixel play's frame (low-res) and lead/NPC head positions in it
  // draw() renders the footage as it stands (cheap); grab() also copies the frame out (a slow GPU readback)
  constructor({ viewport, stage, audio, grab, draw, found, onExit, onNext, toast }) {
    Object.assign(this, { viewport, stage, audio, grab, draw, found, onExit, onNext, toast });
    this.layer = el('div', 'comic');
    viewport.insertBefore(this.layer, viewport.querySelector('#doors'));
    this.board = el('div', 'board', this.layer);
    this.flashEl = el('div', 'pageflash', this.layer);
    this.whipEl = el('div', 'whip', this.layer);
    this.hud = el('div', 'comic-hud', this.layer, `
      <span class="cnt"></span><span class="keys">CLICK · NEXT &nbsp;/&nbsp; ← BACK &nbsp;/&nbsp; A · AUTO &nbsp;/&nbsp; ESC · PAGE</span>
      <button class="auto" title="Read on by itself, a panel at a time (A)">AUTO ▸▸</button><button class="watch">▶ BACK TO THE FOOTAGE</button>`);
    this.endcard = el('div', 'comic-end', this.layer, `<button class="again">▶ WATCH IT AGAIN</button><button class="next"></button>`);
    this.live = el('canvas', 'press', viewport);
    this.press = new Print(this.live);
    this.baker = new Print();
    this.foley = new Foley(audio);
    this.pages = {};
    this.active = false; this.busy = false;
    this.cam = { x: 0, y: 0, s: 1, r: 0 };
    this.bind();
  }
  has(id) { return COMICS.includes(id); }

  // ── page construction ──
  async load(id) {
    if (this.pages[id]) return this.pages[id];
    const def = (await import(`./comics/${id}.js`)).default;
    await fontsReady();
    const page = { id, def, root: el('div', 'page'), panels: [] };
    Object.assign(page.root.style, { width: def.W + 'px', height: def.H + 'px' });
    paint(page.root, def.palette);
    page.root.insertAdjacentHTML('beforeend', def.mast);
    def.panels.forEach((d, i) => page.panels.push(this.makePanel(page, d, i)));
    this.board.appendChild(page.root);
    page.api = this.api(page);
    await Promise.all(page.panels.map(p => this.bakeArt(p)));
    for (const p of page.panels) p.fx = (await p.d.setup?.(page.api, p)) || {};
    page.fx = (await def.setup?.(page.api, page)) || {};          // page-wide effects (rain, a train across the page…)
    if (def.cover) await this.buildCover(page);
    this.agePage(page);
    page.root.querySelectorAll('[data-act]').forEach(a => a.addEventListener('click', e => { e.stopPropagation(); def.actions?.[a.dataset.act]?.(page.api, a); }));
    page.root.remove();
    this.pages[id] = page;
    return page;
  }
  // the issue is a folded Sunday sheet: the cover is the right half of the page folded over, so its back IS the page's
  // left half. The footage lands in the cover's CAM box; a click swings the cover open on the fold (the page's middle).
  async buildCover(page) {
    const c = page.def.cover, root = el('div', 'cover'), pr = { cell: CELL * Q, misreg: MISREG * Q, inks: c.inks, levels: c.levels ?? 4 };
    Object.assign(root.style, { left: c.x + 'px', top: '0px', width: c.W + 'px', height: c.H + 'px' });
    paint(root, page.def.palette);
    const front = el('div', 'face front', root), back = el('div', 'face back', root);
    front.insertAdjacentHTML('beforeend', c.html);
    const [ax, ay, aw, ah] = c.art.rect, slot = front.querySelector('.cv-art') || front;
    const cv = el('canvas', 'art', slot); cv.width = aw * Q; cv.height = ah * Q;
    Object.assign(slot.style, { left: ax + 'px', top: ay + 'px', width: aw + 'px', height: ah + 'px' });
    const img = await loadImg(c.art.src), src = img || placeholder(cv.width, cv.height, 'COVER ART');
    this.baker.into(cv, src, { ...pr, crop: coverCrop(src.naturalWidth || src.width, src.naturalHeight || src.height, cv.width, cv.height, c.art.fx ?? 0.5, c.art.fy ?? 0.5) });
    const strip = c.heads && await loadImg(c.heads.src);
    if (strip) front.querySelectorAll('[data-head]').forEach(h => {
      const k = el('canvas', '', h); k.width = k.height = c.heads.size * Q;
      this.baker.into(k, strip, { ...pr, crop: [+h.dataset.head / c.heads.n, 0, 1 / c.heads.n, 1] });
    });
    const [bx, by, bw, bh] = c.box, box = el('div', 'cover-box', front);
    Object.assign(box.style, { left: bx + 'px', top: by + 'px', width: bw + 'px', height: bh + 'px' });
    const cam = front.querySelector('.cv-cam');          // the box's LIVE label rides on top of it, wherever the issue puts it
    if (cam) Object.assign(cam.style, { left: bx + 'px', top: by - 30 + 'px', width: bw + 'px' });
    const bcv = el('canvas', 'art', box); bcv.width = bw * Q; bcv.height = bh * Q;
    if (c.worn) {                                       // read to bits: rubbed corners, chipped edges, creases, stains
      const L = { ...WEAR, ...c.worn }, { rub, grime } = wearLayers(c.W, c.H, { seed: c.worn.seed, q: Q, L });
      front.style.clipPath = `path('${wornShape(c.W, c.H, c.worn.seed, L)}')`;
      grime.className = 'wear grime'; rub.className = 'wear rub'; front.append(grime, rub);
    }
    el('div', 'shade', front); el('div', 'shade', back);
    const shadow = el('div', 'cover-shadow');
    Object.assign(shadow.style, { left: c.x + 'px', top: '0px', width: c.W + 'px', height: c.H + 'px' });
    const light = spreadLight(page.def.W, { q: Q }); light.className = 'spread-light'; page.root.appendChild(light);   // the fold: valley and bulges
    page.turnShade = ['r', 'l'].map(k => { const e = el('div', 'turn-shade ' + k); Object.assign(e.style, { left: (k === 'r' ? c.x : c.x - c.W) + 'px', width: c.W + 'px', height: c.H + 'px' }); return e; });
    page.cover = root; page.coverBack = back; page.coverShadow = shadow;
    page.coverStop = { d: { rect: [c.x, 0, c.W, c.H], tilt: 0 }, i: 0 };
    // the footage lands in the CAM box framed no closer than 2.2×: pulling back to the whole cover from much closer meant
    // rasterising the sheet at a huge zoom on the way out (dropped frames)
    page.coverBox = { d: { id: 'cover-box', rect: [c.x + bx, by, bw, bh], art: { pixel: {} }, tilt: 0, maxZoom: c.landZoom ?? 2.2 }, i: 0, page, root: box, cv: bcv, w: bw, h: bh, q: Q,
      shape: [[0, 0], [bw, 0], [bw, bh], [0, bh]], steps: [], pts: {}, timers: [], fx: {} };
  }
  // the inside of the sheet is as old as its cover: tanned edges, foxing, the ink cracked along the fold, rubbed corners
  agePage(page) {
    const { W, H, cover } = page.def, seed = cover?.worn?.seed ?? 3, L = { ...WEAR, ...cover?.worn };
    // kept as images, not canvases: the back of the cover is a copy of the page, and an image copies for free
    const asImg = (c, cls) => { const im = new Image(); im.className = cls; im.alt = ''; c.toBlob(b => { im.src = URL.createObjectURL(b); }); return im; };
    const { rub, grime } = spreadWear(W, H, { seed, L });
    page.root.append(asImg(grime, 'wear grime'), asImg(rub, 'wear rub'));
    page.edge = wornSpread(W, H, seed, L);
    if (page.coverBack) page.coverBack.style.clipPath = `path('${page.edge.left}')`;     // its corners worn like the page it shows
    page.shadow = el('div', 'page-shadow'); Object.assign(page.shadow.style, { width: W + 'px', height: H + 'px' });
    this.clipPage(page, true);
  }
  // the worn outline of the whole sheet, or of the half lying under the shut cover (its shadow follows)
  clipPage(page, full) {
    page.root.style.clipPath = `path('${full ? page.edge.full : page.edge.right}')`;
    page.shadow.style.clipPath = full ? 'none' : `inset(-160px -160px -160px ${page.def.W / 2}px)`;
  }
  // the back of the cover shows the page's left half: a copy of the page as it is right now (canvases copied by hand)
  backOfCover(page) {
    // panels wholly on the right never show on the back, so they are left out (less to copy, less to paint mid-turn)
    const half = page.def.W / 2, skip = [...page.root.children].filter(e => parseFloat(e.style.left) >= half);
    skip.forEach(e => { e.dataset.skip = ''; });
    const copy = page.root.cloneNode(true);
    skip.forEach(e => { delete e.dataset.skip; });
    copy.querySelectorAll('[data-skip]').forEach(e => e.remove());
    const from = [...page.root.querySelectorAll('canvas')].filter(k => !skip.some(e => e.contains(k))), to = copy.querySelectorAll('canvas');
    to.forEach((k, i) => k.getContext('2d').drawImage(from[i], 0, 0));
    copy.getAnimations?.().forEach(a => a.cancel());
    Object.assign(copy.style, { opacity: 1, clipPath: `path('${page.edge.full}')`, left: '0px', top: '0px' });
    page.coverBack.querySelector('.page')?.remove();
    page.coverBack.prepend(copy);
  }
  // swing the cover open (or shut) on the fold
  book(open) {
    const page = this.page, cv = page.cover;
    if (!cv || this.isOpen === open) return;
    this.isOpen = open;
    const turnId = this.turnId = {};
    this.foley.play('page');
    this.backOfCover(page);
    cv.style.visibility = 'visible';
    // shutting, the cover first comes up over the left half (it shows the same page) and gets painted before the real left
    // half is cut away, so the swap never shows a frame of nothing; landing open, the page comes back before the cover goes
    if (open) this.turn(page, open, turnId); else requestAnimationFrame(() => requestAnimationFrame(() => this.turn(page, open, turnId)));
  }
  turn(page, open, turnId) {
    if (this.turnId !== turnId) return;
    const cv = page.cover;
    this.clipPage(page, false);                         // the left half is the back of the cover until it lands
    // the sheet turns on a sine ease about the fold; its shadow falls on the half it is leaving, then on the half it lands on
    const o = { duration: open ? 1400 : 1100, easing: 'linear', fill: 'forwards', direction: open ? 'normal' : 'reverse' };
    const N = 16, frames = Array.from({ length: N + 1 }, (_, i) => { const k = i / N, th = Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * k)); return { k, th }; });
    const turn = cv.animate(frames.map(({ k, th }) => ({ offset: k, transform: `rotateY(${(-th * 180 / Math.PI).toFixed(2)}deg)` })), o);
    const [shR, shL] = page.turnShade;
    shR.animate(frames.map(({ k, th }) => ({ offset: k, opacity: th < Math.PI / 2 ? Math.sin(th) : Math.sin(th) * (2 - 2 * th / Math.PI),
      transform: `scaleX(${Math.min(1, Math.max(0, Math.cos(th)) + 0.16 * Math.sin(th)).toFixed(3)})` })), o);
    shL.animate(frames.map(({ k, th }) => ({ offset: k, opacity: th > Math.PI / 2 ? Math.sin(th) : 0,
      transform: `scaleX(${Math.min(1, Math.max(0, -Math.cos(th)) + 0.16 * Math.sin(th)).toFixed(3)})` })), o);
    cv.querySelector('.front .shade').animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.5 }, { opacity: 0.55 }], o);
    cv.querySelector('.back .shade').animate([{ opacity: 0.55 }, { opacity: 0.55, offset: 0.5 }, { opacity: 0 }], o);
    page.coverShadow.animate([{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], o);
    turn.onfinish = () => {
      if (this.turnId !== turnId || !open || !this.isOpen) return;
      this.clipPage(page, true);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (this.turnId === turnId && this.isOpen) cv.style.visibility = 'hidden'; }));
    };
  }
  shut(page) {
    this.isOpen = false; this.turnId = {};
    for (const e of [page.cover, page.root, page.coverShadow, ...page.turnShade, ...page.cover.querySelectorAll('.shade')]) e.getAnimations().forEach(a => a.cancel());
    page.cover.style.visibility = 'visible';
    page.root.style.opacity = 1;
    this.clipPage(page, false);
  }
  makePanel(page, d, i) {
    // a panel is a polygon in page px (slanted gutters, trapezoids, round insets); its bounding box is what the camera frames
    const poly = d.poly || [[d.rect[0], d.rect[1]], [d.rect[0] + d.rect[2], d.rect[1]], [d.rect[0] + d.rect[2], d.rect[1] + d.rect[3]], [d.rect[0], d.rect[1] + d.rect[3]]];
    const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    d.rect = [x, y, w, h];
    const shape = poly.map(([a, b]) => [a - x, b - y]), pts = shape.map(q => q.join(',')).join(' ');
    const root = el('div', 'panel ' + (d.inset ? 'inset ' : '') + (d.cls || ''), page.root);
    Object.assign(root.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    const clip = el('div', 'clip', root);
    clip.style.clipPath = `polygon(${shape.map(([a, b]) => `${a}px ${b}px`).join(',')})`;
    const q = d.q ?? Q;                                  // small insets print finer: the camera gets close to them
    const cv = el('canvas', 'art', clip); cv.width = Math.round(w * q); cv.height = Math.round(h * q);
    const frame = svgEl('svg', root, { class: 'frame', viewBox: `0 0 ${w} ${h}` });
    if (d.inset) svgEl('polygon', frame, { class: 'mat', points: pts });
    svgEl('polygon', frame, { class: 'ink', points: pts });
    const ov = el('div', 'ov', root);
    const p = { d, i, page, root, clip, cv, ov, w, h, q, shape, step: -1, pts: {}, timers: [] };
    p.steps = (d.steps || []).map((list, si) => list.map((o, j) => this.makeItem(p, o, si * 10 + j + i * 100)));
    return p;
  }
  async bakeArt(p) {
    const a = p.d.art || {};
    if (a.fill) { const g = p.cv.getContext('2d'); g.fillStyle = a.fill; g.fillRect(0, 0, p.cv.width, p.cv.height); return; }    // a flat panel (a blackout)
    const img = a.img && await loadImg(a.img);
    p.src = img || (a.pixel ? null : placeholder(p.cv.width, p.cv.height, a.ph || p.d.id));
    if (p.src) this.bake(p, p.src, a);
  }
  bake(p, src, o = {}) {
    const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
    const crop = o.crop || coverCrop(sw, sh, p.cv.width, p.cv.height, o.fx ?? 0.5, o.fy ?? 0.5, o.zoom ?? 1);
    return this.baker.into(o.into || p.cv, src, { cell: CELL * p.q, misreg: MISREG * p.q, ...o, crop });
  }
  bakePixel(p, shot) {
    const a = p.d.art.pixel;
    shot ||= this.grab({ t: a.t, zoom: a.zoom, at: a.at, hud: a.hud, marks: a.marks });
    const sw = shot.canvas.width, sh = shot.canvas.height;
    const crop = shot.crop || coverCrop(sw, sh, p.w, p.h, 0.5 + (a.dx || 0), 0.5 + (a.dy || 0));
    this.baker.into(p.cv, shot.canvas, { nearest: true, crop, cell: CELL * p.q, misreg: MISREG * p.q, exposure: p.page.def.pixelExposure ?? 1 });
    p.pts = {};
    for (const [name, [x, y]] of Object.entries(shot.pts)) p.pts[name] = [(x / sw - crop[0]) / crop[2], (y / sh - crop[1]) / crop[3]];
  }

  // ── lettering: captions, balloons, sound effects, footnotes ──
  makeItem(p, o, seed) {
    let it;
    if (o.cap != null || o.note != null) {
      // captions and editor's notes: hand-ruled boxes that hug balanced lines; tucked into a corner, slanted, dog-eared or tilted
      const note = o.note != null, text = note ? o.note : o.cap;
      it = el('div', `it cap ${note ? 'note' : ''} ${o.tone || (note ? 'cream' : '')} ${o.dark ? 'dark' : ''}`, p.ov);
      const svg = svgEl('svg', it, { class: 'bg' }), txt = el('div', 'txt', it, text);
      it.style.setProperty('--tilt', (o.corner ? 0 : o.tilt ?? ((mulberry32(seed)() - 0.5) * 2.4)) + 'deg');
      it.layout = () => {
        if (!text.includes('<')) txt.innerHTML = letterLines(txt, text, o.aspect ?? (note ? 6 : 3.6), (o.w || 0.6) * p.w).join('<br>');
        const slant = o.shape === 'slant' ? 14 : 0, px = 11 + slant, py = 7;
        let w = txt.offsetWidth + px * 2, h = txt.offsetHeight + py * 2, tx = px;
        let x = o.x * p.w, y = o.y * p.h;
        if (o.corner) {
          // tucked into a corner of a slanted panel, the box runs out to the panel's bounding box and the panel's edge
          // cuts it on the slant; it grows by the cut so the lettering stays clear of the edge
          const right = o.corner[1] === 'r';
          y = o.corner[0] === 'b' ? p.h - h : 0;
          const cut = Math.max(0, ...[0, 0.5, 1].map(k => { const [a, b] = rowSpan(p.shape, y + k * h); return right ? p.w - b : a; }));
          w += cut; if (!right) tx += cut;
          x = right ? p.w - w : 0;
          it.style.clipPath = cut > 0.5 ? `polygon(${p.shape.map(([a, b]) => `${(a - x).toFixed(1)}px ${(b - y).toFixed(1)}px`).join(',')})` : '';
        } else if (o.center) x -= w / 2;
        Object.assign(it.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        Object.assign(txt.style, { left: tx + 'px', top: py + 'px' });
        Object.assign(svg.style, { width: w + 'px', height: h + 'px' });
        svg.innerHTML = `<path d="${capPath(w, h, o.shape, seed, !!o.corner)}"/>`;
      };
    } else if (o.say != null) {
      it = el('div', `it say ${o.kind || ''} ${o.who || ''}`, p.ov);            // `who` paints a lead's balloon in their colour
      const svg = svgEl('svg', it, { class: 'bg' }), txt = el('div', 'txt', it, o.say);
      it.layout = () => {
        it.lines = o.say.includes('<') ? null : letterLines(txt, o.say, o.aspect ?? 1.9, (o.w || 0.42) * p.w);
        if (it.lines) txt.innerHTML = it.lines.join('<br>');
        const tw = txt.offsetWidth, th = txt.offsetHeight, cx = o.x * p.w, cy = o.y * p.h;
        if (o.slow) txt.innerHTML = it.lines.map(l => `<span class="ghost">${l}</span>`).join('<br>');
        Object.assign(txt.style, { left: cx - tw / 2 + 'px', top: cy - th / 2 + 'px' });
        const a = tw / 2 * 1.2 + 15, b = th / 2 * 1.3 + 12;
        const shape = o.kind === 'shout' || o.kind === 'yoyo' ? burstPath(cx, cy, a, b, seed + 3) : o.kind === 'thought' ? cloudPath(cx, cy, a, b) : ellipsePath(cx, cy, a, b);
        let tail = '', tip = [cx, cy + b];
        const to = typeof o.to === 'string' ? p.pts[o.to.slice(1)] : o.to;
        if (to) {
          const tx = to[0] * p.w, ty = to[1] * p.h, dx = tx - cx, dy = ty - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
          const re = 1 / Math.sqrt((ux / a) ** 2 + (uy / b) ** 2), len = clamp(d - re - (o.gap ?? 10), 14, o.max ?? 110);
          tip = [cx + ux * (re + len), cy + uy * (re + len)];
          if (o.kind === 'thought') {
            tail = [0.35, 0.65, 0.9].map((k, i) => ellipsePath(cx + ux * (re + len * k), cy + uy * (re + len * k), 9 - i * 3, 7 - i * 2.2)).join('');
          } else {
            const bw = Math.min(13, a * 0.3), bx = cx + ux * re * 0.72, by = cy + uy * re * 0.72;
            const mx = (bx + tip[0]) / 2 - uy * bw * 0.9, my = (by + tip[1]) / 2 + ux * bw * 0.9;
            tail = `M${bx - uy * bw},${by + ux * bw}Q${mx},${my} ${tip[0]},${tip[1]}L${bx + uy * bw},${by - ux * bw}Z`;
          }
        }
        svg.innerHTML = `<path class="tl" d="${tail}"/><path class="sh" d="${shape}"/>` + (o.kind === 'thought' ? '' : `<path class="tf" d="${tail}"/>`);
        it.style.transformOrigin = `${tip[0]}px ${tip[1]}px`;
      };
      it.txt = txt;
    } else if (o.sfx != null) {
      it = el('div', 'it sfx', p.ov, o.sfx.split('').map((ch, i) => `<i style="--k:${i}">${ch === ' ' ? '&nbsp;' : ch}</i>`).join(''));
      Object.assign(it.style, { left: o.x * p.w + 'px', top: o.y * p.h + 'px', fontSize: (o.size || 48) + 'px' });
      for (const [k, v] of [['--rot', (o.rot ?? -8) + 'deg'], ['--fill', o.fill || '#f7d64a'], ['--shade', o.shade || '#e0507a']]) it.style.setProperty(k, v);
    } else if (o.tag != null) {
      it = el('div', 'it tag', p.ov, o.tag);
      if (o.x != null) it.style.left = o.x * p.w + 'px';
    } else it = el('div', 'it fn', p.ov);
    it.o = o;
    return it;
  }
  show(p, it) {
    it.layout?.();                                       // measured now: the page is on screen (it may have been hidden at build time)
    it.classList.add('on');
    if (it.o.fn) p.fx[it.o.fn]?.(it);
    if (it.o.snd !== undefined) this.foley.play(it.o.snd, { gain: it.o.sndGain ?? 1 });
    if (it.o.sfx != null) { if (it.o.snd === undefined) this.foley.play('thud'); if (it.o.shake !== false) this.shake(p); }
    else if (it.o.say != null && it.o.snd === undefined) this.foley.play('pop', { gain: it.o.kind === 'whisper' ? 0.5 : 1 });
    if (it.o.slow) {                                    // typed out one letter at a time, line breaks already set
      const total = it.lines.join('').length; let n = 0;
      const tick = () => {
        if (!it.classList.contains('on')) return;
        let left = ++n;
        it.txt.innerHTML = it.lines.map(l => { const k = Math.max(0, Math.min(l.length, left)); left -= l.length; return l.slice(0, k) + `<span class="ghost">${l.slice(k)}</span>`; }).join('<br>');
        if (n < total) p.timers.push(setTimeout(tick, it.o.slow));
      };
      tick();
    }
  }
  showStep(p, si) {
    p.step = si; this.stepAt = performance.now();
    p.fx.step?.(si);
    (p.steps[si] || []).forEach((it, j) => {
      if (it.o.vt != null || it.o.at != null) return;   // timed to the panel's video / soundtrack instead
      const at = it.o.delay ?? j * STAGGER;
      if (at <= 0) this.show(p, it); else p.timers.push(setTimeout(() => this.show(p, it), at));
    });
  }
  // finish a step that is still revealing (a click during the stagger completes it instead of moving on)
  flush(p) {
    const pending = (p?.steps[p.step] || []).filter(it => !it.classList.contains('on') && it.o.vt == null && it.o.at == null);
    p?.timers.forEach(clearTimeout); if (p) p.timers = [];
    for (const it of p?.steps[p.step] || []) if (it.o.slow && it.classList.contains('on')) it.txt.innerHTML = it.lines.join('<br>');
    pending.forEach(it => this.show(p, it));
    return pending.length > 0;
  }
  resetPanel(p) {
    p.timers.forEach(clearTimeout); p.timers = []; p.step = -1;
    for (const s of p.steps) for (const it of s) it.classList.remove('on');
    p.fx.reset?.();
  }
  resetPage(page) {
    for (const p of page.panels) this.resetPanel(p);
    page.root.querySelectorAll('.page-it').forEach(e => e.classList.remove('on'));
    page.fx?.reset?.();
  }
  shake(p) { p.root.classList.remove('shake'); void p.root.offsetWidth; p.root.classList.add('shake'); }
  flash(ms = 90, color = '#fffef6') {
    this.flashEl.style.background = color;
    this.flashEl.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: ms * 3, easing: 'ease-out' });
  }

  // helpers handed to each page's panel hooks
  api(page) {
    return {
      Q, page, foley: this.foley,
      bake: (p, src, o) => this.bake(p, src, o),
      print: (src, w, h, o) => { const c = el('canvas'); c.width = w; c.height = h; return this.baker.into(c, src, { cell: CELL * Q, misreg: MISREG * Q, ...o }); },
      img: loadImg, placeholder, el, svgEl,
      flash: (ms, c) => this.flash(ms, c), shake: p => this.shake(p),
      found: id => this.found?.(id), toast: (...a) => this.toast?.(...a),
      exit: t => this.exit(t), show: (p, it) => this.show(p, it),
      pointer: () => this.pointer,                      // last pointer position in page px ({ x, y, t: when })
      item: (p, o) => this.makeItem(p, o, 900 + p.i),  // lettering outside the steps (shown by the panel's own hooks)
      segTime: () => this.segTime(),
      video: (p, extra) => this.videoFx(p, extra),
      look: (p, at, z = 1, ms = 900) => this.tweenCam(this.tourCam(p, { at, z }), ms),       // move the camera within a panel
      camTo: (cam, ms = 600, whip = false) => (whip ? this.whip(cam, ms) : this.tweenCam(cam, ms)),
      fit: p => this.fitCam(p),
      cam: () => ({ ...this.cam }),
      setCam: cam => { this.endTween(); this.cam = { ...this.cam, ...cam }; this.applyCam(); this.driven(); },
      invert: src => { const c = el('canvas'); c.width = src.naturalWidth || src.width; c.height = src.naturalHeight || src.height; const g = c.getContext('2d'); g.filter = 'invert(1)'; g.drawImage(src, 0, 0); return c; },
      goNext: () => { if (this.active && !this.busy) this.go(this.idx + 1); },
      exhibit: (p, o) => this.exhibitFx(p, o),
      sticker: (p, o) => this.stickerFx(p, o),
    };
  }
  // a panel whose art is followed by a clip (`art.video`): `fn: 'roll'` plays it, baked frame by frame through the press;
  // items with `vt` (seconds into the clip) appear on cue
  videoFx(p, extra = {}) {
    const a = p.d.art, items = p.steps.flat().filter(it => it.o.vt != null);
    const v = el('video'); Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src: a.video });
    let ok = false, bucket = -1, t0 = 0, playing = false;
    const start = () => { v.currentTime = 0; v.play().catch(() => {}); };
    // a clip that is still loading when its panel comes up starts as soon as it can (the cues wait on the wall clock until then)
    v.addEventListener('loadeddata', () => { ok = true; if (playing) start(); });
    const due = time => items.forEach(it => { if (time >= it.o.vt && !it.classList.contains('on')) this.show(p, it); });
    return {
      ...extra,
      roll: () => {
        playing = true; t0 = performance.now(); bucket = -1;
        if (ok) start();
      },
      frame: now => {
        if (!playing) return;
        const time = ok ? v.currentTime : (now - t0) / 1000;
        if (ok) { const b = Math.floor(time * a.fps); if (b !== bucket) { bucket = b; this.bake(p, v); } }
        due(time);
        if (ok ? v.ended : time > 4) playing = false;
        extra.frame?.(now, time);
      },
      leave: () => { if (playing) { due(99); playing = false; } v.pause(); extra.leave?.(); },
      reset: () => { playing = false; v.pause(); this.bake(p, p.src); extra.reset?.(); },
    };
  }
  // YOYO signs off an issue: a head from the cover's cast strip (`i` of `n`) stuck on the panel's corner like a sticker,
  // swaying, with a little mark (a heart; a question mark while she is still a mystery) floating off it
  async stickerFx(p, { src, i, n = 7, mark = '♥' }) {
    const sig = el('div', 'yoyo-sig', p.ov), face = el('div', 'face', sig), strip = await loadImg(src);
    if (strip) { const c = el('canvas', '', face); c.width = c.height = 220; this.baker.into(c, strip, { cell: CELL * Q, misreg: MISREG * Q, crop: [i / n, 0, 1 / n, 1] }); }
    el('i', 'heart', sig, mark);
    return {
      sticker: () => { sig.classList.add('on'); this.foley.play('pop'); },
      reset: () => sig.classList.remove('on'),
    };
  }
  // the case file on the page: the floor's evidence is filed if it was clicked in the footage, otherwise a way back to it
  exhibitFx(p, { id, letter, what, back, hint = '▶ Find it in the footage', pos }) {
    let tag;
    return {
      exhibit: () => {
        tag?.remove();
        const got = this.found?.(id);
        tag = el(got ? 'div' : 'button', 'exhibit ' + (got ? 'got' : 'miss'), p.ov,
          `EXHIBIT ${letter}<small>${what}<br>${got ? 'In your case file ✓' : 'Not in your case file yet.<br>' + hint}</small>`);
        if (!got) tag.addEventListener('click', e => { e.stopPropagation(); this.exit(back, true); });
        if (pos) Object.assign(tag.style, { left: pos[0] * p.w + 'px', top: pos[1] * p.h + 'px' });
        requestAnimationFrame(() => tag.classList.add('on'));
      },
      reset: () => { tag?.remove(); tag = null; },
    };
  }

  // ── camera: a page point at the viewport centre, a scale, a slight tilt ──
  vsize() { return [this.viewport.clientWidth || 1, this.viewport.clientHeight || 1]; }      // the layer fills the viewport (and may still be hidden)
  fitCam(p, extra = 0) {
    const [x, y, w, h] = p.d.rect, [vw, vh] = this.vsize(), pad = PAD + extra;
    const s = Math.min((vw - pad * 2) / w, (vh - pad * 2 - 46) / h, p.d.maxZoom ?? 9, MAX_S);
    return { x: x + w / 2, y: y + h / 2 + 23 / s, s, r: p.d.tilt ?? (p.i % 2 ? 0.5 : -0.5) };      // sits a little high: the reading bar is below
  }
  overCam() {
    const { W, H } = this.page.def, [vw, vh] = this.vsize();
    const s = Math.min((vw - PAD * 2) / W, (vh - PAD * 2 - 40) / H);
    return { x: W / 2, y: H / 2 + 20 / s, s, r: 0 };
  }
  screenRect([x, y, w, h], cam) {
    const [vw, vh] = this.vsize();
    return { x: vw / 2 + (x - cam.x) * cam.s, y: vh / 2 + (y - cam.y) * cam.s, w: w * cam.s, h: h * cam.s };
  }
  applyCam() {
    const [vw, vh] = this.vsize(), { x, y, s, r } = this.cam;
    this.board.style.transform = `translate(${vw / 2}px,${vh / 2}px) rotate(${r}deg) scale(${s}) translate(${-x}px,${-y}px)`;
  }
  // `via`: page points to pass through on the way (the camera follows a line drawn on the page); `onK` hears the progress
  tweenCam(to, ms, { via, onK, easing = ease } = {}) {
    const from = { ...this.cam }, d = Math.hypot(to.x - from.x, to.y - from.y);
    ms ??= 700 + Math.min(500, d * 0.5);
    this.tw = { from, to, t0: performance.now(), ms, dip: via ? 0 : clamp(d / 1100) * 0.16, path: via && trail([[from.x, from.y], ...via, [to.x, to.y]]), onK, easing };
    this.moving();
    return new Promise(r => { this.tw.done = r; });
  }
  stepCam(now) {
    const tw = this.tw;
    if (tw) {
      const k = tw.easing(clamp((now - tw.t0) / tw.ms)), { from: a, to: b } = tw;
      const [x, y] = tw.path ? tw.path(k) : [lerp(a.x, b.x, k), lerp(a.y, b.y, k)];
      this.cam = { x, y, r: lerp(a.r, b.r, k), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)) * (1 - tw.dip * Math.sin(Math.PI * k)) };
      this.applyCam();
      tw.onK?.(k);
      if (k >= 1) this.endTween();
    }
  }
  // a panel's own camera move: `tour` stops are [fx, fy, zoom × fit] in the panel (or 'fit'), each with `ms` to get there
  // and `hold` before the next; the first stop is where the camera arrives. A click skips to the end of the tour.
  tourCam(p, stop) {
    const fit = this.fitCam(p);
    if (!stop || stop.at === 'fit') return fit;
    const [x, y, w, h] = p.d.rect;
    return { x: x + stop.at[0] * w, y: y + stop.at[1] * h, s: Math.min(fit.s * (stop.z ?? 1), MAX_S), r: stop.r ?? fit.r };
  }
  async runTour(p, token) {
    const stops = p.d.tour, T = this.touring = { skip: false };
    const live = () => this.token === token && this.active;
    const pause = async ms => { const end = performance.now() + ms; while (performance.now() < end && !T.skip && live()) await wait(30); };
    for (let i = 1; i < stops.length && !T.skip && live(); i++) {
      await pause(stops[i - 1].hold ?? 300);
      if (T.skip || !live()) break;
      await this.tweenCam(this.tourCam(p, stops[i]), stops[i].ms ?? 1200, { easing: stops[i].ease === 'linear' ? clamp : ease });
    }
    if (T.skip && live()) await this.tweenCam(this.tourCam(p, stops[stops.length - 1]), 350);
    if (this.touring === T) this.touring = null;
  }
  // a whip pan: a fast move with comic speed lines streaking the way it goes
  whip(to, ms = 320) {
    const [vw, vh] = this.vsize(), dx = (to.x - this.cam.x) * this.cam.s, dy = (to.y - this.cam.y) * this.cam.s;
    this.whipEl.style.transform = `rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1)}deg)`;
    this.whipEl.animate([{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: ms + 120, easing: 'ease-out' });
    this.foley.play('whip');
    return this.tweenCam(to, ms, { easing: k => (k = clamp(k), k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2) });
  }
  // While the camera moves, the board is a cached compositor layer (will-change: transform: the move scales the bitmap
  // it has); when it stops, the layer goes and the page re-rasters crisp at the new zoom. Making the layer costs a full
  // raster (~0.1–0.2 s on the alley's page), so it is made again a moment after each stop, while the page sits still and
  // the reader reads: the next move then starts at once, instead of freezing and jumping ahead.
  moving() { clearTimeout(this.layerT); this.board.style.willChange = 'transform'; }
  still() {
    this.board.style.willChange = '';
    clearTimeout(this.layerT);
    this.layerT = setTimeout(() => { if (this.active && !this.tw) this.board.style.willChange = 'transform'; }, 600);
  }
  // a camera moved frame by frame (a panel's hook riding the alley's train, the wheel, a drag) is a move too: still
  // once it has not moved for a moment (re-rastering on every frame of the train ride ran at ~13 fps)
  driven() {
    this.moving();
    clearTimeout(this.stillT);
    this.stillT = setTimeout(() => { if (!this.tw) this.still(); }, 250);
  }
  // stop travelling where we are (arrived, or interrupted by a drag/wheel); whoever waits on the move carries on
  endTween() {
    const tw = this.tw; if (!tw) return;
    this.tw = null; this.still();
    tw.done();
  }

  // ── reading order: overview → panels → the end ──
  panelAt(page, t) { let r = page.panels[0]; for (const p of page.panels) if (p.d.t != null && p.d.t <= t + 1e-3) r = p; return r; }
  go(i) {
    const stops = this.stops; i = clamp(i, 0, stops.length - 1);
    const prev = this.panel, forward = i === this.idx + 1;
    if (prev) {
      this.flush(prev);
      for (const it of prev.steps.flat()) if (it.o.at != null && !it.o.fn && !it.classList.contains('on')) this.show(prev, it);   // its soundtrack cues, unheard
      prev.fx.leave?.(); prev.root.classList.remove('focus');
    }
    const s = stops[i], p = typeof s === 'object' ? s : null;
    if (p?.d.audio !== 'keep') this.stopSeg();
    if (p) this.resetPanel(p);                          // coming back to a panel replays it from the top
    this.idx = i;
    this.panel = p;
    this.endcard.classList.toggle('on', false);
    if (p) this.page.root.querySelector('.finale')?.classList.remove('on');      // re-reading: the stamp waits for the end again
    this.foley.play('swish'); this.stepAt = performance.now();
    const cam = p ? this.tourCam(p, p.d.tour?.[0]) : s === 'cover' ? this.fitCam(this.page.coverStop) : this.overCam();
    if (this.page.cover) this.book(s !== 'cover');
    // reading on from the panel before, a `via` line carries the camera across the gutters (and tells the panel how far it got)
    // a `cut` panel is jumped to (no move at all); a `whip` panel is swung to fast, through speed lines
    const via = forward && p?.d.via;
    let done;
    if (forward && p?.d.cut) { this.endTween(); this.cam = cam; this.applyCam(); done = Promise.resolve(); }
    else if (via) done = this.tweenCam(cam, p.d.viaMs ?? 1600, { via, onK: k => p.fx.via?.(k) });
    else if (forward && p?.d.whip) done = this.whip(cam);
    else done = this.tweenCam(cam);
    this.paintHud();
    const token = this.token = {};
    done.then(() => {
      if (this.token !== token || !this.active) return;
      if (p) {
        p.root.classList.add('focus');
        if (Array.isArray(p.d.audio)) this.playSeg(p.d.audio);
        p.fx.enter?.();
        if (p.step < 0) this.showStep(p, 0);
        if (p.d.tour?.length > 1) this.runTour(p, token);
      } else if (s === 'end') this.finale();
      else if (s === 'over') { this.page.fx.over?.(!this.page.overSeen); this.page.overSeen = true; }
    });
  }
  next() {
    if (!this.active || this.busy) return;
    const p = this.panel;
    if (this.touring && !this.touring.skip) { this.touring.skip = true; if (this.tw) this.tw.t0 = -1e9; return; }   // a click during a panel's own move ends it
    if (this.tw) { this.tw.t0 = -1e9; return; }          // a click while the camera travels lands it now
    if (p && this.flush(p)) return;
    if (p && p.step < p.steps.length - 1) { this.showStep(p, p.step + 1); return; }
    if (this.idx < this.stops.length - 1) this.go(this.idx + 1);
  }
  prev() { if (this.active && !this.busy && this.idx > 0) this.go(this.idx - 1); }
  // AUTO: the page reads itself, the way a reader would: each step waits for its panel's soundtrack (and video) to finish
  // and for long enough to read what it lettered, then moves on; it stops at the end, or when the reader goes back
  setAuto(on) {
    this.auto = !!on; this.stepAt = performance.now();
    this.hud.querySelector('.auto').classList.toggle('on', this.auto);
  }
  autoStep(now) {
    if (!this.active || this.busy || this.tw || this.touring) return;
    const s = this.stops[this.idx], p = this.panel;
    if (s === 'end') { this.setAuto(false); return; }
    let dwell = 2600;
    if (p) {
      if (this.seg) return;                              // its stretch of soundtrack is still playing
      const words = (p.steps[p.step] || []).reduce((n, it) => n + (it.textContent || '').length, 0);
      dwell = Math.min(6500, 1500 + words * 32);
    }
    if (now - (this.stepAt ?? now) < dwell) return;
    this.stepAt = now;
    this.next();
  }
  finale() {
    const f = this.page.root.querySelector('.finale');
    if (f) { f.classList.add('on'); setTimeout(() => this.foley.play('stamp'), 200); }
    this.endcard.querySelector('.next').textContent = this.page.def.next || 'NEXT FLOOR ↓';
    setTimeout(() => this.endcard.classList.add('on'), 900);
  }
  paintHud() {
    const n = this.page.panels.length, p = this.panel, s = this.stops[this.idx];
    this.hud.querySelector('.cnt').textContent = p ? `PANEL ${p.i + 1} / ${n}` : s === 'cover' ? 'THE COVER · CLICK TO OPEN' : s === 'over' ? `THE PAGE · ${n} PANELS` : 'THE END';
    // one way back to the footage (the transport's ▶ does the same): to this panel's moment, or to where you left it
    this.hud.querySelector('.watch').textContent = p?.d.t != null ? '▶ WATCH THIS SCENE' : '▶ BACK TO THE FOOTAGE';
  }

  // ── each panel replays its stretch of the floor's soundtrack ──
  playSeg([a, b]) {
    const au = this.audio;
    this.seg = { a, b };
    this.clock = { a, t0: performance.now() };
    au.volume = 0;
    try { au.currentTime = a; } catch {}
    au.play().catch(() => {});
  }
  stopSeg() { if (this.seg) { this.audio.pause(); this.audio.volume = 1; this.seg = null; } }
  stepSeg() {
    const s = this.seg; if (!s) return;
    const t = this.audio.currentTime;
    this.audio.volume = clamp((t - s.a) / 0.15) * clamp((s.b - t) / 0.45);
    if (t >= s.b || this.audio.ended) this.stopSeg();     // a stretch may run to the very end of the track (the alley's ends past it)
  }

  // the floor time the focused panel's soundtrack has reached (the wall clock stands in when the audio isn't moving)
  segTime() {
    const c = this.clock; if (!c) return null;
    // trust the audio only while it agrees with the wall clock (a seek can fail when the file is not buffered yet)
    const au = this.audio, wall = c.a + (performance.now() - c.t0) / 1000;
    return this.seg && !au.paused && Math.abs(au.currentTime - wall) < 0.6 ? au.currentTime : wall;
  }

  // called by the main loop every frame while the comic is open
  frame() {
    const now = performance.now(), p = this.panel;
    this.stepCam(now);
    this.stepSeg();
    if (p?.root.classList.contains('focus')) {        // items with `at` (floor seconds) come in on the soundtrack's cue
      const t = this.segTime();
      if (t != null) for (const it of p.steps.flat()) if (it.o.at != null && t >= it.o.at && !it.classList.contains('on')) this.show(p, it);
    }
    p?.fx.frame?.(now);
    this.page?.fx?.frame?.(now, this.cam);
    if (this.auto) this.autoStep(now);
  }

  // build an issue's page ahead of time (main.js does it while the elevator doors are shut), its footage frames printed,
  // so that going in later is just the press and the camera, not seconds of building
  async prepare(id) {
    if (!this.has(id) || this.active || this.busy) return;
    const page = await this.load(id);
    for (const p of page.panels) if (p.d.art?.pixel && !p.baked) { this.bakePixel(p); p.baked = true; }
    // first-time costs paid now, behind the shut elevator doors: the press's shader compiles, and the page is shown once,
    // all but invisible, at the CAM box's zoom and the whole cover's, so its images are decoded and its layers rasterised
    if (!this.pressWarm) { const k = el('canvas'); k.width = k.height = 4; this.press.render(k, 4, 4); this.pressWarm = true; }
    this.foley.ctx();
    if (page.warm || this.active || this.busy) return;
    // two painted frames, or a moment if the tab is in the background (no frames come then, and loading must not hang)
    const frame = () => Promise.race([new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), wait(150)]);
    this.page = page;
    this.board.replaceChildren(page.shadow, page.root, ...(page.cover ? [...page.turnShade, page.coverShadow, page.cover] : []));
    if (page.cover) this.shut(page);
    this.layer.classList.add('on', 'ghost');
    for (const stop of [page.coverBox || page.panels[0], page.coverStop]) { if (!stop) continue; this.cam = { ...this.fitCam(stop), r: 0 }; this.applyCam(); await frame(); }
    if (!this.active && !this.busy) this.layer.classList.remove('on', 'ghost');
    page.warm = true;
  }

  // the page up but all but invisible, already a compositor layer at this zoom: the camera's first move off it then
  // starts from tiles that are there, instead of rasterising the page at a large zoom on the move's first frame
  ghost() { this.layer.classList.add('on', 'ghost'); this.board.style.willChange = 'transform'; }

  // ── in: the frame on screen is printed and shrinks into its panel; the camera pulls back to the page ──
  async enter(id, { t = 0, atEnd = false } = {}) {
    if (this.active || this.busy || !this.has(id)) return false;
    this.busy = true;
    const page = this.page = await this.load(id);
    this.board.replaceChildren(page.shadow, page.root, ...(page.cover ? [...page.turnShade, page.coverShadow, page.cover] : []));
    this.resetPage(page);
    if (page.cover) { this.shut(page); this.board.style.perspectiveOrigin = `${page.def.W / 2}px ${page.def.H / 2}px`; }
    this.stops = [...(page.cover ? ['cover'] : []), 'over', ...page.panels.filter(p => p.d.stop !== false), 'end'];
    page.overSeen = false;
    const land = page.coverBox || (atEnd ? page.panels[page.panels.length - 1] : this.panelAt(page, t));
    for (const p of page.panels) if (p.d.art?.pixel && !p.baked && !(atEnd && p === land)) { this.bakePixel(p); p.baked = true; }
    // the page goes up straight away, all but invisible, so it is painted by the time it is revealed (no hitch, no flash)
    this.cam = { ...this.fitCam(land), r: 0 }; this.applyCam();

    // push the footage camera in on the room first: the frame that gets printed is the room, not the dark around it
    const st = this.stage, z0 = st.zoom ?? 1, p0 = { ...(st.pan ?? { x: 0, y: 0 }) }, z1 = page.def.pushZoom ?? z0;
    this.view0 = { zoomT: st.zoomT ?? 1, panT: { ...(st.panT ?? { x: 0, y: 0 }) } };
    if (z1 > z0 + 0.05) await anim(650, k => {
      const e = ease(k);
      st.zoom = st.zoomT = lerp(z0, z1, e); st.pan = { x: lerp(p0.x, 0, e), y: lerp(p0.y, 0, e) }; st.panT = { ...st.pan };
      st.applyView(); this.draw();
    });
    const shot = this.grab({}), E = page.def.pixelExposure ?? 1;
    const dpr = devicePixelRatio || 1, vr = this.viewport.getBoundingClientRect(), cr = this.stage.renderer.domElement.getBoundingClientRect();
    const cvr = { x: cr.left - vr.left, y: cr.top - vr.top, w: cr.width, h: cr.height };
    this.cam = { ...this.fitCam(land), r: 0 };
    const pr = this.screenRect(land.d.rect, this.cam);
    const lc = this.live, W = Math.round(cvr.w * dpr), H = Math.round(cvr.h * dpr);
    Object.assign(lc.style, { left: cvr.x + 'px', top: cvr.y + 'px', width: cvr.w + 'px', height: cvr.h + 'px', clipPath: 'none', opacity: 1, display: 'block' });
    const opts = { nearest: true, exposure: E, cell: CELL * this.cam.s * dpr, misreg: MISREG * this.cam.s * dpr, origin: [(pr.x - cvr.x) * dpr, (pr.y - cvr.y) * dpr] };
    this.foley.play('clack');
    // the press: exposure eases up with the ink (a jump to the page's exposure at the first frame read as a flash), and
    // the page goes up all but invisible for the last of it, so it is painted by the time it shows
    await anim(800, k => {
      if (k > 0.85 && !this.layer.classList.contains('on')) this.ghost();
      this.press.render(shot.canvas, W, H, { ...opts, exposure: lerp(1, E, ease(k)), amount: k });
    });
    if (!this.layer.classList.contains('on')) this.ghost();
    if (land.d.art?.pixel) this.bakePixel(land, { ...shot, crop: [(pr.x - cvr.x) / cvr.w, (pr.y - cvr.y) / cvr.h, pr.w / cvr.w, pr.h / cvr.h] });
    document.body.classList.add('comic-on');
    this.layer.classList.remove('ghost');
    this.layer.animate([{ opacity: 0.01 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });     // the page fades up round the frame
    this.applyCam();
    this.active = true;
    await anim(560, k => { lc.style.clipPath = this.shrink(land, pr, cvr, ease(k)); });
    if (!land.d.art?.pixel) await anim(260, k => { lc.style.opacity = 1 - k; });
    lc.style.display = 'none';
    this.entry = { t, atEnd };
    this.busy = false;
    await wait(200);
    this.go(0);
    return true;
  }

  // ── out: zoom to the panel for `t`, the footage takes its place, the press runs backwards ──
  async exit(t = this.entry?.atEnd ? 0 : this.entry?.t ?? 0, hold = false) {
    if (!this.active || this.busy) return;
    this.setAuto(false);
    this.busy = true;
    this.token = {}; this.stopSeg();
    if (this.panel) { this.flush(this.panel); this.panel.fx.leave?.(); }
    this.endcard.classList.remove('on');
    const p = this.page.cover && !this.isOpen ? this.page.coverBox : this.panelAt(this.page, t);
    await this.tweenCam({ ...this.fitCam(p), r: 0 }, 650);
    const shot = this.grab({ t }), E = this.page.def.pixelExposure ?? 1;
    const dpr = devicePixelRatio || 1, vr = this.viewport.getBoundingClientRect(), cr = this.stage.renderer.domElement.getBoundingClientRect();
    const cvr = { x: cr.left - vr.left, y: cr.top - vr.top, w: cr.width, h: cr.height }, pr = this.screenRect(p.d.rect, this.cam);
    const lc = this.live, W = Math.round(cvr.w * dpr), H = Math.round(cvr.h * dpr);
    const opts = { nearest: true, exposure: E, cell: CELL * this.cam.s * dpr, misreg: MISREG * this.cam.s * dpr, origin: [(pr.x - cvr.x) * dpr, (pr.y - cvr.y) * dpr] };
    this.press.render(shot.canvas, W, H, { ...opts, amount: 1 });
    const inset = e => this.shrink(p, pr, cvr, e);
    Object.assign(lc.style, { left: cvr.x + 'px', top: cvr.y + 'px', width: cvr.w + 'px', height: cvr.h + 'px', clipPath: inset(1), opacity: 0, display: 'block' });
    await anim(180, k => { lc.style.opacity = k; });
    this.layer.classList.remove('on', 'ghost');
    document.body.classList.remove('comic-on');
    this.foley.play('swish');
    await anim(520, k => { lc.style.clipPath = inset(1 - ease(k)); });
    await anim(700, k => this.press.render(shot.canvas, W, H, { ...opts, exposure: lerp(1, E, ease(1 - k)), amount: 1 - k }));
    lc.style.display = 'none';
    this.active = false; this.busy = false; this.panel = null;
    if (this.view0) { this.stage.zoomT = this.view0.zoomT; this.stage.panT = this.view0.panT; }    // the play eases back out to its own framing
    this.onExit?.(t, hold);                                   // hold: stopped there (on a moment the evidence is out)
  }
  // clip-path from the whole canvas (e = 0) to the panel's outline on screen (e = 1)
  shrink(p, pr, cvr, e) {
    const k = pr.w / p.w, to = p.shape.map(([a, b]) => [pr.x - cvr.x + a * k, pr.y - cvr.y + b * k]);
    if (to.length !== 4) return `inset(${(pr.y - cvr.y) * e}px ${(cvr.x + cvr.w - pr.x - pr.w) * e}px ${(cvr.y + cvr.h - pr.y - pr.h) * e}px ${(pr.x - cvr.x) * e}px)`;
    const from = [[0, 0], [cvr.w, 0], [cvr.w, cvr.h], [0, cvr.h]];
    return `polygon(${to.map((q, i) => `${lerp(from[i][0], q[0], e)}px ${lerp(from[i][1], q[1], e)}px`).join(',')})`;
  }
  // leave at once (switching floors)
  close() {
    if (!this.active) return;
    this.setAuto(false);
    this.token = {}; this.stopSeg(); this.endTween();
    if (this.panel) { this.flush(this.panel); this.panel.fx.leave?.(); }
    this.layer.classList.remove('on', 'ghost'); this.endcard.classList.remove('on');
    document.body.classList.remove('comic-on');
    this.live.style.display = 'none';
    this.active = false; this.busy = false; this.panel = null;
  }

  // ── input: click = next, drag = pan, wheel = zoom ──
  bind() {
    const L = this.layer;
    let drag = null;
    L.addEventListener('pointerdown', e => { if (e.target.closest('button,[data-act]')) return; drag = { x: e.clientX, y: e.clientY, moved: false }; L.setPointerCapture(e.pointerId); });
    L.addEventListener('pointermove', e => {
      // where the pointer is on the page (undoing the camera), for panels that follow it
      const r = L.getBoundingClientRect(), [vw, vh] = this.vsize(), c = this.cam, a = -c.r * Math.PI / 180;
      const ux = e.clientX - r.left - vw / 2, uy = e.clientY - r.top - vh / 2;
      this.pointer = { x: c.x + (ux * Math.cos(a) - uy * Math.sin(a)) / c.s, y: c.y + (ux * Math.sin(a) + uy * Math.cos(a)) / c.s, t: performance.now(), touch: e.pointerType === 'touch' };
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; L.classList.add('dragging'); this.endTween(); }
      if (drag.moved) { this.cam.x -= dx / this.cam.s; this.cam.y -= dy / this.cam.s; drag.x = e.clientX; drag.y = e.clientY; this.applyCam(); this.driven(); }
    });
    L.addEventListener('pointerup', () => { if (drag && !drag.moved) this.next(); drag = null; L.classList.remove('dragging'); });
    L.addEventListener('wheel', e => {
      e.preventDefault();
      if (!this.active || this.busy) return;
      this.endTween();
      const r = L.getBoundingClientRect(), [vw, vh] = this.vsize(), mx = e.clientX - r.left - vw / 2, my = e.clientY - r.top - vh / 2;
      const s0 = this.cam.s, s1 = clamp(s0 * Math.exp(-e.deltaY * 0.0015), this.overCam().s * 0.8, 6);
      this.cam.x += mx / s0 - mx / s1; this.cam.y += my / s0 - my / s1; this.cam.s = s1;
      this.applyCam(); this.driven();
    }, { passive: false });
    this.hud.querySelector('.watch').addEventListener('click', () => this.exit(this.panel?.d.t ?? undefined));
    this.hud.querySelector('.auto').addEventListener('click', () => this.setAuto(!this.auto));
    this.endcard.querySelector('.again').addEventListener('click', () => this.exit(0));
    this.endcard.querySelector('.next').addEventListener('click', () => { this.close(); this.onNext?.(); });
  }
  key(e) {
    if (!this.active) return false;
    const nav = e.code === 'Space' || ['ArrowRight', 'Enter', 'ArrowLeft', 'Escape'].includes(e.key);
    if (nav && e.repeat) { e.preventDefault(); return true; }        // one press, one step: holding a key does nothing more
    if (e.code === 'Space' || e.key === 'ArrowRight' || e.key === 'Enter') this.next();
    else if (e.key === 'ArrowLeft') { this.setAuto(false); this.prev(); }
    else if (e.key === 'a' || e.key === 'A') { if (!e.repeat) this.setAuto(!this.auto); }
    else if (e.key === 'Escape') { this.setAuto(false); if (this.idx === 0) this.exit(); else this.go(0); }
    else if (e.key === 'c' || e.key === 'C') this.exit();
    else return false;
    e.preventDefault();
    return true;
  }
  resize() { if (this.active && !this.tw) { const s = this.stops[this.idx]; this.cam = typeof s === 'object' ? this.fitCam(s) : this.overCam(); this.applyCam(); } }
}

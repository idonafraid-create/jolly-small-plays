// ① Dusting for prints. The exhibit lies on a card; the reader works a fingerprint brush over it. Powder settles thinly
// everywhere and thickly on the latent print (YOYO's paw: four toe beans and a heart), so the print comes up under the
// strokes; worked over too long a spot smears. Then a strip of tape lifts it onto a white card.
// Card units: `w`×`h` (the card), `k` device px per unit. The haze is real p5.brush powder; the print is drawn once with the
// same powder and revealed through a coverage map kept on a coarse grid.
import { loadBrush, Surface } from '../brush.js';
import { clamp, mulberry32 } from '../engine.js';

const G = 8;                                         // coverage cell, card units

// YOYO's paw print in its own units (heart pad at the origin, toes above it), as polygons
export function pawShape() {
  const ell = (cx, cy, rx, ry, a, n = 22) => Array.from({ length: n }, (_, i) => {
    const t = i / n * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
  });
  const heart = Array.from({ length: 40 }, (_, i) => {
    const t = i / 40 * Math.PI * 2;
    return [16 * Math.sin(t) ** 3 * 3.1, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 3.1 + 6];
  });
  return {
    heart,
    toes: [ell(-64, -64, 17, 22, -0.45), ell(-24, -94, 17, 23, -0.15), ell(24, -94, 17, 23, 0.15), ell(64, -64, 17, 22, 0.45)],
  };
}
// what a print examiner lays beside an exhibit for the photograph: an L-shaped scale (white, black ticks: every 5 units,
// longer every 10, numbered every 50), its corner at (x, y), arms running right and up; under the exhibit
function photoScale(g, x, y) {
  const L1 = 210, L2 = 150, w = 18;
  g.shadowColor = 'rgba(0, 0, 0, .35)'; g.shadowBlur = 4; g.shadowOffsetX = 2; g.shadowOffsetY = 3;
  g.fillStyle = '#efece3'; g.fillRect(x, y - w, L1, w); g.fillRect(x, y - L2, w, L2);
  g.shadowColor = 'transparent';
  g.fillStyle = '#17151a';
  g.fillRect(x, y - w, w, w);                                                      // the corner square
  g.font = '6.5px "IBM Plex Mono", monospace'; g.textAlign = 'center';
  for (let d = 0; d + 5 <= L1 - w; d += 5) {
    const l = d % 50 === 0 ? 9 : d % 10 === 0 ? 6 : 3.5;
    g.fillRect(x + w + d, y - w, 0.8, l);
    if (d % 50 === 0 && d) g.fillText(d / 10, x + w + d, y - 2);
  }
  for (let d = 0; d + 5 <= L2 - w; d += 5) {
    const l = d % 50 === 0 ? 9 : d % 10 === 0 ? 6 : 3.5;
    g.fillRect(x + w - l, y - w - d, l, 0.8);
  }
}
// a yellow evidence tent seen from above: its two faces either side of the ridge, the letter on the face toward us
function tent(g, x, y, letter) {
  const w = 64, h = 25;
  g.shadowColor = 'rgba(0, 0, 0, .45)'; g.shadowBlur = 6; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
  g.fillStyle = '#e8b81e'; g.fillRect(x - w / 2, y - h, w, h);
  g.shadowColor = 'transparent';
  g.fillStyle = '#f6cf35'; g.fillRect(x - w / 2, y, w, h);
  g.fillStyle = 'rgba(0, 0, 0, .35)'; g.fillRect(x - w / 2, y - 0.6, w, 1.2);
  g.fillStyle = '#17151a'; g.font = '20px "Alfa Slab One", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(x, y + h / 2 + 1); g.scale(1, 0.82); g.fillText(letter, 0, 0); g.restore();
  g.textBaseline = 'alphabetic';
}
const inside = (poly, x, y) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export class Dusting {
  // item: an image/canvas of the exhibit (transparent around it), laid at `itemRect` [x, y, w, h];
  // print: { x, y, s (scale), a (angle), keep: which pads made contact ('heart', 0–3) }; dark: a black card and pale powder;
  // letter: lay a photo scale and an evidence tent with this letter beside the exhibit
  constructor({ w = 800, h = 560, k = 2, item = null, itemRect = null, print, dark = false, seed = 5, letter = null } = {}) {
    Object.assign(this, { w, h, k, item, itemRect, print, dark, seed, letter });
    this.powder = dark ? '#dcd6cb' : '#28262a';
    this.cols = Math.ceil(w / G); this.rows = Math.ceil(h / G);
    this.cov = new Float32Array(this.cols * this.rows);
    this.out = document.createElement('canvas'); this.out.width = w * k; this.out.height = h * k;
    this.lifted = false;
  }
  async init() {
    await loadBrush();
    const { w, h, k } = this;
    this.base = this.makeBase();
    // the print, in powder, on the blend's neutral ground (it is screened / multiplied over the card later)
    const ps = new Surface(w, h, { k, paper: this.dark ? '#000' : '#fff', mode: this.dark ? 'screen' : 'multiply', seed: this.seed + 1, tooth: 0 });
    ps.draw(b => this.drawPrint(b));
    ps.release();
    this.ink = ps.out;
    this.inkSoft = document.createElement('canvas'); this.inkSoft.width = w * k; this.inkSoft.height = h * k;
    const sg = this.inkSoft.getContext('2d'); sg.filter = `blur(${2.2 * k}px)`; sg.drawImage(this.ink, 0, 0); sg.filter = 'none';
    // where the print is, cell by cell (progress counts only these)
    this.has = new Uint8Array(this.cols * this.rows);
    const P = this.pads();
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const x = (c + 0.5) * G, y = (r + 0.5) * G;
      this.has[r * this.cols + c] = P.some(poly => inside(poly, x, y)) ? 1 : 0;
    }
    this.nHas = this.has.reduce((a, b) => a + b, 0) || 1;
    this.haze = new Surface(w, h, { k, paper: this.base, mode: this.dark ? 'screen' : 'multiply', seed: this.seed, tooth: 0 });
    this.reveal = document.createElement('canvas'); this.reveal.width = this.cols; this.reveal.height = this.rows;
    this.layer = document.createElement('canvas'); this.layer.width = w * k; this.layer.height = h * k;
    this.compose();
    return this;
  }
  // the card, the exhibit on it, and a faint pink smear where the paw touched it (lipstick: it shows where to start)
  makeBase() {
    const { w, h, k } = this, c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
    const g = c.getContext('2d'), r = mulberry32(this.seed);
    g.fillStyle = this.dark ? '#151316' : '#f3f0e8'; g.fillRect(0, 0, c.width, c.height);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;                // card stock grain
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * (this.dark ? 7 : 9); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
    // a lamp pulled down over the card (with the props: the pool of light it throws, a little up and left of centre; on
    // black stock a warm glow, on white the stock falling off to warm grey round it), and the exhibit's shadow under it
    if (this.letter) {
      const L = g.createRadialGradient(0.46 * c.width, 0.42 * c.height, 0, 0.5 * c.width, 0.47 * c.height, 0.5 * c.width);
      if (this.dark) { L.addColorStop(0, 'rgba(176, 138, 98, .64)'); L.addColorStop(0.55, 'rgba(104, 76, 50, .3)'); L.addColorStop(1, 'rgba(0, 0, 0, 0)'); g.globalCompositeOperation = 'screen'; }
      else { L.addColorStop(0, '#fffaf0'); L.addColorStop(0.5, '#e9dcc4'); L.addColorStop(1, '#8f8170'); g.globalCompositeOperation = 'multiply'; }
      g.fillStyle = L; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'source-over';
      g.save(); g.scale(k, k); photoScale(g, 215, 428); g.restore();
    }
    if (this.item) {
      const [x, y, iw, ih] = this.itemRect;
      if (this.letter) Object.assign(g, { shadowColor: 'rgba(0, 0, 0, .55)', shadowBlur: 16 * k, shadowOffsetX: 9 * k, shadowOffsetY: 13 * k });
      g.drawImage(this.item, x * k, y * k, iw * k, ih * k);
      g.shadowColor = 'transparent';
    }
    if (this.letter) { g.save(); g.scale(k, k); tent(g, 626, 420, this.letter); g.restore(); }
    g.save(); g.scale(k, k);
    g.globalAlpha = 0.09; g.fillStyle = '#e0507a'; g.filter = `blur(${3 * k}px)`;
    for (const poly of this.pads()) { g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); }
    g.restore();
    return c;
  }
  // the pads that touched, placed on the card
  pads() {
    const { x, y, s, a, keep = ['heart', 0, 1, 2, 3] } = this.print, P = pawShape(), ca = Math.cos(a), sa = Math.sin(a);
    const place = poly => poly.map(([px, py]) => [x + (px * ca - py * sa) * s, y + (px * sa + py * ca) * s]);
    return keep.map(kk => place(kk === 'heart' ? P.heart : P.toes[kk]));
  }
  // each pad: a dense grainy fill of short powder strokes, a heavier rim where it pressed, a few creases left bare
  drawPrint(b) {
    const r = mulberry32(this.seed + 9);
    for (const poly of this.pads()) {
      const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      // the pad's skin: little curled squiggles of packed grains (its bumpy texture), denser toward the rim where it
      // pressed hardest, with bare pits between them
      const cx = xs.reduce((a, q) => a + q, 0) / xs.length, cy = ys.reduce((a, q) => a + q, 0) / ys.length;
      const rad = Math.max(x1 - x0, y1 - y0) / 2;
      b.set('grains', this.powder, 1);
      for (let n = 0; n < (x1 - x0) * (y1 - y0) / 9; n++) {
        const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
        if (!inside(poly, x, y)) continue;
        const edge = Math.hypot(x - cx, y - cy) / rad;
        if (r() > 0.35 + 0.65 * edge) continue;
        const a = r() * Math.PI * 2, l = 2 + r() * 3.5;
        b.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
      }
      b.set('grains', this.powder, 1.3);
      b.spline([...poly, poly[0]], 0.5);
    }
  }
  // a drag from (x0, y0) to (x1, y1) in card units; v = speed (units/s): fast strokes lay less powder
  stroke(x0, y0, x1, y1, v = 300) {
    if (this.lifted) return;
    const light = clamp(1 - (v - 200) / 1600, 0.25, 1);
    this.haze.draw(b => {
      b.set('haze', this.powder, 0.6 + 0.6 * light);
      b.line(x0, y0, x1, y1 + 0.01);
    });
    // coverage along the segment: the brush is ~44 units across
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (G * 0.75))), R = 22 / G;
    for (let i = 0; i <= n; i++) {
      const cx = (x0 + (x1 - x0) * i / n) / G, cy = (y0 + (y1 - y0) * i / n) / G;
      for (let rr = Math.floor(cy - R); rr <= cy + R; rr++) for (let cc = Math.floor(cx - R); cc <= cx + R; cc++) {
        if (rr < 0 || cc < 0 || rr >= this.rows || cc >= this.cols) continue;
        const d = Math.hypot(cc + 0.5 - cx, rr + 0.5 - cy) / R; if (d >= 1) continue;
        this.cov[rr * this.cols + cc] += 0.16 * light * (1 - d * d) / Math.max(1, n / 3);
      }
    }
    this.compose();
  }
  // how much of the print has come up (0–1)
  progress() {
    let s = 0;
    for (let i = 0; i < this.cov.length; i++) if (this.has[i]) s += clamp(this.cov[i] / 1.1);
    return s / this.nHas;
  }
  compose() {
    const { k } = this, g = this.out.getContext('2d');
    // the reveal map: coverage → how much print shows, and how much of that is smeared (worked over too long)
    const rg = this.reveal.getContext('2d'), im = rg.createImageData(this.cols, this.rows);
    for (let i = 0; i < this.cov.length; i++) { const c = this.cov[i]; im.data[i * 4 + 3] = Math.round(255 * clamp((c - 0.12) / 1.0)); }
    rg.putImageData(im, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(this.haze.out, 0, 0);
    const lg = this.layer.getContext('2d'), W = this.layer.width, H = this.layer.height;
    const smear = Math.max(...this.cov) > 4.5;
    lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
    lg.drawImage(smear ? this.smeared() : this.ink, 0, 0);
    lg.globalCompositeOperation = 'destination-in';
    lg.imageSmoothingEnabled = true; lg.drawImage(this.reveal, 0, 0, W, H);
    g.globalCompositeOperation = this.dark ? 'screen' : 'multiply';
    g.drawImage(this.layer, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }
  // the print with the over-worked cells blurred (an over-brushed print smears into a grey cloud)
  smeared() {
    const W = this.ink.width, H = this.ink.height;
    const c = this.smearC ||= Object.assign(document.createElement('canvas'), { width: W, height: H });
    const m = this.smearM ||= Object.assign(document.createElement('canvas'), { width: this.cols, height: this.rows });
    const mg = m.getContext('2d'), im = mg.createImageData(this.cols, this.rows);
    for (let i = 0; i < this.cov.length; i++) im.data[i * 4 + 3] = Math.round(255 * clamp((this.cov[i] - 4.5) / 2.5));
    mg.putImageData(im, 0, 0);
    const g = c.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.drawImage(this.ink, 0, 0);
    const t = this.smearT ||= Object.assign(document.createElement('canvas'), { width: W, height: H });
    const tg = t.getContext('2d');
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(this.inkSoft, 0, 0);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(m, 0, 0, W, H);
    g.drawImage(t, 0, 0);
    return c;
  }
  // the lift: the revealed print, black on white, cropped round the paw (for the print card)
  lift() {
    this.lifted = true;
    const P = this.pads().flat(), xs = P.map(q => q[0]), ys = P.map(q => q[1]), pad = 26, k = this.k;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
    const c = document.createElement('canvas'); c.width = (x1 - x0) * k; c.height = (y1 - y0) * k;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    const lg = this.layer;                                   // revealed print (powder colour on transparent)
    g.filter = this.dark ? 'invert(1) grayscale(1) contrast(1.2)' : 'grayscale(1) contrast(1.15)';
    g.globalCompositeOperation = 'multiply';
    if (this.dark) { const t = document.createElement('canvas'); t.width = lg.width; t.height = lg.height; const tg = t.getContext('2d'); tg.fillStyle = '#000'; tg.fillRect(0, 0, t.width, t.height); tg.drawImage(lg, 0, 0); g.drawImage(t, -x0 * k, -y0 * k); }
    else g.drawImage(lg, -x0 * k, -y0 * k);
    g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    return { canvas: c, rect: [x0, y0, x1 - x0, y1 - y0] };
  }
}

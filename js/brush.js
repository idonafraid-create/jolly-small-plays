// The marks a hand leaves in the case file — fingerprint powder, graphite, a red grease pencil, lipstick, a technical pen
// and a little watercolour — drawn with p5.brush (standalone build, WebGL2; MIT, github.com/acamposuribe/p5.brush).
// Everything printed in the case file goes through the press; these marks don't: they are the reader's own, on top.
// One offscreen brush canvas is shared. A Surface draws onto it and composites it over its own paper (multiply for dark
// media on light paper, screen for light powder on a black card), so a mark always sits *in* the paper under it.
const LIB = 'https://cdn.jsdelivr.net/npm/p5.brush@2.2.3/dist/brush.esm.js';
let B = null, target = null, owner = null;

export async function loadBrush() {
  if (B) return B;
  B = await import(LIB);
  target = document.createElement('canvas');
  target.width = target.height = 16;
  B.load(target);
  B.angleMode(B.RADIANS);
  B.scaleBrushes(1);
  // fingerprint powder: very fine grains. `powder` packs into a print's ridges; `haze` is the thin film a brush leaves
  // on bare card
  B.add('powder', { type: 'spray', weight: 0.9, scatter: 14, sharpness: 0, grain: 26, opacity: 34, spacing: 0.35, pressure: [0.85, 1.1, 0.8], noise: 0.6 });
  B.add('haze', { type: 'spray', weight: 0.7, scatter: 20, sharpness: 0, grain: 9, opacity: 12, spacing: 0.6, pressure: [0.7, 1.1, 0.6], noise: 0.8 });
  B.add('grains', { type: 'spray', weight: 0.75, scatter: 2.6, sharpness: 0, grain: 5, opacity: 120, spacing: 0.5, pressure: [0.8, 1.1, 0.8], noise: 0.5 });
  // graphite: a sharpened HB, a soft 2B for shading, a stub of charcoal for the darkest darks
  B.add('graphite', { type: 'default', weight: 1.1, scatter: 0.55, sharpness: 0.35, grain: 0.75, opacity: 150, spacing: 0.12, pressure: { mode: 'gaussian', curve: [0.15, 0.25], min_max: [1.15, 0.6] } });
  B.add('soft', { type: 'default', weight: 1.6, scatter: 0.9, sharpness: 0.25, grain: 0.6, opacity: 120, spacing: 0.12, pressure: { mode: 'gaussian', curve: [0.25, 0.3], min_max: [1.1, 0.5] } });
  B.add('stick', { type: 'default', weight: 2.6, scatter: 1.4, sharpness: 0.6, grain: 1.6, opacity: 120, spacing: 0.05, pressure: { mode: 'gaussian', curve: [0.15, 0.4], min_max: [1.1, 0.8] } });
  // a china marker: waxy, skips on the paper's tooth, heavier where it was pressed
  B.add('grease', { type: 'default', weight: 3.2, scatter: 1.1, sharpness: 0.8, grain: 1.25, opacity: 210, spacing: 0.06, pressure: [1.25, 1, 0.75], noise: 0.4 });
  // lipstick: a fat waxy stub, nearly opaque, with dry gaps
  B.add('lipstick', { type: 'default', weight: 7, scatter: 1.6, sharpness: 0.85, grain: 1.05, opacity: 235, spacing: 0.05, pressure: [1.3, 1.05, 0.8], noise: 0.5 });
  // a Rapidograph: even, crisp, the faintest wobble
  B.add('nib', { type: 'default', weight: 0.75, scatter: 0.12, sharpness: 0.95, grain: 3, opacity: 230, spacing: 0.1, pressure: [1, 1], noise: 0.1 });
  return B;
}
export const brush = () => B;

// the paper's tooth: wax and graphite catch on its peaks and skip its pits, so a few pale specks stay in every mark (a
// tile of sparse clustered specks, fixed in paper space)
let toothTile = null;
function tooth() {
  if (toothTile) return toothTile;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  let s = 7; const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x6D2B79F5 | 0) >>> 0) / 4294967296;
  const v = new Float32Array(N * N);
  for (let i = 0; i < 2600; i++) {                                  // pits: little irregular clusters
    const x = rnd() * N, y = rnd() * N, r = 0.6 + rnd() * 1.4, a = 0.5 + rnd() * 0.5;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dd = Math.hypot(xx - x, yy - y); if (dd > r) continue;
      const j = ((yy + N) % N) * N + ((xx + N) % N); v[j] = Math.max(v[j], a * (1 - dd / (r + 0.4)));
    }
  }
  for (let i = 0; i < N * N; i++) { const k = Math.round(v[i] * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = k; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (toothTile = c);
}

// a drawing surface: `w`×`h` in its own units, `k` device px per unit; `paper` is drawn under the marks (a canvas, or a
// colour); `mode` multiply (dark marks on paper) or screen (pale powder on a dark card); `tooth` how much the paper's
// grain shows through the marks (0 for powder: it sits on a slick card)
export class Surface {
  constructor(w, h, { k = 2, paper = '#ffffff', mode = 'multiply', seed = 1, tooth = 0.8 } = {}) {
    Object.assign(this, { w, h, k, paper, mode, seed, toothK: mode === 'multiply' ? tooth : 0 });
    this.out = document.createElement('canvas');
    this.out.width = Math.round(w * k); this.out.height = Math.round(h * k);
    this.marks = document.createElement('canvas');                     // the marks so far, kept while the brush canvas serves others
    this.marks.width = this.out.width; this.marks.height = this.out.height;
    this.blank = true;
    this.compose();
  }
  // take the shared brush canvas: it is cleared to the blend's neutral (white for multiply, black for screen) and holds
  // this surface's marks while it is ours
  claim() {
    if (owner === this) return;
    owner?.release();
    owner = this;
    if (target.width !== this.out.width || target.height !== this.out.height) { target.width = this.out.width; target.height = this.out.height; }
    B.load(target);
    B.seed(this.seed); B.noiseSeed(this.seed);
    B.clear(this.mode === 'screen' ? '#000000' : '#ffffff');
    this.restore = !this.blank;                                    // earlier marks come back from `marks` at the next compose
  }
  release() { if (owner === this) { this.flush(); owner = null; } }
  // draw with the brush in this surface's units; fn gets the library
  draw(fn) {
    this.claim();
    B.push();
    B.translate(-target.width / 2, -target.height / 2);
    B.scale(this.k);
    fn(B);
    B.pop();
    B.render();
    this.blank = false;
    this.compose();
  }
  // marks = what the brush canvas holds (on top of what was kept from before it was last given away)
  flush() {
    if (owner !== this) return;
    const g = this.marks.getContext('2d');
    if (!this.restore) g.clearRect(0, 0, this.marks.width, this.marks.height);
    g.globalCompositeOperation = this.mode === 'screen' ? 'lighten' : 'darken';
    g.drawImage(target, 0, 0);
    g.globalCompositeOperation = 'source-over';
    this.restore = true;
    B.clear(this.mode === 'screen' ? '#000000' : '#ffffff');      // the canvas now holds only what comes after
  }
  compose() {
    const g = this.out.getContext('2d'), W = this.out.width, H = this.out.height;
    g.globalCompositeOperation = 'source-over';
    if (typeof this.paper === 'string') { g.fillStyle = this.paper; g.fillRect(0, 0, W, H); } else g.drawImage(this.paper, 0, 0, W, H);
    if (!this.blank) {
      let m = this.mixed ||= Object.assign(document.createElement('canvas'), { width: W, height: H });
      const mg = m.getContext('2d');
      mg.globalCompositeOperation = 'source-over';
      if (this.restore) mg.drawImage(this.marks, 0, 0); else { mg.fillStyle = this.mode === 'screen' ? '#000' : '#fff'; mg.fillRect(0, 0, W, H); }
      if (owner === this) { mg.globalCompositeOperation = this.mode === 'screen' ? 'lighten' : 'darken'; mg.drawImage(target, 0, 0); }
      if (this.toothK > 0) {                                        // the paper's pits lift the marks back toward white
        mg.globalCompositeOperation = 'screen'; mg.globalAlpha = this.toothK;
        mg.fillStyle = mg.createPattern(tooth(), 'repeat'); mg.fillRect(0, 0, W, H);
        mg.globalAlpha = 1;
      }
      g.globalCompositeOperation = this.mode;
      g.drawImage(m, 0, 0);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // the marks alone over a neutral ground, for drawing into something else
  clearMarks() {
    this.blank = true; this.restore = false;
    this.marks.getContext('2d').clearRect(0, 0, this.marks.width, this.marks.height);
    if (owner === this) B.clear(this.mode === 'screen' ? '#000000' : '#ffffff');
    this.compose();
  }
}

// strokes drawn one after another, like a time-lapse of someone drawing: [{ b: brush, c: colour, w: weight, p: [[x, y]…] }]
// `ms` for the lot (each stroke's share is its length); returns { step(now) → done?, finish() }
export function timelapse(surface, strokes, { ms = 6000, curvature = 0.5 } = {}) {
  const len = strokes.map(s => s.p.reduce((n, q, i) => n + (i ? Math.hypot(q[0] - s.p[i - 1][0], q[1] - s.p[i - 1][1]) : 0), 0) + 6);
  const total = len.reduce((a, b) => a + b, 0);
  let i = 0, t0 = null, at = 0;
  const drawUpTo = k => {
    const goal = k * total, list = [];
    while (i < strokes.length && at + len[i] <= goal + 1e-6) { list.push(strokes[i]); at += len[i]; i++; }
    if (list.length) surface.draw(b => list.forEach(s => stroke(b, s, curvature)));
  };
  return {
    step(now) { t0 ??= now; drawUpTo(Math.min(1, (now - t0) / ms)); return i >= strokes.length; },
    finish() { drawUpTo(1); },
    get pos() { const s = strokes[Math.min(i, strokes.length - 1)]; return s?.p[s.p.length - 1]; },
  };
}
export function stroke(b, s, curvature = 0.5) {
  b.set(s.b, s.c, s.w ?? 1);
  if (s.p.length === 2) b.line(s.p[0][0], s.p[0][1], s.p[1][0], s.p[1][1]);
  else b.spline(s.p, s.k ?? curvature);
}

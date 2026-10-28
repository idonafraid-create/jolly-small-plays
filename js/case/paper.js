// Old paper for the case file, drawn once per sheet (seeded): manila folder stock gone yellow-brown with handling, and the
// typing paper of the reports, folded in thirds for years. Mottled colour at several scales, fibres and pulp flecks, edges
// tanned unevenly and rubbed pale where fingers went, creases with a lit and a shaded side, a coffee ring, grime.
import { mulberry32 } from '../engine.js';

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// colour blotches at one scale: a small random grid blown up smoothly (value noise), tinted, laid on with `op`
function blotch(g, W, H, r, { cell, col, alpha, op = 'multiply' }) {
  const nx = Math.max(2, Math.ceil(W / cell) + 1), ny = Math.max(2, Math.ceil(H / cell) + 1), s = canvas(nx, ny), sg = s.getContext('2d');
  const im = sg.createImageData(nx, ny);
  for (let i = 0; i < nx * ny; i++) { const v = r(); im.data.set([col[0], col[1], col[2], Math.round(255 * alpha * v * v)], i * 4); }
  sg.putImageData(im, 0, 0);
  g.save(); g.globalCompositeOperation = op; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(s, 0, 0, nx, ny, -cell * r(), -cell * r(), nx * cell, ny * cell);
  g.restore();
}
// fibres: short curved hairs, paler and darker than the stock
function fibres(g, W, H, r, n, k, light, dark) {
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, a = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI), l = (4 + r() * 16) * k, bend = (r() - 0.5) * 6 * k;
    g.strokeStyle = r() < 0.55 ? light : dark; g.globalAlpha = 0.06 + r() * 0.14; g.lineWidth = (0.4 + r() * 0.6) * k;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 - Math.sin(a) * bend, y + Math.sin(a) * l / 2 + Math.cos(a) * bend, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}
function flecks(g, W, H, r, n, k, col) {
  g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++) { g.globalAlpha = 0.2 + r() * 0.5; g.beginPath(); g.ellipse(r() * W, r() * H, (0.3 + r() * 1.1) * k, (0.2 + r() * 0.7) * k, r() * 3, 0, 7); g.fill(); }
  g.restore();
}
// edges tanned by light and hands: a brown band whose depth wanders, corners darkest; `sides` = which edges [t, r, b, l]
function tan(g, W, H, r, depth, col, alpha, sides = [1, 1, 1, 1]) {
  g.save(); g.globalCompositeOperation = 'multiply';
  const band = (len, i) => Array.from({ length: Math.ceil(len / 24) + 2 }, () => depth * (0.55 + r() * 0.9));
  const edge = (x0, y0, dx, dy, nx, ny, len, i) => {
    const d = band(len, i);
    for (let s = 0; s < d.length - 1; s++) {
      const t = s * 24, px = x0 + dx * t, py = y0 + dy * t, dd = (d[s] + d[s + 1]) / 2;
      const grd = g.createLinearGradient(px, py, px + nx * dd, py + ny * dd);
      grd.addColorStop(0, `rgba(${col},${alpha})`); grd.addColorStop(0.35, `rgba(${col},${alpha * 0.45})`); grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd;
      const ww = dx ? 24 : dd, hh = dy ? 24 : dd;
      g.fillRect(nx < 0 ? px - dd : px, ny < 0 ? py - dd : py, ww, hh);
    }
  };
  if (sides[0]) edge(0, 0, 1, 0, 0, 1, W, 0);
  if (sides[2]) edge(0, H, 1, 0, 0, -1, W, 2);
  if (sides[3]) edge(0, 0, 0, 1, 1, 0, H, 3);
  if (sides[1]) edge(W, 0, 0, 1, -1, 0, H, 1);
  for (const [cx, cy, on] of [[0, 0, sides[0] && sides[3]], [W, 0, sides[0] && sides[1]], [0, H, sides[2] && sides[3]], [W, H, sides[2] && sides[1]]]) {
    if (!on) continue;
    const rr = depth * 2.6, grd = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    grd.addColorStop(0, `rgba(${col},${alpha * 0.9})`); grd.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grd; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  g.restore();
}
// rubbed pale along an edge where it gets handled: fuzzy flecks of lighter stock
function rub(g, W, H, r, k, col, where) {
  g.save(); g.fillStyle = col;
  for (const [x0, y0, x1, y1, n] of where) for (let i = 0; i < n; i++) {
    const u = r(), x = x0 + (x1 - x0) * u + (r() - 0.5) * 6 * k, y = y0 + (y1 - y0) * u + (r() - 0.5) * 6 * k;
    g.globalAlpha = 0.08 + r() * 0.22; g.beginPath(); g.ellipse(x, y, (1 + r() * 4) * k, (0.6 + r() * 2) * k, r() * 3, 0, 7); g.fill();
  }
  g.restore();
}
// a crease: a hairline lit on one side and shaded on the other, wandering a little, with a few broken fibres
function crease(g, r, k, x0, y0, x1, y1, a = 1) {
  const n = 28, pts = Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n + (r() - 0.5) * 1.4 * k, y0 + (y1 - y0) * i / n + (r() - 0.5) * 1.4 * k]);
  const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, ox = nx / nl * 1.1 * k, oy = ny / nl * 1.1 * k;
  const line = (col, dx, dy, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); g.stroke(); };
  g.save(); g.lineCap = 'round';
  g.globalCompositeOperation = 'multiply'; line(`rgba(90,62,30,${0.32 * a})`, -ox, -oy, 1.6 * k); line(`rgba(90,62,30,${0.12 * a})`, -ox * 3, -oy * 3, 4 * k);
  g.globalCompositeOperation = 'screen'; line(`rgba(255,246,220,${0.35 * a})`, ox, oy, 1.3 * k);
  g.restore();
}
// a coffee ring: a faint tide inside, a darker irregular rim, a second ring where the cup was set down again
function coffee(g, r, k, cx, cy, R) {
  g.save(); g.globalCompositeOperation = 'multiply';
  for (const [dx, dy, s, a] of [[0, 0, 1, 1], [R * 0.22, -R * 0.14, 0.97, 0.45]]) {
    const n = 64, pts = Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2, rr = R * s * (1 + 0.03 * Math.sin(t * 5 + dx) + 0.02 * (r() - 0.5)); return [cx + dx + Math.cos(t) * rr, cy + dy + Math.sin(t) * rr]; });
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = `rgba(150,96,40,${0.07 * a})`; g.fill();
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i], [x2, y2] = pts[(i + 1) % n];
      g.strokeStyle = `rgba(118,70,26,${(0.16 + r() * 0.3) * a})`; g.lineWidth = (1 + r() * 2.4) * k;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    }
  }
  g.restore();
}

// manila folder stock: `w`×`h` css px at `k` device px each; `wear` 0–1 (the cover is handled most, the inside least);
// `stains` adds the coffee ring and the tape; `sides` which edges are outer edges (the fold side does not tan the same)
export function manila(w, h, { seed = 1, k = 1.5, wear = 1, stains = true, sides = [1, 1, 1, 1], tone = [214, 178, 110] } = {}) {
  const W = Math.round(w * k), H = Math.round(h * k), c = canvas(W, H), g = c.getContext('2d'), r = mulberry32(seed);
  g.fillStyle = `rgb(${tone})`; g.fillRect(0, 0, W, H);
  blotch(g, W, H, r, { cell: 260 * k, col: [150, 105, 50], alpha: 0.22 * wear + 0.08 });          // big uneven ageing
  blotch(g, W, H, r, { cell: 70 * k, col: [170, 125, 66], alpha: 0.16 });
  blotch(g, W, H, r, { cell: 90 * k, col: [255, 236, 190], alpha: 0.2, op: 'screen' });              // paler patches
  blotch(g, W, H, r, { cell: 14 * k, col: [140, 100, 50], alpha: 0.1 });                               // the board's cloudiness
  fibres(g, W, H, r, Math.round(W * H / 260), k, 'rgba(248,226,170,1)', 'rgba(120,84,40,1)');
  flecks(g, W, H, r, Math.round(W * H / 2400), k, '#5a3a18');
  tan(g, W, H, r, (34 + 30 * wear) * k, '120,74,24', 0.55 * wear + 0.15, sides);
  rub(g, W, H, r, k, 'rgb(240,218,166)', [[W, 0, W, H, Math.round(140 * wear)], [0, H, W, H, Math.round(90 * wear)], [0, 0, W, 0, Math.round(60 * wear)]].filter((_, i) => [sides[1], sides[2], sides[0]][i]));
  if (wear > 0.5) {                                                                                     // thumbs: grime where it gets opened
    g.save(); g.globalCompositeOperation = 'multiply';
    const grd = g.createRadialGradient(W, H * 0.55, 0, W, H * 0.55, 200 * k);
    grd.addColorStop(0, 'rgba(110,80,50,.28)'); grd.addColorStop(1, 'rgba(110,80,50,0)');
    g.fillStyle = grd; g.fillRect(W - 200 * k, H * 0.55 - 200 * k, 200 * k, 400 * k); g.restore();
    crease(g, r, k, W * 0.62, 0, W * 0.94, H * 0.18, 0.9);                                             // a dog-ear folded back once
    crease(g, r, k, W * 0.04, H * 0.82, W * 0.3, H * 0.99, 0.8);
    crease(g, r, k, 0, H * 0.47, W * 0.18, H * 0.52, 0.5);
  }
  if (stains) {
    coffee(g, r, k, W * 0.78, H * 0.8, 62 * k);
    g.save(); g.translate(W * 0.1, H * 0.06); g.rotate(-0.35);                                         // an old strip of tape gone amber
    g.fillStyle = 'rgba(226,182,90,.5)'; g.fillRect(-60 * k, -14 * k, 120 * k, 28 * k);
    g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(-56 * k, -10 * k, 112 * k, 5 * k);
    g.restore();
  }
  return c;
}

// a rubber stamp's ink: uneven pressure (a fainter side), pinholes where the rubber didn't take ink, a few bare streaks.
// White = ink; used as a CSS mask over the stamp's lettering
export function inkMask(w, h, { seed = 1 } = {}) {
  const c = canvas(w, h), g = c.getContext('2d'), r = mulberry32(seed);
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  const side = g.createLinearGradient(0, 0, w, h * 0.3);                       // pressed harder on one side
  side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.6, 'rgba(0,0,0,.12)'); side.addColorStop(1, 'rgba(0,0,0,.42)');
  g.fillStyle = side; g.fillRect(0, 0, w, h);
  blotch(g, w, h, r, { cell: 18, col: [0, 0, 0], alpha: 0.55, op: 'destination-out' });
  for (let i = 0; i < w * h / 40; i++) { g.fillStyle = `rgba(0,0,0,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(r() * w, r() * h, 0.4 + r() * 1.2, 0, 7); g.fill(); }
  for (let i = 0; i < 5; i++) {                                                // bare streaks across the rubber
    const y = r() * h; g.strokeStyle = `rgba(0,0,0,${0.3 + r() * 0.4})`; g.lineWidth = 0.8 + r() * 2;
    g.beginPath(); g.moveTo(r() * w * 0.3, y); g.lineTo(w * (0.6 + r() * 0.4), y + (r() - 0.5) * 8); g.stroke();
  }
  return c.toDataURL();
}

// typing paper, years in a folder: cream gone ivory-yellow, foxing, folded in thirds (two creases), edges tanned
export function bond(w, h, { seed = 1, k = 1.5, folds = true, tone = [242, 233, 210], grid = 0, wear = 1 } = {}) {
  const W = Math.round(w * k), H = Math.round(h * k), c = canvas(W, H), g = c.getContext('2d'), r = mulberry32(seed);
  g.fillStyle = `rgb(${tone})`; g.fillRect(0, 0, W, H);
  if (grid) {                                                         // graph paper: faded blue rules, heavier every fifth
    for (let x = 0, i = 0; x < W; x += grid * k, i++) { g.fillStyle = `rgba(70,120,160,${i % 5 ? 0.13 : 0.26})`; g.fillRect(Math.round(x), 0, Math.max(1, k * 0.7), H); }
    for (let y = 0, i = 0; y < H; y += grid * k, i++) { g.fillStyle = `rgba(70,120,160,${i % 5 ? 0.13 : 0.26})`; g.fillRect(0, Math.round(y), W, Math.max(1, k * 0.7)); }
  }
  blotch(g, W, H, r, { cell: 220 * k, col: [200, 160, 90], alpha: 0.2 * wear });
  blotch(g, W, H, r, { cell: 40 * k, col: [190, 160, 110], alpha: 0.08 });
  fibres(g, W, H, r, Math.round(W * H / 900), k, 'rgba(255,252,240,1)', 'rgba(170,140,100,1)');
  tan(g, W, H, r, (26 + 26 * wear) * k, '150,104,40', 0.32 * wear + 0.08);
  for (let i = 0; i < 26 * wear; i++) {                                // foxing, mostly near the edges
    const edge = r() < 0.6, x = edge ? (r() < 0.5 ? r() * 60 * k : W - r() * 60 * k) : r() * W, y = r() * H;
    g.fillStyle = `rgba(150,96,44,${0.08 + r() * 0.22})`; g.beginPath(); g.arc(x, y, (0.6 + r() * 2.6) * k, 0, 7); g.fill();
  }
  if (folds) for (const y of [H / 3, H * 2 / 3]) {                     // the creases of a letter folded in thirds, a grubby line along each
    crease(g, r, k, 0, y + (r() - 0.5) * 4 * k, W, y + (r() - 0.5) * 4 * k, 0.75);
    g.save(); g.globalCompositeOperation = 'multiply';
    const grd = g.createLinearGradient(0, y - 10 * k, 0, y + 10 * k);
    grd.addColorStop(0, 'rgba(160,120,70,0)'); grd.addColorStop(0.5, 'rgba(160,120,70,.12)'); grd.addColorStop(1, 'rgba(160,120,70,0)');
    g.fillStyle = grd; g.fillRect(0, y - 10 * k, W, 20 * k); g.restore();
  }
  return c;
}

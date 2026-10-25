// Shelf wear for a comic cover that has been read to bits: rubbed corners, chipped edges where the ink
// came off, colour-breaking creases along the fold, scratches, foxing, a coffee ring, edges gone yellow.
// Deterministic (seeded), drawn once per cover. Sizes are cover px; canvases are q× for crisp zooms.
import { mulberry32 } from './engine.js';

const PAPER = '#f4ecd8';

// where an issue's damage sits, so no two copies look alike (a page def's `cover.worn` overrides any of it; the defaults
// are No. 4's copy). Cover marks are fractions of the cover; inside marks are fractions of the open sheet. The cover is
// the sheet's left half turned over, so its tear and pocket creases also show inside, mirrored, on the left.
export const WEAR = {
  tear: 0.38,                                                     // the tear in the cover's open edge (inside: the sheet's left edge)
  nick: 0.71,                                                     // a nick in the sheet's right edge
  ring: [0.93, 0.3],                                              // the coffee ring on the cover
  creases: [[0.55, 1, 1, 0.62], [0.7, 0, 1, 0.16], [0.08, 0.74, 0.46, 1]],   // pocket creases across the cover, x0 y0 x1 y1
  inner: [1, 0.58, 0.69, 0.47],                                   // an old crease across the inside right half
  stain: [0.87, 0.81],                                            // a water stain inside
  thumb: [0.03, 0.94],                                            // a thumbprint inside
  tapes: [],                                                      // more tape inside, [x, y, angle, length]; one strip always covers the tear
};

// the cover outline: square at the fold (left), both right corners rubbed round, a small tear in the right edge
export function wornShape(w, h, seed = 3, L = WEAR) {
  const r = mulberry32(seed), j = a => (r() - 0.5) * a;
  const pts = [[0, 0]];
  for (let x = 40; x < w - 20; x += 40) pts.push([x, Math.max(0, j(1.6))]);
  for (let k = 0; k <= 6; k++) { const t = k / 6 * Math.PI / 2, rr = 15 + j(3); pts.push([w - rr + Math.sin(t) * rr, rr - Math.cos(t) * rr]); }   // top-right, rubbed round
  const tear = h * L.tear;
  for (let y = 40; y < h - 70; y += 40) {
    if (Math.abs(y - tear) < 20) { pts.push([w, tear - 7], [w - 9, tear - 1], [w - 4, tear + 2], [w, tear + 6]); continue; }
    pts.push([w - Math.max(0, j(1.6)), y]);
  }
  for (let k = 0; k <= 6; k++) { const t = k / 6 * Math.PI / 2, rr = 13 + j(3); pts.push([w - rr + Math.cos(t) * rr, h - rr + Math.sin(t) * rr]); }   // bottom-right, rubbed round
  for (let x = w - 60; x > 20; x -= 40) pts.push([x, h - Math.max(0, j(1.6))]);
  pts.push([0, h]);
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
}

// the open sheet's outline (the inside of the same paper): all four outer corners rubbed round; the cover swings over to
// become the left half, so its tear shows in the LEFT edge at the same height; a nick in the right edge; the fold stays
// straight. `right` is the half lying under the cover while it is shut, `left` the half the cover's back shows.
export function wornSpread(w, h, seed = 3, L = WEAR) {
  const r = mulberry32(seed * 13 + 5), j = a => (r() - 0.5) * a, hw = w / 2, tear = h * L.tear, nick = h * L.nick;
  const arc = (cx, cy, rr, a0) => Array.from({ length: 7 }, (_, k) => { const t = a0 + k / 6 * Math.PI / 2; return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]; });
  const top = [], right = [], bottom = [], left = [];
  for (let x = 40; x < w - 30; x += 40) top.push([x, Math.max(0, j(1.6))]);
  top.push([hw, 0]); top.sort((a, b) => a[0] - b[0]);
  let rr = 15 + j(3);
  right.push(...arc(w - rr, rr, rr, -Math.PI / 2));
  for (let y = 40; y < h - 40; y += 40) {
    if (Math.abs(y - nick) < 20) { right.push([w, nick - 3], [w - 5, nick], [w, nick + 4]); continue; }
    right.push([w - Math.max(0, j(1.6)), y]);
  }
  rr = 13 + j(3);
  right.push(...arc(w - rr, h - rr, rr, 0));
  for (let x = w - 40; x > 30; x -= 40) bottom.push([x, h - Math.max(0, j(1.6))]);
  bottom.push([hw, h]); bottom.sort((a, b) => b[0] - a[0]);
  rr = 14 + j(3);
  left.push(...arc(rr, h - rr, rr, Math.PI / 2));
  for (let y = h - 40; y > 40; y -= 40) {
    if (Math.abs(y - tear) < 20) { left.push([0, tear + 6], [4, tear + 2], [9, tear - 1], [0, tear - 7]); continue; }
    left.push([Math.max(0, j(1.6)), y]);
  }
  rr = 16 + j(3);
  left.push(...arc(rr, rr, rr, Math.PI));
  const path = pts => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
  return {
    full: path([...top, ...right, ...bottom, ...left]),
    right: path([...top.filter(p => p[0] >= hw), ...right, ...bottom.filter(p => p[0] >= hw)]),
    left: path([...top.filter(p => p[0] <= hw), ...bottom.filter(p => p[0] <= hw), ...left]),     // the back of the cover
  };
}

// the inside of the sheet: less handled than the cover, but older-looking: tanned outer edges, foxing, the ink cracked
// along the fold, the cover's pocket creases showing through on the left half (the cover's back, mirrored), a water
// stain, a thumbprint, and a strip of yellowed tape over the tear. Same two layers as the cover (`rub` normal, `grime` multiply), in page px.
export function spreadWear(w, h, { seed = 3, q = 1.5, L = WEAR } = {}) {
  const r = mulberry32(seed * 7 + 11), R = (a, b) => a + r() * (b - a), hw = w / 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = w * q; c.height = h * q; const g = c.getContext('2d'); g.scale(q, q); g.lineCap = 'round'; return [c, g]; };
  const [rub, g] = mk(), [grime, d] = mk();

  // newsprint goes brown from the outside in: a general yellowing, deeper along the four outer edges and into the corners
  d.fillStyle = 'rgba(243,229,196,.14)'; d.fillRect(0, 0, w, h);
  for (const [x0, y0, x1, y1, x, y, ww, hh, a] of [[0, 0, 0, 60, 0, 0, w, 60, 0.42], [0, h, 0, h - 60, 0, h - 60, w, 60, 0.42], [w, 0, w - 70, 0, w - 70, 0, 70, h, 0.5], [0, 0, 70, 0, 0, 0, 70, h, 0.5]]) {
    const grd = d.createLinearGradient(x0, y0, x1, y1); grd.addColorStop(0, `rgba(206,168,98,${a})`); grd.addColorStop(1, 'rgba(206,168,98,0)');
    d.fillStyle = grd; d.fillRect(x, y, ww, hh);
  }
  for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
    const grd = d.createRadialGradient(cx, cy, 0, cx, cy, 170); grd.addColorStop(0, 'rgba(190,150,84,.32)'); grd.addColorStop(1, 'rgba(190,150,84,0)');
    d.fillStyle = grd; d.fillRect(cx - 170, cy - 170, 340, 340);
  }
  const fold = d.createLinearGradient(hw - 14, 0, hw + 14, 0);
  fold.addColorStop(0, 'rgba(190,150,84,0)'); fold.addColorStop(0.5, 'rgba(190,150,84,.22)'); fold.addColorStop(1, 'rgba(190,150,84,0)');
  d.fillStyle = fold; d.fillRect(hw - 14, 0, 28, h);

  // foxing: rust specks, mostly near the edges, a few clusters
  for (let i = 0; i < 160; i++) {
    const edge = r() < 0.65, x = edge ? (r() < 0.5 ? R(0, 70) : R(w - 80, w)) : R(0, w), y = edge && r() < 0.3 ? (r() < 0.5 ? R(0, 40) : R(h - 40, h)) : R(0, h);
    d.fillStyle = `rgba(158,112,58,${R(0.1, 0.32).toFixed(2)})`; d.beginPath(); d.arc(x, y, R(0.5, 2.4), 0, 7); d.fill();
  }
  for (let k = 0; k < 3; k++) {
    const cx = R(120, w - 120), cy = R(100, h - 100);
    for (let i = 0; i < 14; i++) { d.fillStyle = `rgba(158,112,58,${R(0.08, 0.22).toFixed(2)})`; d.beginPath(); d.arc(cx + R(-26, 26), cy + R(-18, 18), R(0.6, 1.8), 0, 7); d.fill(); }
  }

  // a water stain: a faint wash with a darker tide line
  {
    const cx = L.stain[0] * w, cy = L.stain[1] * h, n = 40, pts = Array.from({ length: n }, (_, k) => { const t = k / n * Math.PI * 2, rr = 120 * (1 + 0.16 * Math.sin(t * 3 + 1) + 0.08 * Math.sin(t * 7)); return [cx + Math.cos(t) * rr * 1.25, cy + Math.sin(t) * rr * 0.8]; });
    d.beginPath(); pts.forEach(([x, y], k) => (k ? d.lineTo(x, y) : d.moveTo(x, y))); d.closePath();
    d.fillStyle = 'rgba(176,138,80,.06)'; d.fill();
    d.strokeStyle = 'rgba(150,108,56,.2)'; d.lineWidth = 2.2; d.stroke();
  }
  // a thumbprint where the page gets held
  {
    const cx = L.thumb[0] * w, cy = L.thumb[1] * h;
    d.save(); d.translate(cx, cy); d.rotate(-0.5); d.strokeStyle = 'rgba(70,58,50,.1)'; d.lineWidth = 1;
    for (let k = 3; k < 17; k += 2.2) { d.beginPath(); d.ellipse(0, k * 0.15, k * 1.25, k, 0, Math.PI * 1.05, Math.PI * 2.95); d.stroke(); }
    d.restore();
  }

  // the ink cracked along the fold: ragged paper-coloured breaks running down the crease itself, a few short spurs off it
  for (let i = 0; i < 22; i++) {
    let x = hw + R(-2.2, 2.2), y = R(4, h - 30);
    const n = 1 + Math.floor(r() * 3), pts = [[x, y]];
    for (let k = 0; k < n; k++) { x = hw + (x - hw) * 0.5 + R(-1.8, 1.8); y += R(3, 10); pts.push([x, y]); }
    g.strokeStyle = `rgba(244,236,216,${R(0.25, 0.6).toFixed(2)})`; g.lineWidth = R(0.5, 1.1);
    g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const y = R(10, h - 10), side = r() < 0.5 ? -1 : 1, len = R(3, 11), dy = R(-4, 4);
    g.strokeStyle = `rgba(244,236,216,${R(0.3, 0.65).toFixed(2)})`; g.lineWidth = R(0.5, 1);
    g.beginPath(); g.moveTo(hw, y); g.lineTo(hw + side * len * 0.5, y + dy * 0.6 + R(-1, 1)); g.lineTo(hw + side * len, y + dy); g.stroke();
    d.strokeStyle = 'rgba(80,60,40,.14)'; d.lineWidth = 0.6;
    d.beginPath(); d.moveTo(hw, y + 1.2); d.lineTo(hw + side * len, y + dy + 1.2); d.stroke();
  }
  // the cover's pocket creases (wearLayers) show through mirrored on the left half, plus an old one across the right half
  const crease = (x0, y0, x1, y1, a = 1) => {
    const n = 16, pts = Array.from({ length: n + 1 }, (_, k) => [x0 + (x1 - x0) * k / n + R(-1.5, 1.5), y0 + (y1 - y0) * k / n + R(-1.5, 1.5)]);
    for (const [ctx, col, off, lw] of [[g, `rgba(244,236,216,${0.45 * a})`, 0, 1.4], [d, `rgba(70,52,36,${0.16 * a})`, -1.3, 1]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(x + off, y + off) : ctx.moveTo(x + off, y + off))); ctx.stroke();
    }
  };
  for (const [x0, y0, x1, y1] of L.creases) crease(hw * (1 - x0), h * y0, hw * (1 - x1), h * y1);
  crease(...L.inner.map((v, k) => v * (k % 2 ? h : w)), 0.7);
  // edge flecks and a few scuffs (the inside got far less handling than the cover)
  g.fillStyle = PAPER;
  for (let x = 0; x < w; x += 3) for (const [y, dir] of [[0, 1], [h, -1]]) if (r() < 0.12) { g.beginPath(); g.ellipse(x, y + dir * R(0, 1) ** 2 * 5, R(0.4, 1.8), R(0.3, 1.2), R(0, 3), 0, 7); g.fill(); }
  for (let y = 0; y < h; y += 3) for (const x of [0, w]) if (r() < 0.14) { g.beginPath(); g.ellipse(x + (x ? -1 : 1) * R(0, 1) ** 2 * 6, y, R(0.4, 2), R(0.3, 1.2), R(0, 3), 0, 7); g.fill(); }
  for (let i = 0; i < 36; i++) {
    const x = R(0, w), y = R(0, h), a = R(0, Math.PI), l = R(8, 60);
    g.strokeStyle = `rgba(244,236,216,${R(0.08, 0.22).toFixed(2)})`; g.lineWidth = R(0.5, 1);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // strips of yellowed tape: one over the tear in the left edge, any others the copy picked up
  const tape = (x, y, a, len) => {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = 'rgba(232,205,130,.42)'; g.fillRect(-len / 2, -15, len, 30);
    g.strokeStyle = 'rgba(176,140,70,.45)'; g.lineWidth = 1; g.strokeRect(-len / 2, -15, len, 30);
    g.fillStyle = 'rgba(255,250,230,.25)'; g.fillRect(-len / 2 + 4, -12, len - 8, 5);
    g.restore();
  };
  tape(12, h * L.tear, 0.12, 68);
  for (const [x, y, a, len] of L.tapes) tape(x * w, y * h, a, len);

  return { rub, grime };
}

// Light across an open folded sheet (one row, stretched down the page): each half bulges up off the fold and droops a
// little at its outer edge; shading comes from that profile's slope under a light from the upper left, plus a valley of
// shade right at the fold and the fold line itself. Dark is ink-brown with alpha, light is paper-white with alpha.
export function spreadLight(w, { q = 2, hump = 24, valley = 0.5 } = {}) {
  const c = document.createElement('canvas'); c.width = w * q; c.height = 1;
  const g = c.getContext('2d'), img = g.createImageData(c.width, 1), hw = w / 2;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const z = u => hump * (1 - Math.exp(-u / 0.045)) * (1 - 0.3 * sm(0.15, 1, u));
  const L = [-0.55, 0, 1], ll = Math.hypot(...L), flat = L[2] / ll;
  for (let i = 0; i < c.width; i++) {
    const x = (i + 0.5) / q, side = x < hw ? -1 : 1, u = Math.abs(x - hw) / hw;
    const dz = (z(u + 0.001) - z(u)) / (0.001 * hw) * side;          // height slope along x
    const nl = Math.hypot(dz, 1);
    let shade = ((-dz * L[0] + L[2]) / nl / ll) / flat;
    shade *= 1 - valley * Math.exp(-u / 0.02);
    if (Math.abs(x - hw) < 0.9) shade *= 0.7;                        // the fold itself
    const k = i * 4;
    if (shade < 1) img.data.set([24, 16, 10, Math.min(255, (1 - shade) * 230)], k);
    else img.data.set([255, 250, 236, Math.min(255, (shade - 1) * 330)], k);
  }
  g.putImageData(img, 0, 0);
  return c;
}

// two layers: `rub` is paper showing where the ink wore off (normal blend), `grime` is dirt and age (multiply)
export function wearLayers(w, h, { seed = 3, q = 2, L = WEAR } = {}) {
  const r = mulberry32(seed), R = (a, b) => a + r() * (b - a);
  const mk = () => { const c = document.createElement('canvas'); c.width = w * q; c.height = h * q; const g = c.getContext('2d'); g.scale(q, q); g.lineCap = 'round'; return [c, g]; };
  const [rub, g] = mk(), [grime, d] = mk();

  // chipped edges: little flecks of bare paper, thicker toward the corners and along the right edge where thumbs turn it
  const fleck = (x, y, s) => { g.beginPath(); g.ellipse(x, y, s, s * R(0.5, 1), R(0, 3), 0, 7); g.fill(); };
  g.fillStyle = PAPER;
  const corner = (x, y) => Math.max(0, 1 - Math.min(Math.hypot(x - w, y), Math.hypot(x - w, y - h)) / 120);
  for (let x = 0; x < w; x += 2.5) {
    for (const [y, dir] of [[0, 1], [h, -1]]) if (r() < 0.22 + 0.6 * corner(x, y)) fleck(x, y + dir * R(0, 1) ** 2 * 8, R(0.5, 2.6));
  }
  for (let y = 0; y < h; y += 2.5) if (r() < 0.32 + 0.6 * corner(w, y)) fleck(w - R(0, 1) ** 2 * 10, y, R(0.5, 2.8));
  for (let i = 0; i < 260; i++) { const y = R(0, h); fleck(w - R(0, 1) ** 3 * 46, y, R(0.3, 1.4)); }            // thumb-worn band

  // colour-breaking creases along the fold (the spine side of the half-sheet)
  for (let i = 0; i < 34; i++) {
    const y = R(10, h - 10), len = R(5, 36), bend = R(-4, 4);
    g.strokeStyle = `rgba(244,236,216,${R(0.6, 0.95).toFixed(2)})`; g.lineWidth = R(0.9, 2.2);
    g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(len / 2, y + bend, len, y + bend * 1.6); g.stroke();
    d.strokeStyle = 'rgba(80,60,40,.22)'; d.lineWidth = 0.8;
    d.beginPath(); d.moveTo(0, y + 1.6); d.quadraticCurveTo(len / 2, y + bend + 1.6, len, y + bend * 1.6 + 1.6); d.stroke();
  }

  // long creases from being folded in a back pocket: a light ridge with a shadow beside it
  const crease = (x0, y0, x1, y1) => {
    const n = 14, pts = Array.from({ length: n + 1 }, (_, k) => [x0 + (x1 - x0) * k / n + R(-1.5, 1.5), y0 + (y1 - y0) * k / n + R(-1.5, 1.5)]);
    for (const [ctx, col, off, lw] of [[g, 'rgba(244,236,216,.55)', 0, 1.5], [d, 'rgba(70,52,36,.2)', 1.4, 1]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(x + off, y + off) : ctx.moveTo(x + off, y + off))); ctx.stroke();
    }
  };
  for (const [x0, y0, x1, y1] of L.creases) crease(w * x0, h * y0, w * x1, h * y1);

  // scuffs and hairline scratches
  for (let i = 0; i < 70; i++) {
    const x = R(0, w), y = R(0, h), a = R(0, Math.PI), l = R(8, 70);
    g.strokeStyle = `rgba(244,236,216,${R(0.12, 0.32).toFixed(2)})`; g.lineWidth = R(0.5, 1.1);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }

  // age: edges gone yellow, foxing, a coffee ring that overlapped the corner
  d.fillStyle = 'rgba(243,229,196,.16)'; d.fillRect(0, 0, w, h);
  for (const [x0, y0, x1, y1, x, y, ww, hh] of [[0, 0, 0, 70, 0, 0, w, 70], [0, h, 0, h - 70, 0, h - 70, w, 70], [w, 0, w - 70, 0, w - 70, 0, 70, h], [0, 0, 40, 0, 0, 0, 40, h]]) {
    const grd = d.createLinearGradient(x0, y0, x1, y1); grd.addColorStop(0, 'rgba(214,180,110,.45)'); grd.addColorStop(1, 'rgba(214,180,110,0)');
    d.fillStyle = grd; d.fillRect(x, y, ww, hh);
  }
  for (let i = 0; i < 90; i++) {
    const edge = r() < 0.6, x = edge ? (r() < 0.5 ? R(0, 60) : R(w - 80, w)) : R(0, w), y = R(0, h);
    d.fillStyle = `rgba(160,118,62,${R(0.12, 0.36).toFixed(2)})`; d.beginPath(); d.arc(x, y, R(0.6, 2.6), 0, 7); d.fill();
  }
  const cx = L.ring[0] * w, cy = L.ring[1] * h, cr = 62;
  d.strokeStyle = 'rgba(140,96,48,.2)'; d.lineWidth = 5; d.beginPath(); d.arc(cx, cy, cr, 0.3, 5.9); d.stroke();
  d.strokeStyle = 'rgba(120,80,40,.16)'; d.lineWidth = 1.6; d.beginPath(); d.arc(cx + 1, cy - 1, cr + 2, 0.5, 5.6); d.stroke();
  d.fillStyle = 'rgba(170,120,60,.05)'; d.beginPath(); d.arc(cx, cy, cr - 2, 0, 7); d.fill();

  return { rub, grime };
}

// Hand lettering as strokes, for marks drawn with a brush (Jojo's grease pencil, YOYO's lipstick): capitals on a 4×6 grid,
// each a list of polylines in the order a hand would make them. `phrase()` lays a line out, jitters it like a hand and
// returns strokes in the caller's units.
import { mulberry32 } from '../engine.js';

const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const heart = () => Array.from({ length: 25 }, (_, i) => { const t = i / 24 * Math.PI * 2; return [2 + 16 * Math.sin(t) ** 3 * 0.13, 3.2 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.17]; });
const dot = (x, y) => [[x, y], [x + 0.08, y + 0.3]];

export const GLYPHS = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.8, 3.8], [3.2, 3.8]]],
  B: [[[0, 6], [0, 0], [2.6, 0], [3.6, 0.8], [3.6, 2.2], [2.6, 3], [0, 3]], [[2.6, 3], [3.8, 3.8], [3.8, 5.2], [2.8, 6], [0, 6]]],
  C: [arc(2.1, 3, 2, 3, -35, -325)],
  D: [[[0, 0], [0, 6], [2, 6], [3.6, 4.8], [4, 3], [3.6, 1.2], [2, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  G: [[...arc(2.1, 3, 2, 3, -35, -325), [4, 3.4], [2.4, 3.4]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  J: [[[3, 0], [3, 4.6], [2.4, 5.8], [1.2, 6], [0.4, 5]]],
  K: [[[0, 0], [0, 6]], [[3.8, 0], [0, 3.6]], [[1.2, 2.6], [4, 6]]],
  L: [[[0, 0], [0, 6], [3.6, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.6], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [arc(2, 3, 2, 3, -90, 275, 16)],
  P: [[[0, 6], [0, 0], [2.6, 0], [3.6, 0.9], [3.6, 2.2], [2.6, 3.1], [0, 3.1]]],
  R: [[[0, 6], [0, 0], [2.6, 0], [3.6, 0.9], [3.6, 2.2], [2.6, 3.1], [0, 3.1]], [[1.8, 3.1], [4, 6]]],
  S: [[[3.8, 0.8], [2.8, 0], [1.2, 0], [0.2, 0.9], [0.4, 2.2], [2, 3], [3.6, 3.8], [3.8, 5.1], [2.8, 6], [1.1, 6], [0, 5.2]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 4.6], [0.8, 5.8], [2, 6], [3.2, 5.8], [4, 4.6], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 2.4], [3, 6], [4, 0]]],
  Y: [[[0, 0], [2, 3]], [[4, 0], [2, 3], [2, 6]]],
  0: [arc(2, 3, 1.9, 3, -90, 275, 16)],
  2: [[[0.2, 1.2], [1.2, 0.1], [2.8, 0.1], [3.8, 1.2], [3.6, 2.6], [0, 6], [4, 6]]],
  '%': [[[3.8, 0.2], [0.2, 5.8]], arc(0.9, 1, 0.8, 0.9, 0, 360, 10), arc(3.1, 5, 0.8, 0.9, 0, 360, 10)],
  '?': [[[0.4, 1.2], [1.2, 0.1], [2.8, 0.1], [3.7, 1.1], [3.5, 2.4], [2, 3.4], [2, 4.4]], dot(2, 5.6)],
  '!': [[[2, 0], [2, 4.2]], dot(2, 5.6)],
  '.': [dot(0.6, 5.6)],
  '♡': [heart()],
};
const ADV = { '.': 1.6, '!': 2.4, ' ': 2.6 };

// a line of lettering: `size` = cap height in caller units, starting at (x, y) (top left), turned by `a` radians;
// a hand's wobble (seeded): each glyph a little off its baseline and slant, each point a little off its place
export function phrase(text, { x = 0, y = 0, size = 30, a = 0, seed = 1, wobble = 0.12, slant = 0.12, spacing = 1.25 } = {}) {
  const r = mulberry32(seed), k = size / 6, out = [];
  let pen = 0;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) {
      const dy = (r() - 0.5) * 0.5, sl = slant + (r() - 0.5) * 0.08, sc = 1 + (r() - 0.5) * 0.12;
      for (const s of g) out.push(s.map(([gx, gy]) => {
        const lx = pen + (gx + (6 - gy) * sl) * sc + (r() - 0.5) * wobble * 4, ly = (gy * sc + dy) + (r() - 0.5) * wobble * 4;
        return [x + (lx * Math.cos(a) - ly * Math.sin(a)) * k, y + (lx * Math.sin(a) + ly * Math.cos(a)) * k];
      }));
    }
    pen += (ADV[ch] ?? 4) + spacing;
  }
  return out;
}

// a loop thrown round something, overshooting where it closes (a grease-pencil "this one")
export function ring(cx, cy, rx, ry, { seed = 1, turns = 1.18 } = {}) {
  const r = mulberry32(seed), a0 = -2.2 + r() * 0.5, pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = a0 + i / 40 * Math.PI * 2 * turns, grow = 1 + i / 40 * 0.12;
    pts.push([cx + Math.cos(t) * rx * grow + (r() - 0.5) * rx * 0.04, cy + Math.sin(t) * ry * grow + (r() - 0.5) * ry * 0.05]);
  }
  return pts;
}

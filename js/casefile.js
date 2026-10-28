// The case file — the CASE FILE in the corner, opened: Det. Jojo's manila folder on his desk under a green banker's lamp.
// Everything on the desk is a real object (codex photographs, cut out: assets/casefile/obj), laid out by js/case/layout.js,
// each with a shadow that falls the same way (the lamp is top left) and the lamp's light over the lot. Shut, the folder is
// its cover tied with string; opened, the left flap holds the map of YOYO's route and the suspect composite, the right side
// four field reports in story order with index tabs. Each report files that floor's comic, a frame of YOYO from the footage,
// the exhibit in an evidence envelope and, once dusted, the print it gave up. What a hand puts down (the route in lipstick,
// Jojo's grease pencil, the composite in graphite, the powder) is p5.brush, on top of the objects.
import { loadBrush, Surface, timelapse, stroke } from './brush.js';
import { Dusting } from './case/dust.js';
import { Eggs } from './case/eggs.js';
import { Finale } from './case/finale.js';
import { phrase, ring } from './case/letters.js';
import { W, H, FOLD, DESK_RECT, DESK, LEFT, PAGES, SPOTS } from './case/layout.js';
import { clamp, lerp, mulberry32 } from './engine.js';

const A = 'assets/casefile/';
const KEY = 'jolly-case-v2';
export const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
}
export const place = (e, [x, y, w, h], rot = 0) => Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', transform: rot ? `rotate(${rot}deg)` : '' });
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// the floors in story order: what each report files, where its exhibit was, and YOYO's moment in the footage
export const FLOORS = [
  { id: 'bar', no: 1, floor: '1F', room: 'Club', place: 'The Jolly Club', clock: '23:47', tab: '#2a5cc8', ex: 'ribbon', img: 'ev_ribbon', letter: 'A', what: 'The wine ribbon',
    back: 24.6, hint: "On the bandstand, at the detective's feet, once the lights come back.", seen: 15, where: 'Coat check', mark: 'HER?',
    report: 'Wine ribbon on the bandstand, right where the detective stood when the lights went. His pink stiletto tie clip, gone. Coat-check girl saw nothing. Nobody ever does.',
    print: { x: 470, y: 330, s: 0.9, a: 0.35, keep: ['heart', 1, 2, 3] }, dark: true },
  { id: 'alley', no: 2, floor: 'AL', room: 'Alley', place: 'The Back Alley', clock: '23:58', tab: '#8a4fc0', ex: 'bell', img: 'ev_bell', letter: 'B', what: 'The bell',
    back: 21.75, hint: "It's only there for a second, after the lightning.", seen: 17.8, where: 'Fire escape', mark: 'AGAIN.',
    report: 'Rain. Three cats left on the last freight. A bell came down the fire escape in the lightning. Fire escapes do not ring.',
    print: { x: 400, y: 300, s: 0.75, a: -0.2, keep: ['heart', 0, 1, 2, 3] }, dark: false },
  { id: 'cellar', no: 3, floor: 'B1', room: 'Cellar', place: 'The Cellar', clock: '00:06', tab: '#23864f', ex: 'lipstick', img: 'ev_lipstick', letter: 'C', what: 'The lipstick',
    back: 13.2, hint: 'By the candles, once they are lit.', seen: 20, where: 'The throne', mark: 'SAME CAT.',
    report: 'Officer Lyly went down for a keg and came up without one. Lipstick circle on the floor. Something in the drain. It said meow.',
    print: { x: 420, y: 320, s: 0.62, a: 0.6, keep: ['heart', 0, 1, 2] }, dark: false },
  { id: 'motel', no: 4, floor: '2F', room: 'Room 203', place: 'Room 203', clock: '00:13', tab: '#b8262c', ex: 'stiletto', img: 'ev_clip', letter: 'D', what: 'The pink stiletto',
    back: 26.2, hint: 'On the carpet, after the victim sits up. A second, no more.', seen: 24.4, where: 'Outside the window', mark: 'GOTCHA.',
    report: 'Room 203. Victim: plush, unharmed, sat up. Mirror signed YOYO 200%. The pink stiletto tie clip, recovered. Case open till it is not.',
    print: { x: 430, y: 290, s: 0.8, a: -0.5, keep: ['heart', 0, 1, 3] }, dark: false },
];
// ⑤ where YOYO is inside each floor's photo (fractions of the picture area) and how big a loop goes round her
const MARKS = { bar: [0.4, 0.36, 0.2, 0.36], alley: [0.52, 0.44, 0.2, 0.36], cellar: [0.46, 0.42, 0.2, 0.36], motel: [0.5, 0.58, 0.22, 0.3] };

// the progress kept in this browser: prints lifted, YOYO moments seen, how much of the sketch is drawn, marks made
function loadState() {
  try { return { prints: {}, seen: {}, sketch: 0, marks: {}, eggs: {}, closed: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { prints: {}, seen: {}, sketch: 0, marks: {}, eggs: {}, closed: false }; }
}
// every object's shadow falls down and right of it (the lamp is top left), however the object is turned: the offsets are
// turned back by its own angle. Two layers: a tight contact shadow and a soft one that grows with how high it stands.
export function shadow(sh, r = 0) {
  if (!sh) return 'none';
  const a = -r * Math.PI / 180, rot = (x, y) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const [x1, y1] = rot(0.8 + 0.8 * sh, 1.2 + 1.4 * sh), [x2, y2] = rot(3.5 * sh, 6.5 * sh);
  return `drop-shadow(${x1.toFixed(1)}px ${y1.toFixed(1)}px ${(0.8 + 0.9 * sh).toFixed(1)}px rgba(28,15,4,.55)) drop-shadow(${x2.toFixed(1)}px ${y2.toFixed(1)}px ${(5 + 6 * sh).toFixed(1)}px rgba(20,10,2,.34))`;
}
// typewriter lettering: every letter struck a little differently (its height, how much ink); words kept whole
// pencil doodles (red where Jojo marked them): the suspect, a kitten with a bow, her?; the alley, a bell coming down the
// fire escape in the lightning; the drain in the cellar, with its eye
const DOODLES = { suspect: '<svg viewBox="0 0 180 110"><g class="pc"><path d="M36 58C35 46 37 38 40 26L52 40C58 38 70 38 76 40L88 26C91 38 93 46 92 58C92 77 80 90 64 90C48 90 36 77 36 58Z"/><path class="re" d="M37 60C36 47 38 39 41 28L52 41M77 41L87 28C90 40 91 48 91 60C90 76 79 88 64 89"/><path d="M50 70L31 66M50 73L32 77M78 70L97 66M78 73L96 77M64 71Q61 76 57 74M64 71Q67 76 71 74"/><ellipse class="f" cx="54" cy="60" rx="3.2" ry="4.4"/><ellipse class="f" cx="74" cy="60" rx="3.2" ry="4.4"/><path class="f" d="M61 67H67L64 71Z"/></g><g class="rd"><path d="M42 31C33 20 25 25 30 32C33 36 39 34 42 31C47 22 56 23 53 31C51 36 45 35 42 31Z"/><circle cx="42" cy="31" r="2.6"/><path d="M146 50C134 56 116 60 101 61M101 61L110 56M101 61L108 67"/><text x="128" y="40">her?</text></g></svg>',
  bell: '<svg viewBox="0 0 330 110"><g class="pc"><path d="M22 8V104M62 8V104M22 22L62 38M22 46L62 62M22 70L62 86M10 38H74M10 86H74"/><path d="M128 74C127 54 132 40 143 40C154 40 159 54 158 74L164 80H122Z"/><circle class="f" cx="143" cy="86" r="4.5"/><path d="M133 22L135 31M143 17V28M153 22L151 31M98 12L92 26M110 6L104 20M186 10L180 24M200 4L194 18"/><path d="M214 14L198 50L213 48L196 90"/></g><g class="rd"><path d="M138 41C132 33 138 29 143 37C148 29 154 33 148 41"/><text x="226" y="70">DING?!</text></g><text class="pt" x="226" y="96">23:58</text></svg>',
  drain: '<svg viewBox="0 0 180 110"><g class="pc"><circle cx="66" cy="56" r="36"/><circle class="re" cx="66" cy="56" r="31"/><path d="M40 34H92M33 46H99M33 68H99M40 80H92"/><path d="M50 57Q66 47 82 57Q66 66 50 57Z"/><circle class="f" cx="66" cy="57" r="4.2"/></g><g class="rd"><path d="M150 50C138 56 122 58 108 58M108 58L117 53M108 58L115 64"/><text x="122" y="40">EYE!</text></g></svg>' };

function typed(text, seed = 1) {
  const r = mulberry32(seed);
  return text.split(' ').map(w => `<span class="w">${[...w].map(ch => `<i style="--y:${((r() - 0.5) * 1.5).toFixed(2)}px;--o:${(0.66 + r() * 0.34).toFixed(2)}">${esc(ch)}</i>`).join('')}</span>`).join(' ');
}

export class CaseFile {
  // found(exhibitId): is it in the case file; goFloor(id, t): back to the footage there; readComic(id): open that floor's issue
  constructor({ viewport, foley, found, goFloor, readComic, onClose, toast }) {
    Object.assign(this, { viewport, foley, found, goFloor, readComic, onClose, toast });
    this.state = loadState();
    this.active = false; this.busy = false; this.isOpen = false;
    this.cam = { x: W * 0.75, y: H / 2, s: 0.5, r: 0 };
    this.top = 0;                                      // the report on top of the pile
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {} }
  see(id) { if (!this.state.seen[id]) { this.state.seen[id] = true; this.save(); this.built && this.paintPage(FLOORS.findIndex(f => f.id === id)); } }

  // ── construction (once, on first opening) ──
  async build() {
    if (this.built) return;
    const [meta] = await Promise.all([fetch(A + 'objects.json').then(r => r.json()), loadBrush()]);
    for (const f of FLOORS) meta['comic_' + f.id] = { w: 938, h: 1012 };
    this.meta = meta;
    const L = this.layer = el('div', 'casefile');
    this.viewport.appendChild(L);
    this.board = el('div', 'cf-board', L);
    const desk = el('div', 'cf-desk', this.board); place(desk, DESK_RECT);
    el('img', '', desk).src = A + 'obj/desk.webp';
    DESK.forEach(it => this.item(it, this.board).classList.add('desk'));             // the desk's things are scenery: clicks go through them
    // the book's shadow on the desk, under the folder (and the back, turned over): the shut book's, then the open one's
    this.ground = el('div', 'cf-ground', this.board, `<img class="shut" src="${A}obj/ground_shut.webp" alt=""><img class="open" src="${A}obj/ground_open.webp" alt="">`);
    this.folder = el('div', 'cf-folder', this.board);
    place(this.folder, [0, 0, W, H]);
    const inside = el('img', 'cf-inside', this.folder); inside.src = A + 'obj/folder_inside.webp'; inside.alt = '';
    inside.style.filter = shadow(1.6);
    // the left flap, shown once the folder is open
    this.left = el('div', 'cf-left', this.folder);
    place(this.left, [0, 0, FOLD, H]);
    LEFT.forEach(it => this.item(it, this.left));
    // the reports, a pile on the right
    this.pages = FLOORS.map((f, i) => this.buildPage(f, i));
    this.stack(false);
    // the cover: a flap on the fold; its back is the left side (a copy, made as it turns)
    this.flap = el('div', 'cf-flap', this.folder);
    place(this.flap, [FOLD, 0, FOLD, H]);
    this.front = el('div', 'cf-face front', this.flap); this.back = el('div', 'cf-face back', this.flap);
    this.buildCover();
    el('div', 'cf-light', this.board).style.cssText = `left:${DESK_RECT[0]}px;top:${DESK_RECT[1]}px;width:${DESK_RECT[2]}px;height:${DESK_RECT[3]}px`;
    this.lamp = el('div', 'cf-lamp', L);
    this.hud = el('div', 'cf-hud', L, '<span class="where"></span><span class="keys">CLICK · OPEN &nbsp;/&nbsp; 1–4 · REPORTS &nbsp;/&nbsp; ESC · BACK</span><button class="close">✕ BACK TO THE FOOTAGE</button>');
    this.hud.querySelector('.close').addEventListener('click', e => { e.stopPropagation(); this.close(); });
    this.eggs = new Eggs(this); this.eggs.build();
    this.finale = new Finale(this); this.finale.build();
    this.bind();
    this.built = true;
  }
  // one object: a box at its place, turned, holding its picture (things that go into it are added by its role)
  item(it, parent) {
    if (it.t) return this.text(it, parent);
    const m = this.meta[it.o], w = it.w, h = w * m.h / m.w;
    const e = el('div', 'cf-it' + (it.role ? ' r-' + it.role : ''), parent);
    Object.assign(e.style, { left: it.x - w / 2 + 'px', top: it.y - h / 2 + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${it.r || 0}deg)`, zIndex: it.z ?? 1 });
    const img = el('img', 'pic', e);
    img.src = it.o.startsWith('comic_') ? `${A}${it.o}.webp` : `${A}obj/${it.o}.webp`; img.alt = ''; img.draggable = false;
    img.style.filter = shadow(it.sh ?? 1, it.r || 0);
    // a desk thing that does something is clicked on its own shape (hit areas), not its whole box
    if (it.hit) it.hit.forEach(([x, y, hw, hh, round]) => { this.spot(e, [x, y, hw, hh], 'hit' + (round ? ' round' : '')).dataset.act = it.act; });
    else if (it.act) e.dataset.act = it.act;
    Object.assign(e, { it, w, h, m, img });
    if (it.role === 'typewriter') this.typewriter(e);
    if (it.role === 'map') this.buildMap(e);
    if (it.role === 'sketch') this.buildSketch(e);
    if (it.role === 'notes') this.notes(e);
    if (it.role === 'waybill') this.waybill(e);
    if (it.role === 'stub') { const t = this.spot(e, SPOTS.ticket.body, 'cf-stub'); t.style.setProperty('--k', (w / 236).toFixed(2)); t.innerHTML = '<small>The Jolly Club</small><b>Nº 200</b><small>Coat check</small>'; }
    return e;
  }
  // Jojo's page of notes on the suspect: headed in red grease pencil, what he has in pencil, a doodle of her at the foot
  notes(e) {
    const N = SPOTS.note;
    this.spot(e, N.title, 'cf-scrawl').innerHTML = '<b>Prime suspect</b><svg viewBox="0 0 240 14" preserveAspectRatio="none"><path d="M4 9C60 4 120 12 236 5"/></svg>';
    this.writeOn(e, N.lines, ['Who: Y.O.Y.O.', 'Why: 200%??', 'Where: everywhere.', 'Coat check · fire escape', 'the drain · the window', 'Same cat. Every time.'], 'pencil', 3);
    this.spot(e, N.doodle, 'cf-doodle').innerHTML = DOODLES.suspect;
  }
  // Lyly's statement, from the cellar: headed in red, in his own pencil, the drain he saw it in at the foot
  statement(e) {
    const N = SPOTS.statement;
    this.spot(e, N.title, 'cf-scrawl').innerHTML = '<b>Statement</b><svg viewBox="0 0 240 14" preserveAspectRatio="none"><path d="M4 7C70 11 140 3 200 8"/></svg>';
    this.writeOn(e, N.lines, ['Ofc. Lyly, B1:', 'Went down for a keg.', 'There was an EYE', 'in the drain. It', 'winked at me.', 'I did not wink back.'], 'pencil', 61);
    this.spot(e, N.doodle, 'cf-doodle').innerHTML = DOODLES.drain;
  }
  // the last freight's waybill, from the alley: typed up at the yard, the load pencilled in and ringed in red
  waybill(e) {
    const S = SPOTS.waybill;
    S.typed.forEach(([box, text, cls], j) => { this.spot(e, box, 'cf-type wb ' + (cls || '')).innerHTML = `<span>${typed(text, 140 + j)}</span>`; });
    this.writeOn(e, S.hand, ['3 cats, live', 'rear dock', 'out 23:58'], 'pencil', 147);
    this.spot(e, S.ring, 'cf-doodle').innerHTML = '<svg viewBox="0 0 100 30" preserveAspectRatio="none"><g class="rd"><path d="M10 18C6 6 60 2 88 8C100 12 96 26 60 27C30 28 4 25 14 12"/></g></svg>';
  }
  // a fraction rectangle of an object, as a positioned box inside it
  spot(e, [x, y, w, h], cls = '') {
    const s = el('div', 'cf-spot ' + cls, e);
    Object.assign(s.style, { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' });
    return s;
  }
  // handwriting on an object's writing area, one line each, in pencil or ink
  writeOn(e, box, lines, ink = 'pencil', seed = 1) {
    const s = this.spot(e, box, 'hand ' + ink), r = mulberry32(seed);
    s.innerHTML = lines.map(l => `<p style="--t:${((r() - 0.5) * 3).toFixed(1)}deg;--x:${(r() * 8).toFixed(0)}px">${esc(l)}</p>`).join('');
    return s;
  }
  // typed or stamped straight onto the paper
  text(it, parent, f = this.building) {
    const e = el('div', 'cf-type ' + it.t, parent);
    Object.assign(e.style, { left: it.x + 'px', top: it.y + 'px', width: it.w + 'px', transform: `rotate(${it.r || 0}deg)`, zIndex: 2 });     // on the sheet (z 1), under what lies on it
    if (it.t === 'head') e.innerHTML = `<small>${typed('Jolly P.D. · 2nd Precinct · Field Report', 3)}</small>
      <b>${typed(`No. ${f.no} — ${f.floor} · ${f.place}`, 5)}</b><small>${typed(`${f.clock} · Det. J. Jojo · Case No. 203`, 7)}</small>`;
    else if (it.t === 'report') e.innerHTML = typed(f.report, 11 + f.no);
    else if (it.t === 'doodle') { e.className = 'cf-doodle'; e.style.height = it.h + 'px'; e.innerHTML = DOODLES[it.d]; }
    return e;
  }

  // ── the cover, the map, the composite ──
  buildCover() {
    // a leather case book: the title gold-blocked into its panel, the four exhibits as four blind-stamped squares (each
    // gilded once it is in the file), an elastic strap holding it shut
    const f = this.front, m = this.meta.cover_leather, k = Math.max(FOLD / m.w, H / m.h), dw = m.w * k, dh = m.h * k, ox = (FOLD - dw) / 2, oy = (H - dh) / 2;
    const at = ([fx, fy]) => [ox + fx * dw, oy + fy * dh];
    const img = el('img', 'cf-coverimg', f); img.src = A + 'obj/cover_leather.webp'; img.alt = '';
    const [lx, ly] = at(SPOTS.cover.label), lw = SPOTS.cover.label[2] * dw, lh = SPOTS.cover.label[3] * dh;
    place(el('div', 'cf-label', f, '<small>Jolly P.D. · 2nd Precinct</small><b>Case No. 203</b><span>The Pink Stiletto</span>'), [lx, ly, lw, lh]);
    const [ex, ey] = at(SPOTS.cover.exhibits);
    const boxes = el('div', 'cf-boxes', f, `${FLOORS.map(x => `<i data-ex="${x.ex}">${x.letter}</i>`).join('')}`);
    Object.assign(boxes.style, { left: ex + 'px', top: ey + 'px' });
    el('div', 'cf-foil sig', f, 'Det. J. Jojo').style.cssText = `left:${at(SPOTS.cover.sig)[0]}px;top:${at(SPOTS.cover.sig)[1]}px`;
    const band = el('img', 'cf-band', f); band.src = A + 'obj/band.webp'; band.alt = '';
    Object.assign(band.style, { left: at([SPOTS.cover.band, 0])[0] - 22 + 'px' });
    // the back of the cover is the inside of the book's left half
    const inner = el('img', 'cf-backimg', this.back); inner.src = A + 'obj/folder_inside.webp'; inner.alt = '';
    this.paintCover();
  }
  paintCover() { this.front.querySelectorAll('.cf-boxes > i').forEach(i => i.classList.toggle('on', this.found(i.dataset.ex))); }
  typewriter(e) {
    const s = this.spot(e, SPOTS.typewriter.paper, 'cf-type tw');
    s.innerHTML = typed('CASE No. 203 — re: the pink stiletto. Suspect: small, grey, striped. Answers to nobody.', 21);
  }
  // ③ the map: YOYO's route in lipstick paw prints over the drawing, a pin at each time she was seen
  buildMap(e) {
    this.mapItem = e;
    this.map = new Surface(e.w, e.h, { k: 2, paper: '#ffffff', seed: 4, tooth: 0.6 });
    this.map.out.className = 'cf-ov';
    paperShaped(this.map.out, e);
    e.appendChild(this.map.out);
    SPOTS.graph.pins.forEach(([px, py], i) => {
      const b = el('button', 'cf-pin', e, `<b>${FLOORS[i].clock}</b><small>${FLOORS[i].floor}</small>`);
      Object.assign(b.style, { left: px * 100 + '%', top: py * 100 + '%' }); b.dataset.act = 'pin'; b.dataset.i = i;
    });
  }
  drawMap() {
    if (this.mapDrawn) return;
    this.mapDrawn = true;
    const e = this.mapItem, seen = this.state.seen, ids = FLOORS.map(f => f.id);
    this.map.draw(b => SPOTS.graph.legs.forEach((leg, li) => {
      const on = seen[ids[li]] && seen[ids[li + 1]];
      b.set(on ? 'lipstick' : 'graphite', on ? '#c4142c' : '#5a5450', on ? 0.2 : 0.7);
      for (let s = 0; s < leg.length - 1; s++) {
        const [x0, y0] = [leg[s][0] * e.w, leg[s][1] * e.h], [x1, y1] = [leg[s + 1][0] * e.w, leg[s + 1][1] * e.h];
        const n = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 17)), a = Math.atan2(y1 - y0, x1 - x0);
        for (let k = 0; k < n; k++) {
          const u = (k + 0.5) / n, side = (k % 2 ? 1 : -1) * 4, x = lerp(x0, x1, u) - Math.sin(a) * side, y = lerp(y0, y1, u) + Math.cos(a) * side;
          if (on) { b.circle(x, y, 2.6); b.circle(x + Math.cos(a) * 4 - Math.sin(a) * 2.5, y + Math.sin(a) * 4 + Math.cos(a) * 2.5, 1.2); }
          else if (k % 2) b.line(x - Math.cos(a) * 3, y - Math.sin(a) * 3, x + Math.cos(a) * 3, y + Math.sin(a) * 3);
        }
      }
    }));
  }
  // ② the composite form: the sketch artist's drawing (codex graphite, assets/casefile/sketch.webp) comes out of the paper
  // along pencil strokes: p5.brush draws the strokes into a mask, and the drawing shows only where they have gone, so it
  // looks drawn as you watch and ends as the drawing itself. Head and fur first; a feature per lifted print.
  buildSketch(e) {
    this.sketchItem = e;
    const sl = e.m.slot, box = this.spot(e, [sl.x, sl.y, sl.w, sl.h], 'cf-sketchbox'), w = Math.round(sl.w * e.w), h = Math.round(sl.h * e.h);
    this.reveal = new Surface(w, h, { k: 2.5, paper: '#ffffff', seed: 8, tooth: 0 });           // the mask: dark where drawn
    this.sketchView = el('canvas', 'cf-ov', box); this.sketchView.width = this.reveal.out.width; this.sketchView.height = this.reveal.out.height;
    this.sketchImg = new Image(); this.sketchImg.src = A + 'sketch.webp';
    const F = SPOTS.form;
    this.spot(e, [F.box[0], F.box[1], F.box[2], F.box[3]], 'cf-type formno').innerHTML = typed('7-C', 31);
    this.fields = ['Sex', 'Species', 'Height', 'Alias', 'Marks', 'Seen'].map((label, j) => {
      const y = F.lines[j] - 0.034;
      this.spot(e, [F.label[0], y, F.label[1], 0.03], 'cf-type flabel').innerHTML = typed(label, 40 + j);
      return this.spot(e, [F.line[0] + 0.01, y - 0.004, F.line[1], 0.034], 'hand ink field');
    });
    const fill = ['F', 'Cat (kitten)', 'Half a dog', '"The Boss"', '', ''];
    this.fields.forEach((s, j) => { s.textContent = fill[j]; });
  }
  // what shows: the drawing wherever a stroke has gone so far; layers already finished whole (the head and fur with the
  // features cut out of it); features not reached yet left as blank paper
  composeSketch() {
    const c = this.sketchView, g = c.getContext('2d'), im = this.sketchImg, S = this.reveal, k = c.width / S.w;
    const layers = this.sketchL ||= sketchLayers(S.w, S.h);
    const draw = () => { if (!im.complete || !im.naturalWidth) return; const f = Math.min(c.width / im.naturalWidth, c.height / im.naturalHeight), dw = im.naturalWidth * f, dh = im.naturalHeight * f; g.drawImage(im, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh); };
    const path = polys => { g.beginPath(); for (const poly of polys) { poly.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath(); } };
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    draw();
    g.globalCompositeOperation = 'lighten'; g.drawImage(S.out, 0, 0); g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < (this.sketchSettled || 0); i++) {
      g.save(); path(i ? layers[i].polys : [...layers[0].polys, ...layers.slice(1).flatMap(L => L.polys)]); g.clip('evenodd'); draw(); g.restore();
    }
    g.fillStyle = '#fff'; g.filter = `blur(${(6 * k).toFixed(1)}px)`;
    for (let i = Math.max(1, this.sketchDrawn || 0); i < layers.length; i++) { path(layers[i].polys); g.fill(); g.fill(); }
    g.filter = 'none';
  }

  // ── the reports ──
  buildPage(f, i) {
    const pg = el('div', 'cf-page', this.folder);
    place(pg, [FOLD, 0, FOLD, H]);
    pg.dataset.i = i;
    this.building = f;
    pg.items = PAGES[f.id].map(it => this.item(it, pg));
    this.building = null;
    for (const e of pg.items) {
      if (!e.it?.role) continue;
      if (e.it.role === 'photo') e.slotEl = this.spot(e, [e.m.slot.x, e.m.slot.y, e.m.slot.w, e.m.slot.h], 'cf-photoslot');
      if (e.it.role === 'bag') this.buildBag(e, f);
      if (e.it.role === 'card') this.buildCard(e, f);
      if (e.it.role === 'tag') this.writeOn(e, SPOTS.tag.body, [`Exhibit ${f.letter}`, f.floor, f.clock], 'pencil', 50 + i);
      if (e.it.role === 'statement') this.statement(e);
    }
    // its index tab: a divider filed with it, sticking out from under the sheet's right edge, each a step further down;
    // the same stock (the sheet's own picture, the strip along that edge) dyed the floor's colour, the floor typed on it
    // (named as on the elevator)
    // (the button is a margin m bigger than the card all round but the left, to be easier to hit)
    const sheet = pg.items.find(e => e.it?.role === 'sheet'), [tw, th, ty, m] = [136, 128, 86 + i * 196, 16];
    const tab = el('button', 'cf-tab', sheet, `<em>${typed(`No. ${f.no}`, 120 + i)}</em><strong>${typed(f.floor, 124 + i)}</strong><small>${typed(f.room, 128 + i)}</small>`);
    Object.assign(tab.dataset, { act: 'tab', i });
    Object.assign(tab.style, { left: sheet.w - 26 + 'px', top: ty - m + 'px', width: tw + m + 'px', height: th + m * 2 + 'px' });
    for (const [k, v] of [['--m', m + 'px'], ['--tab', f.tab], ['--paper', `url(${A}obj/${sheet.it.o}.webp)`], ['--psize', `${sheet.w}px ${sheet.h}px`], ['--ppos', `${tw - sheet.w}px ${-ty}px`]]) tab.style.setProperty(k, v);
    return pg;
  }
  // the evidence envelope: the exhibit lies behind its cellophane window; the red band is stamped, the lines filled in
  buildBag(e, f) {
    const sl = e.m.slot, win = el('div', 'cf-win', e);
    Object.assign(win.style, { left: sl.x * 100 + '%', top: sl.y * 100 + '%', width: sl.w * 100 + '%', height: sl.h * 100 + '%' });
    e.insertBefore(win, e.img);
    e.win = win;
    this.spot(e, SPOTS.envelope.band, 'band').innerHTML = '<b>EVIDENCE</b>';
    e.lines = this.spot(e, SPOTS.envelope.lines, 'cf-type lines');
  }
  // the fingerprint card: the lifted print goes in its big box; a cat's boxes along the top
  buildCard(e, f) {
    const sl = e.m.slot;
    e.printEl = this.spot(e, [sl.x, sl.y, sl.w, sl.h], 'cf-printslot');
    // over the box, top left, what it is and where it came from; top right, once lifted, the bureau's stamp
    e.head = this.spot(e, [sl.x + 0.015, sl.y + 0.02, sl.w * 0.64, sl.h * 0.3], 'cf-type phead');
    e.stamp = this.spot(e, [sl.x + sl.w * 0.66, sl.y + 0.03, sl.w * 0.32, sl.h * 0.28], 'cf-pstamp');
    const top = this.spot(e, SPOTS.printcard.top, 'cf-type cells');
    top.innerHTML = ['L. fore paw', 'R. fore paw', 'L. hind paw', 'R. hind paw', 'Whiskers'].map((s, j) => `<span>${typed(s, 70 + j)}</span>`).join('');
    e.under = this.spot(e, SPOTS.printcard.bottom, 'cf-type cells low');
  }
  // a report's state: the exhibit (found or not, dusted or not), YOYO's frame (seen or not)
  paintPage(i) {
    const f = FLOORS[i], pg = this.pages[i], got = this.found(f.ex), lifted = this.state.prints[f.ex], seen = this.state.seen[f.id];
    const bag = pg.items.find(e => e.it?.role === 'bag'), card = pg.items.find(e => e.it?.role === 'card'), photo = pg.items.find(e => e.it?.role === 'photo');
    if (got && !bag.win.firstChild) { const im = el('img', '', bag.win); im.src = `${A}obj/${f.img}.webp`; im.alt = ''; }
    if (!got) bag.win.replaceChildren();
    bag.classList.toggle('miss', !got);
    bag.lines.innerHTML = got
      ? `<p>${typed(`Exhibit ${f.letter} — ${f.what}`, 80 + i)}</p><p>${typed(`Recovered ${f.floor} · ${f.clock}`, 84 + i)}</p><p>${typed(lifted ? 'Dusted. Print lifted.' : 'Not yet dusted.', 88 + i)}</p>`
      : `<p>${typed('Not recovered.', 90 + i)}</p><p class="hint">${esc(f.hint)}</p><button data-act="back">▶ Find it in the footage</button>`;
    card.head.innerHTML = `<p>${typed(`Latent print · No. ${f.no}`, 102 + i)}</p><p>${typed(lifted ? `From: ${f.what.toLowerCase()}` : 'Awaiting powder', 106 + i)}</p>`;
    card.stamp.innerHTML = lifted ? '<b>Feline</b>' : '';
    card.under.innerHTML = `<span>${typed(lifted ? 'Subject: Y.O.Y.O.' : 'No print lifted', 94 + i)}</span><span>${typed(`Exhibit ${f.letter}`, 98 + i)}</span><span>${typed(lifted ? 'Match ✓' : '—', 99 + i)}</span>`;
    if (lifted && !card.printEl.firstChild) this.liftedPrint(i).then(c => { c.className = 'print'; card.printEl.appendChild(c); });
    if (seen && !photo.slotEl.querySelector('canvas')) { photo.slotEl.replaceChildren(stillLoop(f)); this.grease(i, photo); }
    if (!seen) photo.slotEl.innerHTML = `<p class="cf-type">${typed('Not yet witnessed.', 101 + i)}</p><button data-act="witness">▶ Watch ${f.floor}</button>`;
  }
  // the print card for a report, made again from the same seed (fully revealed): the card is not stored, only that it exists
  async liftedPrint(i) {
    const f = FLOORS[i];
    const d = await new Dusting({ k: 1, item: null, print: f.print, dark: f.dark, seed: 5 + i }).init();
    d.cov.fill(2); d.compose();
    return d.lift().canvas;
  }
  // ⑤ Jojo's grease pencil on the photo: a loop round YOYO and a word; drawn as you watch the first time the report is
  // looked at, there already after that
  grease(i, photo) {
    const f = FLOORS[i], pad = 30, w = photo.w + pad * 2, h = photo.h + pad * 2;
    const s = photo.grease = new Surface(w, h, { k: 2, paper: '#ffffff', seed: 70 + i, tooth: 0.9 });
    const wax = el('canvas', 'cf-ov grease', photo); wax.width = s.out.width; wax.height = s.out.height;
    Object.assign(wax.style, { left: -pad + 'px', top: -pad + 'px', width: w + 'px', height: h + 'px' });
    const show = () => keyWhite(s.out, wax);
    const sl = photo.m.slot, [fx, fy, rx, ry] = MARKS[f.id];
    const sx = pad + sl.x * photo.w, sy = pad + sl.y * photo.h, sw = sl.w * photo.w, sh = sl.h * photo.h;
    const cx = sx + fx * sw, cy = sy + fy * sh, RX = rx * sw, RY = ry * sh;
    const strokes = [ring(cx, cy, RX, RY, { seed: 3 + i }), ...phrase(f.mark, { x: cx + RX * 0.2, y: cy + RY + 8, size: 30, a: -0.09, seed: 11 + i })]
      .map(p => ({ b: 'grease', c: '#c8202c', w: 0.6, p }));
    photo.drawMark = animate => {
      if (!animate) { s.draw(b => strokes.forEach(t => stroke(b, t))); show(); return Promise.resolve(); }
      const tl = timelapse(s, strokes, { ms: 1800 });
      return new Promise(done => { const tick = now => { const end = tl.step(now) || !this.active; show(); if (end) { tl.finish(); show(); done(); } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    };
    if (this.state.marks[f.id]) photo.drawMark(false);
  }
  async markIfNew(i) {
    const f = FLOORS[i], photo = this.pages[i].items.find(e => e.it?.role === 'photo');
    if (!photo.grease || this.state.marks[f.id]) return;
    this.state.marks[f.id] = true; this.save();
    await wait(700);
    this.foley?.play('squeak', { gain: 0.5 });
    await photo.drawMark(true);
  }
  // the pile: the report on top whole, the ones under it only their sheets, a little askew
  stack(anim = true) {
    const order = [this.top, ...FLOORS.map((_, i) => i).filter(i => i !== this.top)];
    order.forEach((i, depth) => {
      const pg = this.pages[i], r = mulberry32(i * 13 + 3);
      pg.style.zIndex = 10 - depth;
      pg.style.transition = anim ? 'transform .5s cubic-bezier(.3,1.2,.5,1)' : 'none';
      pg.style.transform = depth ? `translate(${(r() - 0.5) * 18}px, ${(r() - 0.5) * 12}px) rotate(${(r() - 0.5) * 2.6}deg)` : 'none';
      pg.classList.toggle('under', depth > 0);
    });
  }
  async toTop(i) {
    if (i === this.top) return;
    const pg = this.pages[i];
    this.foley?.play('page');
    pg.style.transition = 'transform .28s ease-in';
    pg.style.transform = 'translate(340px, -24px) rotate(5deg)';
    await wait(280);
    this.top = i;
    pg.style.zIndex = 11;
    this.stack(true);
    await wait(500);
  }

  // ── camera ──
  vsize() { return [this.layer.clientWidth || 1, this.layer.clientHeight || 1]; }
  fit([x, y, w, h], pad = 40, r = 0) {
    const [vw, vh] = this.vsize(), s = Math.min((vw - pad * 2) / w, (vh - pad * 2 - 40) / h);
    return { x: x + w / 2, y: y + h / 2 + 20 / s, s, r };
  }
  applyCam() {
    const [vw, vh] = this.vsize(), { x, y, s, r } = this.cam;
    this.board.style.transform = `translate(${vw / 2}px,${vh / 2}px) rotate(${r}deg) scale(${s}) translate(${-x}px,${-y}px)`;
  }
  tweenCam(to, ms = 850) {
    const from = { ...this.cam }, t0 = performance.now(), tok = this.camTok = {};
    this.board.style.willChange = 'transform';
    return new Promise(done => {
      const tick = now => {
        if (this.camTok !== tok) return done();
        const k = ease((now - t0) / ms);
        this.cam = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), r: lerp(from.r, to.r, k), s: Math.exp(lerp(Math.log(from.s), Math.log(to.s), k)) };
        this.applyCam();
        if (k < 1) requestAnimationFrame(tick); else { this.board.style.willChange = ''; done(); }
      };
      requestAnimationFrame(tick);
    });
  }
  // lean in on one thing (an object or a block of typing) on a report: its box, a little room round it
  focus(thing, dx = 0) {
    let r;
    if (thing.it) r = this.rectOf(thing.it, dx);
    else r = [dx + parseFloat(thing.style.left), parseFloat(thing.style.top), parseFloat(thing.style.width), thing.offsetHeight];
    const m = 40;
    this.detailRect = [r[0] - m, r[1] - m, r[2] + m * 2, r[3] + m * 2];
    return this.view('detail');
  }
  // board px and the case file's px, through the camera
  toScreen(x, y) {
    const { cam } = this, [vw, vh] = this.vsize(), a = cam.r * Math.PI / 180, dx = (x - cam.x) * cam.s, dy = (y - cam.y) * cam.s;
    return [vw / 2 + dx * Math.cos(a) - dy * Math.sin(a), vh / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  toBoard(sx, sy, cam = this.cam) {
    const [vw, vh] = this.vsize(), a = -cam.r * Math.PI / 180, dx = (sx - vw / 2) / cam.s, dy = (sy - vh / 2) / cam.s;
    return [cam.x + dx * Math.cos(a) - dy * Math.sin(a), cam.y + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  // the HUD's line: something said for the moment, or (none) back to what the view says
  hudSay(text) { this.hud.querySelector('.where').textContent = text ?? this.whereText; }
  rectOf(it, dx = 0) { const m = this.meta[it.o], h = it.w * m.h / m.w; return [dx + it.x - it.w / 2, it.y - h / 2, it.w, h]; }
  view(name) {
    this.where = name;
    if (name === 'sheet') this.markIfNew(this.top);
    const rect = { cover: [FOLD - 30, -30, FOLD + 60, H + 60], over: [-170, -190, W + 340, H + 380], sheet: [FOLD - 10, -16, FOLD + 66, H + 32], back: [-30, -30, W + 60, H + 60],
      map: this.rectOf(LEFT[0]), sketch: this.rectOf(LEFT.find(it => it.role === 'sketch')), dust: this.dustRect, detail: this.detailRect }[name];
    this.whereText = { cover: 'CASE No. 203 · CLICK TO OPEN', over: this.state.closed ? 'THE CASE FILE · CLOSED' : 'THE CASE FILE', map: 'THE ROUTE', sketch: 'THE SUSPECT', sheet: `${FLOORS[this.top].floor} · FIELD REPORT · CLICK ANYTHING TO LOOK CLOSER`, dust: `EXHIBIT ${FLOORS[this.top].letter} · DUST IT, THEN LIFT`, detail: 'CLOSE UP · CLICK TO STEP BACK', back: "YOYO'S SCRAPBOOK · CLICK ANYTHING TO LOOK CLOSER" }[name];
    this.hudSay();
    this.layer.dataset.view = name;
    this.eggs?.onView(name);
    // (the suspect's form lies turned on the flap: the camera turns with it, to read it straight)
    const turn = name === 'over' || name === 'cover' ? 0 : name === 'sketch' ? -this.sketchItem.it.r - 0.3 : -0.3;
    return this.tweenCam(this.fit(rect, 30, turn));
  }

  // ── in and out ──
  async show(floorId) {
    if (this.active || this.busy) return;
    this.busy = true;
    await this.build();
    FLOORS.forEach((_, i) => this.paintPage(i)); this.paintCover();
    this.layer.classList.add('on');
    this.foley?.play('click');
    this.active = true;
    const loops = () => { if (!this.active) return; const now = performance.now(); this.layer.querySelectorAll('.cf-photoslot canvas').forEach(c => c.tick?.(now)); requestAnimationFrame(loops); };
    requestAnimationFrame(loops);
    this.lamp.classList.remove('lit'); void this.lamp.offsetWidth; this.lamp.classList.add('lit');
    // the camera starts a little further out than where it settles, as if leaning in over the desk
    const first = this.turned ? 'back' : floorId && this.isOpen ? 'sheet' : this.isOpen ? 'over' : 'cover';
    if (floorId && this.isOpen) await this.toTop(FLOORS.findIndex(f => f.id === floorId));
    this.pendingFloor = floorId && !this.isOpen ? floorId : null;
    const settle = this.fit({ cover: [FOLD - 30, -30, FOLD + 60, H + 60], over: [-170, -190, W + 340, H + 380], sheet: [FOLD - 10, -16, FOLD + 66, H + 32], back: [-30, -30, W + 60, H + 60] }[first], 30);
    this.cam = { ...settle, s: settle.s * 0.84 }; this.applyCam();
    this.busy = false;
    if (this.turned) this.finale.scrap.play();
    await this.view(first);
    if (this.isOpen) this.finale.maybeClose();
  }
  close() {
    if (!this.active) return;
    this.endDust();
    this.eggs?.reset();
    this.layer.classList.remove('on');
    this.active = false;
    this.onClose?.();
  }
  // untie the string, swing the cover open on the fold
  async openFolder() {
    if (this.isOpen || this.busy) return;
    this.busy = true;
    this.foley?.play('swish', { gain: 0.6 });                        // the strap slips off the edge
    const band = this.front.querySelector('.cf-band');
    await band.animate([{ transform: 'none' }, { transform: 'translateX(60px) rotate(3deg)', offset: 0.45 }, { transform: 'translateX(170px) rotate(9deg)', opacity: 0 }],
      { duration: 560, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' }).finished;
    this.drawMap();
    this.copyLeft();
    this.foley?.play('page');
    this.view('over');
    this.ground.classList.add('open');
    const o = { duration: 1300, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' };
    await this.flap.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], o).finished;
    this.folder.classList.add('open');                                 // the inside's left half, now under the cover's back
    this.left.classList.add('on');
    requestAnimationFrame(() => { this.flap.style.display = 'none'; });           // (hidden is not enough: the copy on its back is set visible)
    this.isOpen = true;
    this.busy = false;
    this.redrawSketch().then(() => this.finale.maybeClose());
    if (this.pendingFloor) { const id = this.pendingFloor; this.pendingFloor = null; await this.toTop(FLOORS.findIndex(f => f.id === id)); this.view('sheet'); }
  }
  // the back of the turning cover shows the left side (canvases copied by hand)
  copyLeft() {
    const copy = this.left.cloneNode(true), from = this.left.querySelectorAll('canvas'), to = copy.querySelectorAll('canvas');
    to.forEach((k, i) => k.getContext('2d').drawImage(from[i], 0, 0));
    copy.classList.add('on');
    this.back.querySelector('.cf-left')?.remove();
    this.back.appendChild(copy);
  }

  // ② the sketch: one layer per lifted print (head and fur to begin with, then the bow, the bell, the lips, the eyes),
  // drawn as you watch the first time, simply there after that
  async redrawSketch() {
    const n = FLOORS.filter(f => this.state.prints[f.ex]).length, S = this.reveal;
    await this.sketchImg.decode().catch(() => {});
    this.fields[4].textContent = ['', 'A bow', 'A bow, a bell', 'A bow, a bell, lipstick', 'Bow, bell, lipstick, 200%'][n];
    this.fields[5].textContent = n === 4 ? 'Everywhere.' : '';
    const layers = this.sketchL ||= sketchLayers(S.w, S.h);
    if (this.sketchDrawn == null) { this.sketchDrawn = this.sketchSettled = Math.min(this.state.sketch || 0, n + 1); this.composeSketch(); }
    if (n + 1 > this.sketchDrawn) {
      const from = this.sketchDrawn, strokes = layers.slice(from, n + 1).flatMap(L => L.strokes);
      this.sketchDrawn = this.state.sketch = n + 1; this.save();
      if (from > 0) await this.view('sketch');
      const tl = timelapse(S, strokes, { ms: from === 0 ? 4200 : 3600 });
      await new Promise(ok => { const tick = now => { const end = tl.step(now) || !this.active; this.composeSketch(); if (end) { tl.finish(); ok(); } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
      this.sketchSettled = n + 1; this.composeSketch();
    }
  }

  // ── ① dusting: the exhibit on a card over the report, the reader works the brush, then lifts ──
  async dust(i) {
    const f = FLOORS[i];
    if (!this.found(f.ex) || this.dusting) return;
    const rect = [FOLD + 40, 190, 780, 546];
    this.dustRect = [rect[0], rect[1], rect[2], rect[3] + 80];         // the card and the bar under it
    // the desk goes dark but for a pool of light on the exhibit (the card's edges fade out into the dark): on the desk's
    // layer, over everything lying around
    (this.dim ||= el('div', 'cf-dim', this.board)).classList.add('on');
    place(this.dim, DESK_RECT);
    const wrap = this.dustEl = el('div', 'cf-dust', this.board);
    place(wrap, rect, 0.6);
    const im = new Image(); im.src = `${A}obj/${f.img}.webp`; await im.decode().catch(() => {});
    const k = Math.min(480 / im.naturalWidth, 316 / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k;
    const d = this.dusting = await new Dusting({ w: 800, h: 560, k: 2, item: im, itemRect: [410 - iw / 2, 262 - ih / 2, iw, ih], print: f.print, dark: f.dark, seed: 5 + i, letter: f.letter }).init();
    wrap.appendChild(d.out);
    const brush = el('img', 'cf-brush', wrap); brush.src = A + 'obj/brush.webp'; brush.alt = '';
    const bar = el('div', 'cf-dustbar', wrap, `<span>Brush the card. Gently.</span><button class="lift" data-act="lift" disabled>LIFT ▸</button>`);
    this.foley?.play('swish');
    await this.view('dust');
    let last = null, hover = null;
    // card units under the pointer (the card is turned a little and scaled by the camera: its bounding box is close enough)
    const at = e => { const r = d.out.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 800, y: (e.clientY - r.top) / r.height * 560, t: performance.now() }; };
    wrap.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; wrap.setPointerCapture(e.pointerId); last = at(e); e.stopPropagation(); });
    wrap.addEventListener('pointermove', e => {
      const { x, y, t: now } = at(e);
      Object.assign(brush.style, { left: x + 'px', top: y + 'px', transform: `rotate(${hover ? clamp((x - hover.x) * 1.5, -24, 24) : 0}deg)` });
      hover = { x, y };
      if (e.buttons & 1) {
        if (last) (this.pend ||= []).push([last.x, last.y, x, y, Math.hypot(x - last.x, y - last.y) / Math.max(1, now - last.t) * 1000]);
        last = { x, y, t: now };
        if (!this.raf) this.raf = requestAnimationFrame(() => {
          this.raf = 0;
          for (const s of (this.pend || []).splice(0)) d.stroke(...s);
          const p = d.progress();
          bar.querySelector('span').textContent = p < 0.15 ? 'Brush the card. Gently.' : p < 0.7 ? `Something's coming up… ${Math.round(p * 100)}%` : 'A print. Lift it.';
          bar.querySelector('.lift').disabled = p < 0.7;
        });
      } else last = null;
    });
    wrap.addEventListener('pointerup', e => e.stopPropagation());
  }
  async lift() {
    const d = this.dusting, f = FLOORS[this.top];
    if (!d) return;
    this.foley?.play('swish', { gain: 0.8 });
    const tape = el('img', 'cf-tape', this.dustEl); tape.src = A + 'obj/tape_3.webp'; tape.alt = '';
    await tape.animate([{ transform: 'translateX(-130%) rotate(-3deg)' }, { transform: 'translateX(0) rotate(-3deg)' }], { duration: 650, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).finished;
    await wait(250);
    this.foley?.play('page', { gain: 0.6, rate: 1.6 });
    await tape.animate([{ transform: 'translateX(0) rotate(-3deg)' }, { transform: 'translate(10%, -160%) rotate(-12deg)' }], { duration: 600, easing: 'ease-in', fill: 'forwards' }).finished;
    d.lift();
    this.state.prints[f.ex] = true; this.save();
    this.endDust();
    this.paintPage(this.top);
    this.foley?.play('press');
    this.toast?.('Latent print', `Exhibit ${f.letter}: match, Y.O.Y.O.`, `${FLOORS.filter(x => this.state.prints[x.ex]).length} / 4`);
    await this.view('sheet');
    await wait(700);
    await this.redrawSketch();
    await this.finale.maybeClose();
  }
  endDust() { this.dustEl?.remove(); this.dustEl = null; this.dusting = null; this.pend = []; this.dim?.classList.remove('on'); }

  // ── input ──
  bind() {
    // drag to slide over the desk, wheel to lean in on anything (as with the comic); a drag is not a click
    const L = this.layer;
    let drag = null;
    L.addEventListener('pointerdown', e => { if (this.dusting || e.button || this.eggs.scoping) return; drag = { x: e.clientX, y: e.clientY, moved: false }; });
    L.addEventListener('pointermove', e => {
      this.eggs.move(e);
      if (!drag || this.dusting) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; this.camTok = {}; L.classList.add('dragging'); }
      if (drag.moved) { const a = this.cam.r * Math.PI / 180, s = this.cam.s; this.cam.x -= (dx * Math.cos(a) + dy * Math.sin(a)) / s; this.cam.y -= (dy * Math.cos(a) - dx * Math.sin(a)) / s; drag.x = e.clientX; drag.y = e.clientY; this.applyCam(); }
    });
    addEventListener('pointerup', () => { if (drag?.moved) this.dragged = performance.now(); drag = null; L.classList.remove('dragging'); });
    L.addEventListener('wheel', e => {
      e.preventDefault();
      if (!this.active || this.busy || this.dusting || this.eggs.scoping) return;
      this.camTok = {};
      const r = L.getBoundingClientRect(), [vw, vh] = this.vsize(), mx = e.clientX - r.left - vw / 2, my = e.clientY - r.top - vh / 2;
      const s0 = this.cam.s, s1 = clamp(s0 * Math.exp(-e.deltaY * 0.0015), 0.25, 4);
      this.cam.x += mx / s0 - mx / s1; this.cam.y += my / s0 - my / s1; this.cam.s = s1;
      this.applyCam();
    }, { passive: false });
    L.addEventListener('click', e => {
      if (this.busy || performance.now() - (this.dragged || 0) < 250) return;
      const a = e.target.closest('[data-act]'), pg = e.target.closest('.cf-page'), i = pg ? +pg.dataset.i : this.top, act = a?.dataset.act;
      // the desk's things lie over the book: a click on one of them is theirs, whatever of the book is under it (but the
      // notes and tabs lie over them)
      if (a?.tagName !== 'BUTTON' && (!a || a.closest('.cf-folder, .cf-backside')) && !this.dusting && !this.eggs.scoping && !this.eggs.isDark && this.eggs.poke(e)) return;
      if (this.eggs.click(act)) return;
      if (this.finale.click(act, e)) return;
      if (!this.isOpen) { this.openFolder(); return; }
      if (this.dusting) { if (act === 'lift') this.lift(); return; }
      if (act === 'tab') { this.toTop(+a.dataset.i).then(() => this.view('sheet')); return; }
      if (act === 'pin') { this.toTop(+a.dataset.i).then(() => this.view('sheet')); return; }
      if (pg && this.where !== 'sheet' && this.where !== 'detail') { this.toTop(i).then(() => this.view('sheet')); return; }
      if (pg && i === this.top) {
        const f = FLOORS[i];
        if (act === 'read') { this.close(); this.readComic?.(f.id); return; }
        if (act === 'back') { this.close(); this.goFloor?.(f.id, f.back, true); return; }
        if (act === 'witness') { this.close(); this.goFloor?.(f.id, Math.max(0, f.seen - 3)); return; }
        if (act === 'dust') { this.dust(i); return; }
        // anything else on the report: lean in on it; a click when close in steps back to the whole report
        const thing = e.target.closest('.cf-it, .cf-type');
        if (this.where === 'detail') { this.view('sheet'); return; }
        if (thing) this.focus(thing, FOLD);
        return;
      }
      if (this.where === 'detail') { this.view(this.back || 'over'); return; }
      if (e.target.closest('.r-map')) { this.view('map'); return; }
      if (e.target.closest('.r-sketch')) { this.view('sketch'); return; }
      this.view('over');
    });
    addEventListener('resize', () => { if (this.active) this.view(this.where); });
  }
  key(e) {
    if (!this.active) return false;
    e.preventDefault();
    if (e.repeat) return true;
    if (e.key === 'f' || e.key === 'F') { this.close(); return true; }
    if (this.finale.running || this.eggs.key(e)) return true;
    if (this.turned) {                                                   // the back: Esc steps back, then turns it over again
      if (this.finale.scrap.busy) return true;
      if ((e.key === 'Escape' || e.key === 'ArrowLeft') && this.where === 'detail') this.view('back');
      else if (e.key === 'Escape' || e.key === 'ArrowLeft' || (e.key >= '1' && e.key <= '4')) this.finale.scrap.turn();
      return true;
    }
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      if (this.dusting) { this.endDust(); this.view('sheet'); }
      else if (this.where === 'detail') this.view('sheet');
      else if (this.isOpen && this.where !== 'over') this.view('over');
      else this.close();
    } else if (e.key >= '1' && e.key <= '4' && this.isOpen && !this.dusting) { this.toTop(+e.key - 1).then(() => this.view('sheet')); }
    else if ((e.key === 'Enter' || e.code === 'Space') && !this.isOpen) this.openFolder();
    return true;
  }
}

// an overlay multiplied onto an object, cut to the object's own outline: inside the object's box the overlay has only the
// object under it, so wherever the picture is transparent (torn edges, rounded corners) its white paper would show
function paperShaped(c, e) {
  const m = `url("${e.img.src}")`;
  Object.assign(c.style, { webkitMaskImage: m, maskImage: m, webkitMaskSize: '100% 100%', maskSize: '100% 100%' });
}
// a mark drawn on white made into a mark on nothing: alpha from how far each pixel is from white, colour un-mixed from it
export function keyWhite(src, dst) {
  const g = dst.getContext('2d'), sg = src.getContext('2d'), im = sg.getImageData(0, 0, src.width, src.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = 255 - Math.min(d[i], d[i + 1], d[i + 2]);
    if (a < 3) { d[i + 3] = 0; continue; }
    const k = 255 / a;
    d[i] = 255 - (255 - d[i]) * k; d[i + 1] = 255 - (255 - d[i + 1]) * k; d[i + 2] = 255 - (255 - d[i + 2]) * k; d[i + 3] = a;
  }
  g.clearRect(0, 0, dst.width, dst.height); g.putImageData(im, 0, 0);
}

// YOYO's moment from the footage: a two-second loop (tools/yoyo_stills.py: 24 frames of 180×118 art px side by side),
// shown in hard art pixels; `tick(now)` advances it
const STILL = { w: 180, h: 118, frames: 24, fps: 12 };
function stillLoop(f) {
  const c = el('canvas'); c.width = STILL.w; c.height = STILL.h;
  const g = c.getContext('2d'), im = new Image();
  let shown = -1;
  im.src = `${A}still_${f.id}.webp`;
  c.tick = now => {
    const i = Math.floor(now / 1000 * STILL.fps) % STILL.frames;
    if (i === shown || !im.complete || !im.naturalWidth) return;
    shown = i; g.drawImage(im, i * STILL.w, 0, STILL.w, STILL.h, 0, 0, STILL.w, STILL.h);
  };
  return c;
}
// ② the composite's layers in drawing order (head and fur, then bow, bell, lips, eyes), in the drawing box's units: each
// a set of polygons (to settle it fully once drawn) and the pencil strokes that bring it out: cross-hatching clipped to
// its own shapes and kept off the features still to come
function sketchLayers(w, h) {
  const R = SPOTS.sketch, k = Math.min(w, h), ox = (w - k) / 2, oy = (h - k) / 2;
  const shape = r => (r.length === 4 && typeof r[0] === 'number'
    ? Array.from({ length: 28 }, (_, i) => { const t = i / 28 * Math.PI * 2; return [ox + (r[0] + Math.cos(t) * r[2]) * k, oy + (r[1] + Math.sin(t) * r[3]) * k]; })
    : r.map(([x, y]) => [ox + x * k, oy + y * k]));
  const inside = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const feats = ['bow', 'bell', 'lips', 'eyes'].map(n => R[n].map(shape));
  const all = [[0, 0], [w, 0], [w, h], [0, h]];
  const hatch = (polys, avoid, seed) => {
    const r = mulberry32(seed), out = [];
    for (const [ang, gap] of [[-0.6, 4.2], [0.95, 5.5]]) {
      const ca = Math.cos(ang), sa = Math.sin(ang), L = Math.hypot(w, h);
      for (let d = -L; d < L; d += gap) {
        let run = null;
        for (let u = -L; u <= L; u += 3) {
          const x = w / 2 + ca * u - sa * d, y = h / 2 + sa * u + ca * d;
          const on = x >= 0 && y >= 0 && x <= w && y <= h && polys.some(p => inside(p, x, y)) && !avoid.some(p => inside(p, x, y));
          if (on && !run) run = [x, y];
          if ((!on || u + 3 > L) && run) { if (Math.hypot(x - run[0], y - run[1]) > 6) out.push({ b: 'soft', c: '#000000', w: 2.6, p: [[run[0] + (r() - 0.5) * 2, run[1] + (r() - 0.5) * 2], [x + (r() - 0.5) * 2, y + (r() - 0.5) * 2]] }); run = null; }
        }
      }
    }
    return out;
  };
  const base = { polys: [all], strokes: hatch([all], feats.flat(), 3) };
  return [base, ...feats.map((polys, i) => ({ polys, strokes: hatch(polys, feats.slice(i + 1).flat(), 10 + i) }))];
}

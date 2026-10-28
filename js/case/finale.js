// Case closed (boards/casefile.md §5, §7). Once the fourth print is lifted and the composite is whole: Jojo rings her in
// grease pencil and writes IT WAS YOYO. OBVIOUSLY. across the form; the drawing winks back (V1, and again whenever the
// pointer comes onto it); CASE CLOSED goes down on the 2F report. Then YOYO's own paw comes in from the top, takes the
// pink stiletto's envelope, comes back to sign where it was (200% ♡ and a paw print, in lipstick) and leaves a note
// taped at the book's corner: TURN OVER. The back is her scrapbook (js/case/scrapbook.js).
import { Surface, timelapse, stroke } from '../brush.js';
import { phrase, ring } from './letters.js';
import { pawShape } from './dust.js';
import { el, keyWhite, wait, ease, FLOORS } from '../casefile.js';
import { FOLD, FINALE } from './layout.js';
import { Scrapbook } from './scrapbook.js';
import { clamp, lerp, mulberry32 } from '../engine.js';

const A = 'assets/casefile/';
const LIP = '#c4142c';
function tween(ms, fn) {
  const t0 = performance.now();
  return new Promise(done => { const tick = now => { const u = clamp((now - t0) / ms); fn(u); if (u < 1) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
}

// a filled shape in a waxy medium: close scan lines across it (turned by `a`), and its outline
export function fillStrokes(poly, { gap = 3, a = 0.6, b = 'lipstick', c = LIP, w = 0.38, seed = 1 } = {}) {
  const r = mulberry32(seed), ca = Math.cos(a), sa = Math.sin(a);
  const rot = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]), ys = rot.map(p => p[1]), out = [];
  for (let y = Math.min(...ys) + gap / 2; y < Math.max(...ys); y += gap) {
    const xs = [];
    for (let i = 0, j = rot.length - 1; i < rot.length; j = i++) {
      const [x1, y1] = rot[i], [x2, y2] = rot[j];
      if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const yy = y + (r() - 0.5) * gap * 0.4, back = ([x, v]) => [x * ca - v * sa, x * sa + v * ca];
      out.push({ b, c, w, p: [back([xs[k] + 0.6, yy]), back([xs[k + 1] - 0.6, yy + (r() - 0.5)])] });
    }
  }
  out.push({ b, c, w: w * 1.2, p: [...poly, poly[0]] });
  return out;
}

export class Finale {
  constructor(cf) { this.cf = cf; }
  build() {
    const cf = this.cf, sk = cf.sketchItem;
    // the composite's wink: the clip lies over the drawing, seen only while it plays (it starts and ends on the drawing)
    this.v1 = el('video', 'cf-v1', sk.querySelector('.cf-sketchbox'));
    Object.assign(this.v1, { muted: true, playsInline: true, preload: 'auto', src: A + 'v1.mp4' });
    sk.addEventListener('pointerenter', () => { if (cf.state.closed && !this.running) this.wink(); });
    // CASE CLOSED on the 2F report and on the cover
    const S = FINALE.stamp, pg = cf.pages[3];
    this.stampEl = el('div', 'cf-stamp', pg, '<b>CASE CLOSED</b><small>Jolly P.D. · 2nd Precinct · 00:13</small>');
    Object.assign(this.stampEl.style, { left: S.x + 'px', top: S.y + 'px', '--r': S.r + 'deg' });
    this.coverStamp = el('div', 'cf-stamp cover', cf.front, '<b>CASE CLOSED</b><small>Jolly P.D. · 2nd Precinct</small>');
    // where the stiletto's envelope was: her lipstick
    const [lx, ly, lw, lh] = FINALE.lips.rect;
    this.lips = new Surface(lw, lh, { k: 2, paper: '#ffffff', seed: 77, tooth: 0.7 });
    this.lipsEl = el('canvas', 'cf-ov grease lips', pg); this.lipsEl.width = this.lips.out.width; this.lipsEl.height = this.lips.out.height;
    Object.assign(this.lipsEl.style, { left: lx + 'px', top: ly + 'px', width: lw + 'px', height: lh + 'px' });
    this.bag = pg.items.find(e => e.it?.role === 'bag');
    // her note taped at the book's corner, half over the desk: on the desk's layer, over anything lying there
    this.corner = el('button', 'cf-corner', cf.board, '<span>turn over ↻</span>');
    this.corner.dataset.act = 'turn';
    this.scrap = new Scrapbook(cf);
    this.paint();
  }
  paint() {
    const closed = !!this.cf.state.closed && !this.running;
    this.stampEl.classList.toggle('on', closed);
    this.coverStamp.classList.toggle('on', closed);
    this.corner.classList.toggle('on', closed);
    this.bag.classList.toggle('taken', closed);
    if (closed && !this.signed) { this.verdict(false); this.sign(false); }
  }
  all() { return FLOORS.every(f => this.cf.state.prints[f.ex]); }
  maybeClose() { return !this.cf.state.closed && this.all() && !this.running ? this.close() : Promise.resolve(); }
  click(act, e) {
    if (act === 'turn' || this.cf.turned) { this.scrap.click(act, e); return true; }
    return false;
  }

  async close() {
    const cf = this.cf;
    this.running = true; cf.busy = true;
    cf.state.closed = true; cf.save();
    try {
      cf.hudSay('THE SUSPECT');
      await cf.view('sketch');
      await wait(300);
      cf.foley?.play('squeak', { gain: 0.5 });
      await this.verdict(true);
      await wait(400);
      await this.wink();
      await wait(300);
      await cf.view('over');
      await cf.toTop(3);
      await cf.view('sheet');
      await wait(250);
      await this.stamp();
      await wait(1100);
      await this.paw();
      await cf.view('sheet');
    } finally {
      cf.busy = false; this.running = false;
      this.paint();
      cf.hudSay();
    }
  }

  // Jojo's verdict, grease pencil over the form: a loop round the drawing, two lines under it, the second underlined
  verdict(animate) {
    const cf = this.cf, e = cf.sketchItem, pad = 30, w = e.w + pad * 2, h = e.h + pad * 2;
    if (!this.vs) {
      this.vs = new Surface(w, h, { k: 2, paper: '#ffffff', seed: 91, tooth: 0.9 });
      this.vWax = el('canvas', 'cf-ov grease', e); this.vWax.width = this.vs.out.width; this.vWax.height = this.vs.out.height;
      Object.assign(this.vWax.style, { left: -pad + 'px', top: -pad + 'px', width: w + 'px', height: h + 'px' });
    }
    const s = this.vs, sl = e.m.slot, show = () => keyWhite(s.out, this.vWax);
    const cx = pad + (sl.x + sl.w / 2) * e.w, cy = pad + (sl.y + sl.h / 2) * e.h;
    const y1 = pad + 0.695 * e.h, y2 = pad + 0.8 * e.h;
    const strokes = [ring(cx, cy, sl.w * e.w * 0.56, sl.h * e.h * 0.55, { seed: 9 }),
      ...phrase('IT WAS YOYO.', { x: pad + 0.08 * e.w, y: y1, size: 30, a: -0.08, seed: 21 }),
      ...phrase('OBVIOUSLY.', { x: pad + 0.18 * e.w, y: y2, size: 34, a: -0.08, seed: 22 }),
      [[pad + 0.17 * e.w, y2 + 46], [pad + 0.5 * e.w, y2 + 30], [pad + 0.86 * e.w, y2 + 12]]]
      .map(p => ({ b: 'grease', c: '#c8202c', w: 0.7, p }));
    if (!animate) { s.draw(b => strokes.forEach(t => stroke(b, t))); show(); s.release(); return Promise.resolve(); }
    const tl = timelapse(s, strokes, { ms: 3000 });
    return new Promise(done => { const tick = now => { const end = tl.step(now); show(); if (end) { tl.finish(); show(); s.release(); done(); } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  }
  // V1: one wink, then back to the drawing
  wink() {
    const v = this.v1;
    if (this.winking || v.readyState < 2) return Promise.resolve();
    this.winking = true;
    v.currentTime = 0; v.classList.add('on');
    return new Promise(done => {
      const end = () => { if (!this.winking) return; this.winking = false; v.classList.remove('on'); done(); };
      v.onended = end; setTimeout(end, 6500);
      v.play().catch(end);
    });
  }
  async stamp() {
    const cf = this.cf, s = this.stampEl;
    s.classList.add('on');
    s.animate([{ transform: 'translate(-50%, -50%) rotate(var(--r)) scale(1.8)', opacity: 0 }, { transform: 'translate(-50%, -50%) rotate(var(--r)) scale(.97)', opacity: 1, offset: 0.8 },
      { transform: 'translate(-50%, -50%) rotate(var(--r)) scale(1)', opacity: 1 }], { duration: 240, easing: 'ease-in' });
    await wait(190);
    cf.foley?.play('stamp');
    cf.layer.animate([{ transform: 'none' }, { transform: 'translate(-7px, 5px)' }, { transform: 'translate(6px, -4px)' }, { transform: 'translate(-3px, 2px)' }, { transform: 'none' }], { duration: 280 });
    this.coverStamp.classList.add('on');
  }

  // ── YOYO's paw ──
  // her lipstick where the envelope was: 200% ♡, and the print of the paw that took it
  lipStrokes() {
    const L = FINALE.lips, [ox, oy] = L.rect, [tx, ty, size, a] = L.text, [px, py, s, pa] = L.print, P = pawShape();
    const place = poly => poly.map(([x, y]) => [px - ox + (x * Math.cos(pa) - y * Math.sin(pa)) * s, py - oy + (x * Math.sin(pa) + y * Math.cos(pa)) * s]);
    return {
      text: phrase('200% ♡', { x: tx - ox, y: ty - oy, size, a, seed: 77 }).map(p => ({ b: 'lipstick', c: LIP, w: 0.6, p })),
      print: [P.heart, ...P.toes].map(place).flatMap((poly, i) => fillStrokes(poly, { gap: 3.2, seed: 30 + i })),
    };
  }
  sign(animate) {
    const s = this.lips, show = () => keyWhite(s.out, this.lipsEl), { text, print } = this.lipStrokes();
    this.signed = true;
    if (!animate) { s.draw(b => [...text, ...print].forEach(t => stroke(b, t))); show(); s.release(); return; }
    return { s, show, text, print };
  }
  async paw() {
    const cf = this.cf, bag = this.bag, F = FINALE, m = cf.meta.paw, pw = F.paw.w, ph = pw * m.h / m.w, [tx, ty] = F.paw.toe;
    cf.hudSay('…');
    const [lx, ly, lw, lh] = F.lips.rect;
    cf.detailRect = [FOLD + lx - 20, ly - 30, lw + 80, lh + 60];
    await cf.view('detail');
    const paw = this.pawEl ||= el('img', 'cf-paw', cf.board);
    paw.src = A + 'obj/paw.webp'; paw.alt = '';
    Object.assign(paw.style, { width: pw + 'px', height: ph + 'px', transformOrigin: `${tx * 100}% ${ty * 100}%` });
    // where the toe is (board px), a little turn
    const at = (x, y, r = 0, sc = 1) => { paw.style.transform = `translate(${x - tx * pw}px, ${y - ty * ph}px) rotate(${r}deg) scale(${sc})`; };
    const top = cf.toBoard(cf.vsize()[0] / 2, 0)[1] - ph * (1 - ty) - 60;      // above the frame, all of it
    const grab = [FOLD + bag.it.x + 10, bag.it.y - bag.h * 0.22];
    paw.classList.add('on');
    // in from the top, onto the envelope
    await tween(720, u => at(grab[0] + 40 * (1 - u), lerp(top, grab[1], ease(u)), 9 * (1 - u)));
    cf.foley?.play('squeak', { gain: 0.35, rate: 1.7 });
    await tween(260, u => at(grab[0], grab[1] + 6 * Math.sin(u * Math.PI), 0, 1 - 0.03 * Math.sin(u * Math.PI)));
    await wait(200);
    // up and away with it
    cf.foley?.play('swish', { gain: 0.9 });
    const r0 = bag.it.r || 0;
    await tween(900, u => { const k = u * u * u, dy = -k * 1300; at(grab[0], grab[1] + dy, -5 * k); bag.style.transform = `translate(${12 * k}px, ${dy}px) rotate(${r0 + 12 * k}deg)`; });
    bag.classList.add('taken'); bag.style.transform = `rotate(${r0}deg)`;
    await wait(700);
    // back, to sign for it: the toe writes 200% ♡ in lipstick, then the whole paw is pressed down beside it
    const { s, show, text, print } = this.sign(true), toB = ([x, y]) => [FOLD + lx + x, ly + y];
    const first = toB(text[0].p[0]);
    await tween(560, u => at(first[0], lerp(top, first[1], ease(u)), 6 * (1 - u)));
    const tl = timelapse(s, text, { ms: 1700 });
    let cur = first;
    await new Promise(done => {
      const tick = now => {
        const end = tl.step(now); show();
        const goal = tl.pos ? toB(tl.pos) : cur; cur = [lerp(cur[0], goal[0], 0.35), lerp(cur[1], goal[1], 0.35)]; at(cur[0], cur[1], 3 * Math.sin(now / 90));
        if (end) { tl.finish(); show(); done(); } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const [px, py] = F.lips.print, pad = [FOLD + px, py + 40];
    await tween(380, u => at(lerp(cur[0], pad[0], ease(u)), lerp(cur[1], pad[1], ease(u)), 0));
    await tween(160, u => at(pad[0], pad[1] + 8 * u, 0, 1 - 0.04 * u));
    s.draw(b => print.forEach(t => stroke(b, t))); show(); s.release();
    cf.foley?.play('thud', { gain: 0.35, rate: 1.4 });
    await wait(240);
    cf.foley?.play('purr', { gain: 0.8 });
    await tween(650, u => at(pad[0] + 30 * u, lerp(pad[1] + 8, top, u * u), -6 * u));
    paw.classList.remove('on');
    await wait(500);
  }
}

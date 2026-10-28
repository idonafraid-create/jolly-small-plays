// The back of the book (boards/casefile.md §8), once the case is closed and YOYO has left her note: TURN OVER. Turned over,
// the outside of both covers lies there: on the right the front cover, stamped CASE CLOSED; on the left the back cover,
// where she has taped her scrapbook: a snap from where she hid on each floor (frames of the footage), the big one in
// the middle that moves (V2: Jojo in the spotlight, seen from between the coats at the coat check, through the press
// like the comics), a matchbook, a ticket, a kiss, lipstick hearts, notes and her signature.
import { Surface, stroke } from '../brush.js';
import { phrase } from './letters.js';
import { Print } from '../print.js';
import { el, place, keyWhite } from '../casefile.js';
import { W, H, FOLD, SCRAP, SCRAP_INK, SPOTS, onItem } from './layout.js';

const A = 'assets/casefile/';
const LIP = '#c4142c';
const P3 = 'perspective(6000px) ';

export class Scrapbook {
  constructor(cf) { this.cf = cf; }
  build() {
    const cf = this.cf, s = this.side = el('div', 'cf-backside', cf.board);
    place(s, [0, 0, W, H]);
    s.style.display = 'none';
    const back = this.back = el('div', 'cf-bk', s);
    place(back, [0, 0, FOLD, H]);
    // the back cover: the front's picture mirrored with its spine cut off (the front's own spine, beside it, is the book's
    // one), as tall as the front, the board stretched a touch to fill the half and tuck under that spine
    const m = cf.meta.cover_leather, k = Math.max(FOLD / m.w, H / m.h), clip = el('div', 'hide', back), hide = el('img', 'leather', clip);
    place(clip, [0, 0, FOLD + 10, H]);
    hide.src = A + 'obj/cover_leather.webp'; hide.alt = '';
    Object.assign(hide.style, { width: (FOLD + 10) / (1 - SPOTS.cover.spine) + 'px', height: m.h * k + 'px', top: (H - m.h * k) / 2 + 'px' });
    this.items = SCRAP.map(it => cf.item(it, back));
    for (const e of this.items) {
      const sl = e.m.slot;
      if (e.it.role === 'snap') {
        const box = cf.spot(e, [sl.x, sl.y, sl.w, sl.h], 'cf-photoslot snap'), im = el('img', '', box);
        im.src = `${A}snap_${e.it.snap}.webp`; im.alt = ''; im.draggable = false;
      }
      if (e.it.role === 'v2') {
        const box = cf.spot(e, [sl.x, sl.y, sl.w, sl.h], 'cf-photoslot moving');
        this.cv = el('canvas', '', box);
        this.cv.width = Math.round(sl.w * e.w * 2); this.cv.height = Math.round(sl.h * e.h * 2);
        this.vid = el('video', '', null);
        Object.assign(this.vid, { muted: true, loop: true, playsInline: true, preload: 'auto', src: A + 'v2.mp4' });
        this.still = new Image(); this.still.src = A + 'scrap_sax.webp';
        this.still.decode().then(() => this.print(this.still)).catch(() => {});
      }
    }
    cf.item({ o: 'kiss', x: 588, y: 714, w: 104, r: 14, z: 6, sh: 0 }, back).classList.add('cf-kiss');
    this.ink();
    // her note to turn it back by, at this side's corner
    const c = el('button', 'cf-corner on bk', s, '<span>turn back ↺</span>');
    c.dataset.act = 'turn';
  }
  // her lipstick over the lot: a note on each snap, hearts, her name on the big one
  ink() {
    const cf = this.cf, surf = new Surface(FOLD, H, { k: 1.5, paper: '#ffffff', seed: 33, tooth: 0.6 }), strokes = [];
    const lip = (w, list) => list.forEach(p => strokes.push({ b: 'lipstick', c: LIP, w, p }));
    for (const e of this.items) {
      if (!e.it.note) continue;
      const [x, y] = onItem(e.it, e.m, 0.5, 0.86), size = 17, wd = e.it.note.length * size * 0.86;
      lip(0.32, phrase(e.it.note, { x: x - wd / 2, y: y - size / 2, size, a: (e.it.r || 0) * Math.PI / 180 - 0.05, seed: e.it.x }));
    }
    const [sx, sy, ss, sa] = SCRAP_INK.sig;
    lip(0.55, phrase('YOYO 200%', { x: sx, y: sy, size: ss, a: sa, seed: 200 }));
    SCRAP_INK.hearts.forEach(([x, y, size], i) => lip(size > 22 ? 0.5 : 0.38, phrase('♡', { x, y, size, a: (i % 2 ? 0.3 : -0.25), seed: 300 + i })));
    surf.draw(b => strokes.forEach(t => stroke(b, t)));
    const c = el('canvas', 'cf-ov grease scrapink', this.back); c.width = surf.out.width; c.height = surf.out.height;
    keyWhite(surf.out, c);
    surf.release();
  }
  // the front cover beside it, as it is now (stamped)
  front() {
    this.side.querySelector('.cf-fc')?.remove();
    const fc = this.cf.front.cloneNode(true);
    fc.querySelector('.cf-band')?.remove();
    fc.className = 'cf-fc';
    place(fc, [FOLD, 0, FOLD, H]);
    this.side.insertBefore(fc, this.back.nextSibling);
  }
  // V2 through the press: each new frame of the clip, printed into the photo
  print(src) {
    this.press ||= new Print();
    this.press.into(this.cv, src, { cell: 4.6, misreg: 1.1, inks: { paper: '#f5efe0' } });
  }
  play() {
    if (!this.vid) return;
    this.vid.play().catch(() => {});
    let shown = -1;
    const tick = () => {
      if (!this.cf.turned || !this.cf.active) { this.vid.pause(); this.loop = 0; return; }
      const f = Math.floor(this.vid.currentTime * 24);
      if (this.vid.readyState >= 2 && f !== shown) { shown = f; this.print(this.vid); }
      this.loop = requestAnimationFrame(tick);
    };
    if (!this.loop) this.loop = requestAnimationFrame(tick);
  }

  click(act, e) {
    const cf = this.cf;
    if (act === 'turn') { this.turn(); return; }
    if (cf.where === 'detail') { cf.view('back'); return; }
    const thing = e.target.closest('.cf-backside .cf-it');
    if (thing) cf.focus(thing);
  }
  // the whole book turned over on its long axis: a quarter turn edge-on, the other side, a quarter turn back flat
  async turn() {
    const cf = this.cf;
    if (this.busy) return;
    this.busy = true;
    if (!this.side) this.build();
    const to = !cf.turned, out = to ? cf.folder : this.side, inn = to ? this.side : cf.folder;
    if (to) this.front();
    cf.eggs.reset();
    cf.foley?.play('swish', { gain: 0.9 });
    cf.turned = to;
    cf.layer.classList.toggle('turned', to);
    cf.view(to ? 'back' : 'over');
    // its shadow narrows to the edge with it and widens again (about the middle, as the book turns)
    cf.ground.animate([{ transform: 'none' }, { transform: 'scaleX(.06)', offset: 0.44 }, { transform: 'none' }], { duration: 970, easing: 'ease-in-out' });
    await out.animate([{ transform: P3 + 'rotateY(0deg)' }, { transform: P3 + `rotateY(${to ? 90 : -90}deg)` }], { duration: 430, easing: 'cubic-bezier(.55,0,.85,.55)' }).finished;
    out.style.display = 'none'; inn.style.display = '';
    cf.foley?.play('page', { gain: 0.8, rate: 0.8 });
    await inn.animate([{ transform: P3 + `rotateY(${to ? -90 : 90}deg)` }, { transform: P3 + 'rotateY(0deg)' }], { duration: 540, easing: 'cubic-bezier(.15,.45,.45,1)' }).finished;
    cf.foley?.play('thud', { gain: 0.45 });
    if (to) this.play();
    this.busy = false;
  }
}

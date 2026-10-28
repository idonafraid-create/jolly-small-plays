// The case file's easter eggs (boards/casefile.md §7), one a floor; YOYO's own comes at the end (js/case/finale.js).
// 1F · the lamp: pull its chain and the desk goes dark but for the neon through the blinds; a pair of pale blue eyes
//   blinks twice by the folder (No. 1's blackout eyes). Light again, and the 1F report is on top with a lipstick kiss.
// AL · the bell: the first time the alley report comes up a bell drops onto it, bounces three times along the paper's
//   top edge (a ting each), rolls over the fold and stops at 23:58 on the map. Click it and it goes back up.
// B1 · the tentacle: stay on the cellar report and one creeps up from under the clutter below the book onto the
//   lipstick's envelope and starts tugging it away; bring the pointer near and it shoots back.
// 2F · the opera glasses: take Jojo's off the desk and the view goes binocular, 2.5 times closer, following the pointer;
//   the reports' margins turn out to carry lipstick too small to read without them.
// And the rest of the desk answers a click: the hat hops, the cup rocks on its saucer, the phone rings (a purr on the line).
import { Surface, stroke } from '../brush.js';
import { phrase } from './letters.js';
import { el, place, shadow, keyWhite, wait, ease, FLOORS } from '../casefile.js';
import { DESK_RECT, LEFT, SPOTS, EGGS, onItem } from './layout.js';
import { clamp, lerp, mulberry32 } from '../engine.js';

const A = 'assets/casefile/';
const LIP = '#c3122e';
const ZOOM = 2.5;
const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
// what a desk thing does when clicked (its `poke` in layout.js): keyframes after its own turn, in its own px, and a sound
const later = (ms, fn) => setTimeout(fn, ms);
function jitter(n, px, deg = 0) {
  const r = mulberry32(n * 7 + px * 10);
  return [[0, ''], ...Array.from({ length: n }, (_, i) => [(i + 1) / (n + 1), `translate(${((r() - 0.5) * 2 * px).toFixed(1)}px, ${((r() - 0.5) * 2 * px).toFixed(1)}px) rotate(${((r() - 0.5) * 2 * deg).toFixed(1)}deg)`]), [1, '']];
}
const burst = (a, b) => Array.from({ length: 10 }, (_, i) => [a + (b - a) * i / 9, `rotate(${i % 2 ? 2.6 : -2.6}deg)`]);
const MOVES = {
  // lifted off the desk (toward the camera) and dropped, one small bounce
  hop: { ms: 560, k: [[0, ''], [0.3, 'translateY(-6px) scale(1.09) rotate(-5deg)'], [0.56, 'scale(.98)'], [0.74, 'translateY(-2px) scale(1.025) rotate(1.5deg)'], [1, '']],
    sound: f => { f?.play('swish', { gain: 0.25, rate: 1.4 }); later(300, () => f?.play('thud', { gain: 0.3, rate: 1.3 })); } },
  // nudged: rocks on its base and settles
  wobble: { ms: 760, k: [0, 6, -4.5, 3, -1.8, 0.8, 0].map((a, i, l) => [i / (l.length - 1), `rotate(${a}deg)`]), sound: f => f?.play('clink', { gain: 0.5, rate: 0.9 }) },
  // rolls a little across itself, back, and lies still
  roll: { ms: 700, k: [0, 9, -5, 2.5, 0].map((y, i, l) => [i / (l.length - 1), `translateY(${y}px) rotate(${y * 0.15}deg)`]), sound: f => f?.play('click', { gain: 0.25, rate: 0.7 }) },
  // given a turn: swings round and back
  spin: { ms: 760, k: [[0, ''], [0.35, 'rotate(20deg)'], [0.65, 'rotate(-6deg)'], [0.85, 'rotate(2deg)'], [1, '']], sound: f => f?.play('swish', { gain: 0.3 }) },
  // three keys struck, the machine judders, then the carriage bell
  clack: { ms: 520, k: jitter(9, 2.2), sound: f => { [0, 90, 170].forEach((t, i) => later(t, () => f?.play('press', { gain: 0.6, rate: 1 + i * 0.08 }))); later(360, () => f?.play('ting', { gain: 0.5, rate: 1.3 })); } },
  jingle: { ms: 480, k: jitter(8, 1.6, 7), sound: f => { f?.play('clink', { gain: 0.45, rate: 1.6 }); later(120, () => f?.play('clink', { gain: 0.35, rate: 1.9 })); } },
  // it rings, twice; nobody there, only a purr on the line
  ring: { ms: 1400, k: [[0, ''], ...burst(0.02, 0.36), [0.38, ''], [0.53, ''], ...burst(0.55, 0.89), [0.91, ''], [1, '']],
    sound: f => { [0, 770].forEach(t => [0, 60, 120, 180, 240, 300, 360, 420].forEach(d => later(t + d, () => f?.play('ting', { gain: 0.3, rate: 1.7 })))); later(1600, () => f?.play('purr', { gain: 0.35 })); } },
  rustle: { ms: 620, k: [[0, ''], [0.25, 'skewX(1.2deg) scale(1.012)'], [0.5, 'skewX(-.8deg)'], [0.75, 'skewX(.4deg) scale(1.004)'], [1, '']], sound: f => f?.play('page', { gain: 0.5 }) },
};
// a picture's coverage, coarsely, for telling a click on it from a click on its transparent box
function alphaMap(img) {
  if (!img.complete || !img.naturalWidth) return null;
  const w = 96, h = Math.max(1, Math.round(96 * img.naturalHeight / img.naturalWidth)), c = el('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  return { w, h, data: g.getImageData(0, 0, w, h).data };
}
// a function of u in 0–1 run over `ms`; resolves false if `alive()` stops being true on the way
function tween(ms, fn, alive = () => true) {
  const t0 = performance.now();
  return new Promise(done => {
    const tick = now => {
      if (!alive()) return done(false);
      const u = clamp((now - t0) / ms);
      fn(u, now);
      if (u < 1) requestAnimationFrame(tick); else done(true);
    };
    requestAnimationFrame(tick);
  });
}

export class Eggs {
  constructor(cf) {
    this.cf = cf;
    this.st = cf.state.eggs;
    this.ptr = null;                                   // the pointer, in the case file's px
  }
  build() {
    const cf = this.cf;
    // 1F: the dark (lighter, magenta, where the neon comes in through the blinds), the eyes, the kiss once it's there
    this.dark = el('div', 'cf-dark', cf.board, '<i class="shade"></i><i class="blinds"></i><i class="off"></i>');
    place(this.dark, DESK_RECT);
    this.eyes = el('div', 'cf-eyes', cf.board, '<i></i><i></i>');
    if (this.st.kiss) this.putKiss();
    // AL: the bell, kept in the folder so it can cross the fold
    this.bell = el('div', 'cf-bellegg', cf.folder);
    this.bellImg = el('img', '', this.bell); this.bellImg.src = A + 'obj/ev_bell.webp'; this.bellImg.alt = ''; this.bellImg.draggable = false;
    const bw = EGGS.bell.w, bh = bw * cf.meta.ev_bell.h / cf.meta.ev_bell.w;
    Object.assign(this.bell.style, { width: bw + 'px', height: bh + 'px', margin: `${-bh / 2}px 0 0 ${-bw / 2}px` });
    this.bell.dataset.act = 'bell';
    this.spin = 0;
    if (this.st.bell === 'pin') { const r = this.bellRest(); this.setBell(r[0], r[1], 0, 0); this.bell.classList.add('on'); }
    // B1, 2F
    this.buildTentacle();
    this.buildScope();
    this.writeSecrets();
    this.glasses = [...cf.board.children].find(e => e.it?.act === 'glasses');
  }

  // ── input, from the case file ──
  click(act) {
    const cf = this.cf;
    if (this.scoping) { this.scopeDown(); return true; }
    if (this.isDark) { this.lightsOn(); return true; }
    if (act === 'lamp') { this.lightsOut(); return true; }
    if (act === 'glasses' && !cf.dusting) { this.scopeUp(); return true; }
    if (act === 'bell') { this.bellBack(); return true; }
    return false;
  }
  key(e) {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      if (this.scoping) { this.scopeDown(); return true; }
      if (this.isDark) { this.lightsOn(); return true; }
    }
    return !!this.scoping && e.key !== 'f' && e.key !== 'F';        // the glasses up: nothing else until they're down
  }
  move(e) {
    const r = this.cf.layer.getBoundingClientRect();
    this.ptr = [e.clientX - r.left, e.clientY - r.top];
    if (this.scoping) this.aim();
    if (this.tent.state === 'out') {                                   // too close: it's off
      const t = this.tipEl.getBoundingClientRect();
      if (Math.hypot(e.clientX - t.left, e.clientY - t.top) < 150) this.retreat();
    }
  }
  onView(name) {
    const cf = this.cf;
    clearTimeout(this.creepTimer);
    if (!(name === 'sheet' && cf.top === 2)) this.retreat(true);
    if (name === 'sheet' && cf.top === 1 && !this.st.bell && cf.isOpen) setTimeout(() => this.dropBell(), 950);
    if (name === 'sheet' && cf.top === 2) this.creepTimer = setTimeout(() => this.creep(), this.st.tentacle ? 8000 : 4500);
  }
  // the case file closing: everything back as it was (a kiss earned in the dark is still given)
  reset() {
    clearTimeout(this.creepTimer);
    if (this.scoping) this.scopeDown(true);
    if (this.isDark) this.lightsOn();
    this.retreat(true);
  }

  // ── 1F · the lamp ──
  lightsOut() {
    const cf = this.cf;
    this.isDark = true;
    cf.foley?.play('click');
    this.dark.classList.remove('relit'); this.dark.classList.add('on');
    cf.hudSay('LIGHTS OUT · CLICK TO PULL THE CHAIN AGAIN');
    // the eyes look out from just off the folder's edge, on whichever side is in view
    const [vw, vh] = cf.vsize(), [x, y] = EGGS.eyes.find(([px, py]) => { const [sx, sy] = cf.toScreen(px, py); return sx > 60 && sy > 60 && sx < vw - 60 && sy < vh - 80; }) || EGGS.eyes[0];
    Object.assign(this.eyes.style, { left: x + 'px', top: y + 'px' });
    this.eyes.classList.remove('blink'); void this.eyes.offsetWidth; this.eyes.classList.add('blink');
  }
  async lightsOn() {
    const cf = this.cf;
    this.isDark = false;
    cf.foley?.play('click');
    this.eyes.classList.remove('blink');
    this.dark.classList.remove('on'); this.dark.classList.add('relit');              // it flickers back on
    cf.hudSay();
    if (this.st.kiss) return;
    this.st.kiss = true; cf.save();
    this.putKiss();
    cf.foley?.play('lights', { gain: 0.5 });
    await wait(650);
    // somebody went through the pile in the dark: the 1F report is on top now, kissed
    if (cf.isOpen && cf.top !== 0 && !cf.turned) await cf.toTop(0);
    this.kiss.classList.add('new');
    cf.foley?.play('pop', { gain: 0.7, rate: 0.75 });
  }
  putKiss() {
    this.kiss = this.cf.item(EGGS.kiss, this.cf.pages[0]);
    this.kiss.classList.add('cf-kiss');
  }

  // ── AL · the bell ──
  bellRest() { const g = LEFT[0], [x, y] = onItem(g, this.cf.meta[g.o], ...SPOTS.graph.pins[1]); return [x + EGGS.bell.rest[0], y + EGGS.bell.rest[1]]; }
  // folder px; z = how high off the paper (it grows toward the camera, its shadow drifts away); the bell itself turns
  setBell(x, y, z, rot) {
    this.bell.style.transform = `translate(${x}px, ${y}px) scale(${1 + z * 0.85})`;
    this.bell.style.filter = `drop-shadow(${(2 + 26 * z).toFixed(1)}px ${(3 + 40 * z).toFixed(1)}px ${(2 + 14 * z).toFixed(1)}px rgba(20, 10, 2, ${(0.55 - 0.22 * Math.min(z, 1)).toFixed(2)}))`;
    this.bellImg.style.transform = `rotate(${rot}deg)`;
    this.bellAt = [x, y];
  }
  // along a smooth line through `pts`, slowing to a stop (or speeding up from one, `from`); turning as it rolls
  roll(pts, ms, { stop = true } = {}) {
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {                                     // Catmull-Rom through the points
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        path.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    path.push(pts[pts.length - 1]);
    const acc = [0];
    for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const L = acc[acc.length - 1], spin0 = this.spin, dir = pts[pts.length - 1][0] < pts[0][0] ? -1 : 1;
    return tween(ms, u => {
      const d = (stop ? 1 - (1 - u) ** 3 : u * u) * L;
      let i = 1; while (i < acc.length - 1 && acc[i] < d) i++;
      const k = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]), [x, y] = lerp2(path[i - 1], path[i], k);
      this.spin = spin0 + dir * d / (EGGS.bell.w * 0.36) * 180 / Math.PI;
      this.setBell(x, y, 0, this.spin);
    });
  }
  async dropBell() {
    const cf = this.cf, E = EGGS.bell;
    if (this.st.bell || !cf.active || cf.top !== 1 || cf.where !== 'sheet' || cf.turned) return;
    this.st.bell = 'pin'; cf.save();
    this.bellBusy = true;
    this.bell.classList.add('on');
    const P = [E.from, ...E.hops], up = [1.6, 0.34, 0.15, 0.05], ms = [430, 380, 280, 160];
    for (let i = 0; i < P.length - 1; i++) {
      const s0 = this.spin;
      await tween(ms[i], u => this.setBell(...lerp2(P[i], P[i + 1], u), i ? up[i] * 4 * u * (1 - u) : up[0] * (1 - u * u), s0 - 40 * u));
      this.spin = s0 - 40;
      if (i < 3) cf.foley?.play('ting', { gain: [1, 0.7, 0.45][i], rate: 1 + i * 0.05 });
    }
    cf.view('over');                                                      // follow it over the fold
    await this.roll([E.hops[E.hops.length - 1], ...E.roll, this.bellRest()], 2100);
    const s1 = this.spin;                                                 // it rocks to a stop
    await tween(520, u => this.setBell(...this.bellAt, 0, s1 + 14 * Math.sin(u * Math.PI * 3) * (1 - u)));
    cf.foley?.play('ting', { gain: 0.18, rate: 1.2 });
    this.bellBusy = false;
  }
  async bellBack() {
    const cf = this.cf, E = EGGS.bell;
    if (this.bellBusy || this.st.bell !== 'pin') return;
    this.bellBusy = true;
    cf.foley?.play('ting', { gain: 0.35, rate: 1.1 });
    await this.roll([this.bellRest(), ...[...E.roll].reverse(), E.hops[E.hops.length - 1]], 1500, { stop: false });
    const P = [...E.hops].reverse(), up = [0.08, 0.2, 0.4];
    for (let i = 0; i < P.length - 1; i++) {
      await tween(260 + i * 60, u => this.setBell(...lerp2(P[i], P[i + 1], u), up[i] * 4 * u * (1 - u), this.spin + 30 * u));
      cf.foley?.play('ting', { gain: 0.3 + i * 0.1, rate: 1.1 - i * 0.04 });
    }
    // and up, back where it came from
    await tween(420, u => { this.setBell(...lerp2(E.hops[0], E.from, u), 1.8 * u * u, this.spin + 60 * u); this.bell.style.opacity = 1 - u * u; });
    this.bell.classList.remove('on'); this.bell.style.opacity = '';
    this.st.bell = 'home'; cf.save();
    this.bellBusy = false;
  }

  // ── B1 · the tentacle ──
  buildTentacle() {
    const cf = this.cf, pg = cf.pages[2], T = EGGS.tentacle, m = cf.meta.tentacle;
    const [bx, by] = T.from, [tx, ty] = T.to, ib = [T.base[0] * m.w, T.base[1] * m.h], it = [T.tip[0] * m.w, T.tip[1] * m.h];
    const k = Math.hypot(tx - bx, ty - by) / Math.hypot(it[0] - ib[0], it[1] - ib[1]);
    this.tAxis = Math.atan2(it[1] - ib[1], it[0] - ib[0]);                     // its own direction in its picture
    this.tRot = (Math.atan2(ty - by, tx - bx) - this.tAxis) * 180 / Math.PI;  // turned to point from base to tip
    const e = this.tent = el('div', 'cf-tentacle', pg);
    Object.assign(e.style, { left: bx - ib[0] * k + 'px', top: by - ib[1] * k + 'px', width: m.w * k + 'px', height: m.h * k + 'px', transformOrigin: `${ib[0] * k}px ${ib[1] * k}px` });
    const img = el('img', '', e); img.src = A + 'obj/tentacle.webp'; img.alt = ''; img.draggable = false;
    img.style.filter = shadow(1.4, this.tRot);
    this.tipEl = el('i', 'tip', e); Object.assign(this.tipEl.style, { left: it[0] * k + 'px', top: it[1] * k + 'px' });
    e.len = Math.hypot(tx - bx, ty - by); e.state = 'idle';
    this.pull = [(bx - tx) / e.len, (by - ty) / e.len];                       // the way it drags: back toward the base
    this.envelope = pg.items.find(x => x.it?.role === 'bag');
    this.drag = 0;
    this.setTent(-e.len - 80, 0);
  }
  // d: how far out (0 = the tip at its mark; negative = drawn back along itself); wob: degrees of feeling about
  setTent(d, wob) {
    this.tent.d = d;
    this.tent.style.transform = `rotate(${(this.tRot + wob).toFixed(2)}deg) translate(${(d * Math.cos(this.tAxis)).toFixed(1)}px, ${(d * Math.sin(this.tAxis)).toFixed(1)}px)`;
  }
  setDrag(D) {
    const env = this.envelope;
    this.drag = D;
    env.style.transform = `translate(${(this.pull[0] * D).toFixed(1)}px, ${(this.pull[1] * D).toFixed(1)}px) rotate(${(env.it.r || 0) + D * 0.07}deg)`;
  }
  wob(now, k = 1) { const t = now / 1000; return k * (2.6 * Math.sin(t * 2.3) + 1.4 * Math.sin(t * 3.9 + 1)); }
  async creep() {
    const cf = this.cf, e = this.tent;
    if (e.state !== 'idle' || !cf.active || cf.where !== 'sheet' || cf.top !== 2 || cf.busy || cf.dusting || this.scoping || cf.turned) return;
    this.st.tentacle = true; cf.save();
    e.state = 'out'; e.classList.add('on');
    const run = this.run = {}, alive = () => this.run === run, L = e.len;
    // feeling its way up out of sight, then onto the envelope by fits and starts
    for (const [d0, d1, ms] of [[-L - 80, -260, 900], [-260, -150, 1000], [-150, -150, 500], [-150, -60, 800], [-60, -60, 450], [-60, 0, 700]])
      if (!await tween(ms, (u, now) => this.setTent(lerp(d0, d1, ease(u)), this.wob(now)), alive)) return;
    // it has hold of it: tugs, a breath, more tugs
    for (let i = 0; i < 6; i++) {
      const D0 = this.drag, D1 = D0 + 16;
      cf.foley?.play('page', { gain: 0.25, rate: 0.55 });
      if (!await tween(200, (u, now) => { const D = lerp(D0, D1, ease(u)); this.setDrag(D); this.setTent(-D, this.wob(now, 0.35)); }, alive)) return;
      if (!await tween(i === 2 ? 1500 : 650, (u, now) => this.setTent(-this.drag, this.wob(now, 0.35)), alive)) return;
    }
    // and holds on, feeling about, till something makes it let go
    const hold = (u, now) => this.setTent(-this.drag, this.wob(now, 0.5));
    while (await tween(1000, hold, alive));
  }
  // back under in a flash (quietly if nobody's looking); the envelope springs back to where it was
  retreat(quiet = false) {
    const cf = this.cf, e = this.tent;
    if (!e || e.state !== 'out') return;
    e.state = 'back';
    const run = this.run = {}, d0 = e.d, D0 = this.drag;
    if (!quiet) cf.foley?.play('whip', { gain: 0.55 });
    tween(quiet ? 1 : 260, u => this.setTent(lerp(d0, -e.len - 80, u * u), 0), () => this.run === run).then(() => {
      if (this.run !== run) return;
      e.classList.remove('on'); e.state = 'idle';
      if (cf.active && cf.where === 'sheet' && cf.top === 2) this.creepTimer = setTimeout(() => this.creep(), 9000);
    });
    if (D0) tween(quiet ? 1 : 560, u => this.setDrag(D0 * (1 - u) ** 2 * Math.cos(u * Math.PI * 2.5)));
  }

  // ── the rest of the desk ──
  // the desk thing under the pointer, if any: tested on its picture (not its transparent box), topmost first
  deskAt(e) {
    const cf = this.cf, r = cf.layer.getBoundingClientRect(), [bx, by] = cf.toBoard(e.clientX - r.left, e.clientY - r.top);
    this.desk ||= [...cf.board.children].map((d, i) => [d, i]).filter(([d]) => d.it?.poke).sort((a, b) => (b[0].it.z ?? 1) - (a[0].it.z ?? 1) || b[1] - a[1]).map(([d]) => d);
    const onBook = e.target.closest?.('.cf-folder, .cf-backside');               // what lies under the book can't be clicked through it
    for (const d of this.desk) {
      if (onBook && (d.it.z ?? 1) < 2) continue;
      const it = d.it, a = -(it.r || 0) * Math.PI / 180, dx = bx - it.x, dy = by - it.y;
      const fx = (dx * Math.cos(a) - dy * Math.sin(a)) / d.w + 0.5, fy = (dx * Math.sin(a) + dy * Math.cos(a)) / d.h + 0.5;
      if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) continue;
      const m = d.alpha ||= alphaMap(d.img);
      if (m && m.data[(Math.floor(fy * m.h) * m.w + Math.floor(fx * m.w)) * 4 + 3] > 90) return d;
    }
    return null;
  }
  poke(e) {
    const d = this.deskAt(e);
    if (!d) return false;
    const mv = MOVES[d.it.poke], base = `rotate(${d.it.r || 0}deg)`;
    d.anim?.cancel();
    d.anim = d.animate(mv.k.map(([offset, t]) => ({ offset, transform: `${base} ${t}` })), { duration: mv.ms, easing: 'ease-out' });
    mv.sound(this.cf.foley);
    return true;
  }

  // ── 2F · the opera glasses ──
  buildScope() {
    this.scope = el('div', 'cf-scope', this.cf.layer, `<svg width="100%" height="100%">
      <defs><linearGradient id="cfRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".35" stop-color="#c9963f"/><stop offset=".62" stop-color="#7c5518"/><stop offset="1" stop-color="#e8c272"/></linearGradient>
      <filter id="cfSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <path class="dark"/><path class="shade"/><path class="rod"/><path class="rim"/><path class="glint"/><path class="glint"/><rect class="bridge"/></svg>`);
  }
  scopeUp() {
    const cf = this.cf;
    cf.camTok = {};
    this.scoping = { cam: { ...cf.cam }, k: 1 };
    this.st.glasses = true; cf.save();
    this.glasses?.classList.add('lifted');
    cf.layer.classList.add('scoping'); this.scope.classList.add('on');
    cf.foley?.play('swish', { gain: 0.5 });
    cf.hudSay('THE OPERA GLASSES · CLICK TO PUT THEM DOWN');
    const sc = this.scoping;
    tween(320, u => { if (this.scoping === sc) { sc.k = lerp(1, ZOOM, ease(u)); this.aim(); } });
  }
  scopeDown(now = false) {
    const cf = this.cf, cam = this.scoping.cam;
    this.scoping = null;
    cf.layer.classList.remove('scoping'); this.scope.classList.remove('on');
    this.glasses?.classList.remove('lifted');
    cf.hudSay();
    if (now) { cf.cam = cam; cf.applyCam(); } else cf.tweenCam(cam, 420);
  }
  // the glasses on the pointer: the camera made `k` times closer about the point under it, so that point stays put, in
  // the middle of the view; the view is the two lenses' circles run together (the binocular shape, as in No. 4), the
  // dark round it, a gold rim, the bridge at the top and the handle going off to the lower right
  aim() {
    const cf = this.cf, sc = this.scoping, [vw, vh] = cf.vsize(), [sx, sy] = this.ptr || [vw / 2, vh / 2];
    const base = sc.cam, s1 = base.s * sc.k, [px, py] = cf.toBoard(sx, sy, base), a = -base.r * Math.PI / 180, dx = (sx - vw / 2) / s1, dy = (sy - vh / 2) / s1;
    cf.cam = { x: px - (dx * Math.cos(a) - dy * Math.sin(a)), y: py - (dx * Math.sin(a) + dy * Math.cos(a)), s: s1, r: base.r };
    cf.applyCam();
    const R = Math.min(vw, vh) * 0.24, g = R * 0.8, h = Math.sqrt(R * R - g * g), q = this.scope, set = (sel, at) => Object.entries(at).forEach(([k, v]) => q.querySelector(sel).setAttribute(k, v));
    const shape = `M${sx} ${sy - h}A${R} ${R} 0 1 0 ${sx} ${sy + h}A${R} ${R} 0 1 0 ${sx} ${sy - h}Z`;
    set('.dark', { d: `M0 0H${vw}V${vh}H0Z` + shape });
    set('.shade', { d: shape, 'stroke-width': R * 0.3 });
    set('.rim', { d: shape, 'stroke-width': R * 0.08 });
    q.querySelectorAll('.glint').forEach((l, i) => {
      const x = sx + (i ? g : -g);
      l.setAttribute('d', `M${x - R * 0.78} ${sy - R * 0.2}A${R * 0.8} ${R * 0.8} 0 0 1 ${x - R * 0.2} ${sy - R * 0.78}`);
      l.setAttribute('stroke-width', R * 0.045);
    });
    set('.bridge', { x: sx - R * 0.2, y: sy - h - R * 0.1, width: R * 0.4, height: R * 0.16, rx: R * 0.06 });
    set('.rod', { d: `M${sx} ${sy + h}L${sx + R * 0.2} ${sy + h + R * 0.5}L${sx + R * 1.1} ${sy + R * 3.2}`, 'stroke-width': R * 0.15 });
  }
  // lipstick in the margins, a floor each, only legible through the glasses (boards: hi jojo ♡ · 200% · a kitten ·
  // check the back)
  writeSecrets() {
    FLOORS.forEach((f, i) => {
      const s = EGGS.secrets[f.id], size = s.size, n = s.text?.length || 0;
      const w = s.cat ? size * 1.3 : size * 0.9 * n + 16, h = s.cat ? size * 1.15 : size * 1.6 + 10;
      const strokes = (s.cat ? kitten(6, 4, size) : phrase(s.text, { x: 6, y: 5, size, a: -0.03, seed: 140 + i, wobble: 0.1 }))
        .map(p => ({ b: 'grease', c: LIP, w: Math.max(0.36, size / 26), p }));
      const surf = new Surface(w, h, { k: 4, paper: '#ffffff', seed: 150 + i, tooth: 0.5 });
      surf.draw(b => strokes.forEach(t => stroke(b, t)));
      const c = el('canvas', 'cf-secret', this.cf.pages[i]); c.width = surf.out.width; c.height = surf.out.height;
      keyWhite(surf.out, c);
      Object.assign(c.style, { left: s.x + 'px', top: s.y + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${s.r}deg)` });
      surf.release();
    });
  }
}

// a kitten doodled in lipstick: round face, two ears, a bow on one, dot eyes, a w mouth, whiskers (in a size×size box)
function kitten(x, y, size) {
  const k = size / 40, P = pts => pts.map(([px, py]) => [x + px * k, y + py * k]);
  const face = Array.from({ length: 21 }, (_, i) => { const t = -0.2 + i / 20 * Math.PI * 2.05; return [22 + Math.cos(t) * 15, 24 + Math.sin(t) * 12]; });
  const dot = (cx, cy) => [[cx, cy], [cx + 0.5, cy + 1.2]];
  return [face, [[9, 18], [10, 6], [17, 13]], [[27, 13], [34, 6], [35, 18]],
    [[8, 9], [3, 4], [3, 12], [8, 9], [13, 3], [14, 11], [8, 9]],
    dot(16, 22), dot(28, 22), [[19, 28], [22, 30], [25, 28]],
    [[3, 25], [12, 27]], [[3, 30], [12, 29]], [[32, 27], [41, 25]], [[32, 29], [41, 30]]].map(P);
}

// AL · the Back Alley — the Sunday page for "Rain Check" (issue No. 2: the story's second stop, 23:58).
// Same board as the others (2000×1080, polygons in page px, item positions as fractions of a panel's box). Its tricks:
// rain in every panel that slides against the camera, a gutter that is a bolt of lightning, a bell that bounces along
// the gutters, and the last train, one cut-out running across three panels and off the edge of the paper.
import { trail } from '../comic.js';

const A = name => `assets/comic/alley/${name}?v=1`;     // bump when the art changes
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin(i / n * Math.PI * 2 - Math.PI / 2)]);
const INSET = { inset: true, q: 4, maxZoom: 2.4, audio: 'keep', tilt: 0 };

// the gutter between the solo and the lightning is a bolt: P3's right edge, and P4's left edge 18 px to its right
const BOLT = [[1420, 166], [1388, 300], [1440, 330], [1400, 470], [1446, 500], [1410, 590]];
const BOLT_R = BOLT.map(([x, y]) => [x + 18, y]);
// the railway: one panorama under three panels (a strip 566–1960 × 608–1052), the rails at RAIL_Y on the page
const STRIP = { x0: 566, x1: 1960, y0: 608, y1: 1052, band: [0.375, 0.48] };      // band: the rows of p6.webp it shows
const slice = (x0, x1) => [(x0 - STRIP.x0) / (STRIP.x1 - STRIP.x0) , STRIP.band[0], (x1 - x0) / (STRIP.x1 - STRIP.x0), STRIP.band[1]];
const RAIL_Y = 850, TRAIN_H = 240;                    // where the wheels run on the page; the cut-out's height (it fits under the panels' top)
const SWAP = 1467;                                   // past this gutter (between the second and third track panels) the caboose has three cats aboard
// the two lenses of the opera glasses (I1): two overlapping circles, as one outline
const lenses = (cx, cy, r, d) => {
  const a = Math.acos(d / (2 * r)), pts = [];
  for (let i = 0; i <= 24; i++) { const t = a + (2 * Math.PI - 2 * a) * i / 24; pts.push([cx - d / 2 + r * Math.cos(t), cy + r * Math.sin(t)]); }       // the left lens, round its outside
  for (let i = 1; i < 24; i++) { const t = Math.PI + a + (2 * Math.PI - 2 * a) * i / 24; pts.push([cx + d / 2 + r * Math.cos(t), cy + r * Math.sin(t)]); }  // then the right
  return pts;
};
// the bell's way down: off the top landing in P4, onto the gutter between the rows, bouncing left along it, into P5's puddle
const BELL = [[1748, 216], [1720, 420], [1640, 599], [1300, 599], [960, 599], [640, 599], [460, 660], [210, 1000]];
const BOUNCES = [1640, 1300, 960, 640];              // where it strikes the gutter (x), each a smaller ting
// the train cut-out run through the press like the panels (two printed px per page px at the height it is shown), then
// cut back out along its own alpha
async function inked(api, src, h) {
  const img = await api.img(src), c = api.el('canvas');
  if (!img) return c;
  c.aspect = img.naturalWidth / img.naturalHeight; c.height = h * 2; c.width = Math.round(c.height * c.aspect);
  const g = c.getContext('2d');
  g.drawImage(api.print(img, c.width, c.height), 0, 0);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export default {
  W: 2000, H: 1080,
  // No. 2's colours (No. 4 red and yellow, No. 3 green and violet, No. 1 navy and coral): wet slate, neon pink, signal orange
  palette: {
    band: '#3c4f63', 'band-dot': '#30404f', logo: '#ff86b4', 'logo-3d': '#e8701e', price: '#e8701e', seal: '#3c4f63',
    tag: '#ffb347', 'tag-ink': '#24303c', ribbon: '#e8701e', 'ribbon-ink': '#fff3d6', cast: '#24303c', 'cast-ink': '#ff9ac0',
    'mast-brand': '#3c4f63', 'mast-title': '#ff8fb8', 'mast-shade': '#3c4f63', roundel: '#ffb347', 'roundel-dot': '#e8701e', 'roundel-price': '#3c4f63',
    ad: '#eef3f7', 'ad-title': '#e8701e',
  },
  cover: {
    x: 1000, W: 1000, H: 1080,
    art: { src: A('cover.webp'), rect: [0, 244, 1000, 712] },
    inks: { paper: '#fbf8f1', c: '#18a2dc', m: '#ec2f7c', y: '#ffe12e', k: '#141214' }, levels: 6,
    box: [712, 282, 262, 172],                         // the footage lands top right on this one
    // this copy's damage: torn mid-way down the open edge, a rain stain where it lay in a puddle, coffee up top, creased
    // corner to corner, a thumbprint top right, and tape on a split along the bottom of the fold
    worn: { seed: 23, tear: 0.5, nick: 0.3, ring: [0.36, 0.1], creases: [[0, 0.82, 0.62, 1], [0.66, 0, 1, 0.5], [0.2, 0, 0, 0.4]],
      inner: [1, 0.14, 0.7, 0], stain: [0.3, 0.72], thumb: [0.97, 0.06], tapes: [[0.5, 0.988, 0, 70]] },
    heads: { src: A('heads.webp'), n: 7, size: 84 },
    html: `
      <div class="cv-band">
        <div class="cv-corner"><span>No. 2</span><i data-head="1"></i><b>10¢</b></div>
        <div class="cv-logo"><small>The Jolly Hotel presents</small><b>JOLLY</b><em>Alley Cat Comics</em></div>
        <div class="cv-seal"><small>Approved<br>by the</small><b>CATS</b><small>Code<br>Authority</small></div>
      </div>
      <div class="cv-tag"><b>Who dropped the bell...?</b><span>and why are the cats leaving town?</span></div>
      <div class="cv-art"></div>
      <div class="cv-cam"><b>●</b> CAM ALLEY · LIVE</div>
      <div class="cv-title"><small>Out back of the Jolly:</small><b>Rain Check!</b></div>
      <div class="cv-cast"><span>Starring</span>${['Jojo', 'Lyly', 'YOYO', 'Tubbs', 'Patch', 'Ghost', 'Old Blue'].map((n, i) => `<figure><i data-head="${i}"></i><figcaption>${n}</figcaption></figure>`).join('')}</div>`,
  },
  pixelExposure: 1.7,
  pushZoom: 1.35,
  next: 'NEXT ISSUE · B1 ↓',
  nextScene: 'cellar',
  mast: `
    <div class="mast" style="left:40px;top:18px;width:1920px;height:134px">
      <div class="m-brand"><b>The Jolly</b><span>Sunday Funnies · Brooklyn, N.Y.</span></div>
      <div class="m-title"><h2>Rain Check</h2><span>Starring Jojo on Sax · Lyly on Bass · Three Alley Cats · and You-Know-Who</span></div>
      <div class="m-issue"><b>No. 2</b><span>The Back Alley</span><i>10¢</i><small>or one donut</small></div>
      <button class="m-ad" data-act="ad"><b>Rain Checks!</b><span>Good for one (1) dry night.</span><em>5¢ · not valid in Brooklyn · Jolly Weather Co.</em></button>
    </div>
    <svg class="boltgap" viewBox="0 0 2000 1080"><polygon points="${[...BOLT, ...BOLT_R.slice().reverse()].map(q => q.join(',')).join(' ')}"/></svg>
    <i class="bell"></i>
    <div class="finale page-it"><b>Case Open</b><span>She went upstairs.</span></div>`,
  actions: {
    ad: api => { api.foley.play('pop'); api.toast('Rain check issued', 'Valid: never.', '5¢'); },
  },

  // page-wide: rain in the big panels, and the fast freight that
  // tears across the top row the first time the page is seen
  async setup(api, page) {
    // the rain keeps out of the camera's way: one sheet of streaks, in the panels on screen, and only while the camera
    // is still. Rain layers on the move, two sheets in every panel, had the browser re-rastering them all the way: moves
    // froze for ~0.2 s and jumped, and frames went through with whole tiles of the page missing. A move only hides the
    // rain (an opacity change: nothing to repaint); which panels have it changes once the camera has settled.
    const seen = new Map(), dry = page.panels.filter(p => !p.d.inset);
    const io = new IntersectionObserver(es => es.forEach(e => seen.set(e.target, e.isIntersecting)));
    for (const p of dry) { api.el('div', 'rain', p.clip); io.observe(p.root); }
    let lastCam = null, stillSince = 0, raining = false;
    const weather = (now, cam) => {
      const moved = !lastCam || Math.abs(cam.x - lastCam.x) + Math.abs(cam.y - lastCam.y) > 0.05 || Math.abs(cam.s - lastCam.s) > 1e-4;
      lastCam = { ...cam };
      if (moved) { stillSince = now; if (raining) { raining = false; page.root.classList.remove('raining'); } return; }
      if (!raining && now - stillSince > 350) {
        raining = true;
        dry.forEach(p => p.root.classList.toggle('wet', !!seen.get(p.root)));
        page.root.classList.add('raining');
      }
    };
    const run = api.el('div', 'train-run fast'), H = TRAIN_H * 1.35;
    const box = api.el('div', '', run), img = await inked(api, A('train.webp'), H);
    box.appendChild(img);
    Object.assign(box.style, { left: '40px', top: '166px', width: '1920px', height: '424px' });
    let t0 = 0, on = false;
    return {
      frame: (now, cam) => {
        weather(now, cam);
        if (!on) return;
        const k = (now - t0) / 750, w = H * (img.aspect || 6);
        Object.assign(img.style, { width: w + 'px', height: H + 'px' });
        img.style.transform = `translate(${(-w + (1920 + w) * k).toFixed(1)}px, ${(424 - H - 20).toFixed(1)}px)`;
        if (k >= 1) { on = false; run.remove(); }
      },
      over: first => {
        if (!first) return;
        page.root.parentElement.appendChild(run); t0 = performance.now(); on = true;
        api.foley.play('horn'); api.foley.play('train', { gain: 0.8, rate: 1.5 });
        api.flash(60, '#fffef6');
      },
      reset: () => { on = false; run.remove(); },
    };
  },

  panels: [
    {
      id: 'cam', poly: [[40, 166], [372, 166], [360, 590], [40, 590]], t: 0, audio: [0, 3.4],
      art: { pixel: { t: 1.0, zoom: 1.25, at: [1.5, 1.2, 0.2], hud: false } },
      steps: [
        [{ tag: '<b>●</b> CAM ALLEY · 23:58:00' }, { cap: '23:58. Out back of the Jolly. Raining, naturally.', corner: 'bl', aspect: 2 }],
        [{ say: 'Edgar sees everything.', kind: 'whisper', x: 0.62, y: 0.2, to: '@EDGAR', w: 0.5 }],
      ],
    },
    {
      id: 'trash', poly: [[390, 166], [850, 166], [850, 590], [378, 590]], t: 3.4, audio: [3.4, 9.3],
      art: { img: A('p2.webp'), ph: 'LYLY HEAVES TWO TRASH BAGS · THREE CATS HISS ON THE DUMPSTER', video: A('p2.mp4'), fps: 12 },
      steps: [
        // cues from the clip (H3): the bags land ~1.3 s, the cats scatter ~1.6 s, she barks from ~3.4 s
        [{ fn: 'roll' }, { sfx: 'HSSSS!', x: 0.7, y: 0.12, size: 40, rot: 8, vt: 0.3, snd: 'hiss' }, { sfx: 'FWUMP.', x: 0.66, y: 0.42, size: 34, rot: -6, vt: 1.3 },
          { say: 'ALL BARK.*', kind: 'shout', who: 'lyly', x: 0.3, y: 0.12, to: [0.26, 0.36], vt: 3.4, snd: 'bark' }],
        [{ note: '*Scram. —Translated from the Bark. —Ed.', x: 0.04, y: 0.86, w: 0.5, aspect: 4, tilt: -1.5 }],
      ],
      setup: (api, p) => api.video(p),
    },
    {
      id: 'solo', poly: [[868, 166], ...BOLT, [868, 590]], t: 10.8, audio: [9.3, 17.6],
      art: { img: A('p3.webp'), ph: 'JOJO PLAYS THE SOLO IN THE RAIN · THE CATS LISTEN' },
      wall: [0.47, 0.25, 30, -7], horn: [0.13, 0.5],   // in the panel: where the graffiti goes (size, tilt); the sax's bell
      tour: [{ at: [0.28, 0.5], z: 1.55, hold: 300 }, { at: [0.7, 0.5], z: 1.55, ms: 4200, ease: 'linear', hold: 200 }, { at: 'fit', ms: 900 }],
      steps: [
        [{ cap: 'Then Jojo played the solo.', corner: 'tl', aspect: 3 }, { fn: 'notes' }],
        [{ cap: 'Even the cats stayed.', shape: 'tab', x: 0.52, y: 0.84, aspect: 3.6 }],
        [{ note: '*Old Blue joined in. Nobody asked Old Blue. —Ed.', x: 0.5, y: 0.04, w: 0.42, aspect: 3.6, tilt: 1.5 }],
      ],
      setup(api, p) {
        const [gx, gy, gs, gr] = p.d.wall;
        const g = api.el('div', 'graffiti', p.ov, 'YOYO 200% ♡');       // it is on the wall in the footage too (alley.js)
        Object.assign(g.style, { left: gx * p.w + 'px', top: gy * p.h + 'px' }); g.style.setProperty('--size', gs + 'px'); g.style.setProperty('--rot', gr + 'deg');
        const notes = [0, 1, 2, 3].map(i => { const n = api.el('i', 'note8', p.ov, i % 2 ? '♫' : '♪'); Object.assign(n.style, { left: p.d.horn[0] * p.w + i * 14 + 'px', top: p.d.horn[1] * p.h - i * 10 + 'px' }); n.style.setProperty('--d', i * 0.7 + 's'); return n; });
        return {
          notes: () => notes.forEach(n => n.classList.add('on')),
          reset: () => notes.forEach(n => n.classList.remove('on')),
        };
      },
    },
    {
      // the floor's first signature: the gutter itself is the lightning; the panel prints as a negative in the flash
      id: 'lightning', poly: [[1438, 166], [1960, 166], [1960, 590], ...BOLT_R.slice().reverse()], t: 18.04, audio: [17.6, 21.4],
      art: { img: A('p4.webp'), fy: 0, ph: 'UP THE FIRE ESCAPE IN A LIGHTNING FLASH · A KITTEN WITH AN UMBRELLA' },     // from the top: she is up there
      steps: [
        [{ fn: 'strike', at: 18.04 }, { sfx: 'KRA-KOOM!', x: 0.06, y: 0.42, size: 56, rot: -12, at: 18.08, snd: false },
          { cap: 'Suspect · YOYO<small>Sighted: fire escape, 23:58</small>', dark: true, center: true, x: 0.6, y: 0.8, tilt: 0, at: 18.8 },
          { fn: 'strike', at: 19.54 }],
        [{ note: '*She likes fire escapes. See No. 4. —Ed.', x: 0.44, y: 0.05, w: 0.52, aspect: 3.4, tilt: 1.5 }],
      ],
      setup(api, p) {
        const pos = api.el('canvas'); pos.width = p.cv.width; pos.height = p.cv.height; pos.getContext('2d').drawImage(p.cv, 0, 0);
        const neg = api.el('canvas'); neg.width = p.cv.width; neg.height = p.cv.height;
        api.bake(p, api.invert(p.src), { ...p.d.art, exposure: 1.1, into: neg });              // the same crop, inks reversed
        const g = p.cv.getContext('2d'), bolt = p.page.root.querySelector('.boltgap polygon');
        let timers = [];
        return {
          strike: () => {
            api.foley.play('boom'); api.shake(p);
            const c = api.cam(); api.camTo({ ...c, r: 6 }, 90).then(() => api.camTo({ ...c, r: c.r }, 500));       // a dutch tilt
            timers.push(...[[0, 1], [80, 0], [150, 1], [260, 0]].map(([ms, on]) => setTimeout(() => {
              g.drawImage(on ? neg : pos, 0, 0);
              bolt.style.opacity = on ? 1 : 0.15;
              if (on) api.flash(70, '#eef3ff');
            }, ms)));
            timers.push(setTimeout(() => { bolt.style.opacity = 0; }, 700));
          },
          reset: () => { timers.forEach(clearTimeout); timers = []; g.drawImage(pos, 0, 0); bolt.style.opacity = 0; },
        };
      },
    },
    {
      // the camera follows the bell down from the fire escape and along the gutters to the puddle
      id: 'bell', poly: [[40, 608], [560, 608], [548, 1052], [40, 1052]], t: 22.39, audio: [21.4, 26.0],
      art: { img: A('p5.webp'), fx: 0, ph: 'LYLY PICKS THE BELL OUT OF A PUDDLE · JOJO RAISES HIS OPERA GLASSES' },
      via: BELL, viaMs: 2800,
      lens: [0.854, 0.15],                            // the opera glasses, in the panel
      steps: [
        [{ sfx: 'TING!', x: 0.36, y: 0.84, size: 34, rot: -8, shake: false, snd: 'ting' }, { say: '...her bell.', who: 'lyly', x: 0.42, y: 0.2, to: [0.24, 0.48], delay: 700 }],
        [{ fn: 'glasses' }],
      ],
      setup(api, p) {
        const bell = p.page.root.querySelector('.bell'), path = trail(BELL), page = p.page.root;
        // how far along the path each strike on the gutter is (the bell is lifted between strikes, less each time)
        const hits = BOUNCES.map(x => { let best = 0, bd = 1e9; for (let k = 0; k <= 1; k += 0.002) { const [px, py] = path(k); const d = Math.abs(px - x) + Math.abs(py - 599); if (d < bd) { bd = d; best = k; } } return best; });
        let done = new Set();
        const place = k => {
          const [x, y] = path(k); let lift = 0;
          for (let i = 0; i < hits.length - 1; i++) if (k > hits[i] && k < hits[i + 1]) lift = Math.sin(Math.PI * (k - hits[i]) / (hits[i + 1] - hits[i])) * 70 / (i + 1);
          Object.assign(bell.style, { left: x + 'px', top: y - lift + 'px' });
          hits.forEach((h, i) => {
            if (k >= h && !done.has(i)) {
              done.add(i); api.foley.play('ting', { gain: 1 - i * 0.18, rate: 1 + i * 0.04 });
              const t = api.el('div', 'ting', page, 'ting'); Object.assign(t.style, { left: BOUNCES[i] + 'px', top: '596px' }); t.style.setProperty('--size', 30 - i * 5 + 'px');
              setTimeout(() => t.remove(), 1000);
            }
          });
        };
        return {
          via: k => { bell.classList.add('on'); place(k); },
          enter: () => bell.classList.remove('on'),
          glasses: () => api.look(p, p.d.lens, 4.2, 1000).then(() => api.goNext()),       // into the lenses, which become the next panel
          reset: () => { done = new Set(); bell.classList.remove('on'); },
        };
      },
    },
    {
      // through the opera glasses: the lit window up the fire escape; the blind flicks (as at 23.79 in the footage)
      ...INSET, id: 'glasses', poly: lenses(320, 604, 58, 76), maxZoom: 2.6,
      art: { img: A('p4.webp'), fx: 0.61, fy: 0.05, zoom: 3.2, ph: 'THE LIT WINDOW THROUGH THE OPERA GLASSES' },
      steps: [[{ fn: 'flick', at: 23.79 }, { sfx: 'flick.', x: 0.7, y: 0.24, size: 22, rot: 6, shake: false, at: 23.8, snd: 'lights', sndGain: 0.5 },
        { say: 'She went upstairs!', who: 'lyly', x: 1.42, y: 0.22, w: 0.7, to: [0.98, 0.4], at: 25.19 },
        { note: '↑ 2F · Room 203 (No. 4)', x: 0.55, y: -0.3, w: 0.8, aspect: 3.4, tilt: -3, at: 25.6 }]],
      setup(api, p) {
        const blind = api.el('div', 'blackout', p.clip);
        return {
          flick: () => blind.animate([{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }, { opacity: 0.7 }, { opacity: 0 }], { duration: 420 }),
          reset: () => blind.getAnimations().forEach(a => a.cancel()),
        };
      },
    },
    {
      // the floor's second signature: the last train, one cut-out across three panels and their gutters. The camera rides on
      // the caboose; past the gutter into the third panel the caboose has three cats on its porch (time jumps at the gutter).
      // The train is cut by the first panel's (slanted) left edge, and is gone at the edge of the paper.
      id: 'track-a', poly: [[578, 608], [1112, 608], [1112, 1052], [566, 1052]], t: 26.09, audio: [26.0, 32.9],
      art: { img: A('p6.webp'), crop: slice(566, 1112), ph: 'THE CATS WAIT BY THE TRACK' },
      porch: 0.028,                                   // where the caboose's back porch is along the train cut-out (fraction of its width)
      steps: [
        [{ cap: 'The cats had a train to catch.', corner: 'bl', aspect: 4.4 }, { fn: 'ride' }, { sfx: 'WHOOO!', x: 0.2, y: 0.18, size: 40, rot: -10, at: 26.15, snd: false },
],
      ],
      async setup(api, p) {
        const page = p.page, run = api.el('div', 'train-run');
        const H = STRIP.y1 - STRIP.y0, [[ex0], , , [ex1]] = p.d.poly;        // the first panel's left edge runs from ex0 (top) to ex1 (bottom)
        const layer = async (x0, x1, src) => {
          const box = api.el('div', '', run), img = await inked(api, src, TRAIN_H); box.appendChild(img);
          Object.assign(box.style, { left: x0 + 'px', top: STRIP.y0 + 'px', width: x1 - x0 + 'px', height: H + 'px' });
          return { box, img };
        };
        const L = [await layer(STRIP.x0, SWAP, A('train.webp')), await layer(SWAP, 1960, A('train-cats.webp'))];
        L[0].box.style.clipPath = `polygon(${ex0 - STRIP.x0}px 0, 100% 0, 100% 100%, ${ex1 - STRIP.x0}px 100%)`;
        const cx = q => q.d.rect[0] + q.d.rect[2] / 2, last = page.panels.find(q => q.d.id === 'track-c');
        const T0 = 26.3, T1 = 32.4;
        let on = false;
        const draw = t => {
          const w = TRAIN_H * (L[0].img.aspect || 6);
          // the nose enters the strip at T0; the tail leaves the paper at T1
          const k = (t - T0) / (T1 - T0), nose = STRIP.x0 + k * (2040 + w - STRIP.x0), left = nose - w;
          for (const { box, img: im } of L) {
            Object.assign(im.style, { width: w + 'px', height: TRAIN_H + 'px' });
            im.style.transform = `translate(${(left - parseFloat(box.style.left)).toFixed(1)}px, ${(RAIL_Y - TRAIN_H - STRIP.y0).toFixed(1)}px)`;
          }
          return left + p.d.porch * w;                // where the porch is now
        };
        return {
          ride: () => { page.root.parentElement.appendChild(run); on = true; api.foley.play('toots'); },
          frame: () => {
            if (!on) return;
            const t = api.segTime(), porch = draw(t), fit = api.fit(p);
            const x = Math.min(cx(last), Math.max(cx(p), porch));               // ride the caboose to the last panel
            if (porch > cx(p)) api.setCam({ x, y: fit.y, s: fit.s, r: 0 });
            if (t > T1 + 0.2) on = false;
          },
          leave: () => { on = false; run.remove(); },
          reset: () => { on = false; run.remove(); },
        };
      },
    },
    {
      id: 'track-b', stop: false, poly: [[1130, 608], [1458, 608], [1458, 1052], [1130, 1052]],
      art: { img: A('p6.webp'), crop: slice(1130, 1458), ph: 'TUBBS LEAPS' },
    },
    {
      id: 'track-c', poly: [[1476, 608], [1960, 608], [1960, 1052], [1476, 1052]], t: 30.4, audio: [30.4, 32.9],
      art: { img: A('p6.webp'), crop: slice(1476, 1960), ph: 'PATCH AND GHOST LEAP AFTER IT' },
      steps: [
        [{ cap: 'Tubbs, Patch and Ghost took the last train out of Brooklyn.', x: 0.03, y: 0.07, w: 0.42, aspect: 1.6, tilt: -1.5 },
          { tag: '<b>●</b> CAM ALLEY · 23:58:33', x: 0.46 }, { cap: 'Filed at 23:58:33. Three witnesses left town.', x: 0.55, y: 0.47, w: 0.42, aspect: 2.2, tilt: 1, delay: 600 }],
        [{ fn: 'exhibit' }, { note: 'Next Sunday: the cellar.', x: 0.05, y: 0.72, w: 0.42, tilt: -2 }, { fn: 'sticker', delay: 1100 }],
      ],
      async setup(api, p) {
        const ex = api.exhibit(p, { id: 'bell', letter: 'B', what: 'The bell.', back: 21.75, hint: "▶ It's only there for a second.", pos: [0.03, 0.47] });
        const st = await api.sticker(p, { src: A('heads.webp'), i: 2 });
        return { ...ex, ...st, reset: () => { ex.reset(); st.reset(); } };
      },
    },
    {
      // the CAM monitor laid on the last panel (part of it, not a stop of its own)
      ...INSET, id: 'closed', stop: false, poly: [[1700, 640], [1944, 640], [1944, 804], [1700, 804]],
      art: { pixel: { t: 32.5, zoom: 1.6, at: [-1.0, 1.2, 0.0], hud: false } },
    },
  ],
};

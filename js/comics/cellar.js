// B1 · the Cellar — the Sunday page for "The Thing in the Keg Room" (issue No. 3: the story's third stop, 00:06).
// Same board as 2F (2000×1080, polygons in page px, item positions as fractions of a panel's box). The row gutters step
// down left to right like the cellar stairs; the reader holds the flashlight in P3, and the Thing's arm crosses the gutters.
import { trail } from '../comic.js';

// art files carry a version so a browser never shows a cached older drawing after a redraw (bump it when art changes)
const A = name => `assets/comic/cellar/${name}?v=2`;
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin(i / n * Math.PI * 2 - Math.PI / 2)]);
const INSET = { inset: true, q: 4, maxZoom: 2.4, audio: 'keep', tilt: 0 };
// p3.webp shown with its crop moved down a little (art.fy), so the lipstick stays in frame: art px → panel fractions
const P3 = { fy: 0.56, at: (x, y) => [x / 1536, (y / 1024 - 0.155) / 0.81] };
const CANDLES = [[465, 648], [597, 566], [808, 546], [968, 549], [1147, 582], [1240, 678], [1092, 728], [838, 748], [612, 714]].map(([x, y]) => P3.at(x, y));
const SPOTS = { start: [0.12, 0.45], grate: P3.at(845, 668), lipstick: P3.at(175, 890), yoyo: P3.at(1355, 250) };
// the Thing's arm: out of the bottom of P4, along the gutters, into P5 where it curls up to YOYO (page px, drain → P5)
const ARM = [[1590, 628], [1470, 648], [1330, 650], [1246, 688], [1239, 760], [1234, 812]];
// …and the camera carries on along the arm inside P5 to her paw
const ARM_IN = [[1180, 880], [1116, 985], [961, 1000], [901, 867]];

// the arm, drawn on the page and screened like the panels: banded cyan, pink suckers underneath, an ink outline. It only
// exists for the trip from P4 to P5: `grow(k)` slides it out along the gutters, `retract()` pulls it back into the drain
function arm(api, root) {
  const path = trail(ARM), N = 64, W = u => 34 + 30 * u * u;           // thickening toward P5, where it meets the arm in the art
  const svg = api.svgEl('svg', root, { class: 'tentacle', viewBox: '0 0 2000 1080' });
  const pts = Array.from({ length: N }, (_, i) => path(i / (N - 1)));
  const side = pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = W(i / (N - 1)) / 2;
    return [[q[0] - dy / d * w, q[1] + dx / d * w], [q[0] + dy / d * w, q[1] - dx / d * w]];
  });
  const poly = list => list.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ');
  const id = 'armgrow' + Math.random().toString(36).slice(2, 7), defs = api.svgEl('defs', svg);
  // printed like the panels: Ben-Day dots at the press's screen (2.4 page px) over paper or a flat plate
  const dots = (name, base, dot, rad, ang) => {
    const pt = api.svgEl('pattern', defs, { id: id + name, width: 2.4, height: 2.4, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${ang})` });
    api.svgEl('rect', pt, { width: 2.4, height: 2.4, fill: base });
    api.svgEl('circle', pt, { cx: 1.2, cy: 1.2, r: rad, fill: dot });
    return `url(#${id + name})`;
  };
  const LIGHT = dots('l', '#f2e8d0', '#3fa3cf', 1.0, 15), DARK = dots('d', '#3fa3cf', '#1d1a1c', 0.62, 45), PINK = dots('p', '#f2e8d0', '#e0507a', 1.05, 75);
  const mask = api.svgEl('mask', defs, { id, maskUnits: 'userSpaceOnUse' });
  const reveal = api.svgEl('polyline', mask, { points: poly(pts), fill: 'none', stroke: '#fff', 'stroke-width': 120, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'stroke-dasharray': `${path.total + 200} ${path.total + 200}` });
  const g = api.svgEl('g', svg, { mask: `url(#${id})` });
  for (let i = 0, band = 0; i < N - 1; i += 4, band++) {
    const j = Math.min(N - 1, i + 4);
    api.svgEl('polygon', g, { points: poly([...side.slice(i, j + 1).map(s => s[0]), ...side.slice(i, j + 1).map(s => s[1]).reverse()]), fill: band % 2 ? LIGHT : DARK });
  }
  api.svgEl('polygon', g, { class: 'ink', points: poly([...side.map(s => s[0]), ...side.map(s => s[1]).reverse()]) });
  for (let i = 3; i < N - 2; i += 5) {
    const [x, y] = side[i][0], [cx, cy] = pts[i], r = W(i / (N - 1)) * 0.17;
    api.svgEl('circle', g, { class: 'sucker', fill: PINK, cx: (x * 0.8 + cx * 0.2).toFixed(1), cy: (y * 0.8 + cy * 0.2).toFixed(1), r: r.toFixed(1) });
  }
  const D = path.total + 200;
  let shown = 0;
  // the whole drawing is taken off the page while the arm is in the drain: its dot patterns are costly to rasterise
  const grow = k => { shown = k; svg.style.display = k > 0 ? '' : 'none'; reveal.style.transition = 'none'; reveal.style.strokeDashoffset = (D * (1 - k)).toFixed(1); };
  const retract = () => {
    if (!shown) return;
    shown = 0;
    reveal.style.transition = 'stroke-dashoffset .9s cubic-bezier(.5,0,.8,.6) .25s';
    reveal.style.strokeDashoffset = D.toFixed(1);
    setTimeout(() => { if (!shown) svg.style.display = 'none'; }, 1250);
  };
  grow(0);
  return { grow, retract };
}

// a plate printed twice (lit / almost black) with the lit one showing only where light falls; `lights` → mask layers
function lightable(api, p, { dark = 0.2 } = {}) {
  const plate = exposure => { const c = api.el('canvas'); c.width = p.cv.width; c.height = p.cv.height; return api.bake(p, p.src, { ...p.d.art, exposure, into: c }); };
  const lit = plate(1.04), black = plate(dark);
  const g = p.cv.getContext('2d'), base = () => g.drawImage(black, 0, 0);
  base();
  lit.className = 'lit'; p.clip.appendChild(lit);
  const light = layers => {
    const m = layers.join(',') || 'linear-gradient(transparent, transparent)';
    lit.style.webkitMaskImage = lit.style.maskImage = m;
  };
  light([]);
  return { lit, base, light };
}
const glow = (x, y, r, core = 45) => `radial-gradient(circle ${r.toFixed(0)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, #000 ${core}%, transparent 100%)`;

export default {
  W: 2000, H: 1080,
  // No. 3's own colours (No. 4 is red and yellow): cellar green, the Thing's violet, the eye's acid lime
  palette: {
    band: '#23864f', 'band-dot': '#1a6b3e', logo: '#c8f04a', 'logo-3d': '#4a2a7a', price: '#23864f', seal: '#4a2a7a',
    tag: '#c3a4ff', 'tag-ink': '#3a1f6b', ribbon: '#4a2a7a', 'ribbon-ink': '#c8f04a', cast: '#173826', 'cast-ink': '#c8f04a',
    'mast-brand': '#2f7a4c', 'mast-title': '#c8f04a', 'mast-shade': '#7b52d1', roundel: '#c8f04a', 'roundel-dot': '#7b52d1', 'roundel-price': '#4a2a7a',
    ad: '#f1ebff', 'ad-title': '#7b52d1',
  },
  cover: {
    x: 1000, W: 1000, H: 1080,
    art: { src: A('cover.webp'), rect: [0, 244, 1000, 712], fy: 0.45 },
    inks: { paper: '#fbf8f1', c: '#18a2dc', m: '#ec2f7c', y: '#ffe12e', k: '#141214' }, levels: 6,
    box: [712, 728, 262, 172],
    // this copy's own damage (js/wear.js WEAR): torn low on the open edge, coffee on the left, creased across the other
    // corners, a water stain up by the fold, a thumbprint bottom right, and the top of the fold taped where it split
    worn: { seed: 3, tear: 0.64, nick: 0.22, ring: [0.16, 0.62], creases: [[0, 0.3, 0.42, 0], [0.38, 1, 1, 0.7], [0.12, 1, 0, 0.82]],
      inner: [0.62, 0, 0.9, 0.3], stain: [0.64, 0.32], thumb: [0.97, 0.94], tapes: [[0.5, 0.012, 0, 74]] },
    heads: { src: A('heads.webp'), n: 7, size: 84 },
    html: `
      <div class="cv-band">
        <div class="cv-corner"><span>No. 3</span><i data-head="0"></i><b>10¢</b></div>
        <div class="cv-logo"><small>The Jolly Hotel presents</small><b>JOLLY</b><em>Cthulhu Comics</em></div>
        <div class="cv-seal"><small>Approved<br>by the</small><b>CATS</b><small>Code<br>Authority</small></div>
      </div>
      <div class="cv-tag"><b>Don't go in the basement!</b><span>(Lyly went in the basement.)</span></div>
      <div class="cv-art"></div>
      <div class="cv-cam"><b>●</b> CAM B1 · LIVE</div>
      <div class="cv-title"><small>Down in the cellar:</small><b>The Thing in the Keg Room!</b></div>
      <div class="cv-cast"><span>Starring</span>${['Lyly', 'YOYO', 'The Thing', 'Br. Nibble', 'Sr. Crumb', 'Br. Squeak', 'Young One'].map((n, i) => `<figure><i data-head="${i}"></i><figcaption>${n}</figcaption></figure>`).join('')}</div>`,
  },
  pixelExposure: 1.7,
  pushZoom: 1.45,
  next: 'GOING UP · 2F ↑',
  nextScene: 'motel',
  mast: `
    <div class="mast" style="left:40px;top:18px;width:1920px;height:134px">
      <div class="m-brand"><b>The Jolly</b><span>Sunday Funnies · Brooklyn, N.Y.</span></div>
      <div class="m-title"><h2>The Thing in the Keg Room</h2><span>Starring Lyly on Bass · Something in the Drain · and You-Know-Who</span></div>
      <div class="m-issue"><b>No. 3</b><span>B1 · The Cellar</span><i>10¢</i><small>or one donut</small></div>
      <button class="m-ad" data-act="ad"><b>Amazing Drain Pets!</b><span>They grow! They obey! Just add milk.</span><em>Only 10¢ · Jolly Novelty Co., Bklyn</em></button>
    </div>
    <div class="finale page-it"><b>Case Open</b><span>She runs the basement.</span></div>`,
  actions: {
    ad: api => { api.foley.play('pop'); api.toast('Order received', 'Your pet is already in the drain.', '10¢'); },
  },
  panels: [
    {
      id: 'cam', poly: [[40, 166], [520, 166], [516, 400], [40, 400]], t: 0, audio: [0, 2.6],
      art: { pixel: { t: 1.8, zoom: 1.3, at: [-0.6, 1.2, 0.2] } },
      steps: [
        [{ tag: '<b>●</b> CAM B1 · 00:06:00' }, { cap: 'Six minutes past midnight. The cellar of the Jolly.', corner: 'bl', aspect: 4.2 }],
        [{ sfx: 'drip.', x: 0.47, y: 0.3, size: 24, rot: 4, shake: false, snd: 'drip' }, { say: 'Just a rat.', kind: 'whisper', x: 0.78, y: 0.2, to: '@RAT' }],
      ],
    },
    {
      // the stairwell: the camera comes down the stairs with her, from the door to the flagstones
      id: 'stairs', poly: [[40, 418], [516, 418], [530, 1052], [40, 1052]], t: 2.6, audio: [2.6, 10.2],
      art: { img: A('p2.webp'), ph: 'LYLY AT THE FOOT OF THE CELLAR STAIRS' },
      tour: [{ at: [0.2, 0.14], z: 2.1, hold: 600 }, { at: [0.3, 0.42], z: 1.9, ms: 1500, hold: 0, ease: 'linear' }, { at: [0.45, 0.68], z: 1.55, ms: 1500, hold: 300 }, { at: 'fit', ms: 900 }],
      steps: [
        [{ cap: 'Between sets, Lyly was sent down for one keg.', corner: 'tr', aspect: 1.9 },
          { say: '♪ No talk... all bark... ♪', kind: 'whisper', who: 'lyly', x: 0.66, y: 0.34, to: [0.54, 0.46], at: 6.6 }],
        [{ cap: 'How hard could it be?', corner: 'br' }],
      ],
    },
    {
      // the floor's signature panel: the cellar is dark, and the reader holds the flashlight
      id: 'torch', poly: [[538, 166], [1230, 166], [1230, 540], [541, 540]], t: 10.2, audio: [10.2, 15.4],
      art: { img: A('p3.webp'), fy: P3.fy, ph: 'THE CELLAR: GRATE, LIPSTICK CIRCLE, HOODED RATS, CANDLES' },
      steps: [
        [{ cap: 'Something down here was awake.', shape: 'slant', tone: 'cream', x: 0.05, y: 0.05, aspect: 4.4, tilt: -1 },
          { sfx: 'blub.', x: 0.6, y: 0.52, size: 22, rot: -6, shake: false, delay: 900, snd: 'drip', sndGain: 1.2 },
          { cap: 'Then somebody lit the candles.', corner: 'br', at: 12.6 },
          { sfx: 'fft · fft · fft', x: 0.5, y: 0.36, size: 20, rot: 3, shake: false, at: 12.8, snd: false }],
        [{ cap: 'Clue · Lipstick<small>Wine red. Paw-sized.</small>', dark: true, center: true, x: 0.3, y: 0.08, tilt: 0 }],
      ],
      setup(api, p) {
        const { lit, base, light } = lightable(api, p, { dark: 0.18 });
        const flames = CANDLES.map(([fx, fy], k) => { const f = api.el('i', 'flame', p.clip); Object.assign(f.style, { left: fx * p.w + 'px', top: fy * p.h + 'px' }); return f; });
        const shh = api.item(p, { say: 'shh.', kind: 'whisper', who: 'yoyo', x: 0.83, y: 0.28, to: [SPOTS.yoyo[0], SPOTS.yoyo[1] + 0.03] });
        const R = p.h * 0.32, torch = { x: SPOTS.start[0] * p.w, y: SPOTS.start[1] * p.h };
        let on = false, aim = SPOTS.grate;
        const lightsUp = t => CANDLES.map((c, k) => t != null && t >= 12.6 + k * 0.38);
        return {
          enter: () => { on = true; },
          step: i => { aim = i ? SPOTS.lipstick : SPOTS.grate; },
          frame: () => {
            if (!on) return;
            // the torch follows the reader's pointer while it moves over the panel, otherwise drifts to what this step is about
            const ptr = api.pointer(), [x0, y0] = p.d.rect, now = performance.now();
            let tx = aim[0] * p.w, ty = aim[1] * p.h;
            if (ptr && !ptr.touch && now - ptr.t < 1600 && ptr.x > x0 && ptr.x < x0 + p.w && ptr.y > y0 && ptr.y < y0 + p.h) { tx = ptr.x - x0; ty = ptr.y - y0; }
            torch.x += (tx - torch.x) * 0.12; torch.y += (ty - torch.y) * 0.12;
            const lit8 = lightsUp(api.segTime());
            flames.forEach((f, k) => f.classList.toggle('on', lit8[k]));
            light([glow(torch.x, torch.y, R), ...CANDLES.filter((c, k) => lit8[k]).map(([fx, fy]) => glow(fx * p.w, fy * p.h + 8, p.h * 0.17, 25))]);
            if (!shh.classList.contains('on') && Math.hypot(torch.x - SPOTS.yoyo[0] * p.w, torch.y - SPOTS.yoyo[1] * p.h) < R * 0.45) api.show(p, shh);   // only if you look
          },
          leave: () => { on = false; },
          reset: () => {
            on = false; aim = SPOTS.grate; Object.assign(torch, { x: SPOTS.start[0] * p.w, y: SPOTS.start[1] * p.h });
            base(); light([glow(torch.x, torch.y, R)]); flames.forEach(f => f.classList.remove('on')); shh.classList.remove('on');     // the page shows a pool of torchlight
          },
        };
      },
    },
    {
      id: 'rise', poly: [[1248, 166], [1960, 166], [1960, 650], [1248, 650]], t: 15.4, audio: [15.4, 20.0],
      art: { img: A('p4.webp'), ph: 'THE EYE OPENS IN THE DRAIN · TENTACLES RISE', video: A('p4.mp4'), fps: 12 },
      steps: [
        [{ fn: 'roll' }, { sfx: 'THUD.', x: 0.78, y: 0.48, size: 30, rot: 6, vt: 0.1 }, { sfx: 'SHLORRRP!', x: 0.36, y: 0.3, size: 44, rot: -8, vt: 1.2, snd: 'whip', sndGain: 0.9 },
          { say: '!!!', kind: 'shout', who: 'lyly', x: 0.6, y: 0.12, to: [0.74, 0.2], vt: 2.0 }],
        [{ note: '*Not in the job description. —Ed.', x: 0.04, y: 0.04, w: 0.4, tilt: -1.5 }],
      ],
      setup: (api, p) => api.video(p),
    },
    {
      // the arm carries the camera here; it starts on her paw and pulls back to the throne, then plays on the soundtrack's cues
      id: 'boss', poly: [[543, 558], [1230, 558], [1230, 1052], [548, 1052]], t: 20.0, audio: [20.0, 27.0],
      art: { img: A('p5.webp'), ph: 'YOYO ON HER THRONE PETTING THE TENTACLE' },
      via: [...ARM, ...ARM_IN], viaMs: 2600,
      tour: [{ at: [0.54, 0.38], z: 2.6, hold: 1300 }, { at: 'fit', ms: 1800 }],
      steps: [
        [{ say: 'Good boy.', kind: 'whisper', who: 'yoyo', x: 0.38, y: 0.2, to: [0.5, 0.34], snd: 'purr' },
          { cap: 'The Thing had a boss.', shape: 'slant', tone: 'cream', x: 0.04, y: 0.05, aspect: 3.4, delay: 3000 },
          { fn: 'chord', at: 23.0 }, { sfx: 'KRRANNG!', x: 0.8, y: 0.76, size: 54, rot: -10, at: 23.0, snd: false },
          { say: 'No bark.', kind: 'yoyo', x: 0.22, y: 0.44, to: [0.56, 0.3], max: 120, at: 24.34 },
          { say: 'All bite.', kind: 'yoyo', x: 0.87, y: 0.42, to: [0.68, 0.3], max: 120, at: 25.43 }],
        [{ note: '*She went UPSTAIRS eight minutes ago (No. 2). Don\'t ask. —Ed.', x: 0.5, y: 0.86, w: 0.46, aspect: 5, tilt: 1.5 }],
      ],
      setup(api, p) {
        const { grow, retract } = arm(api, p.page.root);
        return {
          via: k => grow(Math.min(1, k * 1.6)),          // the arm runs ahead of the camera…
          enter: () => retract(),                        // …and slides home once it has brought us here
          chord: () => { api.flash(110, '#ff3b5c'); api.shake(p); },
          leave: () => grow(0),
          reset: () => grow(0),
        };
      },
    },
    {
      ...INSET, id: 'young-one', poly: circle(536, 549, 60),
      art: { img: A('p5.webp'), fx: 0.108, fy: 0.71, zoom: 4, ph: 'THE YOUNG ONE CHEERS' },
      steps: [[{ note: '*Candle duty is a paid position. —Ed.', x: -0.2, y: 0.86, w: 1.6, aspect: 3, tilt: 2 }]],
    },
    {
      // the dropped flashlight spins on the flagstones and sweeps the cellar like a lighthouse
      id: 'exit', poly: [[1248, 668], [1548, 668], [1532, 1052], [1248, 1052]], t: 27.0, audio: [27.0, 29.2],
      art: { img: A('p6.webp'), fx: 0.42, ph: 'LYLY BOLTS UP THE STAIRS · THE FLASHLIGHT LEFT ON THE FLOOR' },
      lens: [0.86, 0.865], door: [0.1, 0.11],          // in the panel, after the crop
      steps: [
        [{ fn: 'spin' }, { say: 'YIPE!', kind: 'shout', who: 'lyly', x: 0.66, y: 0.1, to: [0.4, 0.18] }, { sfx: 'ZOOM', x: 0.36, y: 0.5, size: 36, rot: -32, delay: 300, snd: 'whip' }],
        [{ cap: 'Lyly left the keg. And the flashlight.', corner: 'br', aspect: 1.8 }],
      ],
      setup(api, p) {
        const { base, light } = lightable(api, p, { dark: 0.22 }), [lx, ly] = p.d.lens, [dx, dy] = p.d.door;
        let t0 = 0, on = false;
        const draw = k => {
          // the play's dropped torch: one and a bit turns, slowing, then easing back (cellar.js droppedTorch)
          const a = (k * 5 * Math.exp(-k * 0.25) + 1) * 180 / Math.PI, x = lx * p.w, y = ly * p.h;
          light([`conic-gradient(from ${(a - 22).toFixed(1)}deg at ${x}px ${y}px, transparent 0deg, #000 10deg, #000 34deg, transparent 44deg)`,
            glow(x, y, 50, 30), glow(dx * p.w, dy * p.h, p.w * 0.42, 20)]);
        };
        return {
          spin: () => { t0 = performance.now(); on = true; },
          frame: now => { if (on) draw((now - t0) / 1000); },
          leave: () => { on = false; },
          reset: () => { on = false; base(); draw(0); },
        };
      },
    },
    {
      id: 'closed', poly: [[1566, 668], [1960, 668], [1960, 1052], [1550, 1052]], t: 28.6, audio: [28.6, 33.0],
      art: { pixel: { t: 28.9, zoom: 2.4, at: [3.55, 1.0, -2.35], dx: 0.12, hud: false } },
      steps: [
        [{ tag: '<b>●</b> CAM B1 · 00:06:33', x: 0.05 }, { cap: 'Filed at 00:06:33. Nobody went back for the keg.', corner: 'bl', aspect: 2.8 },
          { say: 'miao.', kind: 'whisper', who: 'yoyo', x: 0.5, y: 0.2, to: '@YOYO', snd: 'meow', sndGain: 0.5 }],
        [{ fn: 'exhibit' }, { note: 'Next Sunday: Room 203.', x: 0.5, y: 0.1, w: 0.46, tilt: -2 }, { fn: 'sticker', delay: 1100 }],
      ],
      async setup(api, p) {
        const ex = api.exhibit(p, { id: 'lipstick', letter: 'C', what: 'The lipstick.', back: 12.6, pos: [0.52, 0.4] });
        const st = await api.sticker(p, { src: A('heads.webp'), i: 1 });          // she signs off: her head from the cover's cast strip
        return { ...ex, ...st, reset: () => { ex.reset(); st.reset(); } };
      },
    },
  ],
};

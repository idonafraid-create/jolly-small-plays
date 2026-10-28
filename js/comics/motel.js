// 2F · Room 203 — the Sunday page for "The Case of the Pink Stiletto".
// Panels are polygons in page px on a 2000×1080 board (slanted gutters; insets are small close-ups laid over a gutter).
// Item positions are fractions of the panel's bounding box (balloons/sfx: centre; captions: top-left, or `corner` to tuck into one).
// Panel `t` is the chapter it retells (▶ WATCH jumps there), `audio` the stretch of motel.m4a it replays ('keep' = let it run on).
const A = 'assets/comic/motel/';
// when things happen in the P6 clip (MiniMax H3 768P, s): the twitch, the sit-up, Hootsby's flash, YOYO at the window
const CUE = { twitch: 0.5, up: 1.5, flash: 1.5, kid: 2.7 };
const PAW = '<path d="M0 3.2c-2.3 0-4.1 1.6-4.1 3.4 0 1.5 1.3 2.3 4.1 2.3s4.1-.8 4.1-2.3c0-1.8-1.8-3.4-4.1-3.4z"/><circle cx="-4.6" cy="0" r="1.6"/><circle cx="-1.7" cy="-2.3" r="1.6"/><circle cx="1.7" cy="-2.3" r="1.6"/><circle cx="4.6" cy="0" r="1.6"/>';
const PAWS = [[1550, 566, 34], [1566, 540, 26], [1581, 513, 36], [1597, 487, 28], [1614, 461, 38], [1632, 437, 30]];
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin(i / n * Math.PI * 2 - Math.PI / 2)]);
const INSET = { inset: true, q: 4, maxZoom: 2.4, audio: 'keep', tilt: 0 };

export default {
  W: 2000, H: 1080,
  // No. 4's cover: the right half of the folded sheet. Codex art, lettering in code, printed on whiter stock with brighter inks.
  cover: {
    x: 1000, W: 1000, H: 1080,
    art: { src: A + 'cover.webp', rect: [0, 244, 1000, 712] },
    inks: { paper: '#fbf8f1', c: '#18a2dc', m: '#ec2f7c', y: '#ffe12e', k: '#141214' }, levels: 6,
    box: [712, 728, 262, 172],
    worn: { seed: 7 },       // a well-thumbed copy (js/wear.js)
    heads: { src: A + 'heads.webp', n: 7, size: 84 },
    html: `
      <div class="cv-band">
        <div class="cv-corner"><span>No. 4</span><i data-head="0"></i><b>10¢</b></div>
        <div class="cv-logo"><small>The Jolly Hotel presents</small><b>JOLLY</b><em>Detective Comics</em></div>
        <div class="cv-seal"><small>Approved<br>by the</small><b>CATS</b><small>Code<br>Authority</small></div>
      </div>
      <div class="cv-tag"><b>Who signed the mirror...?</b><span>and why is the victim smiling?</span></div>
      <div class="cv-art"></div>
      <div class="cv-cam"><b>●</b> CAM 203 · LIVE</div>
      <div class="cv-title"><small>The case of the</small><b>Pink Stiletto!</b></div>
      <div class="cv-cast"><span>Starring</span>${['Jojo', 'Lyly', 'YOYO', 'Mr. Bunny', 'Hootsby', 'Mr. Slowe', 'Mrs. Fluff'].map((n, i) => `<figure><i data-head="${i}"></i><figcaption>${n}</figcaption></figure>`).join('')}</div>`,
  },
  pixelExposure: 1.4,
  pushZoom: 1.7,            // how far the footage camera pushes in on the room before the frame is printed
  next: 'GOING DOWN · B1 ↓',
  mast: `
    <div class="mast" style="left:40px;top:18px;width:1920px;height:134px">
      <div class="m-brand"><b>The Jolly</b><span>Sunday Funnies · Brooklyn, N.Y.</span></div>
      <div class="m-title"><h2>The Case of the Pink Stiletto</h2><span>Starring Detective Jojo · Officer Lyly · and You-Know-Who</span></div>
      <div class="m-issue"><b>No. 4</b><span>2F · Room 203</span><i>10¢</i><small>or one donut</small></div>
      <button class="m-ad" data-act="ad"><b>Opera Glasses!</b><span>See what cats don't want you to see.</span><em>Only 25¢ · Jolly Novelty Co., Bklyn</em></button>
    </div>
    <svg class="paws page-it" viewBox="0 0 2000 1080">${PAWS.map(([x, y, r], i) => `<g style="--i:${i}" transform="translate(${x} ${y}) rotate(${r}) scale(1.4)">${PAW}</g>`).join('')}</svg>
    <div class="finale page-it"><b>Case Closed</b><span>It was always YOYO.</span></div>`,
  actions: {
    ad: api => { api.foley.play('pop'); api.toast('Order received', 'Allow 6–8 weeks for delivery.', '25¢'); },
  },
  panels: [
    {
      id: 'scene', poly: [[40, 166], [700, 166], [664, 598], [40, 598]], t: 0, audio: [0, 3.2],
      art: { pixel: { t: 1.6, zoom: 1.55, at: [-1.45, 0.7, 1.05] } },
      steps: [
        [{ tag: '<b>●</b> CAM 203 · 00:13:01' }, { cap: 'Room 203, the Jolly Hotel. Thirteen minutes past midnight.', corner: 'bl', aspect: 3.4 }],
        [{ say: 'I heard a squeak!', x: 0.15, y: 0.3, to: '@MRS. FLUFF' }, { say: 'my... car... pet...', kind: 'whisper', slow: 150, x: 0.43, y: 0.52, to: '@MR. SLOWE' }],
        [{ say: 'BARK!*', kind: 'shout', who: 'lyly', x: 0.8, y: 0.25, to: '@LYLY' }, { note: '*Nobody move. —Translated from the Bark. —Ed.', x: 0.33, y: 0.04, w: 0.42, tilt: -1.5 }],
      ],
    },
    {
      // close-up laid over the gutter: who the victim is, before Jojo starts looking
      ...INSET, id: 'victim-face', poly: [[574, 452], [766, 440], [776, 586], [584, 598]],
      art: { img: A + 'p6.webp', fx: 0.395, fy: 0.625, zoom: 4.6, ph: 'MR. BUNNY, EYES SHUT' },
      steps: [[{ cap: 'The victim: Mr. Bunny.', tone: 'cream', center: true, x: 0.5, y: 0.72, aspect: 6, tilt: 2 }]],
    },
    {
      id: 'glasses', poly: [[718, 166], [1070, 166], [1070, 598], [682, 598]], t: 3.2, audio: [3.2, 7.0],
      art: { img: A + 'p2.webp', ph: 'JOJO RAISES THE OPERA GLASSES' },
      lenses: [[537, 397], [725, 397], 44],          // the two dark lenses in p2.webp (image px) and the radius of their black
      steps: [
        [{ cap: 'Detective Jojo does not talk.', corner: 'tr', aspect: 2.4 }],
        [{ say: '...', kind: 'thought', who: 'jojo', x: 0.26, y: 0.24, to: [0.44, 0.34] }, { cap: 'Jojo looks.', corner: 'br' }],
      ],
      // light sweeps across both lenses every few seconds while the panel is read, kept inside their black
      setup(api, p) {
        const [a, b, r] = p.d.lenses, k = p.h / 1254, x0 = (1254 - p.w / k) / 2;     // p2.webp is 1254² and covers the panel
        const glints = [a, b].map(([x, y]) => {
          const g = api.el('div', 'lens-glint', p.clip, '<i></i>');
          Object.assign(g.style, { left: (x - x0 - r) * k + 'px', top: (y - r) * k + 'px', width: 2 * r * k + 'px', height: 2 * r * k + 'px' });
          return g;
        });
        let timer = 0;
        const sweep = () => glints.forEach((g, i) => { g.classList.remove('on'); void g.offsetWidth; g.style.setProperty('--d', i * 70 + 'ms'); g.classList.add('on'); });
        const stop = () => { clearInterval(timer); timer = 0; glints.forEach(g => g.classList.remove('on')); };
        return {
          enter: () => { stop(); setTimeout(sweep, 500); timer = setInterval(sweep, 2800); },
          leave: stop,
          reset: stop,
        };
      },
    },
    {
      // the floor's signature panel: the page itself looks through the opera glasses
      id: 'lens', poly: [[1088, 166], [1600, 166], [1572, 598], [1088, 598]], t: 7.0, audio: [7.0, 13.5], cls: 'bino',
      art: { img: A + 'p3.webp', ph: 'EVIDENCE: STUFFING, LIPSTICK PAW PRINTS, THE OPEN LATCH' },
      spots: [[0.2, 0.8], [0.56, 0.68], [0.74, 0.19]],          // plate fractions: stuffing, the paw-print trail, the open latch
      steps: [
        [{ cap: 'Clue 01 · Stuffing<small>The victim is plush.</small>', dark: true, center: true, x: 0.5, y: 0.83, tilt: 0 }],
        [{ cap: 'Clue 02 · Paw prints<small>Size 2. Cat. Lipstick.</small>', dark: true, center: true, x: 0.5, y: 0.83, tilt: 0 }],
        [{ cap: 'Clue 03 · The window<small>Unlatched from outside.</small>', dark: true, center: true, x: 0.5, y: 0.83, tilt: 0 }],
      ],
      async setup(api, p) {
        const { el, svgEl } = api, Z = 2.1, PW = p.w * Z, PH = p.h * Z;
        const view = el('div', 'lensview', p.clip), plate = api.print(p.src, Math.round(PW * api.Q), Math.round(PH * api.Q));
        plate.className = 'plate'; Object.assign(plate.style, { width: PW + 'px', height: PH + 'px' }); view.appendChild(plate);
        p.cv.style.visibility = 'hidden';
        p.root.style.setProperty('--R', Math.round(p.h * 0.3) + 'px');
        const rings = svgEl('svg', p.clip, { class: 'rings', viewBox: `0 0 ${p.w} ${p.h}` });
        // only the outline of the two lenses together, as in the footage (no arcs across the overlap)
        const r = p.h * 0.3, cy = p.h * 0.47, mx = p.w / 2, hh = Math.sqrt(r * r - (0.18 * p.w) ** 2);
        svgEl('path', rings, { d: `M${mx},${cy - hh}A${r},${r} 0 1 0 ${mx},${cy + hh}A${r},${r} 0 1 0 ${mx},${cy - hh}Z` });
        const look = (i, ms) => {
          const [fx, fy] = p.d.spots[i];
          const x = Math.min(0, Math.max(p.w - PW, p.w / 2 - fx * PW)), y = Math.min(0, Math.max(p.h - PH, p.h * 0.47 - fy * PH));
          plate.style.transition = ms ? `transform ${ms}ms cubic-bezier(.6,0,.25,1)` : 'none';
          plate.style.transform = `translate(${x}px,${y}px)`;
        };
        look(0, 0);
        return {
          step: i => { look(i, 1000); p.steps.forEach((s, j) => j !== i && s.forEach(it => it.classList.remove('on'))); },
          reset: () => look(0, 0),
          leave: () => p.page.root.querySelector('.paws').classList.add('on'),     // her prints walk off this panel toward the window
        };
      },
    },
    {
      id: 'bolt', poly: [[1618, 166], [1960, 166], [1960, 598], [1590, 598]], t: 14.6, audio: [13.5, 17.3],
      art: { img: A + 'p4.webp', ph: 'LIGHTNING: A SMALL CAT SILHOUETTE WITH AN UMBRELLA ON THE FIRE ESCAPE' },
      steps: [
        [{ fn: 'bolt' }, { sfx: 'KRAKA-BOOM!', x: 0.56, y: 0.14, size: 44, rot: -9, delay: 90, snd: false }, { cap: 'Then the storm said something.', shape: 'slant', tone: 'cream', x: 0.12, y: 0.6, w: 0.8, aspect: 2.6, delay: 1300 }],
        [{ cap: 'Suspect · YOYO<small>Threat level ♡♡♡♡♡</small>', dark: true, center: true, x: 0.54, y: 0.82, tilt: 0 }],
      ],
      setup(api, p) {
        const lit = api.print(p.src, p.cv.width, p.cv.height, { exposure: 1.12, flash: 0.05 }), dark = api.print(p.src, p.cv.width, p.cv.height, { exposure: 0.55 });
        const g = p.cv.getContext('2d'), draw = c => g.drawImage(c, 0, 0);
        let timers = [];
        draw(dark);
        return {
          bolt: () => {
            api.foley.play('boom');
            timers = [[0, lit], [70, dark], [140, lit], [230, dark], [560, lit]].map(([ms, c]) => setTimeout(() => { draw(c); if (c === lit) api.flash(70, '#eef3ff'); }, ms));
          },
          reset: () => { timers.forEach(clearTimeout); draw(dark); },
        };
      },
    },
    {
      id: 'signed', poly: [[40, 616], [480, 616], [452, 1052], [40, 1052]], t: 18.3, audio: [17.3, 23.0],
      art: { img: A + 'p5.webp', ph: 'LYLY IN THE MIRROR · THE DONUT FALLS' },
      mirror: { x: 0.5, y: 0.15, size: 40, rot: -6 },
      steps: [
        [{ fn: 'dark' }, { sfx: 'CLICK.', x: 0.5, y: 0.4, size: 40, rot: 0, fill: '#f2e8d0', shade: '#3a3436', shake: false, delay: 200, snd: 'click' },
          { cap: 'The lights went out for one second.', tone: 'cream', center: true, x: 0.5, y: 0.56, aspect: 2.8, delay: 700 }],
        [{ fn: 'lights' }, { fn: 'write', delay: 700 }],
        [{ cap: 'Of course.', corner: 'tl' }],
      ],
      setup(api, p) {
        const black = api.el('div', 'blackout', p.clip), m = p.d.mirror;
        const sig = api.el('div', 'lipstick', p.ov, 'YOYO 200% ♡');
        Object.assign(sig.style, { left: m.x * p.w + 'px', top: m.y * p.h + 'px', fontSize: m.size + 'px' }); sig.style.setProperty('--rot', m.rot + 'deg');
        return {
          dark: () => { black.style.transition = 'none'; black.style.opacity = 1; },
          lights: () => {
            p.steps[0].forEach(it => it.classList.remove('on'));
            black.animate([{ opacity: 1 }, { opacity: 0.1 }, { opacity: 0.9 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }).onfinish = () => { black.style.opacity = 0; };
          },
          write: () => { sig.classList.add('on'); api.foley.play('squeak'); },
          reset: () => { black.getAnimations().forEach(a => a.cancel()); black.style.opacity = 0; sig.classList.remove('on'); },
        };
      },
    },
    {
      ...INSET, id: 'donut', poly: circle(467, 962, 66),
      art: { img: A + 'p5.webp', fx: 0.22, fy: 0.74, zoom: 3.1, ph: 'THE DONUT, FALLING' },
      steps: [[{ sfx: 'PLOP.', x: 0.62, y: 0.8, size: 26, rot: 8 }]],
    },
    {
      id: 'victim', poly: [[498, 616], [1110, 616], [1130, 1052], [470, 1052]], t: 24.0, audio: [23.0, 25.6],
      art: { img: A + 'p6.webp', ph: 'THE PLUSH VICTIM SITS UP · YOYO WINKS AT THE WINDOW', video: A + 'p6.mp4', fps: 12 },
      steps: [
        [{ fn: 'roll' }, { cap: 'Then the victim moved.', corner: 'br' }, { sfx: 'twitch.', x: 0.44, y: 0.66, size: 26, rot: -4, shake: false, vt: CUE.twitch, snd: 'creak', sndGain: 0.6 },
          { sfx: 'BOING!', x: 0.3, y: 0.3, size: 42, rot: -12, vt: CUE.up }, { fn: 'bulb', vt: CUE.flash },
          { say: 'JUST KIDDING!', kind: 'yoyo', x: 0.78, y: 0.07, to: [0.5, 0.24], max: 150, vt: CUE.kid }],
        [{ note: 'Mr. Slowe went into his shell and did not come out until Tuesday.', x: 0.08, y: 0.03, w: 0.42, aspect: 4, tilt: -1.5 }],
      ],
      setup: (api, p) => api.video(p, { bulb: () => { api.flash(60, '#ffffff'); api.foley.play('flash'); } }),    // Hootsby's flashbulb goes off
    },
    {
      id: 'stiletto', poly: [[1128, 616], [1500, 616], [1480, 1052], [1148, 1052]], t: 25.6, audio: [25.6, 28.0],
      // the clip (MiniMax H3): he clips it on (~0.8 s, a glint), opens his eyes (~1.5 s), tips his hat (~2.6 s)
      art: { img: A + 'p7.webp', ph: 'JOJO CLIPS THE PINK STILETTO BACK ON THE TIE', video: A + 'p7.mp4', fps: 12 },
      steps: [
        [{ fn: 'roll' }, { cap: 'And the pink stiletto, missing since the blackout downstairs...', corner: 'tl', aspect: 2.4, w: 0.72 },
          { sfx: 'click.', x: 0.62, y: 0.6, size: 24, rot: 8, shake: false, vt: 0.8, snd: 'lights', sndGain: 0.6 },
          { cap: '...went back where it belongs.', shape: 'tab', x: 0.07, y: 0.85, aspect: 3.4, vt: 1.5 },
          { sfx: 'tip.', x: 0.14, y: 0.34, size: 22, rot: -10, shake: false, vt: 2.7, snd: 'swish', sndGain: 2 }],
        [{ say: '.*', who: 'jojo', x: 0.15, y: 0.44, to: [0.38, 0.5] }, { note: '*Jojo\'s longest speech this year. —Ed.', x: 0.04, y: 0.56, w: 0.42, tilt: 1.5 }],
      ],
      setup: (api, p) => api.video(p),
    },
    {
      ...INSET, id: 'clip', poly: circle(1500, 742, 58),
      art: { img: A + 'p7.webp', fx: 0.535, fy: 0.745, zoom: 6, ph: 'THE STILETTO TIE CLIP' },
      steps: [[{ sfx: 'TING!', x: 0.7, y: 0.2, size: 24, rot: 12, shake: false, snd: 'ting' }]],
    },
    {
      id: 'closed', poly: [[1518, 616], [1960, 616], [1960, 1052], [1498, 1052]], t: 28.0, audio: [28.0, 34.0],
      art: { pixel: { t: 33.5 } },
      steps: [
        [{ tag: '<b>●</b> CAM 203 · 00:13:34', x: 0.07 }, { cap: 'Filed at 00:13:34. No charges.', corner: 'tr', aspect: 2.6 }],
        [{ fn: 'exhibit' }, { note: 'Next Sunday: she does it again.', x: 0.48, y: 0.22, w: 0.48, tilt: -2 }],
      ],
      setup: (api, p) => api.exhibit(p, { id: 'stiletto', letter: 'D', what: 'The pink stiletto.', back: 26.2 }),
    },
  ],
};

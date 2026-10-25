// 1F · the Jolly Club — the Sunday page for "No Talk, All Bark" (issue No. 1: where the story starts, 23:47).
// Same board as the others (2000×1080, polygons in page px, item positions as fractions of a panel's box). Its tricks:
// a strip of piano keys the camera plays on the beat, and a blackout that switches off the whole page.
const A = name => `assets/comic/bar/${name}?v=2`;     // bump when the art changes
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin(i / n * Math.PI * 2 - Math.PI / 2)]);
const INSET = { inset: true, q: 4, maxZoom: 2.4, audio: 'keep', tilt: 0 };

// bar.json beats from the first bark on; the camera moves one key every other beat
const KEY_BEATS = [5.089, 6.11, 7.155, 8.177, 9.199, 10.22];
// the second chorus, where the JOLLY sign flashes on every beat (as in the footage from 16.7 s)
const SIGN_BEATS = [16.884, 17.395, 17.906, 18.417, 18.928, 19.462, 19.973, 20.483, 20.994, 21.505, 22.016];
const STRIP = { x0: 898, x1: 1500, y0: 166, y1: 598, gap: 8, keys: 6 };
const KEY_W = (STRIP.x1 - STRIP.x0 - STRIP.gap * (STRIP.keys - 1)) / STRIP.keys;
const KB = 48;                                         // the keyboard band along the top of the strip, page px
const keyMid = i => (i * (KEY_W + STRIP.gap) + KEY_W / 2) / (STRIP.x1 - STRIP.x0);       // as a fraction of the strip
const BARKS = [['OINK— er, BARK!', ''], ['...bark.', ''], ['CAW— BARK!', ''], ['WHO— BARK!', ''], ['BARK! BARK!', ''], ['zzz... bark.', 'whisper']];
// what each one sounds like: their own call, then a bark ([name, delay s, gain, rate])
const VOICES = [[['oink', 0], ['bark', 0.42]], [['meow', 0, 0.6], ['bark', 0.5, 0.35, 1.25]], [['caw', 0], ['bark', 0.4]], [['hoot', 0], ['bark', 0.36]],
  [['bark', 0, 0.8, 1.3], ['bark', 0.24, 0.8, 1.15]], [['bark', 0.15, 0.4, 0.78]]];

// The dance floor's mirror ball hangs out of frame above the floor; only its light is in the panel. Worked out, not faked:
// two pin spots (warm white from front left, a weaker rose from the right, the neon's colour) light the ball, every lit
// facet throws a beam, and a spot lands where the beam meets the room. The room (metres: floor y = 0, back wall z = -D,
// side walls x = XL / XR, ceiling C) is seen through a camera fitted to the painting, so the floor grid lies on the
// checkerboard and its far edge on the booths' wall. Turning the ball (1 rpm, the usual motor) wheels the floor spots in
// foreshortened arcs and slides the wall spots along; far spots are bigger and fainter, slanting ones stretch, and spots
// come and go as facets turn into and out of a pin spot's light. The spots are drawn into a light map that the press
// adds to the art before printing it, so they come out in halftone dots like the rest of the page.
const BALL = {
  at: [1.2, 4.0, -8.5], rpm: 1, facets: 180, room: { D: 13, XL: -7.5, XR: 8, C: 4.6 }, cam: { h: 3, pitch: 17, f: 1.027 },  // f: × panel width
  pins: [[[-6, 4.3, -1], '255,236,200', 1], [[7, 4.3, -3], '255,140,190', 0.55]],                                      // where, colour, strength
  gain: 1.6, fps: 24,                     // how strong the light is; how often the panel is re-printed while it's in view
};
function ballLight(api, p) {
  const { at: B, room: { D, XL, XR, C }, cam: K } = BALL, f = K.f * p.w, sp = Math.sin(K.pitch * Math.PI / 180), cp = Math.cos(K.pitch * Math.PI / 180);
  const proj = (x, y, z) => { const dy = y - K.h, depth = -dy * sp - z * cp; return [p.w / 2 + f * x / depth, p.h / 2 - f * (dy * cp - z * sp) / depth]; };
  const PLANES = [[1, 0, [0, 1, 0]], [2, -D, [0, 0, 1]], [0, XL, [1, 0, 0]], [0, XR, [-1, 0, 0]], [1, C, null]];    // the ceiling's out of frame
  const hit = r => {
    let best = null;
    for (const [ax, v, n] of PLANES) {
      const t = (v - B[ax]) / r[ax];
      if (!(t > 0.05) || (best && t >= best[0])) continue;
      const P = [B[0] + r[0] * t, B[1] + r[1] * t, B[2] + r[2] * t];
      if (P[0] >= XL - 1e-3 && P[0] <= XR + 1e-3 && P[1] >= -1e-3 && P[1] <= C + 1e-3 && P[2] >= -D - 1e-3) best = [t, P, n];
    }
    return best?.[2] && best[1][2] < -1.5 ? best : null;                          // nearer than that is beside or behind the camera
  };
  const nrm = Array.from({ length: BALL.facets }, (_, i) => {                     // facets evenly over the ball
    const y = 1 - 2 * (i + 0.5) / BALL.facets, r = Math.sqrt(1 - y * y), a = (i + 0.5) * Math.PI * (3 - Math.sqrt(5));
    return [r * Math.cos(a), y, r * Math.sin(a)];
  });
  const S = 0.5, map = api.el('canvas'), g = map.getContext('2d');                // the light map, at half the panel's page px
  map.width = Math.round(p.w * S); map.height = Math.round(p.h * S);
  const pins = BALL.pins.map(([P0, col, k]) => {
    const L = [B[0] - P0[0], B[1] - P0[1], B[2] - P0[2]], l = Math.hypot(...L);
    const fill = g.createRadialGradient(0, 0, 0, 0, 0, 1);                         // one spot: a unit disc, soft at the rim
    [[0, 1], [0.5, 1], [0.78, 0.4], [1, 0]].forEach(([at, o]) => fill.addColorStop(at, `rgba(${col},${o})`));
    return { L: L.map(v => v / l), k, fill };
  });
  let seen = false, frame = -1;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(p.root);
  return now => {
    const fr = Math.floor(now / 1000 * BALL.fps);
    if (!seen || fr === frame || !p.src) return;
    frame = fr;
    const a = now / 1000 * BALL.rpm * Math.PI / 30, ca = Math.cos(a), sa = Math.sin(a);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = '#000'; g.fillRect(0, 0, map.width, map.height);
    g.globalCompositeOperation = 'lighter';
    for (const pin of pins) {
      const L = pin.L;
      g.fillStyle = pin.fill;
      for (const q of nrm) {
        const nx = q[0] * ca + q[2] * sa, ny = q[1], nz = q[2] * ca - q[0] * sa;
        const ln = L[0] * nx + L[1] * ny + L[2] * nz;
        if (ln > -0.05) continue;                                                  // turned away from this pin spot
        const r = [L[0] - 2 * ln * nx, L[1] - 2 * ln * ny, L[2] - 2 * ln * nz], h = hit(r);
        if (!h) continue;
        const [dist, P, N] = h, [sx, sy] = proj(...P);
        if (sx < -30 || sx > p.w + 30 || sy < -30 || sy > p.h + 30) continue;
        // the beam's footprint: radius growing with the throw, stretched along the surface by the slant it comes in at
        const rn = r[0] * N[0] + r[1] * N[1] + r[2] * N[2], rs = 0.05 + 0.022 * dist, slant = Math.max(0.3, Math.abs(rn));
        let u = [r[0] - rn * N[0], r[1] - rn * N[1], r[2] - rn * N[2]], ul = Math.hypot(...u);
        u = ul > 1e-3 ? u.map(c => c / ul) : (N[1] ? [1, 0, 0] : [0, 1, 0]);
        const v = [N[1] * u[2] - N[2] * u[1], N[2] * u[0] - N[0] * u[2], N[0] * u[1] - N[1] * u[0]], su = rs / slant;
        const [ax, ay] = proj(P[0] + u[0] * su, P[1] + u[1] * su, P[2] + u[2] * su), [bx, by] = proj(P[0] + v[0] * rs, P[1] + v[1] * rs, P[2] + v[2] * rs);
        g.globalAlpha = Math.min(1, Math.sqrt(-ln) * pin.k * BALL.gain / (1 + (dist / 18) ** 2));
        g.setTransform(S * (ax - sx), S * (ay - sy), S * (bx - sx), S * (by - sy), S * sx, S * sy);
        g.fillRect(-1, -1, 2, 2);
      }
    }
    api.bake(p, p.src, { ...p.d.art, light: map });
  };
}

export default {
  W: 2000, H: 1080,
  // No. 1's colours (No. 4 is red and yellow, No. 3 green and violet): club navy, coral pink, a sky-blue strip
  palette: {
    band: '#1f3a78', 'band-dot': '#172d61', logo: '#ff8f9c', 'logo-3d': '#c9952e', price: '#1f3a78', seal: '#1f3a78',
    tag: '#9cc7f0', 'tag-ink': '#14244f', ribbon: '#14244f', 'ribbon-ink': '#ff8f9c', cast: '#5a1630', 'cast-ink': '#f2c14e',
    'mast-brand': '#1f3a78', 'mast-title': '#ff8f9c', 'mast-shade': '#1f3a78', roundel: '#9cc7f0', 'roundel-dot': '#1f3a78', 'roundel-price': '#c0304a',
    ad: '#fff1f3', 'ad-title': '#1f3a78',
  },
  cover: {
    x: 1000, W: 1000, H: 1080,
    art: { src: A('cover.webp'), rect: [0, 244, 1000, 712] },
    inks: { paper: '#fbf8f1', c: '#18a2dc', m: '#ec2f7c', y: '#ffe12e', k: '#141214' }, levels: 6,
    box: [26, 282, 262, 172],                          // the footage lands top left on this one
    // this copy's damage: torn high on the open edge, coffee bottom right, creased from the other corners, a stain up
    // on the left page, a thumbprint top left, and tape down the right edge where it was nicked
    worn: { seed: 11, tear: 0.2, nick: 0.85, ring: [0.62, 0.86], creases: [[0, 0.55, 0.5, 1], [0.8, 0, 1, 0.42], [0.3, 0, 0.62, 0.3]],
      inner: [0.55, 1, 0.78, 0.55], stain: [0.2, 0.24], thumb: [0.04, 0.07], tapes: [[0.992, 0.85, Math.PI / 2, 62]] },
    heads: { src: A('heads.webp'), n: 7, size: 84 },
    html: `
      <div class="cv-band">
        <div class="cv-corner"><span>No. 1</span><i data-head="0"></i><b>10¢</b></div>
        <div class="cv-logo"><small>The Jolly Hotel presents</small><b>JOLLY</b><em>Swing Comics</em></div>
        <div class="cv-seal"><small>Approved<br>by the</small><b>CATS</b><small>Code<br>Authority</small></div>
      </div>
      <div class="cv-tag"><b>Keep your eye on the tie clip!</b><span>(Nobody did.)</span></div>
      <div class="cv-art"></div>
      <div class="cv-cam"><b>●</b> CAM 1F · LIVE</div>
      <div class="cv-title"><small>Live at the Jolly Club:</small><b>No Talk, All Bark!</b></div>
      <div class="cv-cast"><span>Starring</span>${['Jojo', 'Lyly', 'Mme. Lapin', 'Felix', 'Walter', 'Callie', '???'].map((n, i) => `<figure><i data-head="${i}"></i><figcaption>${n}</figcaption></figure>`).join('')}</div>`,
  },
  pixelExposure: 1.3,
  pushZoom: 1.35,
  next: 'NEXT ISSUE · BACK ALLEY →',
  nextScene: 'alley',
  mast: `
    <div class="mast" style="left:40px;top:18px;width:1920px;height:134px">
      <div class="m-brand"><b>The Jolly</b><span>Sunday Funnies · Brooklyn, N.Y.</span></div>
      <div class="m-title"><h2>No Talk, All Bark</h2><span>Starring Jojo on Sax · Lyly on Bass · and the Whole Jolly Club</span></div>
      <div class="m-issue"><b>No. 1</b><span>1F · The Jolly Club</span><i>10¢</i><small>or one donut</small></div>
      <button class="m-ad" data-act="ad"><b>Pink Stiletto Tie Clips!</b><span>As worn by Jojo of the Jolly band.</span><em>15¢ · while supplies last · Jolly Novelty Co.</em></button>
    </div>
    <div class="finale page-it"><b>Case Open</b><span>Somebody took the pink stiletto.</span></div>`,
  actions: {
    ad: api => { api.foley.play('pop'); api.toast('Sold out', 'Somebody took the last one.', '15¢'); },
  },
  // page-wide: the mirror ball's light keeps turning whatever the camera is on
  setup(api, page) {
    const wb = page.panels.find(p => p.d.id === 'waveband');
    return { frame: now => wb.fx.light?.(now) };
  },
  panels: [
    {
      id: 'doors', poly: [[40, 166], [410, 166], [395, 598], [40, 598]], t: 0, audio: [0, 2.0],
      art: { pixel: { t: 1.0, zoom: 1.25, at: [-0.6, 1.2, 0.2], hud: false, marks: { EXIT: [-6.45, 2.6, 2.85] } } },     // where the exit sign is (bar.js)
      steps: [
        [{ tag: '<b>●</b> CAM 1F · 23:47:00' }, { cap: '23:47. The Jolly Club, Brooklyn. Saturday night.', corner: 'bl', aspect: 2.4 }],
        [{ note: '*House rules: everybody barks along. —Mgmt.', x: 0.1, y: 0.12, w: 0.8, tilt: -1.5 }],
      ],
    },
    {
      id: 'downbeat', poly: [[428, 166], [880, 166], [880, 598], [413, 598]], t: 2.0, audio: [2.0, 5.0],
      art: { img: A('p2.webp'), ph: 'THE BAND ON STAGE' },
      tie: [0.235, 0.475],                              // the pink stiletto tie clip, in the panel
      steps: [
        [{ cap: 'Jojo plays sax at the Jolly on Saturdays.', corner: 'tl', aspect: 2.6 }],
        [{ sfx: 'BWAAP!', x: 0.22, y: 0.3, size: 40, rot: -10 }, { sfx: 'THWUMP!', x: 0.8, y: 0.62, size: 34, rot: 8, delay: 300 }],
        [{ note: '*He still does not talk. —Ed.', x: 0.52, y: 0.06, w: 0.44, tilt: 1.5 }, { fn: 'push', delay: 600 }],
      ],
      // the last step leans in on the tie clip; the inset beside it takes over from there
      setup: (api, p) => ({ push: () => api.look(p, p.d.tie, 2.4, 1100) }),
    },
    {
      ...INSET, id: 'tie-clip', poly: circle(880, 470, 58),
      art: { img: A('p2.webp'), fx: 0.234, fy: 0.47, zoom: 8, ph: 'THE PINK STILETTO TIE CLIP' },
      steps: [[{ sfx: 'TING!', x: 0.72, y: 0.2, size: 24, rot: 12, shake: false, snd: 'ting' }, { cap: 'Remember this tie clip.', tone: 'cream', center: true, x: 0.5, y: 0.78, aspect: 5, tilt: -2 }]],
    },
    {
      // the camera plays the piano: one key (one patron) every other beat, then it steps back to see the whole row
      id: 'all-bark', poly: [[STRIP.x0, STRIP.y0], [STRIP.x1, STRIP.y0], [STRIP.x1, STRIP.y1], [STRIP.x0, STRIP.y1]], t: 5.0, audio: [5.0, 11.0], tilt: 0,
      art: { img: A('p3.webp'), ph: 'SIX PATRONS BARKING' },
      steps: [
        [{ cap: '♪ No talk. All bark. ♪', tone: 'cream', center: true, x: 0.72, y: 0.89, aspect: 6, tilt: 1 },
          ...BARKS.map(([say, kind], i) => ({ say, kind, x: keyMid(i), y: 0.2 + (i % 2) * 0.06, to: [keyMid(i), 0.3], w: 0.16, aspect: 1.1, max: 40, at: KEY_BEATS[i] }))],
        [{ note: '*Non-dogs bark at their own risk. —Ed.', x: 0.03, y: 0.87, w: 0.38, aspect: 3.6, tilt: -1 }],
      ],
      setup(api, p) {
        const k = STRIP.x1 - STRIP.x0;
        for (let i = 1; i < STRIP.keys; i++) {
          const g = api.el('i', 'keygap', p.clip);
          Object.assign(g.style, { left: i * (KEY_W + STRIP.gap) - STRIP.gap - 4 + 'px', width: STRIP.gap + 'px' });
        }
        // the top of the panel is the keyboard itself: six ivory keys over the six strips, and black keys between them
        // (two, a gap, two), so the strips below read as the keys' long white fronts
        for (let i = 0; i < STRIP.keys; i++) {
          const w = api.el('i', 'whitekey', p.clip);
          Object.assign(w.style, { left: i * (KEY_W + STRIP.gap) + 'px', width: KEY_W + 'px', height: KB + 'px' });
        }
        for (const i of [1, 2, 4, 5]) {
          const b = api.el('i', 'blackkey', p.clip), x = i * (KEY_W + STRIP.gap) - STRIP.gap / 2;
          Object.assign(b.style, { left: x - 22 + 'px', width: '44px', height: KB * 0.66 + 'px' });
        }
        let on = false, at = -1;
        return {
          enter: () => { on = true; at = -1; },
          frame: () => {
            if (!on) return;
            const t = api.segTime(), n = KEY_BEATS.filter(b => t >= b).length;
            if (t >= 10.9) { on = false; api.camTo(api.fit(p), 700); return; }
            if (n > 0 && n !== at) {
              at = n; api.look(p, [keyMid(n - 1), 0.3], 1.7, 170);
              for (const [k, d, g = 1, r = 1] of VOICES[n - 1]) api.foley.play(k, { at: d, gain: g, rate: r });
            }
          },
          leave: () => { on = false; },
          reset: () => { on = false; at = -1; },
        };
      },
    },
    {
      id: 'martini', poly: [[1518, 166], [1960, 166], [1960, 598], [1518, 598]], t: 10.22, audio: [10.2, 13.1],
      art: { img: A('p4.webp'), ph: 'THE BASS CLIPS THE TRAY · THE MARTINI FLIES', video: A('p4.mp4'), fps: 12 },
      steps: [
        // cues from the clip (H3): the bass clips the tray ~0.8 s, the glass is up ~1.3 s, in Jojo's paw by ~2.0 s
        [{ fn: 'roll' }, { sfx: 'WHUMP!', x: 0.38, y: 0.5, size: 40, rot: -8, vt: 0.8 }, { sfx: 'whee—', x: 0.6, y: 0.08, size: 26, rot: -14, shake: false, vt: 1.3, snd: 'whip', sndGain: 0.6 },
          { sfx: 'plink.', x: 0.66, y: 0.2, size: 24, rot: 6, shake: false, vt: 2.0, snd: 'clink' }],
        [{ cap: 'No talk.', corner: 'br' }],
        [{ note: '*Not a drop spilled. Felix was not tipped. —Ed.', x: 0.06, y: 0.04, w: 0.5, aspect: 4, tilt: -1.5 }],
      ],
      setup: (api, p) => api.video(p),
    },
    {
      id: 'waveband', poly: [[40, 616], [780, 616], [760, 1052], [40, 1052]], t: 16.7, audio: [16.6, 22.5],
      art: { img: A('p5.webp'), fy: 0, ph: 'THE DANCE FLOOR · THE SECOND CHORUS' },        // cropped from the top: the sign is up there
      sign: [0.8, 0.05, 30, -3], paper: [0.515, 0.235, 7, -3],                    // in the panel: the neon sign, Prof. Hoot's late edition
      tour: [{ at: [0.3, 0.5], z: 1.6, hold: 400 }, { at: [0.7, 0.5], z: 1.6, ms: 2600, ease: 'linear', hold: 200 }, { at: 'fit', ms: 900 }],
      steps: [
        [{ cap: 'By the second chorus, the whole room was barking.', corner: 'bl', aspect: 3.2 }],
        [{ note: '←*That door goes to the cellar. Remember it. —Ed.', x: 0.25, y: 0.02, w: 0.3, aspect: 3.4, tilt: 1.5 }],
      ],
      setup(api, p) {
        const [sx, sy, ss, sr] = p.d.sign, [nx, ny, ns, nr] = p.d.paper;
        const neon = api.el('div', 'neon', p.ov, 'THE JOLLY');
        Object.assign(neon.style, { left: sx * p.w + 'px', top: sy * p.h + 'px' }); neon.style.setProperty('--size', ss + 'px'); neon.style.setProperty('--rot', sr + 'deg');
        const head = api.el('div', 'headline', p.ov, 'STILETTO<br>STOLEN!');   // tomorrow's news, already in the late edition
        Object.assign(head.style, { left: nx * p.w + 'px', top: ny * p.h + 'px' }); head.style.setProperty('--size', ns + 'px'); head.style.setProperty('--rot', nr + 'deg');
        return {
          light: ballLight(api, p),                                             // the mirror ball's light (see BALL); the page turns it
          frame: () => {
            const t = api.segTime(); if (t == null) return;
            const b = SIGN_BEATS.filter(x => x <= t).pop();
            neon.classList.toggle('dim', b != null && t - b > 0.25 && t < 22.5);
          },
          reset: () => neon.classList.remove('dim'),
        };
      },
    },
    {
      // the floor's signature: a hard cut into the dark, and the whole sheet goes dark with it
      id: 'blackout', poly: [[798, 616], [1010, 616], [1010, 1052], [778, 1052]], t: 22.53, audio: [22.5, 24.6], cut: true,
      art: { img: A('p6.webp'), fx: 0.45, exposure: 2.6, ph: 'THE STAGE IN THE DARK · TWO PALE EYES BESIDE JOJO' },   // what the page shows when the lights are on
      steps: [[]],
      setup(api, p) {
        const root = p.page.root, [x, y, w, h] = p.d.rect, T0 = 22.53, LIGHTS = 24.03;
        const dark = api.el('div', 'lights-out', root), glow = api.el('div', 'glow-layer', root);
        const eyes = api.el('div', 'eyes', glow, '<i></i><i></i>'), glint = api.el('i', 'glint', glow);
        const click = api.el('div', 'dark-sfx', glow, 'CLICK.'), zip = api.el('div', 'dark-sfx', glow, 'zip!');
        const exit = api.el('div', 'exit', glow, 'EXIT');
        const from = [x + w * 0.62, y + h * 0.36], to = [1566, 954];                 // from beside Jojo to the coat check (I2)
        Object.assign(eyes.style, { left: from[0] + 'px', top: from[1] + 'px' });
        Object.assign(click.style, { left: x + w / 2 + 'px', top: y + h * 0.7 + 'px' });
        Object.assign(zip.style, { left: (from[0] + to[0]) / 2 + 'px', top: (from[1] + to[1]) / 2 - 50 + 'px', fontSize: '30px' });
        // the green EXIT sign by the door still glows in the dark, wherever it is in the first panel's frame (if it is in it)
        const placeExit = () => {
          const doors = p.page.panels[0], ex = doors.pts.EXIT, [dx, dy] = doors.d.rect, inside = ex && ex[0] > 0.04 && ex[0] < 0.96 && ex[1] > 0.04 && ex[1] < 0.96;
          exit.style.display = inside ? '' : 'none';
          if (inside) Object.assign(exit.style, { left: dx + ex[0] * doors.w + 'px', top: dy + ex[1] * doors.h + 'px' });
        };
        let on = false, swung = false, done = false, lit = false;
        const off = () => { on = false; dark.style.opacity = 0; glow.classList.remove('on'); [click, zip].forEach(e => e.classList.remove('on')); eyes.style.opacity = 0; glint.style.opacity = 0; };
        return {
          enter: () => { placeExit(); on = true; swung = done = lit = false; dark.style.opacity = 1; glow.classList.add('on'); click.classList.add('on'); api.foley.play('click'); },
          frame: () => {
            if (!on) return;
            const t = api.segTime(), k = t - T0;
            eyes.style.opacity = k > 0.35 && k < 1.15 && !(k > 0.75 && k < 0.83) ? 1 : 0;      // the footage's two blinks
            const u = (k - 1.1) / 0.4;
            glint.style.opacity = u > 0 && u < 1 ? 1 : 0;
            if (u > 0 && u < 1) Object.assign(glint.style, { left: from[0] + (to[0] - from[0]) * u + 'px', top: from[1] + (to[1] - from[1]) * u - Math.sin(Math.PI * u) * 90 + 'px' });
            if (u > 0.05 && !zip.classList.contains('on')) api.foley.play('whip', { gain: 0.5, rate: 1.4 });
            zip.classList.toggle('on', u > 0.1 && u < 1.4);
            if (u > 0 && !swung) { swung = true; const c = api.cam(); api.camTo({ ...c, x: to[0], y: to[1] }, 420, true); }
            const d = t - LIGHTS;                        // the lights come back with three flickers, then the next panel
            if (d >= 0 && !lit) { lit = true; api.foley.play('lights'); }
            if (d >= 0) dark.style.opacity = d < 0.07 ? 0 : d < 0.15 ? 1 : d < 0.21 ? 0.15 : d < 0.32 ? 0.9 : 0;
            if (d >= 0.07) glow.classList.remove('on');
            if (d > 0.5 && !done) { done = true; off(); api.goNext(); }
          },
          leave: off,
          reset: off,
        };
      },
    },
    {
      id: 'missing', poly: [[1028, 616], [1620, 616], [1640, 1052], [1028, 1052]], t: 24.03, audio: [24.0, 27.5],
      art: { img: A('p7.webp'), ph: 'LIGHTS BACK · THE TIE CLIP IS GONE' },
      steps: [
        [{ cap: 'When the lights came back...', corner: 'tl', aspect: 3 }],
        [{ sfx: 'WHO TOOK THE', x: 0.5, y: 0.8, size: 40, rot: -3, fill: '#f2e8d0', shade: '#1d1a1c', shake: false }, { sfx: 'PINK STILETTO?', x: 0.5, y: 0.92, size: 50, rot: -3, fill: '#ff8fb0', shade: '#8e1b2c', delay: 450 }],
        [{ note: '*Jojo opened both eyes. First time since 1951. —Ed.', x: 0.6, y: 0.04, w: 0.36, aspect: 3.4, tilt: 1.5 }],
      ],
    },
    {
      ...INSET, id: 'coat-check', poly: circle(1566, 954, 62), whip: true,
      art: { img: A('i2.webp'), ph: 'THE COAT CHECK · A WINE-RED BOW BETWEEN THE COATS' },
      steps: [[{ note: '*Callie saw nothing. Callie is a cat. —Ed.', x: -0.5, y: 1.04, w: 2, aspect: 5, tilt: -2 }]],
    },
    {
      id: 'reported', poly: [[1638, 616], [1960, 616], [1960, 1052], [1658, 1052]], t: 27.0, audio: [27.0, 30.0],
      art: { pixel: { t: 27.8, zoom: 2.3, at: [3.4, 1.0, -2.8], hud: false } },
      steps: [
        [{ tag: '<b>●</b> CAM 1F · 23:47:30', x: 0.05 }, { cap: 'Reported at 23:47:30. No witnesses.', corner: 'bl', aspect: 2.4, w: 0.6 }],
        [{ fn: 'exhibit' }, { note: 'Next Sunday: the back alley.', x: 0.4, y: 0.12, w: 0.56, tilt: -2 }, { fn: 'sticker', delay: 1100 }],
      ],
      async setup(api, p) {
        const ex = api.exhibit(p, { id: 'ribbon', letter: 'A', what: 'The wine ribbon.', back: 24.03, pos: [0.08, 0.36] });
        const st = await api.sticker(p, { src: A('heads.webp'), i: 6, mark: '?' });   // still a mystery in No. 1
        return { ...ex, ...st, reset: () => { ex.reset(); st.reset(); } };
      },
    },
  ],
};

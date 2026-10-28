// Where everything lies in the case file, in page px: the open folder is [0, 0]–[W, H] with its fold at FOLD; the desk
// spreads round it. An item is one of the codex objects (assets/casefile/obj/<o>.webp, sized by objects.json): its centre
// (x, y), its width w (height from the picture), a turn r (degrees) and a stacking z. `sh` is how high it stands off what
// is under it (a sheet of paper 1, a cup or a lamp 4–6): its shadow grows with it. `role` gives it a job (the photo YOYO's
// frames play in, the exhibit's envelope, the print card…), `act` what a click does. Text items (`t`) are typed or written
// straight onto the paper under them. A floor's page is laid out in its own px: [0, 0]–[FOLD, H], the right half.
export const W = 1720, H = 1080, FOLD = W / 2;
export const DESK_RECT = [-980, -700, W + 1960, H + 1400];

// the desk round the folder, kept to a few groups with room between them: the lamp top left (the light comes from there),
// the phone under it and the morning paper (the front page: the stiletto, gone) bottom left with the pen; Jojo's hat,
// keys and a half-eaten donut along the top; the typewriter, the opera glasses, cold coffee and a full ashtray down the
// right; his crayon, glass and powder brush in a row under the book. `poke`: how it answers a click (js/case/eggs.js
// MOVES: hop, wobble, roll, spin, clack, jingle, ring, rustle)
export const DESK = [
  { o: 'newspaper_front', x: -440, y: 1000, w: 800, r: -5, z: 1, sh: 1, poke: 'rustle' },
  { o: 'lamp', x: -360, y: -150, w: 760, r: -18, z: 6, sh: 6, act: 'lamp', hit: [[0.02, 0.02, 0.96, 0.42], [0.28, 0.44, 0.42, 0.54, 1], [0.7, 0.42, 0.1, 0.38]] },
  { o: 'hat', x: 540, y: -262, w: 580, r: -20, z: 4, sh: 4, poke: 'hop' },
  { o: 'keys', x: 1000, y: -196, w: 250, r: -24, z: 4, sh: 2, poke: 'jingle' },
  { o: 'donut', x: 1450, y: -172, w: 400, r: -6, z: 4, sh: 2.4, poke: 'wobble' },
  { o: 'typewriter', x: W + 380, y: -110, w: 660, r: 8, z: 4, sh: 5, role: 'typewriter', poke: 'clack' },
  { o: 'glasses', x: W + 340, y: 430, w: 480, r: -24, z: 4, sh: 2, act: 'glasses', hit: [[0.01, 0.02, 0.26, 0.33, 1], [0.38, 0.01, 0.22, 0.28, 1], [0.44, 0.3, 0.5, 0.66]] },
  { o: 'coffee', x: W + 300, y: 750, w: 330, r: 0, z: 4, sh: 3, poke: 'wobble' },
  { o: 'ashtray', x: W + 370, y: 1110, w: 320, r: 0, z: 4, sh: 3, poke: 'wobble' },
  { o: 'matchbook_0', x: W + 130, y: 1196, w: 136, r: 14, z: 4, sh: 1, poke: 'hop' },
  { o: 'matchbook_1', x: W + 236, y: 1236, w: 64, r: 74, z: 4, sh: 0.6, poke: 'hop' },
  { o: 'marker', x: 360, y: 1180, w: 320, r: 14, z: 4, sh: 1, poke: 'roll' },
  { o: 'magnifier', x: 880, y: 1176, w: 460, r: -8, z: 4, sh: 3, poke: 'spin' },
  { o: 'brush', x: 1470, y: 1206, w: 360, r: 168, z: 4, sh: 1.4, poke: 'spin' },
  { o: 'phone', x: -480, y: 450, w: 540, r: 12, z: 4, sh: 5, poke: 'ring' },
  { o: 'pencil', x: 2, y: 6, w: 420, r: 154, z: 4, sh: 1, poke: 'roll' },
  { o: 'pen_0', x: -470, y: 1166, w: 430, r: -16, z: 4, sh: 1, poke: 'roll' },
  { o: 'pen_1', x: -120, y: 1214, w: 170, r: 0, z: 4, sh: 3, poke: 'wobble' },
  { o: 'pen_2', x: -250, y: 1262, w: 160, r: 30, z: 4, sh: 1, poke: 'roll' },
];

// the left flap: the map of the building with YOYO's route, the suspect composite clipped below it, a page of notes
// (headed PRIME SUSPECT in red, a doodle of her at the foot)
export const LEFT = [
  { o: 'graph', x: 430, y: 292, w: 790, r: -1.4, z: 2, sh: 1, role: 'map' },
  { o: 'tape_0', x: 60, y: 70, w: 170, r: -40, z: 5, sh: 0.5 },
  { o: 'tape_3', x: 810, y: 66, w: 200, r: 38, z: 5, sh: 0.5 },
  { o: 'note', x: 700, y: 790, w: 300, r: 7, z: 2, sh: 1, role: 'notes' },
  { o: 'form', x: 336, y: 784, w: 390, r: -7.8, z: 3, sh: 1, role: 'sketch' },
  { o: 'clips_1', x: 198, y: 590, w: 86, r: 74, z: 6, sh: 0.6 },
];

// each floor's field report: its own sheet (aged on that floor), laid out its own way, with that floor's odds and ends;
// nothing goes past x 780 where the index tabs come out from under the sheets (y 110–230, 300–430, 500–630, 700–820)
export const PAGES = {
  bar: [
    { o: 'sheet_bar', x: 428, y: 548, w: 730, r: -1.2, z: 1, sh: 1, role: 'sheet' },
    { t: 'head', x: 96, y: 84, w: 480, r: -1.2 },
    { o: 'comic_bar', x: 652, y: 230, w: 250, r: 7, z: 3, sh: 1.4, role: 'comic', act: 'read' },
    { o: 'clips_0', x: 640, y: 96, w: 110, r: 4, z: 4, sh: 1.6 },
    { o: 'photo1', x: 296, y: 404, w: 400, r: -4, z: 3, sh: 1, role: 'photo' },
    { o: 'tape_1', x: 114, y: 290, w: 140, r: -36, z: 4, sh: 0.5 },
    { o: 'tape_4', x: 482, y: 282, w: 130, r: 32, z: 4, sh: 0.5 },
    { t: 'report', x: 96, y: 574, w: 560, r: -1.2 },
    { o: 'napkin', x: 650, y: 448, w: 200, r: 14, z: 2, sh: 0.8 },
    { o: 'ticket', x: 696, y: 726, w: 160, r: -6, z: 3, sh: 0.8, role: 'stub' },
    { o: 'envelope', x: 236, y: 905, w: 260, r: -5, z: 3, sh: 1, role: 'bag', act: 'dust' },
    { o: 'tag', x: 378, y: 1010, w: 140, r: 21, z: 4, sh: 0.8, role: 'tag' },
    { o: 'printcard', x: 600, y: 900, w: 350, r: 4, z: 3, sh: 1, role: 'card' },
  ],
  alley: [
    { o: 'sheet_alley', x: 436, y: 540, w: 730, r: 1.4, z: 1, sh: 1, role: 'sheet' },
    { t: 'head', x: 100, y: 82, w: 480, r: 1.4 },
    { o: 'photo2', x: 252, y: 360, w: 330, r: -6, z: 3, sh: 1, role: 'photo' },
    { o: 'masking_0', x: 252, y: 196, w: 190, r: -4, z: 4, sh: 0.5 },
    { o: 'comic_alley', x: 630, y: 330, w: 244, r: 5, z: 3, sh: 1.4, role: 'comic', act: 'read' },
    { o: 'clips_2', x: 590, y: 186, w: 100, r: 64, z: 4, sh: 0.6 },
    { t: 'report', x: 100, y: 572, w: 520, r: 1.4 },
    { o: 'waybill', x: 700, y: 588, w: 156, r: -5, z: 2, sh: 0.8, role: 'waybill' },
    { t: 'doodle', d: 'bell', x: 96, y: 652, w: 330, h: 110, r: 1.4 },
    { o: 'printcard', x: 256, y: 896, w: 360, r: -3, z: 3, sh: 1, role: 'card' },
    { o: 'envelope', x: 604, y: 912, w: 270, r: 4, z: 3, sh: 1, role: 'bag', act: 'dust' },
    { o: 'tag', x: 470, y: 998, w: 140, r: -16, z: 4, sh: 0.8, role: 'tag' },
  ],
  cellar: [
    { o: 'sheet_cellar', x: 426, y: 546, w: 730, r: -0.6, z: 1, sh: 1, role: 'sheet' },
    { t: 'head', x: 94, y: 84, w: 480, r: -0.6 },
    { o: 'comic_cellar', x: 214, y: 370, w: 240, r: -6, z: 3, sh: 1.4, role: 'comic', act: 'read' },
    { o: 'clips_0', x: 214, y: 236, w: 104, r: -4, z: 4, sh: 1.6 },
    { o: 'photo1', x: 574, y: 380, w: 390, r: 3, z: 3, sh: 1, role: 'photo' },
    { o: 'clips_3', x: 574, y: 252, w: 70, r: 80, z: 5, sh: 2 },
    { o: 'note', x: 240, y: 716, w: 280, r: -8, z: 2, sh: 1, role: 'statement' },
    { t: 'report', x: 432, y: 534, w: 330, r: -0.6 },
    { o: 'printcard', x: 276, y: 952, w: 330, r: -2, z: 3, sh: 1, role: 'card' },
    { o: 'envelope', x: 618, y: 906, w: 270, r: 3, z: 3, sh: 1, role: 'bag', act: 'dust' },
    { o: 'tag', x: 692, y: 1010, w: 130, r: -24, z: 4, sh: 0.8, role: 'tag' },
    { o: 'candle_0', x: 680, y: 150, w: 160, r: 22, z: 5, sh: 3 },
    { o: 'candle_1', x: 656, y: 222, w: 60, r: -52, z: 5, sh: 0.6 },
  ],
  motel: [
    { o: 'sheet_motel', x: 430, y: 546, w: 730, r: 0.8, z: 1, sh: 1, role: 'sheet' },
    { t: 'head', x: 98, y: 84, w: 480, r: 0.8 },
    { o: 'comic_motel', x: 644, y: 246, w: 250, r: 6, z: 3, sh: 1.4, role: 'comic', act: 'read' },
    { o: 'clips_0', x: 640, y: 110, w: 108, r: 6, z: 4, sh: 1.6 },
    { o: 'photo2', x: 246, y: 378, w: 330, r: -4, z: 3, sh: 1, role: 'photo' },
    { o: 'tape_2', x: 246, y: 206, w: 160, r: 3, z: 4, sh: 0.5 },
    { o: 'clipping2', x: 640, y: 592, w: 250, r: -7, z: 3, sh: 1 },
    { t: 'report', x: 98, y: 580, w: 420, r: 0.8 },
    { o: 'envelope', x: 240, y: 912, w: 270, r: -3, z: 3, sh: 1, role: 'bag', act: 'dust' },
    { o: 'tag', x: 106, y: 1004, w: 140, r: 18, z: 4, sh: 0.8, role: 'tag' },
    { o: 'printcard', x: 594, y: 920, w: 350, r: 3, z: 3, sh: 1, role: 'card' },
    { o: 'clips_4', x: 742, y: 72, w: 60, r: -60, z: 5, sh: 2 },
  ],
};

// a point on an item (fractions of its picture) in its parent's px, the item's turn taken into account
export function onItem(it, m, fx, fy) {
  const h = it.w * m.h / m.w, a = (it.r || 0) * Math.PI / 180, dx = (fx - 0.5) * it.w, dy = (fy - 0.5) * h;
  return [it.x + dx * Math.cos(a) - dy * Math.sin(a), it.y + dx * Math.sin(a) + dy * Math.cos(a)];
}

// the easter eggs (js/case/eggs.js), in the px of where each lives
export const EGGS = {
  kiss: { o: 'kiss', x: 536, y: 696, w: 150, r: -16, z: 3, sh: 0 },          // on the 1F report, after the blackout
  // where the pale eyes may look out of the dark: just off the folder's edges (the first one in view is used)
  eyes: [[-58, 520], [W + 70, 680], [1180, -48], [1250, H + 52]],
  // the bell (folder px): dropped from above onto the alley report, three bounces along the paper's top edge, then rolled
  // over the fold to the 23:58 pin (where it stops: next to the pin, not over its writing)
  bell: { w: 78, from: [1560, 40], hops: [[1470, 150], [1330, 100], [1200, 62], [1110, 50]], roll: [[980, 46], [862, 54], [760, 118]], rest: [30, 26] },
  // the tentacle (cellar page px): out from under the ashtray on the desk, past the matches, over the book's edge to
  // the lipstick's envelope; `base` and `tip` are where those ends of its picture go (fractions of tentacle.webp)
  tentacle: { from: [1190, 1200], to: [628, 874], base: [0.02, 0.879], tip: [0.971, 0.055] },
  // lipstick written too small to see in the margins, there for the opera glasses (page px, a floor each)
  secrets: {
    bar: { text: 'hi jojo ♡', x: 360, y: 36, r: -3, size: 12 },
    alley: { text: '200%', x: 728, y: 508, r: 8, size: 13 },
    cellar: { cat: true, x: 516, y: 40, r: -6, size: 40 },
    motel: { text: 'check the back', x: 790, y: 728, r: 90, size: 9 },
  },
};

// the end (js/case/finale.js): CASE CLOSED on the 2F report; where the stiletto's envelope was, YOYO's lipstick paw print
// and 200% (motel page px); her paw (paw.webp: the toe that writes, fractions)
export const FINALE = {
  stamp: { x: 410, y: 640, r: -13 },
  lips: { rect: [70, 660, 360, 460], print: [220, 820, 0.8, 0.25], text: [158, 944, 40, -0.12] },
  paw: { w: 230, toe: [0.5, 0.92] },
};

// the back of the book, turned over: the outside of both covers; on the back cover, YOYO's scrapbook (back px: the
// left half is the back cover). `snap`: her photo from that floor (assets/casefile/snap_<floor>.webp); `v2` the one
// that moves
export const SCRAP = [
  { o: 'photo2', x: 430, y: 520, w: 440, r: -2.5, z: 3, sh: 1.6, role: 'v2' },
  { o: 'photo1', x: 196, y: 196, w: 310, r: -8, z: 4, sh: 1.3, role: 'snap', snap: 'bar', note: 'MY HERO ♡' },
  { o: 'photo1', x: 660, y: 182, w: 300, r: 7, z: 4, sh: 1.3, role: 'snap', snap: 'alley', note: 'SO COOL' },
  { o: 'photo1', x: 200, y: 868, w: 300, r: 5, z: 4, sh: 1.3, role: 'snap', snap: 'cellar', note: 'RUN LYLY!' },
  { o: 'photo1', x: 664, y: 878, w: 300, r: -5, z: 4, sh: 1.3, role: 'snap', snap: 'motel', note: 'MINE ♡' },
  { o: 'tape_1', x: 120, y: 82, w: 120, r: -38, z: 5, sh: 0.5 },
  { o: 'tape_4', x: 760, y: 76, w: 120, r: 34, z: 5, sh: 0.5 },
  { o: 'tape_2', x: 430, y: 262, w: 150, r: 2, z: 5, sh: 0.5 },
  { o: 'tape_0', x: 120, y: 772, w: 120, r: 30, z: 5, sh: 0.5 },
  { o: 'tape_3', x: 770, y: 790, w: 130, r: -30, z: 5, sh: 0.5 },
  { o: 'matchbook_0', x: 92, y: 520, w: 130, r: -16, z: 5, sh: 1 },
  { o: 'ticket', x: 782, y: 520, w: 170, r: 76, z: 5, sh: 0.8, role: 'stub' },
];
export const SCRAP_INK = { sig: [300, 1006, 34, -0.06], hearts: [[88, 640, 26], [812, 650, 22], [470, 1050, 18], [60, 330, 18], [820, 330, 20], [640, 1040, 28]] };

// on the pictures themselves (fractions of the saved object): where things are written or pinned
export const SPOTS = {
  cover: { label: [0.252, 0.133, 0.562, 0.118], exhibits: [0.533, 0.79], sig: [0.533, 0.872], band: 0.86, spine: 0.084 },   // exhibits, sig: centres; spine: its width
  envelope: { band: [0.051, 0.137, 0.895, 0.112], lines: [0.096, 0.794, 0.811, 0.15] },
  printcard: { top: [0.036, 0.059, 0.93, 0.154], bottom: [0.036, 0.78, 0.93, 0.157] },
  tag: { body: [0.3, 0.5, 0.62, 0.42] },
  ticket: { body: [0.09, 0.13, 0.8, 0.74] },
  // the badge: its enamel disc (centre x, y and width, of the picture's width) and each scroll's word: the midline of the
  // scroll's flat face between its curls (badge.webp px: its two edges read off the picture and smoothed), the type size
  // (capitals half the scroll's height) and the length the word is spaced out to (about 4/5 of the face)
  badge: { face: [0.498, 0.527, 0.42], scrolls: [
    { word: 'JOLLY P.D.', size: 34.9, len: 253, d: 'M100 191.1 L112 186.9 L124 183.1 L136 179.5 L148 176.3 L160 173.4 L172 170.8 L184 168.5 L196 166.6 L208 164.9 L220 163.6 L232 162.6 L244 161.9 L256 161.5 L268 161.4 L280 161.7 L292 162.2 L304 163.1 L316 164.3 L328 165.8 L340 167.6 L352 169.7 L364 172.1 L376 174.9 L388 178.0 L400 181.4 L418 187.0' },
    { word: 'DETECTIVE', size: 43.1, len: 301, d: 'M84 461.3 L96 467.7 L108 473.7 L120 479.2 L132 484.3 L144 489.0 L156 493.3 L168 497.2 L180 500.6 L192 503.6 L204 506.2 L216 508.3 L228 510.1 L240 511.4 L252 512.3 L264 512.7 L276 512.8 L288 512.4 L300 511.6 L312 510.3 L324 508.7 L336 506.6 L348 504.1 L360 501.2 L372 497.8 L384 494.1 L396 489.9 L408 485.3 L420 480.2 L432 474.8 L444 468.9' },
  ] },
  // the waybill's form: its header row, the three cells under it, the big box (pencilled), a red ring round the load
  waybill: { typed: [[[0.07, 0.14, 0.86, 0.085], 'Freight waybill', 'h'], [[0.07, 0.225, 0.42, 0.09], 'No. 2358'], [[0.5, 0.225, 0.22, 0.09], 'Car 7'], [[0.73, 0.225, 0.22, 0.09], '10·27']],
    hand: [0.09, 0.35, 0.53, 0.5], ring: [0.02, 0.355, 0.62, 0.2] },
  // Lyly's statement (the same note) sits higher: the print card lies over its foot
  statement: { title: [0.13, 0.065, 0.8, 0.12], lines: [0.16, 0.185, 0.78, 0.42], doodle: [0.22, 0.6, 0.6, 0.2] },
  note: { body: [0.16, 0.09, 0.78, 0.84], title: [0.13, 0.07, 0.8, 0.13], lines: [0.16, 0.21, 0.78, 0.48], doodle: [0.22, 0.69, 0.6, 0.24] },
  form: { box: [0.807, 0.061, 0.107, 0.046], lines: [0.66, 0.709, 0.76, 0.808, 0.858, 0.909], label: [0.084, 0.145], line: [0.244, 0.665] },
  typewriter: { paper: [0.33, 0.02, 0.34, 0.2] },
  // ② the composite (assets/casefile/sketch.webp, in fractions of the drawing): what each lifted print brings out of it.
  // Polygons, or [cx, cy, rx, ry] ellipses; the head and fur are everything else
  sketch: {
    bow: [[[0.14, 0.18], [0.32, 0.04], [0.55, 0.02], [0.63, 0.17], [0.56, 0.26], [0.42, 0.3], [0.31, 0.44], [0.3, 0.85], [0.19, 0.86], [0.02, 0.72], [0.05, 0.55], [0.13, 0.42]]],
    bell: [[[0.24, 0.72], [0.86, 0.72], [0.87, 1], [0.23, 1]]],
    lips: [[0.585, 0.627, 0.125, 0.052]],
    eyes: [[0.42, 0.495, 0.1, 0.08], [0.69, 0.455, 0.09, 0.075]],
  },
  // the route on the map: the coat check, the fire escape's first landing, the cellar drain, 203's window; and the way between
  graph: {
    pins: [[0.138, 0.5], [0.71, 0.4], [0.282, 0.79], [0.556, 0.19]],
    legs: [
      [[0.138, 0.548], [0.4, 0.585], [0.589, 0.588], [0.69, 0.598], [0.698, 0.442]],
      [[0.698, 0.442], [0.705, 0.598], [0.752, 0.598], [0.752, 0.83], [0.398, 0.835], [0.282, 0.828]],
      [[0.282, 0.828], [0.398, 0.835], [0.752, 0.83], [0.752, 0.598], [0.705, 0.598], [0.69, 0.32], [0.684, 0.19], [0.568, 0.226]],
    ],
  },
};

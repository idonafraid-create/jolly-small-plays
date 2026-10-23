// CH.03 · B1 · THE CELLAR — Lyly comes down for a keg. Something in the drain is awake, and it answers to YOYO.
import * as THREE from 'three';
import {
  COL, clamp, lerp, ramp, bump, easeOut, hash1, stepRand, mulberry32, sinceEv, P, headToward, fbm,
  mat, canvasOf, canvasTex, grit, paint, pivot, addBox, addCyl, addSphere, quad, makeSpot, roomClip, Notes, makeWetFloor, typed, makeSurround, beamDust,
} from '../engine.js';
import { makeLyly, makeYoyo, makeNPC, holdProp, makeFlashlight, makeKeg } from '../cast.js';
import { sit, walkPath, cheer } from '../acts.js';

const HW = 4.6, HD = 3.4, WH = 3.4, TX = 20;
const GRATE = { x: 1.5, z: -0.3, r: 0.8 };
const THRONE = { x: 3.55, z: -2.35 };
const STAIR = { x0: -4.6, x1: -3.55, zTop: -3.2, run: 0.3, rise: 0.28, n: 12 };
const stairY = z => clamp(STAIR.rise * STAIR.n - (z - STAIR.zTop) / (STAIR.run * STAIR.n) * STAIR.rise * STAIR.n, 0, STAIR.rise * STAIR.n);

function stoneTex(len, hgt, seed, alcoves = []) {
  const W = Math.round(len * TX), H = Math.round(hgt * TX), r = mulberry32(seed);
  const c = canvasOf(W, H), g = c.getContext('2d');
  g.fillStyle = '#1b1f1c'; g.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += 6, row++) for (let x = -(row % 2) * 5; x < W; x += 10) {
    const k = r() * 22; g.fillStyle = `rgb(${50 + k},${54 + k},${50 + k})`; g.fillRect(x + 1, y + 1, 8 + Math.floor(r() * 2), 4);
    if (r() < 0.18) { g.fillStyle = `rgba(70,110,50,${0.4 + r() * 0.4})`; g.fillRect(x + 1, y + 4, 2 + r() * 6, 1 + r() * 2); }
  }
  for (let i = 0; i < 30; i++) { const x = r() * W; g.fillStyle = 'rgba(8,10,8,0.35)'; g.fillRect(x, r() * H * 0.3, 1 + r() * 2, 8 + r() * 40); }
  for (const a of alcoves) {                                            // painted arch shadow behind the real recess
    const cx = (a.x + HW) * TX, w = a.w * TX, top = H - a.h * TX;
    g.fillStyle = '#0c0e0d';
    g.beginPath(); g.moveTo(cx - w / 2, H); g.lineTo(cx - w / 2, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, H); g.fill();
    g.strokeStyle = '#6a6a60'; g.lineWidth = 2; g.beginPath(); g.arc(cx, top + w / 2, w / 2 + 1, Math.PI, 0); g.stroke();
  }
  grit(g, W, H, 12, r);
  return canvasTex(c);
}
function floorTex() {
  const W = HW * 2 * TX, H = HD * 2 * TX, r = mulberry32(21);
  return canvasTex(paint(W, H, (x, y) => {
    const wx = x / TX - HW, wz = y / TX - HD;
    const dg = Math.hypot(wx - GRATE.x, wz - GRATE.z);
    if (dg < GRATE.r) { const ring = dg > GRATE.r - 0.08; return ring ? '#3a3a36' : ((x % 3 === 0 || y % 3 === 0) ? '#26282a' : '#6aff7a'); }
    // lipstick summoning circle with paw-print sigils
    if (Math.abs(dg - 1.75) < 0.06 || Math.abs(dg - 1.55) < 0.035) return '#b0142c';
    const ang = Math.atan2(wz - GRATE.z, wx - GRATE.x);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3, px = GRATE.x + Math.cos(a) * 1.65, pz = GRATE.z + Math.sin(a) * 1.65; const d = Math.hypot(wx - px, wz - pz); if (d < 0.07 || (d > 0.1 && d < 0.13 && Math.abs(Math.atan2(wz - pz, wx - px) + 1.2) < 1.2)) return '#c41a34'; }
    // flagstones
    const sx = Math.floor((wx + (Math.floor(wz / 0.55) % 2) * 0.3) / 0.6), sz = Math.floor(wz / 0.55);
    const edge = ((wx + (Math.floor(wz / 0.55) % 2) * 0.3) % 0.6 + 0.6) % 0.6 < 0.04 || ((wz % 0.55) + 0.55) % 0.55 < 0.04;
    if (edge) return '#121412';
    const k = hash1(sx * 91 + sz * 37) * 20 + (r() - 0.5) * 10 + fbm(wx, wz) * 14;
    return [44 + k, 47 + k, 44 + k];
  }));
}
function puddles() {
  return paint(220, 160, (x, y) => {
    const wx = x / 220 * HW * 2 - HW, wz = y / 160 * HD * 2 - HD;
    const n = fbm(wx * 0.7 + 2, wz * 0.7 + 6);
    return [Math.max(25, clamp((n - 0.5) * 7) * 230), 0, 0];
  });
}

export default {
  id: 'cellar', ch: 3, floor: 'B1', label: 'CELLAR', title: 'The Thing in the Keg Room', place: 'The Cellar', clock: '00:06',
  audio: 'assets/cellar.m4a', cues: 'assets/cellar.json',
  fit: { w: 15, h: 10.6 }, target: new THREE.Vector3(0, 1.2, 0),
  build(stage, C) {
    const EV = C.ev;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COL.paper);
    const cut = mat('#0e100f');

    // ── vault ──
    addBox(scene, HW * 2 + 0.4, 0.4, HD * 2 + 0.4, '#151715', 0, -0.2, 0).userData.noReflect = true;
    quad(scene, HW * 2, HD * 2, floorTex(), { y: 0.001, rx: -Math.PI / 2 }).userData.noReflect = true;
    const wet = makeWetFloor(scene, HW * 2, HD * 2, puddles(), { y: 0.005, strength: 0.7, sky: '#050605' });
    const ALC = [{ x: -1.6, w: 1.3, h: 2.5 }, { x: 0.25, w: 1.3, h: 2.5 }, { x: 2.1, w: 1.2, h: 2.5 }];
    const matB = new THREE.MeshLambertMaterial({ map: stoneTex(HW * 2 + 0.3, WH, 3, ALC) }), matL = new THREE.MeshLambertMaterial({ map: stoneTex(HD * 2 + 0.3, WH, 5) });
    const wall = (w, h, d, x, y, z, faceIdx, fm, uvFn) => {
      const geo = new THREE.BoxGeometry(w, h, d), p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, ...uvFn(p.getX(i) + x, p.getY(i) + y, p.getZ(i) + z));
      const m = new THREE.Mesh(geo, [0, 1, 2, 3, 4, 5].map(f => (f === faceIdx ? fm : cut))); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    };
    wall(HW * 2 + 0.55, WH, 0.3, 0, WH / 2, -HD - 0.15, 4, matB, (x, y) => [(x + HW + 0.15) / (HW * 2 + 0.3), y / WH]);
    wall(0.3, WH, HD * 2 + 0.25, -HW - 0.15, WH / 2, 0.125, 0, matL, (x, y, z) => [(z + HD) / (HD * 2 + 0.3), y / WH]);
    // wine racks inside the alcoves
    for (const a of ALC) {
      for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) {
        const b = addCyl(scene, 0.06, 0.06, 0.32, 6, ['#2a3a1a', '#3a1a1a', '#1a1a2a'][(row + i) % 3], a.x - 0.45 + i * 0.22, 0.25 + row * 0.33, -HD + 0.18);
        b.rotation.x = Math.PI / 2;
      }
      addBox(scene, a.w - 0.1, 0.04, 0.3, '#3a2a1a', a.x, 0.07, -HD + 0.16);
    }
    // stairs down the left wall, lit from the door above
    for (let i = 0; i < STAIR.n; i++) {
      const z = STAIR.zTop + i * STAIR.run, y = STAIR.rise * (STAIR.n - i);
      addBox(scene, STAIR.x1 - STAIR.x0, 0.06, STAIR.run + 0.02, '#4a3a2a', (STAIR.x0 + STAIR.x1) / 2, y - 0.03, z + STAIR.run / 2);
      addBox(scene, STAIR.x1 - STAIR.x0, y - 0.06, 0.04, '#2a2018', (STAIR.x0 + STAIR.x1) / 2, (y - 0.06) / 2, z + STAIR.run - 0.02);
    }
    addBox(scene, STAIR.x1 - STAIR.x0, 0.06, 0.2, '#4a3a2a', (STAIR.x0 + STAIR.x1) / 2, STAIR.rise * STAIR.n - 0.03, STAIR.zTop - 0.1);
    const railZ0 = STAIR.zTop + 1.0;
    const rail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(STAIR.x1 + 0.02, stairY(railZ0) + 0.9, railZ0), new THREE.Vector3(STAIR.x1 + 0.02, 0.9, STAIR.zTop + STAIR.run * STAIR.n)]), new THREE.LineBasicMaterial({ color: '#8a6a3a' }));
    scene.add(rail);
    for (let i = 4; i <= STAIR.n; i += 3) addBox(scene, 0.03, 0.9, 0.03, '#5a4a2a', STAIR.x1 + 0.02, stairY(STAIR.zTop + i * STAIR.run) + 0.45, STAIR.zTop + i * STAIR.run);
    // barrels, kegs, crates, junk
    for (const [x, z] of [[-3.4, -3.35], [-0.9, -3.4], [1.1, -3.35], [3.2, -3.4]].slice(0, 0)) addCyl(scene, 0.4, 0.4, 0.7, 10, '#5a3a22', x, 0.4, z);
    const barrel = (x, y, z, ry = 0) => { const g = pivot(scene, x, y, z); g.rotation.set(0, ry, Math.PI / 2); addCyl(g, 0.4, 0.4, 0.9, 12, '#5a3a22', 0, 0, 0); for (const k of [-0.3, 0, 0.3]) addCyl(g, 0.415, 0.415, 0.05, 12, '#2a2a28', 0, k, 0); return g; };
    barrel(-2.9, 0.42, -2.9, Math.PI / 2); barrel(-2.9, 0.42, -2.05, Math.PI / 2); barrel(-2.9, 1.15, -2.47, Math.PI / 2);
    for (const [x, z, h] of [[-4.15, 1.2, 0], [-4.15, 1.65, 0], [-4.15, 2.1, 0], [-4.15, 1.43, 0.5], [-4.15, 1.88, 0.5]]) { const k = makeKeg(scene); k.position.set(x, h, z); }
    const crate = (x, y, z, ry = 0, c = '#7a5a34') => { const g = pivot(scene, x, y, z); g.rotation.y = ry; addBox(g, 0.55, 0.42, 0.55, c, 0, 0.21, 0); addBox(g, 0.57, 0.05, 0.57, '#4a3220', 0, 0.4, 0); return g; };
    // YOYO's throne: beer crates, a velvet cushion, a candelabra
    crate(THRONE.x - 0.3, 0, THRONE.z, 0.1, '#8a2a1a'); crate(THRONE.x + 0.3, 0, THRONE.z, -0.1, '#8a2a1a'); crate(THRONE.x, 0.42, THRONE.z - 0.15, 0, '#6a5a2a');
    crate(THRONE.x, 0.84, THRONE.z - 0.32, 0.05, '#8a2a1a'); crate(THRONE.x, 1.26, THRONE.z - 0.35, -0.08, '#6a5a2a');
    addBox(scene, 0.6, 0.08, 0.5, COL.wine, THRONE.x, 0.88, THRONE.z + 0.05);
    const candela = pivot(scene, THRONE.x + 0.75, 0, THRONE.z + 0.15);
    addCyl(candela, 0.12, 0.15, 0.05, 8, '#8a7a3a', 0, 0.025, 0); addCyl(candela, 0.02, 0.02, 1.1, 4, '#8a7a3a', 0, 0.58, 0);
    const flames = [];
    for (const dx of [-0.15, 0, 0.15]) { addCyl(candela, 0.025, 0.025, 0.14, 5, '#efe6d0', dx, 1.2, 0); flames.push(addSphere(candela, 0.03, mat('#ffb64a', { basic: true }), dx, 1.3, 0, 4)); }
    crate(-2.6, 0, 2.9, 0.5); crate(-2.6, 0.42, 2.9, 0.2); crate(3.9, 0, 2.8, -0.3);
    addBox(scene, 0.45, 0.06, 0.45, '#3a2a1a', 3.9, 0.45, 1.3).rotation.z = 0.6;          // a broken chair
    // pipes, chains, the bare bulb
    addCyl(scene, 0.06, 0.06, HW * 2, 6, '#8a5a2a', 0, 2.95, -HD + 0.12).rotation.z = Math.PI / 2;
    addCyl(scene, 0.06, 0.06, HD * 2, 6, '#8a5a2a', -HW + 0.12, 2.7, 0).rotation.x = Math.PI / 2;
    for (const x of [-2.2, 4.25]) for (let i = 0; i < 8; i++) addBox(scene, 0.05, 0.1, 0.03, '#3a3a3a', x, 2.8 - i * 0.12, -HD + 0.08, false);
    addBox(scene, 0.08, 0.3, 0.08, '#222', 0.1, 3.2, -HD + 0.1);
    const cord = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.1, 3.05, -HD + 0.15), new THREE.Vector3(0.1, 2.3, -HD + 0.9)]), new THREE.LineBasicMaterial({ color: '#111' }));
    scene.add(cord);
    const bulbMesh = addSphere(scene, 0.07, mat('#fff0c0', { basic: true }), 0.1, 2.25, -HD + 0.92, 6);
    const drips = [[-HW + 0.15, 2.65, 1.2], [0.6, 2.9, -HD + 0.15], [3.2, 2.9, -HD + 0.15]];
    const dripMeshes = drips.map(() => addBox(scene, 0.03, 0.06, 0.03, mat('#9ac8d8', { basic: true }), 0, 0, 0, false));

    // ── a narrow rim of the earth the foundations sit in: soil, a few stones and roots ──
    const SOIL = [[58, 42, 30], [70, 50, 34], [48, 34, 24], [82, 60, 40]];
    const earth = makeSurround(scene, { hw: HW + 0.2, hd: HD + 0.2, margin: 0.95, seed: 31, ragged: 0.6, pattern: (x, z, dR, dE, r) => {
      if (fbm(x * 2.2 + 9, z * 2.2) > 0.7) { const k = r() * 20; return [84 + k, 82 + k, 78 + k]; }           // stones
      if (Math.abs(fbm(x * 0.9 + 3, z * 0.9 + 1) - 0.5) < 0.012) return '#2a1c12';                        // roots
      const c = SOIL[Math.floor(r() * SOIL.length)], n = (fbm(x * 1.4, z * 1.4) - 0.5) * 24;
      return [c[0] + n, c[1] + n, c[2] + n];
    } });
    const r8 = mulberry32(8);
    for (const [x, z] of earth.edgePoints(5, 0.7)) { const s = 0.1 + r8() * 0.12; addBox(scene, s * 1.4, s, s, ['#4a4844', '#3e3c38'][Math.floor(r8() * 2)], x, s / 2 - 0.02, z).rotation.y = r8() * 3; }

    // ── the Thing: an eye in the drain, six tentacles ──
    const floorClip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];             // nothing of it shows below the floor
    const tmat = new Map(), tm = c => { if (!tmat.has(c)) { const m = new THREE.MeshLambertMaterial({ color: c }); m.clippingPlanes = floorClip; m.clipShadows = true; tmat.set(c, m); } return tmat.get(c); };
    const eyeG = pivot(scene, GRATE.x, -0.05, GRATE.z);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#c8e04a' }), pupMat = new THREE.MeshBasicMaterial({ color: '#050505' });
    eyeMat.clippingPlanes = pupMat.clippingPlanes = floorClip;
    addSphere(eyeG, 0.42, eyeMat, 0, 0, 0, 10);
    const pupil = addBox(eyeG, 0.07, 0.5, 0.06, pupMat, 0, 0.02, 0.4, false);
    const tentacles = [];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + 0.4, root = pivot(scene, GRATE.x + Math.cos(a) * 0.45, -3.2, GRATE.z + Math.sin(a) * 0.45);
      root.rotation.y = -a;
      const segs = []; let parent = root;
      for (let i = 0; i < 15; i++) {
        const r0 = lerp(0.22, 0.03, i / 15), r1 = lerp(0.22, 0.03, (i + 1) / 15);
        const s = pivot(parent, 0, i === 0 ? 0 : 0.23, 0);
        const col = i > 11 ? '#a070c0' : i % 2 ? '#3d6a80' : '#4a7a8e';
        addCyl(s, r1, r0, 0.24, 6, tm(col), 0, 0.12, 0);
        if (i % 2 === 0 && i < 13) addBox(s, 0.05, 0.05, 0.03, tm('#e88aa8'), r0 * 0.9, 0.12, 0, false);
        segs.push(s); parent = s;
      }
      tentacles.push({ root, segs, a, seed: k * 1.7 });
    }
    // candles on the circle + hooded rats who carry them
    const candles = [];
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + 0.2, x = GRATE.x + Math.cos(a) * 1.9, z = GRATE.z + Math.sin(a) * 1.9;
      addCyl(scene, 0.04, 0.045, 0.22, 6, '#e8dcc0', x, 0.11, z);
      candles.push({ flame: addSphere(scene, 0.04, mat('#ffbe5a', { basic: true }), x, 0.27, z, 4), x, z, t: EV.candles + k * 0.38 });
    }
    const candleLights = [0, 1, 2].map(i => { const l = new THREE.PointLight('#ff9a4a', 0, 4, 1.5); l.position.set(GRATE.x + Math.cos(i * 2.1) * 1.9, 0.5, GRATE.z + Math.sin(i * 2.1) * 1.9); scene.add(l); return l; });
    const lipstick = pivot(scene, GRATE.x - 1.2, 0.03, GRATE.z + 1.7); lipstick.rotation.set(0, 0.6, Math.PI / 2);
    addCyl(lipstick, 0.03, 0.03, 0.1, 6, '#d9b24e', 0, 0, 0); addCyl(lipstick, 0.025, 0.02, 0.06, 6, '#c4142c', 0, 0.08, 0);

    // ── cast ──
    const people = [];
    const add = (rig, name, role, color, fn) => { const o = { rig, name, role, color, fn }; people.push(o); return o; };
    const L = makeLyly(scene), Y = makeYoyo(scene, { guitar: true });
    const flashlight = holdProp(L, 1, makeFlashlight(pivot(scene)), 'flashlight');
    flashlight.rotation.x = Math.PI / 2;                                           // beam runs down the forearm, out of the paw
    const TORCH = { from: new THREE.Vector3(0, 0, 0.2), to: new THREE.Vector3(0, -0.15, 4.2), angle: 0.26 };
    const torch = makeSpot(flashlight, '#fff2d2', TORCH.from, TORCH.to, TORCH.angle, { penumbra: 0.75, clip: roomClip(HW, HD), beam: 'torch' });
    const torchDust = beamDust(flashlight, TORCH.from, TORCH.to, TORCH.angle, 46);
    const lens = addSphere(flashlight, 0.055, mat('#fffbe8', { basic: true }), 0, 0, 0.2, 6);
    const carried = holdProp(L, 0, (() => { const g = pivot(scene); const k = makeKeg(g); k.position.set(0.25, -0.35, 0.2); k.scale.setScalar(0.9); return g; })(), 'keg');
    const droppedKeg = makeKeg(scene); droppedKeg.visible = false;
    const droppedTorch = pivot(scene); makeFlashlight(droppedTorch); droppedTorch.visible = false;
    const floorTorch = makeSpot(droppedTorch, '#fff2d2', new THREE.Vector3(0, 0.05, 0.25), new THREE.Vector3(0, 0, 4.5), 0.24, { penumbra: 0.75, shadow: false, clip: roomClip(HW, HD), beam: 'torch' });
    const cult = [0, 1, 2, 3].map(i => makeNPC(scene, { species: 'rat', scale: 0.66, outfit: { jacket: '#3a0f1a', pants: '#3a0f1a', coat: '#3a0f1a' }, hat: 'hood', hatCol: '#3a0f1a', tail: '#d9a0aa', eyeCol: '#ff3a4a' }));
    const scurry = [0, 1, 2].map(i => makeNPC(scene, { species: 'rat', scale: 0.32, fur: ['#6a6670', '#8b8790', '#5a5048'][i], outfit: { jacket: ['#6a6670', '#8b8790', '#5a5048'][i] }, tail: '#d9a0aa' }));

    // LYLY: down the stairs, a keg, a feeling of being watched, then the fastest exit of her life
    const KEG_AT = { x: -3.5, z: 1.45 };
    add(L, 'LYLY', 'SENT FOR A KEG', COL.lime, t => {
      const p = P({ x: -4.08, y: stairY(STAIR.zTop - 0.1), z: STAIR.zTop - 0.1, h: 0, mouth: 0.3, t });
      p.hide = t < EV.enter - 0.1;
      p.shRx = -1.25; p.elR = -0.2; p.shRz = 0.05;                               // torch held out
      p.shLx = -0.1; p.elL = -0.3; p.no_keg = true;
      if (t < EV.bottom) {
        const r = walkPath(p, t, [[-4.08, STAIR.zTop - 0.1], [-4.08, STAIR.zTop + STAIR.run * STAIR.n + 0.3]], EV.enter, EV.bottom, 0.32);
        p.y = stairY(p.z);
        p.shRx = -1.0 + 0.25 * Math.sin(t * 1.7); p.shRz = 0.25 * Math.sin(t * 1.1);
      } else if (t < EV.pickKeg) {
        p.y = 0;
        walkPath(p, t, [[-4.08, 0.7], [KEG_AT.x, KEG_AT.z]], EV.bottom, EV.pickKeg - 0.3, 0.4);
        if (t > EV.pickKeg - 0.3) p.h = -Math.PI / 2;
      } else if (t < EV.drop) {
        Object.assign(p, { x: KEG_AT.x, y: 0, z: KEG_AT.z, h: -Math.PI / 2 });
        p.no_keg = false; p.shLx = -0.9; p.elL = -0.9; p.shLz = -0.3;
        const turn = ramp(t, EV.pickKeg + 0.4, EV.pickKeg + 1.0); p.h = lerp(-Math.PI / 2, 0.9, turn);
        if (t > EV.peek && t < EV.peek + 1.4) { p.h = lerp(p.h, headToward({ ...p, h: 0 }, GRATE.x, GRATE.z, 9), ramp(t, EV.peek, EV.peek + 0.25)); p.headX = 0.1; }
        if (t > EV.peek + 1.4) p.h = 0.6;
        if (t > EV.candles) { p.h = headToward({ ...p, h: 0 }, GRATE.x, GRATE.z, 9); p.eyes = 'wide'; p.z = KEG_AT.z + 0.4 * ramp(t, EV.candles + 1.5, EV.drop); p.mouth = 0.6; }
      } else if (t < EV.flee) {
        Object.assign(p, { x: KEG_AT.x, y: 0, z: KEG_AT.z + 0.4, h: headToward({ x: KEG_AT.x, z: KEG_AT.z + 0.4, h: 0 }, GRATE.x, GRATE.z, 9) });
        p.eyes = 'wide'; p.mouth = 0.9; p.lean = -0.2; p.shRx = -1.2 + 0.08 * Math.sin(t * 40); p.shLx = -0.2;
        p.glassSlide = ramp(t, EV.rise + 0.5, EV.rise + 1.5);
        if (t > EV.reveal) { p.headY = 0.25; }
      } else {
        const r = walkPath(p, t, [[KEG_AT.x, KEG_AT.z + 0.4], [-4.08, 0.8], [-4.08, STAIR.zTop - 0.1]], EV.flee, EV.flee + 1.6, 0.6);
        p.y = p.z < 0.7 ? stairY(p.z) : 0; p.no_flashlight = true; p.mouth = 1; p.eyes = 'wide';
        p.shLx = -2.6; p.shRx = -2.6; p.elL = p.elR = -0.3;
        p.hide = !r.moving && t > EV.flee + 1.6;
      }
      return p;
    });
    // YOYO: in the dark on her throne until the bell
    add(Y, 'YOYO', 'SHE RUNS THE BASEMENT', COL.wine, t => {
      const p = P({ x: THRONE.x, y: 0, z: THRONE.z + 0.05, h: -2.4, t });
      sit(p, 0.92); p.headX = 0.1; p.noMarker = t < EV.reveal;
      p.shLx = -0.8; p.shLz = 0.5; p.elL = -0.6; p.shRx = -0.3; p.elR = -0.9;
      if (t > EV.reveal) { p.shLx = -1.0; p.shLz = 0.9; p.elL = -0.3 + 0.2 * Math.sin(t * 4); p.headZ = 0.25; p.eyes = 'half'; }       // strokes the tentacle
      if (t > EV.chord - 0.5) { const k = ramp(t, EV.chord - 0.5, EV.chord - 0.1), s = clamp((t - EV.chord) / 0.08); p.shRx = t < EV.chord ? lerp(-0.3, -3.0, k) : lerp(-3.0, 0.3, s); p.shRz = -0.35; p.elR = -0.1; p.gtrKick = t > EV.chord ? 0.15 * Math.exp(-(t - EV.chord) * 6) : 0; p.eyes = 'open'; p.headZ = 0; }
      if (t > EV.vo) { p.headX = 0.18 * Math.exp(-sinceEv(C.vo, t, e => e[0]) * 9); p.shRx = -0.3; p.elR = -0.9; }
      if (t > EV.miao) { p.wink = true; p.shLx = -2.4; p.shLz = 0.55; p.elL = -1.7; }
      return p;
    });
    cult.forEach((r, i) => add(r, ['BROTHER NIBBLE', 'SISTER CRUMB', 'BROTHER SQUEAK', 'THE YOUNG ONE'][i], 'CANDLE DUTY', '#ff3a4a', t => {
      const a = i * Math.PI / 2 + 0.6, rr = 2.35, show = t > EV.candles + i * 0.6;
      const p = P({ x: GRATE.x + Math.cos(a) * rr, y: 0, z: GRATE.z + Math.sin(a) * rr, h: 0, t });
      p.h = headToward({ ...p, h: 0 }, GRATE.x, GRATE.z, 9);
      p.hide = !show || t > EV.out + 0.5;
      p.shLx = p.shRx = -1.3; p.elL = p.elR = -1.1; p.shLz = -0.3; p.shRz = 0.3;
      p.headX = 0.3 + 0.1 * Math.sin(t * 2 + i); p.bodyY = 0.02 * Math.sin(t * 3 + i);
      if (t > EV.chord && t < EV.chord + 1.2) cheer(p, bump(t, EV.chord, 1.2));
      return p;
    }));
    scurry.forEach((r, i) => add(r, 'RAT', 'JUST A RAT', '#a0a0a8', t => {
      const p = P({ x: 0, y: 0, z: 0, h: 0, t });
      const paths = [[[4.2, 2.6], [1.0, 2.9], [-2.8, 3.1]], [[-1.4, -2.9], [0.2, 0.2], [2.8, 3.1]], [[4.3, -1.0], [3.0, 1.2], [4.3, 3.0]]];
      const t0 = [0.6, 1.4, 5.5][i];
      walkPath(p, t, paths[i], t0, t0 + 2.4, 0.12);
      p.hide = t < t0 || t > t0 + 2.45;
      return p;
    }));

    // ── lights ──
    const hemi = new THREE.HemisphereLight('#4a5a6a', '#0a0c0a', 0.5); scene.add(hemi);
    const bulb = new THREE.PointLight('#ffd9a0', 0, 6, 1.4); bulb.position.set(0.1, 2.2, -HD + 0.95); scene.add(bulb);
    const stairLight = makeSpot(scene, '#ffd49a', new THREE.Vector3(-4.08, 6.0, -3.7), new THREE.Vector3(-4.08, 0, 0.4), 0.26, { penumbra: 0.5, shaft: false });
    const glowL = new THREE.PointLight('#6aff7a', 0, 6, 1.3); glowL.position.set(GRATE.x, 0.6, GRATE.z); scene.add(glowL);
    const redL = makeSpot(scene, '#ff2a4a', new THREE.Vector3(THRONE.x + 1.2, 4.8, THRONE.z + 2.2), new THREE.Vector3(THRONE.x, 0.8, THRONE.z), 0.25, { penumbra: 0.4, clip: roomClip(HW, HD) });
    const candleThrone = new THREE.PointLight('#ffb064', 0, 3, 1.5); candleThrone.position.set(THRONE.x + 0.75, 1.4, THRONE.z + 0.4); scene.add(candleThrone);
    const notes = new Notes(scene, [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: EV.chord + i * 0.03, from: new THREE.Vector3(THRONE.x, 1.4, THRONE.z), color: '#ff3b5c', radial: 1.8 })), stage.pxPerM, 10);

    const update = t => {
      for (const o of people) { const p = o.fn(t); o.rig.root.visible = !p.hide; o.rig.apply(p); if (o.rig === L) L.glasses.position.y = -0.05 * (p.glassSlide || 0); }
      // tentacles: rise from the drain, sway, flourish on the chord, sink at the end
      const rise = ramp(t, EV.rise, EV.rise + 2.4) * (1 - ramp(t, EV.out, EV.out + 1.8));
      const peekK = bump(t, EV.peek - 1.2, 1.6);
      tentacles.forEach((tn, k) => {
        const lift = k === 0 ? Math.max(rise, peekK * 0.45) : rise;
        tn.root.position.y = lerp(-3.4, -0.15, lift);
        const flourish = bump(t, EV.chord, 1.6), pet = k === 2 && t > EV.reveal ? ramp(t, EV.reveal, EV.reveal + 1.2) : 0;
        tn.segs.forEach((s, i) => {
          const w = Math.sin(t * 1.6 + i * 0.45 + tn.seed), w2 = Math.cos(t * 1.3 + i * 0.38 + tn.seed * 2);
          s.rotation.z = (0.1 + 0.05 * i / 15) * w + 0.06 + flourish * 0.05 * Math.sin(i);
          s.rotation.x = 0.12 * w2 * (0.5 + i / 15) - 0.02 * i * flourish - pet * 0.12;
        });
      });
      const eyeOpen = ramp(t, EV.eye, EV.eye + 0.8) * (1 - ramp(t, EV.out, EV.out + 1.0));
      eyeG.scale.set(1, Math.max(0.02, eyeOpen), 1); eyeG.visible = eyeOpen > 0.02;
      const lx = people[0].rig.root.position; eyeG.rotation.y = Math.atan2(lx.x - GRATE.x, lx.z - GRATE.z);
      pupil.scale.y = 1 - 0.4 * bump(t, EV.reveal, 0.6);
      // candles light one by one, flare on the chord, go out at the end
      let lit = 0;
      candles.forEach((c, i) => { const on = t > c.t && t < EV.out + i * 0.15; c.flame.visible = on; if (on) { lit++; c.flame.scale.setScalar(1 + 0.25 * Math.sin(t * 17 + i) + 1.5 * bump(t, EV.chord, 0.5)); } });
      candleLights.forEach(l => { l.intensity = (lit / 8) * (2.2 + 0.5 * Math.sin(t * 13)) * (1 + 1.5 * bump(t, EV.chord, 0.5)); });
      flames.forEach((f, i) => { f.visible = t > EV.reveal - 0.2 && t < EV.out + 1; f.scale.setScalar(1 + 0.3 * Math.sin(t * 15 + i)); });
      candleThrone.intensity = t > EV.reveal - 0.2 && t < EV.out + 1 ? 2.2 : 0;
      // the dropped keg rolls, the dropped torch spins
      droppedKeg.visible = t > EV.drop;
      if (droppedKeg.visible) { const k = Math.min(t - EV.drop, 1.6); droppedKeg.position.set(KEG_AT.x + 0.3 + 0.9 * easeOut(k / 1.6), 0.2, KEG_AT.z + 0.6 + 0.5 * easeOut(k / 1.6)); droppedKeg.rotation.set(Math.PI / 2, 0, -k * 3); }
      droppedTorch.visible = t > EV.flee + 0.3;
      if (droppedTorch.visible) { const k = t - EV.flee - 0.3; droppedTorch.position.set(KEG_AT.x + 0.5, 0.05, KEG_AT.z - 0.2); droppedTorch.rotation.set(0, k * 5 * Math.exp(-k * 0.25) + 1, 0); }
      floorTorch.intensity = droppedTorch.visible ? 22 : 0; floorTorch.userData.shaft.material.uniforms.opacity.value = droppedTorch.visible ? 0.14 : 0;
      torch.intensity = people[0].rig.root.visible && t < EV.flee + 0.3 ? 32 * (t > EV.rise && t < EV.flee ? (stepRand(t, 0.06, 2) > 0.15 ? 1 : 0.3) : 1) : 0;
      torch.userData.shaft.material.uniforms.opacity.value = torch.intensity > 0 ? 0.16 * torch.intensity / 32 : 0;
      torchDust.visible = lens.visible = torch.intensity > 0; torchDust.update(t);
      // the bulb buzzes, then dies when the Thing wakes
      const bulbOn = t < EV.rise ? (stepRand(t, 0.09, 6) > 0.18 ? 1 : 0.05) : 0;
      bulb.intensity = 6 * bulbOn; bulbMesh.material.color.set(bulbOn > 0.5 ? '#fff0c0' : '#3a3428');
      stairLight.intensity = t > EV.enter - 0.6 && t < EV.flee + 2.2 ? 32 : 0;
      glowL.intensity = (0.6 + 4 * ramp(t, EV.rise - 1, EV.eye + 0.5)) * (1 - ramp(t, EV.out, EV.out + 1.5)) * (1 + 0.15 * Math.sin(t * 5));
      redL.intensity = t > EV.reveal ? 40 * (1 - 0.6 * ramp(t, EV.out + 0.8, EV.out + 1.6)) : 0; redL.userData.shaft.material.uniforms.opacity.value = redL.intensity ? 0.045 : 0;
      hemi.intensity = 0.35 + 0.35 * bump(t, EV.chord, 0.4);
      drips.forEach(([x, y, z], i) => { const u = ((t + i * 0.7) % 1.9) / 0.6; dripMeshes[i].visible = u < 1; dripMeshes[i].position.set(x, y - u * u * (y - 0.05), z); });
      lipstick.visible = t > EV.candles;
      stage.setFlash(bump(t, EV.chord, 0.12) > 0 ? 0.5 * bump(t, EV.chord, 0.12) : 0, '#ff3b5c');
      wet.material.uniforms.time.value = t * 0.3;
      notes.update(t);
    };
    const hud = t => {
      const lh = stage.screenOf(L.head, 0.25);
      if (t > EV.peek + 1.0 && t < EV.peek + 2.6) stage.caption(typed('...?', t, EV.peek + 1.0, 0.4), lh[0] + 10, lh[1] - 14, COL.cream);
      if (t > EV.rise + 1.6 && t < EV.reveal) stage.caption(typed('!!!', t, EV.rise + 1.6, 0.2), lh[0] + 10, lh[1] - 14, '#ffe28a');
      if (t >= EV.vo && t < EV.out + 2) {
        const words = ['NO', 'BARK.', 'ALL', 'BITE.'], shown = C.vo.filter(([a]) => t >= a).length;
        const l1 = words.slice(0, Math.min(2, shown)).join(' '), l2 = words.slice(2, Math.max(2, shown)).join(' ');
        if (l1) stage.centerText(l1, stage.lowH - 44, COL.ink, 2, COL.cream);
        if (l2) stage.centerText(l2, stage.lowH - 26, COL.wine, 2, COL.cream);
      }
      if (t >= EV.out + 2) stage.centerText(typed('SHE RUNS THE BASEMENT.', t, EV.out + 2, 0.6), stage.lowH - 26, COL.wine, 1, COL.cream);
    };
    return { scene, update, hud, people, clues: [{ id: 'lipstick', label: 'THE LIPSTICK', t0: EV.candles, until: 999, at: () => lipstick.getWorldPosition(new THREE.Vector3()) }], chapters: [
      { t: 0, label: 'DRIP' }, { t: EV.enter, label: 'THE STAIRS' }, { t: EV.peek, label: 'SOMETHING' }, { t: EV.candles, label: 'CANDLES' }, { t: EV.rise, label: 'IT RISES' }, { t: EV.reveal, label: 'THE BOSS' }, { t: EV.flee, label: 'EXIT' },
    ] };
  },
};

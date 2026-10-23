// CH.02 · BACK ALLEY — drizzle, a freight line behind a chain-link fence, a sax under a bare bulb,
// a silhouette on the fire escape in the lightning, and three cats who catch the last train out.
import * as THREE from 'three';
import {
  COL, clamp, lerp, ramp, bump, easeOut, hash1, stepRand, mulberry32, beatClock, envSampler, P, headToward, fbm,
  mat, canvasOf, canvasTex, grit, paint, pivot, addBox, addCyl, addSphere, quad, makeSpot, roomClip, Notes, Rain, makeWetFloor, typed, drawText, textW, mixHex,
  makeSurround, foliage,
} from '../engine.js';
import { makeJojo, makeLyly, makeYoyo, makeNPC, holdProp, makeOperaGlasses } from '../cast.js';
import { sit, bob, walkPath } from '../acts.js';

const HW = 6.5, HD = 2.9, WH = 4.6, TX = 20;
const DOOR = { z0: -0.6, z1: 0.5 };
const FENCE_X = 2.5;                         // the back wall ends here; beyond the fence is the railway
const TRACK_X = 4.6, GAUGE = 1.44;
const HOLE = { z0: -0.75, z1: -0.05, h: 0.75 };
const BACK_LEN = FENCE_X + HW + 0.25;
const MARGIN = 2.2, ZE = HD + MARGIN - 0.3;             // the freight runs edge to edge of the railway strip

function brickTex(len, hgt, { windows = [], graffiti = false, seed = 1, x0 = -HW - 0.25 } = {}) {
  const W = Math.round(len * TX), H = Math.round(hgt * TX), r = mulberry32(seed);
  const c = canvasOf(W, H), g = c.getContext('2d');
  g.fillStyle = '#3a2420'; g.fillRect(0, 0, W, H);
  const bc = ['#6b3428', '#5e2e24', '#74392b', '#55291f', '#7d4232'];
  for (let y = 0, row = 0; y < H; y += 3, row++) for (let x = -(row % 2) * 3; x < W; x += 6) { g.fillStyle = bc[Math.floor(r() * bc.length)]; g.fillRect(x, y, 5, 2); }
  for (let i = 0; i < 40; i++) { const x = r() * W, w = 1 + r() * 3, h = 10 + r() * 50; g.fillStyle = `rgba(10,8,8,${0.15 + r() * 0.25})`; g.fillRect(x, H - h - r() * H * 0.5, w, h); }
  const grd = g.createLinearGradient(0, H * 0.6, 0, H); grd.addColorStop(0, 'rgba(10,12,20,0)'); grd.addColorStop(1, 'rgba(10,12,20,0.5)');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  if (graffiti) {
    const X = m => (m - x0) * TX;
    g.fillStyle = '#e97780'; [[0, 2], [1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [2, 4], [3, 1], [3, 2], [3, 3], [4, 2]].forEach(([a, b]) => g.fillRect(X(-2.4) + a * 3, H - 36 - b * 3, 3, 3));
    g.fillStyle = '#ade408'; g.font = 'bold 14px monospace'; g.fillText('LY', X(1.0), H - 34);
    g.fillStyle = '#8e1b2c';
    [[0, 0, 5, 4], [-4, -5, 2, 2], [-1, -7, 2, 2], [2, -7, 2, 2], [5, -5, 2, 2]].forEach(([dx, dy, w, h]) => g.fillRect(X(1.9) + dx, H - 22 + dy, w, h));
    g.font = '9px monospace'; g.fillText('YOYO 200%', X(1.2), H - 10);
  }
  for (const w of windows) {
    const xa = Math.round((w.a - x0) * TX), y0 = H - Math.round(w.y1 * TX), ww = Math.round((w.b - w.a) * TX), hh = Math.round((w.y1 - w.y0) * TX);
    g.fillStyle = '#1c1210'; g.fillRect(xa - 2, y0 - 2, ww + 4, hh + 5);
    g.fillStyle = '#8a8070'; g.fillRect(xa - 3, y0 + hh + 1, ww + 6, 2);
  }
  grit(g, W, H, 14, r);
  return canvasTex(c);
}
function groundTex() {
  const W = HW * 2 * TX, H = HD * 2 * TX, r = mulberry32(3);
  return canvasTex(paint(W, H, (x, y) => {
    const wx = x / TX - HW, wz = y / TX - HD, n = fbm(wx * 0.9, wz * 0.9);
    if (wx > FENCE_X) {                                                        // railway: cinder verge, then ballast
      const k = hash1(x * 7 + y * 131) * 36;
      return Math.abs(wx - TRACK_X) < 1.5 ? [70 + k, 66 + k, 60 + k] : [44 + k * 0.6, 40 + k * 0.6, 36 + k * 0.6];
    }
    if (wx < -4.4) { if (x % 4 === 0 || y % 4 === 0) return '#15161a'; const k = hash1(Math.floor(x / 4) * 31 + Math.floor(y / 4) * 17) * 18; return [34 + k, 36 + k, 42 + k]; }
    if (Math.hypot(wx + 0.4, wz - 1.2) < 0.38) return (x + y) % 3 ? '#2a2a2e' : '#3a3a40';
    const v = 34 + n * 26 + (r() - 0.5) * 12;
    return [v * 0.92, v * 0.96, v * 1.08];
  }));
}
function puddleMask() {
  return paint(256, 116, (x, y) => {
    const wx = x / 256 * HW * 2 - HW, wz = y / 116 * HD * 2 - HD;
    if (wx > FENCE_X) return [12, 0, 0];
    const n = fbm(wx * 0.55 + 4, wz * 0.55 + 9);
    return [Math.max(60, clamp((n - 0.46) * 6) * 255), 0, 0];
  });
}
// chain-link: diamond lattice with a cat-sized hole torn out near the bottom
function fenceTex() {
  const W = Math.round(HD * 2 * TX), H = Math.round(2.2 * TX);
  return canvasTex(paint(W, H, (x, y) => {
    const wz = x / TX - HD, wy = (H - y) / TX;
    if (wz > HOLE.z0 && wz < HOLE.z1 && wy < HOLE.h * (1 - Math.abs((wz - (HOLE.z0 + HOLE.z1) / 2) / ((HOLE.z1 - HOLE.z0) / 2)) * 0.35)) return null;
    const a = (x + y) % 4 === 0, b = (x - y + 400) % 4 === 0;
    return a || b ? [150, 156, 164] : null;
  }));
}
function fenceTexPlain(len) {
  return canvasTex(paint(Math.round(len * TX), Math.round(2.2 * TX), (x, y) => ((x + y) % 4 === 0 || (x - y + 400) % 4 === 0 ? [150, 156, 164] : null)));
}
function bladeTex(text, color) {
  const c = canvasOf(14, text.length * 9 + 4), g = c.getContext('2d');
  [...text].forEach((ch, i) => {
    const x = Math.round((14 - textW(ch) * 2) / 2), y = 3 + i * 9;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(g, ch, x + dx, y + dy, mixHex(color, '#120c16', 0.55), 2, 1);
    drawText(g, ch, x, y, color, 2, 1);
  });
  return canvasTex(c);
}

export default {
  id: 'alley', ch: 2, floor: 'AL', label: 'ALLEY', title: 'Rain Check', place: 'The Back Alley', clock: '23:58',
  audio: 'assets/alley.m4a', cues: 'assets/alley.json',
  fit: { w: 18, h: 12.8 }, target: new THREE.Vector3(0, 1.95, 0),
  build(stage, C) {
    const EV = C.ev, beat = beatClock(C.beats), sax = envSampler(C.sax, EV.solo);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COL.paper);
    const cut = mat('#141012');
    const CLIP = roomClip(HW, HD), OUTER = roomClip(HW + MARGIN - 0.3, ZE);

    // ── street, walls ──
    addBox(scene, HW * 2 + 0.4, 0.4, HD * 2 + 0.4, '#1d1a1c', 0, -0.2, 0).userData.noReflect = true;
    quad(scene, HW * 2, HD * 2, groundTex(), { y: 0.001, rx: -Math.PI / 2 }).userData.noReflect = true;
    const wet = makeWetFloor(scene, HW * 2, HD * 2, puddleMask(), { y: 0.006, strength: 0.85 });
    const matL = new THREE.MeshLambertMaterial({ map: brickTex(HD * 2 + 0.2, WH, { windows: [{ a: 1.3 - 0.2, b: 2.2 - 0.2, y0: 3.55, y1: 4.35 }], seed: 4, x0: -HD - 0.2 }) });
    const matB = new THREE.MeshLambertMaterial({ map: brickTex(BACK_LEN, WH, { windows: [{ a: -1.5, b: -0.5, y0: 2.8, y1: 3.7 }, { a: -4.0, b: -3.1, y0: 2.6, y1: 3.5 }], graffiti: true, seed: 8 }) });
    matL.shadowSide = matB.shadowSide = THREE.DoubleSide;
    const wallBox = (w, h, d, x, y, z, faceIdx, faceMat, uvFn) => {
      const geo = new THREE.BoxGeometry(w, h, d), p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, ...uvFn(p.getX(i) + x, p.getY(i) + y, p.getZ(i) + z));
      const m = new THREE.Mesh(geo, [0, 1, 2, 3, 4, 5].map(f => (f === faceIdx ? faceMat : cut))); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    };
    const uvL = (x, y, z) => [(z + HD + 0.2) / (HD * 2 + 0.2), y / WH], uvB = (x, y) => [(x + HW + 0.25) / BACK_LEN, y / WH];
    for (const [a0, a1, y0, y1] of [[-HD, DOOR.z0, 0, WH], [DOOR.z1, HD + 0.2, 0, WH], [DOOR.z0, DOOR.z1, 2.15, WH]])
      wallBox(0.25, y1 - y0, a1 - a0, -HW - 0.125, (y0 + y1) / 2, (a0 + a1) / 2, 0, matL, uvL);
    wallBox(BACK_LEN, WH, 0.25, (-HW - 0.25 + FENCE_X) / 2, WH / 2, -HD - 0.125, 4, matB, uvB);
    addBox(scene, 0.32, WH + 0.06, 0.32, '#4a2a22', FENCE_X - 0.16, WH / 2, -HD - 0.08);       // the tenement's corner pier

    // ── the fence ──
    const fence = quad(scene, HD * 2, 2.2, fenceTex(), { x: FENCE_X, y: 1.1, z: 0, ry: Math.PI / 2, alpha: true });
    fence.material.side = THREE.DoubleSide; fence.castShadow = true;
    const steel = mat('#55595f');
    for (let z = -HD + 0.05; z <= HD; z += 1.45) addCyl(scene, 0.04, 0.04, 2.35, 5, steel, FENCE_X, 1.17, Math.min(z, HD - 0.05));
    addCyl(scene, 0.03, 0.03, HD * 2, 5, steel, FENCE_X, 2.22, 0).rotation.x = Math.PI / 2;
    const barbs = []; for (let i = 0; i <= 28; i++) barbs.push(new THREE.Vector3(FENCE_X + (i % 2 ? 0.08 : -0.08), 2.36 + (i % 2) * 0.06, -HD + i * (HD * 2 / 28)));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(barbs), new THREE.LineBasicMaterial({ color: '#3a3c40' })));

    // ── the railway: ballast, sleepers, full-gauge rails, a telegraph pole, a signal ──
    addBox(scene, 3.0, 0.14, ZE * 2, '#4a4642', TRACK_X, 0.07, 0, false);
    for (let z = -ZE + 0.2; z < ZE; z += 0.6) addBox(scene, 2.5, 0.12, 0.26, '#3a2a1e', TRACK_X, 0.2, z, false);
    for (const dx of [-GAUGE / 2, GAUGE / 2]) { addBox(scene, 0.1, 0.14, ZE * 2, '#6a6c72', TRACK_X + dx, 0.32, 0, false); addBox(scene, 0.07, 0.03, ZE * 2, '#c8ccd2', TRACK_X + dx, 0.4, 0, false); }
    // ── beyond the alley: the railway and its fence run on out of frame; elsewhere only a narrow broken rim of the same asphalt ──
    const WEEDS = ['#2e4626', '#36502a', '#3e5a2e'];
    makeSurround(scene, { hw: HW + 0.2, hd: HD + 0.2, margin: MARGIN, seed: 21, pattern: (x, z, dR, dE, r) => {
      const rail = x > FENCE_X - 0.5 + (fbm(z * 0.9, 2) - 0.5) * 0.6 && x < TRACK_X + 1.7 + (fbm(z * 0.8, 5) - 0.5) * 0.8;
      const gap = 0.55 + fbm(x * 1.1 + 7, z * 1.1) * 0.7 - dR;
      if (!rail && gap < 0) return null;
      if (((!rail && gap < 0.12) || dE < 0.15) && r() < 0.18) return WEEDS[Math.floor(r() * 3)];
      const n = (r() - 0.5) * 12;
      if (x > FENCE_X) { const k = r() * 30; return Math.abs(x - TRACK_X) < 1.5 ? [66 + k, 62 + k, 56 + k] : [44 + k * 0.6, 40 + k * 0.6, 36 + k * 0.6]; }
      if (x < -4.4) { if ((Math.round(x * 20) % 4 === 0) || (Math.round(z * 20) % 4 === 0)) return '#15161a'; const k = r() * 16; return [34 + k, 36 + k, 42 + k]; }
      return [34 + n, 36 + n, 42 + n];
    } });
    foliage(scene, [[FENCE_X - 0.1, -2.2], [FENCE_X + 0.1, -0.9], [FENCE_X - 0.1, 1.4], [FENCE_X + 0.1, 2.5], [3.0, -4.1], [6.0, 3.8]], { size: 0.15, cols: WEEDS, seed: 12 });
    for (const fz of [-HD - 1.6, -HD - 0.4, HD + 0.6, HD + 1.6]) addCyl(scene, 0.04, 0.04, 2.35, 5, mat('#55595f'), FENCE_X, 1.17, fz);
    for (const [z0, z1] of [[-ZE + 0.4, -HD], [HD, ZE - 0.4]]) {
      const f2 = quad(scene, z1 - z0, 2.2, fenceTexPlain(z1 - z0), { x: FENCE_X, y: 1.1, z: (z0 + z1) / 2, ry: Math.PI / 2, alpha: true }); f2.material.side = THREE.DoubleSide;
    }
    const pole = pivot(scene, 6.15, 0, -1.6);
    addCyl(pole, 0.09, 0.12, 4.9, 6, '#4a3a2a', 0, 2.45, 0);
    for (const y of [4.55, 4.2]) addBox(pole, 0.12, 0.1, 1.3, '#4a3a2a', 0, y, 0);
    for (const y of [4.6, 4.25]) for (const dz of [-0.55, 0.55]) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(6.15, y, -HD), new THREE.Vector3(6.15, y + 0.02, -1.6 + dz), new THREE.Vector3(6.15, y - 0.1, HD)]), new THREE.LineBasicMaterial({ color: '#141414' })));
    addBox(scene, 0.1, 2.6, 0.1, '#2a2a2e', 3.15, 1.3, -1.9);
    addBox(scene, 0.26, 0.42, 0.14, '#1a1a1c', 3.15, 2.6, -1.9);
    const signal = addSphere(scene, 0.08, mat('#3a1010', { basic: true }), 3.15, 2.66, -1.82, 6);

    // ── the bar's back wall: stage door, bulb, neon ──
    const door = pivot(scene, -HW + 0.02, 0, DOOR.z1);
    addBox(door, 0.06, 2.1, DOOR.z1 - DOOR.z0 - 0.02, '#23402f', 0.03, 1.05, -(DOOR.z1 - DOOR.z0) / 2);
    addBox(door, 0.02, 0.5, 0.5, '#2c4f3a', 0.07, 1.5, -(DOOR.z1 - DOOR.z0) / 2);
    addBox(door, 0.05, 0.05, 0.12, '#c9c9c9', 0.08, 1.0, -(DOOR.z1 - DOOR.z0) + 0.15);
    const inside = quad(scene, 1.4, 2.15, null, { x: -HW - 0.45, y: 1.07, z: (DOOR.z0 + DOOR.z1) / 2 - 0.3, ry: Math.PI / 2, basic: true });
    inside.material.color.set('#f0c890');
    addCyl(scene, 0.05, 0.07, 0.08, 6, '#1a1a1a', -HW + 0.12, 2.5, (DOOR.z0 + DOOR.z1) / 2);
    addSphere(scene, 0.06, mat('#fff1c8', { basic: true }), -HW + 0.14, 2.42, (DOOR.z0 + DOOR.z1) / 2, 6);
    addBox(scene, 0.4, 0.04, 1.4, '#2a2a2e', -HW + 0.2, 2.25, (DOOR.z0 + DOOR.z1) / 2);
    const blade = pivot(scene, -HW + 0.42, 2.45, 1.0);
    addBox(blade, 0.62, 2.1, 0.12, '#141018', 0, 0, 0);
    addBox(blade, 0.66, 0.04, 0.14, '#c9a24a', 0, 1.07, 0); addBox(blade, 0.66, 0.04, 0.14, '#c9a24a', 0, -1.07, 0);
    addBox(blade, 0.34, 0.04, 0.04, '#2a2a2e', -0.38, 0.8, 0); addBox(blade, 0.34, 0.04, 0.04, '#2a2a2e', -0.38, -0.8, 0);
    const bladeOn = bladeTex('JOLLY', '#ff7f9a'), bladeOff = bladeTex('JOLLY', '#3a2230');
    const bladeFace = quad(blade, 0.56, 2.0, bladeOn, { z: 0.065, basic: true, alpha: true });
    const bladeBack = quad(blade, 0.56, 2.0, bladeOn, { z: -0.065, ry: Math.PI, basic: true, alpha: true });
    const neonMat = new THREE.LineBasicMaterial({ color: '#ff7f9a' });
    const mz = 2.05, NP = [[-0.55, 2.75], [0.55, 2.75], [0, 2.05], [-0.55, 2.75], [0, 2.05], [0, 1.45], [-0.32, 1.38], [0.32, 1.38]];
    for (const dz of [0, 0.03]) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(NP.map(([a, y]) => new THREE.Vector3(-HW + 0.03, y + dz, mz + a))), neonMat));
    addSphere(scene, 0.07, mat('#a8f070', { basic: true }), -HW + 0.05, 2.45, mz + 0.2, 4);
    const iron = mat('#24262b');
    addBox(scene, 0.85, 0.06, 2.1, iron, -HW + 0.42, 3.3, 1.75);
    for (let z = 0.75; z <= 2.75; z += 0.25) addBox(scene, 0.02, 0.6, 0.02, iron, -HW + 0.83, 3.6, z, false);
    addBox(scene, 0.02, 0.02, 2.1, iron, -HW + 0.83, 3.9, 1.75, false);
    for (const sz of [2.35, 2.65]) addBox(scene, 0.03, 1.5, 0.03, iron, -HW + 0.75, 2.55, sz);
    for (let y = 1.9; y < 3.3; y += 0.22) addBox(scene, 0.03, 0.025, 0.33, iron, -HW + 0.75, y, 2.5, false);
    const winLight = quad(scene, 0.9, 0.8, canvasTex(paint(18, 16, (x, y) => (y % 3 === 0 ? '#8a6a3a' : '#ffd08a'))), { x: -HW + 0.02, y: 3.95, z: 1.75, ry: Math.PI / 2, basic: true });

    // ── tenement wall, Old Blue's corner ──
    const tvWin = quad(scene, 1.0, 0.9, null, { x: -1.0, y: 3.25, z: -HD + 0.02, basic: true });
    quad(scene, 0.9, 0.9, null, { x: -3.55, y: 3.05, z: -HD + 0.02, basic: true }).material.color.set('#141820');
    addCyl(scene, 0.06, 0.06, WH, 6, '#4a4c52', 2.05, WH / 2, -HD + 0.1);
    addBox(scene, 0.7, 0.45, 0.45, '#8a8c90', -3.55, 3.9, -HD + 0.25);
    const aw = pivot(scene, 0.9, 2.3, -HD + 0.05); aw.rotation.x = 0.45;
    for (let i = 0; i < 6; i++) addBox(aw, 0.3, 0.03, 0.8, i % 2 ? '#e8dcc0' : '#2f6a4a', -0.75 + i * 0.3, 0, 0.4);
    addBox(scene, 1.3, 0.03, 0.7, '#8a7a5a', 0.9, 0.02, -2.45);
    addBox(scene, 0.9, 0.18, 0.35, '#5a3a22', 0.95, 0.09, -1.8); addBox(scene, 0.84, 0.03, 0.29, '#8e1b2c', 0.95, 0.19, -1.8);
    addCyl(scene, 0.05, 0.05, 0.1, 6, '#a8acb0', 1.45, 0.05, -1.7);

    // ── dumpster, cans, bags, crates against the fence ──
    const dump = pivot(scene, -4.8, 0, -2.3);
    addBox(dump, 1.7, 1.1, 0.95, '#2f5a3a', 0, 0.6, 0); addBox(dump, 1.72, 0.06, 0.12, '#24452c', 0, 0.2, 0.48);
    for (const sx of [-0.7, 0.7]) addCyl(dump, 0.07, 0.07, 0.05, 6, '#141414', sx, 0.07, 0.4).rotation.z = Math.PI / 2;
    const lid = pivot(dump, 0, 1.15, -0.47);
    addBox(lid, 1.74, 0.05, 0.98, '#26472f', 0, 0.02, 0.49);
    const can = (x, z, tipped = false) => {
      const g = pivot(scene, x, 0, z);
      if (tipped) { g.rotation.z = Math.PI / 2; g.position.y = 0.3; }
      addCyl(g, 0.3, 0.27, 0.82, 12, '#a3a8ae', 0, 0.41, 0);
      for (const y of [0.2, 0.55]) addCyl(g, 0.31, 0.31, 0.04, 12, '#8a8f95', 0, y, 0);
      if (!tipped) { addCyl(g, 0.33, 0.33, 0.05, 12, '#b8bdc3', 0, 0.85, 0); addSphere(g, 0.05, '#8a8f95', 0, 0.9, 0, 5); }
    };
    can(-3.5, -2.45); can(-2.9, -2.3); can(-3.2, -1.45, true);
    const tLid = pivot(scene, -2.5, 0.03, -1.2); tLid.rotation.set(0.1, 0, 0.12); addCyl(tLid, 0.33, 0.33, 0.05, 12, '#b8bdc3', 0, 0, 0);
    for (const [x, z, c] of [[-2.8, -1.4, '#d8cfb8'], [-2.6, -1.75, '#c9a24a'], [-2.95, -1.15, '#7a5a3a'], [-2.4, -1.45, '#e8e2d6']]) addBox(scene, 0.14, 0.03, 0.1, c, x, 0.02, z).rotation.y = x * 3;
    for (const [x, z] of [[-5.95, -1.45], [-6.1, -1.95], [-5.75, -1.9]]) addSphere(scene, 0.27, '#16161a', x, 0.24, z, 7).scale.set(1, 0.85, 1);
    const crate = (x, y, z, ry = 0) => { const g = pivot(scene, x, y, z); g.rotation.y = ry; addBox(g, 0.6, 0.5, 0.6, '#7a5a34', 0, 0.25, 0); addBox(g, 0.62, 0.06, 0.62, '#5a3e22', 0, 0.48, 0); addBox(g, 0.62, 0.06, 0.62, '#5a3e22', 0, 0.06, 0); };
    [[1.75, 0, -2.4, 0.1], [1.78, 0.5, -2.4, -0.15], [1.95, 0, -1.7, 0.2], [2.0, 0, 0.6, -0.1]].forEach(a => crate(...a));
    crate(-5.65, 0, -1.15, 0.3);
    const post = pivot(scene, 1.95, 0, 2.35);
    addCyl(post, 0.07, 0.1, 3.7, 6, '#24382c', 0, 1.85, 0); addCyl(post, 0.18, 0.2, 0.1, 8, '#24382c', 0, 0.05, 0);
    addBox(post, 0.6, 0.06, 0.06, '#24382c', -0.3, 3.65, 0);
    addCyl(post, 0.16, 0.22, 0.18, 8, '#24382c', -0.55, 3.55, 0);
    addCyl(post, 0.15, 0.15, 0.03, 8, mat('#ffb45a', { basic: true }), -0.55, 3.45, 0);
    addCyl(scene, 0.12, 0.14, 0.55, 8, '#c8b24a', 0.5, 0.275, 2.55); addSphere(scene, 0.12, '#c8b24a', 0.5, 0.56, 2.55, 6);
    const steam = Array.from({ length: 10 }, () => { const s = addSphere(scene, 0.22, new THREE.MeshLambertMaterial({ color: '#c9cdd6', transparent: true, opacity: 0.35, depthWrite: false }), 0, 0, 0, 6); s.castShadow = false; s.userData.noReflect = true; return s; });

    // ── the freight, full size: loco, two boxcars, a caboose with a back porch ──
    const tClip = [new THREE.Plane(new THREE.Vector3(0, 0, 1), ZE), new THREE.Plane(new THREE.Vector3(0, 0, -1), ZE)];
    const tm = c => { const m = new THREE.MeshLambertMaterial({ color: c }); m.clippingPlanes = tClip; m.clipShadows = true; return m; };
    const train = pivot(scene, TRACK_X, 0.4, -60);
    const UNITS = [{ len: 4.6, col: '#2c5a40', kind: 'loco' }, { len: 4.4, col: '#9a5432' }, { len: 4.4, col: '#3e5480' }, { len: 3.6, col: '#a8442a', kind: 'caboose' }];
    let off = 0;
    const unitZ = [];
    UNITS.forEach(u => {
      const g = pivot(train, 0, 0, off - u.len / 2); unitZ.push(off - u.len / 2);
      const body = tm(u.col), dark = tm('#18181a'), trim = tm(u.kind === 'loco' ? '#d9b24e' : '#d8d0c0');
      if (u.kind === 'loco') {
        addBox(g, 1.9, 1.5, u.len * 0.6, body, 0, 1.45, 0.75); addBox(g, 2.05, 2.35, u.len * 0.36, body, 0, 1.88, -1.4);
        addBox(g, 2.08, 0.1, u.len, trim, 0, 0.75, 0); addCyl(g, 0.14, 0.16, 0.5, 6, dark, 0, 2.4, 1.5);
        addBox(g, 1.5, 0.5, 0.03, tm('#ffe7a8'), 0, 2.45, -0.75);
        const lm = new THREE.MeshBasicMaterial({ color: '#fff4cc' }); lm.clippingPlanes = tClip;
        addSphere(g, 0.16, lm, 0, 1.55, u.len / 2 + 0.03, 6);
      } else if (u.kind === 'caboose') {
        addBox(g, 2.0, 1.9, u.len - 0.8, body, 0, 1.7, 0.4); addBox(g, 1.3, 0.55, 1.1, body, 0, 2.9, 0.3);
        addBox(g, 2.06, 0.08, u.len - 0.8, dark, 0, 2.66, 0.4);
        addBox(g, 2.0, 0.1, 0.9, dark, 0, 0.98, -u.len / 2 + 0.45);                                // back porch
        for (const sx of [-0.95, 0.95]) addBox(g, 0.05, 0.75, 0.05, dark, sx, 1.4, -u.len / 2 + 0.05);
        addBox(g, 2.0, 0.05, 0.05, dark, 0, 1.75, -u.len / 2 + 0.05);
        for (const wz of [-0.2, 1.1]) addBox(g, 2.04, 0.45, 0.5, tm('#ffd890'), 0, 2.0, wz);
      } else {
        addBox(g, 2.0, 2.3, u.len, body, 0, 1.95, 0); addBox(g, 2.08, 0.1, u.len + 0.08, dark, 0, 3.12, 0);
        addBox(g, 2.04, 0.14, u.len * 0.6, trim, 0, 2.4, 0);
        addBox(g, 2.06, 1.8, 0.06, dark, 0, 1.95, 0.6); addBox(g, 2.06, 1.8, 0.06, dark, 0, 1.95, -0.6);
      }
      for (const tz of [u.len / 2 - 0.75, -u.len / 2 + 0.75]) for (const sx of [-GAUGE / 2, GAUGE / 2]) { const w = addCyl(g, 0.34, 0.34, 0.14, 10, dark, sx, 0.34, tz); w.rotation.z = Math.PI / 2; }
      addBox(g, 1.7, 0.22, u.len - 0.3, dark, 0, 0.72, 0);
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      off -= u.len + 0.4;
    });
    const trainLen = -off - 0.4;
    const head = makeSpot(train, '#fff0c8', new THREE.Vector3(0, 1.55, 2.5), new THREE.Vector3(0, -0.4, 9), 0.25, { shadow: false, penumbra: 0.5, clip: OUTER });
    const RUNS = [{ t0: EV.train1, v: 10 }, { t0: EV.train2, v: 5 }];
    const headZAt = t => { for (const r of RUNS) { const z = -ZE + r.v * (t - r.t0); if (t >= r.t0 && z - trainLen < ZE + 1) return z; } return -60; };
    const PORCH = unitZ[3] - UNITS[3].len / 2 + 0.45;                                              // caboose back porch, relative to the head
    const HOLE_Z = (HOLE.z0 + HOLE.z1) / 2;
    const hopT = EV.train2 + ((HOLE_Z - PORCH) + ZE) / RUNS[1].v - 0.15;

    // ── cast ──
    const people = [];
    const add = (rig, name, role, color, fn) => { const o = { rig, name, role, color, fn }; people.push(o); return o; };
    const J = makeJojo(scene), L = makeLyly(scene), Y = makeYoyo(scene, { guitar: false, umbrella: true });
    holdProp(J, 0, makeOperaGlasses(pivot(scene)), 'opera');
    const bags = [0, 1].map(i => { const g = pivot(L.arms[i].hand, 0, -0.12, 0.05); addSphere(g, 0.2, '#16161a', 0, -0.05, 0, 7).scale.set(1, 1.2, 1); addBox(g, 0.06, 0.08, 0.06, '#16161a', 0, 0.16, 0); return g; });
    const cat = o => makeNPC(scene, { species: 'cat', scale: 0.62, ...o });
    const tubbs = cat({ fur: '#d8873a', stripes: '#8a4a1a', outfit: { jacket: '#2a2a2a', pants: '#d8873a' }, torsoW: 0.56, tail: '#d8873a', tailTip: '#8a4a1a', eyeCol: '#c8d040' });
    const patch = cat({ fur: '#1a1a1e', patch: -0.075, outfit: { jacket: '#3a2a20', pants: '#1a1a1e' }, tail: '#1a1a1e', eyeCol: '#e0c030' });
    const ghost = cat({ fur: '#eeeae4', outfit: { jacket: '#5a6a7a', pants: '#eeeae4' }, tail: '#eeeae4', eyeCol: '#7ab0e0' });
    const blue = makeNPC(scene, { species: 'dog', fur: '#8a5a3a', muzzle: '#6a3a22', ear: 'long', earCol: '#5a2e1a', outfit: { jacket: '#5a5a3a', coat: '#4a4a32', pants: '#3a3a2a' }, hat: 'beret', hatCol: '#5a5a5e' });
    const crow = makeNPC(scene, { species: 'crow', scale: 0.45, outfit: { jacket: '#1b1c22', pants: '#1b1c22' } });
    const rat = makeNPC(scene, { species: 'rat', scale: 0.4, outfit: { jacket: '#5a4a3a' }, tail: '#d9a0aa' });
    const bell = addSphere(scene, 0.05, mat('#e2bb52'), 0, 0, 0, 6);

    const DOORPOS = { x: -6.1, z: -0.05 }, JSPOT = { x: -5.3, z: -0.4, h: 1.0 }, LSEAT = { x: -5.65, z: -1.15 }, BELL_AT = { x: -4.8, z: 1.0 };
    const doorOpen = t => {
      const a = EV.doorOpen, j = EV.jojoOut;
      if (t < a) return 0;
      if (t < a + 1.1) return 1.25 * easeOut((t - a) / 0.35);
      if (t < j - 0.4) return lerp(1.25, 0.3, easeOut((t - a - 1.1) / 0.4));
      if (t < j + 1.0) return lerp(0.3, 1.25, easeOut((t - j + 0.4) / 0.35));
      return lerp(1.25, 0.5, easeOut((t - j - 1.0) / 0.4));
    };
    const flash = t => {
      let f = 0;
      for (const [a, d] of [[EV.flash1, 0.5], [EV.flash2, 0.45]]) { const k = t - a; if (k >= 0 && k < d) f = Math.max(f, (k < 0.06 || (k > 0.14 && k < 0.22) || (k > 0.3 && k < 0.33)) ? 1 : 0.25 * (1 - k / d)); }
      return f;
    };

    add(L, 'LYLY', 'ON TRASH DUTY', COL.lime, t => {
      const p = P({ x: DOORPOS.x - 0.8, y: 0, z: DOORPOS.z, h: Math.PI / 2, mouth: 0.4, t });
      p.shLx = p.shRx = -0.15; p.elL = p.elR = -0.2; p.shLz = 0.25; p.shRz = -0.25;
      p.hide = t < EV.doorOpen + 0.15;
      if (t < EV.bagsDrop) {
        if (t >= EV.doorOpen) walkPath(p, t, [[DOORPOS.x, DOORPOS.z], [-5.4, -0.7], [-4.85, -1.35]], EV.doorOpen + 0.2, EV.bagsDrop - 0.5, 0.42);
        if (t > EV.bagsDrop - 0.5) { p.h = Math.PI; p.lean = 0.2; }
        p.bagsOn = true;
      } else if (t < EV.jojoOut) {
        Object.assign(p, { x: -4.85, z: -1.35, h: Math.PI });
        const k = t - EV.bagsDrop; p.bagsOn = k < 0.25;
        p.shLx = p.shRx = lerp(-2.4, -0.2, ramp(k, 0.1, 0.5)); p.lean = 0.3 * bump(t, EV.bagsDrop - 0.2, 0.6);
        const bk = t - EV.bark; if (bk > -0.2 && bk < 0.9) { p.h = 1.4; p.lean = bk > 0 ? 0.4 * Math.exp(-bk * 4) : -0.1; p.mouth = bk > 0 ? Math.max(0.3, Math.exp(-bk * 3)) : 0.1; p.headX = bk > 0 ? -0.35 * Math.exp(-bk * 4) : 0.1; }
        if (t > EV.bark + 0.9) walkPath(p, t, [[-4.85, -1.35], [-5.2, -1.25], [LSEAT.x, LSEAT.z]], EV.bark + 0.9, EV.jojoOut - 0.2, 0.42);
      } else if (t < EV.pick - 0.8) {
        Object.assign(p, { x: LSEAT.x, z: LSEAT.z, h: 0.4 });
        sit(p, 0.52);
        if (t > EV.solo) { const b = beat(t); bob(p, b, 0.22); p.side = 0.06 * Math.sin(Math.PI * (b.i + b.ph) / 2); }
        if (t > EV.flash1) { p.headX = -0.6; p.headY = 0.6; p.eyes = 'wide'; p.mouth = 0.8; }
      } else {
        walkPath(p, t, [[LSEAT.x, LSEAT.z], [BELL_AT.x - 0.1, BELL_AT.z - 0.5]], EV.pick - 0.8, EV.pick - 0.1, 0.42);
        if (t >= EV.pick - 0.1) { p.x = BELL_AT.x - 0.1; p.z = BELL_AT.z - 0.5; p.h = 0.3; }
        const pk = bump(t, EV.pick - 0.1, 0.9); p.crouch = 0.6 * pk; p.shRx = lerp(-0.15, -1.2, pk);
        if (t > EV.pick + 0.5) { p.shRx = -1.6; p.elR = -1.8; p.headX = 0.1; p.mouth = 0.2; }
        if (t > EV.point) { p.shRx = -2.9; p.elR = -0.1; p.shRz = -0.2; p.headX = -0.55; p.headY = 0.5; p.mouth = 0.6; p.h = 0.1; }
      }
      return p;
    });
    add(J, 'JOJO', 'SAX · NO TALK', COL.coral, t => {
      const p = P({ ...JSPOT, y: 0, eyes: 'half', headX: -0.12, t });
      p.hide = t < EV.jojoOut;
      p.shRx = -0.25; p.shRz = 0.12; p.elR = -0.5; p.shLx = 0.05; p.shLz = 0.08; p.elL = -0.15;
      p.no_opera = t < EV.opera - 0.2;
      if (t < EV.jojoOut + 1.2) { walkPath(p, t, [[DOORPOS.x - 0.4, DOORPOS.z], [JSPOT.x, JSPOT.z]], EV.jojoOut, EV.jojoOut + 1.1, 0.5); if (t > EV.jojoOut + 1.1) p.h = JSPOT.h; }
      else if (t < EV.solo - 0.4) { p.headX = -0.5; }
      else if (t < EV.flash1) {
        const s = sax(t), b = beat(t), sway = Math.sin(Math.PI * (b.i + b.ph) / 2);
        Object.assign(p, { shLx: -0.95, shLz: -0.42, elL: -1.25, shRx: -0.55, shRz: 0.32, elR: -1.05, saxPlay: 1, eyes: 'closed' });
        p.lean = -0.05 - 0.18 * s; p.saxTilt = 0.22 * s; p.side = 0.07 * sway; p.twist = 0.06 * sway; p.puff = s; p.headX = -0.15 * s;
      } else {
        Object.assign(p, { saxPlay: 0.4, shLx: -0.5, shRx: -0.4, elR: -0.8 });
        p.headX = -0.65; p.headY = -0.45; p.eyes = t < EV.flash2 + 0.6 ? 'wide' : 'half';
        if (t > EV.opera) { p.shLx = -2.2; p.shLz = -0.2; p.elL = -1.6; p.headX = -0.7; p.headY = -0.5; p.saxPlay = 0; }
      }
      return p;
    });
    add(Y, 'YOYO', 'UP THE FIRE ESCAPE', COL.wine, t => {
      const p = P({ x: -6.45, y: 3.33, z: 1.75, h: Math.PI / 2 + 0.3, t, umbrella: true });
      p.shLx = -1.8; p.shLz = 0.25; p.elL = -0.6; p.shRx = -1.0; p.elR = -1.2; p.headX = 0.3; p.headY = 0.5; p.wink = t > EV.flash1 + 0.2;
      p.hide = !(t > EV.flash1 - 0.3 && t < EV.flash2);
      return p;
    });
    // the cats: dumpster lords, barked off, an audience for the solo, then through the fence and onto the caboose
    const catFn = (seed, lidX, groundPos, rowPos, waitZ, porchDx) => t => {
      const p = P({ x: -4.8 + lidX, y: 1.2, z: -2.35, h: 0.6 + seed * 0.4, t });
      sit(p, 0.18); p.headY = 0.4 * Math.sin(t * 0.7 + seed);
      if (t > EV.hiss - 0.1 && t < EV.catsJump) { p.sit = 0; p.crouch = 0.4; p.lean = -0.3; p.mouth = 1; p.eyes = 'wide'; p.h = 0.2; }
      if (t >= EV.catsJump) {
        const k = clamp((t - EV.catsJump) / 0.45);
        p.sit = 0; p.x = lerp(-4.8 + lidX, groundPos[0], k); p.z = lerp(-2.35, groundPos[1], k); p.y = lerp(1.2, 0, k) + 0.6 * Math.sin(Math.PI * k);
        if (t > EV.bark - 0.1 && t < EV.bark + 1) { p.lean = -0.25; p.eyes = 'half'; p.headY = 0.6; }
      }
      if (t > EV.solo + 1.0) {
        const r = walkPath(p, t, [groundPos, rowPos], EV.solo + 1.0 + seed * 0.5, EV.solo + 3.6 + seed * 0.5, 0.25);
        if (!r.moving && t > EV.solo + 3.6) { p.h = headToward({ ...p, h: 0 }, JSPOT.x, JSPOT.z, 9); sit(p, 0.18); p.headX = -0.2; p.headZ = 0.1 * Math.sin(t * 1.5 + seed); }
      }
      if (t > EV.flash1) { p.headX = -0.7; p.eyes = 'wide'; }
      if (t > EV.catsGo) {
        const r = walkPath(p, t, [rowPos, [FENCE_X - 0.6, HOLE_Z], [FENCE_X + 0.5, HOLE_Z], [FENCE_X + 0.95, waitZ]], EV.catsGo + seed * 0.35, EV.catsGo + 2.6 + seed * 0.35, 0.25);
        p.headX = 0; p.eyes = 'open'; p.sit = 0;
        if (!r.moving && t > EV.catsGo + 2.6 + seed * 0.35) { p.h = Math.PI / 2; sit(p, 0.18); p.headY = -0.6; }
      }
      if (t > hopT + seed * 0.1) {
        const k = clamp((t - hopT - seed * 0.1) / 0.4), pz = headZAt(t) + PORCH + 0.15 - seed * 0.18;
        p.sit = 0; p.x = lerp(FENCE_X + 0.95, TRACK_X + porchDx, k); p.z = lerp(waitZ, pz, k); p.y = lerp(0, 1.45, k) + 0.5 * Math.sin(Math.PI * k);
        p.h = Math.PI; if (k >= 1) { sit(p, 0.18); p.h = 0; p.headY = (seed - 1) * 0.6; }
        p.hide = pz > ZE - 0.05;
      }
      return p;
    };
    add(tubbs, 'TUBBS', 'BOSS OF THE DUMPSTER', '#d8873a', catFn(0, -0.45, [-3.7, -1.5], [-4.45, -1.1], HOLE_Z - 0.45, -0.55));
    add(patch, 'PATCH', 'ONE-EYED ENFORCER', '#e0c030', catFn(1, 0.1, [-3.3, -0.9], [-4.4, -0.45], HOLE_Z, 0));
    add(ghost, 'GHOST', 'THE QUIET ONE', '#eeeae4', catFn(2, 0.55, [-3.9, -0.6], [-4.35, 0.2], HOLE_Z + 0.45, 0.55));
    add(blue, 'OLD BLUE', 'BUSKER, HARMONICA', '#8a5a3a', t => {
      const p = P({ x: 0.95, y: 0, z: -2.5, h: 0.15, t });
      sit(p, 0.15); p.shLx = p.shRx = -0.4; p.elL = p.elR = -1.2;
      if (t < EV.solo + 1.2) { p.headX = 0.55; p.eyes = 'closed'; p.lean = 0.2; }
      else { p.eyes = 'half'; bob(p, beat(t), 0.2); p.hipRx = -0.3 * Math.max(0, Math.sin(Math.PI * 2 * beat(t).ph)); }
      if (t > EV.flash1) { p.headX = -0.5; p.headY = -0.9; p.eyes = 'wide'; }
      if (headZAt(t) > -HD - 1 && headZAt(t) - 18 < HD) { p.headY = 1.0; p.eyes = 'half'; }
      return p;
    });
    add(crow, 'EDGAR', 'SEES EVERYTHING', '#55565e', t => {
      const p = P({ x: 6.15, y: 4.6, z: 0.9, h: -0.6, t });
      sit(p, 0.04); p.headY = 0.5 * Math.sin(t * 0.9); bob(p, beat(t), t > EV.solo ? 0.25 : 0);
      const near = headZAt(t) > -HD - 1 && headZAt(t) < 3 ? 0.6 : 0, f = Math.min(1, bump(t, EV.flash1, 0.8) + bump(t, EV.flash2, 0.6) + near);
      if (f) { p.shLz = 1.4 * f; p.shRz = -1.4 * f; p.rootY = 0.12 * f; }
      return p;
    });
    add(rat, 'NIBS', 'JUST PASSING THROUGH', '#d9a0aa', t => {
      const p = P({ x: 2.2, y: 0, z: -1.2, h: -1.0, t });
      walkPath(p, t, [[2.2, -1.2], [0.8, 0.6], [-1.6, 2.6]], EV.solo + 2.5, EV.solo + 6.0, 0.16);
      p.hide = t < EV.solo + 2.4 || t > EV.solo + 6.1;
      return p;
    });

    // ── lights & weather ──
    const hemi = new THREE.HemisphereLight('#7084b8', '#1c2030', 1.05); scene.add(hemi);
    const doorBulb = new THREE.PointLight('#ffcf8a', 9, 5.5, 1.3); doorBulb.position.set(-HW + 0.5, 2.35, (DOOR.z0 + DOOR.z1) / 2); scene.add(doorBulb);
    const doorSpill = new THREE.PointLight('#ffc070', 0, 3.5, 1.5); doorSpill.position.set(-HW + 0.6, 1.2, -0.05); scene.add(doorSpill);
    const sodium = makeSpot(scene, '#ffaa55', new THREE.Vector3(1.4, 3.45, 2.35), new THREE.Vector3(1.6, 0, 1.9), 0.55, { penumbra: 0.5, clip: CLIP });
    const neonL = new THREE.PointLight('#ff6f96', 3.2, 4, 1.4); neonL.position.set(-HW + 0.7, 2.2, 1.6); scene.add(neonL);
    const tvL = new THREE.PointLight('#5a8ad8', 0, 3, 1.6); tvL.position.set(-1.0, 3.0, -HD + 0.6); scene.add(tvL);
    const sky = new THREE.DirectionalLight('#c8d6ff', 0); sky.position.set(-3, 12, 7); sky.castShadow = true; sky.shadow.mapSize.set(1024, 1024);
    Object.assign(sky.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); scene.add(sky);
    const rain = new Rain(scene, { count: 130, x0: -HW + 1.6, x1: HW - 0.3, z0: -HD + 0.3, z1: HD - 1.0, top: WH - 0.2, speed: 5.5, len: 0.2, wind: 0.42, windZ: -0.18, opacity: 0.2, color: '#b4c4da' });
    rain.lines.userData.noReflect = true; if (rain.splash) rain.splash.userData.noReflect = true;
    const notes = new Notes(scene, C.beats.filter((t, i) => t > EV.solo && t < EV.flash1 && i % 2 === 0).map(t => ({ t, from: () => J.sax.bell.getWorldPosition(new THREE.Vector3()), color: '#ff8b96' })), stage.pxPerM, 16);

    const update = t => {
      for (const o of people) { const p = o.fn(t); o.rig.root.visible = !p.hide; o.rig.apply(p); if (o.rig === L) bags.forEach(b => { b.visible = !!p.bagsOn; }); }
      door.rotation.y = -Math.min(1.25, doorOpen(t));
      lid.rotation.x = -(t > EV.bagsDrop - 0.3 && t < EV.bagsDrop + 0.4 ? 1.2 * bump(t, EV.bagsDrop - 0.3, 0.7) : 0) - 0.06 * bump(t, EV.catsJump, 0.3);
      const bk = t - EV.flash2;
      bell.visible = bk > 0 && t < EV.pick + 0.1;
      if (bell.visible) { const u = clamp(bk / (EV.bellLand - EV.flash2)); bell.position.set(lerp(-6.3, BELL_AT.x, u) + 0.25 * Math.sin(u * 9), lerp(3.4, 0.05, u * u), lerp(1.75, BELL_AT.z, u)); }
      steam.forEach((s, i) => { const u = ((t * 0.35 + i / steam.length) % 1); s.position.set(-0.4 + Math.sin(u * 5 + i) * 0.25 * u, 0.1 + u * 2.4, 1.2 + Math.cos(u * 4 + i) * 0.2 * u); s.scale.setScalar(0.5 + u * 1.6); s.material.opacity = 0.3 * (1 - u); });
      const hz = headZAt(t), running = hz > -ZE - 0.5 && hz - trainLen < ZE + 0.5;
      train.position.z = hz; train.visible = running;
      head.intensity = running && hz > -ZE + 0.2 ? 60 : 0;
      head.userData.shaft.visible = head.intensity > 0; head.userData.shaft.material.uniforms.opacity.value = 0.08;
      signal.material.color.set(running || (t > EV.train2 - 2 && t < EV.train2) || (t < EV.train1 && t > EV.train1 - 2) ? '#ff3a2a' : '#3a1010');
      const f = flash(t);
      hemi.intensity = 1.05 + f * 2.5; sky.intensity = 1.5 + f * 6;
      stage.setFlash(f > 0.9 ? 0.3 : 0, '#eef3ff');
      stage.post.uniforms.shake.value.set(0, running && Math.floor(t * 24) % 2 ? 1 : 0);
      doorSpill.intensity = clamp(doorOpen(t)) * 4;
      inside.visible = doorOpen(t) > 0.05;
      const flick = stepRand(t, 0.07, 9) > 0.06 ? 1 : 0.1;
      neonMat.color.set(flick > 0.5 ? '#ff7f9a' : '#3a2230'); neonL.intensity = 3.2 * flick;
      bladeFace.material.map = bladeBack.material.map = stepRand(t, 0.11, 3) < 0.05 ? bladeOff : bladeOn;
      tvL.intensity = 1.2 + 0.8 * stepRand(t, 0.12, 4); tvWin.material.color.setHSL(0.6, 0.4, 0.25 + 0.15 * stepRand(t, 0.12, 4));
      winLight.visible = !(t > EV.blind && t < EV.blind + 0.25) && !(t > EV.blind + 0.5 && t < EV.blind + 0.6);
      sodium.intensity = 30; sodium.userData.shaft.material.uniforms.opacity.value = 0.08;
      wet.material.uniforms.time.value = t;
      rain.update(t, 1);
      notes.update(t);
    };
    const hud = t => {
      const lh = stage.screenOf(L.head, 0.25);
      if (t >= EV.hiss && t < EV.bark) stage.caption(typed('HSSSS!', t, EV.hiss, 0.3), ...stage.screenOf(tubbs.head, 0.5).map((v, i) => v - (i ? 4 : 10)), '#f2e8d0');
      if (t >= EV.bark && t < EV.bark + 1.6) stage.caption(typed('ALL BARK.', t, EV.bark, 0.25), lh[0] + 10, lh[1] - 14, COL.cream);
      if (t >= EV.flash2 + 0.4 && t < EV.pick) stage.caption('♪ TING', ...stage.screenOf(bell, 0.3).map((v, i) => v + (i ? -6 : 6)), '#e2bb52');
      if (t >= EV.pick + 0.6 && t < EV.point) stage.caption(typed('...HER BELL.', t, EV.pick + 0.6, 0.5), lh[0] + 10, lh[1] - 14, COL.cream);
      if (t >= EV.point && t < hopT + 0.2) {
        stage.centerText(typed('SHE WENT UPSTAIRS.', t, EV.point, 0.6), stage.lowH - 44, COL.ink, 2, COL.cream);
        stage.centerText(typed('→ 2F · ROOM 203', t, EV.point + 0.8, 0.5), stage.lowH - 24, COL.wine, 1, COL.cream);
      }
      if (t >= hopT + 0.5) stage.centerText(typed('THE CATS TOOK THE LAST TRAIN.', t, hopT + 0.5, 0.8), stage.lowH - 24, COL.ink, 1, COL.cream);
    };
    return { scene, update, hud, people, clues: [{ id: 'bell', label: 'THE BELL', t0: EV.bellLand, until: EV.pick, at: () => bell.getWorldPosition(new THREE.Vector3()) }], chapters: [
      { t: 0, label: 'FREIGHT' }, { t: EV.doorOpen, label: 'TRASH NIGHT' }, { t: EV.solo, label: 'THE SOLO' }, { t: EV.flash1, label: 'LIGHTNING' }, { t: EV.pick, label: 'THE BELL' }, { t: EV.train2, label: 'LAST TRAIN' },
    ] };
  },
};

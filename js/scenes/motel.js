// CH.04 · 2F · ROOM 203 — a "murder" upstairs, Detective Jojo's opera glasses, Brooklyn neon, and a prank.
import * as THREE from 'three';
import {
  COL, clamp, lerp, ramp, bump, easeOut, hash1, stepRand, mulberry32, P, headToward,
  mat, canvasOf, canvasTex, grit, paint, pivot, addBox, addCyl, addSphere, quad, makeSpot, Rain, typed, drawText, textW, mixHex, vines,
} from '../engine.js';
import { makeJojo, makeLyly, makeYoyo, makeNPC, holdProp, makeOperaGlasses, makeNotepad, makeDonut, makeCamera } from '../cast.js';
import { idle, lookAt, cheer } from '../acts.js';

const HW = 3.8, HD = 3.2, WH = 3.0, TX = 20, WALK = 0.85;
const WIN = { x0: -1.7, x1: 0.7, y0: 0.9, y1: 2.35 };
const DOOR = { z0: 1.15, z1: 2.15, h: 2.2 };
const BODY = { x: 0.15, z: 0.35 };

function carpetTex() {
  const W = HW * 2 * TX, H = HD * 2 * TX, r = mulberry32(31);
  return canvasTex(paint(W, H, (x, y) => {
    const wx = x / TX - HW, wz = y / TX - HD;
    // chalk outline of a very tall rabbit
    const dx = wx - BODY.x, dz = wz - BODY.z;
    const body = Math.abs(Math.hypot(dx / 0.75, (dz + 0.0) / 0.42) - 1) < 0.06;
    const headC = Math.abs(Math.hypot(dx - 1.05, dz) - 0.32) < 0.05;
    const ear = (Math.abs(dz - 0.12) < 0.03 || Math.abs(dz + 0.12) < 0.03) && dx > 1.3 && dx < 2.0;
    const arm = Math.abs(dx - 0.35) < 0.025 && Math.abs(dz) > 0.4 && Math.abs(dz) < 0.85;
    if (body || headC || ear || arm) return '#f2efe6';
    // 1960s motel geometry: orange/brown diamonds
    const u = ((wx + wz) * 2.2) % 1, v = ((wx - wz) * 2.2) % 1, k = (r() - 0.5) * 10;
    const d = Math.abs((u + 1) % 1 - 0.5) + Math.abs((v + 1) % 1 - 0.5);
    const c = d < 0.18 ? [196, 112, 40] : d < 0.26 ? [120, 66, 30] : d < 0.5 ? [150, 92, 44] : [96, 58, 32];
    return [c[0] + k, c[1] + k, c[2] + k];
  }));
}
function wallpaperTex(len, seed, { mirror = false } = {}) {
  const W = Math.round(len * TX), H = Math.round(WH * TX), r = mulberry32(seed);
  const c = canvasOf(W, H), g = c.getContext('2d');
  g.fillStyle = '#a8863e'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 8) { g.fillStyle = '#93722f'; g.fillRect(x, 0, 2, H); }
  for (let y = 6; y < H - 12; y += 10) for (let x = 4 + ((y / 10) % 2) * 4; x < W; x += 8) { g.fillStyle = '#6e5222'; g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + 1, 3, 1); g.fillRect(x, y + 2, 1, 1); }
  g.fillStyle = '#5a3a1e'; g.fillRect(0, H - 4, W, 4);
  for (let i = 0; i < 25; i++) { g.fillStyle = 'rgba(60,40,20,0.18)'; g.fillRect(r() * W, r() * H, 2 + r() * 10, 2 + r() * 14); }
  grit(g, W, H, 10, r);
  return canvasTex(c);
}
// the view out of the window: rain-blue sky, rowhouse roofs, water towers, a bridge strung with lights
function skylineTex() {
  const W = 140, H = 56, r = mulberry32(9);
  const c = canvasOf(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#141a3a'); grd.addColorStop(0.6, '#3a2a5a'); grd.addColorStop(1, '#6a3a5a');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,240,220,0.5)'; g.fillRect(r() * W, r() * 16, 1, 1); }
  g.strokeStyle = '#1a1830'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, 26); g.quadraticCurveTo(W * 0.35, 14, W * 0.7, 26); g.stroke();                  // the bridge
  for (let x = 2; x < W * 0.7; x += 5) { const y = 26 - 12 * Math.sin(Math.PI * x / (W * 0.7)) * 0.8; g.fillStyle = '#ffe6a0'; g.fillRect(x, Math.round(y), 1, 1); }
  let x = 0;
  while (x < W) {
    const w = 8 + Math.floor(r() * 14), h = 14 + Math.floor(r() * 20);
    g.fillStyle = ['#0e0e1c', '#141428', '#120f20'][Math.floor(r() * 3)]; g.fillRect(x, H - h, w, h);
    for (let wy = H - h + 3; wy < H - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < 0.32) { g.fillStyle = r() < 0.8 ? '#f2c66a' : '#9ad0f0'; g.fillRect(wx, wy, 1, 2); }
    if (r() < 0.35) { g.fillStyle = '#0a0a14'; g.fillRect(x + 2, H - h - 6, 5, 5); g.fillRect(x + 3, H - h - 1, 1, 2); g.fillRect(x + 6, H - h - 1, 1, 2); g.fillRect(x + 2, H - h - 7, 5, 1); }   // water tower
    x += w;
  }
  return canvasTex(c);
}
function bladeTex(text, color, dim = '#120c16') {
  const c = canvasOf(14, text.length * 9 + 4), g = c.getContext('2d');
  [...text].forEach((ch, i) => {
    const x = Math.round((14 - textW(ch) * 2) / 2), y = 3 + i * 9;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(g, ch, x + dx, y + dy, mixHex(color, dim, 0.55), 2, 1);
    drawText(g, ch, x, y, color, 2, 1);
  });
  return canvasTex(c);
}
// straight run of railing from a to b (world xz), posts every `step`
function railing(parent, a, b, { h = 1.0, col = '#2f5a5a', step = 0.6 } = {}) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
  for (const y of [h, h * 0.5]) addBox(parent, y === h ? 0.06 : 0.03, y === h ? 0.06 : 0.03, len, col, (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2).rotation.y = ang;
  for (let d = 0; d <= len + 0.01; d += step) { const u = d / len; addBox(parent, 0.04, h, 0.04, col, a[0] + (b[0] - a[0]) * u, h / 2, a[1] + (b[1] - a[1]) * u); }
}
function scribbleTex(w, h, lines) {
  const c = canvasOf(w, h), g = c.getContext('2d');
  lines.forEach(([s, x, y, col, sc]) => drawText(g, s, x, y, col, sc || 1, sc || 1));
  return canvasTex(c);
}

export default {
  id: 'motel', ch: 4, floor: '2F', label: 'ROOM 203', title: 'The Case of the Pink Stiletto', place: 'Room 203', clock: '00:13',
  audio: 'assets/motel.m4a', cues: 'assets/motel.json',
  fit: { w: 13, h: 9.6 }, target: new THREE.Vector3(0.4, 1.0, 0.4),
  build(stage, C) {
    const EV = C.ev;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COL.paper);
    const cut = mat('#1a120c');

    // ── room ──
    addBox(scene, HW * 2 + 0.36, 0.35, HD * 2 + 0.36, '#2a1c12', 0, -0.175, 0);
    quad(scene, HW * 2, HD * 2, carpetTex(), { y: 0.001, rx: -Math.PI / 2 });
    // outside the open sides: a narrow second-floor walkway, its railing, ivy hanging off the slab
    {
      const e = 0.18, side = mat('#3a3430');
      const deck = (w, d, x, z, seed) => {
        const r = mulberry32(seed), top = new THREE.MeshLambertMaterial({ map: canvasTex(paint(Math.round(w * TX), Math.round(d * TX), (i, j) => {
          const n = (r() - 0.5) * 10, v = (i % 12 === 0 || j % 12 === 0) ? 58 : 76; return [v + n, v - 2 + n, v - 4 + n];
        })) });
        addBox(scene, w, 0.33, d, [side, side, top, side, side, side], x, -0.185, z);
      };
      deck(HW * 2 + e * 2 + WALK, WALK, WALK / 2, HD + e + WALK / 2, 3);
      deck(WALK, HD * 2 + e * 2, HW + e + WALK / 2, 0, 5);
      const ox = HW + e + WALK - 0.05, oz = HD + e + WALK - 0.05;
      railing(scene, [-HW - e, oz], [ox, oz], { h: 0.95, col: '#34403f', step: 0.6 });
      railing(scene, [ox, oz], [ox, -HD - e], { h: 0.95, col: '#34403f', step: 0.6 });
      const rv = mulberry32(12), ivy = [];
      for (let i = 0; i < 7; i++) ivy.push([-HW + rv() * (HW * 2 + WALK), -0.36, oz + 0.04]);
      for (let i = 0; i < 5; i++) ivy.push([ox + 0.04, -0.36, -HD + rv() * HD * 2]);
      vines(scene, ivy, { len: 0.6, cols: ['#2e4626', '#36502a', '#3e5a2e'], seed: 13 });
    }
    const wallL = new THREE.MeshLambertMaterial({ map: wallpaperTex(HD * 2 + 0.2, 4) }), wallB = new THREE.MeshLambertMaterial({ map: wallpaperTex(HW * 2 + 0.4, 7) });
    wallL.shadowSide = wallB.shadowSide = THREE.DoubleSide;
    const wall = (w, h, d, x, y, z, faceIdx, fm, uvFn) => {
      const geo = new THREE.BoxGeometry(w, h, d), p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, ...uvFn(p.getX(i) + x, p.getY(i) + y, p.getZ(i) + z));
      const m = new THREE.Mesh(geo, [0, 1, 2, 3, 4, 5].map(f => (f === faceIdx ? fm : cut))); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    };
    const uvB = (x, y) => [(x + HW + 0.2) / (HW * 2 + 0.4), y / WH], uvL = (x, y, z) => [(z + HD) / (HD * 2 + 0.2), y / WH];
    const BATH = { x0: 2.65, x1: 3.45 };
    for (const [a0, a1, y0, y1] of [[-HW - 0.2, WIN.x0, 0, WH], [WIN.x1, BATH.x0, 0, WH], [BATH.x1, HW + 0.2, 0, WH], [WIN.x0, WIN.x1, 0, WIN.y0], [WIN.x0, WIN.x1, WIN.y1, WH], [BATH.x0, BATH.x1, 2.1, WH]])
      wall(a1 - a0, y1 - y0, 0.2, (a0 + a1) / 2, (y0 + y1) / 2, -HD - 0.1, 4, wallB, uvB);
    for (const [a0, a1, y0, y1] of [[-HD, DOOR.z0, 0, WH], [DOOR.z1, HD + 0.2, 0, WH], [DOOR.z0, DOOR.z1, DOOR.h, WH]])
      wall(0.2, y1 - y0, a1 - a0, -HW - 0.1, (y0 + y1) / 2, (a0 + a1) / 2, 0, wallL, uvL);
    // window: frame, sill, half-raised blinds, glass; outside a fire escape, the rain, the skyline
    addBox(scene, WIN.x1 - WIN.x0 + 0.2, 0.08, 0.28, '#e8e0cc', (WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.02, -HD + 0.06);
    for (const x of [WIN.x0 - 0.05, WIN.x1 + 0.05]) addBox(scene, 0.1, WIN.y1 - WIN.y0 + 0.1, 0.12, '#e8e0cc', x, (WIN.y0 + WIN.y1) / 2, -HD + 0.02);
    addBox(scene, WIN.x1 - WIN.x0 + 0.2, 0.1, 0.12, '#e8e0cc', (WIN.x0 + WIN.x1) / 2, WIN.y1 + 0.04, -HD + 0.02);
    const slats = [];
    for (let y = WIN.y1 - 0.06; y > WIN.y1 - 0.75; y -= 0.07) { const s = addBox(scene, WIN.x1 - WIN.x0 - 0.04, 0.012, 0.06, '#efe8d4', (WIN.x0 + WIN.x1) / 2, y, -HD + 0.07); s.rotation.x = 0.5; slats.push(s); }
    const glass = quad(scene, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, null, { x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y0 + WIN.y1) / 2, z: -HD - 0.05, basic: true, alpha: false });
    glass.material = new THREE.MeshBasicMaterial({ color: '#8aa0c8', transparent: true, opacity: 0.12, depthWrite: false });
    const glassHeart = quad(scene, 0.5, 0.42, scribbleTex(20, 16, [['♡', 4, 1, '#c4142c', 2]]), { x: -0.2, y: 1.75, z: -HD - 0.04, basic: true, alpha: true });
    const iron = mat('#22232a');
    addBox(scene, 3.8, 0.05, 0.8, iron, (WIN.x0 + WIN.x1) / 2, 0.72, -HD - 0.6);
    for (let x = WIN.x0 - 0.4; x <= WIN.x1 + 0.4; x += 0.3) addBox(scene, 0.02, 0.55, 0.02, iron, x, 1.0, -HD - 0.98, false);
    addBox(scene, 3.8, 0.02, 0.02, iron, (WIN.x0 + WIN.x1) / 2, 1.27, -HD - 0.98, false);
    quad(scene, 7.5, 2.9, skylineTex(), { x: -2.0, y: -0.35, z: -HD - 2.2, basic: true });
    const hotelOn = bladeTex('HOTEL', '#ff4a5a'), hotelOff = bladeTex('HOTEL', '#3a1820');
    const hotel = quad(scene, 0.32, 1.1, hotelOn, { x: -2.5, y: 0.15, z: -HD - 1.6, basic: true, alpha: true });
    const barSign = quad(scene, 0.75, 0.3, scribbleTex(30, 12, [['BAR→', 2, 2, '#ff8acb']]), { x: -1.3, y: 0.25, z: -HD - 1.7, basic: true, alpha: true });
    const boltTex = canvasTex(paint(30, 50, (x, y) => { const cx = 15 + Math.round(6 * Math.sin(y * 0.45) + (y > 25 ? (y - 25) * 0.3 : 0)); return Math.abs(x - cx) < 1 ? '#f6f8ff' : (Math.abs(x - cx) < 2 ? [170, 180, 255, 140] : null); }));
    const bolt = quad(scene, 0.7, 1.2, boltTex, { x: -2.0, y: 0.55, z: -HD - 2.0, basic: true, alpha: true });
    const rainOut = new Rain(scene, { count: 90, x0: WIN.x0 - 2.4, x1: WIN.x1 - 1.4, z0: -HD - 2.0, z1: -HD - 0.3, top: 1.6, speed: 6, len: 0.2, wind: 0.3, windZ: 0, opacity: 0.35, color: '#b4c4da', splash: false });
    // furniture: bed with nightstands, CRT on a dresser, armchair, vanity mirror, suitcase
    const bed = pivot(scene, -2.75, 0, -1.4);
    addBox(bed, 2.1, 0.35, 1.6, '#3a2618', 0, 0.2, 0); addBox(bed, 2.0, 0.18, 1.55, '#e9e2d0', 0.05, 0.45, 0);
    addBox(bed, 1.4, 0.12, 1.6, '#4a6a8a', 0.4, 0.55, 0.0).rotation.z = 0.04;
    addBox(bed, 0.08, 1.0, 1.7, '#5a3a22', -1.05, 0.5, 0);
    for (const z of [-0.4, 0.4]) addBox(bed, 0.35, 0.12, 0.45, '#f4efe2', -0.75, 0.6, z);
    const stand = z => { const g = pivot(scene, -3.5, 0, z); addBox(g, 0.5, 0.55, 0.45, '#4a2e1a', 0, 0.275, 0); addCyl(g, 0.07, 0.09, 0.3, 6, '#c9a24a', 0, 0.7, 0); addCyl(g, 0.12, 0.17, 0.2, 8, mat('#f2d6a0', { basic: true }), 0, 0.95, 0); return g; };
    stand(-2.55); stand(-0.25);
    addBox(scene, 0.12, 0.08, 0.2, '#1a1a1a', -3.42, 0.6, -0.3);
    const dresser = pivot(scene, 3.45, 0, -0.5);
    addBox(dresser, 0.6, 0.75, 1.4, '#4a2e1a', 0, 0.375, 0);
    const tv = pivot(dresser, -0.05, 0.75, 0); tv.rotation.y = -Math.PI / 2;
    addBox(tv, 0.75, 0.6, 0.55, '#2a2420', 0, 0.3, 0);
    const tvScreen = addBox(tv, 0.55, 0.42, 0.02, mat('#8ab0d8', { basic: true }), -0.05, 0.32, 0.28, false);
    for (const dx of [-0.12, 0.12]) addCyl(tv, 0.005, 0.005, 0.5, 3, '#bbb', dx, 0.8, 0).rotation.z = dx * 3;
    const arm = pivot(scene, 2.85, 0, 2.15); arm.rotation.y = -2.4;
    addBox(arm, 0.8, 0.4, 0.75, '#5a7a5a', 0, 0.3, 0); addBox(arm, 0.8, 0.55, 0.15, '#4a6a4a', 0, 0.65, -0.32);
    for (const sx of [-0.4, 0.4]) addBox(arm, 0.12, 0.25, 0.75, '#4a6a4a', sx, 0.55, 0);
    addCyl(scene, 0.02, 0.02, 1.6, 4, '#2a2a2a', 3.4, 0.8, 2.75); addCyl(scene, 0.15, 0.22, 0.25, 8, mat('#f2dcb0', { basic: true }), 3.4, 1.65, 2.75);
    const vanity = pivot(scene, 1.62, 0, -HD + 0.3);
    addBox(vanity, 1.3, 0.8, 0.5, '#4a2e1a', 0, 0.4, 0);
    addBox(vanity, 0.95, 0.85, 0.04, '#c9a24a', 0, 1.65, -0.2);
    const mirrorClean = canvasTex(paint(38, 34, (x, y) => [150 + ((x + y) % 7) * 3, 170 + ((x + y) % 7) * 3, 180 + ((x + y) % 7) * 3]));
    const mirrorWritten = (() => { const c = canvasOf(38, 34), g = c.getContext('2d'); g.drawImage(mirrorClean.image, 0, 0); drawText(g, 'YOYO', 6, 6, '#c4142c'); drawText(g, '200%', 6, 16, '#c4142c'); drawText(g, '♡', 28, 24, '#c4142c'); return canvasTex(c); })();
    const mirror = quad(vanity, 0.85, 0.75, mirrorClean, { y: 1.65, z: -0.17, basic: true });
    const suitcase = pivot(scene, -1.45, 0, 1.25); suitcase.rotation.y = 0.4;
    addBox(suitcase, 0.8, 0.12, 0.5, '#6a3a2a', 0, 0.06, 0); const lidS = pivot(suitcase, 0, 0.12, -0.25); lidS.rotation.x = -1.9; addBox(lidS, 0.8, 0.08, 0.5, '#6a3a2a', 0, 0, 0.25);
    addBox(suitcase, 0.6, 0.06, 0.35, '#e8c8d8', 0, 0.14, 0.02); addBox(suitcase, 0.3, 0.05, 0.2, '#3a5a8a', 0.15, 0.18, 0);
    // bathroom door ajar, hallway beyond the taped door
    const bdoor = pivot(scene, BATH.x0, 0, -HD + 0.02); bdoor.rotation.y = -0.7;
    addBox(bdoor, 0.88, 2.06, 0.05, '#e6dcc4', 0.44, 1.03, 0.02);
    quad(scene, BATH.x1 - BATH.x0, 2.1, null, { x: (BATH.x0 + BATH.x1) / 2, y: 1.05, z: -HD - 0.4, basic: true }).material.color.set('#f2f6ee');
    quad(scene, 2.0, DOOR.h, null, { x: -HW - 0.8, y: DOOR.h / 2, z: (DOOR.z0 + DOOR.z1) / 2, ry: Math.PI / 2, basic: true }).material.color.set('#c8d8b0');
    quad(scene, 0.8, 1.8, null, { x: -HW - 0.4, y: 0.001, z: (DOOR.z0 + DOOR.z1) / 2, rx: -Math.PI / 2, basic: true }).material.color.set('#6a7a5a');
    const room = pivot(scene, -HW + 0.08, 0, DOOR.z0); room.rotation.y = 1.3;
    addBox(room, 0.05, DOOR.h - 0.02, 1.0, '#6a4a2e', 0, DOOR.h / 2, 0.5); addBox(room, 0.06, 0.06, 0.06, '#d9b24e', 0.04, 1.0, 0.85);
    addBox(room, 0.02, 0.18, 0.12, '#f2e6c0', 0.05, 1.3, 0.85);
    addBox(scene, 0.06, 0.25, 0.3, '#d9b24e', -HW + 0.04, 2.45, (DOOR.z0 + DOOR.z1) / 2);   // "203" plate
    for (const [a, b] of [[0.5, -0.5], [-0.5, 0.5]]) { const tape = addBox(scene, 0.02, 0.07, 1.45, '#f2d22a', -HW + 0.05, 1.15, (DOOR.z0 + DOOR.z1) / 2, false); tape.rotation.x = Math.atan2(1.6, 1.0) * a * 1.2; }
    // evidence markers, stuffing, tiny lipstick paw prints toward the window
    const markers = [[0.85, 0.8], [-0.45, -1.1], [-0.6, -2.0], [-0.62, -2.85]].map(([x, z], i) => {
      const g = pivot(scene, x, 0, z); g.rotation.y = 0.6;
      const a = addBox(g, 0.16, 0.14, 0.02, '#f2c62a', 0, 0.06, 0.04); a.rotation.x = -0.4; const b = addBox(g, 0.16, 0.14, 0.02, '#f2c62a', 0, 0.06, -0.04); b.rotation.x = 0.4;
      addBox(g, 0.04, 0.05, 0.01, '#111', 0, 0.08, 0.06); return g;
    });
    for (let i = 0; i < 9; i++) addSphere(scene, 0.06 + hash1(i) * 0.05, '#f8f4ee', BODY.x + 0.9 + hash1(i * 3) * 0.6 - 0.3, 0.05, BODY.z + 0.45 + hash1(i * 7) * 0.5 - 0.25, 5);
    for (let i = 0; i < 6; i++) addBox(scene, 0.08, 0.005, 0.07, '#c4142c', -0.35 - i * 0.05 + (i % 2) * 0.1, 0.004, -0.75 - i * 0.42, false);

    // ── cast ──
    const people = [];
    const add = (rig, name, role, color, fn) => { const o = { rig, name, role, color, fn }; people.push(o); return o; };
    const J = makeJojo(scene, { outfit: 'trench', sax: false }), L = makeLyly(scene, { outfit: 'police' }), Y = makeYoyo(scene, { guitar: false, umbrella: true });
    holdProp(J, 0, makeOperaGlasses(pivot(scene)), 'opera');
    holdProp(L, 0, makeNotepad(pivot(scene)), 'notepad');
    const donut = holdProp(L, 1, makeDonut(pivot(scene)), 'donut');
    const bunny = makeNPC(scene, { species: 'rabbit', fur: '#f2c9d2', outfit: { jacket: '#f2c9d2', pants: '#f2c9d2' }, paw: '#f8e6ea', scale: 1.15, eyeCol: '#141414' });
    const owl = makeNPC(scene, { species: 'owl', outfit: { jacket: '#3a3a40', shirt: '#e8e2d6', tie: '#8a7a3a' }, hat: 'fedora', hatCol: '#4a4a50' });
    const camera = holdProp(owl, 1, makeCamera(pivot(scene)), 'camera');
    const turtle = makeNPC(scene, { species: 'tortoise', outfit: { jacket: '#8a6a4a', shirt: '#e6dcc8', pants: '#5a4a3a' }, shell: true, glasses: '#c9c9c9' });
    const fluff = makeNPC(scene, { species: 'poodle', fur: '#f0e2ea', outfit: { jacket: '#e7a6c4', skirt: '#e7a6c4', skirtLen: 0.5 }, hat: 'curlers' });
    const stiletto = pivot(scene); addBox(stiletto, 0.2, 0.05, 0.07, COL.coral, 0, 0.04, 0); addBox(stiletto, 0.03, 0.12, 0.03, COL.coral, -0.08, -0.02, 0); stiletto.visible = false;

    const LENS = [
      { t0: EV.lens1, t1: EV.lens1 + 2.3, at: () => new THREE.Vector3(BODY.x + 0.95, 0.1, BODY.z + 0.5), label: 'CLUE 01 · STUFFING', sub: 'THE VICTIM IS PLUSH' },
      { t0: EV.lens2, t1: EV.lens2 + 2.2, at: () => new THREE.Vector3(-0.5, 0.05, -1.7), label: 'CLUE 02 · PAW PRINTS', sub: 'SIZE 2 · CAT · LIPSTICK' },
      { t0: EV.lens3, t1: EV.lens3 + 2.0, at: () => new THREE.Vector3((WIN.x0 + WIN.x1) / 2, 1.2, -HD), label: 'CLUE 03 · THE WINDOW', sub: 'UNLATCHED FROM OUTSIDE' },
      { t0: EV.lens4, t1: EV.lens4 + 2.0, at: () => Y.head.getWorldPosition(new THREE.Vector3()), label: 'SUSPECT · YOYO', sub: 'THREAT ♡♡♡♡♡' },
      { t0: EV.lens5, t1: EV.lens5 + 2.0, at: () => new THREE.Vector3(1.62, 1.65, -HD + 0.15), label: 'SIGNED · YOYO 200%', sub: 'OF COURSE.' },
    ];
    const lensAt = t => LENS.find(l => t >= l.t0 && t < l.t1);
    const dark = t => t >= EV.dark && t < EV.lights;
    const freeze = (fn, seed) => t => {
      const p = fn(t); p.t = t;
      if (t > EV.bolt1 + 0.2 && t < EV.lights) { lookAt(p, (WIN.x0 + WIN.x1) / 2, -HD, 1, 1.6); p.eyes = 'wide'; }
      if (t > EV.lights + 0.6 && t < EV.sitUp) lookAt(p, 1.62, -HD, 0.9, 1.6);
      const pop = bump(t, EV.sitUp, 1.2); if (pop) { p.rootY += 0.15 * pop; p.eyes = 'wide'; cheer(p, pop * 0.8); }
      return p;
    };

    // JOJO: kneels by the body, works the opera glasses, gets her stiletto back
    const JPOS = { x: -0.75, z: 1.2 };
    add(J, 'JOJO', 'DETECTIVE · NO TALK', COL.coral, freeze(t => {
      const p = P({ ...JPOS, y: 0, h: headToward({ ...JPOS, h: 0 }, BODY.x + 0.5, BODY.z, 9), eyes: 'half', noClip: t < EV.pin, t });
      p.crouch = 0.55; p.hipLx = -0.5; p.kneeL = 0.2; p.lean = 0.25; p.headX = 0.25;
      p.shRx = -0.4; p.elR = -0.9; p.shLx = -0.3; p.elL = -0.6;
      const L0 = lensAt(t);
      if (L0) { const target = L0.at(); p.h = headToward({ ...JPOS, h: 0 }, target.x, target.z, 9); p.shLx = -1.6; p.shLz = -0.35; p.elL = -1.9; p.headX = target.y > 1 ? -0.3 : 0.25; }
      if (t > EV.pick - 0.6) {
        const k = ramp(t, EV.pick - 0.6, EV.pick); p.crouch = lerp(0.55, 0.7, k); p.shRx = -1.2; p.elR = -0.3;
        if (t > EV.pick) { p.crouch = lerp(0.7, 0, ramp(t, EV.pick, EV.pick + 0.6)); p.shRx = lerp(-1.2, -0.9, ramp(t, EV.pick, EV.pin)); p.elR = lerp(-0.3, -1.6, ramp(t, EV.pick, EV.pin)); p.lean = 0; p.headX = 0.2; p.hipLx = 0; }
        if (t > EV.pin + 0.4) { p.shRx = -0.2; p.elR = -0.4; p.headX = -0.15; p.eyes = 'closed'; p.h = 0.75; }
      }
      return p;
    }, 0));
    // LYLY: officer on the scene: notes, donut, a very loud reaction
    add(L, 'LYLY', 'OFFICER · ALL BARK', COL.lime, freeze(t => {
      const p = P({ x: 1.35, y: 0, z: 1.75, h: -2.5, mouth: 0.25, t });
      p.shLx = -0.9; p.elL = -1.2; p.shLz = -0.2;
      p.shRx = -0.6; p.elR = -1.0 + 0.3 * Math.sin(t * 14) * (t < EV.donut ? 1 : 0); p.shRz = 0.2;
      const bite = bump(t, EV.donut, 1.0); if (bite) { p.shRx = -1.4; p.elR = -1.8; p.mouth = 0.8 * bite; }
      p.no_donut = t > EV.donutDrop;
      if (t > EV.sitUp && t < EV.sitUp + 1.0) { p.mouth = 1; p.headX = -0.4; }
      return p;
    }, 1));
    add(owl, 'HOOTSBY', 'FORENSIC PHOTOGRAPHER', '#d9a441', freeze(t => {
      const p = P({ x: 1.55, y: 0, z: -0.65, h: -1.0, t });
      p.shLx = p.shRx = -1.35; p.elL = p.elR = -1.1; p.shLz = -0.25; p.shRz = 0.25; p.headX = 0.2;
      const nf = C.flashes.find(f => t > f - 0.6 && t < f + 0.4); if (nf) { p.lean = 0.15; p.headX = 0.35; }
      return p;
    }, 2));
    add(turtle, 'MR. SLOWE', 'MOTEL MANAGER', '#8a6a4a', freeze(t => {
      const p = P({ x: -HW - 0.35, y: 0, z: 1.6, h: Math.PI / 2, t });
      idle(p, t, 3); p.shLx = -0.9; p.elL = -1.1; p.shRx = -0.2;
      p.shell = t > EV.sitUp && t < EV.sitUp + 2.6;
      return p;
    }, 3));
    add(fluff, 'MRS. FLUFF', 'ROOM 204, NOSY', '#e7a6c4', freeze(t => {
      const p = P({ x: -HW - 0.45, y: 0, z: 2.0, h: Math.PI / 2 - 0.4, t });
      p.lean = 0.25; p.side = -0.15 * Math.sin(t * 0.8) - 0.1; p.shRx = -1.4; p.elR = -1.8; p.headY = 0.3;
      return p;
    }, 4));
    // Mr. Bunny: the "victim"
    add(bunny, 'MR. BUNNY', 'THE VICTIM (?)', '#f2c9d2', t => {
      const p = P({ x: BODY.x - 0.55, y: 0.22, z: BODY.z, h: Math.PI / 2, pitch: Math.PI / 2, t });
      p.shLx = p.shRx = -2.8; p.eyes = 'closed'; p.hipLx = p.hipRx = 0.1;
      p.rootY = 0.02 * bump(t, EV.twitch, 0.25) + 0.02 * bump(t, EV.twitch + 0.4, 0.2);
      if (t > EV.sitUp) {
        const k = easeOut((t - EV.sitUp) / 0.35);
        p.pitch = lerp(Math.PI / 2, 0, k); p.y = lerp(0.22, 0, k); p.sit = k; p.seatY = 0.12; p.eyes = 'open';
        p.shLx = lerp(-2.8, -0.3, k); p.shRx = lerp(-2.8, -2.6, k); p.shRz = -0.3; p.elR = -0.3 + 0.35 * Math.sin(t * 9); p.headZ = 0.25 * k;
      }
      return p;
    });
    // YOYO: outside on the fire escape — once in the lightning, once more to say she was kidding
    add(Y, 'YOYO', 'OUTSIDE THE WINDOW', COL.wine, t => {
      const p = P({ x: -0.55, y: 0.75, z: -HD - 0.55, h: 0.15, t, umbrella: true });
      p.shLx = -1.8; p.shLz = 0.25; p.elL = -0.6; p.shRx = -1.2; p.elR = -1.0;
      p.hide = !((t > EV.bolt1 - 0.15 && t < EV.dark) || t > EV.peekIn);
      if (t > EV.peekIn) { p.x = 0.2; p.shRx = -2.6; p.shRz = -0.3; p.elR = -0.4 + 0.3 * Math.sin(t * 10); p.wink = true; p.headZ = 0.3; }
      return p;
    });

    // ── lights ──
    const hemi = new THREE.HemisphereLight('#ffe0b8', '#2a1a10', 0.55); scene.add(hemi);
    const lamps = [-2.55, -0.25].map(z => { const l = new THREE.PointLight('#ffc68a', 3.2, 4.2, 1.5); l.position.set(-3.5, 1.0, z); scene.add(l); return l; });
    const floorLamp = new THREE.PointLight('#ffd0a0', 2.6, 4, 1.5); floorLamp.position.set(3.4, 1.6, 2.75); scene.add(floorLamp);
    const tvL = new THREE.PointLight('#7aa8e8', 2, 3.5, 1.5); tvL.position.set(2.9, 1.1, -0.5); scene.add(tvL);
    const hall = new THREE.PointLight('#d8f0c0', 3, 4, 1.4); hall.position.set(-HW - 0.6, 1.8, 1.65); scene.add(hall);
    const neonIn = new THREE.PointLight('#ff4a6a', 2.2, 4.5, 1.4); neonIn.position.set(-0.5, 1.6, -HD + 0.6); scene.add(neonIn);
    const lightning = makeSpot(scene, '#e8eeff', new THREE.Vector3(-1.8, 3.6, -HD - 3.0), new THREE.Vector3(0.6, 0, 0.8), 0.55, { shaft: false, penumbra: 0.2 });
    const bathL = new THREE.PointLight('#f0f6ff', 2.2, 3, 1.5); bathL.position.set(3.05, 1.6, -HD + 0.6); scene.add(bathL);
    const flashL = new THREE.PointLight('#ffffff', 0, 6, 1.2); scene.add(flashL);

    const update = t => {
      for (const o of people) {
        const p = o.fn(t); o.rig.root.visible = !p.hide; o.rig.apply(p);
        if (o.rig === turtle) turtle.head.scale.setScalar(p.shell ? 0.05 : 1);
      }
      const off = dark(t) ? 0 : (t >= EV.lights && t < EV.lights + 0.3 ? (stepRand(t, 0.05, 2) > 0.5 ? 1 : 0.1) : 1);
      const bolt1 = t > EV.bolt1 && t < EV.bolt1 + 0.45 ? ((t - EV.bolt1) < 0.07 || ((t - EV.bolt1) > 0.16 && (t - EV.bolt1) < 0.24) ? 1 : 0.2) : 0;
      const bolt2 = t > EV.bolt2 && t < EV.bolt2 + 0.12 ? 1 : 0;
      const far = t > EV.rumble && t < EV.rumble + 0.3 ? 0.35 : 0;
      const L = Math.max(bolt1, bolt2, far);
      lightning.intensity = 120 * L; hemi.intensity = 0.55 * off + 1.4 * L;
      bolt.visible = L > 0.9;
      stage.setFlash(L > 0.9 ? 0.25 : 0, '#eef3ff');
      lamps.forEach(l => { l.intensity = 3.2 * off; }); floorLamp.intensity = 2.6 * off; bathL.intensity = 2.2 * off; hall.intensity = 3 * off;
      const tvFlick = 0.6 + 0.4 * stepRand(t, 0.08, 5);
      tvL.intensity = 2 * tvFlick * off; tvScreen.material.color.setHSL(0.58, 0.25, (0.45 + 0.3 * stepRand(t, 0.05, 8)) * (off ? 1 : 0.15));
      const hotelLit = stepRand(t, 0.18, 4) > 0.12;
      hotel.material.map = hotelLit ? hotelOn : hotelOff; neonIn.intensity = (hotelLit ? 2.2 : 0.4) * (1 + L);
      barSign.visible = stepRand(t, 0.4, 6) > 0.1;
      // the photographer's flashes
      const fk = C.flashes.reduce((m, f) => (t >= f && t < f + 0.12 ? 1 : m), 0);
      camera.getWorldPosition(flashL.position); flashL.intensity = fk * 30;
      if (fk && !L) stage.setFlash(0.12, '#ffffff');
      camera.bulb.material = fk ? mat('#ffffff', { basic: true }) : mat('#f8f4e8');
      glassHeart.visible = t > EV.lights;
      mirror.material.map = t > EV.lights ? mirrorWritten : mirrorClean;
      slats.forEach((s, i) => { s.rotation.x = 0.5 + 0.25 * bump(t, EV.bolt1, 1.2) * Math.sin(i); });
      stiletto.visible = t > EV.stiletto && t < EV.pick;
      if (stiletto.visible) { const k = clamp((t - EV.stiletto) / 0.5); stiletto.position.set(BODY.x + 0.3 + 0.4 * k, 0.6 * (1 - k) * (1 - k) + 0.03 + 0.15 * Math.sin(Math.PI * k), BODY.z + 0.4 + 0.3 * k); stiletto.rotation.set(0, k * 5, k * 2); }
      rainOut.update(t);
      // the opera-glass view
      const l = lensAt(t);
      if (l) {
        const [x, y] = stage.screenOf(l.at()), open = easeOut((t - l.t0) / 0.3) * (1 - easeOut((t - l.t1 + 0.25) / 0.25));
        const r = lerp(stage.lowW * 0.6, Math.min(stage.lowW, stage.lowH) * 0.2, open);
        stage.post.uniforms.lens.value.set(x, stage.lowH - y, r, open);
      } else stage.post.uniforms.lens.value.set(0, 0, 0, 0);
    };
    const hud = t => {
      const l = lensAt(t);
      if (l) {
        const [x, y] = stage.screenOf(l.at()), g = stage.hg, s = 7;
        g.fillStyle = '#ffe28a';
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillRect(x + dx * s - (dx > 0 ? 3 : 0), y + dy * s, 4, 1); g.fillRect(x + dx * s, y + dy * s - (dy > 0 ? 3 : 0), 1, 4); }
        g.fillRect(x, y, 1, 1);
        const r = Math.min(stage.lowW, stage.lowH) * 0.2;
        stage.caption(typed(l.label, t, l.t0 + 0.2, 0.4), Math.round(x - textW(l.label) / 2), Math.round(y + r * 0.7 + 4), '#ffe28a', COL.ink);
        stage.caption(typed(l.sub, t, l.t0 + 0.5, 0.4), Math.round(x - textW(l.sub) / 2), Math.round(y + r * 0.7 + 14), COL.cream, COL.ink);
      }
      if (t >= EV.vo && t < EV.vo + 2.4) stage.centerText(typed('JUST KIDDING!', t, EV.vo, 0.4), stage.lowH - 30, COL.wine, 2, COL.cream);
      if (t >= EV.stamp) {
        // a rubber stamp, slightly crooked
        const g = stage.hg, word = 'CASE CLOSED', sc = 2, w = textW(word, sc) + 12, h = 7 * sc + 10;
        const k = clamp((t - EV.stamp) / 0.12), size = lerp(1.8, 1, k);
        const c = canvasOf(w, h), cg = c.getContext('2d');
        cg.fillStyle = COL.wine; cg.fillRect(0, 0, w, 2); cg.fillRect(0, h - 2, w, 2); cg.fillRect(0, 0, 2, h); cg.fillRect(w - 2, 0, 2, h);
        drawText(cg, word, 6, 5, COL.wine, sc);
        g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(stage.lowW / 2), Math.round(stage.lowH * 0.44)); g.rotate(-0.12); g.scale(size, size);
        g.drawImage(c, -Math.round(w / 2), -Math.round(h / 2)); g.restore();
        if (t > EV.stamp + 0.6) stage.centerText(typed('IT WAS A PRANK. IT WAS ALWAYS YOYO.', t, EV.stamp + 0.6, 0.8), stage.lowH - 18, COL.ink, 1, COL.cream);
      }
    };
    return { scene, update, hud, people, clues: [{ id: 'stiletto', label: 'THE PINK STILETTO', t0: EV.stiletto + 0.5, until: EV.pick, at: () => stiletto.getWorldPosition(new THREE.Vector3()) }], chapters: [
      { t: 0, label: 'THE SCENE' }, { t: EV.lens1, label: 'THE GLASSES' }, { t: EV.bolt1, label: 'LIGHTNING' }, { t: EV.lights, label: 'SIGNED' }, { t: EV.sitUp, label: 'THE VICTIM' }, { t: EV.stamp, label: 'CLOSED' },
    ] };
  },
};

// CH.01 · 1F · THE JOLLY CLUB — the band plays the chorus, the crowd barks along, the lights die, the pink stiletto is gone.
import * as THREE from 'three';
import {
  COL, clamp, lerp, smooth, ramp, bump, easeOut, stepRand, mulberry32, sinceEv, beatClock, envSampler, P, blendSegs, headToward,
  mat, roomClip, canvasOf, canvasTex, grit, paint, mixHex, pivot, addBox, addCyl, quad, wallWithHoles, makeSpot, Notes, drawText, textW, typed,
  makeSurround, foliage,
} from '../engine.js';
import { makeJojo, makeLyly, makeYoyo, makeNPC, holdProp, makeBass, makeTray, makeGlass, makeMic, makeDrums, makeGrandPiano, makeCigar } from '../cast.js';
import { idle, sit, drink, chat, bob, cheer, dance, walkPath, polish, lookAt, startle } from '../acts.js';

const HW = 6.5, HD = 4.5, WH = 3.3, TX = 20;
const STG = { x0: 0.8, x1: HW, z0: -HD, z1: -1.9, h: 0.4 };
const DANCE = { x0: 0.8, x1: 6.2, z0: -1.6, z1: 1.6 };
const ENTRY = { z0: 2.35, z1: 3.35, h: 2.3 };

function floorTex() {
  const W = HW * 2 * TX, H = HD * 2 * TX, r = mulberry32(11);
  const c = canvasOf(W, H), g = c.getContext('2d');
  const cols = ['#5a3826', '#52331f', '#61402b', '#4c2f1e', '#573522'];
  for (let y = 0; y < H; y += 4) {
    let x = -Math.floor(r() * 30);
    while (x < W) { const len = 16 + Math.floor(r() * 24); g.fillStyle = cols[Math.floor(r() * 5)]; g.fillRect(x, y, len, 4); g.fillStyle = '#2e1b11'; g.fillRect(x, y, 1, 4); x += len; }
    g.fillStyle = '#331f13'; g.fillRect(0, y + 3, W, 1);
  }
  const X = x => (x + HW) * TX, Z = z => (z + HD) * TX;
  for (let zz = DANCE.z0, j = 0; zz < DANCE.z1 - 0.01; zz += 0.6, j++) for (let xx = DANCE.x0, i = 0; xx < DANCE.x1 - 0.01; xx += 0.6, i++) {
    g.fillStyle = (i + j) % 2 ? '#1d1a1a' : '#e6dcc6'; g.fillRect(X(xx), Z(zz), 12, 12);
  }
  g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.strokeRect(X(DANCE.x0) - 0.5, Z(DANCE.z0) - 0.5, (DANCE.x1 - DANCE.x0) * TX + 1, (DANCE.z1 - DANCE.z0) * TX + 1);
  g.fillStyle = '#1f2a52'; g.fillRect(X(-HW), Z(2.45), 3.2 * TX, 0.8 * TX);
  g.fillStyle = '#c9a24a'; g.fillRect(X(-HW), Z(2.45) + 1, 3.2 * TX, 1); g.fillRect(X(-HW), Z(3.25) - 2, 3.2 * TX, 1);
  grit(g, W, H, 12, r);
  return canvasTex(c);
}
function wallTex(len) {
  const W = Math.round(len * TX), H = Math.round(WH * TX), r = mulberry32(len * 10);
  const c = canvasOf(W, H), g = c.getContext('2d'), wain = 20;
  g.fillStyle = '#1d3f37'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 10) for (let y = 4; y < H - wain - 6; y += 10) {          // deco fans
    const ox = x + ((y / 10) % 2) * 5;
    g.fillStyle = '#2a5448'; g.fillRect(ox + 2, y + 3, 5, 1); g.fillRect(ox + 3, y + 2, 3, 1);
    g.fillStyle = '#9a8048'; g.fillRect(ox + 4, y + 4, 1, 1);
  }
  g.fillStyle = '#15110d'; g.fillRect(0, 0, W, 2); g.fillStyle = '#b08a42'; g.fillRect(0, 2, W, 1);
  g.fillStyle = '#3a2416'; g.fillRect(0, H - wain, W, wain);
  g.fillStyle = '#c09848'; g.fillRect(0, H - wain - 1, W, 1);
  for (let x = 2; x < W - 10; x += 14) { g.strokeStyle = '#573823'; g.strokeRect(x + 0.5, H - wain + 3.5, 10, wain - 8); }
  g.fillStyle = '#1b110a'; g.fillRect(0, H - 2, W, 2);
  grit(g, W, H, 9, r);
  return canvasTex(c);
}
function sunburstTex(w, h) {
  return canvasTex(paint(Math.round(w * TX), Math.round(h * TX), (x, y) => {
    const cx = w * TX / 2, cy = h * TX + 4, a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
    const ray = Math.floor((a + Math.PI) * 18 / Math.PI) % 2;
    if (d < 12) return '#d9b24e';
    if (d < 14) return '#1a1f3d';
    if (Math.abs(d - 30) < 0.8 || Math.abs(d - 52) < 0.8) return '#b8954a';
    return ray ? '#2e3b78' : '#161b3a';
  }));
}
function signTex(text, color, dim) {
  // glyphs drawn 2× wide so the wall's foreshortening leaves them square on screen
  const w = textW(text) * 2 + 8, c = canvasOf(w, 11), g = c.getContext('2d');
  const draw = (col, dx, dy) => { let x = 4 + dx; for (const ch of text) { drawText(g, ch, x, 2 + dy, col, 2, 1); x += (textW(ch) + 1) * 2; } };
  if (color !== dim) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) draw(mixHex(color, '#1a1f3d', 0.6), dx, dy);
  draw(color, 0, 0);
  return { tex: canvasTex(c), w };
}

export default {
  id: 'bar', ch: 1, floor: '1F', label: 'CLUB', title: 'No Talk, All Bark', place: 'The Jolly Club', clock: '23:47',
  audio: 'assets/bar.m4a', cues: 'assets/bar.json',
  fit: { w: 21, h: 13.2 }, target: new THREE.Vector3(0.2, 1.5, 0),
  build(stage, C) {
    const EV = C.ev, beat = beatClock(C.beats);
    const vox = envSampler(C.vox, EV.music), horns = envSampler(C.horns, EV.music), keys = envSampler(C.keys, EV.music);
    const BASS_T = C.bassOn, DRUM_T = C.drumOn, BARKS = [EV.bark1, EV.bark2, EV.wang1, EV.wang2];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COL.paper);
    const cut = mat('#17110d');
    const ownGlow = new Map();                         // this room's lamps go dark in the blackout, so they get their own materials
    const glow = c => { if (!ownGlow.has(c)) ownGlow.set(c, new THREE.MeshBasicMaterial({ color: c })); return ownGlow.get(c); };

    // ── room shell ──
    addBox(scene, HW * 2 + 0.36, 0.35, HD * 2 + 0.36, '#2b1a11', 0, -0.175, 0);
    addBox(scene, HW * 2 + 0.38, 0.03, 0.03, '#b48d43', 0, -0.02, HD + 0.185, false);
    addBox(scene, 0.03, 0.03, HD * 2 + 0.38, '#b48d43', HW + 0.185, -0.02, 0, false);
    quad(scene, HW * 2, HD * 2, floorTex(), { y: 0.001, rx: -Math.PI / 2 });
    wallWithHoles(scene, { axis: 'x', at: -HD, from: -HW - 0.18, to: HW + 0.18, h: WH, tex: wallTex(HW * 2 + 0.36), cut, holes: [{ a0: -6.15, a1: -5.4, y0: 0, y1: 2.15 }] });
    wallWithHoles(scene, { axis: 'z', at: -HW, from: -HD, to: HD + 0.18, h: WH, tex: wallTex(HD * 2 + 0.18), cut, holes: [{ a0: ENTRY.z0, a1: ENTRY.z1, y0: 0, y1: ENTRY.h }] });
    // cellar door behind the bar + entrance + coat check
    addBox(scene, 0.73, 2.12, 0.05, '#3a2216', -5.775, 1.06, -HD + 0.04);
    addBox(scene, 0.4, 0.12, 0.02, '#c9a24a', -5.775, 1.75, -HD + 0.08, false);
    addBox(scene, 0.06, 2.4, 0.08, '#2a180e', -HW + 0.03, 1.2, ENTRY.z0 - 0.04); addBox(scene, 0.06, 2.4, 0.08, '#2a180e', -HW + 0.03, 1.2, ENTRY.z1 + 0.04);
    addBox(scene, 0.06, 0.1, ENTRY.z1 - ENTRY.z0 + 0.16, '#2a180e', -HW + 0.03, ENTRY.h + 0.05, (ENTRY.z0 + ENTRY.z1) / 2);
    const exitSign = addBox(scene, 0.04, 0.16, 0.44, glow('#38e07a'), -HW + 0.05, ENTRY.h + 0.3, (ENTRY.z0 + ENTRY.z1) / 2, false);
    const lobby = quad(scene, 2.0, 2.3, null, { x: -HW - 0.7, y: 1.15, z: (ENTRY.z0 + ENTRY.z1) / 2 - 0.4, ry: Math.PI / 2, basic: true });
    lobby.material.color.set('#e8c48a');
    addBox(scene, 0.25, 1.0, 0.85, '#3a2416', -5.85, 0.5, 4.02);
    addBox(scene, 0.3, 0.05, 0.9, '#c9a24a', -5.85, 1.02, 4.02, false);
    addCyl(scene, 0.015, 0.015, 0.85, 4, '#c9c9c9', -6.3, 1.9, 4.0).rotation.x = Math.PI / 2;
    const coats = ['#3d3f4a', '#6a4a2a', '#2a3a2a', '#7a6a5a', '#20202a', '#5a2a3a'].map((cc, i) => {
      const cp = pivot(scene, -6.3, 1.9, 3.68 + i * 0.13);
      addBox(cp, 0.3, 0.9, 0.1, cc, 0, -0.47, 0);
      return cp;
    });

    // ── a narrow rim of the pavement the club stands on, broken off at the edge, a few weeds in the cracks ──
    const walk = makeSurround(scene, { hw: HW + 0.18, hd: HD + 0.18, margin: 1.05, seed: 11, ragged: 0.6, pattern: (x, z, dR, dE, r) => {
      if (dE < 0.16 && r() < 0.3) return ['#2e4626', '#36502a'][Math.floor(r() * 2)];
      const n = (r() - 0.5) * 10, j = ((x % 0.6) + 0.6) % 0.6 < 0.04 || ((z % 0.6) + 0.6) % 0.6 < 0.04, v = j ? 62 : 84;
      return [v + n, v - 2 + n, v - 5 + n];
    } });
    foliage(scene, walk.edgePoints(7, 0.35), { size: 0.14, cols: ['#2e4626', '#36502a', '#3e5a2e'], seed: 9 });

    // ── stage ──
    {
      const sw = STG.x1 - STG.x0, sd = STG.z1 - STG.z0, front = mat('#3a2215');
      const topT = canvasTex(paint(Math.round(sw * TX), Math.round(sd * TX), (x, y) => ['#8e5f36', '#9a6a3c', '#86592f'][Math.floor(y / 3) % 3]));
      addBox(scene, sw, STG.h, sd, [front, front, new THREE.MeshLambertMaterial({ map: topT }), front, front, front], (STG.x0 + STG.x1) / 2, STG.h / 2, (STG.z0 + STG.z1) / 2).castShadow = false;
      addBox(scene, sw, 0.04, 0.04, '#c9a24a', (STG.x0 + STG.x1) / 2, STG.h, STG.z1, false);
      for (let i = 0; i < 9; i++) addBox(scene, 0.08, 0.05, 0.05, glow('#ffd98f'), STG.x0 + 0.4 + i * (sw - 0.8) / 8, STG.h - 0.14, STG.z1 + 0.02, false);
      quad(scene, sw - 0.9, WH - STG.h - 0.5, sunburstTex(sw - 0.9, WH - STG.h - 0.5), { x: (STG.x0 + STG.x1) / 2 + 0.05, y: STG.h + (WH - STG.h - 0.5) / 2, z: -HD + 0.03 });
      const drape = ['#1d2650', '#28336a', '#18204a'];
      for (const [a, b] of [[STG.x0, STG.x0 + 0.55], [STG.x1 - 0.5, STG.x1]]) for (let x = a, i = 0; x < b - 0.01; x += 0.11, i++) addBox(scene, 0.11, WH - STG.h - 0.3, 0.1 + (i % 2) * 0.06, drape[i % 3], x + 0.055, STG.h + (WH - STG.h - 0.3) / 2, -HD + 0.1, false);
      addBox(scene, sw + 0.1, 0.55, 0.22, '#1a1f3d', (STG.x0 + STG.x1) / 2, WH - 0.27, -HD + 0.15);
      addBox(scene, sw + 0.12, 0.03, 0.23, '#c9a24a', (STG.x0 + STG.x1) / 2, WH - 0.56, -HD + 0.15, false);
    }
    const SIGN = { on: signTex('THE JOLLY', '#ff8a96', '#3a2a40'), off: signTex('THE JOLLY', '#3a2a40', '#3a2a40') };
    const sign = quad(scene, SIGN.on.w / 24, 11 / 24 / 0.866, SIGN.on.tex, { x: 3.7, y: WH - 0.27, z: -HD + 0.265, basic: true, alpha: true });

    // ── bar: back-bar, counter, stools ──
    const BAR = { x0: -5.3, x1: -4.7, z0: -3.7, z1: 1.7, h: 1.02 };
    {
      addBox(scene, 0.5, 1.0, BAR.z1 - BAR.z0, '#3a2416', -HW + 0.25, 0.5, (BAR.z0 + BAR.z1) / 2);
      const mirror = quad(scene, BAR.z1 - BAR.z0 - 0.4, 1.2, null, { x: -HW + 0.01, y: 1.95, z: (BAR.z0 + BAR.z1) / 2, ry: Math.PI / 2 });
      mirror.material.color.set('#6f8a90'); mirror.material.emissive = new THREE.Color('#1c2a2e');
      for (const y of [1.4, 1.85, 2.3]) addBox(scene, 0.26, 0.03, BAR.z1 - BAR.z0 - 0.2, '#5a3a22', -HW + 0.14, y, (BAR.z0 + BAR.z1) / 2);
      const bottles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.035, 0.24, 6), new THREE.MeshLambertMaterial({ color: '#ffffff' }), 66);
      const m4 = new THREE.Matrix4(), cc = new THREE.Color(), r = mulberry32(5), bc = ['#3a6a2a', '#8a4a1a', '#c9a24a', '#2a3a6a', '#a8b8b0', '#5a1a1a', '#d8c890', '#2a5a4a'];
      let n = 0;
      for (const y of [1.4, 1.85, 2.3]) for (let z = BAR.z0 + 0.25; z < BAR.z1 - 0.2 && n < 66; z += 0.25) {
        const s = 0.8 + r() * 0.45;
        m4.makeScale(1, s, 1).setPosition(-HW + 0.14, y + 0.015 + 0.12 * s, z + (r() - 0.5) * 0.06);
        bottles.setMatrixAt(n, m4); bottles.setColorAt(n, cc.set(bc[Math.floor(r() * bc.length)])); n++;
      }
      bottles.count = n; scene.add(bottles);
      const fl = canvasTex(paint(4, 20, (x, y) => (x % 2 ? '#4a2c1a' : '#3a2214')));
      fl.wrapS = THREE.RepeatWrapping; fl.repeat.set((BAR.z1 - BAR.z0) * 6, 1);
      const fm = new THREE.MeshLambertMaterial({ map: fl }), dark = mat('#2c1a10');
      addBox(scene, BAR.x1 - BAR.x0, BAR.h - 0.06, BAR.z1 - BAR.z0, [fm, dark, dark, dark, dark, dark], (BAR.x0 + BAR.x1) / 2, (BAR.h - 0.06) / 2, (BAR.z0 + BAR.z1) / 2);
      addBox(scene, BAR.x1 - BAR.x0 + 0.14, 0.07, BAR.z1 - BAR.z0 + 0.14, '#24201f', (BAR.x0 + BAR.x1) / 2 + 0.05, BAR.h - 0.02, (BAR.z0 + BAR.z1) / 2);
      addBox(scene, 0.02, 0.025, BAR.z1 - BAR.z0 + 0.14, '#c9a24a', BAR.x1 + 0.12, BAR.h - 0.02, (BAR.z0 + BAR.z1) / 2, false);
      addCyl(scene, 0.02, 0.02, BAR.z1 - BAR.z0, 6, '#c9a24a', BAR.x1 + 0.1, 0.22, (BAR.z0 + BAR.z1) / 2).rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) { addCyl(scene, 0.025, 0.025, 0.28, 6, '#c9a24a', -5.05, BAR.h + 0.14, -3.35 + i * 0.13); addBox(scene, 0.05, 0.05, 0.05, '#1a1a1a', -4.98, BAR.h + 0.24, -3.35 + i * 0.13); }
      addBox(scene, 0.3, 0.26, 0.36, '#b8954a', -5.05, BAR.h + 0.13, 1.42);
      for (const z of [-3.0, -2.0, -1.0, 0.0, 1.0]) {
        addCyl(scene, 0.18, 0.2, 0.03, 10, '#1a1a1a', -4.3, 0.015, z);
        addCyl(scene, 0.03, 0.03, 0.72, 5, '#c8ccd0', -4.3, 0.37, z);
        addCyl(scene, 0.2, 0.19, 0.08, 10, '#b8862e', -4.3, 0.75, z);
      }
      ['#ffd27a', '#ffd27a', '#ffd27a'].forEach((_, i) => {
        const z = [-2.55, -0.55, 1.15][i];
        addBox(scene, 0.1, 0.03, 0.18, '#c9a24a', -5.0, BAR.h + 0.02, z);
        addCyl(scene, 0.012, 0.012, 0.22, 4, '#c9a24a', -5.0, BAR.h + 0.13, z);
        addBox(scene, 0.12, 0.07, 0.24, glow('#3fae6a'), -5.0, BAR.h + 0.26, z);
      });
    }
    // ── booths ──
    const booth = (x0, x1) => {
      const leather = '#5a2a22', wood = '#3a2216', cz = -HD + 0.6;
      addBox(scene, x1 - x0, 1.25, 0.14, leather, (x0 + x1) / 2, 0.625, -HD + 0.07);
      for (const [bx, dir] of [[x0 + 0.27, 1], [x1 - 0.27, -1]]) {
        addBox(scene, 0.5, 0.45, 1.05, leather, bx, 0.225, cz);
        addBox(scene, 0.12, 1.05, 1.05, leather, bx - dir * 0.22, 0.6, cz);
        addBox(scene, 0.14, 1.08, 1.07, wood, bx - dir * 0.3, 0.54, cz);
      }
      addBox(scene, (x1 - x0) - 1.25, 0.05, 0.8, '#1f1b1a', (x0 + x1) / 2, 0.76, cz);
      addCyl(scene, 0.05, 0.05, 0.72, 6, '#c9a24a', (x0 + x1) / 2, 0.37, cz);
      addCyl(scene, 0.04, 0.06, 0.05, 6, '#c9a24a', (x0 + x1) / 2, 0.81, cz - 0.2);
      addCyl(scene, 0.06, 0.09, 0.1, 8, glow('#ffcf8a'), (x0 + x1) / 2, 0.92, cz - 0.2);
      return { cx: (x0 + x1) / 2, cz, seatL: x0 + 0.3, seatR: x1 - 0.3 };
    };
    const B1 = booth(-4.45, -2.45), B2 = booth(-2.1, -0.1);
    for (const x of [-3.45, -1.1]) { addBox(scene, 0.5, 0.38, 0.03, '#c9a24a', x, 2.2, -HD + 0.02); addBox(scene, 0.42, 0.3, 0.02, x < -2 ? '#e97780' : '#8fbf3a', x, 2.2, -HD + 0.035); }
    for (const x of [-4.6, -2.25, 0.05]) addCyl(scene, 0.09, 0.06, 0.12, 8, glow('#ffd9a0'), x, 2.35, -HD + 0.06);
    // ── cocktail tables ──
    const tables = [];
    const table = (x, z) => {
      const g = pivot(scene, x, 0, z);
      addCyl(g, 0.2, 0.22, 0.03, 12, '#1a1614', 0, 0.015, 0);
      addCyl(g, 0.035, 0.035, 0.7, 6, '#c9a24a', 0, 0.36, 0);
      addCyl(g, 0.42, 0.42, 0.04, 16, '#1f1b1a', 0, 0.72, 0);
      addCyl(g, 0.04, 0.06, 0.05, 6, '#c9a24a', -0.14, 0.765, -0.1);
      addCyl(g, 0.06, 0.1, 0.12, 8, glow('#ffcf8a'), -0.14, 0.88, -0.1);
      tables.push({ x, z, g });
      return { x, z };
    };
    const chair = (x, z, h) => {
      const c = pivot(scene, x, 0, z); c.rotation.y = h;
      addBox(c, 0.44, 0.1, 0.42, '#7a3a2a', 0, 0.44, 0); addBox(c, 0.44, 0.45, 0.07, '#3a2216', 0, 0.7, -0.19);
      for (const sx of [-0.18, 0.18]) for (const sz of [-0.16, 0.16]) addBox(c, 0.035, 0.42, 0.035, '#1a1614', sx, 0.21, sz);
    };
    const T1 = table(-2.55, -1.35), T2 = table(-1.0, 1.25), T3 = table(-3.1, 2.85);
    const seatAt = (T, ang) => ({ x: T.x + Math.sin(ang) * 0.68, z: T.z + Math.cos(ang) * 0.68, h: ang + Math.PI });
    const S1a = seatAt(T1, Math.PI / 2), S1b = seatAt(T1, -Math.PI / 2), S2a = seatAt(T2, 0.9), S2b = seatAt(T2, -1.9), S3 = seatAt(T3, 1.2);
    for (const s of [S1a, S1b, S2a, S2b, S3]) chair(s.x, s.z, s.h);
    makeGlass(tables[1].g, 'beer', 0.15, 0.74, 0.12); makeGlass(tables[1].g, 'wine', -0.05, 0.74, 0.2); makeGlass(tables[2].g, 'tumbler', 0.12, 0.74, 0.05);
    for (let i = 0; i < 5; i++) addBox(tables[0].g, 0.06, 0.005, 0.09, '#f4efe2', -0.12 + i * 0.06, 0.745, 0.05 * (i % 2)).rotation.y = i * 0.5;

    // ── band gear ──
    const piano = makeGrandPiano(scene, 1.75, STG.h, -2.95, Math.PI);
    piano.scale.setScalar(0.85);
    const drums = makeDrums(scene, 4.75, STG.h, -3.75, -0.25);
    makeMic(scene, 4.2, STG.h, -2.15);
    const bass = makeBass(scene);

    // ── cast ──
    const people = [];
    const add = (rig, name, role, color, fn) => { const o = { rig, name, role, color, fn }; people.push(o); return o; };
    const J = makeJojo(scene), L = makeLyly(scene), Y = makeYoyo(scene, { guitar: false });
    const martini = makeGlass(J.arms[0].hand, 'martini', 0, -0.02, 0.06); martini.visible = false;
    const NPC = (o) => makeNPC(scene, o);
    const bartender = NPC({ species: 'walrus', outfit: { jacket: '#efe9dc', sleeve: '#efe9dc', vest: '#1d1d22', bow: '#111', apron: '#f6f3ea', pants: '#1d1d22' } });
    const waiter = NPC({ species: 'fox', outfit: { jacket: '#f2eee4', bow: '#111', pants: '#1a1a1f' }, tail: '#d06a2a', tailTip: '#f4ece2' });
    const tray = holdProp(waiter, 1, makeTray(pivot(scene), ['martini', 'beer']), 'tray');
    const [trayMartini, trayBeer] = [tray.children[1], tray.children[2]];
    const coatCheck = NPC({ species: 'cat', fur: '#efe2cf', patch: 0.06, outfit: { jacket: '#2b4f7a', skirt: '#2b4f7a', skirtLen: 0.34 }, hat: 'beret', hatCol: '#1f3a5a', eyeCol: '#d6a43a' });
    const pianist = NPC({ species: 'poodle', fur: '#b9b6bb', outfit: { jacket: '#18181c', shirt: '#f4f1e8', bow: '#111' }, glasses: '#d8d0b0' });
    const drummer = NPC({ species: 'bear', fur: '#6a4a32', outfit: { jacket: '#2a2a33', shirt: '#e8e2d6', tie: '#8a1a2a' }, scale: 1.08 });
    const singer = NPC({ species: 'rabbit', fur: '#f2efe9', outfit: { jacket: '#d9b24e', sleeve: '#151515', skirt: '#d9b24e', skirtLen: 0.55, skirtFlare: 0.34, sequin: '#fff3c0', pearls: true }, eyeCol: '#3a2a4a' });
    const crow = NPC({ species: 'crow', outfit: { jacket: '#4a4236', coat: '#4a4236', pants: '#2a2620' }, hat: 'fedora', hatCol: '#2b2b30' });
    holdProp(crow, 0, makeCigar(pivot(scene)), 'cigar');
    const pig = NPC({ species: 'pig', outfit: { jacket: '#3d4a6a', shirt: '#ffffff', tie: '#a33333', pants: '#2d3650' }, hat: 'bowler', torsoW: 0.56 });
    holdProp(pig, 1, makeGlass(pivot(scene), 'tumbler'), 'glass');
    const siam = NPC({ species: 'cat', fur: '#efe4d2', muzzle: '#5a4a3a', outfit: { jacket: '#1c1c1c', skirt: '#1c1c1c', pearls: true, skirtLen: 0.4 }, eyeCol: '#5aa0d8' });
    holdProp(siam, 1, makeGlass(pivot(scene), 'martini'), 'glass');
    const bea = NPC({ species: 'dog', fur: '#c98a4a', muzzle: '#f2ece2', ear: 'long', earCol: '#7a4a2a', outfit: { jacket: '#2f6a8a', skirt: '#2f6a8a' } });
    const dot = NPC({ species: 'dog', fur: '#f2f0ec', ear: 'droop', earCol: '#1a1a1a', outfit: { jacket: '#3a3a44', shirt: '#fff', bow: '#c9a24a' } });
    const owl = NPC({ species: 'owl', outfit: { jacket: '#6a5a44', shirt: '#efe8d8', tie: '#3a4a2a' }, glasses: '#d9b24e' });
    const paper = holdProp(owl, 0, (() => { const g = pivot(scene); addBox(g, 0.32, 0.4, 0.01, '#ece6d6', 0.14, 0.12, 0.12); return g; })(), 'paper');
    const vinnie = NPC({ species: 'rat', outfit: { jacket: '#2a2a34', shirt: '#e6e0d6', tie: '#c9a24a' }, hat: 'fedora', hatCol: '#3a3a44', tail: '#d9a0aa' });
    const sal = NPC({ species: 'rat', fur: '#6e6a72', outfit: { jacket: '#3a2a2a', shirt: '#e6e0d6', tie: '#3a6a3a' }, hat: 'fedora', hatCol: '#1e1e22', tail: '#d9a0aa' });
    const ursula = NPC({ species: 'bear', fur: '#9a6a42', outfit: { jacket: '#2a6a5a', skirt: '#2a6a5a', pearls: true } });
    const rex = NPC({ species: 'dog', fur: '#8a5a2a', muzzle: '#2a1a10', ear: 'up', earCol: '#2a1a10', outfit: { jacket: '#151518', shirt: '#fff', bow: '#151515' } });
    const moe = NPC({ species: 'dog', fur: '#a8743a', muzzle: '#f0e6d6', ear: 'long', earCol: '#6a3a1a', outfit: { jacket: '#5a4a3a', shirt: '#d8d0c0', tie: '#6a2a2a' } });
    const duke = NPC({ species: 'dog', fur: '#c8843e', muzzle: '#2a1a10', ear: 'droop', outfit: { jacket: '#e8dfc8', shirt: '#2a2a2a', tie: '#c9a24a', pants: '#d8cfb8' } });
    const kitty = NPC({ species: 'cat', fur: '#f4f2ee', outfit: { jacket: '#2f54c4', skirt: '#2f54c4', skirtFlare: 0.36 }, eyeCol: '#3a8ad0' });
    const hopper = NPC({ species: 'rabbit', fur: '#9a9aa2', outfit: { jacket: '#3a5aa0', shirt: '#f2f0ea', bow: '#c9a24a' } });
    const fifi = NPC({ species: 'poodle', fur: '#f2c6d6', outfit: { jacket: '#7ad0b0', skirt: '#7ad0b0', skirtFlare: 0.36 } });

    // ── time helpers ──
    const music = t => t >= EV.music && t < EV.blackout;
    const dark = t => t >= EV.blackout && t < EV.lights;
    const freezeT = t => (t >= EV.blackout ? EV.blackout - 0.001 : t);
    const barkK = t => BARKS.reduce((m, b) => Math.max(m, bump(t, b - 0.05, 0.7)), 0);
    const JPOS = { x: 3.0, y: STG.h, z: -2.95, h: 0.85 }, LPOS = { x: 5.6, y: STG.h, z: -2.65, h: 0.4 };
    const lookStage = (p, t, k = 1) => lookAt(p, 3.6 + Math.sin(t * 0.3) * 1.2, -2.8, k, 1.3);
    const knockLook = (p, t) => { const k = bump(t, EV.knock - 0.1, 2.0); if (k > 0) lookAt(p, JPOS.x, JPOS.z, Math.min(1, k * 1.6), 1.4); return p; };
    // wraps an extra's act with the shared crowd reactions (bark-alongs, the martini catch, the blackout)
    const crowd = (base, seed, cheers = true) => t => {
      const tt = freezeT(t), p = base(tt);
      p.t = tt;
      if (cheers) cheer(p, barkK(tt) * 0.9);
      knockLook(p, tt);
      if (t >= EV.lights) startle(p, t, EV.lights, seed);
      return p;
    };

    // JOJO — cool, catches the flying martini without missing a beat; loses the pink stiletto in the dark
    const jBase = t => {
      const p = P({ ...JPOS, eyes: 'half', headX: -0.12, saxPlay: 0 });
      p.shRx = -0.25; p.shRz = 0.12; p.elR = -0.5; p.shLx = 0.05; p.shLz = 0.08; p.elL = -0.15;
      return p;
    };
    const jPlay = t => {
      const p = jBase(t), b = beat(t), s = horns(t), sway = Math.sin(Math.PI * (b.i + b.ph) / 2);
      Object.assign(p, { shLx: -0.95, shLz: -0.42, elL: -1.25, shRx: -0.55, shRz: 0.32, elR: -1.05, saxPlay: 1, eyes: 'closed' });
      p.side = 0.07 * sway; p.twist = 0.08 * sway; p.h = JPOS.h + 0.1 * sway; p.lean = -0.05 - 0.1 * s; p.saxTilt = 0.15 * s; p.puff = s;
      p.crouch = 0.04 + 0.05 * Math.exp(-b.since * 7);
      return p;
    };
    const jCatch = t => {
      const p = jPlay(t), k = ramp(t, EV.knock + 0.15, EV.catch);
      p.saxPlay = lerp(1, 0.35, k); p.puff = 0; p.eyes = 'half';
      p.shLx = lerp(-0.95, -1.5, k); p.shLz = lerp(-0.42, 0.55, k); p.elL = lerp(-1.25, -0.5, k);
      p.shRx = -0.35; p.shRz = 0.2; p.elR = -0.8;
      return p;
    };
    const jSip = t => {
      const p = jCatch(EV.catch), b = beat(t), sway = Math.sin(Math.PI * (b.i + b.ph) / 2);
      const sip = bump(t, EV.catch + 0.45, 0.9);
      p.shLx = lerp(-1.1, -1.7, sip); p.shLz = lerp(0.3, -0.2, sip); p.elL = lerp(-1.0, -1.8, sip); p.headX = -0.12 - 0.2 * sip;
      p.side = 0.06 * sway; p.h = JPOS.h + 0.08 * sway; p.eyes = sip > 0.4 ? 'closed' : 'half';
      return p;
    };
    const jAfter = t => {
      const p = jSip(EV.blackout - 0.001), k = t - EV.lights;
      p.noClip = true;
      p.headX = lerp(p.headX, 0.55, ramp(k, 0.4, 0.7)) - 0.55 * ramp(k, 1.5, 1.8);
      p.eyes = k > 0.9 ? 'wide' : 'half';
      if (k > 1.8) p.headY = Math.sin(t * 1.8) * 0.7;
      return p;
    };
    const J_SEGS = [{ t0: 0, fn: jBase }, { t0: EV.music - 0.3, fn: jPlay, xf: 0.4 }, { t0: EV.knock + 0.1, fn: jCatch, xf: 0.1 }, { t0: EV.catch, fn: jSip, xf: 0.1 }, { t0: EV.lights, fn: jAfter, xf: 0.05 }];
    add(J, 'JOJO', 'SAX · NO TALK', COL.coral, t => {
      if (dark(t)) { const p = blendSegs(EV.blackout - 0.001, J_SEGS); p.noClip = t > EV.blackout + 0.9; return p; }
      return blendSegs(t, J_SEGS);
    });

    // LYLY — slaps every bass note, spins the bass into the waiter's tray
    const lBase = t => P({ ...LPOS, mouth: 0.35, shLx: -1.25, shLz: 0.35, elL: -0.75, shRx: -0.45, shRz: 0.55, elR: -0.9 });
    const lFidget = t => { const p = lBase(t); p.bodyY = 0.015 * Math.abs(Math.sin(t * 7)); p.headY = 0.3 * Math.sin(t * 1.3); return p; };
    const lSlap = t => {
      const p = lBase(t), b = beat(t), a = Math.exp(-sinceEv(BASS_T, t) * 13), hit = Math.exp(-b.since * 8);
      p.shRx += 0.45 * a - 0.15; p.elR += 0.5 * a; p.shRz += 0.15 * a;
      p.headX = 0.32 * hit - 0.1; p.lean = 0.12 * hit; p.crouch = 0.05 + 0.08 * hit; p.mouth = 0.5 + 0.35 * a;
      p.headZ = 0.15 * Math.sin(Math.PI * (b.i + b.ph) / 2);
      const sk = sinceEv(C.bars, t);
      if (t > EV.chorus && sk < 0.5 && Math.floor(lastBar(t)) % 2 === 0) { const sh = Math.sin(Math.PI * sk / 0.5); p.hipRx = -1.4 * sh; p.kneeR = 1.6 * sh; p.lean -= 0.15 * sh; p.mouth = 1; }
      return p;
    };
    const lastBar = t => { let i = 0; for (const b of C.bars) { if (b <= t) i++; } return i; };
    const lSpin = t => {
      const k = clamp((t - EV.spin) / 1.0), p = lSlap(t), up = Math.sin(Math.PI * clamp(k / 0.85));
      p.bassSpin = smooth(k); p.bassLean = Math.sin(Math.PI * k) * 0.35; p.rootY = 0.08 * Math.sin(Math.PI * k); p.mouth = 0.9; p.hipRx = 0; p.kneeR = 0;
      p.shLx = lerp(p.shLx, -2.6, up); p.shRx = lerp(p.shRx, -2.6, up); p.shLz = lerp(p.shLz, 0.4, up); p.shRz = lerp(p.shRz, -0.4, up);
      p.elL = lerp(p.elL, -0.2, up); p.elR = lerp(p.elR, -0.2, up); p.headX = -0.25 * up;
      return p;
    };
    const lAfter = t => { const p = lSlap(EV.blackout - 0.001); p.hipRx = p.kneeR = 0; p.mouth = 0.7; p.eyes = 'wide'; p.headY = headToward(p, JPOS.x, JPOS.z) * ramp(t, EV.lights + 0.6, EV.lights + 0.9); return p; };
    const L_SEGS = [{ t0: 0, fn: lFidget }, { t0: EV.music, fn: lSlap, xf: 0.3 }, { t0: EV.spin, fn: lSpin, xf: 0.12 }, { t0: EV.spin + 1.0, fn: lSlap, xf: 0.2 }, { t0: EV.lights, fn: lAfter, xf: 0.05 }];
    add(L, 'LYLY', 'BASS · ALL BARK', COL.lime, t => blendSegs(freezeT(t) === t || t >= EV.lights ? t : EV.blackout - 0.001, L_SEGS));

    // YOYO — hides in the coat check; only her bow and, in the dark, her eyes give her away
    add(Y, 'YOYO', '??? · COAT CHECK', COL.wine, t => {
      const p = P({ x: -6.28, y: 0, z: 3.82, h: Math.PI / 2, crouch: 0.55, headX: 0.25, t, noMarker: true });
      p.headY = 0.4 * Math.sin(t * 0.9); p.eyes = 'half';
      p.hide = t >= EV.blackout + 0.15;
      return p;
    });

    // the band
    add(pianist, 'OLD CHESTER', 'PIANO', '#d8d0b0', crowd(t => {
      const p = P({ x: 1.75, y: STG.h, z: -4.05, h: 0 });
      sit(p, 0.45);
      const k = keys(t), b = beat(t);
      p.shLx = p.shRx = -1.25; p.elL = p.elR = -0.5 + 0.18 * Math.sin(t * 13) * k; p.shLz = 0.15 + 0.1 * Math.sin(t * 7) * k; p.shRz = -0.15 - 0.1 * Math.sin(t * 8 + 1) * k;
      p.lean = 0.15 + 0.06 * k; p.headX = 0.2; bob(p, b, music(t) ? 0.12 : 0);
      return p;
    }, 1, false));
    add(drummer, 'BRUNO', 'DRUMS', '#c9a24a', crowd(t => {
      const p = P({ x: 4.95, y: STG.h, z: -4.15, h: -0.25 });
      sit(p, 0.5);
      const on = music(t), a = on ? Math.exp(-sinceEv(DRUM_T, t) * 14) : 0, b = beat(t), alt = (b.i % 2) ? 1 : 0;
      p.shLx = -1.0 - (alt ? 0.5 * a : 0); p.shRx = -1.0 - (alt ? 0 : 0.5 * a); p.elL = -1.2 + (alt ? 0.6 * a : 0); p.elR = -1.2 + (alt ? 0 : 0.6 * a);
      p.shLz = 0.3; p.shRz = -0.3; bob(p, b, on ? 0.2 : 0);
      return p;
    }, 2, false));
    add(singer, 'MADAME LAPIN', 'VOCALS', '#d9b24e', crowd(t => {
      const p = P({ x: 4.0, y: STG.h, z: -2.4, h: 0.75 });
      const b = beat(t), v = vox(t);
      p.shRx = -1.35; p.shRz = 0.1; p.elR = -1.2; p.mouth = v;
      p.shLx = -0.4 - 0.9 * v; p.shLz = 0.5 + 0.3 * Math.sin(t * 1.3); p.elL = -0.6;
      p.side = 0.06 * Math.sin(Math.PI * (b.i + b.ph) / 2); p.headX = -0.15 * v; p.headZ = 0.1 * Math.sin(t * 1.1);
      if (!music(t)) { p.shRx = -0.2; p.shLx = 0.05; p.mouth = 0; }
      return p;
    }, 3, false));
    // the bar
    add(bartender, 'WALTER', 'BARTENDER', '#efe9dc', crowd(t => {
      const p = P({ x: -5.78, y: 0, z: -1.6 + 1.2 * Math.sin(t * 0.21), h: Math.PI / 2 });
      polish(p, t); idle(p, t, 4);
      return p;
    }, 4));
    add(crow, 'CROWLEY', 'REGULAR · CIGAR', '#9a9080', crowd(t => {
      const p = P({ x: -4.3, y: 0, z: -2.0, h: -Math.PI / 2 + 0.3 });
      sit(p, 0.8); p.lean = 0.25; drink(p, t, 0, 6.5, 2); p.shRx = -0.9; p.elR = -1.2;
      return p;
    }, 5));
    add(pig, 'MR. HAMM', 'BANKER, OFF DUTY', '#e9a9a6', crowd(t => {
      const p = P({ x: -4.3, y: 0, z: 0.0, h: 1.2 });
      sit(p, 0.8); drink(p, t, 1, 4.2, 3); if (music(t)) bob(p, beat(t), 0.15); lookStage(p, t, 0.7);
      return p;
    }, 6));
    add(siam, 'SIAM', 'REGULAR', '#efe4d2', crowd(t => {
      const p = P({ x: -4.3, y: 0, z: 1.0, h: 1.4 });
      sit(p, 0.8); drink(p, t, 1, 5.5, 4); chat(p, t, 4, 0); lookAt(p, -4.3, 0, 0.6);
      return p;
    }, 7));
    // booths
    add(bea, 'BEA', 'ON A DATE', '#2f6a8a', crowd(t => { const p = P({ x: B1.seatL, y: 0, z: B1.cz, h: Math.PI / 2 }); sit(p, 0.47); chat(p, t, 1, 1); return p; }, 8));
    add(dot, 'DOT', 'ON A DATE', '#f2f0ec', crowd(t => { const p = P({ x: B1.seatR, y: 0, z: B1.cz, h: -Math.PI / 2 }); sit(p, 0.47); drink(p, t, 1, 4.8, 6); if (music(t)) bob(p, beat(t), 0.1); return p; }, 9));
    add(owl, 'PROF. HOOT', 'READS THE LATE EDITION', '#d9b24e', crowd(t => {
      const p = P({ x: B2.seatL, y: 0, z: B2.cz, h: Math.PI / 2 });
      sit(p, 0.47); p.shLx = -1.2; p.elL = -0.9; p.shLz = -0.2; p.headX = 0.25; p.headY = 0.1 * Math.sin(t * 0.6);
      return p;
    }, 10, false));
    // floor tables
    add(vinnie, 'VINNIE', 'CARDS, ALWAYS CARDS', '#c9a24a', crowd(t => { const p = P({ ...S1a, y: 0 }); sit(p, 0.48); p.lean = 0.2; p.shRx = -1.0 - 0.4 * (music(t) ? Math.exp(-beat(t).since * 6) : 0); p.elR = -0.6; p.shLx = -0.9; p.elL = -1.1; return p; }, 11));
    add(sal, 'SAL', 'LOSING', '#3a6a3a', crowd(t => { const p = P({ ...S1b, y: 0 }); sit(p, 0.48); p.lean = 0.2; p.shLx = -1.0; p.elL = -1.0; p.shRx = -0.9; p.elR = -1.0; p.headX = 0.25; return p; }, 12));
    add(ursula, 'URSULA', 'CELEBRATING', '#2a6a5a', crowd(t => { const p = P({ ...S2a, y: 0 }); sit(p, 0.48); chat(p, t, 3, 0); drink(p, t, 1, 5, 2); lookStage(p, t, 0.5); return p; }, 13));
    add(rex, 'REX', 'CELEBRATING', '#8a5a2a', crowd(t => { const p = P({ ...S2b, y: 0 }); sit(p, 0.48); drink(p, t, 1, 4, 1); if (music(t)) bob(p, beat(t), 0.15); return p; }, 14));
    add(moe, 'MOE', 'NEARLY ASLEEP', '#a8743a', crowd(t => {
      const p = P({ ...S3, y: 0 }); sit(p, 0.48); drink(p, t, 1, 9, 5);
      p.headX = 0.35 + 0.25 * Math.sin(t * 0.5); p.eyes = Math.sin(t * 0.5) > 0.2 ? 'closed' : 'half';
      return p;
    }, 15, false));
    // dancers
    const C_A = { x: 2.4, z: -0.3 }, C_B = { x: 4.7, z: 0.75 };
    const dancer = (center, a0, lead, seed) => crowd(t => {
      const p = P({ x: center.x + Math.sin(a0) * 0.32, y: 0, z: center.z + Math.cos(a0) * 0.32, h: a0 + Math.PI });
      if (music(t)) dance(p, t - EV.music, beat(t), center, a0, 0.32, 0.35, seed, lead);
      else { idle(p, t, seed); chat(p, t, seed, lead ? 1 : 0); }
      return p;
    }, seed);
    add(duke, 'DUKE', 'DANCING', '#e8dfc8', dancer(C_A, 0, true, 16));
    add(kitty, 'KITTY', 'DANCING', '#2f54c4', dancer(C_A, Math.PI, false, 17));
    add(hopper, 'HOPPER', 'DANCING', '#3a5aa0', dancer(C_B, 1.2, true, 18));
    add(fifi, 'FIFI', 'DANCING', '#7ad0b0', dancer(C_B, 1.2 + Math.PI, false, 19));
    add(coatCheck, 'CALLIE', 'COAT CHECK', '#2b4f7a', crowd(t => { const p = P({ x: -6.18, y: 0, z: 4.25, h: Math.PI / 2 + 0.3 }); idle(p, t, 20); lookStage(p, t, 0.6); return p; }, 20));
    // the waiter: delivers a beer, crosses the dance floor, gets clipped by the bass
    const W_PATH1 = [[-4.3, 2.15], [-1.75, 2.15]], W_PATH2 = [[-1.75, 2.15], [0.4, 1.95], [5.9, 1.85], [6.1, -1.45]], W_PATH3 = [[6.1, -1.45], [5.9, 1.9], [0.5, 2.2], [-4.3, 2.15]];
    add(waiter, 'FELIX', 'WAITER', '#d06a2a', crowd(t => {
      const p = P({ x: -4.3, y: 0, z: 2.15, h: Math.PI / 2 });
      p.shRx = -1.2; p.shRz = -0.1; p.elR = -0.5;
      if (t < 5.0) walkPath(p, t, W_PATH1, 2.0, 5.0);
      else if (t < 6.4) { walkPath(p, 5.0, W_PATH1, 2.0, 5.0); p.h = -2.2; p.lean = 0.15; }
      else if (t < EV.knock + 0.6) { walkPath(p, t, W_PATH2, 6.4, EV.knock - 0.08); }
      else if (t < 14.5) { walkPath(p, EV.knock, W_PATH2, 6.4, EV.knock - 0.08); const k = t - EV.knock; p.h += 1.6 * easeOut(k / 0.4); p.lean = -0.25 * Math.exp(-k * 3); p.shRx = -1.2 + 0.4 * Math.exp(-k * 4); p.headY = headToward(p, JPOS.x, JPOS.z) * ramp(k, 0.6, 0.9); }
      else walkPath(p, t, W_PATH3, 14.5, 20.0);
      p.shRx = Math.min(p.shRx, -1.1); p.elR = -0.5;
      p.no_tray = false;
      p.trayMartini = t < EV.knock;
      p.trayBeer = t < 5.6;
      p.t = t;
      return p;
    }, 21, false));

    // ── props in flight ──
    let flight = null;
    const martiniFlight = () => {
      const pose = t => people.forEach(o => o.rig.apply(o.fn(t)));
      pose(EV.knock); const p0 = tray.localToWorld(new THREE.Vector3(-0.07, 0.06, -0.02));
      pose(EV.catch); const p1 = J.arms[0].hand.localToWorld(new THREE.Vector3(0, 0.04, 0.06));
      const T = EV.catch - EV.knock;
      return { p0, v: new THREE.Vector3((p1.x - p0.x) / T, (p1.y - p0.y + 4.9 * T * T) / T, (p1.z - p0.z) / T), T };
    };
    const flyer = makeGlass(scene, 'martini'); flyer.visible = false;
    const clipGlint = addBox(scene, 0.07, 0.03, 0.03, glow(COL.coral), 0, 0, 0, false); clipGlint.visible = false;
    const ribbon = addBox(scene, 0.32, 0.02, 0.06, COL.wine, JPOS.x + 0.45, STG.h + 0.012, JPOS.z + 0.45); ribbon.rotation.y = 0.6; ribbon.visible = false;
    const eyes = [0, 1].map(i => addBox(scene, 0.1, 0.08, 0.1, glow('#cfe8ff'), 0, 0, 0, false));
    const POWERED = ['#ffd98f', '#ffcf8a', '#ffd9a0', '#3fae6a'].map(c => ({ m: glow(c), c }));

    // ── lights ──
    const hemi = new THREE.HemisphereLight('#ffe2c0', '#3a2418', 0.75); scene.add(hemi);
    const fill = new THREE.PointLight('#ffd6a6', 10, 16, 1.1); fill.position.set(0.5, 3.8, 0.5); scene.add(fill);
    const CLIP = roomClip(HW, HD);
    const spJ = makeSpot(scene, '#fff0d6', new THREE.Vector3(4.5, 6.2, 1.2), new THREE.Vector3(JPOS.x, STG.h, JPOS.z), 0.17, { clip: CLIP });
    const spL = makeSpot(scene, '#fff0d6', new THREE.Vector3(7.2, 6.2, 1.0), new THREE.Vector3(LPOS.x, STG.h, LPOS.z), 0.17, { clip: CLIP });
    const spS = makeSpot(scene, '#ffd2e0', new THREE.Vector3(5.6, 6.4, 1.6), new THREE.Vector3(4.0, STG.h, -2.4), 0.14, { shadow: false, clip: CLIP });
    const sweep = ['#ff5fa8', '#3fd6d0'].map((c, i) => makeSpot(scene, c, new THREE.Vector3(3.5, 6.5, 4.0), new THREE.Vector3(3.5, 0, 0), 0.16, { shadow: false, penumbra: 0.6, clip: CLIP }));
    const lamps = [[-5.0, BAR.h + 0.3, -2.55], [-5.0, BAR.h + 0.3, -0.55], [-5.0, BAR.h + 0.3, 1.15], [T1.x, 1.0, T1.z], [T2.x, 1.0, T2.z], [T3.x, 1.0, T3.z], [B1.cx, 1.0, B1.cz], [B2.cx, 1.0, B2.cz]].map(([x, y, z], i) => {
      const l = new THREE.PointLight(i < 3 ? '#e8ffb0' : '#ffbf7a', 2.5, 2.6, 1.6); l.position.set(x, y, z); scene.add(l); return l;
    });
    const notes = new Notes(scene, [
      ...C.keyOn.filter((t, i) => i % 3 === 0 && t > EV.music && t < EV.blackout).map(t => ({ t, from: new THREE.Vector3(1.75, 1.6, -2.6), color: '#f6e9c8' })),
      ...BASS_T.filter((t, i) => i % 2 === 0 && t > EV.music && t < EV.blackout).map(t => ({ t, from: () => bass.localToWorld(new THREE.Vector3(0, 1.3, 0)), color: '#c4f52a' })),
      ...C.beats.filter((t, i) => i % 4 === 0 && t > EV.music && t < EV.blackout).map(t => ({ t, from: () => J.sax.bell.getWorldPosition(new THREE.Vector3()), color: '#ff8b96' })),
    ], stage.pxPerM, 30);

    // ── frame ──
    let flightCache = null;
    const update = t => {
      for (const o of people) {
        const p = o.fn(t);
        o.rig.root.visible = !p.hide;
        o.rig.apply(p);
        if (o.rig === waiter) { trayMartini.visible = p.trayMartini; trayBeer.visible = p.trayBeer; }
      }
      // bass lives where Lyly first stood
      const lp = people[1].fn(t), [bx, bz] = [LPOS.x + 0.36 * Math.cos(LPOS.h) + 0.3 * Math.sin(LPOS.h), LPOS.z - 0.36 * Math.sin(LPOS.h) + 0.3 * Math.cos(LPOS.h)];
      bass.position.set(bx, STG.h + (lp.bassSpin > 0 && lp.bassSpin < 1 ? 0.05 * Math.sin(Math.PI * lp.bassSpin) : 0), bz);
      bass.rotation.set(lp.bassLean ? lp.bassLean * 0.6 : 0, LPOS.h + Math.PI * 2 * (lp.bassSpin || 0) - 0.3, 0.05 + (lp.bassLean || 0) * 0.4);
      // martini: tray → air → Jojo's paw
      if (!flightCache) { flightCache = martiniFlight(); for (const o of people) o.rig.apply(o.fn(t)); }
      const k = t - EV.knock;
      flyer.visible = k >= 0 && k < flightCache.T;
      if (flyer.visible) { flyer.position.set(flightCache.p0.x + flightCache.v.x * k, flightCache.p0.y + flightCache.v.y * k - 4.9 * k * k, flightCache.p0.z + flightCache.v.z * k); flyer.rotation.set(k * 9, 0, k * 4); }
      martini.visible = t >= EV.catch;
      // the heist, seen only as two eyes and a pink glint
      const bk = t - EV.blackout;
      eyes.forEach((e, i) => {
        e.visible = bk > 0.35 && bk < 1.15 && !(bk > 0.75 && bk < 0.83);
        e.position.set(JPOS.x + 0.55 + (i ? 0.09 : -0.09) * 0.7, STG.h + 0.45, JPOS.z + 0.55 + (i ? -0.09 : 0.09) * 0.7);
      });
      clipGlint.visible = bk > 1.1 && bk < 1.5;
      if (clipGlint.visible) { const u = (bk - 1.1) / 0.4; clipGlint.position.set(lerp(JPOS.x + 0.4, -5.9, u), lerp(STG.h + 0.1, 0.05, Math.min(1, u * 3)), lerp(JPOS.z + 0.6, 3.8, u)); }
      ribbon.visible = t >= EV.lights;
      coats.forEach((c, i) => { c.rotation.x = t > EV.lights ? 0.25 * Math.sin((t - EV.lights) * 6 + i) * Math.exp(-(t - EV.lights) * 0.8) : 0; });
      // lights
      const on = dark(t) ? 0 : (t >= EV.lights && t < EV.lights + 0.35 ? (stepRand(t, 0.05, 3) > 0.45 ? 1 : 0.1) : 1);
      const jolly = t >= EV.jolly && t < EV.blackout ? (beat(t).ph < 0.5 ? 1 : 0.35) : 1;
      hemi.intensity = lerp(0.03, 0.75, on); fill.intensity = 11 * on;
      POWERED.forEach(({ m, c }) => m.color.set(on > 0.5 ? c : '#241c14'));
      spJ.intensity = 60 * on; spL.intensity = 60 * on; spS.intensity = (music(t) ? 50 : 15) * on;
      lamps.forEach(l => { l.intensity = 2.5 * on; });
      sweep.forEach((s, i) => {
        const a = t * (0.6 + i * 0.25) + i * 2;
        s.target.position.set(3.5 + Math.sin(a) * 2.0, 0, Math.cos(a * 1.3) * 1.1);
        s.intensity = music(t) ? 40 * on : 0;
        s.userData.shaft.visible = false;
      });
      for (const s of [spJ, spL, spS]) s.userData.shaft.material.uniforms.opacity.value = s.intensity / 60 * 0.05;
      sign.material.map = (on && (t < EV.blackout || t >= EV.lights) && jolly > 0.5) || (on && t < EV.jolly) ? SIGN.on.tex : SIGN.off.tex;
      exitSign.visible = true;
      notes.update(t);
      stage.setFlash(0);
    };

    const hud = t => {
      const jh = stage.screenOf(J.head, 0.25);
      const lyric = (s, a, b) => { if (t >= a && t < b) stage.centerText(typed(s, t, a, 0.4), stage.lowH - 16, COL.ink, 1, COL.cream); };
      lyric('♪ NO TALK. ALL BARK. ♪', EV.bark1 - 0.1, EV.bark1 + 2.2);
      lyric('♪ NO TALK. ALL BARK. ♪', EV.bark2 - 0.1, EV.bark2 + 1.6);
      lyric('♪ ...IN THE JOLLY WAVEBAND ♪', EV.jolly, EV.jolly + 2.4);
      if (t >= EV.knock && t < EV.knock + 0.9) stage.caption('!', ...stage.screenOf(waiter.head, 0.55).map((v, i) => v - (i ? 0 : 1)), '#ffe28a');
      if (t >= EV.catch + 0.3 && t < EV.catch + 2.2) stage.caption(typed('NO TALK.', t, EV.catch + 0.3), jh[0] - textW('NO TALK.') - 8, jh[1] - 2, COL.cream);
      if (t >= EV.lights + 1.0) {
        stage.centerText(typed('WHO TOOK THE', t, EV.lights + 1.0, 0.4), stage.lowH - 46, COL.ink, 2, COL.cream);
        stage.centerText(typed('PINK STILETTO?', t, EV.lights + 1.4, 0.5), stage.lowH - 28, COL.wine, 2, COL.cream);
      }
    };

    return { scene, update, hud, people, clues: [{ id: 'ribbon', label: 'THE WINE RIBBON', t0: EV.lights, until: 999, at: () => ribbon.getWorldPosition(new THREE.Vector3()) }], chapters: [
      { t: 0, label: 'DOORS' }, { t: EV.music, label: 'DOWNBEAT' }, { t: EV.bark1, label: 'ALL BARK' }, { t: EV.knock, label: 'THE MARTINI' },
      { t: EV.blackout, label: 'BLACKOUT' }, { t: EV.lights, label: 'MISSING' },
    ] };
  },
};

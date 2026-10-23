// Small Plays · cast — the three leads, a factory for anthropomorphic extras, and hand props.
import * as THREE from 'three';
import { Biped, part, pivot, addCyl, addSphere, addCone, eye, mat, lerp, COL } from './engine.js';

// ───────────────────────── leads ─────────────────────────
export function makeJojo(parent, { outfit = 'suit', sax = true } = {}) {
  const trench = outfit === 'trench';
  const jacket = trench ? '#b49766' : '#6c6c71';
  const J = new Biped(parent, {
    hip: 0.6, thigh: 0.27, shoeH: 0.07, legW: 0.2, legX: 0.13, pants: '#6f6f74', shoeCol: '#121214',
    torsoW: 0.58, torsoH: 0.5, torsoD: 0.4, jacket, neckY: 0.49, shoulderX: 0.34, shoulderY: 0.44,
    upper: 0.25, fore: 0.22, armW: 0.13, sleeve: jacket, paw: '#f1ece5', pawW: 0.12,
  });
  const s = J.spine, f = 0.205;
  part(s, 0.15, 0.26, 0.01, '#f4f2ee', 0, 0.37, f);
  part(s, 0.05, 0.24, 0.01, '#141416', 0, 0.35, f + 0.006);
  J.clip = part(s, 0.08, 0.025, 0.01, COL.coral, 0, 0.33, f + 0.012);          // the pink stiletto tie clip
  part(s, 0.06, 0.03, 0.01, COL.coral, 0.17, 0.37, f);
  const lap = trench ? '#9a7f52' : '#5a5a5f';
  part(s, 0.045, 0.3, 0.012, lap, -0.1, 0.32, f + 0.002).rotation.z = 0.3;
  part(s, 0.045, 0.3, 0.012, lap, 0.1, 0.32, f + 0.002).rotation.z = -0.3;
  if (trench) {
    part(s, 0.62, 0.42, 0.43, jacket, 0, -0.14, 0);                              // long coat skirt
    part(s, 0.6, 0.05, 0.42, '#7a6340', 0, 0.06, 0);                             // belt
    part(s, 0.66, 0.08, 0.44, '#a3875a', 0, 0.47, -0.01);                        // storm collar
  }
  const h = J.head, W = '#f2ede6';
  part(h, 0.44, 0.3, 0.38, W, 0, 0.2, 0);
  part(h, 0.3, 0.012, 0.01, '#d6cec3', 0, 0.3, 0.191);
  J.muzzle = part(h, 0.4, 0.17, 0.12, W, 0, 0.09, 0.22);
  part(h, 0.12, 0.08, 0.1, W, 0.16, 0.03, 0.2); part(h, 0.12, 0.08, 0.1, W, -0.16, 0.03, 0.2);
  part(h, 0.13, 0.07, 0.05, '#151515', 0, 0.17, 0.285);
  part(h, 0.035, 0.1, 0.02, '#151515', 0, 0.09, 0.285);
  part(h, 0.26, 0.02, 0.02, '#2a2222', 0, 0.04, 0.283);
  part(h, 0.08, 0.06, 0.02, '#e7a2a6', 0.12, 0.1, 0.283); part(h, 0.08, 0.06, 0.02, '#e7a2a6', -0.12, 0.1, 0.283);
  part(h, 0.115, 0.085, 0.012, '#141414', 0.115, 0.235, 0.188);
  part(h, 0.088, 0.066, 0.012, '#4a4646', -0.115, 0.235, 0.188);
  J.eyes = [eye(h, 0.115, 0.235, 0.195, 0.075, 0.056, '#ffffff', '#2a1a12'), eye(h, -0.115, 0.235, 0.195, 0.075, 0.056, '#ffffff', '#2a1a12')];
  for (const sx of [1, -1]) {
    const ear = pivot(h, sx * 0.23, 0.3, 0.02); ear.rotation.z = sx * -0.6;
    part(ear, 0.1, 0.13, 0.09, W, sx * 0.04, -0.04, 0); part(ear, 0.06, 0.08, 0.01, '#e8a9ae', sx * 0.04, -0.04, 0.046);
  }
  J.hatAnchor = pivot(h, 0, 0.36, -0.01);
  J.hat = makePorkpie(J.hatAnchor);
  if (sax) {
    J.sax = makeSax(pivot(J.spine));
    J.saxPoses = {
      idle: { p: [-0.36, 0.22, 0.12], r: [-0.25, 0, 0.3] },
      play: { p: [0.03, 0.56, 0.33], r: [0.35, 0, -0.38] },
      up: { p: [0.0, 0.78, 0.22], r: [-0.7, 0, 0.25] },
    };
  }
  J.after = p => {
    if (J.sax) {
      const { idle: a, play: b, up: u } = J.saxPoses, k = p.saxPlay ?? 0, q = p.saxUp ?? 0;
      J.sax.parent.position.set(...[0, 1, 2].map(i => lerp(lerp(a.p[i], b.p[i], k), u.p[i], q)));
      const r = [0, 1, 2].map(i => lerp(lerp(a.r[i], b.r[i], k), u.r[i], q));
      J.sax.parent.rotation.set(r[0] + (p.saxTilt ?? 0), r[1], r[2]);
      J.sax.parent.visible = p.saxHide ? false : true;
    }
    J.muzzle.scale.x = 1 + 0.14 * (p.puff ?? 0);
    J.clip.visible = !p.noClip;
    J.hat.visible = !p.noHat;
  };
  return J;
}

export function makeLyly(parent, { outfit = 'suit' } = {}) {
  const police = outfit === 'police';
  const jacket = police ? '#2c3f6c' : '#24412f', pants = police ? '#26365c' : '#24402f';
  const L = new Biped(parent, {
    hip: 0.6, thigh: 0.27, shoeH: 0.07, legW: 0.2, legX: 0.13, pants,
    shoe: police ? undefined : (ankle) => { part(ankle, 0.16, 0.07, 0.26, '#f2efe6', 0, -0.035, 0.05); part(ankle, 0.165, 0.075, 0.09, '#121214', 0, -0.035, 0.15); part(ankle, 0.165, 0.075, 0.06, '#121214', 0, -0.035, -0.06); },
    shoeCol: '#101010',
    torsoW: 0.6, torsoH: 0.5, torsoD: 0.42, jacket, neckY: 0.48, shoulderX: 0.35, shoulderY: 0.44,
    upper: 0.25, fore: 0.22, armW: 0.13, sleeve: jacket, paw: '#6e4134', pawW: 0.12,
  });
  const s = L.spine, f = 0.215;
  part(s, 0.62, 0.17, 0.43, jacket, 0, -0.06, 0);
  if (police) {
    part(s, 0.12, 0.2, 0.01, '#9fb2d6', 0, 0.39, f);
    part(s, 0.04, 0.18, 0.012, '#101827', 0, 0.37, f + 0.006);
    part(s, 0.06, 0.06, 0.012, '#d9b24e', 0.15, 0.36, f + 0.004);                // badge
    part(s, 0.62, 0.05, 0.44, '#141414', 0, 0.02, 0);                            // duty belt
  } else {
    part(s, 0.13, 0.22, 0.01, '#f4f2ee', 0, 0.39, f);
    part(s, 0.17, 0.065, 0.02, COL.coral, 0, 0.44, f + 0.01);
    part(s, 0.04, 0.05, 0.02, '#c85f69', 0, 0.44, f + 0.02);
    for (const by of [0.12, 0.2, 0.28]) part(s, 0.03, 0.03, 0.01, '#101411', 0, by, f);
    for (const leg of L.legs) part(leg.ankle, 0.215, 0.05, 0.215, '#2b4a37', 0, 0.06, 0);
  }
  const h = L.head, B = '#77473a', B2 = '#6b3f33';
  part(h, 0.5, 0.28, 0.38, B, 0, 0.22, 0);
  part(h, 0.58, 0.16, 0.32, B2, 0, 0.11, 0.02);
  part(h, 0.3, 0.13, 0.12, '#7f4d3f', 0, 0.14, 0.21);
  part(h, 0.12, 0.06, 0.05, '#b87c74', 0, 0.2, 0.275);
  part(h, 0.24, 0.07, 0.04, '#4a1418', 0, 0.06, 0.22);
  L.jaw = pivot(h, 0, 0.075, 0.13);
  part(L.jaw, 0.27, 0.05, 0.16, B2, 0, -0.025, 0.06);
  part(L.jaw, 0.09, 0.025, 0.1, '#f08a9a', 0, 0.005, 0.1);
  L.tongue = part(L.jaw, 0.08, 0.09, 0.025, '#f08a9a', 0, -0.05, 0.155);
  part(h, 0.05, 0.022, 0.012, '#c99562', 0.12, 0.315, 0.191); part(h, 0.05, 0.022, 0.012, '#c99562', -0.12, 0.315, 0.191);
  L.eyes = [eye(h, 0.125, 0.27, 0.193, 0.065, 0.05, '#f3e3c6', '#5a3410'), eye(h, -0.125, 0.27, 0.193, 0.065, 0.05, '#f3e3c6', '#5a3410')];
  for (const sx of [1, -1]) {
    addCone(h, 0.065, 0.16, 4, B, sx * 0.2, 0.39, -0.02).rotation.z = sx * -0.25;
    part(h, 0.04, 0.05, 0.01, '#d99088', sx * 0.2, 0.39, 0.03);
  }
  if (police) {
    const cap = pivot(h, 0, 0.36, 0.0);
    addCyl(cap, 0.17, 0.15, 0.1, 10, '#24345a', 0, 0.05, 0);
    part(cap, 0.3, 0.02, 0.14, '#111111', 0, 0.0, 0.14);
    part(cap, 0.05, 0.05, 0.01, '#d9b24e', 0, 0.06, 0.16);
  }
  L.glassesAnchor = pivot(h, 0, 0.232, 0.29);
  L.glasses = makeShades(L.glassesAnchor);
  L.after = p => { L.tongue.visible = p.mouth > 0.15; L.glasses.visible = !p.noGlasses; };
  return L;
}

export function makeYoyo(parent, { guitar = true, umbrella = false } = {}) {
  const Y = new Biped(parent, {
    hip: 0.3, thigh: 0.12, shoeH: 0.05, legW: 0.07, legX: 0.05, pants: '#f3eee4',
    shoe: (ankle) => part(ankle, 0.08, 0.05, 0.12, '#101012', 0, -0.025, 0.025),
    torsoW: 0.22, torsoH: 0.2, torsoD: 0.16, jacket: '#efe3cf', neckY: 0.2, shoulderX: 0.13, shoulderY: 0.16,
    upper: 0.11, fore: 0.1, armW: 0.06, sleeve: '#9d978e', paw: '#f4f1ec', pawW: 0.065, scale: 1.1,
  });
  const b = Y.body;
  addCyl(b, 0.13, 0.27, 0.22, 10, '#f0e5d2', 0, -0.05, 0);
  addCyl(b, 0.28, 0.285, 0.035, 10, '#fbf6ec', 0, -0.155, 0);
  addCyl(b, 0.215, 0.22, 0.03, 10, '#e4d4bb', 0, -0.06, 0);
  part(b, 0.1, 0.06, 0.04, COL.wine, 0, 0.04, -0.12);
  Y.ribbons = [pivot(b, 0.03, 0.03, -0.13), pivot(b, -0.03, 0.03, -0.13)];
  Y.ribbons.forEach(r => part(r, 0.03, 0.26, 0.015, COL.wine, 0, -0.13, 0));
  for (const leg of Y.legs) part(leg.ankle, 0.085, 0.04, 0.085, COL.wine, 0, 0.07, 0);
  const s = Y.spine;
  for (const sx of [1, -1]) addSphere(s, 0.065, '#f6ecdb', sx * 0.13, 0.15, 0, 6);
  part(s, 0.24, 0.04, 0.18, '#fbf6ec', 0, 0.2, 0);
  part(s, 0.08, 0.05, 0.02, COL.wine, 0, 0.15, 0.085);
  part(s, 0.16, 0.02, 0.16, COL.wine, 0, 0.215, 0);
  addSphere(s, 0.025, '#e2bb52', 0, 0.19, 0.095, 6);
  const h = Y.head, T = '#a39d94', S = '#4b4640';
  part(h, 0.3, 0.24, 0.26, T, 0, 0.13, 0);
  for (const sx of [-0.06, 0, 0.06]) part(h, 0.025, 0.08, 0.01, S, sx, 0.21, 0.131);
  part(h, 0.01, 0.12, 0.2, S, 0.151, 0.14, 0); part(h, 0.01, 0.12, 0.2, S, -0.151, 0.14, 0);
  part(h, 0.2, 0.08, 0.06, '#f4f1ec', 0, 0.05, 0.12);
  part(h, 0.04, 0.03, 0.02, '#d98a8a', 0, 0.09, 0.152);
  part(h, 0.1, 0.022, 0.012, '#c4142c', -0.025, 0.055, 0.153);
  Y.eyes = [eye(h, 0.075, 0.15, 0.131, 0.07, 0.08, '#cfd8de', '#46607a'), eye(h, -0.075, 0.15, 0.131, 0.07, 0.08, '#cfd8de', '#46607a')];
  part(h, 0.06, 0.012, 0.01, '#2a2020', 0.075, 0.1, 0.132); part(h, 0.06, 0.012, 0.01, '#2a2020', -0.075, 0.1, 0.132);
  for (const sx of [1, -1]) {
    addCone(h, 0.065, 0.13, 4, T, sx * 0.1, 0.29, -0.01).rotation.z = sx * -0.2;
    part(h, 0.035, 0.05, 0.01, '#e7a2a6', sx * 0.1, 0.28, 0.04);
  }
  const bow = pivot(h, 0.07, 0.27, 0.02);
  part(bow, 0.1, 0.075, 0.04, COL.wine, 0.05, 0, 0).rotation.z = -0.3;
  part(bow, 0.1, 0.075, 0.04, COL.wine, -0.05, 0, 0).rotation.z = 0.3;
  part(bow, 0.04, 0.04, 0.05, '#6e1222', 0, 0, 0);
  Y.tail = [];
  let tp = pivot(b, 0, -0.02, -0.12);
  for (let i = 0; i < 6; i++) { part(tp, 0.045, 0.07, 0.045, i % 2 ? S : T, 0, 0.035, 0); Y.tail.push(tp); tp = pivot(tp, 0, 0.065, 0); }
  if (guitar) {
    Y.gtr = makeRabbitGuitar(pivot(s, -0.02, 0.06, 0.13));
    Y.gtr.parent.rotation.z = 0.95;
  }
  if (umbrella) Y.umbrella = makeUmbrella(Y.arms[0].hand, COL.wine);
  Y.after = p => {
    const t = p.t ?? 0;
    Y.tail.forEach((sg, i) => { sg.rotation.x = -0.35 + 0.08 * i; sg.rotation.z = 0.25 * Math.sin(t * 3 + i * 0.7); });
    Y.ribbons.forEach((r, i) => { r.rotation.x = 0.15 + 0.12 * Math.sin(t * 3.2) + (p.ribbonLift ?? 0); r.rotation.z = (i ? -1 : 1) * 0.08; });
    if (Y.gtr) { Y.gtr.parent.rotation.z = 0.95 + (p.gtrKick ?? 0); Y.gtr.parent.visible = !p.noGuitar; }
    if (Y.umbrella) Y.umbrella.visible = !!p.umbrella;
  };
  return Y;
}

// ───────────────────────── extras: species heads + outfits ─────────────────────────
const HEADS = {
  dog(h, o) {
    const F = o.fur, M = o.muzzle || F;
    part(h, 0.36, 0.3, 0.34, F, 0, 0.18, 0);
    part(h, 0.2, 0.13, 0.16, M, 0, 0.1, 0.22);
    part(h, 0.09, 0.06, 0.04, o.nose || '#151515', 0, 0.15, 0.31);
    if (o.ear === 'up') for (const sx of [1, -1]) addCone(h, 0.06, 0.15, 4, o.earCol || F, sx * 0.13, 0.38, 0).rotation.z = sx * -0.2;
    else if (o.ear === 'long') for (const sx of [1, -1]) part(h, 0.06, 0.3, 0.14, o.earCol || F, sx * 0.2, 0.09, 0.02);
    else for (const sx of [1, -1]) { const e = part(h, 0.08, 0.16, 0.12, o.earCol || F, sx * 0.2, 0.22, 0.02); e.rotation.z = sx * 0.35; }
    return { eyeY: 0.22, eyeX: 0.08, front: 0.171, eyeW: 0.05, top: 0.33 };
  },
  cat(h, o) {
    const F = o.fur;
    part(h, 0.32, 0.27, 0.3, F, 0, 0.15, 0);
    part(h, 0.16, 0.08, 0.06, o.muzzle || '#f2eee8', 0, 0.06, 0.16);
    part(h, 0.04, 0.03, 0.02, '#d98a8a', 0, 0.1, 0.19);
    for (const sx of [1, -1]) { addCone(h, 0.07, 0.14, 4, F, sx * 0.1, 0.33, -0.01).rotation.z = sx * -0.2; part(h, 0.035, 0.05, 0.01, '#e7a2a6', sx * 0.1, 0.32, 0.045); }
    if (o.stripes) for (const sx of [-0.06, 0, 0.06]) part(h, 0.025, 0.08, 0.01, o.stripes, sx, 0.24, 0.151);
    if (o.patch) part(h, 0.08, 0.06, 0.01, '#0e0e0e', o.patch, 0.17, 0.152);
    return { eyeY: 0.17, eyeX: 0.075, front: 0.151, eyeW: 0.055, eyeCol: o.eyeCol || '#c7d65a', top: 0.29 };
  },
  rabbit(h, o) {
    const F = o.fur;
    part(h, 0.3, 0.27, 0.3, F, 0, 0.15, 0);
    part(h, 0.14, 0.08, 0.06, o.muzzle || F, 0, 0.07, 0.16);
    part(h, 0.04, 0.03, 0.02, '#e48aa0', 0, 0.1, 0.19);
    for (const sx of [1, -1]) { const e = part(h, 0.07, 0.34, 0.05, F, sx * 0.07, 0.43, -0.02); e.rotation.z = sx * -0.12; part(h, 0.035, 0.24, 0.01, '#f0b2c4', sx * 0.07, 0.43, 0.006); }
    return { eyeY: 0.18, eyeX: 0.08, front: 0.151, eyeW: 0.05, top: 0.6 };
  },
  bear(h, o) {
    const F = o.fur;
    part(h, 0.4, 0.33, 0.36, F, 0, 0.19, 0);
    part(h, 0.2, 0.13, 0.12, o.muzzle || '#b8916a', 0, 0.1, 0.22);
    part(h, 0.08, 0.05, 0.04, '#111', 0, 0.15, 0.29);
    for (const sx of [1, -1]) addCyl(h, 0.07, 0.07, 0.05, 8, F, sx * 0.17, 0.36, -0.02).rotation.x = Math.PI / 2;
    return { eyeY: 0.24, eyeX: 0.09, front: 0.181, eyeW: 0.045, top: 0.38 };
  },
  pig(h, o) {
    const F = o.fur || '#e9a9a6';
    part(h, 0.38, 0.32, 0.34, F, 0, 0.18, 0);
    addCyl(h, 0.09, 0.09, 0.08, 10, '#d98c8c', 0, 0.12, 0.2).rotation.x = Math.PI / 2;
    part(h, 0.025, 0.03, 0.01, '#7a3a3a', 0.03, 0.12, 0.245); part(h, 0.025, 0.03, 0.01, '#7a3a3a', -0.03, 0.12, 0.245);
    for (const sx of [1, -1]) { const e = part(h, 0.1, 0.1, 0.03, F, sx * 0.15, 0.34, 0.05); e.rotation.x = 0.6; e.rotation.z = sx * -0.3; }
    return { eyeY: 0.23, eyeX: 0.09, front: 0.171, eyeW: 0.04, top: 0.36 };
  },
  fox(h, o) {
    const F = o.fur || '#d06a2a';
    part(h, 0.32, 0.26, 0.3, F, 0, 0.15, 0);
    part(h, 0.16, 0.1, 0.18, F, 0, 0.09, 0.2);
    part(h, 0.16, 0.05, 0.18, '#f4ece2', 0, 0.05, 0.2);
    part(h, 0.05, 0.04, 0.03, '#111', 0, 0.12, 0.3);
    for (const sx of [1, -1]) { addCone(h, 0.075, 0.18, 4, F, sx * 0.1, 0.34, 0).rotation.z = sx * -0.15; part(h, 0.04, 0.05, 0.01, '#1a1a1a', sx * 0.1, 0.4, 0.045); }
    return { eyeY: 0.18, eyeX: 0.08, front: 0.151, eyeW: 0.05, eyeCol: '#2a1a0a', top: 0.34 };
  },
  crow(h, o) {
    const F = o.fur || '#1b1c22';
    part(h, 0.3, 0.27, 0.3, F, 0, 0.15, 0);
    addCone(h, 0.06, 0.2, 4, '#4a4a50', 0, 0.12, 0.24).rotation.x = Math.PI / 2;
    return { eyeY: 0.18, eyeX: 0.08, front: 0.151, eyeW: 0.04, eyeCol: '#d8c040', top: 0.29 };
  },
  owl(h, o) {
    const F = o.fur || '#7a5a3a';
    part(h, 0.38, 0.32, 0.32, F, 0, 0.17, 0);
    for (const sx of [1, -1]) { part(h, 0.14, 0.14, 0.01, '#e7d9b8', sx * 0.09, 0.19, 0.161); addCone(h, 0.04, 0.1, 4, F, sx * 0.14, 0.36, 0).rotation.z = sx * -0.3; }
    addCone(h, 0.03, 0.08, 4, '#d9a441', 0, 0.12, 0.18).rotation.x = Math.PI / 2;
    return { eyeY: 0.19, eyeX: 0.09, front: 0.168, eyeW: 0.07, eyeCol: '#f2c23a', top: 0.35 };
  },
  walrus(h, o) {
    const F = o.fur || '#8a6a58';
    part(h, 0.44, 0.34, 0.38, F, 0, 0.18, 0);
    part(h, 0.34, 0.12, 0.12, '#cdb9a0', 0, 0.08, 0.22);
    part(h, 0.04, 0.16, 0.03, '#f4efe2', 0.07, -0.02, 0.27); part(h, 0.04, 0.16, 0.03, '#f4efe2', -0.07, -0.02, 0.27);
    part(h, 0.08, 0.05, 0.04, '#3a2a22', 0, 0.15, 0.285);
    return { eyeY: 0.24, eyeX: 0.11, front: 0.191, eyeW: 0.035, top: 0.35 };
  },
  tortoise(h, o) {
    const F = o.fur || '#7f9a5a';
    part(h, 0.12, 0.18, 0.12, F, 0, 0.0, 0.04);
    part(h, 0.26, 0.22, 0.28, F, 0, 0.14, 0.08);
    part(h, 0.14, 0.05, 0.08, '#5e7442', 0, 0.06, 0.2);
    return { eyeY: 0.18, eyeX: 0.07, front: 0.221, eyeW: 0.04, top: 0.25, z: 0.08 };
  },
  poodle(h, o) {
    const F = o.fur || '#f2e8ee';
    part(h, 0.3, 0.27, 0.3, F, 0, 0.15, 0);
    part(h, 0.14, 0.1, 0.14, F, 0, 0.08, 0.2);
    part(h, 0.06, 0.05, 0.03, '#2a1a1a', 0, 0.12, 0.275);
    addSphere(h, 0.13, F, 0, 0.33, -0.02, 7);
    for (const sx of [1, -1]) addSphere(h, 0.09, F, sx * 0.18, 0.12, 0, 6);
    return { eyeY: 0.19, eyeX: 0.07, front: 0.151, eyeW: 0.04, top: 0.44 };
  },
  rat(h, o) {
    const F = o.fur || '#8b8790';
    part(h, 0.24, 0.2, 0.24, F, 0, 0.11, 0);
    part(h, 0.12, 0.08, 0.14, F, 0, 0.07, 0.17);
    part(h, 0.04, 0.03, 0.02, '#e7a2b0', 0, 0.09, 0.245);
    for (const sx of [1, -1]) addCyl(h, 0.06, 0.06, 0.02, 8, '#e3a6b5', sx * 0.1, 0.24, 0).rotation.x = Math.PI / 2;
    return { eyeY: 0.14, eyeX: 0.06, front: 0.121, eyeW: 0.035, eyeCol: '#c2283a', top: 0.26 };
  },
};
const HATS = {
  fedora(a, c = '#2b2b30') { addCyl(a, 0.24, 0.24, 0.02, 12, c, 0, 0.0, 0); addCyl(a, 0.15, 0.16, 0.12, 10, c, 0, 0.07, 0); addCyl(a, 0.165, 0.165, 0.03, 10, '#111', 0, 0.03, 0); },
  cap(a, c = '#24345a') { addCyl(a, 0.16, 0.15, 0.1, 10, c, 0, 0.05, 0); part(a, 0.26, 0.02, 0.12, '#111', 0, 0, 0.13); },
  beret(a, c = '#8e1b2c') { addCyl(a, 0.17, 0.15, 0.06, 10, c, 0.03, 0.03, 0).rotation.z = 0.2; },
  top(a, c = '#141414') { addCyl(a, 0.22, 0.22, 0.02, 12, c, 0, 0, 0); addCyl(a, 0.13, 0.13, 0.26, 10, c, 0, 0.14, 0); },
  curlers(a) { for (let i = 0; i < 5; i++) addCyl(a, 0.03, 0.03, 0.1, 6, ['#e98aa8', '#8ac2e9', '#f2d66a'][i % 3], -0.12 + i * 0.06, 0.03, 0.02).rotation.z = Math.PI / 2; },
  hood(a, c = '#3a0f1a') { addCone(a, 0.2, 0.42, 6, c, 0, 0.05, -0.02); },
  bowler(a, c = '#1c1c1c') { addCyl(a, 0.21, 0.21, 0.02, 12, c, 0, 0, 0); addSphere(a, 0.14, c, 0, 0.04, 0, 8).scale.y = 0.75; },
};
export function makeNPC(parent, o) {
  const fur = o.fur, out = o.outfit || {};
  const skirt = !!out.skirt;
  const S = {
    hip: o.hip ?? 0.56, thigh: 0.25, shoeH: 0.06, legW: 0.16, legX: 0.1, pants: skirt ? (out.stockings || fur) : (out.pants || '#2a2a30'),
    shoeCol: out.shoes || '#141414',
    torsoW: o.torsoW ?? 0.48, torsoH: 0.44, torsoD: 0.33, jacket: out.jacket || '#3a3a44', neckY: 0.43, shoulderX: (o.torsoW ?? 0.48) / 2 + 0.05, shoulderY: 0.38,
    upper: 0.22, fore: 0.2, armW: 0.1, sleeve: out.sleeve || out.jacket || '#3a3a44', paw: o.paw || fur, pawW: 0.1, scale: o.scale || 1,
  };
  const n = new Biped(parent, S);
  const s = n.spine, f = S.torsoD / 2 + 0.005;
  if (out.shirt) part(s, 0.12, 0.22, 0.01, out.shirt, 0, 0.32, f);
  if (out.tie) part(s, 0.04, 0.2, 0.012, out.tie, 0, 0.3, f + 0.004);
  if (out.bow) part(s, 0.13, 0.05, 0.02, out.bow, 0, 0.39, f + 0.008);
  if (out.apron) part(s, S.torsoW * 0.8, 0.62, 0.01, out.apron, 0, 0.05, f + 0.01);
  if (out.vest) part(s, S.torsoW * 1.01, 0.3, S.torsoD * 1.01, out.vest, 0, 0.17, 0);
  if (out.coat) part(s, S.torsoW + 0.04, 0.4, S.torsoD + 0.04, out.coat, 0, -0.15, 0);
  if (out.badge) part(s, 0.05, 0.05, 0.012, '#d9b24e', 0.12, 0.33, f + 0.004);
  if (out.pearls) part(s, 0.18, 0.025, 0.01, '#f4efe2', 0, 0.38, f + 0.004);
  if (out.sequin) for (let i = 0; i < 6; i++) part(s, 0.03, 0.03, 0.01, out.sequin, -0.15 + i * 0.06, 0.12 + (i % 2) * 0.1, f + 0.004);
  if (skirt) {
    const len = out.skirtLen ?? 0.36;
    addCyl(n.body, S.torsoW * 0.48, out.skirtFlare ?? 0.32, len, 10, out.skirt, 0, -len / 2 + 0.04, 0);
  }
  if (o.shell) { const sh = addSphere(s, 0.32, '#6a5a3a', 0, 0.22, -0.2, 8); sh.scale.set(1, 1.1, 0.6); }
  const head = n.head;
  const geo = HEADS[o.species](head, o);
  const ec = geo.eyeCol || o.eyeCol || '#1a120c';
  n.eyes = [eye(head, geo.eyeX, geo.eyeY, geo.front + (geo.z || 0), geo.eyeW, geo.eyeW * 0.9, '#f4efe6', ec), eye(head, -geo.eyeX, geo.eyeY, geo.front + (geo.z || 0), geo.eyeW, geo.eyeW * 0.9, '#f4efe6', ec)];
  n.hatAnchor = pivot(head, 0, geo.top, geo.z || 0);
  if (o.hat) HATS[o.hat](n.hatAnchor, o.hatCol);
  if (o.glasses) { part(head, 0.07, 0.05, 0.01, o.glasses, geo.eyeX, geo.eyeY, geo.front + 0.02); part(head, 0.07, 0.05, 0.01, o.glasses, -geo.eyeX, geo.eyeY, geo.front + 0.02); }
  if (o.tail) {
    let tp = pivot(n.body, 0, -0.05, -S.torsoD / 2); n.tail = [];
    for (let i = 0; i < 5; i++) { part(tp, 0.04, 0.08, 0.04, i === 4 && o.tailTip ? o.tailTip : o.tail, 0, 0.04, 0); n.tail.push(tp); tp = pivot(tp, 0, 0.07, 0); }
  }
  n.after = p => {
    if (n.tail) n.tail.forEach((sg, i) => { sg.rotation.x = -0.9 + 0.12 * i; sg.rotation.z = 0.3 * Math.sin((p.t ?? 0) * 2.5 + i * 0.8 + (o.seed || 0)); });
    if (n.props) for (const pr of n.props) pr.visible = !p['no_' + pr.name];
  };
  return n;
}
export function holdProp(rig, side, prop, name) {
  rig.arms[side].hand.add(prop);
  prop.name = name || prop.name;
  (rig.props ||= []).push(prop);
  return prop;
}

// ───────────────────────── props ─────────────────────────
export function makePorkpie(parent) {
  const hat = pivot(parent);
  addCyl(hat, 0.17, 0.17, 0.09, 10, '#6d6d70', 0, 0.045, 0);
  addCyl(hat, 0.175, 0.175, 0.03, 10, '#141414', 0, 0.03, 0);
  addCyl(hat, 0.26, 0.26, 0.02, 12, '#646467', 0, 0.005, 0);
  return hat;
}
export function makeShades(parent) {
  const g = pivot(parent);
  part(g, 0.105, 0.072, 0.015, '#e6c13a', 0.078, 0, 0); part(g, 0.105, 0.072, 0.015, '#e6c13a', -0.078, 0, 0);
  part(g, 0.06, 0.012, 0.012, '#c9a24a', 0, 0.02, 0);
  part(g, 0.012, 0.012, 0.16, '#c9a24a', 0.135, 0.02, -0.08); part(g, 0.012, 0.012, 0.16, '#c9a24a', -0.135, 0.02, -0.08);
  return g;
}
export function makeSax(parent) {
  const g = pivot(parent), gold = mat('#c8963c'), dark = mat('#8a6324');
  part(g, 0.03, 0.03, 0.06, '#151515', 0, 0, 0);
  part(g, 0.035, 0.035, 0.16, gold, 0, -0.05, 0.08).rotation.x = 1.0;
  addCyl(g, 0.03, 0.05, 0.46, 6, gold, 0, -0.32, 0.14).rotation.x = -0.1;
  part(g, 0.11, 0.07, 0.09, dark, 0, -0.57, 0.12);
  addCyl(g, 0.09, 0.055, 0.16, 8, gold, 0, -0.47, 0.24, true).rotation.x = 0.25;
  g.bell = pivot(g, 0, -0.38, 0.28);
  return g;
}
export function makeBass(parent) {
  const g = pivot(parent);
  const prof = [[0.001, 0.08], [0.2, 0.1], [0.29, 0.18], [0.31, 0.3], [0.27, 0.42], [0.2, 0.54], [0.21, 0.62], [0.25, 0.74], [0.24, 0.88], [0.18, 0.98], [0.08, 1.05], [0.001, 1.08]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 12), mat('#8b3f1d'));
  body.scale.z = 0.36; body.castShadow = body.receiveShadow = true; g.add(body);
  part(g, 0.06, 0.78, 0.03, '#1a1210', 0, 1.15, 0.11);
  part(g, 0.07, 0.2, 0.08, '#6b2e14', 0, 1.62, 0.07);
  part(g, 0.13, 0.03, 0.03, '#d8c49a', 0, 1.6, 0.07);
  part(g, 0.12, 0.04, 0.02, '#d8c49a', 0, 0.55, 0.115);
  part(g, 0.015, 0.5, 0.012, '#e6dcc8', 0, 0.8, 0.125);
  addCyl(g, 0.012, 0.012, 0.1, 4, '#bbbbbb', 0, 0.04, 0);
  return g;
}
export function makeRabbitGuitar(parent) {
  const g = pivot(parent), P1 = '#3a2242';
  part(g, 0.2, 0.17, 0.05, P1, 0, 0, 0);
  part(g, 0.12, 0.1, 0.05, P1, 0.05, -0.1, 0); part(g, 0.12, 0.1, 0.05, P1, -0.05, -0.1, 0);
  part(g, 0.035, 0.035, 0.01, '#eadfe6', -0.04, 0.02, 0.03);
  part(g, 0.03, 0.03, 0.01, '#d6a84a', 0.04, 0.02, 0.03);
  part(g, 0.07, 0.014, 0.01, '#c42a3a', 0, -0.04, 0.03);
  part(g, 0.035, 0.34, 0.025, '#2a1824', 0, 0.25, 0);
  for (const sx of [1, -1]) { part(g, 0.04, 0.13, 0.02, '#5a3360', sx * 0.03, 0.47, 0).rotation.z = sx * -0.15; part(g, 0.015, 0.08, 0.01, '#e9a3bd', sx * 0.03, 0.47, 0.012); }
  return g;
}
export function makeUmbrella(hand, color) {
  const g = pivot(hand, 0, 0, 0.02);
  addCyl(g, 0.012, 0.012, 0.75, 4, '#2a1a12', 0, 0.36, 0);
  const c = addCone(g, 0.5, 0.22, 8, color, 0, 0.82, 0);
  addCone(g, 0.012, 0.06, 4, '#c9a24a', 0, 0.96, 0);
  c.castShadow = true;
  return g;
}
export function makeOperaGlasses(hand) {
  const g = pivot(hand, 0, 0.02, 0.06);
  addCyl(g, 0.03, 0.035, 0.08, 8, '#c9a24a', 0.035, 0.05, 0).rotation.x = Math.PI / 2;
  addCyl(g, 0.03, 0.035, 0.08, 8, '#c9a24a', -0.035, 0.05, 0).rotation.x = Math.PI / 2;
  part(g, 0.012, 0.18, 0.012, '#c9a24a', 0.06, -0.06, 0.0);
  g.name = 'opera';
  return g;
}
export function makeTray(hand, items = ['martini', 'tumbler']) {
  const g = pivot(hand, 0, 0.04, 0.12);
  addCyl(g, 0.2, 0.2, 0.015, 12, '#c7c9cc', 0, 0, 0);
  items.forEach((it, i) => makeGlass(g, it, -0.07 + i * 0.12, 0.01, 0.02 * (i % 2 ? 1 : -1)));
  g.name = 'tray';
  return g;
}
export function makeGlass(parent, kind, x = 0, y = 0, z = 0) {
  const g = pivot(parent, x, y, z);
  if (kind === 'martini') { addCyl(g, 0.006, 0.006, 0.07, 4, '#e8eef0', 0, 0.035, 0); addCone(g, 0.045, 0.06, 6, '#d9eef0', 0, 0.1, 0).rotation.x = Math.PI; addSphere(g, 0.012, '#7aa83a', 0.01, 0.1, 0, 4); }
  else if (kind === 'beer') { addCyl(g, 0.035, 0.035, 0.1, 6, '#d9a441', 0, 0.05, 0); addCyl(g, 0.036, 0.036, 0.025, 6, '#f6f1e4', 0, 0.11, 0); }
  else if (kind === 'wine') { addCyl(g, 0.006, 0.006, 0.06, 4, '#e8eef0', 0, 0.03, 0); addCyl(g, 0.03, 0.02, 0.05, 6, '#7a1424', 0, 0.085, 0); }
  else addCyl(g, 0.035, 0.03, 0.07, 6, '#c87a2a', 0, 0.035, 0);
  return g;
}
export function makeMic(parent, x, y, z) {
  const g = pivot(parent, x, y, z);
  addCyl(g, 0.12, 0.14, 0.03, 10, '#1a1a1a', 0, 0.015, 0);
  addCyl(g, 0.014, 0.014, 1.45, 4, '#bfc3c8', 0, 0.74, 0);
  addCyl(g, 0.035, 0.03, 0.09, 8, '#d0d3d6', 0, 1.5, 0.02).rotation.x = 0.4;
  return g;
}
export function makeDrums(parent, x, y, z, ry = 0) {
  const g = pivot(parent, x, y, z); g.rotation.y = ry;
  const shell = mat('#7a1d2a'), head = mat('#efe9dc'), chrome = mat('#c8ccd0'), brass = mat('#d4ac4a');
  const kick = addCyl(g, 0.28, 0.28, 0.3, 14, shell, 0, 0.28, 0); kick.rotation.x = Math.PI / 2;
  addCyl(g, 0.27, 0.27, 0.01, 14, head, 0, 0.28, 0.16).rotation.x = Math.PI / 2;
  addCyl(g, 0.17, 0.17, 0.14, 10, shell, 0.32, 0.62, 0.12); addCyl(g, 0.17, 0.17, 0.01, 10, head, 0.32, 0.69, 0.12);
  addCyl(g, 0.13, 0.13, 0.12, 10, shell, -0.12, 0.72, -0.06); addCyl(g, 0.13, 0.13, 0.01, 10, head, -0.12, 0.79, -0.06);
  addCyl(g, 0.2, 0.2, 0.18, 10, shell, -0.42, 0.42, 0.1); addCyl(g, 0.2, 0.2, 0.01, 10, head, -0.42, 0.52, 0.1);
  for (const [cx, cz, h] of [[0.55, -0.1, 1.05], [-0.55, -0.25, 1.2]]) { addCyl(g, 0.01, 0.01, h, 4, chrome, cx, h / 2, cz); g[cx > 0 ? 'cymR' : 'cymL'] = addCyl(g, 0.24, 0.24, 0.012, 14, brass, cx, h, cz); }
  addCyl(g, 0.01, 0.01, 0.8, 4, chrome, 0.62, 0.4, 0.28); g.hat = addCyl(g, 0.16, 0.16, 0.02, 12, brass, 0.62, 0.8, 0.28);
  return g;
}
export function makeGrandPiano(parent, x, y, z, ry = 0) {
  const g = pivot(parent, x, y, z); g.rotation.y = ry;
  const black = mat('#121214'), lid = mat('#1b1b1f');
  part(g, 1.4, 0.32, 1.5, black, 0, 0.78, 0);
  part(g, 1.0, 0.32, 0.5, black, -0.2, 0.78, -0.95);
  const l = pivot(g, 0.7, 0.95, 0); l.rotation.z = 0.75;
  part(l, 1.4, 0.03, 1.5, lid, -0.7, 0, 0);
  part(g, 0.02, 0.6, 0.02, '#8a8a8a', 0.55, 1.1, 0);
  part(g, 1.36, 0.06, 0.24, '#f2ece0', 0, 0.86, 0.85);
  for (let i = 0; i < 9; i++) part(g, 0.05, 0.03, 0.12, black, -0.6 + i * 0.15, 0.9, 0.8);
  for (const [lx, lz] of [[-0.6, 0.6], [0.6, 0.6], [0, -1.0]]) part(g, 0.08, 0.62, 0.08, black, lx, 0.31, lz);
  part(g, 0.6, 0.06, 0.3, black, 0, 0.48, 1.25);
  return g;
}
export function makeCamera(hand) {
  const g = pivot(hand, 0, 0.04, 0.08);
  part(g, 0.16, 0.12, 0.1, '#1d1d1f', 0, 0, 0);
  addCyl(g, 0.04, 0.045, 0.08, 8, '#2c2c30', 0, 0, 0.08).rotation.x = Math.PI / 2;
  addCyl(g, 0.09, 0.03, 0.06, 10, '#d8dadc', 0.1, 0.12, 0.04, true).rotation.x = Math.PI / 2.2;
  g.bulb = addSphere(g, 0.025, '#f8f4e8', 0.1, 0.12, 0.06, 6);
  g.name = 'camera';
  return g;
}
export function makeFlashlight(hand) {
  const g = pivot(hand, 0, 0, 0.06);
  addCyl(g, 0.03, 0.025, 0.2, 6, '#2a2a2e', 0, 0, 0.06).rotation.x = Math.PI / 2;
  addCyl(g, 0.04, 0.032, 0.05, 8, '#c9c9c9', 0, 0, 0.17).rotation.x = Math.PI / 2;
  g.name = 'flashlight';
  return g;
}
export function makeKeg(parent) {
  const g = pivot(parent);
  addCyl(g, 0.2, 0.2, 0.5, 10, '#a9adb2', 0, 0.25, 0);
  for (const y of [0.08, 0.42]) addCyl(g, 0.21, 0.21, 0.04, 10, '#8a8e93', 0, y, 0);
  g.name = 'keg';
  return g;
}
export function makeNotepad(hand) {
  const g = pivot(hand, 0, 0.03, 0.08);
  part(g, 0.12, 0.16, 0.015, '#f2ecd8', 0, 0, 0);
  part(g, 0.12, 0.02, 0.02, '#8e1b2c', 0, 0.08, 0);
  g.name = 'notepad';
  return g;
}
export function makeDonut(hand) {
  const g = pivot(hand, 0, 0.03, 0.08);
  const d = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.022, 4, 8), mat('#e98aa8')); d.rotation.x = Math.PI / 2; g.add(d);
  g.name = 'donut';
  return g;
}
export function makeCigar(hand) {
  const g = pivot(hand, 0, 0.0, 0.05);
  part(g, 0.02, 0.02, 0.12, '#5a3a22', 0, 0, 0.04);
  g.tip = part(g, 0.022, 0.022, 0.015, '#ff7a3a', 0, 0, 0.105);
  g.name = 'cigar';
  return g;
}

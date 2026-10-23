// Small Plays · reusable body language for extras. Every act is a pure function of time.
import { P, clamp, lerp, smooth, hash1, stepRand, walkCycle, headToward, easeOut } from './engine.js';

// idle weight shifts and the occasional glance
export function idle(p, t, seed = 0) {
  p.lean += 0.015 * Math.sin(t * 1.5 + seed * 3);
  p.side += 0.012 * Math.sin(t * 0.7 + seed);
  const r = stepRand(t, 2.6, seed);
  p.headY += (r - 0.5) * 0.9 * smooth(((t + seed) % 2.6) / 0.3);
  p.headX += (stepRand(t, 3.1, seed + 5) - 0.5) * 0.25;
  p.shLz += 0.06; p.shRz -= 0.06; p.elL -= 0.15; p.elR -= 0.15;
  return p;
}
export function sit(p, seatY) { p.sit = 1; p.seatY = seatY; p.shLx -= 0.3; p.shRx -= 0.3; p.elL -= 0.6; p.elR -= 0.6; return p; }
// raise a drink every `period` seconds with the given arm (0 = left, 1 = right)
export function drink(p, t, side = 1, period = 5, seed = 0) {
  const ph = ((t + seed * 1.7) % period) / period, up = ph < 0.22 ? Math.sin(Math.PI * ph / 0.22) : 0;
  const k = side ? 'R' : 'L';
  p['sh' + k + 'x'] = lerp(-0.55, -1.75, up); p['el' + k] = lerp(-1.0, -1.9, up); p['sh' + k + 'z'] = side ? 0.25 : -0.25;
  p.headX -= 0.25 * up;
  return p;
}
export function chat(p, t, seed = 0, side = 0) {
  const k = side ? 'R' : 'L', g = Math.max(0, Math.sin(t * 2.3 + seed * 5));
  p['sh' + k + 'x'] = -0.5 - 0.5 * g; p['el' + k] = -1.1 + 0.4 * Math.sin(t * 5 + seed); p['sh' + k + 'z'] = side ? -0.2 : 0.2;
  p.headX += 0.08 * Math.sin(t * 3.3 + seed); p.headZ += 0.06 * Math.sin(t * 1.9 + seed);
  return p;
}
export function bob(p, b, amt = 0.18) { const hit = Math.exp(-b.since * 9); p.headX += amt * hit; p.bodyY -= 0.015 * hit; return p; }
export function cheer(p, k) {
  if (k <= 0) return p;
  p.shLx = lerp(p.shLx, -2.7, k); p.shRx = lerp(p.shRx, -2.7, k); p.shLz = lerp(p.shLz, 0.35, k); p.shRz = lerp(p.shRz, -0.35, k);
  p.elL = lerp(p.elL, -0.2, k); p.elR = lerp(p.elR, -0.2, k); p.headX = lerp(p.headX, -0.45, k); p.mouth = Math.max(p.mouth, k);
  return p;
}
// swing-dance: partners circle a shared centre, stepping on the beat
export function dance(p, t, b, center, angle0, r, spin = 0.25, seed = 0, lead = true) {
  const ang = angle0 + (t * spin);
  p.x = center.x + Math.sin(ang) * r; p.z = center.z + Math.cos(ang) * r;
  p.h = ang + Math.PI;
  const step = Math.sin(Math.PI * (b.i + b.ph));
  p.hipLx = -0.45 * Math.max(0, step); p.kneeL = 0.7 * Math.max(0, step);
  p.hipRx = -0.45 * Math.max(0, -step); p.kneeR = 0.7 * Math.max(0, -step);
  p.bodyY = 0.04 * Math.abs(step); p.side = 0.08 * step; p.twist = 0.15 * step;
  if (lead) { p.shLx = -0.9; p.shLz = 0.5; p.elL = -1.2; p.shRx = -0.7; p.shRz = -0.3; p.elR = -1.0; }
  else { p.shLx = -1.0; p.shLz = -0.2; p.elL = -0.9; p.shRx = -1.2; p.shRz = -0.5; p.elR = -0.6; }
  // every 8 beats the follower twirls
  if (!lead && (b.i % 8) >= 6) { const tw = ((b.i % 8) - 6 + b.ph) / 2; p.h += tw * Math.PI * 2; p.shRx = -2.6; p.elR = -0.3; }
  p.headZ = 0.1 * step;
  return p;
}
// path walking: pts = [[x, z], ...], position eased between t0 and t1
export function walkPath(p, t, pts, t0, t1, stride = 0.55) {
  const lens = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(d); L += d; }
  const u = clamp((t - t0) / (t1 - t0)), s = (smooth(u) * 0.7 + u * 0.3) * L;
  let acc = 0, i = 0;
  while (i < lens.length - 1 && acc + lens[i] < s) acc += lens[i++];
  const a = pts[i], b = pts[i + 1], k = lens[i] ? (s - acc) / lens[i] : 0;
  p.x = lerp(a[0], b[0], k); p.z = lerp(a[1], b[1], k);
  p.h = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const moving = t > t0 && t < t1 ? 1 : 0;
  if (moving) walkCycle(p, (s / stride) * Math.PI, 0.8);
  return { moving, dist: s, total: L };
}
export function polish(p, t) {
  p.shLx = -0.9; p.shLz = -0.3; p.elL = -1.2; p.shRx = -0.8; p.shRz = 0.3; p.elR = -1.3 + 0.25 * Math.sin(t * 9);
  p.headX += 0.2; p.headY += 0.15 * Math.sin(t * 0.8);
  return p;
}
export function lookAt(p, x, z, k = 1, max = 1.2) { p.headY = lerp(p.headY, headToward(p, x, z, max), k); return p; }
// stock "frozen in the dark, then everyone looks around" reaction
export function startle(p, t, t0, seed = 0) {
  const k = t - t0;
  if (k < 0) return p;
  const look = Math.sin((t + seed) * 2.2) * 0.9 * smooth(k / 0.4);
  p.headY = look; p.headX = -0.1; p.eyes = 'wide';
  return p;
}
export { P, hash1, easeOut };

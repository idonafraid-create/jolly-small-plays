// Small Plays · The Jolly — scene switcher, playback, camera zoom/pan, DOM HUD.
import { Stage, clamp, makeMarker } from './engine.js';

const QS = new URLSearchParams(location.search);
const CAPTURE = QS.has('capture');
const ORDER = ['cellar', 'bar', 'alley', 'motel'];
const $ = id => document.getElementById(id);
if (CAPTURE) document.body.classList.add('capture');

const viewport = $('viewport'), audio = $('audio');
const stage = new Stage(viewport, { capture: CAPTURE, captureSize: [480, 270], pxPerM: 24 });

// ── page theme: dark by default, remembered per browser; the post pass keeps the page colour exact ──
const root = document.documentElement;
function applyTheme(th) {
  root.dataset.theme = th;
  stage.setPaper(getComputedStyle(root).getPropertyValue('--paper').trim());
  $('theme').textContent = th === 'dark' ? 'THEME · DARK' : 'THEME · LIGHT';
}
applyTheme(QS.get('theme') || (root.dataset.theme === 'light' ? 'light' : 'dark'));
$('theme').addEventListener('click', () => {
  const th = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(th);
  try { localStorage.setItem('jolly-theme', th); } catch {}
});

// ── scene registry ──
const defs = {};
await Promise.all(ORDER.map(async id => {
  try { defs[id] = (await import(`./scenes/${id}.js`)).default; } catch (e) { console.warn('scene not ready:', id, e.message); }
}));
const built = {};
async function getScene(id) {
  if (built[id]) return built[id];
  const def = defs[id];
  const cues = await (await fetch(def.cues)).json();
  stage.setScene(def);
  const rt = def.build(stage, cues);
  // leads wear a spinning inverted triangle in their colour, with their name above it
  const LEAD_Y = { JOJO: 0.68, LYLY: 0.66, YOYO: 0.55 };
  rt.markers = (rt.people || []).filter(o => o.name in LEAD_Y).map(o => ({ o, mesh: makeMarker(rt.scene, o.color), dy: LEAD_Y[o.name] }));
  built[id] = { def, cues, rt, total: cues.total };
  return built[id];
}
const markerPos = (mk, spin) => {
  mk.o.rig.head.getWorldPosition(mk.mesh.position);
  mk.mesh.position.y += mk.dy + 0.04 * Math.sin(spin * 2.1);
  mk.mesh.rotation.y = spin * 1.6;
  mk.mesh.visible = mk.o.rig.root.visible && !mk.o.rig.lastPose?.noMarker;
};

// ── HUD: floors, dial, chapters ──
const floorsEl = $('floors');
ORDER.forEach((id, i) => {
  const d = defs[id], b = document.createElement('button');
  b.className = 'floor'; b.dataset.id = id;
  b.innerHTML = `<span class="k">${d ? d.floor : '—'}</span><span class="n">${d ? d.label : 'SOON'}</span>`;
  b.title = d ? `${d.place} · ${d.title}  (${i + 1})` : 'Coming soon';
  if (!d) b.disabled = true;
  b.addEventListener('click', () => d && switchTo(id, true));
  floorsEl.appendChild(b);
});
const angleOf = i => -66 + i * 44;
{
  const ticks = $('ticks'), rays = $('rays');
  const pt = (a, r) => [118 + Math.sin(Math.PI / 180 * a) * r, 60 - Math.cos(Math.PI / 180 * a) * r];
  for (let a = -84; a <= 84; a += 7) { const [x1, y1] = pt(a, 22), [x2, y2] = pt(a, 45); rays.insertAdjacentHTML('beforeend', `<line class="ray" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`); }
  ORDER.forEach((id, i) => {
    const a = angleOf(i), [x1, y1] = pt(a, 50), [x2, y2] = pt(a, 43), [tx, ty] = pt(a, 60);
    ticks.insertAdjacentHTML('beforeend', `<line class="tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${tx}" y="${ty + 3}" data-id="${id}">${defs[id]?.floor ?? '—'}</text>`);
  });
}
function setChapters(list, total) {
  const marks = $('marks'); marks.innerHTML = '';
  let lastX = -99;
  list.forEach(c => {
    const u = c.t / total * 100, x = u.toFixed(3) + '%', room = u - lastX > 8;
    marks.insertAdjacentHTML('beforeend', `<i class="tl-mark" style="left:${x}"></i><span class="tl-label" data-t="${c.t}" style="left:${x};${room ? '' : 'bottom:33px'}">${c.label}</span>`);
    lastX = room ? u : lastX;
  });
}
const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`; };

// ── playback ──
let cur = null, playing = false, started = false, clockT = 0, holdUntil = 0, last = performance.now(), switching = false;
const tNow = () => (cur && !audio.error && audio.readyState >= 2 && started ? audio.currentTime : clockT);
function setPlaying(on) {
  playing = on; started ||= on;
  if (on) audio.play().catch(() => {}); else audio.pause();
  $('live').classList.toggle('off', !on); $('live').querySelector('span').textContent = on ? 'Live' : 'Paused';
  $('playIcon').innerHTML = on ? '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>' : '<path d="M2 1 L11 6 L2 11 Z"/>';
  $('hint').classList.add('hide');
}
function seek(t) { if (!cur) return; t = clamp(t, 0, cur.total - 0.01); clockT = t; try { audio.currentTime = t; } catch {} }
let ding;
function playDing() {
  if (audio.muted) return;
  try {
    ding ||= new AudioContext();
    const o = ding.createOscillator(), g = ding.createGain(), t = ding.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(1318, t); o.frequency.setValueAtTime(1046, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(ding.destination); o.start(t); o.stop(t + 1);
  } catch {}
}
async function switchTo(id, userGesture = false) {
  if (switching || !defs[id] || (cur && cur.def.id === id)) return;
  switching = true;
  const d = defs[id], wasPlaying = playing || (userGesture && !started);
  $('ffKey').textContent = d.floor; $('ffName').textContent = d.place;
  $('needle').style.transform = `rotate(${angleOf(ORDER.indexOf(id))}deg)`;
  document.querySelectorAll('#ticks text').forEach(t => t.classList.toggle('on', t.dataset.id === id));
  document.querySelectorAll('.floor').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  if (cur) { $('doors').classList.add('shut'); audio.pause(); await new Promise(r => setTimeout(r, 420)); }
  cur = await getScene(id);
  stage.setScene(cur.def); stage.resetView(); stage.zoom = 1; stage.pan = { x: 0, y: 0 }; stage.applyView();
  audio.src = cur.def.audio; audio.load();
  clockT = 0; holdUntil = 0;
  $('chNo').textContent = `CH.0${d.ch}`; $('chPlace').textContent = d.place; $('chClock').textContent = d.clock; $('chTitle').textContent = d.title;
  document.title = `${d.title} — Small Plays`;
  setChapters(cur.rt.chapters, cur.total);
  render(0);
  await new Promise(r => setTimeout(r, cur && $('doors').classList.contains('shut') ? 260 : 0));
  $('doors').classList.remove('shut');
  playDing();
  if (wasPlaying) setPlaying(true);
  switching = false;
}

// ── input: click = play/pause, drag = pan, wheel = zoom, hover = names ──
const canvas = stage.renderer.domElement;
let drag = null, hover = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  hover = { x: (e.clientX - r.left) / r.width * stage.lowW, y: (e.clientY - r.top) / r.height * stage.lowH };
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; viewport.classList.add('dragging'); }
  if (drag.moved) { stage.panBy(dx * (devicePixelRatio || 1), dy * (devicePixelRatio || 1)); drag.x = e.clientX; drag.y = e.clientY; }
});
canvas.addEventListener('pointerup', () => {
  if (drag && !drag.moved) { const c = clueUnder(); if (c) collect(c); else setPlaying(!playing); }
  drag = null; viewport.classList.remove('dragging');
});
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('dblclick', () => stage.resetView());
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((e.clientY - r.top) / r.height) * 2;
  stage.zoomAt(Math.exp(-e.deltaY * 0.0015), nx, ny);
}, { passive: false });
$('play').addEventListener('click', () => setPlaying(!playing));
$('restart').addEventListener('click', () => { seek(0); setPlaying(true); });
$('sound').addEventListener('click', () => { audio.muted = !audio.muted; $('sound').textContent = audio.muted ? 'SOUND · OFF' : 'SOUND · ON'; });
$('timeline').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * cur.total); });
addEventListener('keydown', e => {
  if (e.code === 'Space') { setPlaying(!playing); e.preventDefault(); }
  else if (e.key >= '1' && e.key <= '4') switchTo(ORDER[+e.key - 1], true);
  else if (e.key === 'ArrowRight') seek(tNow() + 2);
  else if (e.key === 'ArrowLeft') seek(tNow() - 2);
  else if (e.key === 'r' || e.key === 'R') { seek(0); setPlaying(true); }
  else if (e.key === '0') stage.resetView();
  else if (e.key === '=' || e.key === '+') stage.zoomAt(1.25);
  else if (e.key === '-') stage.zoomAt(0.8);
});
audio.addEventListener('ended', () => { holdUntil = performance.now() + 1200; });
addEventListener('resize', () => stage.resize());

// ── the case file: one piece of evidence per floor, clicked when it glints ──
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem('jolly-case-v1') || '[]')); } catch {}
const activeClues = t => (cur?.rt.clues || []).filter(c => t >= c.t0 && t < c.until && !found.has(c.id));
function clueUnder() {
  if (!hover) return null;
  for (const c of activeClues(tNow())) { const [x, y] = stage.screenOf(c.at()); if (Math.hypot(x - hover.x, y - hover.y) < 10) return c; }
  return null;
}
let toastTimer;
function toast(k, v, n) {
  $('toastK').textContent = k; $('toastV').textContent = v; $('toastN').textContent = n;
  $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}
function paintCase() {
  document.querySelectorAll('#case i').forEach(i => i.classList.toggle('got', found.has(i.dataset.id)));
  $('caseN').textContent = `${found.size}/4`;
}
function collect(c) {
  found.add(c.id);
  try { localStorage.setItem('jolly-case-v1', JSON.stringify([...found])); } catch {}
  paintCase(); playDing();
  if (found.size === 4) toast('Case closed', 'It was YOYO. Obviously.', '4 / 4');
  else toast('Evidence', c.label.toLowerCase().replace(/^the /, 'The '), `${found.size} / 4`);
}
paintCase();
function drawClues(t) {
  const g = stage.hg, under = clueUnder();
  for (const c of activeClues(t)) {
    const [x, y] = stage.screenOf(c.at()), on = Math.floor(performance.now() / 300) % 3 !== 0;
    if (on || c === under) { g.fillStyle = '#ffe28a'; g.fillRect(x, y - 5, 1, 2); g.fillRect(x, y + 4, 1, 2); g.fillRect(x - 5, y, 2, 1); g.fillRect(x + 4, y, 2, 1); }
    if (c === under) names.push({ x, y: y - 6, text: c.label, sub: 'Click to inspect', cls: 'clue' });
  }
  canvas.style.cursor = under ? 'zoom-in' : '';
}
// DOM labels: fixed small type whatever the art-pixel size
let names = [];
const namesEl = $('names'), namePool = [];
function flushNames() {
  const k = canvas.clientWidth / stage.lowW, ox = canvas.offsetLeft, oy = canvas.offsetTop;
  names.forEach((n, i) => {
    let el = namePool[i];
    if (!el) { el = document.createElement('div'); namePool.push(el); namesEl.appendChild(el); }
    const html = n.sub ? `${n.text}<small>${n.sub}</small>` : n.text;
    if (el._html !== html) { el.innerHTML = html; el._html = html; }
    el.className = 'nm' + (n.cls ? ' ' + n.cls : '');
    el.style.setProperty('--c', n.color || '#f6efe2');
    el.style.left = (ox + (n.x + 0.5) * k) + 'px'; el.style.top = (oy + n.y * k) + 'px';
    el.style.display = '';
  });
  for (let i = names.length; i < namePool.length; i++) namePool[i].style.display = 'none';
  names = [];
}
// SNAP: the current frame, upscaled with hard pixel edges
function snap() {
  const t = Math.min(tNow(), cur.total - 0.001);
  render(t);
  const k = Math.max(4, stage.ps), out = document.createElement('canvas');
  out.width = stage.lowW * k; out.height = stage.lowH * k;
  const g = out.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(canvas, 0, 0, out.width, out.height);
  out.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `small-plays-${cur.def.id}-${t.toFixed(1)}s.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  toast('Snapshot', `${cur.def.place}, ${fmt(t)}`, 'PNG');
}
$('snap').addEventListener('click', snap);
addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P') snap(); });

// ── frame ──
function drawNames() {
  const placed = [], k = canvas.clientWidth / stage.lowW || 1, gapX = 68 / k, gapY = 24 / k;
  for (const mk of cur.rt.markers) {
    if (!mk.mesh.visible) continue;
    let [x, y] = stage.screenOf(mk.mesh.position.clone().setY(mk.mesh.position.y + 0.12));
    while (placed.some(([px, py]) => Math.abs(px - x) < gapX && Math.abs(py - y) < gapY)) y -= gapY;      // stack names that would collide
    placed.push([x, y]);
    names.push({ x, y, text: mk.o.name, color: mk.o.color });
  }
}
function drawHover() {
  if (!hover || !cur?.rt.people) return;
  let best = null, bd = 13;
  for (const o of cur.rt.people) {
    if (!o.rig.root.visible || cur.rt.markers.some(m => m.o === o)) continue;
    const [x, y] = stage.screenOf(o.rig.head, 0.2), d = Math.hypot(x - hover.x, y - hover.y);
    if (d < bd) { bd = d; best = { o, x, y }; }
  }
  if (!best) return;
  const { o, x, y } = best;
  names.push({ x, y: y - 3, text: o.name, sub: o.role, color: o.color });
}
function render(t) {
  if (!cur) return;
  cur.rt.update(t);
  const spin = CAPTURE ? t : performance.now() / 1000;
  cur.rt.markers.forEach(mk => markerPos(mk, spin));
  stage.render(cur.rt.scene, () => {
    cur.rt.hud(t);
    if (CAPTURE) { for (const mk of cur.rt.markers) if (mk.mesh.visible) stage.label(mk.o.name, stage.screenOf(mk.mesh.position.clone().setY(mk.mesh.position.y + 0.12)), mk.o.color); return; }
    drawNames(); drawClues(t); drawHover();
  });
  if (!CAPTURE) flushNames();
}
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!cur) return;
  stage.stepView(dt);
  if (holdUntil && now > holdUntil) { holdUntil = 0; seek(0); if (playing) audio.play().catch(() => {}); }
  if (playing && !holdUntil && (audio.error || audio.readyState < 2)) clockT = Math.min(cur.total - 0.01, clockT + dt);
  const t = Math.min(tNow(), cur.total - 0.001);
  render(t);
  $('tc').innerHTML = `${fmt(t)} <small>/ ${fmt(cur.total)}</small>`;
  const u = t / cur.total * 100;
  $('prog').style.width = u + '%'; $('head').style.left = u + '%';
  document.querySelectorAll('.tl-label').forEach((l, i, all) => l.classList.toggle('now', t >= +l.dataset.t && (i === all.length - 1 || t < +all[i + 1].dataset.t)));
  const z = stage.zoom ?? 1;
  $('zoomVal').textContent = z.toFixed(1) + '×';
  $('zoomTick').style.left = ((z - Stage.ZOOM_MIN) / (Stage.ZOOM_MAX - Stage.ZOOM_MIN) * 100) + '%';
  $('ps').textContent = stage.ps;
}

if (CAPTURE) {
  const id = QS.get('scene') || 'bar';
  cur = await getScene(id);
  stage.setScene(cur.def);
  window.__total = cur.total;
  window.__renderAt = t => { render(t); return canvas.toDataURL('image/png'); };
} else {
  await switchTo(QS.get('scene') && defs[QS.get('scene')] ? QS.get('scene') : 'bar');
  if (QS.has('t')) { clockT = +QS.get('t'); }
  loop();
}
window.__sp = { stage, defs, built, seek, switchTo, get t() { return tNow(); } };

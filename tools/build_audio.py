"""Small Plays · JOLLY anthology — soundtracks + animation cues for each channel.

python tools/build_audio.py "D:/ClaudeAbout/JOLLY MV" [bar alley cellar motel]
  → assets/<scene>.wav, <scene>.m4a, <scene>.json
Music comes from the JOLLY song stems. Effects are CC0 recordings where there is a good one (the JOLLY MV library, and
assets/sfx made by tools/sfx_prep.py: rain, thunder, drips, a door, hissing cats, the freight, glass), each levelled to the
synthesized sound it replaced (`like`) so the mix stays as it was; the rest (crowd, drones, footsteps, clangs) is synthesized.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt, fftconvolve

MV = Path(sys.argv[1])
ONLY = set(sys.argv[2:])
OUT = Path(__file__).resolve().parents[1] / 'assets'
OUT.mkdir(exist_ok=True)
SR = 48000
RNG = np.random.default_rng(7)
TL = json.loads((MV / '10_music/timeline.json').read_text(encoding='utf-8'))
BEATS, BARS = np.array(TL['beats']), np.array(TL['bars'])
SFX = MV / '10_music/sfx'
REC = Path(__file__).resolve().parents[1] / 'assets/sfx'


# ───────────────────────── io & dsp helpers ─────────────────────────
def load(p, mono=True):
    y, s = sf.read(str(p), always_2d=True)
    y = y.mean(1) if mono else y
    if s != SR:
        y = librosa.resample(y.T, orig_sr=s, target_sr=SR).T
    return y.astype(np.float32)


_SONG, _STEMS = None, {}
def song():
    global _SONG
    if _SONG is None: _SONG = load(MV / '10_music/jolly_mv_song.wav', mono=False)
    return _SONG
def stem(k):
    if k not in _STEMS: _STEMS[k] = load(MV / f'10_music/stems_song/{k}.wav')
    return _STEMS[k]


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x, axis=0).astype(np.float32)


def env(x, fps=60, win=0.05):
    hop, n = SR // fps, int(win * SR)
    pad = np.pad(x, (n // 2, n // 2))
    return np.array([np.sqrt(np.mean(pad[i:i + n] ** 2)) for i in range(0, len(x), hop)])


def norm(e, q=97):
    return np.clip(e / (np.percentile(e, q) + 1e-9), 0, 1)


def onsets(x, delta=0.08, wait=6):
    return librosa.onset.onset_detect(y=x, sr=SR, units='time', backtrack=False, delta=delta, wait=wait)


def trim_lead(y, thr=0.08):
    e = np.abs(y); on = np.where(e > e.max() * thr)[0][0]
    return y[max(0, on - int(.04 * SR)):]


def reverb(x, secs=1.8, wet=0.3, damp=3000):
    n = int(secs * SR)
    ir = RNG.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = filt(ir.astype(np.float32), 'low', damp)
    y = fftconvolve(x, ir)[:len(x) + n]
    y = y / (np.abs(y).max() + 1e-9) * np.abs(x).max()
    out = np.zeros(len(y), np.float32); out[:len(x)] += x * (1 - wet)
    return out + y.astype(np.float32) * wet


def tape_stop(x, dur):
    """slow the last `dur` seconds down to a halt (power cut)."""
    n = int(dur * SR); head, tail = x[:-n], x[-n:]
    speed = (1 - np.linspace(0, 1, n)) ** 1.6
    idx = np.cumsum(speed); idx = idx[idx < len(tail) - 1]
    if tail.ndim == 2: warped = np.stack([np.interp(idx, np.arange(len(tail)), tail[:, c]) for c in range(tail.shape[1])], 1)
    else: warped = np.interp(idx, np.arange(len(tail)), tail)
    warped *= np.linspace(1, 0, len(warped))[:, None] if warped.ndim == 2 else np.linspace(1, 0, len(warped))
    return np.concatenate([head, warped.astype(np.float32)])


def pitch(x, semis):
    return librosa.resample(x, orig_sr=SR * 2 ** (semis / 12), target_sr=SR).astype(np.float32)


# ───────────────────────── synthesized sounds ─────────────────────────
def murmur(dur, voices=10, lo=260, hi=1500):
    n = int(dur * SR); out = np.zeros(n, np.float32)
    for v in range(voices):
        f = RNG.uniform(lo, hi)
        x = filt(RNG.standard_normal(n).astype(np.float32), 'band', [f * 0.7, f * 1.4])
        k = int(SR / RNG.uniform(3, 6))
        a = np.repeat(np.clip(RNG.standard_normal(n // k + 2) * 0.8 + 0.3, 0, None), k)[:n]
        a = filt(a.astype(np.float32), 'low', 8)
        gate = np.repeat(RNG.random(n // (SR * 2) + 2) > 0.3, SR * 2)[:n]
        out += x * a * gate
    return out / (np.abs(out).max() + 1e-9)


def clink(f0=None):
    n = int(0.25 * SR); t = np.arange(n) / SR; f0 = f0 or RNG.uniform(2300, 3200)
    y = sum(np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * (18 + 8 * i)) / (i + 1) for i, m in enumerate([1, 1.52, 2.21]))
    return (y * 0.5).astype(np.float32)


def whoosh(dur=0.35, lo=500, hi=3000):
    n = int(dur * SR); x = RNG.standard_normal(n).astype(np.float32)
    parts = [filt(seg, 'band', [lo * (1 + i), hi]) for i, seg in enumerate(np.array_split(x, 4))]
    y = np.concatenate(parts) * np.sin(np.linspace(0, np.pi, n)); return y * 0.5


def thump(f=55, dur=0.35, noise=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * np.exp(-t * 14) + filt(RNG.standard_normal(n).astype(np.float32), 'low', 400) * np.exp(-t * 30) * noise
    return y.astype(np.float32)


def rain(dur, density=1.0, bright=6000):
    n = int(dur * SR)
    bed = filt(RNG.standard_normal(n).astype(np.float32), 'band', [400, bright]) * 0.35
    drops = np.zeros(n, np.float32)
    for i in RNG.integers(0, n - 2000, int(dur * 900 * density)):
        L = RNG.integers(200, 900); t = np.arange(L) / SR
        drops[i:i + L] += (np.sin(2 * np.pi * RNG.uniform(1500, 5000) * t) * np.exp(-t * RNG.uniform(200, 500)) * RNG.uniform(0.1, 0.6)).astype(np.float32)
    return bed + drops * 0.6


def thunder(dur=4.0, crack=True):
    n = int(dur * SR); t = np.arange(n) / SR
    rum = filt(RNG.standard_normal(n).astype(np.float32), 'low', 160, 3) * (np.exp(-t * 0.9) * (1 + 0.6 * np.sin(2 * np.pi * 0.7 * t)))
    y = rum * 2.2
    if crack:
        c = filt(RNG.standard_normal(int(0.5 * SR)).astype(np.float32), 'band', [300, 4000]) * np.exp(-np.arange(int(0.5 * SR)) / SR * 9)
        y[:len(c)] += c * 1.2
    return (y / (np.abs(y).max() + 1e-9)).astype(np.float32)


def drip(f=None):
    n = int(0.18 * SR); t = np.arange(n) / SR; f = f or RNG.uniform(900, 1700)
    return (np.sin(2 * np.pi * f * t * (1 + 1.8 * t)) * np.exp(-t * 35)).astype(np.float32)


def drone(dur, base=55):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * base * m * t + RNG.uniform(0, 6)) * a for m, a in [(1, 1), (1.007, 0.8), (1.5, 0.35), (2.02, 0.25), (0.5, 0.6)])
    y *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t)
    return (y / np.abs(y).max()).astype(np.float32)


def hiss(dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    return (filt(RNG.standard_normal(n).astype(np.float32), 'band', [2500, 9000]) * np.minimum(1, t * 20) * np.exp(-t * 3)).astype(np.float32)


def bleep(f=1800, dur=0.06):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sign(np.sin(2 * np.pi * f * t)) * 0.25 * np.exp(-t * 20)).astype(np.float32)


def boing(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (180 + 260 * np.sin(np.pi * t / dur)) * t) * np.exp(-t * 5)).astype(np.float32)


def steps(times, f=90):
    return [(t, thump(f * RNG.uniform(0.9, 1.1), 0.18, 0.8) * RNG.uniform(0.6, 1.0)) for t in times]


def neon_hum(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 120 * t) + 0.4 * np.sin(2 * np.pi * 240 * t)) * 0.3).astype(np.float32)


# ───────────────────────── recordings ─────────────────────────
def rec(name):
    return load(REC / f'{name}.mp3')


def rms(x):
    a = np.abs(x); on = a > a.max() * 0.01                      # loudness while it sounds, not over its silences
    return float(np.sqrt(np.mean(x[on] ** 2))) if on.any() else 0.0


def like(x, ref):
    """x scaled to the loudness of `ref` (the synthesized sound it replaces), so the mix keeps its balance; its peaks are
    soft-limited to ref's, or one sharp transient (a thunder crack) would set the whole mix's normalization and sink it."""
    y, pk = x.astype(np.float64), float(np.abs(ref).max()) * 1.3 + 1e-9
    for _ in range(4):                                         # level, limit, level again: limiting costs loudness
        y = y * rms(ref) / (rms(y) + 1e-9)
        if np.abs(y).max() > pk: y = pk * np.tanh(y / pk)
    return y.astype(np.float32)


def loop(x, dur):
    n = int(dur * SR); return np.tile(x, n // len(x) + 1)[:n].astype(np.float32)


def thunder_rec(dur=4.0, crack=True):
    n = int(dur * SR); y = np.zeros(n, np.float32)
    r = rec('rumble')[:n - int(0.12 * SR)]; y[int(0.12 * SR):int(0.12 * SR) + len(r)] += r
    if crack: c = rec('crack'); y[:len(c)] += c * 1.3
    if dur < len(r) / SR + 0.12: y[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
    return like(y, thunder(dur, crack))


def rain_rec(dur, density=1.0, bright=6000):
    return like(loop(rec('rain'), dur), rain(min(dur, 6.0), density, bright))


class Mix:
    def __init__(self, total):
        self.buf = np.zeros((int(total * SR), 2), np.float32); self.total = total
    def add(self, clip, t, db=0.0, pan=0.0):
        clip = clip if clip.ndim == 2 else np.stack([clip * (1 - max(0, pan)), clip * (1 + min(0, pan))], 1)
        i = int(round(t * SR)); g = 10 ** (db / 20)
        a, b = max(0, i), min(len(self.buf), i + len(clip))
        if b > a: self.buf[a:b] += clip[a - i:b - i] * g
    def write(self, name, fade=1.0):
        f = int(fade * SR); self.buf[-f:] *= np.linspace(1, 0, f)[:, None]
        self.buf *= 0.89 / (np.abs(self.buf).max() + 1e-9)
        sf.write(OUT / f'{name}.wav', self.buf, SR, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / f'{name}.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / f'{name}.m4a')], check=True)


def song_cut(a, b):
    return song()[int(a * SR):int(b * SR)].copy()


def vocal_onset(after, before=None, thr=-34):
    lv = stem('lead_vocals'); e = env(lv[int(after * SR):int((before or after + 4) * SR)], fps=100, win=0.03)
    db = 20 * np.log10(e + 1e-9); i = int(np.argmax(db > thr))
    return after + i / 100


def cues_for(a, b, at, stems_env, onset_stems):
    """envelopes (60 fps from `at`) and onsets/beats mapped into piece time."""
    to_piece = lambda t: at + (t - a)
    r = lambda v, d=3: round(float(v), d)
    c = {'beats': [r(to_piece(x)) for x in BEATS if a - 4 <= x < b + 4], 'bars': [r(to_piece(x)) for x in BARS if a - 8 <= x < b + 8]}
    for key, parts in stems_env.items():
        x = sum(stem(p)[int(a * SR):int(b * SR)] for p in parts)
        c[key] = [r(v, 2) for v in norm(env(x))]
    for key, (part, delta) in onset_stems.items():
        x = stem(part)[int(a * SR):int(b * SR)]
        c[key] = [r(to_piece(a + t)) for t in onsets(x, delta)]
    return c


def save_cues(name, cues, ev, total):
    cues.update({'ev': {k: round(float(v), 3) for k, v in ev.items()}, 'total': round(total, 3)})
    (OUT / f'{name}.json').write_text(json.dumps(cues, separators=(',', ':')), encoding='utf-8')
    print(f'{name}: total {total:.2f}s  events', {k: round(v, 2) for k, v in ev.items()})


bark_files = [SFX / f'listen_dl/{n}.mp3' for n in ['bark_sj1', 'bark_sj2', 'bark_sj3', 'bark_sj4', 'bark_kw', 'bark_double']]


def crowd_bark(m, t, n=5, db=-6):
    for i in range(n):
        b = pitch(load(bark_files[i % len(bark_files)]), RNG.uniform(-3, 3))
        m.add(b, t + RNG.uniform(-0.04, 0.12), db + RNG.uniform(-5, 0), pan=RNG.uniform(-0.6, 0.6))


# ───────────────────────── CH.01 · bar ─────────────────────────
def build_bar():
    A, B = float(BARS[31]), float(BARS[41])
    AT = 2.0
    P = lambda t: AT + (t - A)
    line = lambda frag, after: next(l['start'] for l in TL['lines'] if frag in l['text'] and l['start'] > after)
    ev = {'music': AT, 'chorus': P(BARS[32]), 'bark1': P(line('No talk', 60)), 'spin': P(BARS[35]), 'bark2': P(line('No talk', 70)),
          'wang1': P(BARS[37]), 'wang2': P(BARS[37] + 2 * (BARS[38] - BARS[37]) / 4), 'jolly': P(line('JOLLY', 77)), 'blackout': P(B)}
    ev = {k: float(v) for k, v in ev.items()}
    ev['knock'] = ev['spin'] + 0.45; ev['catch'] = ev['knock'] + 0.6
    ev['lights'] = ev['blackout'] + 1.5; ev['end'] = ev['lights'] + 6.0
    total = ev['end']
    m = Mix(total)
    seg = tape_stop(song_cut(A, B + 0.02), 0.32)
    m.add(seg, AT, -1)
    bed = murmur(total)
    duck = np.ones(len(bed), np.float32)
    duck[int(AT * SR):int(ev['blackout'] * SR)] = 0.35
    duck[int(ev['blackout'] * SR):int(ev['lights'] * SR)] = 0.0
    m.add(bed * filt(duck, 'low', 3), 0, -17)
    for t in RNG.uniform(0.3, total - 1, 14):
        if not (ev['blackout'] < t < ev['lights']): m.add(like(pitch(rec('clink'), RNG.uniform(-3, 4)), clink()), t, -24, pan=RNG.uniform(-0.8, 0.8))
    for k in ['bark1', 'bark2']: crowd_bark(m, ev[k], 6, -7)
    for k in ['wang1', 'wang2']: crowd_bark(m, ev[k], 3, -10)
    m.add(like(rec('whip'), whoosh(0.4)), ev['knock'], -12); m.add(like(pitch(rec('clink'), 3), clink(3400)), ev['knock'], -16)
    m.add(like(rec('clink'), clink(2600)), ev['catch'], -12)
    m.add(load(SFX / 'listen_dl/switch_off.mp3'), ev['blackout'], -6)
    m.add(load(SFX / 'bells/bell_4_closeup.wav'), ev['blackout'] + 0.35, -4)
    m.add(load(SFX / 'candidates/C2_jingle_bell_short.mp3'), ev['blackout'] + 1.1, -12, pan=-0.5)
    m.add(load(SFX / 'listen_dl/switch2.mp3'), ev['lights'], -6)
    gasp = murmur(2.5, 14, 400, 1200) * np.linspace(0, 1, int(2.5 * SR)) ** 0.5
    m.add(gasp, ev['lights'] + 0.2, -16)
    m.write('bar')
    c = cues_for(A, B, AT, {'vox': ['lead_vocals'], 'horns': ['brass', 'woodwinds'], 'keys': ['keyboard']},
                 {'bassOn': ('bass', 0.08), 'drumOn': ('drums', 0.12), 'keyOn': ('keyboard', 0.06)})
    save_cues('bar', c, ev, total)


def creak(dur=0.7, f0=230):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + 90 * np.sin(2 * np.pi * 2.3 * t) + RNG.standard_normal(n).cumsum() / SR * 40
    ph = np.cumsum(2 * np.pi * f / SR)
    y = filt((np.sign(np.sin(ph)) * 0.3).astype(np.float32), 'band', [500, 2600]) * np.sin(np.pi * t / dur)
    return y.astype(np.float32)


def rustle(dur=0.5):
    n = int(dur * SR); y = np.zeros(n, np.float32)
    for i in RNG.integers(0, n - 600, int(dur * 120)):
        L = RNG.integers(80, 600); y[i:i + L] += RNG.standard_normal(L).astype(np.float32) * RNG.uniform(0.1, 0.6)
    return filt(y, 'band', [1800, 8000]) * np.sin(np.linspace(0, np.pi, n))


def clang(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(212, 3, 1), (347, 4, .7), (518, 5, .5), (793, 7, .35), (1210, 9, .2)])
    y = (y / np.abs(y).max() * 0.8).astype(np.float32)
    th = thump(70, 0.4, 1.0); y[:len(th)] += th * 0.6
    return y


def splash_step():
    n = int(0.15 * SR)
    return thump(RNG.uniform(80, 110), 0.15, 0.5) * 0.7 + filt(RNG.standard_normal(n).astype(np.float32), 'band', [1500, 6000]) * np.exp(-np.arange(n) / SR * 30) * 0.4


def sniff():
    n = int(0.12 * SR); return filt(RNG.standard_normal(n).astype(np.float32), 'band', [900, 4000]) * np.sin(np.linspace(0, np.pi, n)) * 0.6


def horn(dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(np.sign(np.sin(2 * np.pi * f * t * (1 + 0.004 * np.sin(2 * np.pi * 5 * t)))) * a for f, a in [(277, 1), (349, 0.8), (415, 0.6)])
    return (filt(y.astype(np.float32), 'low', 1800) * np.minimum(1, t * 20) * np.minimum(1, (dur - t) * 8) * 0.3).astype(np.float32)


TRAIN_UNITS = [4.6, 4.4, 4.4, 3.6]                       # must match the alley scene's freight
ALLEY_HD = 2.9 + 2.2 - 0.3                               # the freight now runs across the surrounding ground too


def train_pass(m, t0, v, db=-6):
    centers, off = [], 0.0
    for L in TRAIN_UNITS: centers.append((off - L / 2, L)); off -= L + 0.4
    total_len = -off - 0.4
    dur = (ALLEY_HD * 2 + total_len) / v + 0.8
    n = int(dur * SR); tt = np.arange(n) / SR
    env_ = np.clip(np.minimum(tt / 0.5, (dur - tt) / 0.8), 0, 1) ** 0.7
    synth = filt(RNG.standard_normal(n).astype(np.float32), 'low', 200, 3) * env_ * 2.8 + filt(RNG.standard_normal(n).astype(np.float32), 'band', [500, 2200]) * env_ * 0.35 * 10 ** (-4 / 20)
    # a recorded train, the loud middle of its pass (slowed down for the slow one)
    r = rec('train'); r = pitch(r, -4) if v < 8 else r
    mid = int(np.argmax(np.convolve(np.abs(r), np.ones(SR // 4), 'same'))); a = int(np.clip(mid - n // 2, 0, max(0, len(r) - n)))
    body = r[a:a + n]; body = np.pad(body, (0, n - len(body)))
    body = body * env_; m.add(body * float(np.abs(synth).max()) / (float(np.abs(body).max()) + 1e-9), t0, db - 3)     # a recording is denser than noise at the same peak: 3 dB under it
    trucks = []
    for c, L in centers: trucks += [c + L / 2 - 0.75, c - L / 2 + 0.75]
    for joint in [-1.2, 1.2]:                                # two rail joints in view
        for tr in trucks:
            tc = t0 + (joint - tr + ALLEY_HD) / v
            for d in (0, 0.07): m.add(thump(120, 0.09, 1.2), tc + d, db - 2)
    m.add(like(rec('horn' if v >= 8 else 'toots'), horn(1.2)), t0 - 0.4, db - 5)
    return dur


# ───────────────────────── CH.02 · alley ─────────────────────────
def build_alley():
    A2, B2 = 100.2, 107.24                               # sax solo (woodwinds stem)
    ev = {'train1': 0.4, 'doorOpen': 3.4, 'hiss': 5.9, 'bagsDrop': 6.8, 'catsJump': 7.1, 'bark': 7.6, 'jojoOut': 9.3, 'solo': 10.8}
    ev['flash1'] = ev['solo'] + (B2 - A2) + 0.2; ev['flash2'] = ev['flash1'] + 1.5
    ev['bellLand'] = ev['flash2'] + 1.85; ev['pick'] = ev['bellLand'] + 1.0; ev['opera'] = ev['pick'] + 0.8
    ev['blind'] = ev['opera'] + 0.6; ev['point'] = ev['pick'] + 2.8; ev['catsGo'] = ev['pick'] + 1.2
    ev['train2'] = ev['point'] + 0.9; ev['end'] = ev['train2'] + 6.8
    total = ev['end']; m = Mix(total)
    m.add(rain_rec(total, density=0.35, bright=5000), 0, -15)
    train_pass(m, ev['train1'], 10.0); train_pass(m, ev['train2'], 5.0, db=-8)
    # the club through the stage door: muffled, brighter whenever the door swings open
    inside = song()[int(26.98 * SR):int((26.98 + 9.8) * SR)].mean(1)
    muffled, bright = filt(inside, 'low', 420), filt(inside, 'low', 3500)
    n = len(inside); tt = np.arange(n) / SR; a, j = ev['doorOpen'], ev['jojoOut']
    door = np.interp(tt, [0, a, a + .35, a + 1.1, a + 1.5, j - .4, j - .05, j + 1.0, j + 1.4, 99], [0, 0, 1, 1, .24, .24, 1, 1, .4, .4])
    fade = np.clip((9.6 - tt) / 0.8, 0, 1)
    m.add((muffled * 0.5 + bright * door) * fade, 0, -11)
    m.add(filt(murmur(10.0)[:n], 'low', 600) * fade, 0, -22)
    m.add(like(rec('creak'), creak(0.7)), a, -10); m.add(thump(65, 0.3, 0.8), a + 1.2, -12)
    m.add(like(pitch(rec('creak'), 2), creak(0.6, 260)), j - 0.4, -12)
    for t in np.arange(a + 0.3, ev['bagsDrop'] - 0.4, 0.42): m.add(splash_step(), t, -12); m.add(rustle(0.35), t + 0.05, -20)
    for i, d in enumerate([0, 0.12, 0.3]): m.add(like(pitch(rec('hiss'), RNG.uniform(-2, 3)), hiss(0.6)), ev['hiss'] + d, -9, pan=-0.3 + i * 0.2)
    m.add(rustle(0.6), ev['bagsDrop'] - 0.1, -12); m.add(clang(), ev['bagsDrop'] + 0.15, -9)
    m.add(thump(90, 0.2, 0.6), ev['catsJump'] + 0.45, -16)
    m.add(load(SFX / 'listen_dl/bark_sj2.mp3'), ev['bark'], -4)
    for t in np.arange(j, j + 1.1, 0.5): m.add(splash_step(), t, -14)
    solo = reverb(stem('woodwinds')[int(A2 * SR):int(B2 * SR)], 2.2, 0.38, 3500)
    solo[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    m.add(solo, ev['solo'], -2)
    m.add(load(SFX / 'candidates/C5_single_jingle_shake.mp3'), ev['flash1'] - 0.3, -20, pan=-0.6)
    m.add(thunder_rec(4.5), ev['flash1'] + 0.22, -1); m.add(thunder_rec(4.0), ev['flash2'] + 0.12, -3)
    m.add(load(SFX / 'bells/bell_1_coatcheck.wav'), ev['bellLand'], -8); m.add(like(rec('drip'), drip(1200)), ev['bellLand'], -10)
    for k in range(3): m.add(sniff(), ev['pick'] + 0.5 + k * 0.18, -14)
    m.add(load(SFX / 'listen_dl/bark_kw.mp3'), ev['pick'] + 1.3, -12)
    m.add(load(SFX / 'listen_dl/switch2.mp3'), ev['blind'], -14)
    m.write('alley', 1.5)
    c = cues_for(A2, B2, ev['solo'], {'sax': ['woodwinds']}, {})
    save_cues('alley', c, ev, total)


def vo_words(clip, at):
    e = env(clip, fps=100, win=0.03); on = e > e.max() * 0.12
    words, inside = [], False
    for i, v in enumerate(on):
        if v and not inside: words.append([i / 100, i / 100]); inside = True
        if v: words[-1][1] = i / 100
        if not v: inside = False
    return [[round(at + a, 3), round(at + b, 3)] for a, b in words if b - a > 0.06]


def yoyo_chord(semis=3, dur=2.2):
    g = load(SFX / 'yoyo_guitar_chord_clean.mp3')
    g = librosa.resample(g, orig_sr=SR * 2 ** (semis / 12), target_sr=SR)
    g = np.tanh(g / (np.abs(g).max() + 1e-9) * 9) / np.tanh(9)
    g = filt(g.astype(np.float32), 'low', 4200, 4)
    n = int(dur * SR); g = g[:n] * np.r_[np.ones(n - int(.7 * SR)), np.linspace(1, 0, int(.7 * SR)) ** 2]
    return g.astype(np.float32) * 0.6


# ───────────────────────── CH.03 · cellar ─────────────────────────
def build_cellar():
    ev = {'enter': 2.6, 'bottom': 6.6, 'pickKeg': 8.0, 'peek': 10.2, 'candles': 12.6, 'drop': 15.4, 'rise': 15.8, 'eye': 17.0,
          'reveal': 20.0, 'chord': 23.0, 'vo': 24.3, 'flee': 27.0, 'miao': 28.6, 'out': 29.2, 'end': 33.0}
    total = ev['end']; m = Mix(total)
    dr = drone(total, 49); swell = np.interp(np.arange(len(dr)) / SR, [0, ev['rise'], ev['eye'] + 1, ev['out'], total], [0.25, 0.35, 1.0, 0.9, 0.1])
    m.add(filt(dr * swell, 'low', 600), 0, -12)
    for k in range(int(total / 1.9) + 2):                             # the three visible drips, plus strays
        for i in range(3):
            tt = k * 1.9 - i * 0.7 + 0.6
            if 0 < tt < total: m.add(reverb(like(pitch(rec('drip'), (-2, 0, 3)[i]), drip()), 1.2, 0.4), tt, -18 - i * 2, pan=(-0.5, 0.1, 0.5)[i])
    hum = neon_hum(ev['rise']); hum *= (RNG.random(len(hum)) > 0.0002).astype(np.float32)
    m.add(filt(hum, 'band', [100, 900]), 0, -30)
    m.add(reverb(like(pitch(rec('creak'), -3), creak(0.8, 180)), 1.5, 0.4), ev['enter'] - 0.6, -14)
    m.add(load(SFX / 'listen_dl/switch2.mp3'), ev['enter'] - 0.1, -12)
    for tt in np.arange(ev['enter'] + 0.1, ev['bottom'], 0.34): m.add(reverb(thump(120, 0.14, 0.8), 0.8, 0.3), tt, -10)
    for tt in np.arange(ev['bottom'], ev['pickKeg'] - 0.3, 0.4): m.add(thump(95, 0.12, 0.6), tt, -15)
    m.add(pitch(clang(0.6), 7), ev['pickKeg'], -16)
    m.add(filt(whoosh(0.9, 200, 900), 'low', 900), ev['peek'] - 1.2, -12); m.add(filt(whoosh(0.5, 200, 900), 'low', 900), ev['peek'] + 0.1, -12)
    for k in range(8):
        m.add(filt(whoosh(0.35, 300, 2500), 'band', [200, 2500]), ev['candles'] + k * 0.38, -11, pan=np.sin(k) * 0.6)
        m.add(thump(60, 0.3, 0.6), ev['candles'] + k * 0.38, -17)
    m.add(clang(1.0), ev['drop'], -8)
    roll = filt(RNG.standard_normal(int(1.6 * SR)).astype(np.float32), 'low', 300) * (0.6 + 0.4 * np.sin(np.arange(int(1.6 * SR)) / SR * 2 * np.pi * 6)) * np.linspace(1, 0, int(1.6 * SR))
    m.add(roll, ev['drop'] + 0.1, -10)
    for tt in np.arange(ev['rise'], ev['reveal'], 0.78): m.add(thump(48, 0.22, 0.2), tt, -8); m.add(thump(44, 0.2, 0.2), tt + 0.22, -11)
    growl = reverb(pitch(load(SFX / 'listen_dl/purr.mp3')[:int(4 * SR)], -12), 2.5, 0.5, 1200)
    m.add(growl * np.linspace(0, 1, len(growl)) ** 0.3, ev['eye'] - 0.3, -2)
    for k in range(6): m.add(filt(whoosh(1.2, 150, 700), 'low', 700), ev['rise'] + k * 0.4, -14, pan=np.cos(k) * 0.5)
    m.add(load(SFX / 'bells/bell_4_closeup.wav'), ev['reveal'], -3)
    m.add(load(SFX / 'listen_dl/purr.mp3')[:int(2.8 * SR)], ev['reveal'] + 0.4, -7)
    m.add(reverb(yoyo_chord(1, 2.6), 2.2, 0.35), ev['chord'], -1)
    m.add(load(SFX / 'cand_v2/G2_guitar_impact1.mp3')[int(.35 * SR):int(2.4 * SR)], ev['chord'] + 0.02, -9)
    vo = trim_lead(load(MV / '10_music/vo/yoyo_12_no_bark_all_bite_naixiong_liyaoling_v1.wav'))
    m.add(reverb(vo, 1.6, 0.25), ev['vo'], 0)
    m.add(pitch(load(SFX / 'listen_dl/bark_kw.mp3'), 5), ev['flee'] - 0.15, -6)
    for tt in np.arange(ev['flee'], ev['flee'] + 1.6, 0.17): m.add(reverb(thump(130, 0.1, 0.8), 0.8, 0.3), tt, -11)
    m.add(clink(1800), ev['flee'] + 0.3, -12); m.add(thump(200, 0.1, 1.0), ev['flee'] + 0.32, -12)
    m.add(trim_lead(load(MV / '10_music/vo/yoyo_03b_miao_liyaoling_v1.wav')), ev['miao'], -1)
    for k in range(8): m.add(filt(whoosh(0.25, 800, 4000), 'band', [800, 4000]), ev['out'] + k * 0.15, -20)
    m.write('cellar', 1.4)
    save_cues('cellar', {'vo': vo_words(vo, ev['vo'])}, ev, total)


def squeak(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 2200 + 900 * np.sin(2 * np.pi * 7 * t)
    return (np.sin(np.cumsum(2 * np.pi * f / SR)) * 0.25 * np.sin(np.pi * t / dur) * (RNG.random(n) > 0.3)).astype(np.float32)


def hoot():
    out = []
    for f, d in [(380, 0.22), (340, 0.35)]:
        n = int(d * SR); t = np.arange(n) / SR; out.append(np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / d) * 0.6); out.append(np.zeros(int(0.08 * SR)))
    return np.concatenate(out).astype(np.float32)


# ───────────────────────── CH.04 · motel ─────────────────────────
def build_motel():
    ev = {'lens1': 3.2, 'donut': 5.8, 'lens2': 7.0, 'lens3': 10.6, 'rumble': 13.5, 'bolt1': 14.6, 'lens4': 15.0, 'bolt2': 17.2, 'dark': 17.3, 'lights': 18.3,
          'lens5': 19.2, 'donutDrop': 19.6, 'twitch': 23.0, 'sitUp': 24.0, 'peekIn': 24.3, 'vo': 24.6, 'stiletto': 25.6, 'pick': 26.6, 'pin': 27.4, 'stamp': 28.0, 'sting': 28.3, 'end': 34.0}
    flashes = [0.8, 2.6, 6.1, 9.8, 21.0]
    total = ev['end']; m = Mix(total)
    m.add(filt(rain_rec(total, 0.6, 7000), 'high', 900), 0, -13)
    for tt in RNG.uniform(0, total, 40): m.add(like(pitch(rec('drip'), RNG.uniform(3, 8)), drip(3000)), tt, -26)
    tv = load(SFX / 'tv_channel_static.mp3')
    for k in range(int(total / (len(tv) / SR)) + 1): m.add(filt(tv, 'band', [800, 6000]), k * len(tv) / SR, -28)
    m.add(neon_hum(total), 0, -32)
    cam = load(SFX / 'camera_flash.mp3')[:int(1.2 * SR)]
    for f in flashes: m.add(cam, f - 0.05, -8)
    for tt in np.arange(2.4, 5.2, 0.13):
        if RNG.random() < 0.7: m.add(load(SFX / f'cand_v2/T{RNG.integers(1, 4)}_key{RNG.integers(1, 4)}.mp3') if False else bleep(RNG.uniform(500, 900), 0.02) * 0.6, tt, -24)
    for k in ['lens1', 'lens2', 'lens3', 'lens4', 'lens5']: m.add(bleep(1700, 0.05), ev[k], -16); m.add(bleep(2300, 0.05), ev[k] + 0.07, -16)
    m.add(thunder_rec(5, crack=False), ev['rumble'], -8)
    m.add(thunder_rec(4.5), ev['bolt1'] + 0.08, -1); m.add(thunder_rec(4), ev['bolt2'] + 0.06, -3)
    m.add(load(SFX / 'candidates/C5_single_jingle_shake.mp3'), ev['bolt1'] + 0.1, -16)
    m.add(load(SFX / 'listen_dl/switch_off.mp3'), ev['dark'], -6); m.add(load(SFX / 'listen_dl/switch2.mp3'), ev['lights'], -6)
    m.add(like(rec('squeak')[:int(1.6 * SR)], squeak(0.6)), ev['lights'] + 0.15, -12)
    m.add(thump(160, 0.12, 0.8), ev['donutDrop'] + 0.35, -14)
    m.add(rustle(0.4), ev['twitch'], -14); m.add(rustle(0.3), ev['twitch'] + 0.4, -14)
    m.add(boing(0.6), ev['sitUp'], -6)
    m.add(load(SFX / 'listen_dl/bark_kw.mp3'), ev['sitUp'] + 0.08, -5); m.add(like(rec('hoot'), hoot()), ev['sitUp'] + 0.15, -10); m.add(thump(90, 0.2, 0.6), ev['sitUp'] + 0.2, -10)
    m.add(load(SFX / 'candidates/C2_jingle_bell_short.mp3'), ev['peekIn'], -12)
    vo = trim_lead(load(MV / '10_music/vo/yoyo_13_piannidela_keai_liyaoling_v1.wav'))
    m.add(vo, ev['vo'], 0)
    m.add(like(pitch(rec('clink'), 2), clink(3000)), ev['stiletto'] + 0.45, -10)
    m.add(load(SFX / 'cand_v2/S1_stamp.mp3'), ev['stamp'], -2)
    sting = song_cut(float(BARS[32]), float(BARS[32]) + 5.4); sting[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None]
    m.add(sting, ev['sting'], -3)
    m.write('motel', 1.2)
    save_cues('motel', {'flashes': flashes, 'vo': vo_words(vo, ev['vo'])}, ev, total)


BUILDERS = {'bar': build_bar, 'alley': build_alley, 'cellar': build_cellar, 'motel': build_motel}
for name, fn in BUILDERS.items():
    if not ONLY or name in ONLY:
        fn()

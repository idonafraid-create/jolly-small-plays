"""The case file's objects, from codex's transparent PNGs (art/src/cfx_*.png) to what the page loads.

python tools/cf_assets.py        → assets/casefile/obj/<name>.webp (trimmed, at most MAX px), assets/casefile/objects.json

Each object's entry: its size, and where something gets put into it ("slot", measured by hand on the picture: SLOTS):
  photo   — a photo print's picture area (YOYO's frames go there; painted dark like an unexposed print)
  magenta — the magenta box codex left on the composite form / fingerprint card (painted plain card; the drawing / the print)
  window  — the evidence envelope's cellophane window (made see-through but for its glints: the exhibit shows through it)
Slots are x, y, w, h in fractions of the saved picture. Sheets with several separate
objects (tape, clips) are split into <name>_0, _1 … left to right, top to bottom.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art/src'
OUT = ROOT / 'assets/casefile/obj'
MAX = 1400
SPLIT = {'cfx_tape', 'cfx_masking', 'cfx_clips', 'cfx_pen', 'cfx_candle', 'cfx_matchbook'}
FULL = {'cfx_desk'}                                    # full-bleed plates: no trimming, no alpha


def rgba(path):
    im = Image.open(path)
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    if im.mode != 'RGBA' or (a[..., 3] > 250).all():  # came back on green after all: key it
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        green = g - np.maximum(r, b)
        a[..., 3] = 255 * (1 - np.clip((green - 40) / 70, 0, 1))
        a[..., 1] = np.where(green > 0, np.maximum(r, b), g)
    return a


# where things go into an object, measured on codex's picture (source px: x0, y0, x1, y1): a photo's picture area,
# the composite form's and the fingerprint card's magenta box, the envelope's cellophane window
SLOTS = {
    'photo1': ('photo', (180, 130, 1357, 868)), 'photo2': ('photo', (175, 127, 1082, 962)),
    'form': ('magenta', (147, 222, 880, 940)), 'printcard': ('magenta', (92, 258, 1446, 766)),
    'envelope': ('window', (152, 482, 880, 1100)),
}


def fill(a, kind, box):
    """paint over what marked the slot: a dark unexposed print, plain card, or see-through cellophane keeping its glints"""
    x0, y0, x1, y1 = box
    r = a[y0:y1, x0:x1]
    if kind == 'photo': r[..., :3] = (24, 21, 19); r[..., 3] = 255
    elif kind == 'magenta':
        ring = np.concatenate([a[y0 - 14:y0 - 6, x0:x1].reshape(-1, 4), a[y1 + 6:y1 + 14, x0:x1].reshape(-1, 4)])
        r[..., :3] = np.median(ring[ring[:, 3] > 200][:, :3], axis=0); r[..., 3] = 255
    elif kind == 'window':
        lum = r[..., :3].mean(-1)
        glint = np.clip((lum - np.median(lum) - 6) / 45, 0, 1)        # the crinkles' highlights stay, the grey film goes
        r[..., :3] = 250; r[..., 3] = 255 * (0.1 + 0.75 * glint)


def save(a, name, meta, trim=True):
    s = None
    if name in SLOTS:
        kind, box = SLOTS[name]
        fill(a, kind, box)
        s = (kind, box)
    x0 = y0 = 0
    if trim:
        ys, xs = np.nonzero(a[..., 3] > 6)
        y0, y1, x0, x1 = max(0, ys.min() - 4), ys.max() + 5, max(0, xs.min() - 4), xs.max() + 5
        a = a[y0:y1, x0:x1]
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    k = min(1, MAX / max(im.size))
    if k < 1: im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    if s:                                              # the slot in fractions of the saved picture
        kind, (bx0, by0, bx1, by1) = s
        Wc, Hc = a.shape[1], a.shape[0]
        s = {'kind': kind, 'x': (bx0 - x0) / Wc, 'y': (by0 - y0) / Hc, 'w': (bx1 - bx0) / Wc, 'h': (by1 - by0) / Hc}
    OUT.mkdir(parents=True, exist_ok=True)
    if trim: im.save(OUT / f'{name}.webp', quality=90, method=6)
    else: im.convert('RGB').save(OUT / f'{name}.webp', quality=88, method=6)
    meta[name] = {'w': im.width, 'h': im.height, **({'slot': s} if s else {})}
    print(name, im.size, s or '')


if __name__ == '__main__':
    meta = {}
    for p in sorted(SRC.glob('cfx_*.png')):
        job = p.stem
        if job == 'cfx_test': continue
        name = job[4:]
        a = rgba(p)
        if job in FULL: save(np.asarray(Image.open(p).convert('RGBA')).astype(np.float32), name, meta, trim=False); continue
        if job in SPLIT:
            lab, n = ndimage.label(ndimage.binary_dilation(a[..., 3] > 40, iterations=6))
            boxes = sorted([s for s in ndimage.find_objects(lab) if s and (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 3000],
                           key=lambda s: (round(s[0].start / 200), s[1].start))
            for i, s in enumerate(boxes):
                part = a.copy(); keep = np.zeros(a.shape[:2], bool); keep[s] = True
                part[~keep, 3] = 0
                save(part, f'{name}_{i}', meta)
            continue
        save(a, name, meta)
    (ROOT / 'assets/casefile/objects.json').write_text(json.dumps(meta, indent=0), encoding='utf-8')

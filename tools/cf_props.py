"""Case-file props made from codex's objects (run after tools/cf_assets.py, which rewrites objects.json):

python tools/cf_props.py               → assets/casefile/obj/newspaper_front.webp, folder_inside.webp, ground_*.webp, seal.webp, badge.webp (+ objects.json)
python tools/cf_props.py ground badge  → only those steps (any of: newspaper folder ground seal badge)

newspaper_front — the newspaper on Jojo's desk, its top half made the morning edition's front page: the masthead, the
  headline (the pink stiletto, gone in the blackout), a photo of the Jolly bandstand (a frame of the footage, grabbed
  headless and screened like newsprint) and, in the last column, the '200%' scrawl turning up at a third club. The old
  type is lifted off the paper first (its own paper tone, text taken out), then the new type is inked over it.
folder_inside — the leather folder's inside with the raised spine piece taken out: the two halves meet at a fold.
badge — Jojo's detective badge, the way back to the footage / to shut the book written on its enamel (art/src/cfx_badge.png);
  seal — the wax seal tried for it before. Both trimmed, a green screen keyed out if codex could not give a transparent
  background, and kept at 640 px. badge_rim — a line of even width round the badge's outline (its alpha grown by RIM px,
  padded by RIM_PAD all round), for the page to fill gold and glow.
ground_open, ground_shut — the book's shadow on the desk, open (both halves) and shut (the right half): its outline
  blurred four ways (a little all round, tight where it touches, softer and further down-right away from the lamp),
  at half size, padded.
Needs tools/serve.py on 8765 (for the photo). Uses the Windows fonts below.
"""
import base64, io, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OBJ = ROOT / 'assets/casefile/obj'
FONTS = Path('C:/Windows/Fonts')
INK = np.array([34, 28, 22], float)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


# ── the photo: the bandstand a few seconds in (Jojo in the spotlight, Lyly on bass), names off ──
def grab_photo(t=5.0, zoom=1.4, crop=(200, 125)):
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        page = b.new_page(viewport={'width': 1600, 'height': 1000})
        page.goto('http://127.0.0.1:8765/jolly2/v2/index.html?scene=bar')
        page.wait_for_function('window.__sp && window.__sp.built && Object.keys(window.__sp.built).length > 0', timeout=90000)
        page.wait_for_timeout(1500)
        page.evaluate('__sp.built.bar.rt.markers.forEach(m => { m.dy = 99; })')
        at = page.evaluate('''t => { __sp.seek(t); __sp.grab({ t, hud: false }); const ps = __sp.built.bar.rt.people;
            const h = n => ps.find(p => p.name === n).rig.head.matrixWorld.elements; const a = h('JOJO'), c = h('LYLY');
            return [(a[12] + c[12]) / 2, (a[13] + c[13]) / 2, (a[14] + c[14]) / 2]; }''', t)
        url, pts = page.evaluate('([t, at, zoom]) => { const g = __sp.grab({ t, at, zoom, hud: false }); return [g.canvas.toDataURL(), g.pts]; }', [t, at, zoom])
        b.close()
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')
    j, l = pts.get('JOJO'), pts.get('LYLY')
    cx, cy = ((j[0] + l[0]) / 2, (j[1] + l[1]) / 2 + 4) if j and l else (im.width / 2, im.height / 2)
    return im.crop((round(cx - crop[0] / 2), round(cy - crop[1] / 2), round(cx + crop[0] / 2), round(cy + crop[1] / 2)))


# a newspaper halftone: grey levels as dots on a 45° screen (cell px), returned as ink coverage 0–1
def screen(gray, cell=3.3, angle=45):
    h, w = gray.shape
    y, x = np.mgrid[0:h, 0:w].astype(float)
    a = np.radians(angle)
    u, v = (x * np.cos(a) + y * np.sin(a)) / cell, (-x * np.sin(a) + y * np.cos(a)) / cell
    du, dv = u - np.round(u), v - np.round(v)
    d = np.sqrt(du * du + dv * dv) / 0.7071                                 # 0 at a dot's centre, 1 at the cell's corner
    dark = 1 - gray / 255
    return np.clip((dark * 1.08 - d) * 6 + 0.5, 0, 1)


# the paper under a block of type: its tone with the strokes taken out (a max filter lifts the dark type off, a blur
# smooths it back into paper), a little grain on top
def lift_type(rgb, mask):
    out = rgb.copy()
    clean = np.stack([ndimage.gaussian_filter(ndimage.maximum_filter(rgb[..., c], size=9), 2.4) for c in range(3)], -1)
    grain = np.random.default_rng(7).normal(0, 3.2, rgb.shape[:2])[..., None]
    clean = np.clip(clean - 3 + grain, 0, 255)
    m = ndimage.gaussian_filter(mask.astype(float), 2.0)[..., None]
    return out * (1 - m) + clean * m


def ink(rgb, cover, strength=0.94):
    # multiplied, so the paper's own grain shows through; a little uneven, as press ink is
    rough = np.random.default_rng(3).uniform(0.8, 1, cover.shape)
    c = (cover * rough * strength)[..., None]
    return rgb * (1 - c + c * INK / 255)


def type_mask(size, items):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for x, y, text, f, anchor in items:
        d.text((x, y), text, font=f, fill=255, anchor=anchor)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(0.5)), float) / 255


def fit(text, name, width, size):
    while size > 8 and font(name, size).getlength(text) > width: size -= 1
    return font(name, size)


def newspaper():
    src = Image.open(OBJ / 'newspaper.webp').convert('RGBA')
    rgb, alpha = np.asarray(src)[..., :3].astype(float), np.asarray(src)[..., 3]
    W, H = src.size
    clear = np.zeros((H, W), bool)
    clear[26:142, 92:1290] = True                    # the masthead band and the rule under it
    clear[142:304, 92:724] = True                    # the first three columns' tops: the headline goes there
    clear[140:420, 728:1142] = True                  # the photo and its frame
    clear[140:346, 1146:1290] = True                 # the last column's top: the second story
    rgb = lift_type(rgb, clear)

    cx = (92 + 1290) / 2
    mast = font('OLDENGL.TTF', 84)
    small, smallb = font('SCHLBKB.TTF', 13), font('SCHLBKI.TTF', 15)
    h1 = fit('PINK STILETTO SNATCHED', 'FRADMCN.TTF', 622, 70)
    sub = fit("Sax-Man Sleuth's Famous Tie Clip Vanishes Mid-Solo", 'SCHLBKBI.TTF', 622, 24)
    items = [
        (cx, 84, 'The Brooklyn Night Owl', mast, 'ms'),
        (104, 52, 'LATE CITY', small, 'ls'), (104, 70, 'EDITION', small, 'ls'),
        (1278, 52, 'FIVE', small, 'rs'), (1278, 70, 'CENTS', small, 'rs'),
        (cx, 124, 'VOL. CXX . . . No. 301          BROOKLYN, N.Y., SATURDAY, OCTOBER 28, 1961          RAIN, CLEARING BY DAWN', small, 'ms'),
        (408, 214, 'PINK STILETTO SNATCHED', h1, 'ms'),
        (408, 278, 'IN JOLLY CLUB BLACKOUT', h1, 'ms'),
        (408, 300, "Sax-Man Sleuth's Famous Tie Clip Vanishes Mid-Solo", sub, 'ms'),
        (935, 414, 'LAST SEEN: Det. J. Jojo on the Jolly bandstand, 11:40 P.M.', smallb, 'ms'),
    ]
    side = font('FRADMCN.TTF', 27)
    for i, line in enumerate(["'200%'", 'SCRAWL', 'AT THIRD', 'CLUB']): items.append((1218, 178 + i * 27, line, side, 'ms'))
    s2 = font('SCHLBKI.TTF', 12)
    for i, line in enumerate(['Lipstick found', 'again; police', 'say "small,', 'grey, striped"']): items.append((1218, 288 + i * 15, line, s2, 'ms'))
    cover = type_mask((W, H), items)
    # rules: under the masthead (a thick and a thin), round the dateline, under the headline, the photo's frame
    rules = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(rules)
    for y0, y1 in [(98, 101), (104, 105), (132, 135), (138, 139)]: d.rectangle([96, y0, 1286, y1], fill=255)
    d.rectangle([110, 306, 706, 307], fill=255)
    d.rectangle([1170, 268, 1266, 269], fill=255)
    cover = np.maximum(cover, np.asarray(rules, float) / 255)
    rgb = ink(rgb, cover)

    # the photo, screened, in a thin frame
    px, py, pw, ph = 740, 150, 390, 244
    ph_im = grab_photo().convert('L').resize((pw, ph), Image.NEAREST).filter(ImageFilter.GaussianBlur(1.2))
    g = np.asarray(ph_im, float)
    lo, hi = np.percentile(g, [3, 99.5])
    g = np.clip((g - lo) / (hi - lo), 0, 1) ** 0.72 * 240 + 8            # the footage is dark: levels stretched, as a press would
    dots = screen(g)
    box = np.zeros((H, W)); box[py:py + ph, px:px + pw] = dots * 0.92
    frame = np.zeros((H, W)); frame[py - 3:py + ph + 3, px - 3:px + pw + 3] = 1; frame[py:py + ph, px:px + pw] = 0
    rgb = ink(rgb, np.maximum(box, frame * 0.85))

    out = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8), 'RGBA')
    out.save(OBJ / 'newspaper_front.webp', quality=92, method=6)
    return out.size


# ── the folder's inside: both halves of the lining, stretched a touch to close the gap where the spine piece was, meeting
# at a fold (darker into the crease, the lamp's side of it catching a little light) ──
def folder():
    src = Image.open(OBJ / 'folder_leather.webp').convert('RGBA')
    W, H = src.size
    mid, cut0, cut1 = W // 2, 657, 743
    left = src.crop((0, 0, cut0, H)).resize((mid, H), Image.LANCZOS)
    right = src.crop((cut1, 0, W, H)).resize((W - mid, H), Image.LANCZOS)
    out = Image.new('RGBA', (W, H)); out.paste(left, (0, 0)); out.paste(right, (mid, 0))
    a = np.asarray(out).astype(float)
    x = np.arange(W) - mid + 0.5
    shade = 1 - 0.62 * np.exp(-np.abs(x / 7) ** 1.4) - 0.26 * np.exp(-np.abs(x) / 46)
    shade -= np.where(x < 0, 0.08 * np.exp(-np.abs(x) / 30), 0)            # the side turned from the lamp
    shade += np.where(x > 0, 0.07 * np.exp(-((x - 16) / 9) ** 2), 0)       # the far lip of the fold, catching it
    a[..., :3] *= shade[None, :, None]
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').save(OBJ / 'folder_inside.webp', quality=92, method=6)
    return W, H


# ── the book's shadow on the desk: [dx, dy, blur, strength] in half-size px (the book's 1720×1080 is 860×540 here),
# padded by PAD (half-size) all round; the page puts it at -2·PAD board px, twice its size ──
PAD = 80
LAYERS = [(0, 0, 12, 0.32), (1.5, 3, 2.5, 0.88), (6, 12, 10, 0.66), (18, 34, 34, 0.52)]


def ground():
    a = np.asarray(Image.open(OBJ / 'folder_inside.webp').convert('RGBA').resize((860, 540), Image.LANCZOS))[..., 3] / 255
    out = {}
    for name, half in [('ground_open', a), ('ground_shut', np.where(np.arange(860)[None, :] >= 430, a, 0))]:
        base = np.pad(half, PAD)
        keep = np.ones_like(base)
        for dx, dy, blur, k in LAYERS:
            keep *= 1 - k * np.clip(ndimage.gaussian_filter(ndimage.shift(base, (dy, dx), order=1), blur), 0, 1)
        alpha = (1 - keep) * 255
        rgba = np.dstack([np.full_like(alpha, 10), np.full_like(alpha, 6), np.full_like(alpha, 3), alpha]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(OBJ / f'{name}.webp', quality=88, method=6)
        out[name] = (rgba.shape[1], rgba.shape[0])
    return out


def cutout(name):
    im = Image.open(ROOT / f'art/src/cfx_{name}.png').convert('RGBA')
    a = np.asarray(im).astype(float)
    if a[..., 3].min() > 250:                                            # no alpha: key out the chroma green, softly at the edge
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        green = np.clip((g - np.maximum(r, b) - 40) / 50, 0, 1)
        a[..., 3] = 255 * (1 - green)
        a[..., 1] = np.minimum(g, np.maximum(r, b) + 10)                 # no green fringe left on the edge
        im = Image.fromarray(a.astype(np.uint8), 'RGBA')
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    im.thumbnail((640, 640), Image.LANCZOS)
    im.save(OBJ / f'{name}.webp', quality=92, method=6)
    return im.size


RIM, RIM_PAD = 10, 18


def rim(name):
    a = np.asarray(Image.open(OBJ / f'{name}.webp').convert('RGBA'))[..., 3] / 255
    a = np.pad(a, RIM_PAD)
    d = ndimage.distance_transform_edt(a < 0.5)                         # how far each pixel is outside the outline
    line = np.clip(RIM + 0.5 - d, 0, 1)
    out = np.dstack([np.full_like(line, 255), np.full_like(line, 255), np.full_like(line, 255), line * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OBJ / f'{name}_rim.webp', quality=92, method=6)
    return out.shape[1], out.shape[0]


if __name__ == '__main__':
    import sys
    meta_p = ROOT / 'assets/casefile/objects.json'
    meta = json.loads(meta_p.read_text())
    steps = {'newspaper': lambda: [('newspaper_front', newspaper())], 'folder': lambda: [('folder_inside', folder())],
             'ground': lambda: list(ground().items()), 'seal': lambda: [('seal', cutout('seal'))], 'badge': lambda: [('badge', cutout('badge')), ('badge_rim', rim('badge'))]}
    made = [m for k in (sys.argv[1:] or steps) for m in steps[k]()]
    for name, size in made:
        meta[name] = {**meta.get(name, {}), 'w': size[0], 'h': size[1]}
        print(name, size)
    meta_p.write_text(json.dumps(meta, indent=0), encoding="utf-8")

"""YOYO's snapshots for her scrapbook on the back of the case file: one frame of the pixel play per floor, framed on who
she was watching from where she hid (Jojo on the bandstand, Jojo's solo in the alley, Lyly running from the cellar with
the keg, the detective with his opera glasses in 203).

python tools/scrap_snaps.py [scene=t …] → assets/casefile/snap_<scene>.webp (art pixels, no captions); with scene=t only
those floors, at those times
Needs the static server (tools/serve.py on 8765).
"""
import base64, io
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/casefile'
CROP = (180, 118)
# `who`: framed on that head (a little below it, so the body shows); `dy` art px further down
SHOTS = {
    'bar': {'t': 8.0, 'who': 'JOJO', 'zoom': 2.4, 'dy': 16},
    'alley': {'t': 13.0, 'who': 'JOJO', 'zoom': 2.3, 'dy': 16},
    'cellar': {'t': 26.6, 'who': 'LYLY', 'zoom': 2.3, 'dy': 14},
    'motel': {'t': 9.5, 'who': 'JOJO', 'zoom': 2.4, 'dy': 16},
}

import sys
PICK = dict(a.split('=') for a in sys.argv[1:])
for k, v in PICK.items(): SHOTS[k]['t'] = float(v)

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    page.on('pageerror', lambda e: print('pageerror:', e))
    for scene, s in SHOTS.items():
        if PICK and scene not in PICK: continue
        page.goto(f'http://127.0.0.1:8765/jolly2/v2/index.html?scene={scene}')
        page.wait_for_function('window.__sp && window.__sp.built && Object.keys(window.__sp.built).length > 0', timeout=90000)
        page.wait_for_timeout(1500)
        page.evaluate('id => __sp.built[id].rt.markers.forEach(m => { m.dy = 99; })', scene)
        # where the head is in the world at that moment (the play is a pure function of time), then a close frame on it
        at = page.evaluate('''([id, t, who]) => { __sp.seek(t); __sp.grab({ t, hud: false });
            const o = __sp.built[id].rt.people.find(p => p.name === who), e = o.rig.head.matrixWorld.elements; return [e[12], e[13], e[14]]; }''',
            [scene, s['t'], s['who']])
        url, head = page.evaluate('([t, at, zoom, who]) => { const g = __sp.grab({ t, at, zoom, hud: false }); return [g.canvas.toDataURL(), g.pts[who]]; }',
                                  [s['t'], at, s['zoom'], s['who']])
        im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')
        cx, cy = (head[0], head[1] + s['dy']) if head else (im.width // 2, im.height // 2)
        cx, cy = round(cx), round(cy)
        snap = im.crop((cx - CROP[0] // 2, cy - CROP[1] // 2, cx + CROP[0] // 2, cy + CROP[1] // 2))
        p = OUT / f'snap_{scene}.webp'
        snap.save(p, lossless=True)
        print(p, snap.size, at)
    browser.close()

# Headless walk through a comic page (needs tools/serve.py on 8765; clears *.png in outdir first):
#   python tools/comic_shots.py <scene> <outdir> "<step>;;<step>…"
# a step is "go|N|waitMs[|name]" (go to stop N, wait, screenshot as name), "js|code|waitMs[|name]" or "cam|x,y,s|waitMs|name";
# prints the page's script errors and where the reader ended up
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
scene, out, steps = sys.argv[1], Path(sys.argv[2]), sys.argv[3].split(';;')
out.mkdir(parents=True, exist_ok=True)
for f in out.glob('*.png'): f.unlink()
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--autoplay-policy=no-user-gesture-required'])
    page = b.new_page(viewport={'width': 1280, 'height': 860})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    page.goto(f'http://127.0.0.1:8765/jolly2/v2/index.html?scene={scene}')
    page.wait_for_function(f'window.__sp && window.__sp.comic.pages.{scene}', timeout=120000)
    page.wait_for_timeout(1500)
    page.evaluate(f'__sp.seek(__sp.built.{scene}.total - 0.5)')
    page.click('#read')
    page.wait_for_timeout(5500)
    for st in steps:
        if not st: continue
        kind, arg, wait, *name = st.split('|', 3)
        if kind == 'go': page.evaluate(f'__sp.comic.go({arg})')
        elif kind == 'js': page.evaluate(arg)
        elif kind == 'cam':
            x, y, s = arg.split(','); page.evaluate(f'(() => {{ const c = __sp.comic; c.endTween(); c.cam = {{ x: {x}, y: {y}, s: {s}, r: 0 }}; c.applyCam(); }})()')
        page.wait_for_timeout(int(wait))
        if name: page.screenshot(path=str(out / f'{name[0]}.png'))
    print(json.dumps({'errors': errs[:8], 'state': page.evaluate('({ idx: __sp.comic.idx, page: __sp.comic.page.id })')}))
    b.close()

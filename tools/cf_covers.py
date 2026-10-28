"""Each issue's cover as a picture, for the copy filed in the case file: the comic's own cover (mast, art, CAM box with a
frame of the footage, wear), rendered headless and cut out along its worn edge.

python tools/cf_covers.py        → assets/casefile/comic_<scene>.webp   (needs tools/serve.py on 8765)
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/casefile'
CAM_T = {'bar': 12.0, 'alley': 18.2, 'cellar': 21.0, 'motel': 25.0}     # the footage in each cover's CAM box

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--ignore-gpu-blocklist', '--enable-gpu-rasterization'])
    page = b.new_page(viewport={'width': 1200, 'height': 1400})
    page.on('pageerror', lambda e: print('pageerror:', e))
    for scene, t in CAM_T.items():
        page.goto(f'http://127.0.0.1:8765/jolly2/v2/index.html?scene={scene}')
        page.wait_for_function(f'window.__sp && window.__sp.comic.pages.{scene} && window.__sp.comic.pages.{scene}.warm', timeout=120000)
        page.evaluate('''([id, t]) => {
          const c = __sp.comic, p = c.pages[id];
          c.page = p;
          c.board.replaceChildren(p.shadow, p.root, ...p.turnShade, p.coverShadow, p.cover);
          c.shut(p);
          c.bakePixel(p.coverBox, c.grab({ t }));
          c.layer.classList.remove('ghost'); c.layer.classList.add('on');
          document.querySelector('.comic-hud').style.display = 'none';
          c.cam = { ...c.fitCam(p.coverStop), r: 0 }; c.applyCam();
        }''', [scene, t])
        page.wait_for_timeout(1200)
        out = OUT / f'comic_{scene}.png'
        page.locator('.comic .cover .face.front').screenshot(path=str(out), omit_background=True)
        from PIL import Image
        im = Image.open(out); im.save(out.with_suffix('.webp'), quality=90, method=6); out.unlink()
        print(out.with_suffix('.webp'), im.size)
    b.close()

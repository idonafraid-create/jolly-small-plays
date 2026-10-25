# Frame gaps while entering each comic from the pixel play (real GPU through D3D11; needs tools/serve.py on 8765):
#   python tools/entry_perf.py cellar bar motel alley
import sys, json
from playwright.sync_api import sync_playwright
JS = """async () => {
  const sp = window.__sp; sp.seek(sp.built[sp.cur].total - 3); await new Promise(r => setTimeout(r, 400));
  const log = []; let last = performance.now(), t0 = last, go = true;
  const tick = n => { log.push([Math.round(n - t0), Math.round(n - last)]); last = n; if (go) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); document.getElementById('read').click();
  await new Promise(r => setTimeout(r, 4600)); go = false;
  const g = log.map(e => e[1]).sort((x, y) => y - x);
  return [log.length, g.slice(0, 5).join('/'), log.filter(e => e[1] > 34).map(e => e[0] + ':' + e[1]).join(' ')];
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy'])
    page = b.new_page(viewport={'width': 1440, 'height': 900})
    print(page.evaluate("() => { const g = document.createElement('canvas').getContext('webgl'); const d = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(d.UNMASKED_RENDERER_WEBGL); }"))
    for scene in sys.argv[1:]:
        page.goto(f'http://127.0.0.1:8765/jolly2/v2/index.html?scene={scene}')
        page.wait_for_function(f'window.__sp && window.__sp.comic.pages.{scene} && window.__sp.comic.pages.{scene}.warm', timeout=120000)
        page.evaluate(f'window.__sp.cur = "{scene}"')
        page.wait_for_timeout(1200)
        print(scene, json.dumps(page.evaluate(JS)))
    b.close()

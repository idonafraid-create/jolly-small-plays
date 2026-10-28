# Headless walk through the case file (needs tools/serve.py on 8765; real Chrome, for the H.264 clips); clears *.png in outdir:
#   python tools/case_shots.py <outdir> '<state json | ->' "<step>;;<step>…" [WxH]
# state = {"v1": [found exhibit ids], "v2": {what jolly-case-v2 holds}}, put in localStorage first; a step is "js|code|waitMs[|name]"
# (code runs as an async function body: what it returns is printed; no "|" in it), "key|Key|ms", "move|x,y|ms" or "click|x,y|ms".
# Prints the page's script errors (the one 404 per page load is the favicon).
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
out, state, steps = Path(sys.argv[1]), sys.argv[2], sys.argv[3].split(';;')
W, H = (int(x) for x in (sys.argv[4] if len(sys.argv) > 4 else '1280x860').split('x'))
out.mkdir(parents=True, exist_ok=True)
for f in out.glob('*.png'): f.unlink()
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', args=['--disable-features=CalculateNativeWinOcclusion', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': W, 'height': H})
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('response', lambda r: r.status >= 400 and errs.append(f'{r.status} {r.url}'))
    page.on('console', lambda m: (m.type == 'error' and errs.append(m.text)) or (m.type == 'log' and m.text.startswith('@') and print(m.text)))
    page.goto('http://127.0.0.1:8765/jolly2/v2/index.html?scene=bar')
    if state != '-':
        s = json.loads(state)
        page.evaluate('s => { localStorage.setItem("jolly-case-v1", JSON.stringify(s.v1 || [])); localStorage.setItem("jolly-case-v2", JSON.stringify(s.v2 || {})); }', s)
        page.reload()
    page.wait_for_function('window.__sp && window.__sp.casefile', timeout=120000)
    page.wait_for_timeout(1200)
    for st in steps:
        st = st.strip()
        if not st: continue
        kind, arg, wait, *name = st.split('|', 3)
        if kind == 'js':
            r = page.evaluate(f'(async () => {{ {arg} }})()')
            if r is not None: print('=>', json.dumps(r)[:600])
        elif kind == 'click':
            x, y = arg.split(','); page.mouse.click(float(x), float(y))
        elif kind == 'move':
            x, y = arg.split(','); page.mouse.move(float(x), float(y), steps=8)
        elif kind == 'key':
            page.keyboard.press(arg)
        page.wait_for_timeout(int(wait))
        if name: page.screenshot(path=str(out / f'{name[0]}.png'))
    print(json.dumps({'errors': errs[:10]}))
    b.close()

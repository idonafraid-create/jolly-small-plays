"""Deterministic frame capture for the Small Plays anthology.

python tools/capture.py stills bar 3 12.5 24.8      → out/stills/bar_t03.00.png …   (480×270 ×4 nearest)
python tools/capture.py video bar                   → out/bar.mp4 (1920×1080, 60 fps, with sound)
Needs the static server from .claude/launch.json (http://127.0.0.1:8765).
"""
import base64, subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out'
FPS, SCALE = 60, 4


def frames(scene, times, dest, upscale):
    dest.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        page = browser.new_page(viewport={'width': 2000, 'height': 1200})
        page.on('console', lambda m: m.type == 'error' and '404' not in m.text and print('console:', m.text))
        page.on('pageerror', lambda e: print('pageerror:', e))
        page.goto(f'http://127.0.0.1:8765/jolly2/v2/index.html?capture&scene={scene}')
        page.wait_for_function('window.__renderAt !== undefined', timeout=90000)
        page.evaluate('__renderAt(0)')
        paths = []
        for i, t in enumerate(times):
            data = page.evaluate(f'__renderAt({t:.5f})')
            p = dest / (f'{scene}_t{t:05.2f}.png' if upscale else f'f{i:05d}.png')
            p.write_bytes(base64.b64decode(data.split(',', 1)[1]))
            paths.append(p)
            if not upscale and i % 300 == 0: print(f'  {scene} frame {i}/{len(times)}', flush=True)
        total = page.evaluate('window.__total')
        browser.close()
    if upscale:
        for p in paths:
            raw = p.with_name(p.stem + '_raw.png'); p.replace(raw)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-vf', f'scale=iw*{SCALE}:ih*{SCALE}:flags=neighbor', str(p)], check=True)
            raw.unlink()
    return paths, total


if __name__ == '__main__':
    mode, scene = sys.argv[1], sys.argv[2]
    if mode == 'stills':
        for p in frames(scene, [float(a) for a in sys.argv[3:]], OUT / 'stills', True)[0]: print(p)
    else:
        import json
        total = json.loads((ROOT / f'assets/{scene}.json').read_text(encoding='utf-8'))['total']
        fdir = OUT / f'frames_{scene}'
        for old in fdir.glob('f*.png'): old.unlink()
        frames(scene, [i / FPS for i in range(int(total * FPS))], fdir, False)
        mp4 = OUT / f'{scene}.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', str(fdir / 'f%05d.png'), '-i', str(ROOT / f'assets/{scene}.wav'),
                        '-vf', f'scale=iw*{SCALE}:ih*{SCALE}:flags=neighbor', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', str(mp4)], check=True)
        for f in fdir.glob('f*.png'): f.unlink()
        fdir.rmdir()
        print(mp4)

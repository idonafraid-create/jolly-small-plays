"""The comic's and the plays' recorded sound effects: cut, faded and levelled from CC0 sources into assets/sfx/<name>.mp3,
with assets/sfx/CREDITS.md. Sources: art/src/sfx (freesound previews fetched for this project, see manifest.json there)
and the JOLLY MV sound library (D:/ClaudeAbout/JOLLY MV/10_music/sfx, CC0, credited there).

python tools/sfx_prep.py
"""
import io, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
DL = ROOT / 'art/src/sfx'
MV = Path('D:/ClaudeAbout/JOLLY MV/10_music/sfx')
OUT = ROOT / 'assets/sfx'
SR = 44100

# name: (source, start s, end s, peak dB, what for). Fades are short and automatic.
CUTS = {
    'page':     (DL / 'page_2.mp3', 0.25, 1.20, -3, 'the cover turns'),
    'swish':    (DL / 'swish_3.mp3', 0.20, 1.20, -6, 'the camera moves to a panel'),
    'whip':     (DL / 'swish_2.mp3', 0.00, 0.26, -3, 'a whip pan'),
    'pop':      (DL / 'pop_1.mp3', 0.03, 0.42, -4, 'a balloon pops up'),
    'thud':     (DL / 'thud_1.mp3', 0.58, 1.05, -2, 'sound-effect lettering lands'),
    'press':    (DL / 'press_1.mp3', 0.00, 0.95, -4, 'the press prints the frame'),
    'squeak':   (DL / 'squeak_1.mp3', 0.10, 2.10, -6, 'lipstick on the mirror'),
    'crack':    (DL / 'thunder_1.mp3', 0.00, 0.34, -1, 'the lightning cracks'),
    'rumble':   (DL / 'thunder_2.mp3', 0.50, 5.00, -3, 'thunder rolls'),
    'horn':     (DL / 'whistle_1.mp3', 0.05, 1.85, -3, 'the freight\'s horn'),
    'toots':    (DL / 'whistle_2.mp3', 0.04, 0.95, -3, 'the last train\'s horn'),
    'train':    (DL / 'trainpass_2.mp3', 0.40, 12.25, -3, 'a train goes by'),
    'rain':     (DL / 'rain_1.mp3', 0.20, 9.10, -6, 'alley rain (a loop)'),
    'hiss':     (DL / 'hiss_2.mp3', 0.00, 1.85, -4, 'the alley cats hiss'),
    'oink':     (DL / 'oink_1.mp3', 0.74, 1.58, -3, 'Mr. Hamm barks'),
    'caw':      (DL / 'caw_2.mp3', 0.10, 0.82, -3, 'Crowley barks'),
    'hoot':     (DL / 'hoot_2.mp3', 0.68, 1.06, -3, 'Prof. Hoot barks'),
    'meow':     (DL / 'meow_1.mp3', 0.04, 1.30, -4, 'Siam barks'),
    'clink':    (DL / 'clink_1.mp3', 0.00, 0.60, -4, 'the martini is caught'),
    'drip':     (DL / 'drip_2.mp3', 0.30, 0.62, -6, 'a cellar drip'),
    'creak':    (DL / 'creak_2.mp3', 0.00, 1.25, -6, 'a door, a stair'),
    'ting':     (MV / 'candidates/C3_single_bell.mp3', 0.0, 0.39, -4, 'a little bell'),
    'stamp':    (MV / 'cand_v2/S1_stamp.mp3', 0.0, 1.20, -1, 'the rubber stamp'),
    'click':    (MV / 'listen_dl/switch_off.mp3', 0.0, 0.60, -3, 'lights out'),
    'lights':   (MV / 'listen_dl/switch2.mp3', 0.0, 0.60, -3, 'lights on'),
    'flash':    (MV / 'camera_flash.mp3', 0.0, 1.60, -3, 'Hootsby\'s flashbulb'),
    'bark':     (MV / 'listen_dl/bark_sj2.mp3', 0.0, 0.70, -3, 'a bark'),
    'purr':     (MV / 'listen_dl/purr_short.mp3', 0.0, 1.60, -8, 'YOYO purrs'),
}
# credits for the JOLLY MV library files (from its CREDITS.md / candidates/README.md)
MV_CREDITS = {
    'C3_single_bell.mp3': ('Single Bell 2.wav', 'connersaw8', 'https://freesound.org/people/connersaw8/sounds/125145'),
    'S1_stamp.mp3': ('Stamp', 'kermite607', 'https://freesound.org/people/kermite607/sounds/362624'),
    'switch_off.mp3': ('Light Switch Turn Off Sound', 'ChrisTutorials', 'https://freesound.org/people/ChrisTutorials/sounds/440499'),
    'switch2.mp3': ('Light Switch 2.wav', 'RutgerMuller', 'https://freesound.org/people/RutgerMuller/sounds/51157'),
    'camera_flash.mp3': ('Vintage Camera Flash Powder and Shutter', 'Werra', 'https://freesound.org/people/Werra/sounds/232130'),
    'bark_sj2.mp3': ('Dog Barking Single 2.wav', 'SpaceJoe', 'https://freesound.org/people/SpaceJoe/sounds/483180'),
    'purr_short.mp3': ('Cat Purr', 'Veridiansunrise', 'https://freesound.org/people/Veridiansunrise/sounds/337200'),
}


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'wav', '-'], capture_output=True, check=True).stdout
    return sf.read(io.BytesIO(raw))[0]


def cut(x, a, b, peak_db, loop=False):
    y = x[int(a * SR):int(b * SR)].copy()
    f = int(0.006 * SR)                               # click-free edges; loops cross-fade their seam instead
    if loop:
        n = int(0.4 * SR); k = np.linspace(0, 1, n)
        y[:n] = y[:n] * k + y[-n:] * (1 - k); y = y[:-n]
    else:
        y[:f] *= np.linspace(0, 1, f); t = min(len(y) // 3, int(0.08 * SR)); y[-t:] *= np.linspace(1, 0, t) ** 2
    return y / (np.abs(y).max() + 1e-9) * 10 ** (peak_db / 20)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {m['file']: m for m in json.loads((DL / 'manifest.json').read_text(encoding='utf-8'))}
    rows = []
    for name, (src, a, b, pk, use) in CUTS.items():
        y = cut(load(src), a, b, pk, loop=name == 'rain')
        wav = io.BytesIO(); sf.write(wav, y, SR, format='WAV', subtype='PCM_16')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'wav', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '96k', str(OUT / f'{name}.mp3')], input=wav.getvalue(), check=True)
        if src.parent == DL or src.parent.parent == DL:
            m = manifest[src.name]; rows.append((name, use, m['title'], m['creator'], m['page']))
        else:
            t, c, page = MV_CREDITS[src.name]; rows.append((name, use, t, c, page))
        print(f'{name:8} {len(y) / SR:5.2f}s  {(OUT / f"{name}.mp3").stat().st_size // 1024:3} KB  ← {src.name}')
    lines = ['# Sound effects', '', 'All CC0 1.0 (public domain dedication), from freesound.org (high-quality MP3 previews, found through Openverse). '
             'Cut, faded and levelled by `tools/sfx_prep.py`. No attribution is required; the sources are listed anyway.', '',
             '| File | Used for | Original title | Author | Source |', '| --- | --- | --- | --- | --- |']
    lines += [f'| `{n}.mp3` | {u} | {t} | {c} | {p} |' for n, u, t, c, p in rows]
    (OUT / 'CREDITS.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

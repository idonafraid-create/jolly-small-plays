"""Cover cast strip: crop each character's head from the comic model sheets, key out the sheet's paper colour
(flood fill from the edges, so white fur inside the ink outlines survives) and set it on the character's own colour.

python tools/heads.py <issue>  → assets/comic/<issue>/heads.webp (7 × 220 px squares, in cover order)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art/src'
S = 220
# (sheet, centre x, centre y, crop size, background ('sil:#rrggbb' for a black silhouette)[, key tolerance: pale-pink characters need a tight one])
# backgrounds are full-strength: the print pass turns anything paler into a sparse screen of dots
LEADS = {
    'jojo': ('sheet_leads', 512, 205, 350, '#e8414f'),     # coral
    'lyly': ('sheet_leads', 1212, 235, 400, '#9fd10f'),    # lime
    'yoyo': ('sheet_leads', 1385, 560, 270, '#d81f6a'),    # hot pink
}
ISSUES = {
  'motel': [
    LEADS['jojo'], LEADS['lyly'], LEADS['yoyo'],
    ('sheet_support', 458, 178, 200, '#1f9fd8', 9),   # Mr. Bunny · cyan
    ('sheet_support', 712, 205, 230, '#ffc400'),   # Hootsby · yellow
    ('sheet_support', 1000, 250, 175, '#ee6c16'),  # Mr. Slowe · orange
    ('sheet_support', 1402, 200, 230, '#2fb873', 9),  # Mrs. Fluff · mint
  ],
  'bar': [
    ('sheet_band', 505, 255, 330, '#e8414f'),      # Jojo (band) · coral
    ('sheet_band', 1030, 290, 340, '#9fd10f'),     # Lyly (band) · lime
    ('sheet_club', 380, 230, 270, '#1f9fd8', 5),  # Madame Lapin · cyan (white fur: a tight key)
    ('sheet_club', 185, 320, 190, '#ffc400'),      # Felix · yellow
    ('sheet_club', 645, 285, 260, '#ee6c16'),      # Walter · orange
    ('sheet_club', 893, 452, 150, '#2fb873'),      # Callie · mint
    ('sheet_cellar', 1340, 345, 210, 'sil:#d81f6a:0.38,0.5,0.6,0.52'),   # ??? (YOYO: in No. 1 only her eyes were seen) · black, two pale eyes, on hot pink
  ],
  'alley': [
    ('sheet_band', 505, 255, 330, '#e8414f'),      # Jojo (band) · coral
    ('sheet_band', 1030, 290, 340, '#9fd10f'),     # Lyly (band) · lime
    LEADS['yoyo'],
    ('sheet_alley', 175, 185, 270, '#1f9fd8'),     # Tubbs · cyan
    ('sheet_alley', 450, 180, 260, '#ffc400'),     # Patch · yellow
    ('sheet_alley', 690, 195, 250, '#ee6c16', 4),  # Ghost · orange (white fur: a tight key)
    ('sheet_alley', 965, 320, 290, '#2fb873'),     # Old Blue · mint
  ],
  'cellar': [
    LEADS['lyly'], LEADS['yoyo'],
    ('sheet_cellar', 245, 560, 420, '#ffc400'),    # The Thing · yellow
    ('sheet_cellar', 533, 452, 200, '#ee6c16'),    # Brother Nibble · orange
    ('sheet_cellar', 659, 528, 200, '#1f9fd8'),    # Sister Crumb · cyan
    ('sheet_cellar', 819, 508, 180, '#2fb873'),    # Brother Squeak · mint
    ('sheet_cellar', 928, 606, 160, '#e8414f'),    # The Young One · coral
  ],
}


def keyed(crop, tol=34, paper=None):
    """paper → transparent: flood-fill from every edge pixel that is paper-coloured"""
    rgb = crop.convert('RGB')
    paper = paper or rgb.getpixel((2, 2))
    mark = (255, 0, 255)
    near = lambda c: sum(abs(a - b) for a, b in zip(c, paper)) < tol * 3
    w, h = rgb.size
    for x, y in [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)] + [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]:
        if near(rgb.getpixel((x, y))):
            ImageDraw.floodfill(rgb, (x, y), mark, thresh=tol)
    out = crop.convert('RGBA')
    px, mp = out.load(), rgb.load()
    for y in range(h):
        for x in range(w):
            if mp[x, y] == mark: px[x, y] = (0, 0, 0, 0)
    return out


issue = sys.argv[1] if len(sys.argv) > 1 else 'motel'
HEADS = ISSUES[issue]
strip = Image.new('RGB', (S * len(HEADS), S))
sheets = {}
for i, (name, cx, cy, size, bg, *tol) in enumerate(HEADS):
    sheet = sheets.setdefault(name, Image.open(SRC / f'{name}.png'))
    head = keyed(sheet.crop((cx - size // 2, cy - size // 2, cx + size // 2, cy + size // 2)), *(tol or [34]), paper=sheet.convert('RGB').getpixel((4, 4))).resize((S, S), Image.LANCZOS)     # keyed on the sheet's own paper colour
    if bg.startswith('sil:'):                       # a mystery guest: the head as a solid black silhouette ('sil:#bg:ex,ey,ex,ey' adds two pale eyes)
        bg, *eyes = bg[4:].split(':'); a = head.getchannel('A'); head = Image.new('RGBA', head.size, (29, 26, 28, 255)); head.putalpha(a)
        if eyes:
            e = [float(v) * S for v in eyes[0].split(',')]; d = ImageDraw.Draw(head)
            for x, y in zip(e[::2], e[1::2]): d.ellipse((x - 11, y - 8, x + 11, y + 8), fill=(207, 232, 255, 255))
    tile = Image.new('RGBA', (S, S), bg)
    tile.alpha_composite(head)
    strip.paste(tile.convert('RGB'), (i * S, 0))
out = ROOT / f'assets/comic/{issue}/heads.webp'
strip.save(out, 'WEBP', quality=90)
print(out, strip.size)

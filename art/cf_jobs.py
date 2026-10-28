# The case file's objects for codex: one prompt per object (art/prompts/<job>.txt, filled with the CFSTYLE / CFCUT blocks),
# and five queues to run them side by side (tools/cfq0.sh … cfq4.sh). Each object comes back as its own transparent PNG.
# usage: python art/cf_jobs.py
from pathlib import Path

HERE = Path(__file__).resolve().parent
P = HERE / 'prompts'
L, PT, SQ = 'LANDSCAPE, aspect ratio 3:2 (for example 1536x1024).', 'PORTRAIT, aspect ratio 2:3 (for example 1024x1536).', 'SQUARE, 1024x1024.'
REF_L = "Attached reference: Image 1 = the comic's LEAD CHARACTER MODEL SHEET; use it only for the colour and shape of this prop (draw no characters).\n\n"
REF_B = "Attached reference: Image 1 = the BAND MODEL SHEET; use it only for the colour and shape of this prop (draw no characters).\n\n"
SHEET = ("ONE single blank sheet of old letter-size typing paper, portrait, lying flat and filling most of the picture: ivory gone yellow with age, "
         "darker tanned edges, faint foxing, folded in thirds long ago (two faint horizontal creases), a couple of tiny edge tears; ")

# name: (task, size, reference sheet or None, isolated cut-out?)
JOBS = {
    # the desk and the folder
    'cfx_desk': ("TASK: a detective's desk top seen from directly above, filling the WHOLE picture edge to edge (this one is NOT isolated and NOT transparent): dark, polished mahogany planks with scratches, worn varnish and faint old cup rings; a large dark-green leather desk blotter pad with darker leather corner pieces and a thin gold tooled border covering the middle two thirds. EVERYTHING IS EMPTY: no objects at all on the blotter or the desk. A warm lamp from the upper left: a soft pool of light on the upper-left of the blotter, the bottom-right corner sinking into deep brown shadow.", L, None, False),
    'cfx_folder_open': ("TASK: an OPEN, EMPTY, well-worn MANILA CASE FOLDER lying flat, both halves open side by side, the vertical centre crease (the spine) EXACTLY in the middle of the picture, each half a little taller than wide; aged manila card: darker handled edges, scuffed corners, a few creases, a faint coffee ring on the left half, an amber tape repair on one corner; the right half has a shallow pocket flap across its bottom quarter. No papers in it.", L, None, True),
    'cfx_cover': ("TASK: a CLOSED manila case folder, its FRONT cover only, lying flat, filling the picture top to bottom: heavily handled, darker edges, softened scuffed corners, creases, a coffee ring near the bottom right, an amber tape repair at the top-left corner; a BLANK cream gummed paper label stuck near the top (empty); two round dark-red fibre string-tie buttons with brass rivets near the right edge, one above the other, WITHOUT any string.", PT, None, True),
    # the four field reports, each sheet aged by its own floor
    'cfx_sheet_bar': (f"TASK: {SHEET}plus a sticky round cocktail-glass ring stain near the bottom right and a faint smudge of red lipstick on the top-right corner.", PT, None, True),
    'cfx_sheet_alley': (f"TASK: {SHEET}plus rain: dried raindrop spots, a water tide line along the bottom edge, the paper a little wavy from getting wet, and one small grubby wet cat paw print near the bottom left.", PT, None, True),
    'cfx_sheet_cellar': (f"TASK: {SHEET}plus cellar damp: a greyish-green mildew bloom in the bottom-left corner, two drips of white candle wax hardened on the paper, a smear of dust.", PT, None, True),
    'cfx_sheet_motel': (f"TASK: {SHEET}plus a pink frosting fingerprint smudge and a little dusting of powdered donut sugar near the right edge, a small cigarette burn hole, a staple hole at the top-left corner.", PT, None, True),
    # the left flap
    'cfx_graph': ("TASK: ONE sheet of old pale-green GRAPH PAPER, landscape, aged and creased, on which someone has drawn carefully in pencil and black ink a CROSS-SECTION of a three-storey building: TOP floor a small hotel room with a bed and a window in its RIGHT wall, a zig-zag iron FIRE ESCAPE on the outside of that right wall going down to the street; MIDDLE floor a nightclub with a small raised stage on the right and a coat-check counter with coats on the left; BELOW GROUND a cellar with a wooden staircase on the left, barrels, and a round drain grate in the floor; to the RIGHT of the building at street level an alley with a manhole cover, a chain-link fence and railway tracks, and a storm-drain pipe drawn underground from the manhole to the cellar drain. A few light watercolour washes. NO labels, NO writing.", L, None, True),
    'cfx_form': ("TASK: ONE old police-department form card, portrait, off-white card stock aged and a little stained, printed in faded black ink: a thick double border, in the upper part a LARGE square frame whose inside is filled with flat pure MAGENTA (#FF00FF) (a drawing goes there later), and below it six empty ruled lines each with a short blank label box at its left, a small blank box in the top-right corner. No printed words: every field blank.", PT, None, True),
    # photos and paperwork
    'cfx_photo1': ("TASK: ONE vintage black-and-white photo print with a white DECKLED (wavy-cut) border, landscape 3:2, one corner slightly curled, aged ivory border with a faint thumbprint; the PICTURE AREA inside the border is a perfectly flat, uniform mid grey (#808080) with nothing in it.", L, None, True),
    'cfx_photo2': ("TASK: ONE old square instant-camera print with a wider bottom border, the border yellowed with a crease and a thumbprint; the square PICTURE AREA is a perfectly flat, uniform mid grey (#808080) with nothing in it.", SQ, None, True),
    'cfx_envelope': ("TASK: ONE small manila EVIDENCE ENVELOPE, portrait, with a large rectangular clear cellophane WINDOW in its middle: the window is EMPTY and see-through (transparent, nothing behind it, only a faint glossy sheen and crinkle on the cellophane); a thick red printed band across the top (blank), blank ruled write-on lines below the window; the flap at the top folded over and sealed with a strip of red evidence tape; aged and creased.", PT, None, True),
    'cfx_printcard': ("TASK: ONE white 1950s FINGERPRINT CARD, landscape, slightly yellowed card stock with faded black printed ruled boxes (blank, no words) and one LARGE box in the middle filled with flat pure MAGENTA (#FF00FF).", L, None, True),
    'cfx_tag': ("TASK: ONE manila shipping tag with a reinforced round eyelet and a loop of thin white string through it, blank, slightly bent and grubby.", SQ, None, True),
    'cfx_note': ("TASK: ONE page torn out of a small spiral notebook, portrait, faint blue ruled lines and a red margin line, ragged torn holes along the left edge, a little crumpled, blank.", PT, None, True),
    'cfx_clipping': ("TASK: ONE torn-out newspaper clipping, yellowed newsprint, a short column of tiny unreadable grey print (no legible characters) and a small grainy halftone photo of a nightclub stage, ragged torn edges.", SQ, None, True),
    'cfx_tape': ("TASK: FIVE separate strips of old clear cellophane tape gone amber, different lengths, torn ends, slightly wrinkled, laid well apart in a loose grid (none touching).", L, None, True),
    'cfx_masking': ("TASK: THREE separate strips of beige masking tape with torn ends, laid well apart (none touching).", L, None, True),
    'cfx_clips': ("TASK: SEPARATE small office items laid well apart in a neat grid (none touching): two slightly rusty steel paper clips, one black binder clip, two red-headed push pins, one brass split-pin paper fastener.", L, None, True),
    # the desk around the folder
    'cfx_lamp': ("TASK: a green glass-shaded brass BANKER'S DESK LAMP seen from directly above: the long green glass shade and the round weighted brass base, its brass pull chain hanging.", SQ, None, True),
    'cfx_typewriter': ("TASK: a black 1950s portable TYPEWRITER seen from directly above, a blank sheet of paper standing in its roller, round keys.", SQ, None, True),
    'cfx_coffee': ("TASK: a thick white diner COFFEE CUP on its saucer, half full of black coffee, a teaspoon on the saucer, seen from directly above.", SQ, None, True),
    'cfx_ashtray': ("TASK: a heavy round cut-glass ASHTRAY with a half-smoked cigar resting in its notch and a little grey ash, seen from directly above.", SQ, None, True),
    'cfx_pen': ("TASK: a black FOUNTAIN PEN with gold trim and its cap lying beside it, and a small square glass INK BOTTLE with a little blue-black ink, seen from directly above, a few inches apart.", L, None, True),
    'cfx_magnifier': ("TASK: a brass MAGNIFYING GLASS with a turned wooden handle lying flat; the lens clear and see-through (transparent where the lens is, with only a glint).", L, None, True),
    'cfx_keys': ("TASK: a small ring of old brass and steel KEYS with a long brass hotel key fob (blank) attached.", SQ, None, True),
    'cfx_hat': (REF_B + "TASK: Jojo's flat grey PORKPIE HAT with a black band, as on Image 1, seen from directly above, lying on its brim.", SQ, 'sheet_band.png', True),
    'cfx_phone': ("TASK: a black 1950s rotary DESK TELEPHONE seen from directly above, the receiver on its cradle, a coiled cord.", SQ, None, True),
    'cfx_newspaper': ("TASK: a folded broadsheet NEWSPAPER, yellowed, columns of tiny unreadable grey print (no legible characters) and a grainy halftone photo, seen from directly above.", L, None, True),
    'cfx_glasses': (REF_L + "TASK: Jojo's long-handled GOLD OPERA GLASSES (a lorgnette: two round lenses side by side on one long ornate gold handle), lying flat, the lenses glinting.", L, 'sheet_leads.png', True),
    'cfx_matchbook': ("TASK: a 1950s nightclub MATCHBOOK, closed, cream card with a pink and black art-deco martini-glass motif (no letters), a brown striker strip, plus two loose paper matches lying beside it.", SQ, None, True),
    'cfx_brush': ("TASK: a FINGERPRINT POWDER BRUSH: a fat, fluffy round head of fine dark-grey fibreglass bristles dusted with grey powder, a slim black handle with a brass ferrule, lying diagonally.", L, None, True),
    'cfx_marker': ("TASK: a red CHINA MARKER (a paper-wrapped grease pencil with its spiral peel string half unwound and a blunt red wax tip), lying diagonally.", L, None, True),
    'cfx_pencil': ("TASK: a yellow hexagonal HB PENCIL, sharpened, pink eraser in a brass ferrule, a few bite marks, lying diagonally.", L, None, True),
    # the exhibits
    'cfx_ev_ribbon': (REF_L + "TASK: YOYO's big WINE-RED VELVET HAIR BOW (as on Image 1), dropped and a little crushed: two plump loops, a knotted centre, two short tails with V-cut ends, rich velvet sheen, one loose thread.", L, 'sheet_leads.png', True),
    'cfx_ev_bell': (REF_L + "TASK: a small round BRASS JINGLE BELL from a cat's collar (a slot across its lower half ending in a round hole at each end, a little loop on top), drawn large, with a short cut piece of wine-red ribbon through its loop; a tiny dent and a scratch.", SQ, 'sheet_leads.png', True),
    'cfx_ev_lipstick': ("TASK: a vintage 1950s LIPSTICK: the ribbed gold metal tube lying on its side, its gold cap off beside it, the bright crimson bullet twisted up and worn to a slant, a smear of red on the gold rim.", L, None, True),
    'cfx_ev_clip': (REF_B + "TASK: Jojo's PINK STILETTO TIE CLIP (as on Image 1), drawn large: a gold tie-clip bar whose front carries a small glossy PINK ENAMEL HIGH-HEEL SHOE (a 1950s stiletto pump), the gold bar slightly bent from being yanked off a tie.", L, 'sheet_band.png', True),
    # one or two things from each floor
    'cfx_napkin': ("TASK: a white cocktail NAPKIN with a scalloped edge, a little crumpled, with a red LIPSTICK KISS print on it.", SQ, None, True),
    'cfx_ticket': ("TASK: a torn admission TICKET STUB, cream card with a red border and a perforated torn edge, blank.", L, None, True),
    'cfx_waybill': ("TASK: a torn scrap of an old railroad freight WAYBILL, yellowed, printed blank boxes in faded blue, rain-spotted, no legible characters.", L, None, True),
    'cfx_candle': ("TASK: a short stub of white CANDLE with hardened drips, and a burnt wooden MATCH lying beside it, a few inches apart.", L, None, True),
    'cfx_donut': ("TASK: a pink-frosted DONUT with sprinkles and one bite out of it, on a crumpled white paper napkin.", SQ, None, True),
    # the easter eggs: YOYO's paw (it takes an exhibit at the end), the cellar's tentacle, a lipstick kiss left in the dark
    'cfx_paw': (REF_L + "TASK: a small KITTEN'S FRONT PAW and forearm, coloured like YOYO on Image 1 (silver-grey tabby with darker stripes), reaching straight DOWN from the top as if sneaking in to snatch something off a desk: soft striped fur, the paw open with the toes spread and the pink toe beans showing, tiny claws just out; round the wrist a cuff of fine BLACK LACE tied with a small WINE-RED velvet ribbon bow. The forearm runs up to the top of the object and ends in a clean straight cut (it continues out of the picture).", PT, 'sheet_leads.png', True),
    'cfx_tentacle': ("TASK: ONE long, slender TENTACLE of a small deep-sea creature, lying flat and curving gently from the bottom-left towards the upper right, its thin tip curled into a loose hook: glossy wet skin, deep TEAL-BLUE on top shading to paler turquoise at the edges, a row of round PINK suckers along one edge getting smaller towards the tip. The thick end ends in a clean straight cut at the bottom left (it continues under something).", L, None, True),
    # the way back to the footage / to shut the book (a desk button)
    'cfx_seal': ('TASK: ONE glossy deep-red SEALING-WAX SEAL as pressed onto a document, with two short silk RIBBON tails (deep burgundy, frayed cut ends) coming out from under it at the bottom and spreading slightly apart: a thick round blob of wax with a naturally irregular, slightly rippled spill edge, and in its middle the round raised face left by a brass seal stamp: a fine beaded border ring and, inside it, a perfectly SMOOTH, FLAT, EMPTY face (no emblem, no letters, no pattern: something is pressed into it later). Glossy specular highlights on the wax from the lamp at the upper left, deeper crimson where the wax folds.', SQ, None, True),
    'cfx_badge': ("TASK: ONE 1950s American city police DETECTIVE'S BADGE lying flat on the desk: a polished but well-worn gold-brass SHIELD with a pointed crest, a small spread-wing eagle on top, a raised rope-twist border, a curved blank scroll banner across the top and another across the bottom, and in the middle a round CENTRE DISC of smooth, dark NAVY-BLUE ENAMEL, perfectly plain and EMPTY (no emblem, no letters: words are added later), ringed by a thin raised gold rim. Fine scratches and darker patina in the recesses, bright specular glints on the raised gold from the lamp at the upper left. The badge ALONE: no leather wallet, no pin showing, no chain.", SQ, None, True),
    'cfx_kiss': ("TASK: a single bold RED LIPSTICK KISS print as real lips leave it on paper: the two lip shapes with fine lip-crease lines, rich crimson, slightly smudged at one edge. The mark ONLY, no paper: everything that is not lipstick is transparent.", SQ, None, True),
}

if __name__ == '__main__':
    for name, (task, size, ref, cut) in JOBS.items():
        (P / f'{name}.txt').write_text(f"{task}\n\n{{CFSTYLE}}\n\n" + ("{CFCUT}\n\n" if cut else "") + f"{size}\n", encoding='utf-8')
    names = list(JOBS)
    for i in range(5):
        lines = ['#!/bin/bash', 'cd "D:/ClaudeAbout/small-plays/jolly2/v2/art"']
        for n in names[i::5]:
            lines.append(f'[ -f src/{n}.png ] || bash run.sh {n} {JOBS[n][2] or ""}; echo "{n}: $(tail -1 prompts/{n}.log)"')
        (HERE.parent / f'tools/cfq{i}.sh').write_text('\n'.join(lines) + '\n', encoding='utf-8')
        print(i, names[i::5])

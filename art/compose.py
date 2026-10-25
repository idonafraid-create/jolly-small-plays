# Builds the full codex prompt for one job: header + the job's own text, with {STYLE} / {JOJO} ... blocks filled in.
# usage: python compose.py <job>   (prints to stdout; run.sh pipes it to codex)
import re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BLOCKS = dict(re.findall(r'^### (\w+)\n(.*?)(?=^### |\Z)', (HERE / 'prompts/_blocks.md').read_text(encoding='utf-8'), re.S | re.M))
job = sys.argv[1]
body = (HERE / f'prompts/{job}.txt').read_text(encoding='utf-8')
body = re.sub(r'\{(\w+)\}', lambda m: BLOCKS[m.group(1)].strip(), body)
head = (f'Use your built-in image generation tool (image_gen). Produce ONE image, then copy the final PNG into the current '
        f'working directory as `{job}.png` (never overwrite an existing file). Do not write any code or other files.\n\n')
sys.stdout.reconfigure(encoding='utf-8')
print(head + body.strip())

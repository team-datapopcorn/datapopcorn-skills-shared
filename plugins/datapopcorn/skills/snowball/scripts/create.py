#!/usr/bin/env python3
"""Copy an approved motion example into a new working folder."""
import argparse
from pathlib import Path
p=argparse.ArgumentParser()
p.set_defaults(scene='snow')
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
if a.output.exists(): p.error('Output already exists; choose a new folder to preserve existing work.')
asset=Path(__file__).resolve().parents[1]/'assets'/('paper.html' if a.scene=='paper' else 'worlds.html')
html=asset.read_text(encoding='utf-8')
if a.scene=='flight':
 html=html.replace("fitFrame(); selectScene('globe');", "fitFrame(); selectScene('sunset');")
a.output.mkdir(parents=True)
(a.output/'index.html').write_text(html,encoding='utf-8')
print(a.output.resolve()/'index.html')

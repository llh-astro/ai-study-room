"""Prepare only public website assets for GitHub Pages; never copy local app data."""
from pathlib import Path
import shutil

root=Path(__file__).parent
out=root/'docs'
out.mkdir(exist_ok=True)
for name in ['index.html','bank.json']:
    shutil.copyfile(root/name,out/name)
(out/'.nojekyll').write_text('',encoding='utf-8')
print('Prepared docs/index.html and docs/bank.json for GitHub Pages.')

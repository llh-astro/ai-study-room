"""Make a data-only update package suitable for HTTPS hosting or file import."""
from pathlib import Path
import json
ROOT=Path(__file__).parent
bank={'format':'ai-study-bank','schema':1,'version':'2026.09.09.1','changelog':'首版：AI 岗位笔试 150 题与 LeetCode Hot100 100 题。','ai':json.loads((ROOT/'questions.json').read_text(encoding='utf-8')),'hot':json.loads((ROOT/'hot100.json').read_text(encoding='utf-8'))}
(ROOT/'release').mkdir(exist_ok=True)
(ROOT/'release/题库包-2026.09.09.1.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
(ROOT/'bank.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
print('Created data-only bank package, schema 1, version '+bank['version'])

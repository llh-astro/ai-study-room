"""Make a data-only update package suitable for HTTPS hosting or file import."""
from pathlib import Path
import json
ROOT=Path(__file__).parent
bank={'format':'ai-study-bank','schema':1,'version':'2026.09.11.1','changelog':'新增基础认知 300 题（240 单选、60 多选），保留原岗位与算法题库。','ai':json.loads((ROOT/'questions.json').read_text(encoding='utf-8')),'basics':json.loads((ROOT/'basics.json').read_text(encoding='utf-8')),'hot':json.loads((ROOT/'hot100.json').read_text(encoding='utf-8'))}
(ROOT/'release').mkdir(exist_ok=True)
(ROOT/'release/题库包-2026.09.11.1.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
(ROOT/'bank.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
print('Created data-only bank package, schema 1, version '+bank['version'])

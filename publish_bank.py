"""Make a data-only update package suitable for HTTPS hosting or file import."""
from pathlib import Path
import json
ROOT=Path(__file__).parent
bank={'format':'ai-study-bank','schema':1,'version':'2026.09.11.2','changelog':'新增企业智能决策专项 210 题（140 单选、70 多选），原三套题库保持不变。','ai':json.loads((ROOT/'questions.json').read_text(encoding='utf-8')),'enterprise':json.loads((ROOT/'enterprise.json').read_text(encoding='utf-8')),'basics':json.loads((ROOT/'basics.json').read_text(encoding='utf-8')),'hot':json.loads((ROOT/'hot100.json').read_text(encoding='utf-8'))}
(ROOT/'release').mkdir(exist_ok=True)
(ROOT/'release/题库包-2026.09.11.2.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
(ROOT/'bank.json').write_text(json.dumps(bank,ensure_ascii=False),encoding='utf-8')
print('Created data-only bank package, schema 1, version '+bank['version'])

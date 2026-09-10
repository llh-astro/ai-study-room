import json
import re
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).parent
import sys
if len(sys.argv)!=2: raise SystemExit('Usage: python build.py SOURCE.pdf')
reader = PdfReader(sys.argv[1])
pages = [p.extract_text() for p in reader.pages]
text = '\n'.join(pages)
text = re.sub(r'AI 岗位笔试选择题集\s*\|\s*150 题学习版\s*\n第 \d+ 页\s*\n', '', text)
modules = ['概率统计与线性代数','机器学习与模型评估','深度学习与计算机视觉','NLP 与 Transformer','大模型训练与推理','RAG 与 Agent 场景判断','Python 与数据处理','数据结构与算法','SQL 与计算机基础','搜索推荐与实验评估']
pattern = r'Q(\d{3})\s+【(单选|多选)\s*·\s*(基础|进阶)】\s*\n(.*?)\n答案：([ABCD]+)\s*\n解析：(.*?)\n知识点：(.*?)\n易错点：(.*?)\n知识参考：([^\n]+)'
def prose(s):
    s = re.sub(r'(?<=[\u4e00-\u9fff，。；：、？])\s*\n\s*(?=[\u4e00-\u9fff，。；：、？])', '', s.strip())
    return re.sub(r'\s*\n\s*', ' ', s)
questions = []
for m in re.finditer(pattern, text, re.S):
    num, kind, difficulty, body, answer, explanation, knowledge, pitfall, refs = m.groups()
    parts = re.split(r'\n([ABCD])\.\s*', body)
    assert len(parts) == 9, (num, parts)
    stem = parts[0].strip()
    # Keep code line breaks and indentation; prose wraps are joined.
    lines = stem.splitlines()
    code_at = next((i for i, line in enumerate(lines) if re.match(r'^(?:def |print\(|[a-zA-Z_][\w]*\s*=|SELECT\b|WITH\b)', line)), None) if 91 <= int(num) <= 135 else None
    code = ''
    if code_at is not None:
        code = '\n'.join(lines[code_at:])
        stem = '\n'.join(lines[:code_at])
    q = dict(id=int(num), type=kind, difficulty=difficulty, module=(int(num)-1)//15, stem=prose(stem), code=code,
             options={parts[i]: prose(parts[i+1]) for i in range(1,9,2)}, answer=answer,
             explanation=prose(explanation), knowledge=prose(knowledge), pitfall=prose(pitfall), refs=refs.strip(),
             page=next(i+1 for i,p in enumerate(pages) if re.search(r'Q'+num+r'\s+【',p)))
    assert len(answer) == 1 if kind == '单选' else len(answer) >= 2
    questions.append(q)
assert [q['id'] for q in questions] == list(range(1,151)), len(questions)
assert all(all(q[k] for k in ['stem','explanation','knowledge','pitfall']) for q in questions)
# Cross-check every extracted answer against the independent answer table.
key_section = text[text.index('答案速查', text.index('Q150  【')):]
keys = dict((int(n), a) for n,a in re.findall(r'Q(\d{3})[ \t]+([ABCD]{1,4})\b',key_section))
assert len(keys) == 150, len(keys)
assert all(keys[q['id']] == q['answer'] for q in questions), [(q['id'],q['answer'],keys[q['id']]) for q in questions if keys[q['id']] != q['answer']]
data = json.dumps(dict(modules=modules, questions=questions), ensure_ascii=False)
(root/'questions.json').write_text(data,encoding='utf-8')
from extract_hot100 import extract
from assemble import assemble
extract()
assemble()
print(f'Validated {len(questions)} questions against answer table; {sum(q["type"]=="多选" for q in questions)} multiple-choice questions.')

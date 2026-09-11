"""Generate the original enterprise study bank from reviewed scenario records.

Stable order defines published IDs: never reorder existing concept records.
No user resume, credentials, or private job-search data is embedded.
"""
from pathlib import Path
import json
import random

ROOT = Path(__file__).parent
REFERENCES = {
    'ranking': 'https://www.elastic.co/docs/solutions/search/ranking',
    'rrf': 'https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion',
    'reranking': 'https://www.elastic.co/docs/solutions/search/ranking/semantic-reranking',
    'retrieval': 'https://docs.langchain.com/oss/python/deepagents/retrieval',
    'ir': 'https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html',
    'graph': 'https://microsoft.github.io/graphrag/query/overview/',
    'sql': 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    'window': 'https://www.postgresql.org/docs/current/tutorial-window.html',
    'ontology': 'https://www.w3.org/TR/owl2-overview/',
    'kg': 'https://arxiv.org/abs/2003.02320',
    'prov': 'https://www.w3.org/TR/prov-overview/',
    'tools': 'https://docs.langchain.com/oss/python/langchain/tools',
    'state': 'https://docs.langchain.com/oss/python/langgraph/functional-api',
    'eval': 'https://docs.langchain.com/langsmith/evaluation',
    'security': 'https://genai.owasp.org/llmrisk/llm01-prompt-injection/',
    'observability': 'https://docs.langchain.com/langsmith/observability',
    'python': 'https://packaging.python.org/en/latest/tutorials/packaging-projects/',
    'typing': 'https://docs.python.org/3/library/typing.html',
    'config': 'https://fastapi.tiangolo.com/advanced/settings/',
    'fastapi': 'https://fastapi.tiangolo.com/tutorial/body/',
    'schema': 'https://json-schema.org/understanding-json-schema/reference/object',
    'pytest': 'https://docs.pytest.org/en/stable/how-to/monkeypatch.html',
    'logging': 'https://docs.python.org/3/howto/logging.html',
    'docker': 'https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/',
    'git': 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging',
    'async': 'https://docs.python.org/3/library/asyncio-task.html',
    'token': 'https://huggingface.co/docs/transformers/main_classes/tokenizer',
    'transformer': 'https://arxiv.org/abs/1706.03762',
    'sft': 'https://huggingface.co/docs/trl/sft_trainer',
    'dpo': 'https://huggingface.co/docs/trl/dpo_trainer',
    'trl': 'https://huggingface.co/docs/trl/index',
    'decoding': 'https://huggingface.co/docs/transformers/generation_strategies',
    'longcontext': 'https://arxiv.org/abs/2307.03172',
    'metrics': 'https://scikit-learn.org/stable/modules/model_evaluation.html',
    'bootstrap': 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html',
    'experiment': 'https://www.itl.nist.gov/div898/handbook/pri/section1/pri1.htm',
    'calibration': 'https://scikit-learn.org/stable/modules/calibration.html',
    'kappa': 'https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html',
    'leakage': 'https://scikit-learn.org/stable/common_pitfalls.html',
    'decomposition': 'https://otexts.com/fpp3/components.html',
    'tscv': 'https://otexts.com/fpp3/tscv.html',
    'arima': 'https://otexts.com/fpp3/arima.html',
    'prophet': 'https://facebook.github.io/prophet/docs/quick_start.html',
    'accuracy': 'https://otexts.com/fpp3/accuracy.html',
    'anomaly': 'https://doi.org/10.1145/1541880.1541882',
    'threshold': 'https://scikit-learn.org/stable/modules/classification_threshold.html',
}


def build():
    chapters = []
    fields = ['name', 'definition', 'scene', 'right', 'wrong1', 'wrong2', 'wrong3', 'why', 'ref']
    for line in (ROOT / 'enterprise-concepts.txt').read_text(encoding='utf-8').splitlines():
        if line.startswith('## '):
            chapters.append({'name': line[3:], 'concepts': []})
        elif line and not line.startswith('#'):
            values = line.split('|')
            assert len(values) == len(fields), line
            record = dict(zip(fields, values))
            assert record['ref'] in REFERENCES
            chapters[-1]['concepts'].append(record)
    assert len(chapters) == 7 and all(len(c['concepts']) == 10 for c in chapters)
    questions = []

    def add(module, c, angle, stem, options):
        qid = len(questions) + 1
        choices = list(options)
        random.Random(190000 + qid).shuffle(choices)
        reasons = {chr(65+i): reason for i, (_, _, reason) in enumerate(choices)}
        answer = ''.join(chr(65+i) for i, (_, correct, _) in enumerate(choices) if correct)
        questions.append(dict(
            id=qid, module=module, type='单选' if len(answer) == 1 else '多选',
            difficulty='基础' if angle == '概念辨认' else '进阶', page=1, code='',
            stem=stem, options={chr(65+i): text for i, (text, _, _) in enumerate(choices)},
            answer=answer, concept=c['name'], angle=angle,
            knowledge=c['name']+'：'+c['definition'],
            explanation=c['why']+'\n\n选项辨析：\n'+'\n'.join(k+'：'+v for k, v in reasons.items())
                +'\n\n场景回顾：'+c['scene']+'\n推荐判断：'+c['right'],
            optionExplanations=reasons, example=c['scene']+' '+c['right'],
            pitfall='辨认概念之后，还要检查证据、适用条件和评价口径。'+c['why'],
            refs=REFERENCES[c['ref']],
        ))

    for module, chapter in enumerate(chapters):
        cs = chapter['concepts']
        for i, c in enumerate(cs):
            others = [cs[(i+j) % 10] for j in [1, 3, 7]]
            add(module, c, '概念辨认', '关于“'+c['name']+'”，哪项描述最准确？',
                [(c['definition'], True, '这描述了该概念的作用和边界。')]
                + [(x['definition'], False, '这是“'+x['name']+'”的主要含义。') for x in others])
            add(module, c, '场景判断', c['scene'],
                [(c['right'], True, c['why'])]
                + [(c[k], False, '该选项不能满足本题的条件。判断依据：'+c['why']) for k in ['wrong1', 'wrong2', 'wrong3']])
            # Keep the scenario explicit so its recommended action is not asserted universally.
            add(module, c, '多选辨析', '结合以下场景，哪些表述成立？\n'+c['scene'],
                [(c['name']+'的含义是：'+c['definition'], True, '概念辨认正确。'),
                 ('在题设条件下，合理判断是：'+c['right'], True, c['why']),
                 ('在题设条件下，应当：'+c['wrong1'], False, '这与本题所需条件或概念边界不符。'+c['why']),
                 ('在题设条件下，应当：'+c['wrong2'], False, '该判断混淆了不同层次或遗漏必要验证。'+c['why'])])
    assert len(questions) == 210
    assert sum(q['type'] == '单选' for q in questions) == 140
    assert len({q['stem'] for q in questions}) == 210
    for q in questions:
        assert len(set(q['options'].values())) == 4
    bank = dict(title='企业智能决策专项', version='2026.09.11.2',
                modules=[c['name'] for c in chapters], questions=questions,
                provenance='按学习清单原创编写，参考公开教材、论文与官方文档；非企业招聘真题。',
                references=REFERENCES)
    (ROOT/'enterprise.json').write_text(json.dumps(bank, ensure_ascii=False), encoding='utf-8')
    print('Built enterprise bank: 210 questions, 140 single / 70 multiple, 7 chapters.')


if __name__ == '__main__':
    build()

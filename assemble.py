"""Build the offline page while retaining the original quiz identifiers/storage."""
from pathlib import Path
import json
from basics_view import build_view, build_enterprise_view, build_training_view

ROOT = Path(__file__).parent

def assemble():
    page = (ROOT/'template.html').read_text(encoding='utf-8')
    basic_panel,basic_js=build_view(page)
    enterprise_panel,enterprise_js=build_enterprise_view(page)
    training_panel,training_js=build_training_view(page)
    training=json.loads((ROOT/'training.json').read_text(encoding='utf-8'))
    enterprise=json.loads((ROOT/'enterprise.json').read_text(encoding='utf-8'))
    basics=json.loads((ROOT/'basics.json').read_text(encoding='utf-8'))
    original = json.loads((ROOT/'questions.json').read_text(encoding='utf-8'))
    hot = json.loads((ROOT/'hot100.json').read_text(encoding='utf-8'))
    encode = lambda obj: json.dumps(obj,ensure_ascii=False).replace('</','<\\/')
    page = page.replace('__QUESTION_DATA__', encode(original))
    page = page.replace('<title>AI 练习室 · 岗位笔试 150 题</title>', '<title>AI 练习室 · 基础、算法与企业决策</title>')
    page = page.replace('</style>', (ROOT/'hot100.css').read_text(encoding='utf-8')+'\n</style>',1)
    page = page.replace('</style>', (ROOT/'study.css').read_text(encoding='utf-8')+'\n</style>',1)
    page = page.replace('</style>', (ROOT/'vendor/katex-inline.min.css').read_text(encoding='utf-8')+'\n</style>',1)
    page = page.replace('</style>', (ROOT/'compact.css').read_text(encoding='utf-8')+'\n</style>',1)
    page = page.replace('</style>', (ROOT/'sidebar-math.css').read_text(encoding='utf-8')+'\n</style>',1)
    page = page.replace('<body>', '<body data-study-page="quiz">',1)
    page = page.replace('</header>','<button id="bank-toggle" aria-controls="bank-drawer" aria-expanded="false"><span>☰ 题库</span><span id="bank-current">AI 岗位笔试</span></button></header>\n'+(ROOT/'hot100.html').read_text(encoding='utf-8'),1)
    page = page.replace('<div class="layout">','<div class="layout" id="ai-bank-root">',1)
    page = page.replace('<div class="layout" id="ai-bank-root">',(ROOT/'study.html').read_text(encoding='utf-8')+'\n<div class="layout" id="ai-bank-root">',1)
    page = page.replace('<script id="question-data"', (ROOT/'hot100-panel.html').read_text(encoding='utf-8')+'\n<script id="question-data"',1)
    # Only gate the old bank's keyboard listener; grading and storage logic stay intact.
    before = "document.addEventListener('keydown',e=>{if("
    assert page.count(before) == 1
    page = page.replace(before,"document.addEventListener('keydown',e=>{if(document.getElementById('ai-bank-root').hidden||document.querySelector('dialog[open]'))return;if(",1)
    # Keep historical correctness when a later bank corrects its answer key.
    page = page.replace("correct:v.choice===QS[Number(k)-1].answer", "correct:typeof v.correct==='boolean'?v.correct:v.choice===QS[Number(k)-1].answer")
    page = page.replace("[k,{choice:v.choice,correct:","[k,{...(v.answerAtTime?{answerAtTime:v.answerAtTime}:{}),choice:v.choice,correct:")
    page = page.replace("{choice,correct:choice===q.answer}","{choice,correct:choice===q.answer,answerAtTime:q.answer}")
    page = page.replace("(a.length/150*100)","(a.length/QS.length*100)")
    page=page.replace('document.querySelectorAll', "document.getElementById('ai-bank-root').querySelectorAll")
    page=page.replace('<script id="question-data"',basic_panel+enterprise_panel+training_panel+'\n<script id="question-data"',1)
    boot='\n<script type="application/json" id="training-data">'+encode(training)+'</script>\n<script type="application/json" id="enterprise-data">'+encode(enterprise)+'</script>\n<script type="application/json" id="basics-data">'+encode(basics)+'</script>\n<script type="application/json" id="hot100-data">'+encode(hot)+'</script>\n<script>\n'+(ROOT/'study-boot.js').read_text(encoding='utf-8')+'\n</script>\n'
    page=page.replace("<script>\n'use strict';",boot+"<script>\n'use strict';",1)
    hot_js=(ROOT/'hot100.js').read_text(encoding='utf-8')
    hot_js=hot_js.replace("if(!active||", "if(document.querySelector('dialog[open]')||!active||")
    hot_js=hot_js.replace("mastered+'%'", "(mastered/qs.length*100)+'%'")
    study_js=(ROOT/'study.js').read_text(encoding='utf-8').replace('// Testable pure contract;', (ROOT/'study-assessment.js').read_text(encoding='utf-8')+'\n'+(ROOT/'study-sheet.js').read_text(encoding='utf-8')+'\n// Testable pure contract;')
    extra = '\n<script>\n'+hot_js+'\n</script>\n<script>\n'+basic_js+'\n'+enterprise_js+'\n'+training_js+'\n</script>\n<script>\n'+(ROOT/'bank-tabs.js').read_text(encoding='utf-8')+'\n</script>\n<script>\n'+study_js+'\n</script>\n'
    extra += '\n<script>\n'+(ROOT/'vendor/katex.min.js').read_text(encoding='utf-8')+'\n</script>\n<script>\n'+(ROOT/'vendor/auto-render.min.js').read_text(encoding='utf-8')+'\n</script>\n<script>\n'+(ROOT/'math-ui.js').read_text(encoding='utf-8')+'\n'+(ROOT/'sidebar.js').read_text(encoding='utf-8')+'\n</script>\n'
    page = page.replace('</body>',extra+'</body>',1)
    assert "KEY='ai-practice-150-v1'" in page
    assert '__QUESTION_DATA__' not in page
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    print('Assembled offline index.html with AI chat, knowledge notes, backups and bank packages.')

if __name__ == '__main__':
    assemble()

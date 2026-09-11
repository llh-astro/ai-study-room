"""Reuse the existing choice-quiz engine in an isolated scope and DOM namespace."""
import re

def build_view(template):
    panel=template.split('<div class="layout">',1)[1].split('<script id="question-data"',1)[0]
    panel='<div class="layout">'+panel
    panel=re.sub(r'(?<![\w-])id="([^"]+)"',lambda m:'id="b-'+m[1]+'"',panel)
    panel=re.sub(r'\bfor="([^"]+)"',lambda m:'for="b-'+m[1]+'"',panel)
    panel=panel.replace('<div class="layout">','<div class="layout" id="basic-root" hidden>',1)
    panel=panel.replace('150','300').replace('AI 岗位笔试选择题 300 题 · 答案解析版','AI 基础认知 · 300 道原创选择题').replace('原创仿真训练题，答案与解析沿用原题册。','概念、术语、流程与简单情境；参考资料随解析列出。').replace('将删除本页面保存在此浏览器中的答题记录和收藏。','仅清空基础认知题库的答题记录和收藏，其他题库不受影响。')
    js=template.split("<script>\n'use strict';",1)[1].split('</script>',1)[0]
    js=js.replace("document.getElementById('question-data')","document.getElementById('basics-data')").replace("KEY='ai-practice-150-v1'","KEY='ai-basics-300-v1'")
    js=js.replace('document.getElementById(id)',"document.getElementById('b-'+id)")
    js=re.sub(r'(?<![\w-])id="([^"]+)"',lambda m:'id="b-'+m[1]+'"',js)
    js=js.replace('document.querySelectorAll','ROOT.querySelectorAll').replace('(a.length/150*100)','(a.length/QS.length*100)').replace('`Q${','`B${').replace('>Q${','>B${')
    js=js.replace('correct:v.choice===QS[Number(k)-1].answer',"correct:typeof v.correct==='boolean'?v.correct:v.choice===QS[Number(k)-1].answer")
    js=js.replace('[k,{choice:v.choice,correct:', '[k,{...(v.answerAtTime?{answerAtTime:v.answerAtTime}:{}),choice:v.choice,correct:')
    js=js.replace('{choice,correct:choice===q.answer}','{choice,correct:choice===q.answer,answerAtTime:q.answer}')
    js=js.replace("document.addEventListener('keydown',e=>{if(","document.addEventListener('keydown',e=>{if(ROOT.hidden||document.getElementById('study-dialog').open)return;if(")
    js=js.replace('原题册第 ${q.page} 页 · 知识参考 ${esc(q.refs)}','原创基础练习 · 参考资料：<a href="${esc(q.refs)}" target="_blank" rel="noopener noreferrer">查看教材 / 官方文档</a>')
    for name in ['mode','module','choice','id']:
        panel=panel.replace('data-'+name,'data-b-'+name)
        js=js.replace('data-'+name,'data-b-'+name).replace('.dataset.'+name,'.dataset.b'+name.title())
    js+='\nwindow.Basics={current:()=>queue.length?QS[state.current-1]:null};\n'
    return panel,"window.initBasics=()=>{if(window.Basics)return;(()=>{'use strict';const ROOT=document.getElementById('basic-root');\n"+js+'\n})();};'

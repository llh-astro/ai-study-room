"""Build reproducible original concept exercises; no API or personal data is used."""
from pathlib import Path
import json, random

ROOT=Path(__file__).parent
chapters=[]
for line in (ROOT/'basics-concepts.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('## '):chapters.append({'name':line[3:],'concepts':[]})
    elif line and not line.startswith('#'):
        fields=line.split('|');assert len(fields)==6,line
        chapters[-1]['concepts'].append(dict(zip(['name','definition','scene','principle','mistake','example'],fields)))
assert len(chapters)==10 and all(len(c['concepts'])==10 for c in chapters)
refs=[
 'https://www.deeplearningbook.org/contents/linear_algebra.html',
 'https://www.deeplearningbook.org/contents/prob.html',
 'https://scikit-learn.org/stable/modules/preprocessing.html',
 'https://scikit-learn.org/stable/user_guide.html',
 'https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html',
 'https://huggingface.co/docs/transformers/en/main_classes/tokenizer',
 'https://huggingface.co/docs/transformers/llm_tutorial',
 'https://docs.langchain.com/oss/python/deepagents/retrieval',
 'https://docs.langchain.com/oss/python/langchain/agents',
 'https://scikit-learn.org/stable/model_selection.html']
flows=[
 ('计算两个等长向量的点积，哪项顺序正确？',['检查长度一致','对应分量相乘','把乘积求和'],'乘积求和后得到标量。'),
 ('利用检测结果做贝叶斯判断，哪项思路正确？',['明确先验与检测条件概率','计算相关联合概率及证据概率','用联合概率除以证据概率得到后验'],'不能直接把检测灵敏度当成阳性后的患病概率。'),
 ('划分后需要标准化数据，哪项顺序能避免借用测试集统计信息？',['划分训练与测试数据','只用训练集拟合缩放参数','用同一组参数变换训练与测试数据'],'不能先在全量数据上拟合缩放器。'),
 ('一个基本监督学习实验，哪项流程合理？',['准备并划分数据','训练并用验证集选择方案','用保留的测试集作最终评估'],'测试集用于最终独立评估，不用于反复挑选方案。'),
 ('不采用梯度累积时，一次常见训练更新的顺序是哪项？',['清空旧梯度并做前向计算','计算损失并反向传播','由优化器更新参数'],'反向传播计算梯度，优化器执行参数更新。'),
 ('常见文本模型输入准备流程，哪项顺序合理？',['文本经分词器编码成 Token ID','将 ID 映射为 Embedding 并处理位置信息','把表示交给后续网络计算'],'编码编号与向量表示属于不同阶段。'),
 ('从通用模型构建需要微调的专用应用，哪项顺序合理？',['取得预训练模型及合适训练数据','按任务需要微调并评估','部署合格版本并继续监控'],'微调结果应先评估，再部署；不是所有应用都必须微调。'),
 ('在需预建索引的基础 RAG 中，哪项顺序合理？',['解析分块并建立索引','收到问题后检索相关证据','组装证据并生成有依据的回答'],'重排可以位于检索与组装之间，但不是所有 RAG 都必须重排。'),
 ('Agent 发起一次工具调用后，哪项顺序合理？',['提出工具与参数请求','程序校验权限及参数后执行','把执行结果反馈给后续决策'],'模型请求工具不等于工具已经成功执行。'),
 ('把一个模型安全地用于实际服务，哪项顺序合理？',['定义任务与评价指标','在合适数据上评估并检查限制','上线监控并准备必要的回退'],'上线后仍需关注质量、延迟、异常与数据变化。')]
questions=[]
def add(module,concept,angle,stem,options,why):
    qid=len(questions)+1
    choices=list(options);random.Random(87000+qid).shuffle(choices)
    opts={chr(65+i):v[0] for i,v in enumerate(choices)}
    answer=''.join(chr(65+i) for i,v in enumerate(choices) if v[1])
    reasons={chr(65+i):v[2] for i,v in enumerate(choices)}
    questions.append({'id':qid,'module':module,'type':'单选' if len(answer)==1 else '多选','difficulty':'基础','page':1,'stem':stem,'code':'','options':opts,'answer':answer,'knowledge':concept['name']+'：'+concept['definition'],'concept':concept['name'],'angle':angle,'explanation':why+'\n\n选项辨析：\n'+'\n'.join(k+'：'+v for k,v in reasons.items())+'\n\n简单例子：'+concept['example'],'optionExplanations':reasons,'example':concept['example'],'pitfall':concept['principle']+'。不要误以为“'+concept['mistake']+'”。','refs':refs[module]})
for module,chapter in enumerate(chapters):
    cs=chapter['concepts']
    for i,c in enumerate(cs):
        others=[cs[(i+step)%10] for step in [1,3,7]]
        add(module,c,'概念辨认',f'下列哪项最符合“{c["name"]}”的基本含义？',[(c['definition'],True,'这是该概念的定义。')]+[(x['definition'],False,'这描述的是“'+x['name']+'”，不是题目所问概念。') for x in others],c['principle']+'。')
        add(module,c,'情境辨认',c['scene']+'。这里主要体现的是哪个概念？',[(c['name'],True,'情境中的关键做法符合：'+c['definition']+'。')]+[(x['name'],False,x['name']+'主要指：'+x['definition']+'，与本题关键做法不同。') for x in others],c['principle']+'。')
        if i==3:
            stem,steps,why=flows[module]
            permutations=[[0,1,2],[1,0,2],[2,1,0],[0,2,1]]
            flow={**c,'name':chapter['name']+'基本流程','definition':'按信息和操作的依赖关系安排步骤','principle':why,'mistake':'尚未完成必要的前置步骤，就可以无条件执行后续操作','example':' → '.join(steps)}
            add(module,flow,'流程顺序',stem,[(' → '.join(steps[k] for k in order),j==0,why if j==0 else '这一顺序颠倒了准备、处理或结果验证之间的依赖。'+why) for j,order in enumerate(permutations)],why)
        elif i<4:
            other=cs[(i+1)%10]
            correct=c['name']+'：'+c['definition']+'；'+other['name']+'：'+other['definition']
            options=[(correct,True,'两组术语与定义均正确对应。'),(c['name']+'：'+other['definition']+'；'+other['name']+'：'+c['definition'],False,'两组含义被对调。'),(c['name']+'与'+other['name']+'含义完全相同',False,'二者定义不同，不能视为同义词。'),(c['mistake'],False,'这是该概念的常见误解。正确理解是：'+c['principle']+'。')]
            add(module,c,'术语区分',f'区分“{c["name"]}”和“{other["name"]}”，下列哪项正确？',options,c['principle']+'。')
        else:
            other=others[0]
            add(module,c,'易错判断',f'关于“{c["name"]}”，下列哪些说法正确？',[(c['definition'],True,'符合其定义。'),(c['principle'],True,'这是使用或理解该概念时需要注意的条件。'),(c['mistake'],False,'错误。'+c['principle']+'。'),('它与“'+other['name']+'”含义完全相同，没有区别',False,other['name']+'指'+other['definition']+'；不能将两个术语等同。')],c['definition']+'。')
assert len(questions)==300
assert sum(q['type']=='单选' for q in questions)==240
assert len({q['stem'] for q in questions})==300
data={'title':'AI 基础认知','version':'2026.09.11.1','source':'原创基础认知练习；章节资料用于概念核对，不是摘录原资料题目。','modules':[c['name'] for c in chapters],'questions':questions,'references':refs}
(ROOT/'basics.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
print('Built 300 foundational questions: 10 chapters, 240 single-choice, 60 multiple-choice.')

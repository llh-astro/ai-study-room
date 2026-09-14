"""Compile 100 authored sequential training exercises with stable IDs 1–100."""
from pathlib import Path
import json
import random

ROOT = Path(__file__).parent
CODES = [
    '# 任务：28×28 灰度图片 → 0–9 十个类别\nnum_classes = 10\npredicted = logits.argmax(dim=1)',
    'dataset = MNIST(data_dir, train=True, transform=ToTensor())\ntrain_pool, val = random_split(dataset, [58000, 2000], generator=g)\ntrain = Subset(train_pool, range(10000))\ntrain_loader = DataLoader(train, batch_size=32, shuffle=True, num_workers=0)',
    'images, labels = next(iter(train_loader))\nprint(images.shape, images.dtype, images.device)\nprint(labels.shape, labels.dtype)\n# 常见：images [32,1,28,28]；labels [32]',
    'model = nn.Sequential(\n    nn.Flatten(), nn.Linear(784, 128),\n    nn.ReLU(), nn.Linear(128, 10)\n)\nlogits = model(images)',
    'criterion = nn.CrossEntropyLoss()\nlogits = model(images)\nloss = criterion(logits, labels)\npredicted = logits.argmax(dim=1)',
    'optimizer.zero_grad(set_to_none=True)\nlogits = model(images)\nloss = criterion(logits, labels)\nloss.backward()\noptimizer.step()',
    'for epoch in range(epochs):\n    model.train()\n    for images, labels in train_loader:\n        # 完成本阶段前面的五步更新\n        loss_sum += loss.item() * len(labels)\n        count += len(labels)\n    train_loss = loss_sum / count\n# 上述为节选；完整初始化与更新见 train_mnist.py',
    'model.eval()\nwith torch.no_grad():\n    for images, labels in val_loader:\n        logits = model(images)\n        loss = criterion(logits, labels)\n# 下一轮训练前重新 model.train()',
    'torch.save(model.state_dict(), "weights.pt")\nrestored = make_model()\nrestored.load_state_dict(\n    torch.load("weights.pt", map_location="cpu", weights_only=True)\n)\n# 完整续训 checkpoint 还要包含 optimizer 等状态',
    'restored.eval()\nwith torch.no_grad():\n    logits = restored(image.unsqueeze(0))\n    predicted = logits.argmax(dim=1).item()\n    probabilities = logits.softmax(dim=1)',
]
REFS = ['quickstart','data','data','buildmodel','optimization','autograd','optimization','optimization','saveloadrun','saveloadrun']


def build_questions():
    lessons=[]
    for line in (ROOT/'questions.txt').read_text(encoding='utf-8').splitlines():
        if line.startswith('## '):
            lessons.append({'title':line[3:],'intro':'','questions':[]})
        elif line.startswith('> '):
            lessons[-1]['intro']=line[2:]
        elif line and not line.startswith('#'):
            row=line.split('|');assert len(row)==7,line
            lessons[-1]['questions'].append(row)
    assert len(lessons)==10 and all(len(l['questions'])==10 for l in lessons)
    result=[]
    for stage,lesson in enumerate(lessons):
        for row in lesson['questions']:
            stem,*rest=row
            options,answer,why=rest[:4],rest[4],rest[5]
            qid=1+len(result)
            choices=[(option,chr(65+i) in answer) for i,option in enumerate(options)]
            random.Random(310000+qid).shuffle(choices)
            mapped={chr(65+i):text for i,(text,_) in enumerate(choices)}
            mapped_answer=''.join(chr(65+i) for i,(_,right) in enumerate(choices) if right)
            result.append(dict(id=qid,module=stage,type='单选' if len(answer)==1 else '多选',difficulty='基础',page=1,
                stem='训练实战 · '+lesson['title']+'\n\n'+lesson['intro']+'\n\n'+stem,
                code=CODES[stage],options=mapped,answer=mapped_answer,
                explanation=why+'\n\n本题正确选项：'+'；'.join(k+' '+mapped[k] for k in mapped_answer)+'\n\n动手对应：training/train_mnist.py；代码区是教学节选，不是每题都能单独运行的完整脚本。',
                knowledge=lesson['title']+'：'+lesson['intro'],pitfall='先区分数据、预测、损失、梯度、参数与评价。'+why,
                refs='https://docs.pytorch.org/tutorials/beginner/basics/'+REFS[stage]+'_tutorial.html',
                course='模型训练实战入门',stage=stage+1,stageTitle=lesson['title']))
    assert len(result)==100 and sum(q['type']=='单选' for q in result)==80
    assert len({q['stem'] for q in result})==100
    return result


if __name__=='__main__':
    qs=build_questions()
    data={'title':'模型训练实战入门','version':'2026.09.14.1','modules':[q['stageTitle'] for q in qs[::10]],'source':'原创 MNIST 训练流程练习，参考 PyTorch 官方教程。','questions':qs}
    (ROOT.parent/'training.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
    print('Compiled 100 training exercises: 80 single / 20 multiple, IDs 1–100.')

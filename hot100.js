// This bank is deliberately isolated from ai-practice-150-v1. Never migrate or clear it.
(()=>{
'use strict';
const data=JSON.parse(document.getElementById('hot100-data').textContent);
const KEY='leetcode-hot100-python-v1', qs=data.questions, byId=new Map(qs.map(q=>[q.id,q]));
const $=id=>document.getElementById(id), html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let store={status:{},drafts:{},saved:[],current:qs[0].id}, mode='all', queue=qs.map(q=>q.id), active=false;
const views=new Map();
try{
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(saved&&typeof saved==='object'){
    for(const name of ['status','drafts'])if(saved[name]&&typeof saved[name]==='object')store[name]=Object.fromEntries(Object.entries(saved[name]).filter(([id,v])=>byId.has(id)&&typeof v==='string'&&(name==='drafts'||['mastered','review'].includes(v))));
    if(Array.isArray(saved.saved))store.saved=[...new Set(saved.saved.filter(id=>byId.has(id)))];
    if(byId.has(saved.current))store.current=saved.current;
  }
}catch(e){notice('无法读取算法题库的本地记录。原选择题进度不受影响。');}
function notice(text){$('h-notice').hidden=false;$('h-notice').textContent=text;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(store));return true}catch(e){notice('算法草稿暂时无法保存，请复制到本地文件后再关闭页面。');return false}}
function switchBank(hot){
  active=hot;$('ai-bank-root').hidden=hot;$('hot100-root').hidden=!hot;
  for(const [id,on] of [['bank-ai',!hot],['bank-hot100',hot]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',on)}
  $('saveStatus').hidden=hot; // The old bank owns this element and its storage warning.
  if(hot)render();
}
$('bank-ai').onclick=()=>switchBank(false);$('bank-hot100').onclick=()=>switchBank(true);
data.topics.forEach((topic,i)=>{
  const b=document.createElement('button');b.className='nav';b.dataset.hTopic=i;b.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b>${html(topic.name)}`;
  b.onclick=()=>{mode='all';$('h-topic').value=i;filter()};$('h-topic-nav').append(b);
  const o=document.createElement('option');o.value=i;o.textContent=topic.name;$('h-topic').append(o);
});
function stats(){
  const statuses=Object.values(store.status),mastered=statuses.filter(s=>s==='mastered').length,review=statuses.filter(s=>s==='review').length;
  $('h-mastered').textContent=mastered;$('h-progress').style.width=mastered+'%';$('h-drafts').textContent=Object.values(store.drafts).filter(t=>t.trim()).length;
  for(const id of ['h-review-count','h-review-stat'])$(id).textContent=review;
  for(const id of ['h-saved-count','h-saved-stat'])$(id).textContent=store.saved.length;
  document.querySelectorAll('[data-h-mode]').forEach(b=>b.classList.toggle('active',b.dataset.hMode===mode));
  document.querySelectorAll('[data-h-topic]').forEach(b=>b.classList.toggle('active',b.dataset.hTopic===$('h-topic').value));
  $('h-heading').textContent=mode==='review'?'再写一遍，直到能独立完成。':mode==='saved'?'留给下一次复习的算法题。':'把思路，写成代码。';
}
function filter(){
  const term=$('h-search').value.trim().toLowerCase(),topic=$('h-topic').value,diff=$('h-difficulty').value,status=$('h-status').value;
  queue=qs.filter(q=>(mode!=='review'||store.status[q.id]==='review')&&(mode!=='saved'||store.saved.includes(q.id))&&(topic===''||q.topic===Number(topic))&&(!diff||q.difficulty===diff)&&(!status||(status==='unmarked'?!store.status[q.id]:store.status[q.id]===status))&&(!term||(`${q.number} lc-${q.number} H${String(q.order).padStart(3,'0')} ${q.title} ${q.stem} ${q.pattern} ${data.topics[q.topic].name}`).toLowerCase().includes(term))).map(q=>q.id);
  if(queue.length&&!queue.includes(store.current)){store.current=queue[0];persist()}
  render();
}
function renderBlocks(blocks){
  let out='',list='';
  const close=()=>{if(list){out+=`</${list}>`;list=''}};
  for(const b of blocks){
    if(['Handbook Bullet','Handbook Number'].includes(b.style)){
      const tag=b.style==='Handbook Number'?'ol':'ul';if(list!==tag){close();out+=`<${tag}>`;list=tag}out+=`<li>${html(b.text)}</li>`;continue;
    }
    close();
    if(b.style==='Code Block')out+=`<div class="hot-code"><div class="hot-code-head"><span>PYTHON 3 · 保留原文缩进与注释</span><button class="hot-copy">复制代码</button></div><pre><code>${html(b.text)}</code></pre></div>`;
    else if(b.style==='Section Label'||b.style==='Heading 2')out+=`<h3>${html(b.text)}</h3>`;
    else out+=`<p class="${b.style==='Small Text'?'hot-small':b.style==='Lead Callout'?'hot-callout':''}">${html(b.text)}</p>`;
  }
  close();return out;
}
function grid(){
  $('h-grid-count').textContent=queue.length+' 题';$('h-grid').innerHTML=queue.map(id=>{const q=byId.get(id),status=store.status[id];return `<button class="cell ${status==='mastered'?'done':status==='review'?'missed':''} ${id===store.current?'current':''}" data-h-id="${id}" aria-label="手册第 ${q.order} 题，力扣 ${q.number}，${html(q.title)}，${status==='mastered'?'已掌握':status==='review'?'待复习':'未标记'}" ${id===store.current?'aria-current="true"':''}>${String(q.order).padStart(3,'0')}</button>`}).join('');
  $('h-grid').querySelectorAll('button').forEach(b=>b.onclick=()=>{store.current=b.dataset.hId;persist();render()});
}
function render(){
  stats();grid();
  if(!queue.length){$('h-question').innerHTML=`<div class="empty"><div style="font-size:38px;color:var(--purple)">✧</div><h2>${mode==='review'?'当前没有符合条件的待复习题':mode==='saved'?'当前没有符合条件的收藏':'没有找到匹配的算法题'}</h2><p>可以调整筛选条件，或回到全部算法题继续练习。</p><button class="button" id="h-clear">返回全部算法题</button></div>`;$('h-clear').onclick=clearFilters;return}
  const q=byId.get(store.current),index=queue.indexOf(q.id),view=views.get(q.id)||{},saved=store.saved.includes(q.id);
  $('h-question').innerHTML=`<div class="q-top"><div class="tags"><span class="qid">H${String(q.order).padStart(3,'0')}</span><span class="tag purple">算法题</span><span class="tag">${q.difficulty}</span><span class="tag">${index+1} / ${queue.length}</span></div><button class="bookmark ${saved?'saved':''}" id="h-bookmark" aria-pressed="${saved}">${saved?'★ 已收藏':'☆ 收藏本题'}</button></div><div class="q-body"><div class="chapter">${String(q.topic+1).padStart(2,'0')} / ${html(data.topics[q.topic].name)}</div><h2 class="hot-title">${q.number}. ${html(q.title)}</h2><p class="hot-stem">${html(q.stem)}</p><a class="hot-official" href="${html(q.url)}" target="_blank" rel="noopener noreferrer">查看力扣完整题目与样例 ↗</a><div class="hot-editor-label"><label for="h-draft">我的代码 / 解题思路</label><span id="h-draft-save">${store.drafts[q.id]?'已恢复本地草稿':'输入后自动保存'}</span></div><textarea id="h-draft" class="hot-editor" aria-label="本题代码或解题思路" spellcheck="false" placeholder="先独立思考，再对照题解。\n\n可以在这里写 Python 代码、复杂度分析和边界情况。"></textarea><p class="hot-caption">此处保存练习草稿；需要运行和判题时，请前往力扣原题提交。</p><div class="hot-actions"><button class="button" data-h-mark="mastered">✓ 已掌握</button><button class="button" data-h-mark="review">↻ 待复习</button><button class="button" data-h-mark="">恢复未标记</button></div><p class="hot-state" id="h-current-status" aria-live="polite"></p><details class="hot-details" id="h-solution" ${view.solution?'open':''}><summary>查看完整题解 · 思路、Python 代码与面试追问</summary><p class="hot-solution-note">题解沿用手册内容，阅读后可自行标记掌握程度。</p><div class="hot-content"><h3>主要解题模式</h3><div class="hot-pattern">${html(q.pattern)}</div>${renderBlocks(q.blocks)}</div></details><details class="hot-details" id="h-guide" ${view.guide?'open':''}><summary>${html(data.topics[q.topic].name)} · 专题知识与通用模板</summary><div class="hot-content">${renderBlocks(data.topics[q.topic].guide)}</div></details><div class="q-actions"><button class="button" id="h-prev" ${index===0?'disabled':''}>← 上一题</button><button class="button primary" id="h-next" ${index===queue.length-1?'disabled':''}>下一题 →</button></div><div class="source">来源：${html(data.source)} · 第 ${q.order} 题</div></div>`;
  $('h-draft').value=store.drafts[q.id]||'';
  $('h-draft').oninput=()=>{const text=$('h-draft').value;if(text)store.drafts[q.id]=text;else delete store.drafts[q.id];$('h-draft-save').textContent=persist()?'草稿已保存到本机':'保存失败，请复制草稿';stats()};
  $('h-draft').onkeydown=e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const el=e.target;el.setRangeText('    ',el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input'))}};
  $('h-bookmark').onclick=()=>{store.saved=saved?store.saved.filter(id=>id!==q.id):[...store.saved,q.id];persist();if(mode==='saved'&&saved)filter();else render()};
  document.querySelectorAll('[data-h-mark]').forEach(b=>b.onclick=()=>{if(b.dataset.hMark)store.status[q.id]=b.dataset.hMark;else delete store.status[q.id];persist();stats();grid();statusButtons()});
  for(const [id,key] of [['h-solution','solution'],['h-guide','guide']])$(id).ontoggle=e=>{views.set(q.id,{...views.get(q.id),[key]:e.currentTarget.open})};
  $('h-prev').onclick=()=>move(-1);$('h-next').onclick=()=>move(1);
  document.querySelectorAll('.hot-copy').forEach(b=>b.onclick=async()=>{const code=b.closest('.hot-code').querySelector('code').textContent;try{await navigator.clipboard.writeText(code);b.textContent='已复制'}catch(e){const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(b.closest('.hot-code').querySelector('code'));selection.removeAllRanges();selection.addRange(range);b.textContent='已选中，请按 Ctrl+C'}});
  statusButtons();
}
function statusButtons(){const status=store.status[store.current]||'';document.querySelectorAll('[data-h-mark]').forEach(b=>{b.classList.toggle('selected',b.dataset.hMark===status);b.setAttribute('aria-pressed',b.dataset.hMark===status)});$('h-current-status').textContent='自评状态：'+(status==='mastered'?'已掌握':status==='review'?'待复习':'未标记')+'。统计已更新，重新筛选时会更新当前题单。'}
function move(delta){const next=queue[queue.indexOf(store.current)+delta];if(next){store.current=next;persist();render();$('h-question').scrollIntoView({behavior:'smooth',block:'start'})}}
function clearFilters(){mode='all';for(const id of ['h-search','h-topic','h-difficulty','h-status'])$(id).value='';filter()}
document.querySelectorAll('[data-h-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.hMode;for(const id of ['h-search','h-topic','h-difficulty','h-status'])$(id).value='';filter()});
$('h-search').oninput=filter;for(const id of ['h-topic','h-difficulty','h-status'])$(id).onchange=filter;
$('h-shuffle').onclick=()=>{for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}if(queue.length){store.current=queue[0];persist();render()}};
document.addEventListener('keydown',e=>{if(!active||['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}});
})();

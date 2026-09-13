// The sheet reuses the existing per-question chat DOM and request lifecycle.
function chatChrome(){
 $('study-sheet-handle').hidden=!sheetOpen;
 const chatVisible=view==='chat'&&currentTab==='ai';
 $('study-chat-size').hidden=!chatVisible;$('study-chat-hide').hidden=!chatVisible;
 $('study-chat-size').textContent=sheetOpen?'展开':'返回题目';
 if($('study-chat-options'))$('study-chat-options').open=!sheetOpen;
}
function setChatSheet(value){sheetOpen=value;document.body.dataset.chatSheet=String(value);chatChrome();if(value){document.querySelectorAll('[data-study-tab]').forEach(b=>{if(b.dataset.studyTab==='quiz')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});}}
function openChatSheet(){
 const scroll=window.scrollY;if(currentTab==='quiz')quizScroll=scroll;
 navigate('ai');if(view!=='chat')return;
 setChatSheet(true);
 revealSheetQuestion();
}
function revealSheetQuestion(){
 const root=[$('ai-bank-root'),$('hot100-root'),$('basic-root'),$('enterprise-root')].find(el=>!el.hidden),body=root.querySelector('.q-body');
 if(body)root.scrollTop+=body.getBoundingClientRect().top-root.getBoundingClientRect().top-8;
}
function prepareChatOptions(){
 $('study-send').closest('.study-row').classList.add('chat-submit');
 document.querySelector('.study-chat-compose>.study-row').classList.add('chat-prompts');
 const details=document.createElement('details');details.id='study-chat-options';details.open=true;
 const summary=document.createElement('summary');summary.textContent='附带内容与更多设置';details.append(summary);
 for(const el of document.querySelectorAll('.study-chat-compose .study-check'))details.append(el);
 const row=document.createElement('div');row.className='study-row';row.append($('study-chat-assess'),$('study-chat-settings'));details.append(row);
 $('study-chat-compose-end')?.remove();$('study-status').before(details);chatChrome();
}
$('study-chat-size').onclick=()=>{if(sheetOpen){setChatSheet(false);markTab('ai');window.scrollTo(0,0);}else{const q=currentQuestion();if(!q||q.id!==activeChat){openChatSheet();return;}setChatSheet(true);revealSheetQuestion();}};
$('study-chat-hide').onclick=()=>navigate('quiz');
function syncQuestionChat(){
 for(const [id,buttonId] of [['question','question-ask-ai'],['h-question','hot-ask-ai'],['b-question','basic-ask-ai'],['e-question','enterprise-ask-ai']]){
  const root=$(id);if(root.querySelector('.q-actions')&&!$(buttonId)){const button=document.createElement('button');button.id=buttonId;button.className='button ask-inline';button.textContent='✧ 问 AI';button.onclick=catchAction(openChatSheet);root.querySelector('.q-actions').append(button);}
 }
 if(sheetOpen){const q=currentQuestion();if(!q)navigate('quiz');else if(q.id!==activeChat)openChatSheet();}
}
for(const id of ['question','h-question','b-question','e-question'])new MutationObserver(syncQuestionChat).observe($(id),{childList:true,subtree:true});
for(const id of ['ai-bank-root','hot100-root','basic-root','enterprise-root'])new MutationObserver(syncQuestionChat).observe($(id),{attributes:true,attributeFilter:['hidden']});
syncQuestionChat();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetOpen){e.preventDefault();navigate('quiz');}});
// Resize only from the handle/header; content areas keep their normal scrolling.
let sheetDrag=null;
const sheetHandle=$('study-sheet-handle');
function sheetLimit(){return Math.max(160,(window.visualViewport?.height||window.innerHeight)-parseFloat(getComputedStyle(document.body).getPropertyValue('--bottom-nav'))-110);}
function resizeSheet(height){const value=Math.round(Math.max(160,Math.min(sheetLimit(),height)));document.body.style.setProperty('--chat-panel-height',value+'px');sheetHandle.setAttribute('aria-valuenow',value);sheetHandle.setAttribute('aria-valuemax',Math.round(sheetLimit()));}
for(const surface of [sheetHandle,document.querySelector('.study-dialog-head')]){
 surface.addEventListener('pointerdown',e=>{if(!sheetOpen||e.target.closest('button')||e.button!==0)return;sheetDrag={id:e.pointerId,y:e.clientY,height:$('study-dialog').getBoundingClientRect().height,surface};surface.setPointerCapture(e.pointerId);e.preventDefault();});
 surface.addEventListener('pointermove',e=>{if(!sheetDrag||sheetDrag.id!==e.pointerId)return;resizeSheet(sheetDrag.height+sheetDrag.y-e.clientY);e.preventDefault();});
 surface.addEventListener('pointerup',e=>{if(!sheetDrag||sheetDrag.id!==e.pointerId)return;const target=sheetDrag.height+sheetDrag.y-e.clientY;sheetDrag=null;if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);if(target<145){document.body.style.removeProperty('--chat-panel-height');navigate('quiz');}else resizeSheet(target);});
 surface.addEventListener('pointercancel',()=>{if(sheetDrag)resizeSheet(sheetDrag.height);sheetDrag=null;});
}
sheetHandle.addEventListener('keydown',e=>{const height=$('study-dialog').getBoundingClientRect().height;if(e.key==='ArrowUp'){e.preventDefault();resizeSheet(height+40);}else if(e.key==='ArrowDown'){e.preventDefault();if(height<=180){document.body.style.removeProperty('--chat-panel-height');navigate('quiz');}else resizeSheet(height-40);}else if(e.key==='Home'){e.preventDefault();navigate('quiz');}});
window.addEventListener('resize',()=>{document.body.style.removeProperty('--chat-panel-height');});

// Visual viewport handles browsers whose keyboard overlays the layout viewport.
function syncChatViewport(){const v=window.visualViewport,offset=v?Math.max(0,window.innerHeight-v.height-v.offsetTop):0;document.body.style.setProperty('--keyboard-offset',offset+'px');document.body.style.setProperty('--visible-height',(v?.height||window.innerHeight)+'px');}
window.visualViewport?.addEventListener('resize',syncChatViewport);window.visualViewport?.addEventListener('scroll',syncChatViewport);window.addEventListener('resize',syncChatViewport);document.addEventListener('focusin',syncChatViewport);syncChatViewport();

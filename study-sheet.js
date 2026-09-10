// The sheet reuses the existing per-question chat DOM and request lifecycle.
function chatChrome(){
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
 const root=$('hot100-root').hidden?$('question'):$('h-question'),body=root.querySelector('.q-body');
 if(body){window.scrollTo(0,window.scrollY+body.getBoundingClientRect().top-12);quizScroll=window.scrollY;}else window.scrollTo(0,quizScroll);
}
function prepareChatOptions(){
 const details=document.createElement('details');details.id='study-chat-options';details.open=true;
 const summary=document.createElement('summary');summary.textContent='附带内容与更多设置';details.append(summary);
 for(const el of document.querySelectorAll('.study-chat-compose .study-check'))details.append(el);
 const row=document.createElement('div');row.className='study-row';row.append($('study-chat-assess'),$('study-chat-settings'));details.append(row);
 $('study-chat-compose-end')?.remove();$('study-status').before(details);chatChrome();
}
$('study-chat-size').onclick=()=>{if(sheetOpen){setChatSheet(false);markTab('ai');window.scrollTo(0,0);}else{const q=currentQuestion();if(!q||q.id!==activeChat){openChatSheet();return;}setChatSheet(true);window.scrollTo(0,quizScroll);}};
$('study-chat-hide').onclick=()=>navigate('quiz');
function syncQuestionChat(){
 for(const [id,buttonId] of [['question','question-ask-ai'],['h-question','hot-ask-ai']]){
  const root=$(id);if(root.querySelector('.q-actions')&&!$(buttonId)){const button=document.createElement('button');button.id=buttonId;button.className='button ask-inline';button.textContent='✧ 问 AI';button.onclick=catchAction(openChatSheet);root.querySelector('.q-actions').append(button);}
 }
 if(sheetOpen){const q=currentQuestion();if(!q)navigate('quiz');else if(q.id!==activeChat)openChatSheet();}
}
for(const id of ['question','h-question'])new MutationObserver(syncQuestionChat).observe($(id),{childList:true,subtree:true});
for(const id of ['ai-bank-root','hot100-root'])new MutationObserver(syncQuestionChat).observe($(id),{attributes:true,attributeFilter:['hidden']});
syncQuestionChat();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetOpen){e.preventDefault();navigate('quiz');}});

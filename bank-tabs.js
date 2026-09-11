(()=>{
 const $=id=>document.getElementById(id),ai=$('bank-ai').onclick,hot=$('bank-hot100').onclick;
 function select(name){
  if(name==='basic')window.initBasics();
  if(name==='hot')hot();else ai();
  $('basic-root').hidden=name!=='basic';if(name==='basic')$('ai-bank-root').hidden=true;
  for(const [id,on]of [['bank-ai',name==='ai'],['bank-hot100',name==='hot'],['bank-basic',name==='basic']]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}
  $('saveStatus').hidden=name!=='ai';
 }
 $('bank-ai').onclick=()=>select('ai');$('bank-hot100').onclick=()=>select('hot');$('bank-basic').onclick=()=>select('basic');
})();

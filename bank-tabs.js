(()=>{
 const $=id=>document.getElementById(id),ai=$('bank-ai').onclick,hot=$('bank-hot100').onclick;
 function select(name){
  if(name==='basic')window.initBasics();if(name==='enterprise')window.initEnterprise();
  if(name==='hot')hot();else ai();
  $('basic-root').hidden=name!=='basic';$('enterprise-root').hidden=name!=='enterprise';if(name==='basic'||name==='enterprise')$('ai-bank-root').hidden=true;
  for(const [id,on]of [['bank-ai',name==='ai'],['bank-hot100',name==='hot'],['bank-basic',name==='basic'],['bank-enterprise',name==='enterprise']]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}
  $('saveStatus').hidden=name!=='ai';
 }
 $('bank-ai').onclick=()=>select('ai');$('bank-hot100').onclick=()=>select('hot');$('bank-basic').onclick=()=>select('basic');$('bank-enterprise').onclick=()=>select('enterprise');
})();

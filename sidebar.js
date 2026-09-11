(()=>{
 const drawer=document.getElementById('bank-drawer'),toggle=document.getElementById('bank-toggle');
 function close(){drawer.close();toggle.setAttribute('aria-expanded','false');}
 toggle.onclick=()=>{if(drawer.open){close();return;}drawer.showModal();toggle.setAttribute('aria-expanded','true');};
 document.getElementById('bank-close').onclick=close;
 drawer.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));
 drawer.addEventListener('click',e=>{if(e.target===drawer)close();});
 drawer.querySelectorAll('.bank-tab').forEach(button=>button.addEventListener('click',()=>{
  document.getElementById('bank-current').textContent=button.childNodes[0].textContent.trim();
  close();document.getElementById('study-practice').click();
 }));
 const back=window.StudyBack;window.StudyBack=()=>{if(drawer.open){close();return true;}return back();};
})();

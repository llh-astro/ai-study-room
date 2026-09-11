(()=>{
 'use strict';
 const options={delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,trust:false,strict:'ignore',maxExpand:500,maxSize:20,ignoredTags:['script','style','textarea','input','pre','code','option'],ignoredClasses:['katex','katex-display','no-math']};
 const roots=[...document.querySelectorAll('.question,#h-question,#study-body')];
 let timer;
 const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(render,65);});
 function watch(){for(const root of roots)observer.observe(root,{childList:true,subtree:true,characterData:true});}
 function render(){observer.disconnect();try{for(const root of roots)renderMathInElement(root,options);}finally{watch();}}
 render();
})();

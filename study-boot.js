// Runs before either legacy quiz. Android persists these keys synchronously in SQLite.
window.StudyStore=(()=>{
  const names=['ai-practice-150-v1','leetcode-hot100-python-v1','study-personal-v1','study-settings-v1','study-bank-v1'];
  const native=window.AndroidStudy;
  const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
  if(native){
    Storage.prototype.getItem=function(k){if(this===localStorage&&names.includes(k)){const value=native.get(k);if(value!==null)return value;const prior=get.call(this,k);if(prior!==null&&!native.put(k,prior))throw Error('保存失败');return prior}return get.call(this,k)};
    Storage.prototype.setItem=function(k,v){if(this===localStorage&&names.includes(k)){if(!native.put(k,String(v)))throw Error('保存失败');return}return set.call(this,k,v)};
    Storage.prototype.removeItem=function(k){if(this===localStorage&&names.includes(k)){if(!native.drop(k))throw Error('保存失败');return}return remove.call(this,k)};
  }
  function batch(values){
    if(native){if(!native.batch(JSON.stringify(values)))throw Error('导入失败，原记录已保留');return}
    const prior={};for(const k of Object.keys(values))prior[k]=localStorage.getItem(k);
    try{for(const [k,v] of Object.entries(values))localStorage.setItem(k,v)}catch(e){for(const [k,v] of Object.entries(prior)){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}throw e}
  }
  return {names,batch,native};
})();
try{
 const bank=JSON.parse(localStorage.getItem('study-bank-v1'));
 if(bank&&bank.schema===1){
  document.getElementById('question-data').textContent=JSON.stringify(bank.ai);
  // The Hot100 data element is placed ahead of this bootstrap by the builder.
  document.getElementById('hot100-data').textContent=JSON.stringify(bank.hot);
 }
}catch(e){window.studyBootError='读取更新题库失败，已使用内置题库。'}

const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'enterprise.json'),'utf8'));
 assert.equal(data.questions.length,210);assert.equal(data.modules.length,7);
 assert.equal(data.questions.filter(q=>q.type==='单选').length,140);
 assert.equal(new Set(data.questions.map(q=>q.stem)).size,210);
 for(let m=0;m<7;m++)assert.equal(data.questions.filter(q=>q.module===m).length,30);
 for(const q of data.questions){assert.equal(new Set(Object.values(q.options)).size,4);assert.equal(Object.keys(q.optionExplanations).length,4);assert.ok(q.explanation&&q.example&&q.refs.startsWith('https://'));}
 // Independent arithmetic checks for the explicitly stated numerical scenarios.
 for(const [concept,expected]of [['Recall@k 与 hit rate','0.5'],['MRR 与 NDCG','0.625'],['混淆矩阵与 precision / recall / F1','0.8'],['Citation support 与 unsupported claim rate','30%']]){
  const q=data.questions.find(q=>q.concept===concept&&q.angle==='场景判断');assert.ok(q.options[q.answer].includes(expected));
 }
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=pathToFileURL(path.join(__dirname,'index.html')).href;
 await p.goto(url);
 await p.evaluate(()=>{
  for(const [key,source] of [['ai-practice-150-v1','question-data'],['ai-basics-300-v1','basics-data']]){
   const q=JSON.parse(document.getElementById(source).textContent).questions[0];localStorage.setItem(key,JSON.stringify({answers:{1:{choice:q.answer,correct:true,answerAtTime:q.answer}},saved:[1],current:1}));
  }
  localStorage.setItem('leetcode-hot100-python-v1',JSON.stringify({status:{'lc-1':'review'},drafts:{'lc-1':'private draft'},saved:['lc-1'],current:'lc-1'}));
 });await p.reload();
 const prior=await p.evaluate(()=>['ai-practice-150-v1','ai-basics-300-v1','leetcode-hot100-python-v1'].map(k=>localStorage.getItem(k)));
 await p.locator('#bank-toggle').click();await p.locator('#bank-enterprise').click();assert.equal(await p.locator('#e-grid button').count(),210);
 assert.equal(await p.locator('#enterprise-root').isVisible(),true);
 assert.equal(await p.locator('#basic-root').isVisible(),false);
 await p.locator(`[data-e-choice="${data.questions[0].answer}"]`).click();await p.locator('#e-submit').click();
 assert.match(await p.locator('#e-question .result').innerText(),/回答正确/);await p.locator('#e-bookmark').click();
 await p.locator('#enterprise-ask-ai').click();assert.match(await p.locator('#study-title').innerText(),/E001/);
 await p.locator('#study-input').fill('BM25 和向量检索如何互补？');await p.locator('#study-chat-hide').click();
 await p.locator('#enterprise-ask-ai').click();assert.equal(await p.locator('#study-input').inputValue(),'BM25 和向量检索如何互补？');await p.locator('#study-chat-hide').click();
 // Mobile filter and exact-match grading.
 await p.locator('#enterprise-root details').evaluateAll(ds=>ds.forEach(d=>d.open=true));
 await p.locator('#e-search').fill('E003');assert.equal(await p.locator('#e-grid button').count(),1);
 const multi=data.questions[2];for(const k of multi.answer)await p.locator(`[data-e-choice="${k}"]`).click();await p.locator('#e-submit').click();assert.match(await p.locator('#e-question .result').innerText(),/回答正确/);
 await p.locator('#e-retry').click();await p.locator(`[data-e-choice="${multi.answer[0]}"]`).click();await p.locator('#e-submit').click();assert.match(await p.locator('#e-question .result').innerText(),/再巩固/);
 await p.locator('#e-search').fill('');await p.locator('#e-moduleFilter').selectOption('1');assert.equal(await p.locator('#e-grid button').count(),30);
 await p.locator('#e-moduleFilter').selectOption('');
 await p.evaluate(()=>{for(const b of [...document.querySelectorAll('#e-grid button')]){b.click();if(document.querySelectorAll('#e-question .option').length!==4)throw Error('Question render');}});
 await p.reload();await p.locator('#bank-toggle').click();await p.locator('#bank-enterprise').click();assert.equal(await p.locator('#e-doneStat').innerText(),'2');assert.equal(await p.locator('#e-savedStat').innerText(),'1');
 assert.deepEqual(await p.evaluate(()=>['ai-practice-150-v1','ai-basics-300-v1','leetcode-hot100-python-v1'].map(k=>localStorage.getItem(k))),prior);
 for(const id of ['bank-ai','bank-basic','bank-hot100','bank-enterprise']){await p.locator('#bank-toggle').click();await p.locator('#'+id).click();assert.equal(await p.locator('.layout:visible').count(),1);}
 await p.setViewportSize({width:360,height:780});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:path.join(__dirname,'preview-enterprise-mobile.png')});
 // Real UI + mocked transport: per-question context and learning-assessment inclusion.
 await p.locator('#study-settings').click();await p.locator('#study-key').fill('fake-enterprise-key');await p.locator('#study-key-save').click();
 let request;await p.route('https://api.deepseek.com/chat/completions',r=>{request=r.request().postDataJSON();return r.fulfill({status:200,contentType:'text/event-stream',body:'data: '+JSON.stringify({choices:[{delta:{content:'企业专项：样本不足，先补测检索链路。'}}]})+'\n\ndata: [DONE]\n\n'});});
 await p.locator('#study-library').click();await p.locator('#study-assess').click();await p.locator('#assessment-generate').click();await p.waitForFunction(()=>document.getElementById('study-status').textContent.includes('评估完成'));
 const summary=JSON.parse(request.messages[1].content.split('\n').slice(1).join('\n'));assert.equal(summary.total.total,660);assert.equal(summary.total.answered,4);assert.equal(summary.modules.filter(m=>m.name.startsWith('企业决策')).length,7);assert.ok(summary.wrongExamples.some(q=>q.id==='enterprise:3'));assert.ok(!JSON.stringify(request).includes('private draft'));
 // Export includes the new record and chat; old backups and old packages remain valid.
 await p.locator('#assessment-settings').click();await p.locator('[data-settings-tab=backup]').click();
 const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('#study-backup').click()]);const backup=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
 assert.equal(Object.keys(backup.records['ai-enterprise-210-v1'].answers).length,2);assert.ok(backup.records['study-personal-v1'].chats['enterprise:1']);
 const validation=await p.evaluate(backup=>{
  StudyContracts.validateBackup(backup);
  const pkg={format:'ai-study-bank',schema:1,version:'legacy',ai:JSON.parse(document.getElementById('question-data').textContent),hot:JSON.parse(document.getElementById('hot100-data').textContent)};
  StudyContracts.validateBank(pkg);const count=pkg.enterprise.questions.length;
  const broken=structuredClone(pkg);broken.enterprise.questions.pop();let deletion=false;try{StudyContracts.validateBank(broken)}catch{deletion=true}
  pkg.enterprise.questions[0].refs='javascript:alert(1)';let unsafe=false;try{StudyContracts.validateBank(pkg)}catch{unsafe=true}return {count,deletion,unsafe};
 },backup);assert.deepEqual(validation,{count:210,deletion:true,unsafe:true});
 const fresh=await browser.newContext(),q=await fresh.newPage();await q.goto(url);await q.locator('#study-settings').click();await q.locator('[data-settings-tab=backup]').click();await q.locator('#study-restore').click();await q.locator('#study-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await q.locator('#study-apply').click();await q.waitForLoadState('load');await q.locator('#bank-toggle').click();await q.locator('#bank-enterprise').click();assert.equal(await q.locator('#e-doneStat').innerText(),'2');
 // Revised answers preserve historic grading instead of silently changing progress.
 const pkg=await q.evaluate(()=>({format:'ai-study-bank',schema:1,version:'test-revision',ai:JSON.parse(document.getElementById('question-data').textContent),hot:JSON.parse(document.getElementById('hot100-data').textContent),basics:JSON.parse(document.getElementById('basics-data').textContent),enterprise:JSON.parse(document.getElementById('enterprise-data').textContent)}));pkg.enterprise.questions[0].answer=data.questions[0].answer==='A'?'B':'A';
 await q.locator('#study-settings').click();await q.locator('[data-settings-tab=bank]').click();await q.locator('#study-bank-import').click();await q.locator('#study-file').setInputFiles({name:'bank.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await q.locator('#study-apply').click();await q.waitForLoadState('load');await q.locator('#bank-toggle').click();await q.locator('#bank-enterprise').click();await q.locator('#enterprise-root details').evaluateAll(ds=>ds.forEach(d=>d.open=true));await q.locator('#e-search').fill('E001');assert.match(await q.locator('.enterprise-revision').innerText(),/已修订/);
 assert.equal(await q.evaluate(()=>JSON.parse(localStorage.getItem('ai-enterprise-210-v1')).answers[1].correct),true);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: enterprise 210 questions, old-progress isolation, grading, mobile, AI context, assessment, backup round-trip, legacy packages and revision retention.');
})().catch(e=>{console.error(e);process.exit(1)});

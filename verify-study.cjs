const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});const ctx=await browser.newContext({viewport:{width:1360,height:960}}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
await page.locator('#study-ask').click();await page.locator('#study-input').fill('为什么？');await page.locator('#study-send').click();assert.match(await page.locator('#study-status').innerText(),/API Key/);
await page.locator('#study-chat-settings').click();await page.locator('#study-key').fill('test-only-not-a-real-secret');await page.locator('#study-key-save').click();assert.equal(await page.locator('#study-key').inputValue(),'');
assert.equal(await page.evaluate(()=>Object.values(localStorage).join('').includes('test-only')),false);
await page.route('https://api.deepseek.com/models',route=>route.fulfill({status:200,body:'{"data":[]}'}));await page.locator('#study-key-test').click();await page.getByText('连接成功，Key 有效。现在可以返回题目向 AI 提问。',{exact:true}).last().waitFor();
let captured;
await page.route('https://api.deepseek.com/chat/completions',async route=>{captured=route.request().postDataJSON();await route.fulfill({status:200,contentType:'text/event-stream',body:'data: '+JSON.stringify({choices:[{delta:{content:'先检查条件概率。\n```python\nprint("<safe>")\n```\n注意分母。'}}]})+'\n\ndata: [DONE]\n\n'})});
await page.locator('#study-close').click();await page.locator('#study-ask').click();await page.locator('[data-prompt]').first().click();await page.locator('#study-send').click();await page.locator('[data-note-message]').waitFor();
assert.equal(captured.messages[0].content.includes('正确答案：'),false);assert.equal(captured.messages[0].content.includes('知识点：'),false);
assert.equal(await page.locator('.study-message.assistant').count(),1);assert.match(await page.locator('.study-message.assistant').innerText(),/条件概率/);
await page.locator('[data-note-message]').click();await page.locator('#study-note-title').fill('贝叶斯与分母');await page.locator('#study-note-tags').fill('概率, 易错点');await page.locator('#study-note-save').click();await page.locator('#study-search').fill('分母');assert.equal(await page.locator('[data-edit-note]').count(),1);
await page.locator('[data-edit-note]').click();await page.locator('#study-note-body').fill('自己的理解：先统计全部被标记的内容。');await page.locator('#study-note-state').selectOption('已掌握');await page.locator('#study-note-save').click();
await page.locator('#study-close').click();await page.locator('#study-settings').click();
await page.locator('[data-settings-tab=backup]').click();const [backupDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#study-backup').click()]);const backup=JSON.parse(fs.readFileSync(await backupDownload.path(),'utf8'));assert.equal(JSON.stringify(backup).includes('test-only-not-a-real-secret'),false);assert.equal(backup.records['study-personal-v1'].notes.length,1);
await page.reload();await page.locator('#study-library').click();assert.equal(await page.locator('[data-edit-note]').count(),1);await page.locator('[data-chat]').click();assert.equal(await page.locator('.study-message').count(),2);
await page.locator('#study-close').click();await page.locator('#study-settings').click();await page.locator('#study-key').fill('test-only-not-a-real-secret');await page.locator('#study-key-save').click();await page.locator('#study-close').click();await page.locator('#study-ask').click();
await page.unroute('https://api.deepseek.com/chat/completions');await page.route('https://api.deepseek.com/chat/completions',r=>r.fulfill({status:401,body:'{}'}));await page.locator('#study-input').fill('继续');await page.locator('#study-send').click();await page.getByText('API Key 无效或已失效，请在设置中更换。',{exact:true}).waitFor();
await page.locator('#study-close').click();await page.locator('#study-settings').click();
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'release/题库包-2026.09.09.1.json'),'utf8'));
const malicious=structuredClone(bank);malicious.ai.questions[0].page='<img src=x onerror=alert(1)>';
assert.match(await page.evaluate(b=>{try{StudyContracts.validateBank(b);return 'accepted'}catch(e){return e.message}},malicious),/格式有误/);
assert.match(await page.evaluate(()=>{try{StudyContracts.validateBackup({format:'ai-study-backup',schema:1,records:{'study-personal-v1':{schema:1,chats:{},notes:[{body:'x'}]}}});return 'accepted'}catch(e){return e.message}}),/笔记格式/);
const old=await page.evaluate(()=>localStorage.getItem('ai-practice-150-v1'));
const next=structuredClone(bank);next.version='test-update-2';next.ai.questions.push({...next.ai.questions[0],id:151,stem:'新加入的测试题'});next.ai.questions[0].answer='A';
await page.evaluate(()=>localStorage.setItem('ai-practice-150-v1',JSON.stringify({answers:{1:{choice:'B',correct:true}},saved:[1],current:1})));
await page.locator('[data-settings-tab="bank"]').click();await page.locator('#study-bank-import').click();await page.locator('#study-file').setInputFiles({name:'bank.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(next))});await page.locator('#study-apply').click();await page.waitForLoadState('load');assert.equal(await page.locator('#grid button').count(),151);assert.equal(await page.locator('#doneStat').innerText(),'1');assert.equal(await page.locator('#wrongStat').innerText(),'0');assert.equal(await page.locator('#allCount').innerText(),'151');assert.match(await page.locator('#study-revision').innerText(),/当时答案 B，现答案 A/);
// Fresh browser receives original browser backup, including personal notes.
const fresh=await ctx.newPage();await fresh.goto(pathToFileURL(path.join(__dirname,'index.html')).href); // file origin shares within this context; use a new context below.
await fresh.close();const newCtx=await browser.newContext(),newPage=await newCtx.newPage();await newPage.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await newPage.locator('#study-settings').click();await newPage.locator('[data-settings-tab="backup"]').click();await newPage.locator('#study-restore').click();await newPage.locator('#study-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await newPage.locator('#study-apply').click();await newPage.waitForLoadState('load');await newPage.locator('#study-library').click();assert.equal(await newPage.locator('[data-edit-note]').count(),1);await newCtx.close();
await page.setViewportSize({width:390,height:844});await page.locator('#study-library').click();await page.screenshot({path:path.join(__dirname,'preview-study-mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
assert.deepEqual(errors,[]);
// Exercise streaming chunks split across UTF-8 and line boundaries.
const sse=await page.evaluate(async()=>{const bytes=new TextEncoder().encode('data: {"choices":[{"delta":{"content":"中文"}}]}\n\ndata: [DONE]\n\n');let out='';const stream=new ReadableStream({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close()}});await StudyContracts.readSSE(stream,x=>out+=x);return out});assert.equal(sse,'中文');
console.log('PASS: AI context isolation, no stored/exported API key, streamed answer, note create/edit/search, chat reload, 401 handling, malicious package rejection, bank update preserving historical scores, backup import, mobile layout and split UTF-8 SSE.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

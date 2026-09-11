const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[],remote=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().startsWith('http'))remote.push(r.url());});
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 assert.equal(await p.locator('#bank-drawer').isVisible(),false);
 await p.locator('#bank-toggle').click();assert.equal(await p.locator('#bank-drawer').isVisible(),true);assert.equal(await p.locator('#bank-toggle').getAttribute('aria-expanded'),'true');
 await p.screenshot({path:path.join(__dirname,'preview-sidebar-mobile.png')});
 await p.keyboard.press('Escape');assert.equal(await p.locator('#bank-drawer').isVisible(),false);
 await p.locator('#bank-toggle').click();assert.equal(await p.evaluate(()=>StudyBack()),true);assert.equal(await p.locator('#bank-drawer').isVisible(),false);
 for(const bank of ['basic','enterprise','hot100','ai']){await p.locator('#bank-toggle').click();await p.locator('#bank-'+bank).click();assert.equal(await p.locator('#bank-drawer').isVisible(),false);assert.equal(await p.locator('.layout:visible').count(),1);}
 // Question and explanation math: offline fonts, fractions, matrix and malformed input.
 await p.evaluate(()=>{QS[0].stem=String.raw`计算 \(x^2\) 与 \[\frac{1}{2}+\sqrt{4}\]`;QS[0].explanation=String.raw`矩阵：$$\begin{pmatrix}1&2\\3&4\end{pmatrix}$$`;load();});
 await p.waitForFunction(()=>document.querySelectorAll('#question .katex').length===2);
 await p.locator('[data-choice=B]').click();await p.locator('#submit').click();await p.waitForFunction(()=>document.querySelectorAll('#question .katex').length>=3);
 await p.evaluate(()=>document.fonts.ready);assert.deepEqual(remote,[]);assert.ok(await p.evaluate(()=>document.fonts.check('16px KaTeX_Main')));
 await p.screenshot({path:path.join(__dirname,'preview-math-question.png')});
 const prior=await p.evaluate(()=>localStorage.getItem('ai-practice-150-v1'));
 // The HTTPS update path accepts the generated custom format without replacing the app.
 const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'quiz-bank-')),out=path.join(tmp,'bank.json');require('node:child_process').execFileSync(process.env.PYTHON_EXECUTABLE||'python',[path.join(__dirname,'build_custom_bank.py'),'--base',path.join(__dirname,'bank.json'),'--input',path.join(__dirname,'custom-questions.example.json'),'--target','enterprise','--version','test-custom-001','--output',out]);const pkg=JSON.parse(fs.readFileSync(out,'utf8'));
 await p.route('https://example.test/my-bank.json',r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(pkg)}));
 await p.locator('#study-settings').click();await p.locator('[data-settings-tab=bank]').click();await p.locator('#study-update-url').fill('https://example.test/my-bank.json');await p.locator('#study-update-check').click();await p.locator('#study-apply').click();await p.waitForLoadState('load');
 assert.deepEqual(JSON.parse(await p.evaluate(()=>localStorage.getItem('ai-practice-150-v1'))),JSON.parse(prior));
 await p.locator('#bank-toggle').click();await p.locator('#bank-enterprise').click();await p.locator('#enterprise-root details').evaluateAll(ds=>ds.forEach(d=>d.open=true));await p.locator('#e-search').fill('E211');await p.waitForFunction(()=>document.querySelector('#e-question .katex'));assert.equal(await p.locator('#e-allCount').innerText(),'211');
 await p.locator('#study-settings').click();await p.locator('[data-settings-tab=api]').click();await p.locator('#study-key').fill('fake-math-key');await p.locator('#study-key-save').click();await p.locator('#study-practice').click();await p.locator('#enterprise-ask-ai').click();
 const reply=String.raw`行内 \(E=mc^2\)，分式 $$\frac{a}{b}$$ 和 $x^2$。
代码示例：`+'`$not_math$`\n```python\nx = "$not_math$"\n```\n'+String.raw`不完整 \(x+ 与错误 \(\notACommand{a}\) <img src=x onerror=alert(1)> \(\href{javascript:alert(1)}{bad}\)`;
 let payload;await p.route('https://api.deepseek.com/chat/completions',r=>{payload=r.request().postDataJSON();return r.fulfill({status:200,contentType:'text/event-stream',body:'data: '+JSON.stringify({choices:[{delta:{content:reply}}]})+'\n\ndata: [DONE]\n\n'});});
 await p.locator('#study-input').fill('请用公式解释');await p.locator('#study-send').click();await p.waitForFunction(()=>document.querySelectorAll('.study-message.assistant .katex').length>=3);
 assert.equal(await p.locator('.study-code .katex').count(),0);assert.match(await p.locator('.study-code').innerText(),/not_math/);assert.equal(await p.locator('.study-message img,.study-message a[href^="javascript:"]').count(),0);
 assert.ok(payload.messages[0].content.includes('LaTeX'));
 const raw=await p.evaluate(()=>JSON.parse(localStorage.getItem('study-personal-v1')).chats['enterprise:211'].messages.at(-1).content);assert.equal(raw,reply);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(__dirname,'preview-math-chat.png')});
 await p.reload();await p.locator('#bank-toggle').click();await p.locator('#bank-enterprise').click();await p.locator('#enterprise-ask-ai').click();await p.waitForFunction(()=>document.querySelectorAll('.study-message.assistant .katex').length>=3);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: collapsible sidebar/back, offline question/chat math, raw persistence, code exclusion, unsafe math rejection, HTTPS custom update and mobile layout.');
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true}),p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await p.evaluate(()=>{for(const k of ['ai-practice-150-v1','ai-basics-300-v1','ai-enterprise-210-v1'])localStorage.setItem(k,JSON.stringify({answers:{1:{choice:'A',correct:false}},saved:[2],current:20}));});await p.reload();
 const toggle=await p.locator('#bank-toggle').boundingBox();assert.ok(toggle.x<30&&toggle.height>=44);
 for(const [bank,prefix,attr]of [['ai','',''],['basic','b-','b-'],['enterprise','e-','e-']]){
  if(bank!=='ai'){await p.locator('#bank-toggle').click();await p.locator('#bank-'+bank).click();}
  const current=()=>p.locator('#'+prefix+'grid [aria-current]').getAttribute('data-'+attr+'id');
  assert.equal(await current(),'20');await p.locator('[data-'+attr+'mode="wrong"]').click();assert.equal(await current(),'1');await p.locator('[data-'+attr+'mode="saved"]').click();assert.equal(await current(),'2');await p.locator('[data-'+attr+'mode="all"]').click();assert.equal(await current(),'20');
 }
 await p.locator('#enterprise-ask-ai').click();const original=await p.locator('#study-dialog').boundingBox();assert.ok(original.height<=260&&original.y>450);
 await p.locator('#study-input').fill('保持未发送草稿');
 // Overlay keyboard: layout viewport stays tall, visual viewport shrinks.
 await p.evaluate(()=>{const v=new EventTarget();v.height=460;v.offsetTop=0;Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.dispatchEvent(new Event('resize'));});
 const input=await p.locator('#study-input').boundingBox(),sheet=await p.locator('#study-dialog').boundingBox();assert.ok(input.y+input.height<=460);assert.ok(sheet.y<original.y&&sheet.y+sheet.height<=460);assert.equal(await p.locator('#study-input').inputValue(),'保持未发送草稿');
 await p.screenshot({path:path.join(__dirname,'preview-keyboard-overlay.png')});
 await p.evaluate(()=>{window.visualViewport.height=844;window.dispatchEvent(new Event('resize'));});assert.ok((await p.locator('#study-dialog').boundingBox()).y>=original.y-1);
 // Native adjust-resize: both viewports shrink together.
 await p.setViewportSize({width:390,height:480});await p.evaluate(()=>{window.visualViewport.height=480;window.dispatchEvent(new Event('resize'));});const resized=await p.locator('#study-input').boundingBox();assert.ok(resized.y>=0&&resized.y+resized.height<=480);assert.equal(await p.locator('#study-input').inputValue(),'保持未发送草稿');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: left menu target, independent all/wrong/saved positions in three banks, low sheet, overlay/resized keyboard accommodation and preserved input.');
})().catch(e=>{console.error(e);process.exit(1)});

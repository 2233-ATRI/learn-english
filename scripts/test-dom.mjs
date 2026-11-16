import {JSDOM,VirtualConsole} from 'jsdom';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const errors=[],exports=[],files=[];let saved=null;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS stylesheet|Not implemented:/.test(e.message))errors.push(e.message);});vc.on('error',e=>errors.push(String(e)));
function create(native=true){return new JSDOM(html,{url:'https://shici-tests.invalid/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 Object.assign(w,{TextEncoder,TextDecoder,structuredClone,ResizeObserver:class{observe(){}disconnect(){}},indexedDB:new IDBFactory(),IDBKeyRange});
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.getBoundingClientRect=()=>({x:200,y:180,left:200,top:180,right:330,bottom:212,width:130,height:32});
 w.URL.createObjectURL=()=>'blob:local';w.URL.revokeObjectURL=()=>{};
 if(native)w.ShiciHost={postMessage(raw){const r=JSON.parse(raw);let result={};if(r.method==='readWorkspace')result=saved;if(r.method==='saveWorkspace'){saved=r.payload.data;result={saved:true};}if(r.method==='chooseFiles')result=files.shift()||[];if(r.method==='exportFile'){exports.push(r.payload);result={saved:true};}setTimeout(()=>w.__shiciReply({id:r.id,ok:true,result}),0);}};
 }});}
let dom=create(),w=dom.window,d=w.document;
async function until(fn,label){for(let i=0;i<80;i++){if(fn())return;await wait(40);}throw Error('Timeout: '+label+' '+errors.join('; '));}
async function click(sel){const e=d.querySelector(sel);assert.ok(e,'Missing '+sel);e.click();await wait(40);}
async function button(text){const e=[...d.querySelectorAll('button')].find(e=>e.textContent.trim()===text||e.getAttribute('aria-label')===text);assert.ok(e,'Missing button '+text);e.click();await wait(60);}
async function value(sel,text){const e=d.querySelector(sel);assert.ok(e);const proto=e.tagName==='TEXTAREA'?w.HTMLTextAreaElement.prototype:e.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,text);e.dispatchEvent(new w.Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait(60);}
await until(()=>d.querySelector('.lesson-card'),'library');assert.equal(d.querySelectorAll('.lesson-card').length,74);
await button('低词汇量做题法');assert.equal(d.querySelectorAll('.technique-list li').length,7);await button('关闭弹窗');
await button('历年真题');assert.equal(d.querySelectorAll('.lesson-card').length,68);
await value('select[aria-label="筛选年份"]','2026');assert.equal(d.querySelectorAll('.lesson-card').length,4);
await value('select[aria-label="筛选年份"]','all');await button('原创练习');assert.equal(d.querySelectorAll('.lesson-card').length,6);
await button('查看阅读导读');assert.ok(d.querySelector('.summary-box').textContent.includes('阅读'));assert.equal(d.querySelectorAll('.tip-grid article').length,3);
await button('开始阅读与答题');await until(()=>d.querySelector('.article-body'),'reader');
assert.equal(d.querySelectorAll('.question-strategy').length,0);await click('.question .hint-toggle');assert.equal(d.querySelectorAll('.locating-hint').length,1);assert.equal(d.querySelectorAll('.strategy-options').length,0);await click('.question .anchor-chip');await wait(100);assert.ok(d.querySelectorAll('.located-word').length>0);assert.equal(d.querySelector('.reader-grid').dataset.mobile,'article');await button('返回这道题');assert.equal(d.querySelector('.reader-grid').dataset.mobile,'questions');
await click('.word[aria-label="查词 Many"]');assert.equal(d.querySelectorAll('.word-popover').length,1);assert.match(d.querySelector('.definition').textContent,/许多/);
await click('.word[aria-label="查词 Many"]');assert.equal(d.querySelector('.word-popover'),null);
await click('.word[aria-label="查词 people"]');await button('收藏生词');await wait(400);assert.ok(JSON.parse(saved).words.people);await click('button[aria-label="关闭释义"]');
await click('.translation-toggle');assert.ok(d.querySelector('.translation'));await click('.translation-toggle');assert.equal(d.querySelector('.translation'),null);
for(const [i,a] of ['A','C','A','D','B'].entries())await click('button[aria-label="第'+(i+1)+'题选'+a+'"]');
await button('提交并查看解析');assert.ok(d.querySelector('.result-banner').textContent.includes('4'));assert.equal(d.querySelectorAll('.explanation').length,5);assert.equal(d.querySelectorAll('.question-strategy').length,5);assert.equal(d.querySelectorAll('.strategy-option').length,20);await click('.evidence-card .btn');await wait(100);assert.ok(d.querySelectorAll('.located-word').length>2);await button('返回这道题');
await wait(400);assert.equal(JSON.parse(saved).attempts.length,1);assert.equal(JSON.parse(saved).attempts[0].assisted,true);
await button('错题回看');assert.equal(d.querySelectorAll('.mistake-list article').length,1);await click('.mistake-strategy summary');assert.equal(d.querySelectorAll('.mistake-strategy .strategy-option').length,4);
await button('我的生词');assert.equal(d.querySelectorAll('.vocab-list article').length,1);await button('复习 1 个词');await button('查看释义');await button('认识，继续');assert.equal(d.querySelector('.modal'),null);
await button('阅读设置');await button('夜读');assert.equal(d.documentElement.dataset.theme,'dark');await button('导出完整备份');assert.equal(exports.length,1);const backup=JSON.parse(Buffer.from(exports[0].data,'base64'));assert.equal(backup.attempts.length,1);
files.push([{name:'backup.json',data:Buffer.from(JSON.stringify(backup)).toString('base64')}]);await button('恢复备份');await until(()=>d.querySelector('.modal'),'restore dialog');await button('确认恢复');
await button('阅读训练');await button('导入资料');await button('完整题库 JSON');
const bad=JSON.stringify({lessons:[{id:'__proto__',title:'Bad',paragraphs:[{en:'Bad',zh:''}],questions:[]}]});await value('.json-input',bad);await button('导入书架');assert.ok(d.querySelector('[role="alert"]').textContent.includes('id'));
const lesson={id:'user-safety',title:'<img src=x onerror=alert(1)>',paragraphs:[{en:'<script>window.pwned=true</script> Many people read every day.',zh:''}],questions:[],summary:'自定义导读：从生活里的一个问题开始阅读。',tips:[],structure:[],kind:'practice'};
await value('.json-input',JSON.stringify({lessons:[lesson]}));await button('导入书架');assert.equal(d.querySelector('.modal'),null);assert.equal(d.querySelectorAll('.lesson-card').length,75);assert.equal(w.pwned,undefined);assert.equal(d.querySelector('.lesson-card img'),null);
await wait(500);assert.equal(JSON.parse(saved).customLessons.length,1);dom.window.close();
dom=create();w=dom.window;d=w.document;await until(()=>d.querySelector('.lesson-card'),'reopen');assert.equal(d.querySelectorAll('.lesson-card').length,75);await until(()=>d.documentElement.dataset.theme==='dark','restored theme');await button('学习记录');assert.equal(d.querySelectorAll('.record-list article').length,1);dom.window.close();
dom=create(false);w=dom.window;d=w.document;await until(()=>d.querySelector('.lesson-card'),'browser IndexedDB path');await wait(500);assert.equal(d.querySelectorAll('.lesson-card').length,74);dom.window.close();
saved=null;dom=create();w=dom.window;d=w.document;
await until(()=>d.querySelector('.lesson-card'),'disputed lesson library');
await value('select[aria-label="筛选年份"]','2025');await click('.lesson-card:nth-child(2)');
assert.match(d.querySelector('.answer-notice').textContent,/暂不计分/);await button('开始阅读与答题');
for(const [i,a] of ['B','C','C','B','D'].entries())await click('button[aria-label="第'+(i+26)+'题选'+a+'"]');
await button('提交并查看解析');assert.match(d.querySelector('.result-banner strong').textContent,/4\s*\/\s*4/);
assert.match(d.querySelectorAll('.question')[4].textContent,/参考答案有疑义/);assert.equal(d.querySelectorAll('.question')[4].querySelectorAll('.strategy-option.keep').length,0);
await button('再练一次');await button('开始新一轮');assert.equal(d.querySelectorAll('[role="radio"][aria-checked="true"]').length,0);assert.equal(d.querySelectorAll('.locating-hint').length,0);assert.equal(d.querySelectorAll('.located-word').length,0);
await wait(450);assert.equal(JSON.parse(saved).attempts.length,1);
await button('提交并查看解析');assert.ok(d.querySelector('.modal'));await button('提交本次练习');
await button('错题回看');assert.equal(d.querySelectorAll('.mistake-list article').length,4);
await wait(450);assert.equal(JSON.parse(saved).attempts.length,2);dom.window.close();
assert.deepEqual(errors,[]);
console.log('PASS: browser + native-bridge DOM flows; filtering, intro, tap/tap-close, vocabulary, translation, grading, mistakes, review, theme, backup/restore, import validation, XSS escaping, reopen persistence; strategy primer, pre-answer hint without choices, anchor/quote highlighting, return-to-question, 4-option reasons in reader and mistake review; disputed answer excluded, redo preserves history, incomplete submission confirmation. No HTTP service or device connection used.');

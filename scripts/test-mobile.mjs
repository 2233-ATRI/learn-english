// Interaction tests with simulated viewports and an in-memory Android bridge.
// JSDOM does not render pixels; device/browser visual checks remain separate.
import {JSDOM,VirtualConsole} from 'jsdom';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {initialState} from '../src/core.js';
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const errors=[],checks=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!/Could not parse CSS stylesheet|Not implemented:/.test(e.message))errors.push(e.message);});
vc.on('error',e=>errors.push(String(e)));
function create(width=360,height=780,initial=null){
 let saved=initial,resize;
 const dom=new JSDOM(html,{url:'https://mobile-tests.invalid/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.assign(w,{TextEncoder,TextDecoder,structuredClone,ResizeObserver:class{observe(){}disconnect(){}}});
  Object.defineProperty(w,'innerWidth',{value:width,writable:true});Object.defineProperty(w,'innerHeight',{value:height,writable:true});
  const media=[];
  const matches=()=>w.innerWidth<=760||(w.innerHeight<=500&&w.innerWidth<=1000);
  w.matchMedia=query=>{const listeners=new Set(),m={media:query,matches:matches(),addEventListener(type,fn){if(type==='change')listeners.add(fn);},removeEventListener(type,fn){listeners.delete(fn);}};media.push({m,listeners});return m;};
  resize=(nextWidth,nextHeight)=>{w.innerWidth=nextWidth;w.innerHeight=nextHeight;for(const {m,listeners} of media){const next=matches();if(next!==m.matches){m.matches=next;for(const fn of listeners)fn({matches:next,media:m.media});}}w.dispatchEvent(new w.Event('resize'));};
  w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.lastScrollTarget='true';};
  w.HTMLElement.prototype.getBoundingClientRect=()=>({x:30,y:180,left:30,top:180,right:100,bottom:208,width:70,height:28});
  w.ShiciHost={postMessage(raw){const r=JSON.parse(raw);let result={};if(r.method==='readWorkspace')result=saved;if(r.method==='saveWorkspace'){saved=r.payload.data;result={saved:true};}setTimeout(()=>w.__shiciReply({id:r.id,ok:true,result}),0);}};
 }});
 return {dom,w:dom.window,d:dom.window.document,resize,getSaved:()=>saved};
}
let app=create(),w=app.w,d=app.d;
async function until(fn,label){for(let i=0;i<120;i++){if(fn())return;await wait(25);}throw Error('Timeout: '+label+' '+errors.join('; '));}
async function click(selector,root=d){const el=root.querySelector(selector);assert.ok(el,'Missing '+selector);assert.ok(!el.disabled,'Disabled '+selector);el.click();await wait(40);return el;}
async function button(label,root=d){const el=[...root.querySelectorAll('button')].find(e=>e.getAttribute('aria-label')===label||e.textContent.trim()===label);assert.ok(el,'Missing '+label);assert.ok(!el.disabled,'Disabled '+label);el.click();await wait(40);return el;}
function visibleQuestion(){const questions=[...d.querySelectorAll('.question')].filter(q=>!q.hidden);assert.equal(questions.length,1);return questions[0];}
async function openFirst(){await until(()=>d.querySelector('.lesson-card'),'library');await button('查看阅读导读');await click('.intro-actions .btn');await until(()=>d.querySelector('.reader'),'reader');}
await openFirst();assert.equal(d.querySelector('.reader').dataset.compact,'true');assert.equal(visibleQuestion().id,'question-0');
const article=d.querySelector('.article-pane');article.scrollTop=438;article.dispatchEvent(new w.Event('scroll'));
await click('.reader-mobile-tabs button:nth-child(2)');article.scrollTop=0;
await click('.reader-mobile-tabs button:first-child');assert.equal(article.scrollTop,438,'restore original reading position');
await click('.article-pane .word');assert.ok(d.querySelector('.word-popover'));article.dispatchEvent(new w.Event('scroll'));assert.ok(d.querySelector('.word-popover'),'mobile scrolling keeps definition available');
await click('.article-pane .word');assert.equal(d.querySelector('.word-popover'),null,'same word toggles definition');
await click('.article-pane .word');assert.equal(w.__shiciBack(),true);await wait(40);assert.equal(d.querySelector('.word-popover'),null);assert.ok(d.querySelector('.reader'));
await button('阅读工具');const fontBefore=Number(d.querySelector('.reader-font-tools b').textContent.replace('px',''));
await button('增大字号',d.querySelector('.modal'));assert.equal(d.querySelector('.reader-font-tools b').textContent,(fontBefore+1)+'px');
assert.equal(w.__shiciBack(),true);await wait(40);assert.equal(d.querySelector('.modal'),null);assert.ok(d.querySelector('.reader'));
await click('.reader-mobile-tabs button:nth-child(2)');await button('第1题选A',visibleQuestion());assert.equal(visibleQuestion().id,'question-0','answer does not unexpectedly advance');
await button('下一题',d.querySelector('.question-pager'));assert.equal(visibleQuestion().id,'question-1');
await button('第2题选C',visibleQuestion());await button('下一题',d.querySelector('.question-pager'));assert.equal(visibleQuestion().id,'question-2');
await click('.hint-toggle',visibleQuestion());assert.equal(visibleQuestion().querySelectorAll('.strategy-options').length,0,'hint does not reveal answer');
await click('.anchor-chip',visibleQuestion());assert.equal(d.querySelector('.reader-grid').dataset.mobile,'article');assert.ok(d.querySelector('.located-word'));
await button('返回这道题');assert.equal(visibleQuestion().id,'question-2');assert.equal(d.querySelector('.reader-grid').dataset.mobile,'questions');
await button('打开答题卡');assert.equal(d.querySelectorAll('.answer-card-item').length,5);assert.equal(d.querySelectorAll('.answer-card-item.answered').length,2);
await button('跳到第 5 题，未作答');assert.equal(visibleQuestion().id,'question-4');assert.equal(d.querySelector('.modal'),null);
await button('交卷',d.querySelector('.question-pager'));assert.match(d.querySelector('.modal p').textContent,/还有 3 道/);
await button('继续作答',d.querySelector('.modal'));assert.equal(d.querySelector('.result-banner'),null);
await button('上一题',d.querySelector('.question-pager'));await button('第4题选D',visibleQuestion());
await button('上一题',d.querySelector('.question-pager'));await button('第3题选A',visibleQuestion());
await button('打开答题卡');await button('跳到第 5 题，未作答');await button('第5题选C',visibleQuestion());
assert.equal(w.__shiciBack(),true);await wait(40);assert.equal(d.querySelector('.reader-grid').dataset.mobile,'article','Android back returns from questions to original');
await click('.reader-mobile-tabs button:nth-child(2)');assert.equal(visibleQuestion().id,'question-4');
await button('交卷',d.querySelector('.question-pager'));assert.equal(d.querySelector('.modal'),null);assert.ok(d.querySelector('.result-banner'));assert.equal(visibleQuestion().id,'question-0');
assert.equal(visibleQuestion().querySelectorAll('.strategy-option').length,4);
assert.match(d.querySelector('.result-banner strong').textContent,/3\s*\/\s*5/);
await button('打开答题卡');assert.equal(d.querySelectorAll('.answer-card-item.right').length,3);assert.equal(d.querySelectorAll('.answer-card-item.wrong').length,2);await button('跳到第 3 题，正确');
await click('.evidence-card .btn',visibleQuestion());await button('返回这道题');assert.equal(visibleQuestion().id,'question-2');
app.resize(1280,800);await wait(60);assert.equal(d.querySelector('.reader').dataset.compact,'false');assert.equal(d.querySelectorAll('.question:not([hidden])').length,5);
app.resize(844,390);await wait(60);assert.equal(d.querySelector('.reader').dataset.compact,'true');assert.equal(visibleQuestion().id,'question-2');
await w.__shiciFlush();let saved=app.getSaved(),parsed=JSON.parse(saved);assert.equal(parsed.attempts.length,1);assert.deepEqual(parsed.attempts[0].answers,[0,2,0,3,2]);
assert.equal(parsed.settings.fontSize,fontBefore+1);checks.push('phone navigation, position restoration, word toggle, tools, incomplete confirmation, scoring, evidence return, Android back, tablet/landscape resize and persistence');
app.dom.window.close();
for(const [width,height] of [[320,640],[360,780],[393,852],[412,915],[600,960],[844,390]]){
 app=create(width,height,saved);w=app.w;d=app.d;
 await until(()=>d.querySelector('.lesson-card'),'reopened library');await button('原创练习');await click('.lesson-card');await click('.intro-actions .btn');
 await until(()=>d.querySelector('.reader'),'reopened reader');assert.equal(d.querySelector('.reader').dataset.compact,'true');
 assert.ok(d.querySelector('.result-banner'));assert.equal(visibleQuestion().querySelectorAll('.strategy-option').length,4);
 assert.equal(d.querySelectorAll('[role="radio"][aria-checked="true"]').length,5);
 checks.push(width+'×'+height+': restored answers and single-question mode');app.dom.window.close();
}
// Restore an old version-1 backup with a partly completed paper and user vocabulary.
const legacy=initialState();legacy.drafts['reading-habit']={answers:[0,2],seconds:123,assisted:true,submitted:false};
legacy.words.example={word:'example',meaning:'例子',context:'An example.',title:'旧版词条',level:1,due:0};
app=create(360,780,JSON.stringify(legacy));w=app.w;d=app.d;
await until(()=>d.querySelector('.lesson-card'),'legacy library');await button('继续阅读');await click('.intro-actions .btn');
assert.equal(visibleQuestion().id,'question-2','resume at first unanswered question');
await w.__shiciFlush();assert.ok(JSON.parse(app.getSaved()).words.example);assert.equal(JSON.parse(app.getSaved()).drafts['reading-habit'].seconds,123);
app.dom.window.close();checks.push('old backup resumes first unanswered question and preserves vocabulary');
// A text-only imported lesson has no question pager or invalid question index.
const textOnly=initialState();textOnly.customLessons=[{id:'phone-text-only',title:'手机精读',englishTitle:'Read on your phone',kind:'custom',paragraphs:[{en:'Read a little every day.',zh:''}],questions:[],summary:'手机上的短篇精读。',tips:[],structure:[]}];
app=create(320,640,JSON.stringify(textOnly));w=app.w;d=app.d;await until(()=>d.querySelectorAll('.lesson-card').length===75,'text-only library');
await click('.lesson-card:last-child');await click('.intro-actions .btn');await click('.reader-mobile-tabs button:nth-child(2)');assert.equal(d.querySelector('.question-pager'),null);assert.match(d.querySelector('.question-pane .empty').textContent,/这篇用于精读/);
app.dom.window.close();checks.push('imported article without questions');
// Disputed answers remain ungraded in both the score and the mobile answer card.
app=create(360,780);w=app.w;d=app.d;await until(()=>d.querySelector('.lesson-card'),'disputed library');
const target=[...d.querySelectorAll('.lesson-card')].find(c=>/2025 年真题 · Text 2/.test(c.textContent));assert.ok(target);target.click();await wait(40);await click('.intro-actions .btn');
await click('.reader-mobile-tabs button:nth-child(2)');await button('打开答题卡');await button('提交并查看解析',d.querySelector('.modal'));await button('提交本次练习',d.querySelector('.modal'));
assert.match(d.querySelector('.result-banner strong').textContent,/0\s*\/\s*4/);await button('打开答题卡');const disputed=d.querySelectorAll('.answer-card-item')[4];assert.match(disputed.textContent,/待复核/);assert.ok(!disputed.classList.contains('wrong'));assert.ok(!disputed.classList.contains('right'));
app.dom.window.close();checks.push('disputed question excluded from mobile grading');
assert.deepEqual(errors,[]);await fs.mkdir(new URL('../build/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../build/mobile-checks.json',import.meta.url),JSON.stringify({date:'2026-11-19',method:'JSDOM simulated viewport and Android bridge; no pixel layout or physical device test',checks},null,2)+'\n');
console.log('PASS: '+checks.length+' mobile flow checks; simulated widths 320, 360, 393, 412, 600 and landscape 844; tablet resize, legacy backup, text-only article and disputed answer.');

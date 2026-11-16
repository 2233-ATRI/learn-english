// Read only: exercise the exact HTML embedded in the delivered APK with an
// in-memory native bridge. No browser, HTTP service, device or user data access.
import {JSDOM,VirtualConsole} from 'jsdom';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const apk=new URL('../releases/拾词英语二-1.1.0-Android.apk',import.meta.url);
const html=execFileSync('/usr/bin/unzip',['-p',decodeURIComponent(apk.pathname),'assets/index.html'],{maxBuffer:32*1024*1024}).toString('utf8');
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>{if(!/Could not parse CSS stylesheet|Not implemented:/.test(e.message))errors.push(e.message);});
const dom=new JSDOM(html,{url:'https://offline-audit.invalid/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 Object.assign(w,{TextEncoder,TextDecoder,structuredClone,ResizeObserver:class{observe(){}disconnect(){}}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.ShiciHost={postMessage(raw){const r=JSON.parse(raw);setTimeout(()=>w.__shiciReply({id:r.id,ok:true,result:r.method==='readWorkspace'?null:{saved:true}}),0);}};
}});
const d=dom.window.document,wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<200;i++){if(fn())return;await wait(10);}throw Error('Timeout: '+label);}
async function button(text){const e=[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===text||b.getAttribute('aria-label')===text);assert.ok(e,text);e.click();}
await until(()=>d.querySelectorAll('.lesson-card').length===74,'initial library');
const results=[];
for(let i=0;i<74;i++){
 const card=d.querySelectorAll('.lesson-card')[i],meta=card.querySelector('.card-meta span').textContent,title=card.querySelector('h3').textContent;
 const m=meta.match(/(20\d\d).*Text\s*(\d)/);card.click();
 await until(()=>d.querySelector('.intro-actions'),'intro');
 d.querySelector('.intro-actions .btn.primary').click();
 await until(()=>d.querySelectorAll('.question').length===5,'questions');
 await button('提交并查看解析');await until(()=>d.querySelector('.modal'),'incomplete confirmation');await button('提交本次练习');
 await until(()=>d.querySelectorAll('.explanation').length===5,'graded answers');
 const questions=[...d.querySelectorAll('.question')].map(q=>{
  const number=Number(q.querySelector('.question-label span').textContent.match(/\d+/)[0]);
  const answer=q.querySelector('.option.correct .option-letter')?.textContent||null;
  const unscored=q.querySelector('.question-label').textContent.includes('答案待复核');
  const reference=unscored?q.querySelector('.answer-notice')?.textContent.match(/参考答案为\s*([ABCD])/)?.[1]||null:null;
  return {number,answer,referenceAnswer:reference,disputed:unscored,stem:q.querySelector('.question-stem').textContent,options:[...q.querySelectorAll('.options .option>.english')].map(x=>x.textContent)};
 });
 results.push({year:m?Number(m[1]):null,textNumber:m?Number(m[2]):null,title,questions});
 await button('阅读训练');await until(()=>d.querySelectorAll('.lesson-card').length===74,'return to library');
}
dom.window.close();assert.deepEqual(errors,[]);
const output={apk:decodeURIComponent(apk.pathname),htmlSHA256:crypto.createHash('sha256').update(html).digest('hex'),lessons:results};
await fs.mkdir(new URL('../build/answer-audit-2026-11-14/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../build/answer-audit-2026-11-14/released-ui-answers.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log('Read all 370 displayed answer keys from the delivered 1.1.0 APK, using isolated in-memory test data.');

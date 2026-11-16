import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {builtinLessons,strategyGuides,practiceLessons} from '../src/lessons.js';
import {validateLesson,validateBank,validateBackup,initialState,validateStrategy} from '../src/core.js';
const counts={},types={},quotes=[];
let total=0;
for(const l of builtinLessons){
 const checked=validateLesson(l);
 for(const [i,q] of checked.questions.entries()){
  const key=l.id+'-q'+(q.number||i+1),g=q.strategy;
  assert.ok(g,key+' missing strategy');assert.deepEqual(g,strategyGuides[key],key+' lost strategy fields');
  assert.ok(g.locate.length>=20&&g.reasoning.length>=20,key+' needs concrete steps');
  assert.ok(!/(?:选|保留|答案[为是])\s*[ABCD](?:\b|项)/.test(g.locate),key+' pre-answer hint leaks answer letter');
  assert.equal(new Set(g.options).size,4,key+' repeated option reasons');
  assert.ok(g.options.every(s=>s.length>=8),key+' insufficient option reasons');
  for(const a of g.anchors)assert.ok(a.text.length>=2,key+' one-letter anchor');
  for(const e of g.evidence){const n=(e.quote.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)||[]).length;assert.ok(n<=45,key+' quote too long ('+n+')');quotes.push({key,paragraph:e.paragraph,words:n});}
  total++;counts[l.year||'practice']=(counts[l.year||'practice']||0)+1;types[g.type]=(types[g.type]||0)+1;
 }
}
assert.equal(total,370);assert.equal(Object.keys(strategyGuides).length,370);
for(let y=2010;y<=2026;y++)assert.equal(counts[y],20);assert.equal(counts.practice,30);
const example=practiceLessons[0],first=example.questions[0].strategy;
const imported=validateBank([{...example,id:'with-strategy'}])[0];assert.deepEqual(imported.questions[0].strategy,first);
const state=initialState();state.customLessons=[imported];assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(state))).customLessons[0].questions[0].strategy,first);
const legacy={...example,questions:example.questions.map(({strategy,...q})=>q)};assert.equal(validateLesson(legacy).questions[0].strategy,null);
assert.throws(()=>validateStrategy({...first,anchors:[{text:'not-in-the-article-at-all',meaning:'无效'}]},example.paragraphs));
assert.throws(()=>validateStrategy({...first,evidence:[{...first.evidence[0],paragraph:99}]},example.paragraphs));
assert.throws(()=>validateStrategy({...first,evidence:[{...first.evidence[0],quote:'invented quote'}]},example.paragraphs));
assert.throws(()=>validateStrategy({...first,options:['one']},example.paragraphs));
const disputed=builtinLessons.find(l=>l.id==='past-2025-2').questions[4];assert.equal(disputed.answer,null);assert.equal(disputed.answerStatus,'disputed');assert.ok(/待|疑|争|复核/.test(disputed.strategy.reasoning+disputed.strategy.options.join('')));
await fs.mkdir(new URL('../build/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../build/strategy-audit.json',import.meta.url),JSON.stringify({total,counts,types,evidenceCount:quotes.length,maximumQuoteWords:Math.max(...quotes.map(q=>q.words)),verifiedLiteralQuotes:true},null,2));
console.log('PASS: 370 question-specific strategies; 1,480 distinct-within-question option reasons; all anchors and short quotations match the cited paragraphs; old backups and strategy imports round-trip; disputed question remains unscored.');

import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Button,Icon,Modal,Empty,Words} from './ui.jsx';
import {lookup,normalizeWord} from './dictionary.js';
import {score,wordCount,timeLabel,uid,generalTips} from './core.js';
import {LocatingHint,QuestionStrategy,TechniquePrimer} from './Techniques.jsx';
const letters=['A','B','C','D'];
const compactQuery='(max-width: 760px), (max-height: 500px) and (max-width: 1000px)';

export function Reader({lesson,state,setState,onBack,notify}){
 const draft=state.drafts[lesson.id]||{answers:[],seconds:0,assisted:false,submitted:false};
 const [activeWord,setActiveWord]=useState(null),[translations,setTranslations]=useState({});
 const [paused,setPaused]=useState(false),[confirm,setConfirm]=useState(false),[reset,setReset]=useState(false);
 const [mobile,setMobile]=useState('article'),[compact,setCompact]=useState(()=>window.matchMedia?.(compactQuery).matches??false);
 const [questionIndex,setQuestionIndex]=useState(()=>Math.max(0,lesson.questions.findIndex((_,i)=>draft.answers[i]==null)));
 const [answerCard,setAnswerCard]=useState(false),[toolsOpen,setToolsOpen]=useState(false);
 const [meaningEdit,setMeaningEdit]=useState(''),[showMeaningEdit,setShowMeaningEdit]=useState(false);
 const [tip,setTip]=useState(false),[hints,setHints]=useState({}),[focused,setFocused]=useState(null);
 const popover=useRef(),articlePane=useRef(),questionPane=useRef(),wordElement=useRef();
 const positions=useRef({article:0,questions:0}),lastQuestion=useRef(questionIndex),jumpTimer=useRef();
 function changeDraft(fn){setState(s=>({...s,drafts:{...s.drafts,[lesson.id]:fn(s.drafts[lesson.id]||{answers:[],seconds:0,assisted:false,submitted:false})}}));}
 useEffect(()=>{if(!state.drafts[lesson.id])changeDraft(d=>d);},[]);
 useEffect(()=>{
  const media=window.matchMedia?.(compactQuery);if(!media)return;
  const update=()=>{setCompact(media.matches);setActiveWord(null);};
  media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>()=>clearTimeout(jumpTimer.current),[]);
 useEffect(()=>{
  if(paused||draft.submitted)return;
  const timer=setInterval(()=>{if(!document.hidden)changeDraft(d=>({...d,seconds:d.seconds+1}));},1000);
  return()=>clearInterval(timer);
 },[paused,draft.submitted]);
 useEffect(()=>{
  const close=e=>{if(activeWord&&!e.target.closest('.word,.word-popover'))setActiveWord(null);};
  const key=e=>{if(e.key==='Escape')setActiveWord(null);};
  document.addEventListener('click',close);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('click',close);document.removeEventListener('keydown',key);};
 },[activeWord]);
 function switchPane(next){
  const pane=mobile==='article'?articlePane.current:questionPane.current;
  if(pane)positions.current[mobile]=pane.scrollTop;
  setActiveWord(null);setMobile(next);
 }
 useLayoutEffect(()=>{
  if(!compact)return;
  if(lastQuestion.current!==questionIndex){positions.current.questions=0;lastQuestion.current=questionIndex;}
  const pane=mobile==='article'?articlePane.current:questionPane.current;
  if(pane)pane.scrollTop=positions.current[mobile];
 },[mobile,compact,questionIndex]);
 useEffect(()=>{
  window.__shiciReaderBack=()=>{if(compact&&mobile==='questions'){switchPane('article');return true;}return false;};
  return()=>{delete window.__shiciReaderBack;};
 },[compact,mobile]);
 function onPaneScroll(pane){
  if(!compact||mobile===pane)positions.current[pane]=(pane==='article'?articlePane:questionPane).current.scrollTop;
  if(!compact)setActiveWord(null);
 }
 const onWord=(word,key,element,context)=>{
  if(activeWord?.key===key){setActiveWord(null);return;}
  const r=element.getBoundingClientRect();wordElement.current=element;
  setActiveWord({word,key,context,top:r.bottom+10,left:Math.max(12,Math.min(r.left,window.innerWidth-332))});
  setShowMeaningEdit(false);changeDraft(d=>({...d,assisted:true}));
 };
 useLayoutEffect(()=>{
  if(!activeWord||!popover.current)return;
  if(compact){if(!showMeaningEdit)wordElement.current?.scrollIntoView({block:'nearest'});return;}
  const r=popover.current.getBoundingClientRect();
  if(r.bottom>innerHeight-12)setActiveWord(w=>w?{...w,top:Math.max(12,innerHeight-r.height-12)}:w);
 },[activeWord?.key,showMeaningEdit,compact]);
 const definition=activeWord?lookup(activeWord.word,state.customDictionary,lesson.glossary):null;
 const toggleTranslation=i=>{setTranslations(t=>({...t,[i]:!t[i]}));changeDraft(d=>({...d,assisted:true}));};
 function choose(i,answer){
  if(draft.submitted)return;
  changeDraft(d=>{const a=[...d.answers];while(a.length<lesson.questions.length)a.push(null);a[i]=answer;return {...d,answers:a};});
 }
 function goToQuestion(index){
  if(index<0||index>=lesson.questions.length)return;
  switchPane('questions');setQuestionIndex(index);setAnswerCard(false);positions.current.questions=0;
  clearTimeout(jumpTimer.current);
  jumpTimer.current=setTimeout(()=>{
   const el=document.getElementById('question-'+index);
   if(compact&&questionPane.current)questionPane.current.scrollTop=0;
   else el?.scrollIntoView({behavior:'smooth',block:'start'});
   el?.focus({preventScroll:true});
  },40);
 }
 function submit(){
  setState(s=>{
   const d=s.drafts[lesson.id]||draft,answers=lesson.questions.map((_,i)=>d.answers[i]??null);
   return {...s,drafts:{...s.drafts,[lesson.id]:{...d,answers,submitted:true}},attempts:[...s.attempts,{id:uid(),lessonId:lesson.id,answers,date:new Date().toISOString(),seconds:d.seconds,assisted:d.assisted}].slice(-2000)};
  });
  setConfirm(false);setAnswerCard(false);if(compact)goToQuestion(0);notify('已完成，解析和错题已保存');
 }
 function requestSubmit(){setAnswerCard(false);answered<lesson.questions.length?setConfirm(true):submit();}
 function redo(){
  changeDraft(()=>({answers:[],seconds:0,assisted:false,submitted:false}));
  setTranslations({});setHints({});setFocused(null);setReset(false);setActiveWord(null);setQuestionIndex(0);
  positions.current.questions=0;if(questionPane.current)questionPane.current.scrollTop=0;
  notify('开始新一轮练习，上一轮记录已保留');
 }
 function jumpToQuote(e,index){
  switchPane('article');setFocused({...e,index});
  clearTimeout(jumpTimer.current);
  jumpTimer.current=setTimeout(()=>{
   const el=document.getElementById('para-'+e.paragraph);
   el?.scrollIntoView({behavior:'smooth',block:'center'});el?.focus({preventScroll:true});
  },40);
 }
 function locateAnchor(anchor,guide,index){
  const order=[...new Set([...guide.evidence.map(e=>e.paragraph),...lesson.paragraphs.map((_,i)=>i)])];
  const paragraph=order.find(i=>lesson.paragraphs[i].en.toLowerCase().includes(anchor.text.toLowerCase()));
  if(paragraph!==undefined)jumpToQuote({paragraph,quote:anchor.text},index);
 }
 function toggleHint(index){if(!hints[index])changeDraft(d=>({...d,assisted:true}));setHints(h=>({...h,[index]:!h[index]}));}
 function saveWord(){
  const k=normalizeWord(activeWord.word);
  if(!definition.meaning){setShowMeaningEdit(true);setMeaningEdit('');return;}
  setState(s=>({...s,words:{...s.words,[k]:{word:k,meaning:definition.meaning,context:activeWord.context,title:lesson.title,lessonId:lesson.id,level:s.words[k]?.level||0,due:s.words[k]?.due||Date.now()}}}));
  notify('已收藏到生词本');
 }
 function resizeFont(delta){setState(s=>({...s,settings:{...s.settings,fontSize:Math.max(17,Math.min(28,s.settings.fontSize+delta))}}));}
 function readingTips(){setToolsOpen(false);setTip(true);changeDraft(d=>({...d,assisted:true}));}
 function answerStatus(q,i){
  if(!draft.submitted)return draft.answers[i]==null?'未作答':'已选 '+letters[draft.answers[i]];
  if(!Number.isInteger(q.answer))return q.answerStatus==='disputed'?'待复核':'未评分';
  return draft.answers[i]===q.answer?'正确':draft.answers[i]==null?'未作答':'需回看';
 }
 const tally=score(lesson,draft.answers),answered=lesson.questions.filter((_,i)=>draft.answers[i]!=null).length;
 const wordProps={onWord,selected:activeWord};
 return <div className="reader" data-compact={compact?'true':'false'} style={{'--reading-size':state.settings.fontSize+'px'}}>
  <header className="reader-header">
   <button className="icon-btn" aria-label="返回阅读导读" onClick={onBack}><Icon name="back"/></button>
   <div className="reader-name"><span>{lesson.kind==='past'?lesson.year+' · TEXT '+lesson.textNumber:'ORIGINAL PRACTICE'}</span><strong>{lesson.title}</strong></div>
   <div className="timer"><Icon name="clock" size={17}/><span aria-label="本次阅读用时">{timeLabel(draft.seconds)}</span>{!draft.submitted&&<button className="icon-btn" aria-label={paused?'继续计时':'暂停计时'} onClick={()=>setPaused(!paused)}><Icon name={paused?'play':'pause'} size={17}/></button>}</div>
   <button className="icon-btn desktop-reader-tool" aria-label="减小字号" disabled={state.settings.fontSize<=17} onClick={()=>resizeFont(-1)}>A−</button>
   <button className="icon-btn desktop-reader-tool" aria-label="增大字号" disabled={state.settings.fontSize>=28} onClick={()=>resizeFont(1)}>A+</button>
   <Button className="desktop-reader-tool" icon="info" aria-label="阅读提示" onClick={readingTips}>阅读提示</Button>
   <button className="icon-btn mobile-reader-tool" aria-label="阅读工具" onClick={()=>setToolsOpen(true)}><Icon name="settings"/></button>
  </header>
  <div className="reader-grid" data-mobile={mobile}>
   <article ref={articlePane} className="article-pane" aria-label="阅读原文" onScroll={()=>onPaneScroll('article')}>
    <div className="reading-caption"><span>READING COMPREHENSION</span><span>{wordCount(lesson)} WORDS</span></div>
    <h2>{lesson.englishTitle}</h2><p className="word-instruction"><span className="tiny-dot"/>轻点单词查看释义 · 再点收起</p>
    <div className="reading-focus-bar" hidden={!focused}>{focused&&<><span>已定位 · 第 {lesson.questions[focused.index]?.number||focused.index+1} 题</span><Button icon="back" onClick={()=>goToQuestion(focused.index)}>返回这道题</Button><button className="icon-btn" aria-label="清除原文高亮" onClick={()=>setFocused(null)}><Icon name="close" size={16}/></button></>}</div>
    <div className="article-body" style={{fontSize:state.settings.fontSize}}>{lesson.paragraphs.map((p,i)=><section className="paragraph" id={'para-'+i} tabIndex={-1} key={i}>
     <span className="paragraph-no">{String(i+1).padStart(2,'0')}</span><p className="english"><Words text={p.en} context={'p'+i} {...wordProps} highlights={focused?.paragraph===i?[focused.quote]:[]}/></p>
     {p.zh&&<><button className="translation-toggle" onClick={()=>toggleTranslation(i)}>{translations[i]?'收起译文':'查看本段译文'} <span>{translations[i]?'−':'+'}</span></button>{translations[i]&&<p className="translation">{p.zh}</p>}</>}
    </section>)}</div>
    <div className="article-end"><Icon name="leaf" size={19}/> 慢慢读，答案就在文字里。</div>
   </article>
   <aside ref={questionPane} className="question-pane" aria-label="题目与解析" onScroll={()=>onPaneScroll('questions')}>
    <div className="questions-head"><div><span className="eyebrow">YOUR PRACTICE</span><h2>{draft.submitted?'回看你的理解':'带着问题读'}</h2></div><span className="question-count">{answered}/{lesson.questions.length}</span></div>
    <div className="answer-progress"><i style={{width:answered/Math.max(1,lesson.questions.length)*100+'%'}}/></div>
    {draft.submitted?<div className="result-banner"><strong>{tally.correct}<small> / {tally.total}</small></strong><div>道已核对题答对<p>用时 {timeLabel(draft.seconds)}{draft.assisted?' · 使用过阅读辅助':''}</p></div><Button icon="refresh" onClick={()=>setReset(true)}>再练一次</Button></div>:<p className="hint">点字母作答，点英文查词。{compact?'每题选好后点“下一题”。':'提交后查看参考答案。'}</p>}
    {lesson.questions.some(q=>q.answerStatus==='disputed')&&<p className="answer-notice">本篇有参考答案待核对的题目，作答会保留，暂不计分。</p>}
    {lesson.questions.map((q,i)=>{
     const chosen=draft.answers[i],graded=Number.isInteger(q.answer),right=chosen===q.answer;
     return <section className="question" id={'question-'+i} hidden={compact&&questionIndex!==i} tabIndex={-1} key={i}>
      <div className="question-label"><span>QUESTION {q.number||i+1}</span>{draft.submitted&&<span className={graded?(right?'correct-label':'wrong-label'):'muted'}>{graded?(right?'✓ 正确':chosen==null?'未作答':'需要回看'):q.answerStatus==='disputed'?'答案待复核':'暂无参考答案'}</span>}</div>
      <p className="question-stem english"><Words text={q.stem} context={'q'+i} {...wordProps}/></p>
      <div className="options" role="radiogroup" aria-label={'第 '+(q.number||i+1)+' 题选项'}>{q.options.map((o,j)=><div key={j} className={'option '+(chosen===j?'chosen ':'')+(draft.submitted&&graded&&q.answer===j?'correct ':'')+(draft.submitted&&graded&&chosen===j&&!right?'incorrect':'')}>
       <button className="option-letter" role="radio" aria-checked={chosen===j} aria-label={'第'+(q.number||i+1)+'题选'+letters[j]} disabled={draft.submitted} onClick={()=>choose(i,j)}>{letters[j]}</button><span className="english"><Words text={o} context={'q'+i+'o'+j} {...wordProps}/></span>
      </div>)}</div>
      {!draft.submitted&&q.strategy&&<div className="question-hint"><button className="hint-toggle" aria-expanded={!!hints[i]} aria-controls={'hint-'+i} onClick={()=>toggleHint(i)}><Icon name="search" size={16}/>{hints[i]?'收起定位提示':'看定位提示'}<small>先找原文</small></button>{hints[i]&&<div id={'hint-'+i}><LocatingHint guide={q.strategy} onLocate={a=>locateAnchor(a,q.strategy,i)}/></div>}</div>}
      {draft.submitted&&<div className="explanation"><strong>{graded?'参考答案 '+letters[q.answer]:q.answerStatus==='disputed'?'参考答案有疑义 · 本题暂不计分':'等待补充答案'}</strong>{q.strategy?<>
       {q.answerStatus==='disputed'&&<p className="answer-notice">{q.explanation}</p>}<QuestionStrategy guide={q.strategy} answer={q.answer} choices={q.options} disputed={q.answerStatus==='disputed'} onAnchor={a=>locateAnchor(a,q.strategy,i)} onEvidence={e=>jumpToQuote(e,i)}/>
      </>:<><p>{q.explanation||'请结合原文核对该题。'}</p>{q.evidence>=0&&<button className="evidence-link" onClick={()=>jumpToQuote({paragraph:q.evidence,quote:lesson.paragraphs[q.evidence].en},i)}>定位原文第 {q.evidence+1} 段 <Icon name="arrow" size={15}/></button>}{q.optionNotes?.length>0&&<details><summary>逐项理解</summary>{q.optionNotes.map((n,j)=><p key={j}><b>{letters[j]}.</b> {n}</p>)}</details>}</>}</div>}
     </section>;
    })}
    {lesson.questions.length===0&&<Empty title="这篇用于精读" body="目前只有文章正文。可通过题库 JSON 导入配套题目。"/>}
    {lesson.questions.length>0&&!draft.submitted&&<div className="submit-footer"><Button primary icon="check" onClick={requestSubmit}>提交并查看解析</Button><p>{answered<lesson.questions.length?'还有 '+(lesson.questions.length-answered)+' 题未作答':'每个答案，都值得回到原文确认一次。'}</p></div>}
   </aside>
  </div>
  {activeWord&&<div className="word-popover" ref={popover} role="dialog" aria-label="单词释义" style={{top:activeWord.top,left:activeWord.left}}>
   <div className="word-pop-head"><span className="eyebrow">{definition.source}</span><button className="icon-btn" aria-label="关闭释义" onClick={()=>setActiveWord(null)}><Icon name="close" size={17}/></button></div>
   <h3>{activeWord.word}</h3>{definition.base!==normalizeWord(activeWord.word)&&<span className="muted">原形 {definition.base}</span>}{definition.phonetic&&<p className="phonetic">/{definition.phonetic}/</p>}
   <p className="definition">{definition.meaning||'核心词库暂未收录这个词，可补充自己的释义。'}</p>
   <div className="word-actions"><Button icon="bookmark" onClick={saveWord}>{state.words[normalizeWord(activeWord.word)]?'已收藏':'收藏生词'}</Button><button className="icon-btn" aria-label="编辑单词释义" onClick={()=>{setMeaningEdit(definition.meaning);setShowMeaningEdit(true);}}><Icon name="edit" size={18}/></button></div>
   {showMeaningEdit&&<form onSubmit={e=>{
    e.preventDefault();if(!meaningEdit.trim())return;const k=normalizeWord(activeWord.word);
    setState(s=>({...s,customDictionary:{...s.customDictionary,[k]:meaningEdit.trim()},words:s.words[k]?{...s.words,[k]:{...s.words[k],meaning:meaningEdit.trim()}}:s.words}));
    setShowMeaningEdit(false);notify('释义已保存');
   }}><label>我的释义<textarea value={meaningEdit} maxLength={2000} onChange={e=>setMeaningEdit(e.target.value)} autoFocus/></label><Button primary>保存释义</Button></form>}
   <small className="subtle">词义需要结合句子理解，再点原词可收起。</small>
  </div>}
  <div className="reader-mobile-dock">
   {mobile==='questions'&&lesson.questions.length>0&&<div className="question-pager">
    <Button icon="back" disabled={questionIndex===0} onClick={()=>goToQuestion(questionIndex-1)}>上一题</Button>
    <button className="answer-card-entry" aria-label="打开答题卡" onClick={()=>setAnswerCard(true)}><strong>{questionIndex+1}<small> / {lesson.questions.length}</small></strong><span>答题卡 · {draft.submitted?'已交卷':'已答 '+answered+' 题'}</span></button>
    {questionIndex<lesson.questions.length-1?<Button primary icon="arrow" onClick={()=>goToQuestion(questionIndex+1)}>下一题</Button>:draft.submitted?<Button onClick={()=>goToQuestion(0)}>回到首题</Button>:<Button primary icon="check" onClick={requestSubmit}>交卷</Button>}
   </div>}
   <nav className="reader-mobile-tabs" aria-label="阅读与答题">
    <button className={mobile==='article'?'selected':''} aria-pressed={mobile==='article'} onClick={()=>switchPane('article')}><Icon name="book" size={19}/>阅读原文</button>
    <button className={mobile==='questions'?'selected':''} aria-pressed={mobile==='questions'} onClick={()=>switchPane('questions')}><Icon name="edit" size={19}/>题目与解析 <small>{answered}/{lesson.questions.length}</small></button>
   </nav>
  </div>
  {toolsOpen&&<Modal title="阅读工具" onClose={()=>setToolsOpen(false)}>
   <div className="reader-font-tools"><span>英文字号 <b>{state.settings.fontSize}px</b></span><button className="btn" aria-label="减小字号" disabled={state.settings.fontSize<=17} onClick={()=>resizeFont(-1)}>A−</button><button className="btn" aria-label="增大字号" disabled={state.settings.fontSize>=28} onClick={()=>resizeFont(1)}>A+</button></div>
   <p className="english font-preview" style={{fontSize:state.settings.fontSize}}>Small steps make a lasting difference.</p>
   <Button className="reader-tools-tips" icon="info" onClick={readingTips}>阅读提示与做题技巧</Button>
   <p className="subtle">字号同时用于原文、题干和选项。底部可随时切换原文与题目，点击答题卡可跳题。</p>
  </Modal>}
  {answerCard&&<Modal title="答题卡" onClose={()=>setAnswerCard(false)}>
   <p>{draft.submitted?'点击题号，逐题查看答案和解析。':'已作答 '+answered+' / '+lesson.questions.length+' 题，点击题号继续。'}</p>
   <div className="answer-card-grid">{lesson.questions.map((q,i)=>{
    const status=answerStatus(q,i);
    return <button key={i} className={'answer-card-item '+(draft.answers[i]!=null?'answered ':'')+(draft.submitted&&Number.isInteger(q.answer)?draft.answers[i]===q.answer?'right':'wrong':'')} aria-label={'跳到第 '+(q.number||i+1)+' 题，'+status} aria-current={i===questionIndex?'step':undefined} onClick={()=>goToQuestion(i)}><strong>{q.number||i+1}</strong><span>{status}</span></button>;
   })}</div>
   {!draft.submitted&&<div className="modal-actions"><Button primary icon="check" onClick={requestSubmit}>提交并查看解析</Button></div>}
  </Modal>}
  {confirm&&<Modal title="还有题目未作答" onClose={()=>setConfirm(false)}><p>还有 {lesson.questions.length-answered} 道题空着，提交后将计入本次未答题。</p><div className="modal-actions"><Button onClick={()=>setConfirm(false)}>继续作答</Button><Button primary onClick={submit}>提交本次练习</Button></div></Modal>}
  {reset&&<Modal title="开始新一轮练习？" onClose={()=>setReset(false)}><p>本轮选择将清空，之前的成绩和用时会保留在学习记录中。</p><div className="modal-actions"><Button onClick={()=>setReset(false)}>取消</Button><Button primary onClick={redo}>开始新一轮</Button></div></Modal>}
  {tip&&<Modal wide title="这篇的阅读提示" onClose={()=>setTip(false)}><details className="primer-details"><summary>查看低词汇量做题法</summary><TechniquePrimer/></details><p>{lesson.summary||'先浏览题干，带着关键词定位原文。'}</p>{(lesson.tips?.length?lesson.tips:generalTips).map((t,i)=><div className="modal-tip" key={i}><h3>{t.title}</h3><p>{t.body}</p></div>)}</Modal>}
 </div>;
}

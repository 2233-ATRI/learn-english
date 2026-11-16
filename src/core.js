export const VERSION=1;
export function initialState(){return {version:1,customLessons:[],drafts:{},attempts:[],words:{},customDictionary:{},settings:{theme:'paper',fontSize:21}};}
export const textOf=l=>l.paragraphs.map(p=>p.en).join(' ');
export const wordCount=l=>(textOf(l).match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)||[]).length;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const timeLabel=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export function score(lesson,answers){const graded=lesson.questions.filter(q=>Number.isInteger(q.answer));return {correct:lesson.questions.filter((q,i)=>Number.isInteger(q.answer)&&answers[i]===q.answer).length,total:graded.length,answered:lesson.questions.filter((_,i)=>Number.isInteger(answers[i])).length};}
export function latestAttempt(state,id){return state.attempts.filter(a=>a.lessonId===id).at(-1);}
export function mistakes(state,lessons){return lessons.flatMap(l=>{const a=latestAttempt(state,l.id);return a?l.questions.flatMap((q,i)=>Number.isInteger(q.answer)&&a.answers[i]!==q.answer?[{lesson:l,question:q,index:i,answer:a.answers[i],date:a.date}]:[]):[];});}
const safeKey=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
const str=(v,name,max=50000)=>{if(typeof v!=='string'||v.length>max)throw Error(`${name}需要是长度合适的文本`);return v;};
const short=(v,fallback='')=>typeof v==='string'?v.slice(0,300):fallback;
export function validateStrategy(v,paragraphs){
 if(v==null)return null;
 if(!v||typeof v!=='object')throw Error('逐题技巧需要是结构化内容');
 const types=['细节定位','原因','目的','例证','词义','推断','态度','主旨'];
 if(!types.includes(v.type))throw Error('逐题技巧的题型无效');
 const required=(s,name,max)=>{const t=str(s,name,max).trim();if(!t)throw Error(name+'不能为空');return t;};
 if(!Array.isArray(v.anchors)||v.anchors.length<1||v.anchors.length>3)throw Error('每题需要 1—3 个定位词');
 const anchors=v.anchors.map(a=>{const text=required(a.text,'定位词',200),meaning=required(a.meaning,'定位词释义',500);if(!paragraphs.some(p=>p.en.toLowerCase().includes(text.toLowerCase())))throw Error('定位词未出现在正文：'+text);return {text,meaning};});
 if(!Array.isArray(v.evidence)||v.evidence.length<1||v.evidence.length>3)throw Error('每题需要 1—3 处短证据');
 const evidence=v.evidence.map(e=>{if(!Number.isInteger(e.paragraph)||!paragraphs[e.paragraph])throw Error('技巧引用的段落无效');const quote=required(e.quote,'关键原句',2000),meaning=required(e.meaning,'原句释义',2000);if(!paragraphs[e.paragraph].en.includes(quote))throw Error('关键原句与所指段落不一致');return {paragraph:e.paragraph,quote,meaning};});
 if(!Array.isArray(v.options)||v.options.length!==4)throw Error('逐题技巧需要四个选项的取舍理由');
 return {type:v.type,anchors,locate:required(v.locate,'定位步骤',2000),evidence,reasoning:required(v.reasoning,'关键词推理',3000),options:v.options.map(s=>required(s,'选项取舍',2000))};
}
export function validateLesson(v){
 if(!v||typeof v!=='object'||!safeKey(v.id))throw Error('篇目 id 无效');
 if(!Array.isArray(v.paragraphs)||!v.paragraphs.length||v.paragraphs.length>150)throw Error('每篇需要 1—150 个段落');
 if(!Array.isArray(v.questions)||v.questions.length>30)throw Error('题目数量应为 0—30');
 const paragraphs=v.paragraphs.map(p=>({en:str(p.en,'英文段落').trim(),zh:str(p.zh||'','段落译文')})).filter(p=>p.en);
 if(!paragraphs.length)throw Error('正文不能为空');
 const title=str(v.title,'标题',300).trim();if(!title)throw Error('标题不能为空');
 const questions=v.questions.map((q,i)=>{if(!Array.isArray(q.options)||q.options.length!==4)throw Error(`第 ${i+1} 题需要四个选项`);if(q.answer!==null&&(!Number.isInteger(q.answer)||q.answer<0||q.answer>3))throw Error(`第 ${i+1} 题答案应为 0—3 或 null`);return {strategy:validateStrategy(q.strategy,paragraphs),number:Number.isInteger(q.number)?q.number:i+1,stem:str(q.stem,'题干',5000),options:q.options.map(o=>str(o,'选项',3000)),answer:q.answer,referenceAnswer:Number.isInteger(q.referenceAnswer)&&q.referenceAnswer>=0&&q.referenceAnswer<4?q.referenceAnswer:null,answerStatus:q.answerStatus==='disputed'?'disputed':'ready',evidence:Number.isInteger(q.evidence)&&q.evidence>=0&&q.evidence<paragraphs.length?q.evidence:-1,explanation:str(q.explanation||'参考答案来自导入资料。','解析',10000),optionNotes:Array.isArray(q.optionNotes)?q.optionNotes.slice(0,4).map(s=>str(s,'选项解析',3000)):[]};});
 const glossary={};for(const [k,val] of Object.entries(v.glossary||{})){if(!/^[a-z][a-z'-]{0,60}$/.test(k))continue;glossary[k]=str(val,'单词释义',1000);}
 return {id:v.id,title,englishTitle:short(v.englishTitle,'Imported reading'),year:Number.isInteger(v.year)&&v.year>=2010&&v.year<=2100?v.year:null,textNumber:Number.isInteger(v.textNumber)?v.textNumber:null,kind:v.kind==='past'?'past':'practice',topic:short(v.topic,'我的资料'),level:short(v.level,'导入篇目'),minutes:Math.min(120,Math.max(1,Number(v.minutes)||18)),source:short(v.source,'用户导入'),sourceFile:short(v.sourceFile),summary:str(v.summary||'','导读',10000),structure:Array.isArray(v.structure)?v.structure.slice(0,150).map(s=>str(s,'段落结构',1000)):[],tips:Array.isArray(v.tips)?v.tips.slice(0,10).map(t=>({title:short(t.title),body:str(t.body||'','技巧',3000)})):[],paragraphs,questions,glossary};
}
export function validateBank(v){const arr=Array.isArray(v)?v:v.lessons;if(!Array.isArray(arr)||!arr.length||arr.length>200)throw Error('题库需要 1—200 篇，格式为 {"lessons": [...]}');const out=arr.map(validateLesson);if(new Set(out.map(l=>l.id)).size!==out.length)throw Error('题库有重复 id，请修改后重试');return out;}
export function validateBackup(v){
 if(!v||v.version!==1||!Array.isArray(v.customLessons)||!Array.isArray(v.attempts)||!v.words||!v.drafts||!v.settings)throw Error('这不是拾词英语二的完整备份');
 const result=initialState();result.customLessons=v.customLessons.length?validateBank(v.customLessons):[];
 const answers=a=>{if(!Array.isArray(a)||a.length>30||a.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>3)))throw Error('备份中的答案格式无效');return a;};
 result.attempts=v.attempts.slice(-2000).map(a=>{if(!safeKey(a.lessonId)||!Number.isFinite(Date.parse(a.date)))throw Error('备份中的练习记录无效');return {id:short(a.id,uid()),lessonId:a.lessonId,answers:answers(a.answers),date:a.date,seconds:Math.max(0,Number(a.seconds)||0),assisted:!!a.assisted};});
 for(const [k,d] of Object.entries(v.drafts)){if(!safeKey(k))throw Error('备份中的篇目 id 无效');result.drafts[k]={answers:answers(d.answers||[]),seconds:Math.max(0,Number(d.seconds)||0),assisted:!!d.assisted,submitted:!!d.submitted};}
 for(const [k,w] of Object.entries(v.words)){if(!/^[a-z][a-z'-]{0,80}$/.test(k))throw Error('备份中的单词无效');result.words[k]={word:k,meaning:str(w.meaning,'释义',2000),context:str(w.context||'','语境',10000),lessonId:short(w.lessonId),title:short(w.title),due:Number.isFinite(w.due)?w.due:Date.now(),level:Math.max(0,Math.min(5,Number(w.level)||0))};}
 for(const [k,d] of Object.entries(v.customDictionary||{}))if(/^[a-z][a-z'-]{0,80}$/.test(k))result.customDictionary[k]=str(d,'自定义释义',2000);
 result.settings={theme:['paper','light','dark'].includes(v.settings.theme)?v.settings.theme:'paper',fontSize:Math.max(17,Math.min(28,Number(v.settings.fontSize)||21))};return result;
}
export const generalTips=[{title:'先读题干，标出定位线索',body:'圈出人物、时间和概念，再到原文找对应段落。读完定位句前后各一句。'},{title:'跟住转折与因果',body:'留意 however、because、therefore，区分作者观点与引用的他人观点。'},{title:'比较选项与原文的范围',body:'逐一核对主语、因果和范围词，用原文证据判断。'}];

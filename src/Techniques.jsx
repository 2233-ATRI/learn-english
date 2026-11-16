import React from 'react';
import {Button,Icon} from './ui.jsx';

const methods=[
 ['先圈好找的词','先看题干的人名、地名、年份、数字和特别长的名词。记住字形，在原文里找同样的词；先读所在句及前后各一句。'],
 ['用上一题的位置缩小范围','细节题先从上一题附近往后找。主旨、全文态度题另看首尾和相关评价；题号顺序用于缩小范围，找到词后还要核对句子。'],
 ['按问法找路标','问原因看 because / since / due to；问目的看 to / in order to；问建议看 should / need to。遇到 but / however，重点核对后半句。'],
 ['举例题找它要说明的观点','看到 example / illustrate，先看例子前一句，再看后面的总结。选能概括例子作用的选项，核对它说的是谁、什么事。'],
 ['两项纠结，核对三个地方','谁：员工还是老板？多少：部分还是全部？多肯定：可能还是必然？选项额外增加的内容，要能在原文中找到依据。'],
 ['主旨最后做，态度先分正负','主旨题结合其他题目、首段和末段，选能覆盖主要论点的概括。态度题找作者自己的评价句，先判断支持、反对或保留判断。'],
 ['卡住先跳，凭新证据改答案','找了一分多钟仍没定位，可以标记后继续。两个选项纠结就留作二选一。发现新原文依据再修改，答案字母的排列不能替代证据。'],
];
export function TechniquePrimer(){return <div className="technique-primer"><p className="technique-route">看题干 → 找特殊词 → 读附近三句 → 核对关系 → 排除偷换 → 选择答案</p><p className="muted">从一小块原文入手。每道内置题都配有自己的定位词、短证据和四项取舍理由。</p><ol className="technique-list">{methods.map(([title,body],i)=><li key={title}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol><div className="signal-table"><span>some / most / all</span><span>部分 / 多数 / 全部</span><span>may / must</span><span>可能 / 必须</span><span>support / oppose</span><span>支持 / 反对</span><span>example / mainly</span><span>例子 / 主要内容</span></div><p className="subtle">先用路标缩小范围，再以具体句子为准。复杂推断和主旨题需要把几处证据合起来看。</p></div>;}

export function LocatingHint({guide,onLocate}){return <div className="locating-hint"><h4>先圈这几个词 <small>{guide.type}</small></h4><div className="anchor-chips">{guide.anchors.map((a,i)=><button key={i} type="button" onClick={()=>onLocate?.(a)} disabled={!onLocate} className="anchor-chip" aria-label={'定位 '+a.text}><b lang="en">{a.text}</b><span>{a.meaning}</span>{onLocate&&<Icon name="arrow" size={14}/>}</button>)}</div><p>{guide.locate}</p>{onLocate&&<small className="subtle">点击词条，原文会跳转并高亮。</small>}</div>;}

const readableReason=s=>s.replace(/^[A-D](?:[.．、:：]\s*|\s+)/,'').replace(/^(?:保留|排除)[:：]\s*/,'');
export function QuestionStrategy({guide,answer,choices=[],disputed=false,onAnchor,onEvidence}){return <div className="question-strategy"><section className="strategy-step"><span className="strategy-step-title">01 / 怎么找定位词</span><LocatingHint guide={guide} onLocate={onAnchor}/></section><section className="strategy-step"><span className="strategy-step-title">02 / 先读这几句</span>{guide.evidence.map((e,i)=><div className="evidence-card" key={i}><span className="evidence-paragraph">原文第 {e.paragraph+1} 段</span><blockquote lang="en">{e.quote}</blockquote><p>{e.meaning}</p>{onEvidence&&<Button icon="arrow" onClick={()=>onEvidence(e)}>在原文中看这句</Button>}</div>)}</section><section className="strategy-step"><span className="strategy-step-title">03 / 用少量关键词判断</span><p>{guide.reasoning}</p></section><section className="strategy-step"><span className="strategy-step-title">04 / 四个选项怎么取舍</span><div className="strategy-options">{guide.options.map((reason,i)=><div className={'strategy-option '+(answer===i?'keep':'')} key={i}><span className="strategy-option-letter">{'ABCD'[i]}</span><div><strong>{answer===i?'保留':disputed?'对照原文':'排除'}</strong><p className="strategy-option-text" lang="en">{choices[i]}</p><p>{readableReason(reason)}</p></div></div>)}</div></section></div>;}

#!/usr/bin/env python3
"""Convert the user's locally supplied papers. No network or service operations.

PDF answer sheets are authoritative for the packaged reference key. Corresponding
DOC copies supply clean text; explicit paragraph merges are verified against PDFs.
"""
from pathlib import Path
import json, re, subprocess, runpy
import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/hetao/112/【2】2010-2025年考研英语二真题及解析')
NOTES = runpy.run_path(str(Path(__file__).with_name('notes-2010-2018.py')))['NOTES']
MERGES = {
 'past-2010-3': [[0],[1],[2],[3,4],[5],[6],[7]],
 'past-2013-3': [[0],[1,2],[3],[4],[5],[6]],
 'past-2014-1': [[0],[1,2],[3],[4]],
 'past-2014-4': [[0],[1,2,3],[4],[5],[6],[7],[8],[9]],
 'past-2015-4': [[0],[1],[2,3],[4],[5],[6],[7]],
 'past-2017-3': [[0],[1],[2,3],[4]],
 'past-2018-3': [[0,1],[2],[3,4,5],[6]],
}

def clean(text):
    text=re.sub('[\u200b-\u200f\ufeff]','',text)
    text=text.replace('＄','$').replace('（','(').replace('）',')').replace('？','?')
    text=re.sub(r'\s+',' ',text).strip()
    text=re.sub(r'\s+([.,;?!])',r'\1',text)
    return text.replace('open -mindedness','open-mindedness').replace('Colgate- Palmolive','Colgate-Palmolive')

lessons=[]
audit=[]
for year in range(2010,2019):
    doc=next((SOURCE/'01、真题部分/WORD版本').glob(f'{year}*.doc'))
    paper=next((SOURCE/'01、真题部分').glob(f'{year}*.pdf'))
    answer=next(p for p in (SOURCE/'02、解析部分/速查版').glob(f'{year}*.pdf') if '-2023' not in p.name)
    text=subprocess.run(['textutil','-convert','txt','-stdout',str(doc)],capture_output=True,check=True).stdout.decode('utf-8')
    with fitz.open(answer) as pdf:
        key_text='\n'.join(page.get_text(sort=True) for page in pdf)
    headings=list(re.finditer(r'(?im)^Text\s*([1-4])\s*$',text))
    assert len(headings)>=4
    for n,m in enumerate(headings[:4]):
        end=headings[n+1].start() if n<3 else re.search(r'(?im)^Part\s*B\b',text[m.end():]).start()+m.end()
        chunks=text[m.end():end].split('\t•\t')
        assert len(chunks)==26,(year,n,len(chunks))
        ident=f'past-{year}-{n+1}'
        body=[clean(p) for p in chunks[0].strip().splitlines() if p.strip()]
        if ident in MERGES:
            body=[clean(' '.join(body[i] for i in group)) for group in MERGES[ident]]
        begin=21+n*5
        km=re.search(rf'{begin}\s*[-–~]\s*{begin+4}\s*[:：]?\s*([A-D\s]{{5,10}})',key_text)
        assert km,(ident,'PDF answer missing')
        keys=re.sub(r'\s+','',km.group(1))[:5]
        dm=re.search(rf'{begin}\s*[-–~]\s*{begin+4}\s*\n([A-D\s]+)',text[headings[-4].start():])
        assert dm,(ident,'DOC answer missing')
        doc_keys=re.sub(r'\s+','',dm.group(1))[:5]
        assert keys==doc_keys,(ident,'PDF/DOC answer disagreement',keys,doc_keys)
        note=NOTES[ident]
        structure=note['structure'].split('|')
        assert len(structure)==len(body),(ident,'Paragraph count',len(structure),len(body))
        qs=[]
        for j in range(5):
            fields=[clean(p.replace('\t',' _____ ')) for p in chunks[1+j*5:6+j*5]]
            assert len(fields)==5 and all(fields)
            ev=note['evidence'][j]
            assert -1<=ev<len(body)
            qs.append({'number':begin+j,'stem':fields[0],'options':fields[1:],
                       'answer':'ABCD'.index(keys[j]),'evidence':ev,
                       'explanation':f'参考答案：{keys[j]}（用户提供的机构答案）。'+note['explanations'][j],
                       'optionNotes':[]})
        tips=[dict(zip(['title','body'],s.split('::',1))) for s in note['tips']]
        lessons.append({'id':ident,'title':note['title'],'englishTitle':f'{year} · Text {n+1}',
          'year':year,'textNumber':n+1,'kind':'past','topic':note['topic'],'level':'历年真题','minutes':18,
          'source':'用户提供原卷及机构参考答案；中文导读和定位解析为学习辅助',
          'sourceFile':paper.name,'answerSourceFile':answer.name,'textCorrectedWith':doc.name,
          'summary':note['summary'],'structure':structure,'tips':tips,
          'paragraphs':[{'en':p,'zh':''} for p in body],'questions':qs})
        audit.append({'id':ident,'paragraphs':len(body),'words':len(re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)*",' '.join(body))),
                      'questions':[q['number'] for q in qs],'answers':keys,'answerSourcesAgree':True})

assert len(lessons)==36 and sum(len(l['questions']) for l in lessons)==180
for l in lessons:
    for q in l['questions']:
        assert len(q['options'])==4 and 0<=q['answer']<=3
    assert l['summary'] and len(l['tips'])==3
    assert all(len(p['en'])>20 for p in l['paragraphs'])
dest=ROOT/'src/past-2010-2018.json'
dest.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/paper-text/audit-2010-2018.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(f'Wrote {len(lessons)} passages, 180 questions to {dest}. All 180 keys match both PDF and DOC sources.')

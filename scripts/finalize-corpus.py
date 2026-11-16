"""Apply source-checked text-layer corrections and merge the 2025 transcription.

Run after extract/annotate and transcribe scripts. All inputs are local files.
The snapshot preserves the original annotated PDF extraction for reproducibility.
"""
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
SNAPSHOT=ROOT/'assets/paper-text/annotated-2019-2026.json'
DEST=ROOT/'src/past-2019-2026.json'
if not SNAPSHOT.exists():
    SNAPSHOT.write_text(DEST.read_text())
data=[l for l in json.loads(SNAPSHOT.read_text()) if l['year']!=2025]
doc=json.loads((ROOT/'assets/paper-text/doc-clean-candidates.json').read_text())
log=[]

# These Word paragraphs were token-compared to the PDF. Differences are quote
# recognition, footer contamination and the specific OCR errors recorded below.
for lesson in data:
    if lesson['year']==2023:
        paragraphs=doc[lesson['id']]['paragraphs']
        assert len(paragraphs)==len(lesson['structure'])
        lesson['paragraphs']=[{'en':re.sub(r'\s+',' ',s).replace('ifs a good idea',"it's a good idea").replace("ifs too soon","it's too soon"),'zh':''} for s in paragraphs]
        log.append({'lesson':lesson['id'],'correction':'按同目录 Word 版交叉校正正文引号、识别错误及末尾页脚；保留 PDF 中正确的 it’s。'})

fixes={
    'past-2019-1':{'Yaish':'Vaish','wrongdoings ( \u000e 14 1f )':'wrongdoings'},
    'past-2020-4':{'"entitled" 1s':'"entitled" is'},
    'past-2021-3':{' tum into':' turn into','earlystage':'early-stage'},
    'past-2021-4':{'Northeastem':'Northeastern','complexwhen':'complex—when'},
    'past-2022-1':{'green house':'greenhouse',"'Tm excited":"“I'm excited",'agricultoal':'agricultural','ata considerably':'at a considerably'},
    'past-2022-2':{'retiring,W eiss said.':'retiring,” Weiss said.','Many people believe they can\'t retire.':'Many people believe they can\'t retire.”','Many 4 unretireesare':'Many “unretirees” are'},
    'past-2022-3':{'fhistrated':'frustrated'},
    'past-2022-4':{'5O-minute':'50-minute','Schwitzgebefs':"Schwitzgebel's",'self^development':'self-development'},
    'past-2023-1':{'g r a s s':'grass','o u t':'out'},
    'past-2023-2':{'m a y':'may','t h e y':'they'},
    'past-2023-3':{'u cognitive offloading“':'“cognitive offloading”','t h a t':'that'},
    'past-2023-4':{'s t u d y':'study','t e e n a g e r s':'teenagers'},
    'past-2024-1':{'uAn economy':'“An economy','disruption,9,':'disruption,”','s h o w':'show'},
    'past-2024-2':{'uNot only':'“Not only','uWhile the':'“While the','Confdr':'Confor','Confbr':'Confor','govemmenfs':"government's",'i n c e n t i v e s':'incentives','t o':'to','o f':'of'},
    'past-2024-3':{'utIf we':'“If we','Motor Vehicles,9,9':'Motor Vehicles,\'”','confidentiality,9,':'confidentiality,”','Driver Studies J':'Driver Studies,”','90-yearold':'90-year-old','a d v i c e':'advice','s a f e':'safe'},
    'past-2024-4':{'s h o w':'show'},
}

def clean(s,lesson_id):
    original=s
    s=re.sub(r'\s*英语（二）试题.*$','',s).strip()
    # In these text layers the apostrophe is repeatedly decoded as 9 or 5.
    s=re.sub(r'\b(users|consumers|students|assistants|visitors|teenagers|producers|Farmers|doctors|campaigners|products)[95](?=\s|$)',r"\1'",s)
    for old,new in fixes.get(lesson_id,{}).items():
        if re.fullmatch(r'(?:[a-z] )+[a-z]',old):
            s=re.sub(r'(?<!\w)'+re.escape(old)+r'(?!\w)',new,s)
        else:
            s=s.replace(old,new)
    if s!=original:log.append({'lesson':lesson_id,'before':original,'after':s})
    return s

for lesson in data:
    for p in lesson['paragraphs']:p['en']=clean(p['en'],lesson['id'])
    for q in lesson['questions']:
        q['stem']=clean(q['stem'],lesson['id'])
        q['options']=[clean(s,lesson['id']) for s in q['options']]

data.extend(json.loads((ROOT/'src/past-2025.json').read_text()))
data.sort(key=lambda l:(l['year'],l['textNumber']))
assert len(data)==32 and len({l['id'] for l in data})==32
for lesson in data:
    assert len(lesson['paragraphs'])==len(lesson['structure']),lesson['id']
    assert len(lesson['questions'])==5
    for q in lesson['questions']:
        assert 0<=q['evidence']<len(lesson['paragraphs']),lesson['id']
        assert not any(re.search('[\u3400-\u9fff]',s) for s in [q['stem'],*q['options']]),lesson['id']
DEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/paper-text/final-corrections.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n')
print(f'Finalized {len(data)} passages; {len(log)} recorded text corrections; 2025 Q30 remains unscored.')

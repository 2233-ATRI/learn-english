from pathlib import Path
import fitz, re, json, statistics

ROOT=Path('/Users/hetao/112')
APP=Path(__file__).resolve().parents[1]
MID=APP/'assets/paper-text'

def fix(s):
 s=s.replace('\u00ad','').replace('ﬁ','fi').replace('ﬂ','fl')
 s=re.sub(r'\[\s*([ABCD])\s*[JjI1\]}]',r'[\1]',s)
 s=re.sub(r'^E([ABCD])\]',r'[\1]',s)
 s=re.sub(r'\b([A-Za-z]+)9s\b',r"\1's",s)
 s=re.sub(r'\bfbr\b','for',s)
 s=re.sub(r'\bThafs\b',"That's",s)
 s=re.sub(r'\bifs\b',"it's",s)
 s=s.replace('^^','”').replace(',,9','”')
 s=re.sub(r'(?<=[a-z,.])99(?![0-9])','”',s)
 s=re.sub(r'(?<=[a-z,])5,(?= says)','”',s)
 s=re.sub(r'^([23])\s+([0-9])\.',r'\1\2.',s)
 return re.sub(r'\s+',' ',s).strip()

def lines_pdf(path,year):
 result=[]
 for page_num,page in enumerate(fitz.open(path)):
  if year<2026 and not 3<=page_num<=10:continue
  if year==2026 and not 4<=page_num<=17:continue
  raw=[]
  for b in page.get_text('dict')['blocks']:
   for line in b.get('lines',[]):
    spans=line['spans'];text=''.join(s['text'] for s in spans)
    x,y,x1,y1=line['bbox']
    if y>page.rect.height*.93:continue
    if year==2026 and y<70:continue
    if re.match(r'^20\d\d[-—]\d+$',text.strip()):continue
    if not re.search(r'[A-Za-z0-9]',text):continue
    if year<2026 and y>page.rect.height*.88 and re.search(r'[¦*§]',text):continue
    if y>page.rect.height*.90 and re.fullmatch(r'\s*[0-9 ]+\s*',text):continue
    raw.append([x,y,x1,y1,text])
  groups=[]
  for item in sorted(raw,key=lambda l:l[1]):
   g=next((g for g in groups[-3:] if abs(g[0][1]-item[1])<3),None)
   if g is None:groups.append([item])
   else:g.append(item)
  for g in groups:
   g.sort(key=lambda l:l[0]);s='';last=None
   for x,y,x1,y1,t in g:
    if last is not None and x-last>2 and not s.endswith(' ') and not t.startswith(' '):s+=' '
    s+=t;last=x1
   s=fix(s)
   if s:result.append({'text':s,'x':g[0][0]/page.rect.width,'page':page_num+1,'y':g[0][1]/page.rect.height})
 return result

def lines_ocr(year,typ='paper'):
 result=[]
 for file in sorted((MID/f'{year}-images').glob(f'{typ}-*.json')):
  pn=int(file.stem.split('-')[1]);rows=json.loads(file.read_text())
  if typ=='paper' and not 4<=pn<=11:continue
  for row in sorted(rows,key=lambda l:l['y']):
   if row['y']>.94 or row['y']<.06:continue
   s=fix(row['text'])
   if re.match(r'^20\d\d[-—]\d+$',s):continue
   if s:result.append({'text':s,'x':row['x'],'page':pn,'y':row['y']})
 return result

def answer_key(year):
 if year==2025:
  text='\n'.join(r['text'] for r in lines_ocr(year,'answer'))
 else:text=(MID/f'{year}-answer.txt').read_text()
 ans={}
 for m in re.finditer(r'\b(2[1-9]|30|3[1-9]|40)\s*[.．、]\s*(?:【答案】\s*)?\[?([ABCD])\]?',text):ans[int(m[1])]='ABCD'.index(m[2])
 for m in re.finditer(r'(21|26|31|36)\s*[-—]\s*(25|30|35|40)\s*[:：]\s*([ABCD\s-]{5,15})',text):
  vals=re.findall('[ABCD]',m[3])
  if len(vals)==5:
   for n,v in enumerate(vals,int(m[1])):ans[n]='ABCD'.index(v)
 return ans

def extract(year):
 base=ROOT/('【3】2026年英语二真题及答案' if year==2026 else '【2】2010-2025年考研英语二真题及解析/01、真题部分')
 file=next(p for p in base.glob('*.pdf') if str(year) in p.name and '答案' not in p.name)
 rows=lines_ocr(year) if year==2025 else lines_pdf(file,year)
 (MID/f'{year}-lines.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 answers=answer_key(year)
 items=[];cur=None;question=None;option=None;para=None
 for row in rows:
  s=row['text'];heading=re.match(r'^Text\s*([1-4])$',s,re.I)
  if re.match(r'^Part\s*B$',s,re.I):break
  if heading:
   n=int(heading[1]);cur={'id':f'past-{year}-{n}','year':year,'textNumber':n,'kind':'past','englishTitle':f'{year} · Text {n}','source':'用户提供原卷及机构参考答案','sourceFile':file.name,'level':'历年真题','minutes':18,'paragraphs':[],'questions':[]}
   items.append(cur);question=option=para=None;continue
  if cur is None:continue
  qm=re.match(r'^(2[1-9]|30|3[1-9]|40)\s*[.．、]\s*(.*)',s)
  if qm:
   n=int(qm[1]);question={'number':n,'stem':qm[2],'options':[],'answer':answers.get(n),'evidence':-1,'explanation':'依据用户提供的机构参考答案；请结合全文核对所选项的依据。','optionNotes':[]};cur['questions'].append(question);option=None;continue
  om=re.match(r'^\[\s*([ABCD])\s*\]\s*(.*)',s)
  if question is not None:
   if om:
    if len(question['options'])!='ABCD'.index(om[1]):print('OPTION ORDER',year,question['number'],s)
    question['options'].append(om[2]);option=len(question['options'])-1
   elif option is not None:question['options'][option]+=' '+s
   else:question['stem']+=' '+s
   continue
  # Text body: first-line indent starts a paragraph. Page continuations retain the current one.
  indent=(.165 if year==2026 else .135)
  if para is None or row['x']>indent:
   para={'en':s,'zh':''};cur['paragraphs'].append(para)
  else:
   if para['en'].endswith('-') and s[0].islower():para['en']=para['en'][:-1]+s
   else:para['en']+=' '+s
 for item in items:
  for pos,question in enumerate(item['questions']):
   question['number']=20+(item['textNumber']-1)*5+pos+1
   question['answer']=answers.get(question['number'])
   question['stem']=re.sub(r'(?:_\s*){2,}|(?:-\s*){3,}','_____',question['stem'])
 return items

if __name__=='__main__':
 all_items=[]
 for year in range(2019,2027):
  if year==2025 and not list((MID/'2025-images').glob('paper-*.json')):continue
  items=extract(year);all_items+=items
  print(year,[(i['textNumber'],len(i['paragraphs']),len(i['questions']),[q['number'] for q in i['questions'] if q['answer'] is None]) for i in items])
 (MID/'parsed-2019-2026.json').write_text(json.dumps(all_items,ensure_ascii=False,indent=2))
 (MID/'review-2019-2026.txt').write_text('\n\n'.join(f"{i['year']} TEXT {i['textNumber']}\n"+'\n'.join(f"P{n+1}: {p['en']}" for n,p in enumerate(i['paragraphs']))+'\n'+'\n'.join(f"{q['number']}. {q['stem']} "+' / '.join(f'{chr(65+n)} {a}' for n,a in enumerate(q['options']))+f" [answer={q['answer']}]" for q in i['questions']) for i in all_items))

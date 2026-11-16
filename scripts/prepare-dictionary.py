import csv,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent.parent
data=root/'assets/ecdict/ecdict.csv'
entries={};forms={};exam_words=set();basic_words=set()
with data.open() as f:
 for row in csv.DictReader(f):
  tags=row['tag'].split()
  if not any(tag in tags for tag in ['ky','zk']):continue
  word=row['word'].lower()
  (exam_words if 'ky' in tags else basic_words).add(word)
  entries[word]=[row['translation'].replace('\\n','\n'),row['phonetic']]
  for part in row['exchange'].split('/'):
   if ':' not in part:continue
   key,values=part.split(':',1)
   if key not in ['p','d','i','3','r','t','s']:continue
   for value in values.split(','):
    value=value.strip().lower()
    if value and value!=word and value.isalpha():forms.setdefault(value,word)
(root/'src/core-dictionary.json').write_text(json.dumps({'entries':entries,'forms':forms},ensure_ascii=False,separators=(',',':')))
(root/'assets/ecdict/selection.json').write_text(json.dumps({'source':'https://github.com/skywind3000/ECDICT','license':'MIT','criterion':'ky or zk in tag; ky core plus common basic vocabulary','examEntries':len(exam_words),'basicEntries':len(basic_words-exam_words),'baseEntries':len(entries),'forms':len(forms),'csvSHA256':hashlib.sha256(data.read_bytes()).hexdigest()},indent=2))
print('Selected',len(exam_words),'exam words plus',len(basic_words-exam_words),'basic words and',len(forms),'inflections')

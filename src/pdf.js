import * as pdf from 'pdfjs-dist/build/pdf.mjs';
import {WorkerMessageHandler} from 'pdfjs-dist/build/pdf.worker.mjs';
globalThis.pdfjsWorker={WorkerMessageHandler};
export async function extractPdf(buffer){
 const task=pdf.getDocument({data:new Uint8Array(buffer),useSystemFonts:true,disableFontFace:true,isEvalSupported:false});
 let doc;try{doc=await task.promise;if(doc.numPages>100)throw Error('请拆分为 100 页以内的 PDF');let result=[];
 for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent();let lines=[],line='',lastY=null,lastX=0;
 for(const item of content.items){if(!('str' in item))continue;const x=item.transform[4],y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>3){lines.push(line);if(Math.abs(y-lastY)>22)lines.push('');line='';}
 line+=(line&&x>lastX+1?' ':'')+item.str;lastY=y;lastX=x+item.width;if(item.hasEOL){lines.push(line);line='';lastY=null;}}
 if(line)lines.push(line);result.push(lines.join('\n'));page.cleanup();}
 const text=result.join('\n\n').trim();if(text.replace(/\s/g,'').length<40)throw Error('这个 PDF 缺少可提取的文字，请先用 OCR 转为文字，再导入。');return text;
 }finally{await task.destroy();}
}

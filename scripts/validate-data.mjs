import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
const collections={notices:['id','title','date','category','body'],publications:['id','title','year','authors','journal'],members:['id','name','role'],gallery:['id','title','date','image','alt'],partners:['id','name','logo','url'],tracks:['id','title','number','description','topics']};
export function validateCollection(name, items) {
  const errors=[];if(!Array.isArray(items))return [`${name}: expected an array`];
  const ids=new Set();
  for(const item of items){
    if(!item || typeof item!=='object'){errors.push(`${name}: invalid item`);continue;}
    for(const field of collections[name]||[])if(item[field]===undefined||item[field]===null||item[field]==='')errors.push(`${name}/${item.id}: missing ${field}`);
    if(item.id){if(!/^[a-z0-9][a-z0-9_-]*$/i.test(item.id))errors.push(`${name}: invalid id ${item.id}`);if(ids.has(item.id))errors.push(`${name}: duplicate id ${item.id}`);ids.add(item.id);}
    if(item.date){const parsed=new Date(item.date);if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==item.date)errors.push(`${name}/${item.id}: invalid date`);}
    if(item.year!==undefined && (!Number.isInteger(item.year)||item.year<1900||item.year>2200))errors.push(`${name}/${item.id}: invalid year`);
    if(name==='notices'&&!['notice','event','press'].includes(item.category))errors.push(`${name}/${item.id}: invalid category`);
    for(const field of ['url','pdf','doi','image','thumbnail','logo'])if(item[field] && !isSafeReference(item[field]))errors.push(`${name}/${item.id}: unsafe ${field}`);
    for(const [field,value] of Object.entries(item))if(value && typeof value==='object'&&!Array.isArray(value) && ('ko' in value||'en' in value)){if(!value.ko||!value.en)errors.push(`${name}/${item.id}: ${field} needs ko and en`);}
  }
  return errors;
}
export function isSafeReference(value){return typeof value==='string' && !/[\u0000-\u001f]/.test(value) && (/^https:\/\/[^\s]+$/i.test(value) || /^(assets\/|[a-z0-9_-]+\.html(?:[?#]|$))/i.test(value));}
export async function validateData(){
  const errors=[];
  for(const name of Object.keys(collections)){
    const data=JSON.parse(await readFile(`data/${name}.json`,'utf8'));errors.push(...validateCollection(name,data));
    for(const item of data)for(const field of ['image','thumbnail','logo','pdf']){
      const path=item[field];if(path?.startsWith('assets/')){
        const target=resolve(path);const root=resolve('assets')+sep;
        if(!target.startsWith(root)||!existsSync(target))errors.push(`${name}/${item.id}: missing local file ${path}`);
      }
    }
  }
  const site=JSON.parse(await readFile('data/site.json','utf8'));
  if(!site.name || !site.address?.ko || !site.address?.en)errors.push('site: name and bilingual address required');
  const faq=JSON.parse(await readFile('data/faq.json','utf8'));
  for(const item of faq)if(!item.question?.ko||!item.question?.en||!item.answer?.ko||!item.answer?.en)errors.push('faq: bilingual question and answer required');
  return errors;
}

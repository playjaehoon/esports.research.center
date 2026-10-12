import { readdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateData } from './validate-data.mjs';
const errors=await validateData();
const pages=(await readdir('.')).filter(x=>x.endsWith('.html'));
for(const path of pages){
  const html=await readFile(path,'utf8');
  if((html.match(/<h1[\s>]/g)||[]).length!==1)errors.push(`${path}: expected exactly one h1`);
  if(!html.includes('name="viewport"')||!html.includes('name="description"'))errors.push(`${path}: missing metadata`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(ids.length!==new Set(ids).size)errors.push(`${path}: duplicate HTML id`);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const value=match[1];if(/^(https?:|mailto:|tel:|#)/.test(value))continue;
    const local=value.replace(/^\//,'').split(/[?#]/)[0];if(!local)continue;
    try{await access(resolve(local));}catch{errors.push(`${path}: missing linked file ${local}`);}
  }
}
for(const file of (await readdir('js')).filter(x=>x.endsWith('.js'))){try{execFileSync(process.execPath,['--check',`js/${file}`],{stdio:'pipe'});}catch{errors.push(`js/${file}: syntax error`);}}
const form=await readFile('qna.html','utf8');
for(const value of ['data-netlify="true"','method="POST"','name="form-name"','netlify-honeypot="bot-field"','action="/success.html"'])if(!form.includes(value))errors.push(`contact form missing ${value}`);
const css=await readFile('css/style.css','utf8');
if(!css.includes('prefers-reduced-motion'))errors.push('Reduced motion support missing');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Checked ${pages.length} pages, 8 JSON data files, local links, JavaScript syntax, form and motion configuration.`);

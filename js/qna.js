import { $, $$, tr, local, loadData, escapeHTML as e, icon, loadFailure } from './core.js';
async function renderFAQ(){const target=$('#faq-list');try{const entries=await loadData('faq');const open=$$('details[open]',target).map(x=>x.dataset.index);target.innerHTML=entries.map((item,index)=>`<details class="faq-item" data-index="${index}" ${open.includes(String(index))?'open':''}><summary><span>${e(local(item.question))}</span>${icon('plus')}</summary><p>${e(local(item.answer))}</p></details>`).join('');}catch{loadFailure(target,renderFAQ);}}
renderFAQ();document.addEventListener('languagechange',renderFAQ);
const form=$('#contact-form');
form.addEventListener('submit',event=>{
  if(['localhost','127.0.0.1',''].includes(location.hostname)){
    event.preventDefault();$('#form-status').textContent=tr('로컬 미리보기에서는 문의를 전송하지 않습니다. Netlify 배포 후 문의 접수가 가능합니다.','Inquiries are not sent from local previews. Submission is available after deployment to Netlify.');$('#form-status').focus();return;
  }
  // Native POST keeps the submission compatible with Netlify and works without JavaScript.
  form.querySelector('[name="language"]').value=document.documentElement.lang;
});

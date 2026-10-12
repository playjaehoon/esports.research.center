import { $, $$, tr, local, loadData, published, byDate, escapeHTML as e, safeURL, dateLabel, emptyState, loadFailure, openDialog } from './core.js';
let items=[],active=0;const list=$('#gallery-list');const dialog=$('#lightbox');
function show(index){
  active=(index+items.length)%items.length;const item=items[active];
  const img=$('#lightbox-image');img.src=safeURL(item.image);img.alt=local(item.alt)||local(item.title);
  $('#lightbox-title').textContent=local(item.title);$('#lightbox-description').textContent=`${dateLabel(item.date)}${item.description?' · '+local(item.description):''}`;
  $('#lightbox-counter').textContent=`${active+1} / ${items.length}`;
  $('#lightbox-error').hidden=true;
  img.onerror=()=>{$('#lightbox-error').hidden=false;};
  $('#lightbox-prev').disabled=items.length<2;$('#lightbox-next').disabled=items.length<2;openDialog(dialog);
}
async function render(){
  try{items=published(await loadData('gallery')).filter(item=>safeURL(item.image)).sort(byDate);
    list.innerHTML=items.length?items.map((item,index)=>`<button class="gallery-card" data-gallery="${index}"><span class="gallery-photo"><img src="${e(safeURL(item.thumbnail||item.image))}" alt="${e(local(item.alt)||local(item.title))}" loading="lazy" width="600" height="450"><span class="photo-enlarge">${tr('크게 보기','View photo')} ↗</span></span><span class="gallery-caption"><small>${e(dateLabel(item.date))}</small><strong>${e(local(item.title))}</strong></span></button>`).join(''):emptyState('image',tr('함께한 순간들을 기록합니다','Moments that move research forward'),tr('연구 활동과 세미나, 학술 교류의 현장을 곧 만나보세요.','Photos from research activities, seminars and academic exchanges will be shared here.'));
    $$('[data-gallery]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.gallery))));
  }catch{loadFailure(list,render);}
}
$('#lightbox-prev').addEventListener('click',()=>show(active-1));$('#lightbox-next').addEventListener('click',()=>show(active+1));
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(active-1);}if(event.key==='ArrowRight'){event.preventDefault();show(active+1);}});
render();document.addEventListener('languagechange',()=>{render();if(dialog.open&&items.length)show(active);});

import { $, tr, local, loadData, published, byDate, safeURL, openDialog } from './core.js';
const dialog=$('#welcome-dialog');const key='hufs-core-popup-until';let popup;
function render(){if(!popup)return;$('#welcome-title').textContent=local(popup.title);$('#welcome-body').textContent=local(popup.body);$('#welcome-link').href=safeURL(popup.url)||'about.html';}
async function init(){
  try {
    const site=await loadData('site');if(!site.popup?.enabled)return;
    const items=published(await loadData('notices')).filter(n=>n.popup).sort(byDate);
    popup=items.length?{title:items[0].title,body:items[0].summary||items[0].body,url:`notices.html?notice=${encodeURIComponent(items[0].id)}`} : site.popup;
    let until=0;try{until=Number(localStorage.getItem(key));}catch{/* Optional storage. */}
    if(until>Date.now())return;render();
    // Do not interrupt a search or menu already opened while data was loading.
    if(!$('dialog[open]'))openDialog(dialog);
  }catch{/* A failed popup must not block access to the website. */}
}
dialog?.addEventListener('close',()=>{if($('#hide-today').checked){try{localStorage.setItem(key,String(Date.now()+24*60*60*1000));}catch{/* Closing still works without storage. */}}});
document.addEventListener('languagechange',render);if(dialog)init();

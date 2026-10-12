import { $, $$, tr, local, loadData, published, escapeHTML as e, icon, openDialog } from './core.js';
const dialog=$('#search-dialog');const input=$('#global-search');const results=$('#search-results');
let records=[],loaded=false,failed=false;
const pages=[
  ['about.html','센터 소개','About the center','비전 연구진 조직도','Mission vision people organization'],
  ['research.html','연구 실적','Research','논문 과제 아카이브','Publications projects archive'],
  ['notices.html','공지사항','Notices','공지 학술행사 언론보도','News events media'],
  ['gallery.html','갤러리','Gallery','사진 세미나 연구 활동','Photos seminars activities'],
  ['qna.html','Q&A · 문의','Q&A & Contact','주소 연락처 방문 협력','Address contact visit collaboration']
];
async function prepare(){
  const names=['notices','publications','members','tracks'];
  const fetched=await Promise.allSettled(names.map(loadData));
  failed=fetched.some(r=>r.status==='rejected');records=[];
  fetched.forEach((result,index)=>{
    if(result.status!=='fulfilled')return;
    for(const item of published(result.value)){
      const type=names[index];
      const link=type==='notices'?`notices.html?notice=${encodeURIComponent(item.id)}`:type==='publications'?`research.html#publication-${encodeURIComponent(item.id)}`:type==='members'?`about.html#member-${encodeURIComponent(item.id)}`:`research.html?track=${encodeURIComponent(item.id)}#archive`;
      records.push({type,item,link});
    }
  });loaded=true;render();
}
function render(){
  const query=input.value.trim().toLocaleLowerCase();
  if(!loaded){results.innerHTML=`<p class="search-hint">${tr('검색 자료를 불러오는 중입니다…','Loading search index…')}</p>`;return;}
  const links=pages.map(([url,ko,en,kwords,ewords])=>({url,title:tr(ko,en),text:`${ko} ${en} ${kwords} ${ewords}`,type:tr('페이지','Page')}));
  if(query){
    for(const record of records){const item=record.item;links.push({url:record.link,title:local(item.title||item.name),text:[local(item.title),local(item.name),local(item.authors),local(item.journal),local(item.summary),local(item.body),local(item.role),local(item.bio),local(item.description)].join(' '),type:({notices:tr('공지사항','Notice'),publications:tr('연구 실적','Research'),members:tr('연구진','People'),tracks:tr('연구 트랙','Track')})[record.type]});}
  }
  const matches=query?links.filter(link=>link.text.toLocaleLowerCase().includes(query)):links;
  $('#search-status').textContent=query?tr(`${matches.length}개의 검색 결과`,`${matches.length} search results`):tr('빠른 바로가기','Quick links');
  results.innerHTML=matches.length?matches.slice(0,50).map(link=>`<a class="search-result" href="${e(link.url)}"><span><small>${e(link.type)}</small><strong>${e(link.title)}</strong></span>${icon('arrow')}</a>`).join(''):`<div class="empty-state compact"><h3>${tr('검색 결과가 없습니다','No results found')}</h3><p>${tr('다른 단어로 검색해 보세요. 연구 자료는 등록 준비 중입니다.','Try another keyword. Research content is being prepared.')}</p></div>`;
  if(matches.length>50)results.insertAdjacentHTML('beforeend',`<p class="search-hint">${tr('상위 50개 결과입니다. 검색어를 구체적으로 입력해 주세요.','Showing the first 50 results. Please refine your search.')}</p>`);
  if(failed)results.insertAdjacentHTML('beforeend',`<p class="search-hint">${tr('일부 자료를 불러오지 못했습니다.','Some content could not be loaded.')}</p><button class="text-link" id="retry-search">${tr('다시 불러오기','Retry')}</button>`);
  $('#retry-search')?.addEventListener('click',prepare);
}
$$('[data-open-search]').forEach(button=>button.addEventListener('click',()=>{openDialog(dialog);input.focus();if(!loaded)prepare();else render();}));
input.addEventListener('input',render);
$('#clear-search').addEventListener('click',()=>{input.value='';input.focus();render();});
document.addEventListener('languagechange',()=>{if(loaded)render();});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openDialog(dialog);input.focus();if(!loaded)prepare();}});

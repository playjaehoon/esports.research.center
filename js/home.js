import { $, tr, loadData, published, byDate, emptyState, loadFailure } from './core.js';
import { publicationCard } from './research.js';
import { noticeCard, bindNoticeCards } from './notices.js';
async function renderNotices(){
  const target=$('#latest-notices');
  try {const items=published(await loadData('notices')).sort(byDate).slice(0,3);
    target.innerHTML=items.length ? items.map(n=>noticeCard(n,true)).join('') : emptyState('notice',tr('새로운 소식을 준비하고 있습니다','Updates are coming soon'),tr('학술행사와 센터 소식을 곧 만나보세요.','Discover upcoming events and news from the center.'),true);bindNoticeCards(target,items);
  }catch{loadFailure(target,renderNotices);}
}
async function renderPapers(){
  const target=$('#latest-publications');
  try {const items=published(await loadData('publications')).sort(byDate).slice(0,2);
    target.innerHTML=items.length ? items.map(publicationCard).join('') : emptyState('book',tr('연구의 기록을 준비하고 있습니다','Knowledge, ready to be shared'),tr('검증된 연구 실적을 차례로 공개합니다.','Our verified publications will be available here.'),true);
  }catch{loadFailure(target,renderPapers);}
}
renderNotices();renderPapers();document.addEventListener('languagechange',()=>{renderNotices();renderPapers();});

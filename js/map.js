import { $, tr, loadData } from './core.js';

const panel = $('#kakao-map');
const fallback = $('#map-fallback');
const status = $('#map-status');
let state = 'idle';
function caption() {
  status.textContent = state === 'ready'
    ? tr('캠퍼스 주소 기준 위치입니다. 방문 장소는 어문학관 423호입니다.', 'Campus address location. Visit Room 423, Eomunhakgwan.')
    : state === 'error'
      ? tr('지도를 불러오지 못했습니다. 카카오맵 바로가기를 이용해 주세요.', 'The map is unavailable. Please use the Kakao Map link.') : '';
}
document.addEventListener('languagechange', caption);

function loadSDK(key) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Map SDK timeout')), 15000);
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
    script.onerror = () => { clearTimeout(timer); reject(new Error('Map SDK unavailable')); };
    script.onload = () => {
      if (!window.kakao?.maps) { clearTimeout(timer); reject(new Error('Invalid map SDK')); return; }
      window.kakao.maps.load(() => { clearTimeout(timer); resolve(window.kakao.maps); });
    };
    document.head.append(script);
  });
}

async function init() {
  try {
    const { kakaoMap: config } = await loadData('site');
    if (!config?.javascriptKey?.trim()) return;
    const maps = await loadSDK(config.javascriptKey.trim());
    let position;
    if (Number.isFinite(config.latitude) && Number.isFinite(config.longitude)) {
      position = new maps.LatLng(config.latitude, config.longitude);
    } else {
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Address search timeout')), 10000);
        new maps.services.Geocoder().addressSearch(config.address, (results, code) => {
          clearTimeout(timer);
          if (code === maps.services.Status.OK && results.length) resolve(results[0]);
          else reject(new Error('Address not found'));
        });
      });
      position = new maps.LatLng(Number(result.y), Number(result.x));
    }
    panel.hidden = false;
    const map = new maps.Map(panel, { center: position, level: 3 });
    new maps.Marker({ map, position, title: 'HUFS Global CORE · 어문학관 423호' });
    map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
    map.setZoomable(false);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => { map.relayout(); map.setCenter(position); }).observe(panel);
    }
    fallback.hidden = true;
    state = 'ready';
    caption();
  } catch {
    panel.hidden = true;
    fallback.hidden = false;
    state = 'error';
    caption();
  }
}
init();

# 카카오지도 설정

1. https://developers.kakao.com 에서 앱을 생성합니다.
2. 앱의 카카오맵 사용 설정을 활성화합니다.
3. 앱 설정 → 앱 → 플랫폼 키에서 JavaScript 키를 선택합니다.
4. JavaScript SDK 도메인에 http://127.0.0.1:4173 과 http://localhost:4173 을 등록합니다.
5. data/site.json의 kakaoMap.javascriptKey에 JavaScript 키를 입력합니다. REST API 키나 Admin 키를 사용하지 않습니다.
6. npm run dev 후 http://127.0.0.1:4173/qna.html#visit 에서 확인합니다.

키가 없거나 API 오류가 나면 주소와 카카오맵 바로가기를 표시합니다.
현재는 도로명 주소로 좌표를 조회하므로 캠퍼스 주소 위치를 표시합니다. 어문학관 건물의 정확한 좌표를 확인한 뒤 kakaoMap.latitude / longitude에 숫자로 입력하면 해당 위치로 표시합니다. 423호는 실내 방문 장소 안내입니다.
향후 배포할 때는 실제 운영 도메인도 SDK 도메인에 등록해야 합니다. PR 미리보기 도메인도 별도 허용이 필요합니다.
SDK가 동적으로 삽입하는 스타일과 지도 스크립트를 허용하도록 netlify.toml의 CSP에 카카오 CDN 및 인라인 스타일 허용을 추가했습니다. 실제 API 동작은 발급 키로 추가 검증해야 합니다.

공식 안내: https://apis.map.kakao.com/web/guide/

작업 방식: 사용자 요청 전까지 로컬 수정·검사만 수행하고, 커밋·푸시·PR·머지·배포하지 않습니다.

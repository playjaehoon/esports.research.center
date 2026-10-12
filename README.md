# HUFS Global CORE

한국외국어대학교 글로벌 CORE — Center for Open Research in Esports 공식 웹사이트.

HTML, CSS, ES modules와 JSON으로 구성한 정적 사이트입니다. 런타임 서버나 데이터베이스가 필요하지 않습니다. 실제 연구진, 논문, 공지, 사진, 협력기관은 확인 후 등록할 수 있도록 비워 두었으며, 공개 화면에는 준비 안내를 제공합니다.

## 실행과 배포

Node.js 22 이상을 권장합니다.

```sh
npm ci
npm run dev
# http://127.0.0.1:4173

npm run check
npm test
npm run build
```

`dist/`가 배포 산출물입니다. JSON을 `fetch()`로 읽으므로 HTML 파일을 직접 더블클릭하는 대신 HTTP 서버에서 실행하세요.

### Netlify

1. Netlify에서 **Add new project → Import an existing project → GitHub**를 선택합니다.
2. `playjaehoon/esports.research.center`, `main` 브랜치를 선택합니다.
3. 저장소의 `netlify.toml`을 사용합니다. Build command는 `npm run check && npm test && npm run build`, publish directory는 `dist`입니다.
4. **Forms → Enable form detection**을 켜고 다시 배포합니다.
5. **Forms → Submission notifications → Add notification → Email**에서 실제 수신 주소를 지정합니다. 저장소에 이메일 비밀번호나 비밀키를 입력하지 않습니다.
6. 공개된 사이트에서 직접 테스트 문의 1건을 제출하고 Netlify 수신함과 알림 메일을 확인합니다. 로컬 서버는 문의를 수신하지 않습니다.

문의 폼 `core-contact`는 정적 HTML에 선언되어 있습니다. HTML 기본 POST, honeypot, 필수 입력·동의 체크, 별도 `success.html` 접수 완료 화면을 사용합니다. 사이트 코드만으로 Netlify 계정의 Form detection이나 이메일 알림 수신자를 설정할 수는 없습니다. 해당 설정과 실제 외부 전송은 아직 완료된 것으로 간주하지 마세요.

배포 자체는 정적 호스팅입니다. Netlify 계정의 요금제와 이용 한도는 [공식 가격 안내](https://www.netlify.com/pricing/)에서 확인하세요.

## 페이지와 기능

| 페이지 | 기능 |
| --- | --- |
| `index.html` | 웰컴/주요 공지 팝업, 24시간 숨김, 연구 트랙 4개, 최신 공지 3건·논문 2건, 협력기관 레일 |
| `about.html` | 센터 소개, 미션·비전, 센터장 인사말, 조직과 연구진 |
| `research.html` | 연도·트랙·검색 필터, PDF / DOI 링크 |
| `notices.html` | 카테고리·검색, 고정 공지, 상세 모달, 공유 가능한 `?notice=id` 주소 |
| `gallery.html` | 사진 그리드, 라이트박스, 좌우 화살표 탐색 |
| `qna.html` | FAQ 아코디언, Netlify Forms 문의, 지도 링크 |
| 공통 | 반응형 드로어 메뉴, 통합 검색 / Ctrl·⌘ K, KO·EN, 포커스 복원, reduced motion |

## 콘텐츠 관리

[콘텐츠 관리 안내](docs/CONTENT.md)의 필드 정의를 참고하세요. JSON을 수정하고 커밋하면 Netlify 자동 배포 시 반영됩니다. 이미지·PDF는 `assets/`에 저장합니다.

- `data/site.json`: 주소, 연구동·호실, 이메일·전화, 인사말, 초기 팝업, 관련 링크
- `data/tracks.json`: 네 가지 연구 분야
- `data/notices.json`, `data/publications.json`, `data/members.json`, `data/gallery.json`, `data/partners.json`: 가변 자료
- `data/faq.json`: 질문과 답변

미등록된 논문, 인물, 행사, 기관 협약을 사실처럼 표시하지 않습니다. 협력기관이 없으면 대학 소속 안내와 협력 문의 링크를 표시합니다. 실제 협력기관을 등록하면 CSS 무한 로고 슬라이더가 자동으로 작동하며 hover, 키보드 포커스, 일시정지 버튼, reduced-motion을 지원합니다.

## KO | EN

Google은 [2026년 10월 1일부터 Website Translator Widget 지원을 종료](https://developers.google.com/search/blog/2020/05/google-translates-website-translator?hl=en)한다고 공지했습니다. 지원이 종료된 위젯 대신 브라우저에서 동작하는 한국어/영어 문구 전환을 제공합니다. API 비용이 없으며 언어 선택을 저장합니다. 자동 기계번역이 아니므로 새로운 자료에는 `ko`와 `en`을 함께 입력하세요. 번역이 빠진 기존 외부 데이터는 한국어로 대체 표시하지만, 빌드 검사는 불완전한 이중언어 객체를 거부합니다.

## 브랜드와 참고 자료

- CSS 테마: HUFS NAVY `#002D56`, HUFS TEAL `#146E7A`, HUFS COOL GRAY `#DADAD3`. 중립 배경·보더는 화이트와 슬레이트를 사용합니다.
- `assets/images/logo.png`: 사용자가 제공한 연구센터 로고 원본.
- `assets/images/hufs_logo.png`: 제공된 `HUFS_UI.zip`의 BS 08 국영문 혼용 시그니처1 type A 벡터에서 추출한 공식 가로형 도안.
- `assets/images/hufs_logo_white.png`: 동일한 Navy 벡터 시그니처의 단색 흰색 웹 출력본. 도안 비율은 유지합니다.
- 로고 높이 36–40px, `object-fit: contain`, `flex-shrink: 0`, 디바이더와 좌우 16px 여백을 적용했습니다.
- 첨부 ZIP에는 별도의 `HUFS_UI.pdf`가 없었습니다. AI 규정 페이지를 확인했습니다. 대학의 최종 사용 승인을 대신하지 않습니다.
- Pretendard CDN이 차단되면 시스템 고딕으로 표시합니다.

[디자인·참고 분석](docs/REFERENCES.md)에 검토 범위와 출처를 기록했습니다. 로고 원본의 색은 임의로 바꾸지 않았습니다. 웹사이트의 지구본 그래픽은 로고와 구분되는 자체 SVG 시각 요소입니다.

## 구현 참고

데이터 로더와 화면 렌더러를 분리했습니다. 향후 Decap CMS가 JSON 파일을 편집하거나 `js/core.js`의 데이터 로더를 Firebase 기반으로 바꿀 수 있습니다. CMS·로그인·Firebase 연결을 이미 구성한 상태는 아닙니다.

데이터는 HTML로 실행하지 않고 이스케이프/`textContent`로 출력합니다. 링크는 URL 프로토콜을 검사합니다. Netlify 보안 헤더와 CSP를 포함하고, 네트워크 오류 시 재시도와 빈 상태를 제공합니다. 외부 iframe 지도를 자동으로 로드하지 않습니다.

문의 운영 시작 전 센터의 실제 연락처, 개인정보 보유·삭제 운영 기준, Netlify 수신 권한과 알림 주소를 확정하세요. 사용자 요청에 따라 실명·실적·연락처를 임의로 생성하지 않았습니다.

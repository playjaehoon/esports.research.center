# JSON 콘텐츠 관리

현재 배열은 비어 있습니다. 아래 예시는 **입력 형식 설명**으로, 실제 인물·논문·행사 또는 제휴를 뜻하지 않습니다. 확인된 내용으로 교체한 후 사용하세요.

## 공통 규칙

- `id`: 영문, 숫자, `-`, `_`로 만든 고유 문자열. 게시 후 가능한 한 유지합니다.
- `published: false`: 화면 및 통합 검색에서 숨깁니다. 생략하면 표시합니다.
- 사용자에게 보이는 문구는 `{ "ko": "한국어", "en": "English" }`로 입력합니다.
- 날짜는 `YYYY-MM-DD`, 논문 연도는 숫자입니다.
- 본문은 일반 텍스트입니다. 문단 구분은 `\n`을 사용하며 HTML은 실행하지 않습니다.
- 이미지·PDF는 `assets/images/`, `assets/papers/` 등에 커밋하고 해당 경로를 입력합니다. 외부 링크는 `https://`를 사용합니다.
- 빈 필드에 `#`, `example.com` 등의 가짜 링크를 넣지 말고 `null` 또는 생략을 사용합니다.
- 수정 후 `npm run check`로 잘못된 날짜·중복 ID·누락된 이미지·불완전한 번역을 확인하세요.

## 공지사항 — notices.json

```json
[
  {
    "id": "your-notice-id",
    "published": false,
    "category": "event",
    "title": { "ko": "확정된 행사 제목", "en": "Confirmed event title" },
    "date": "2026-10-13",
    "summary": { "ko": "행사 요약", "en": "Event summary" },
    "body": { "ko": "첫 문단\n두 번째 문단", "en": "First paragraph\nSecond paragraph" },
    "pinned": true,
    "popup": true
  }
]
```

`category`: `notice`(공지), `event`(학술행사), `press`(언론보도). `pinned`는 공지 페이지 상단 고정, `popup`은 메인 팝업 후보입니다. 팝업 후보가 여러 개면 최신 공지를 선택합니다. 팝업이 없는 경우 site.json의 웰컴 안내를 표시합니다. 24시간 숨김은 이 브라우저 전체 팝업에 적용됩니다. 메인 미리보기는 고정 여부와 별개로 최신 3건입니다.

## 연구 실적 — publications.json

```json
[
  {
    "id": "your-publication-id",
    "published": false,
    "type": { "ko": "학술 논문", "en": "Journal article" },
    "title": { "ko": "확인된 논문 제목", "en": "Verified publication title" },
    "authors": { "ko": "실제 저자명", "en": "Verified authors" },
    "journal": { "ko": "학술지명", "en": "Journal name" },
    "year": 2026,
    "date": "2026-10-13",
    "track": "ecosystem",
    "pdf": null,
    "doi": null
  }
]
```

`track`: `ecosystem`, `performance`, `culture`, `wellbeing`. 연구 과제도 동일한 컬렉션에서 `type`에 연구 과제를 입력합니다. `pdf`는 공개 가능한 파일 경로, `doi`는 `https://doi.org/...` 주소입니다. 링크가 없으면 버튼을 생성하지 않습니다. 메인에는 최신 2건을 표시합니다.

## 연구진 — members.json

```json
[
  {
    "id": "your-member-id",
    "published": false,
    "name": { "ko": "실제 이름", "en": "Verified name" },
    "role": { "ko": "교수진", "en": "Faculty" },
    "affiliation": { "ko": "실제 소속", "en": "Verified affiliation" },
    "bio": { "ko": "연구 분야 소개", "en": "Research interests" },
    "image": null,
    "url": null
  }
]
```

교수진·연구원·학생연구원 역할은 `role`에 표시합니다. 배열의 순서로 렌더링합니다. 사진이 없으면 중립적인 아이콘을 표시합니다.

## 갤러리 — gallery.json

```json
[
  {
    "id": "your-gallery-id",
    "published": false,
    "title": { "ko": "확정된 활동 제목", "en": "Verified activity title" },
    "date": "2026-10-13",
    "image": "assets/images/your-photo.webp",
    "alt": { "ko": "사진의 실제 장면 설명", "en": "Description of the actual scene" },
    "description": { "ko": "활동 설명", "en": "Activity description" }
  }
]
```

`thumbnail`을 추가하면 카드에서 별도 축소 이미지를 사용합니다. 인물 사진은 공개 권한을 확인한 자료를 사용하세요. 라이트박스는 이전·다음 버튼, 좌우 방향키, ESC 닫기를 제공합니다.

## 협력기관 — partners.json

```json
[
  {
    "id": "your-partner-id",
    "published": false,
    "name": { "ko": "확인된 협력기관명", "en": "Confirmed partner name" },
    "logo": "assets/images/your-partner-logo.png",
    "url": "https://confirmed-partner-domain.example"
  }
]
```

위 주소는 문서 예시입니다. 실제 협력과 로고 사용 권한이 확인된 기관만 추가하세요. `published: true`로 전환하면 대학 로고와 함께 무한 레일이 나타납니다. 데이터가 없으면 협력기관을 만들어 표시하지 않습니다.

## 센터 기본 정보 — site.json

- `email`, `phone`: 공개할 연구실 연락처. `null`이면 준비 상태.
- `address`, `room`: 이중언어 주소/호실. 현재 캠퍼스 주소만 공개합니다.
- `directorMessage`: 이중언어 인사말 또는 `null`.
- `popup.enabled`: 전체 홈 팝업 켜기/끄기.
- `popup.title`, `popup.body`, `popup.url`: 공개 공지 후보가 없을 때 보여줄 웰컴 내용.
- `relatedLinks`: 푸터 관련기관 링크. 협력 관계를 의미하는 로고 슬라이더와 분리되어 있습니다.

추가 운영 화면 없이 GitHub의 파일 편집으로 관리할 수 있습니다. Decap CMS를 도입할 때 이 파일들을 file collection으로 연결할 수 있도록 화면과 데이터를 분리해 두었습니다.

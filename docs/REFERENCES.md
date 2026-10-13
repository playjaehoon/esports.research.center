# 디자인 및 구현 참고

확인일: 2026-10-13 (Asia/Seoul).

1. [이전 프로젝트](https://github.com/playjaehoon/HUFS_Esports_Lab): GitHub의 `static/js/site.js`, `static/js/main.js`를 확인했습니다. 메뉴 밖 클릭/ESC 닫기, 포커스 복원, 네이티브 dialog, 로컬 저장소 팝업, 중복 레일의 `aria-hidden`·`inert`, 모션 감소 설정 등의 패턴을 정적 ES module 구조로 재구현했습니다. Flask, 인증, 예약, DB는 가져오지 않았습니다. 기존 배포 URL은 조회 도구에서 직접 접근하지 못했습니다.
2. [서울대학교 스포츠과학연구소](https://snusportscience.snu.ac.kr/): 센터 소개 → 비전 → 조직/연구진, 공지 분류, 학술 자료로 연결되는 신뢰감 있는 정보 구조를 참고했습니다.
3. [연세대 High-Performance HCI Lab](https://esports.yonsei.ac.kr/home_1): Google Sites의 임베디드 본문은 텍스트 조회에서 제한적으로만 노출되었습니다. 사용자가 지정한 논문 아카이브·연구진 카드 원칙을 적용했으며, 전체 화면을 직접 분석했다고 주장하지 않습니다.
4. [University of Oregon EGR Lab](https://egrlab.uoregon.edu/): 다학제적 연구 비전과 네 가지 연구 트랙 소개 방식, [논문 아카이브](https://egrlab.uoregon.edu/articles/)를 참고했습니다. 해당 기관의 논문이나 인물·제휴를 이 센터 실적으로 옮기지 않았습니다.
5. [한국외대 글로벌스포츠산업학부](https://sport.hufs.ac.kr/): 캠퍼스 주소를 확인했습니다. 학부 사무실 연락처를 센터 연락처로 잘못 표기하지 않고 센터 전화·이메일·호실은 준비 상태로 남겼습니다.
6. [Netlify Forms](https://docs.netlify.com/manage/forms/setup/), [알림 설정](https://docs.netlify.com/manage/forms/notifications/): 정적 HTML 감지와 네이티브 POST 구조를 적용했습니다. Form detection과 알림 수신 주소는 Netlify 계정에서 설정해야 합니다.
7. [Google Website Translator 종료 안내](https://developers.google.com/search/blog/2020/05/google-translates-website-translator?hl=en): 2026년 10월 1일 지원 종료에 따라 정적 이중언어 전환을 구현했습니다.

## 자산

제공된 연구센터 PNG는 원본 그대로 복사했습니다. HUFS_UI.zip의 `BS 08 _국영문 혼용 시그니처1.ai` type A를 공식 가로형으로 추출했고, Navy 버전으로 흰색 단색 웹 출력본을 만들었습니다. ZIP의 일부 파일명은 CP949/인코딩 문제로 깨져 있어 도안 자체를 렌더링해 확인했습니다. UI_gif ZIP도 목록과 미리보기를 확인했으며, 최종 웹 자산은 품질이 높은 벡터 도안에서 추출했습니다.

## 검증 한계

### 2026-10-13 연구진·연락처 업데이트

사용자가 지정한 주소(글로벌캠퍼스 어문학관 423호), 연구실 전화 031-330-4221, 공용 이메일 esports.research.center@hufs.ac.kr, 실습실 예약사이트 링크를 반영했습니다. 사용자가 제공한 두 인물 사진은 수정 없이 원본 PNG를 복사했습니다. 센터장 직책은 사용자 제공 정보이며, 류윤지 교수의 학위·소속·연구 분야는 [학교 공식 프로필](https://sport.hufs.ac.kr/profl/sport/71/5358/artclView.do)에서 확인했습니다. 임의의 인사말이나 연구 실적은 추가하지 않았습니다. 정석균 연구원은 사용자 제공 정보에 따라 ‘글로벌e스포츠매니지먼트 석사과정 재학’으로 표기했습니다. 영문 이름의 공식 철자를 받지 않아 영어 화면에서도 정석균의 한글 이름을 유지합니다.

내장 브라우저의 로컬 주소 접근이 브라우저 보안 정책에 의해 차단되어 실제 브라우저 스크린샷, 뷰포트별 레이아웃, 네이티브 dialog의 키보드 포커스 순서는 확인하지 못했습니다. 별도 우회 브라우저를 사용하지 않았습니다. 정적 파일·링크·데이터 검증과 외부 네트워크가 없는 DOM 기반 기능 검사를 사용했습니다. Netlify 실제 전송·알림은 계정 연결 후 최종 확인이 필요합니다.

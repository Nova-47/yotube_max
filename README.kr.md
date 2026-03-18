# YouTube Max

YouTube 플레이어를 브라우저 창 전체에 꽉 차게 확장하는 크롬 익스텐션입니다.
OS 전체화면(F키)과 달리 브라우저 탭과 주소창은 그대로 유지되어, 영상을 보면서 다른 작업을 병행하기에 최적입니다.

브라우저 창을 절반으로 나눠 오른쪽엔 YouTube 영상을, 왼쪽엔 메모 앱이나 문서를 띄워두는 식으로 활용할 수 있습니다.

![YouTube Max Demo](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-1.2.0-orange)

---

## 기능

- **창 모드 전체화면** — 플레이어가 브라우저 뷰포트 100%를 채웁니다
- **플레이어 버튼** — YouTube 컨트롤 바의 전체화면 버튼 옆에 아이콘 추가
- **키보드 단축키** — YouTube 영상 페이지에서 `W` 키
- **글로벌 단축키** — 브라우저 어디서든 `Alt+W`
- **팝업 토글** — 익스텐션 아이콘 클릭으로 빠른 on/off
- **상태 유지** — 페이지 이동 후에도 설정이 기억됩니다

---

## 설치 방법

> 현재 Chrome 웹 스토어에 등록되어 있지 않습니다. 아래 방법으로 직접 설치하세요.

1. 이 저장소를 다운로드하거나 클론합니다
   ```
   git clone https://github.com/nova-47/youtube-max.git
   ```

2. Chrome에서 `chrome://extensions` 로 이동합니다

3. 우상단의 **개발자 모드** 를 활성화합니다

4. **압축해제된 확장 프로그램을 로드합니다** 를 클릭하고 `youtube-max` 폴더를 선택합니다

5. YouTube 영상 페이지로 이동해서 `W` 를 누르면 됩니다

---

## 사용법

| 동작 | 설명 |
|------|------|
| `W` | 현재 영상에서 창 모드 전체화면 토글 |
| `Alt+W` | 어느 탭에서든 토글 |
| 플레이어 컨트롤 바의 **⛶** 버튼 클릭 | 전체화면 버튼 옆 아이콘으로 토글 |
| 우상단 **✕** 버튼 클릭 | 창 모드 전체화면 종료 |
| 익스텐션 아이콘 → 토글 스위치 | 팝업에서 on/off |

> **참고:** 기존 YouTube 전체화면(`F` 키)은 그대로 동작합니다. `W` 는 충돌 없는 별개의 단축키입니다.

---

## 동작 원리

YouTube Max는 CSS를 주입하여 다음을 처리합니다.

- 헤더, 사이드바, 영상 정보 영역을 숨김
- `ytd-player` 요소에 `position: fixed; inset: 0` 을 적용해 뷰포트 전체를 점유
- 모든 변경을 `html` 태그의 단일 클래스로 스코프 처리 — 토글이 즉각적이고 깔끔

`W` 키는 `document_start` 시점에 페이지의 메인 월드에서 가로채기 때문에 YouTube가 자체 키보드 리스너를 등록하기 전에 처리됩니다.

---

## 파일 구조

```
youtube-max/
├── manifest.json        # Manifest V3
├── key_interceptor.js   # 키보드 가로채기 (document_start, MAIN world)
├── content.js           # CSS 주입 + 플레이어 버튼 + 토글 로직
├── content.css          # 트랜지션 스타일
├── background.js        # 글로벌 단축키 (Alt+W) 처리
├── popup.html           # 익스텐션 팝업 UI
├── popup.js             # 팝업 로직
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 변경 이력

### v1.2.0
- 기능: 토글 시 부드러운 애니메이션 적용 — 플레이어가 원래 위치에서 전체화면으로 확장 (300ms, Material Design easing), UI 요소 동시 fade out
- 기능: 종료 시 어두운 오버레이 fade 애니메이션 (150ms in + 150ms out)
- 기능: 닫기 버튼(✕) 부드럽게 fade-in으로 등장

### v1.1.0
- 수정: `tabs` 권한 누락으로 Alt+W 단축키 및 팝업이 동작하지 않던 문제 해결
- 수정: 창 모드 전체화면 중 F키로 OS 전체화면 전환 시 컨트롤바가 깨지던 문제 해결
- 수정: W키 또는 플레이어 버튼으로 토글 시 팝업 체크박스가 실시간으로 동기화되지 않던 문제 해결
- 수정: SPA 페이지 이동 시 MutationObserver가 누적되던 문제 해결
- 수정: 새 영상으로 이동해도 창 모드 전체화면 상태가 복원되지 않던 문제 해결
- 수정: `sendMessage` 에러가 잡히지 않던 문제 해결

### v1.0.0
- 최초 릴리즈

---

## 기여

Pull Request는 언제든 환영합니다. 큰 변경 사항은 먼저 Issue를 열어 논의해 주세요.

## 라이선스

[MIT](LICENSE)

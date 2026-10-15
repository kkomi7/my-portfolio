# Pocari-inspired theme

참고 사이트의 레이아웃, 문구, 기능은 유지하고 색상만 청량한 블루·화이트 계열로 변경한 버전입니다.

## 실행

프로젝트 폴더에서 로컬 서버를 실행합니다.

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 주요 색상

- Primary blue: `#0057E7`
- Hover blue: `#0046C7`
- Sky blue: `#00A9F4`
- Ice blue: `#DDEEFF`
- Light background: `#F3FAFF`
- Dark background: `#061A2C`
- Dark accent: `#26B8FF`

색상은 `css/styles.css`의 라이트·다크 디자인 토큰에서 조정할 수 있습니다.

## 카테고리 관리

가계부 화면의 `대분류 관리`에서 대분류를 추가·수정·삭제할 수 있습니다. 각 대분류 오른쪽의 `소분류` 버튼을 누르면 추천 소분류도 직접 추가·이름 수정·삭제하거나 기본값으로 복원할 수 있습니다.

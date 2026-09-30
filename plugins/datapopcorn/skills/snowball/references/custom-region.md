# 새 지역 구현 안내

`assets/worlds.html`의 작업 사본을 수정한다. 외부 이미지 생성이나 Remotion 설치는 필요하지 않다.

## 코드 연결 지점

- `CONFIG.globe.cityKey`: 새 지역의 영문 키. `city`: 각인 기본값.
- `.cbtn` 목록: `data-city` 키와 표시 이름을 추가한다. 초기 키 버튼만 `aria-pressed="true"`로 둔다.
- `buildGlobe()` 안의 `CITY_BUILD`: 새 키를 새 builder 함수에 연결한다.
- 초기 호출은 `setCityKey(cfg.cityKey || 'seoul')`이다. 새 지역 키가 CITY_BUILD에 등록되었는지 확인한다.
- `state.cityKey`는 저장 파일명에도 쓰인다. 키는 영문 소문자·숫자·하이픈을 사용한다.

## Builder 계약

`buildGlobe()` 내부의 기존 `buildSeoul`, `buildParis`를 참고한다. 새 builder는 `root`를 받고 아래 값을 반환해야 한다.

```js
function buildRegion(root) {
  glowList = [];
  const H = (x, z) => FLOOR;
  root.add(makeTerrain(H, '#d9e6e5'));
  // 조사한 지역의 지형과 랜드마크를 THREE 메쉬로 만든다.
  // 이 빈 틀만으로 완료하지 않는다.
  return {
    H, glows: glowList, label: 'REGION',
    lights: [
      {pos: [0, 0, .55], color: '#ffc27a', i: 1.3, d: 3.4},
      {pos: [.2, -1.1, .9], color: '#ffdf9a', i: .8, d: 2.2}
    ]
    // 움직이는 요소가 있으면 tick(t)를 추가한다.
  };
}
```

`H(x,z)`는 눈이 닿을 지형 높이 함수다. `glows`는 배열이어야 하며 조명은 두 개가 필요하다. 지형 반경은 기존 `makeTerrain`의 1.30을 기준으로 하고 구슬 위쪽으로 갈수록 폭을 줄인다. 랜드마크를 작게 반복하기보다 대표 실루엣 하나가 읽히도록 한다. 바다·산·교량도 평면 텍스트가 아닌 장면의 형태로 표현한다.

## 검수

브라우저 콘솔 오류, 초기 지역과 각인 일치, 기본 도시 → 새 지역 전환, 각인 변경, 0초·중간·마지막 장면, 눈과 카메라 움직임을 확인한다. 영상 요청이면 WebM 저장과 디코드까지 확인한다. 코드 문법 검사만 통과한 결과를 시각 검수 완료라고 기록하지 않는다.

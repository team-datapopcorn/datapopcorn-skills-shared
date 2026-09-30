# 부산 스노우볼 재검증 · Sonnet 5.5

기존 Codex 제작 테스트를 Sonnet 콘텐츠 근거에서 제외하고 실제 Sonnet 5.5로 재검증했다.
Claude 웹 모델 선택: Sonnet 5.5 / 중간. 배포 SKILL.md와 custom-region.md를 프롬프트로 전달하고 기존 Sonnet v02를 바탕으로 새 buildBusan을 작성하도록 요청. Codex 부산 코드는 전달하지 않았다.
원본 SHA256: c6eb613af858149d4e487797ea20e40989d108cc2422f24cc3597cd42eebec9d
정본: study-remotion/projects/VID-20260929-sonnet-code-motion/01-source/original/busan-sonnet-v01.html
공식 참고: https://www.visitbusan.net/archive/eng/dataSearchEng/view.nm?dataSid=METADATA019098
지역: 광안대교·해안·배·조명, 실제 축척 아님.
macOS Chrome 직접 확인: 초기 부산/BUSAN, 서울 전환 후 부산 복귀, 한글 각인 '부산 여행', 눈/카메라 재생, WebM 다운로드.
ffprobe: 720x1280, 8.072597초, 243프레임. WebM 시간표시 일부 중복으로 ffmpeg null muxer DTS 경고가 있었다. 영상 디코드는 가능. 일반 GPU Chrome과 Sonnet의 저속 소프트웨어 GL 녹화 결과를 구분한다.
Claude Code 신규 설치부터 실행하는 통합 테스트는 미실시. 모든 지역 품질을 보장하지 않는다.
부산 생성 코드 수정 없이 원본을 보존했다. 블로그 이미지는 Sonnet 결과로 교체.

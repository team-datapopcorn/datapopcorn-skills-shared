# DataPopcorn

AI로 직접 써먹는 스킬 모음입니다. 콘텐츠 제작, 업무 자동화 등 다양한 작업의 지침과 실행 예제를 하나의 플러그인으로 제공합니다.

## Claude Code에 설치하기

아래 명령은 Claude Code 대화창에서 실행합니다.

```text
/plugin marketplace add team-datapopcorn/datapopcorn-skills-shared
/plugin install datapopcorn@datapopcorn
```

설치 후 Claude Code를 다시 시작하고 원하는 스킬을 부르세요.

| 명령 | 용도 | 추가 준비 |
|---|---|---|
| `/datapopcorn:snowball` | 원하는 지역의 스노글로브 | Chrome |
| `/datapopcorn:sunset-flight` | 노을 비행 | Chrome |
| `/datapopcorn:paper-motion` | 종이 브랜드 모션 | Chrome |
| `/datapopcorn:n8n-error-setup` | n8n 에러 알림 설정 | N8N_URL, N8N_API_KEY |

영상 예제는 Chrome에서 WebM으로 저장하며 MP4 변환에는 FFmpeg가 필요합니다. AI 이용 요금은 별도입니다. n8n 스킬은 요청해 실행할 때 별도 연결 정보를 준비합니다.

## 로컬 확인

```bash
claude --plugin-dir ./plugins/datapopcorn
claude plugin validate ./plugins/datapopcorn
claude plugin validate ./.claude-plugin/marketplace.json
```

## 스킬 하나만 설치하기

```bash
./install.sh snowball /path/to/your-project
```

개별 설치는 `/snowball`처럼 부릅니다. 플러그인 설치와 중복해서 설치할 필요는 없습니다.

## 구조와 확장

정본 스킬은 `plugins/datapopcorn/skills/`에 있습니다. 새 작업은 이 폴더에 스킬을 추가하고 플러그인 버전을 올려 배포합니다. 모션그래픽에 한정하지 않습니다.

Claude Code용 `.claude-plugin/plugin.json`과 Codex용 `.codex-plugin/plugin.json`이 같은 스킬을 가리킵니다. 위 설치 명령은 Claude Code용이며 Codex 설치·실행은 별도 검증이 필요합니다.

## 라이선스

MIT. 예제의 외부 라이브러리와 글꼴은 각 스킬의 THIRD_PARTY.md를 확인하세요.

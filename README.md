# datapopcorn-skills-shared

Claude Code로 n8n을 관리할 때 쓸 수 있는 스킬을 모아둔 저장소입니다.

## Claude Code 스킬이란?

[Claude Code](https://claude.ai/claude-code)에서 특정 작업을 수행할 때 참고하는 가이드 문서(SKILL.md)입니다. 프로젝트에 설치해두면 자연어 요청만으로 복잡한 작업을 자동으로 처리할 수 있습니다.

```
사람: "n8n 에러 알림 설정해줘"
Claude Code: 스킬을 읽고 → 스크립트 생성 → API 호출 → 설정 완료
```

## 스킬 목록

| 스킬 | 설명 | 필요 환경변수 |
|------|------|---------------|
| [n8n-error-setup](skills/n8n-error-setup/) | n8n 워크플로우 에러 알림 일괄 설정 + 신규 워크플로우 자동 감지 배포 | `N8N_URL`, `N8N_API_KEY` |

> 새로운 스킬이 계속 추가될 예정입니다. Watch 또는 Star로 업데이트를 받아보세요.

## 설치 방법

### 방법 1: 설치 스크립트 (원하는 스킬만)

```bash
git clone https://github.com/team-datapopcorn/datapopcorn-skills-shared.git /tmp/datapopcorn-skills-shared
/tmp/datapopcorn-skills-shared/install.sh n8n-error-setup /path/to/your-project
```

### 방법 2: 수동 복사

```bash
mkdir -p your-project/.claude/skills/n8n-error-setup
cp skills/n8n-error-setup/SKILL.md your-project/.claude/skills/n8n-error-setup/
```

## 사용법

1. 스킬 설치
2. 환경변수 설정 (각 스킬 폴더의 `.env.example` 참고)
3. Claude Code에서 자연어로 요청하면 끝

## 요구사항

- [Claude Code](https://claude.ai/claude-code) 설치 필요

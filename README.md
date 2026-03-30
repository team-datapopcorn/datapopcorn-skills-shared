# datapopcorn-skills-shared

datapopcorn의 Claude Code 스킬 모음입니다.

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| [n8n-error-setup](skills/n8n-error-setup/) | n8n 워크플로우에 에러 알림 일괄 설정 + 신규 워크플로우 자동 감지 워크플로우 배포 |

## 설치 방법

### 방법 1: 설치 스크립트 (특정 스킬만)

```bash
git clone https://github.com/team-datapopcorn/datapopcorn-skills-shared.git /tmp/datapopcorn-skills-shared
/tmp/datapopcorn-skills-shared/install.sh n8n-error-setup /path/to/your-project
```

### 방법 2: 수동 복사

```bash
# 원하는 스킬의 SKILL.md를 프로젝트의 .claude/skills/ 에 복사
mkdir -p your-project/.claude/skills/n8n-error-setup
cp skills/n8n-error-setup/SKILL.md your-project/.claude/skills/n8n-error-setup/
```

## 사용법

1. 스킬 설치
2. 필요한 환경변수 설정 (각 스킬 폴더의 `.env.example` 참고)
3. Claude Code에서 자연어로 요청

```
# 예시
> n8n 에러 알림 설정해줘
> 에러 자동 감지 워크플로우 만들어줘
```

## 요구사항

- [Claude Code](https://claude.ai/claude-code) 설치 필요

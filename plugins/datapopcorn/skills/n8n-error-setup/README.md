# n8n-error-setup

n8n 워크플로우에 에러 알림을 일괄 설정하고, 신규 워크플로우를 매일 자동 감지하는 워크플로우를 배포하는 Claude Code 스킬입니다.

## 설치

```bash
npx skills add team-datapopcorn/datapopcorn-skills-shared --skill n8n-error-setup
```

## 이런 분들에게 필요합니다

- n8n 워크플로우가 많은데 에러 알림이 제각각이거나 빠져 있는 경우
- 새 워크플로우를 만들 때마다 에러 핸들러를 수동으로 연결하기 귀찮은 경우
- 팀원이 에러 핸들러 설정을 깜빡해도 자동으로 잡아주는 안전장치가 필요한 경우

## 기능

| 기능 | 설명 |
|------|------|
| **일괄 설정** | 현재 활성 워크플로우 전체에 에러 핸들러를 즉시 연결 |
| **자동 감지** | 매일 09:00에 신규 워크플로우를 감지해 에러 핸들러를 자동 설정하는 n8n 네이티브 워크플로우 배포 |

## 필요 환경변수

| 변수 | 설명 | 필수 |
|------|------|:----:|
| `N8N_URL` | n8n 인스턴스 URL (예: `https://your-instance.app.n8n.cloud`) | O |
| `N8N_API_KEY` | n8n API 키 (Settings > n8n API에서 발급) | O |
| `SLACK_CRED_ID` | Slack credential ID (에러 핸들러 자동 생성 시 필요) | 선택 |

## 사용 예시

```
> n8n 에러 알림 설정해줘
```

```
> 에러 자동 감지 워크플로우 만들어줘
```

## 실행 결과 예시

### 일괄 설정

```
=== n8n 에러 핸들러 일괄 설정 ===

총 42개 워크플로우 중 'demo-error' 태그: 42개
업데이트 대상 (활성 + 태그 + errorWorkflow 미설정): 17개

  ✅ KAMIS-AutoResearch-v3
  ✅ Slack-Bot-Main
  ✅ Daily-Report-Generator
  ✅ Customer-Feedback-Pipeline
  ...

완료: 17개 성공, 0개 실패
```

### 자동 감지 워크플로우 배포

```
=== n8n 자동 에러 핸들러 설정 워크플로우 배포 ===

[1/4] 에러 핸들러 워크플로우 조회...
  에러 핸들러 ID: ljMH53cYUmul766o

[2/4] API credential 준비...
  credential 생성 완료: x1EVIWhtqJ9tHl3E

[3/4] 자동 감지 워크플로우 생성...
  워크플로우 생성 완료: VqiDW11VQn9vHjKv

[4/4] 워크플로우 활성화...
  활성화 완료!

=== 배포 완료 ===
워크플로우: Auto Error Handler Setup (Daily)
ID: VqiDW11VQn9vHjKv
실행 주기: 매일 09:00 (Asia/Seoul)
에러 핸들러 대상: Error Handler - Slack #n8n-errors
```

## 배포되는 n8n 워크플로우 구조

```
Schedule Trigger (매일 09:00)
→ HTTP Request (활성 워크플로우 전체 조회)
→ Code (에러 핸들러 미설정 워크플로우 필터링)
→ HTTP Request (에러 핸들러 설정 업데이트)
```

- HTTP Header Auth credential이 자동 생성됩니다
- 이미 에러 핸들러가 설정된 워크플로우는 건너뜁니다
- 에러 핸들러 워크플로우 자기 자신은 대상에서 제외됩니다 (순환 참조 방지)

## FAQ

**Q: 에러 핸들러 워크플로우가 없으면?**
A: "Error Handler - Slack #n8n-errors" 이름의 워크플로우를 먼저 만들어야 합니다. `SLACK_CRED_ID` 환경변수가 있으면 자동 생성도 가능합니다.

**Q: n8n 클라우드에서도 동작하나요?**
A: 네. n8n Cloud, 셀프호스팅 모두 동작합니다. API 키만 발급하면 됩니다.

**Q: 비활성 워크플로우도 설정되나요?**
A: 아니요. 활성(active) 워크플로우만 대상입니다.

**Q: 이미 에러 핸들러가 설정된 워크플로우는?**
A: 건너뜁니다. 기존 설정을 덮어쓰지 않습니다.

**Q: 자동 감지 워크플로우 배포 후 추가로 할 일이 있나요?**
A: 없습니다. 매일 09:00에 자동으로 실행됩니다. n8n UI에서 별도로 설정할 것은 없습니다.

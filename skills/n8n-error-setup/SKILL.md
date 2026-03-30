---
name: n8n-error-setup
description: "n8n 워크플로우에 에러 알림을 일괄 설정하고, 신규 워크플로우를 매일 자동 감지하는 n8n 네이티브 워크플로우를 배포하는 스킬. 'n8n 에러 알림 설정해줘', 'n8n error setup', '에러 워크플로우 일괄 설정', '에러 자동 감지 워크플로우 만들어줘' 같은 요청에 트리거."
argument-hint: "[에러 핸들러 워크플로우 이름 (선택)]"
allowed-tools: Read, Write, Bash, Glob
---

# n8n 에러 워크플로우 설정

두 가지 기능을 제공한다:
1. **일괄 설정** — 현재 활성 워크플로우 전체에 에러 핸들러를 즉시 연결 (Python 스크립트)
2. **자동 감지** — 매일 신규 워크플로우를 감지해 에러 핸들러를 자동 설정하는 n8n 네이티브 워크플로우 배포 (Python 배포 스크립트)

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `N8N_URL` | n8n 인스턴스 URL (예: `http://localhost:5678`) | O |
| `N8N_API_KEY` | n8n API 키 (Settings > n8n API에서 발급) | O |
| `SLACK_CRED_ID` | Slack credential ID (에러 핸들러 자동 생성 시 필요) | 선택 |

실행 전 환경변수가 설정되어 있는지 확인하고, 없으면 사용자에게 안내한다.

## 기능 1: 에러 핸들러 일괄 설정 (즉시 실행)

### 1. Python 스크립트 생성

아래 로직을 포함하는 Python 스크립트를 생성한다:

#### 1-1. 전체 워크플로우 가져오기 (페이지네이션)

```python
import os, requests

N8N_URL = os.environ["N8N_URL"].rstrip("/")
API_KEY = os.environ["N8N_API_KEY"]
HEADERS = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

def get_all_workflows():
    workflows = []
    cursor = None
    while True:
        params = {"limit": 250}
        if cursor:
            params["cursor"] = cursor
        r = requests.get(f"{N8N_URL}/api/v1/workflows", headers=HEADERS, params=params)
        r.raise_for_status()
        data = r.json()
        workflows.extend(data["data"])
        cursor = data.get("nextCursor")
        if not cursor:
            break
    return workflows
```

#### 1-2. 에러 핸들러 워크플로우 찾기 또는 생성

"Error Handler" 이름이 포함된 워크플로우를 찾는다. 없으면 Error Trigger + Slack 노드로 자동 생성한다.

```python
def find_or_create_error_handler(workflows):
    # 기존 에러 핸들러 찾기
    for wf in workflows:
        if "error handler" in wf["name"].lower() or "error trigger" in wf["name"].lower():
            return wf["id"]

    # 없으면 생성
    slack_cred_id = os.environ.get("SLACK_CRED_ID")
    if not slack_cred_id:
        print("에러 핸들러 워크플로우가 없고 SLACK_CRED_ID도 미설정입니다.")
        print("먼저 n8n에서 에러 핸들러 워크플로우를 수동 생성하거나 SLACK_CRED_ID를 설정하세요.")
        return None

    payload = {
        "name": "Error Handler - Slack #n8n-errors",
        "nodes": [
            {
                "parameters": {},
                "name": "Error Trigger",
                "type": "n8n-nodes-base.errorTrigger",
                "typeVersion": 1,
                "position": [240, 300]
            },
            {
                "parameters": {
                    "channel": "#n8n-errors",
                    "text": "=워크플로우 실패: {{ $json.workflow.name }}\n에러 노드: {{ $json.execution.lastNodeExecuted }}\n에러 메시지: {{ $json.execution.error.message }}\n실행 URL: {{ $json.execution.url }}"
                },
                "name": "Slack",
                "type": "n8n-nodes-base.slack",
                "typeVersion": 2,
                "position": [460, 300],
                "credentials": {
                    "slackApi": {
                        "id": slack_cred_id,
                        "name": "Slack account"
                    }
                }
            }
        ],
        "connections": {
            "Error Trigger": {
                "main": [[{"node": "Slack", "type": "main", "index": 0}]]
            }
        },
        "settings": {
            "saveExecutionProgress": True,
            "saveDataErrorExecution": "all",
            "saveDataSuccessExecution": "errors",
            "timezone": "Asia/Seoul"
        }
    }
    r = requests.post(f"{N8N_URL}/api/v1/workflows", headers=HEADERS, json=payload)
    r.raise_for_status()
    wf_id = r.json()["id"]
    # 활성화
    requests.post(f"{N8N_URL}/api/v1/workflows/{wf_id}/activate", headers=HEADERS)
    print(f"에러 핸들러 워크플로우 생성 완료: {wf_id}")
    return wf_id
```

#### 1-3. 대상 필터링 및 일괄 업데이트

```python
def update_workflows(workflows, error_handler_id):
    targets = [
        wf for wf in workflows
        if wf.get("active")
        and wf["id"] != error_handler_id
        and not wf.get("settings", {}).get("errorWorkflow")
    ]

    print(f"총 {len(workflows)}개 워크플로우 발견")
    print(f"업데이트 대상: {len(targets)}개")

    success, fail = 0, 0
    for wf in targets:
        body = {
            "name": wf["name"],
            "nodes": wf["nodes"],
            "connections": wf["connections"],
            "settings": clean_settings(wf.get("settings", {}), error_handler_id)
        }
        try:
            r = requests.put(f"{N8N_URL}/api/v1/workflows/{wf['id']}", headers=HEADERS, json=body)
            r.raise_for_status()
            print(f"  ✅ {wf['name']}")
            success += 1
        except Exception as e:
            print(f"  ❌ {wf['name']}: {e}")
            fail += 1

    print(f"\n완료: {success}개 성공, {fail}개 실패")
```

#### 1-4. 메인 실행

```python
if __name__ == "__main__":
    workflows = get_all_workflows()
    error_handler_id = find_or_create_error_handler(workflows)
    if error_handler_id:
        update_workflows(workflows, error_handler_id)
```

### 2. 실행

```bash
python set_error_workflow.py
```

### 3. 결과 확인

실행 후 사용자에게 결과를 보여준다:
- 총 워크플로우 수
- 업데이트된 워크플로우 수
- 성공/실패 수

## PUT body 규칙 (중요)

PUT `/api/v1/workflows/:id`에는 아래 4개 필드만 포함해야 한다:
- `name`
- `nodes`
- `connections`
- `settings`

**반드시 제외할 필드**: `id`, `active`, `createdAt`, `updatedAt`, `tags`, `versionId`

이를 포함하면 `400 Bad Request: "request/body must NOT have additional properties"` 에러 발생.

### settings 내부 필드도 정제 필수

GET 응답의 `settings`에는 n8n 내부 전용 필드가 포함되어 있다. 이를 그대로 PUT하면 `400 Bad Request: "request/body/settings must NOT have additional properties"` 에러 발생.

**허용되는 settings 필드만 추출해서 보내야 한다:**

```python
ALLOWED_SETTINGS = [
    "errorWorkflow", "timezone", "saveExecutionProgress",
    "saveDataErrorExecution", "saveDataSuccessExecution",
    "saveManualExecutions", "executionOrder", "callerPolicy",
]

def clean_settings(settings, error_handler_id):
    cleaned = {}
    for key in ALLOWED_SETTINGS:
        if key in settings:
            cleaned[key] = settings[key]
    cleaned["errorWorkflow"] = error_handler_id
    return cleaned
```

n8n Code 노드(JavaScript)에서도 동일하게 적용:

```javascript
const ALLOWED_SETTINGS = [
  'errorWorkflow', 'timezone', 'saveExecutionProgress',
  'saveDataErrorExecution', 'saveDataSuccessExecution',
  'saveManualExecutions', 'executionOrder', 'callerPolicy',
];

function cleanSettings(settings) {
  const cleaned = {};
  for (const key of ALLOWED_SETTINGS) {
    if (settings[key] !== undefined) {
      cleaned[key] = settings[key];
    }
  }
  return cleaned;
}
```

## 기능 2: 신규 워크플로우 자동 감지 워크플로우 배포

n8n 내부에서 매일 실행되는 워크플로우를 API로 생성·활성화한다.

### 워크플로우 구조

```
Schedule Trigger (매일 09:00)
→ HTTP Request (GET /api/v1/workflows?active=true)
→ Code (에러 핸들러 미설정 워크플로우 필터링)
→ HTTP Request (PUT /api/v1/workflows/:id — 에러 핸들러 설정)
```

### 배포 스크립트 생성

아래 로직을 포함하는 Python 배포 스크립트를 생성한다:

#### 2-1. 에러 핸들러 워크플로우 찾기

사용자가 지정한 이름(기본: "Error Handler - Slack #n8n-errors")으로 조회한다.

```python
def find_error_handler(workflows):
    for wf in workflows:
        if wf["name"] == ERROR_HANDLER_NAME:
            return wf["id"]
    return None
```

#### 2-2. HTTP Header Auth credential 생성

n8n 워크플로우의 HTTP Request 노드가 n8n API를 호출하려면 credential이 필요하다. API로 자동 생성한다.

```python
def create_or_find_credential():
    cred_name = "n8n API Key (Auto Error Setup)"

    # 기존 credential 찾기
    r = requests.get(f"{N8N_URL}/api/v1/credentials", headers=HEADERS)
    r.raise_for_status()
    for cred in r.json().get("data", []):
        if cred["name"] == cred_name:
            return cred["id"], cred_name

    # 새로 생성
    payload = {
        "name": cred_name,
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-N8N-API-KEY",
            "value": API_KEY,
        },
    }
    r = requests.post(f"{N8N_URL}/api/v1/credentials", headers=HEADERS, json=payload)
    r.raise_for_status()
    cred = r.json()
    return cred["id"], cred_name
```

#### 2-3. 워크플로우 JSON 구성

4개 노드로 구성된 워크플로우를 생성한다:

**Schedule Trigger** — 매일 09:00 (Asia/Seoul)

`"field": "hours"`는 "N시간마다"(hourly interval)로 해석된다. 매일 1회 실행하려면 `cronExpression`을 사용해야 한다.

```python
{
    "parameters": {
        "rule": {
            "interval": [
                {
                    "field": "cronExpression",
                    "expression": "0 9 * * *"
                }
            ]
        }
    },
    "name": "Schedule Trigger",
    "type": "n8n-nodes-base.scheduleTrigger",
    "typeVersion": 1.2,
    "position": [0, 300],
}
```

**Get Active Workflows** — HTTP Request (GET)

```python
{
    "parameters": {
        "url": f"{N8N_URL}/api/v1/workflows",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": True,
        "queryParameters": {
            "parameters": [
                {"name": "limit", "value": "250"},
                {"name": "active", "value": "true"},
            ]
        },
        "options": {},
    },
    "name": "Get Active Workflows",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [240, 300],
    "credentials": {
        "httpHeaderAuth": {"id": cred_id, "name": cred_name}
    },
}
```

**Filter Without Error Handler** — Code 노드 (JavaScript)

`cleanSettings`로 settings를 정제해야 한다. (PUT body 규칙 참고)

```javascript
const ERROR_HANDLER_ID = "<에러핸들러ID>";
const workflows = $input.first().json.data;

const ALLOWED_SETTINGS = [
  'errorWorkflow', 'timezone', 'saveExecutionProgress',
  'saveDataErrorExecution', 'saveDataSuccessExecution',
  'saveManualExecutions', 'executionOrder', 'callerPolicy',
];

function cleanSettings(settings) {
  const cleaned = {};
  for (const key of ALLOWED_SETTINGS) {
    if (settings[key] !== undefined) {
      cleaned[key] = settings[key];
    }
  }
  cleaned.errorWorkflow = ERROR_HANDLER_ID;
  return cleaned;
}

const targets = workflows.filter(wf =>
  wf.active &&
  wf.id !== ERROR_HANDLER_ID &&
  !wf.settings?.errorWorkflow
);

if (targets.length === 0) {
  return [{ json: { message: "모든 워크플로우에 에러 핸들러가 설정되어 있습니다.", count: 0 } }];
}

// Code 노드에서 body를 JSON 문자열로 미리 변환
// HTTP Request 노드의 jsonBody에서 JSON.stringify($json.body)를 쓰면
// "not valid JSON" 에러가 발생하므로, 반드시 여기서 문자열화한다.
return targets.map(wf => ({
  json: {
    workflowId: wf.id,
    workflowName: wf.name,
    bodyJson: JSON.stringify({
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: cleanSettings(wf.settings || {}),
    }),
  },
}));
```

**Set Error Handler** — HTTP Request (PUT, 아이템별 실행)

Code 노드에서 미리 문자열화한 `bodyJson`을 그대로 사용한다.

```python
{
    "parameters": {
        "url": f"={N8N_URL}/api/v1/workflows/{{{{$json.workflowId}}}}",
        "method": "PUT",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={{ $json.bodyJson }}",
        "options": {},
    },
    "name": "Set Error Handler",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [720, 300],
    "credentials": {
        "httpHeaderAuth": {"id": cred_id, "name": cred_name}
    },
}
```

#### 2-4. 배포 (생성 + 활성화)

```python
# 동일 이름 워크플로우가 있으면 삭제 후 재생성
r = requests.post(f"{N8N_URL}/api/v1/workflows", headers=HEADERS, json=wf_payload)
r.raise_for_status()
wf_id = r.json()["id"]

# 활성화
requests.post(f"{N8N_URL}/api/v1/workflows/{wf_id}/activate", headers=HEADERS)
```

#### 2-5. 태그 설정

워크플로우에 태그를 붙이려면 별도 endpoint를 사용한다:

```python
# PUT /api/v1/workflows/:id/tags (워크플로우 PUT body에 tags 넣으면 400 에러)
requests.put(
    f"{N8N_URL}/api/v1/workflows/{wf_id}/tags",
    headers=HEADERS,
    json=[{"id": tag_id}]
)
```

## 주의사항

- 에러 핸들러 워크플로우 자기 자신은 업데이트 대상에서 제외 (순환 참조 방지)
- 이미 errorWorkflow가 설정된 워크플로우는 건너뛰기
- 비활성(inactive) 워크플로우는 기본적으로 건너뛰기
- 처음 실행할 때는 1~2개만 먼저 테스트 추천
- API 키는 환경변수로 관리 (코드에 직접 적지 않기)
- n8n API 버전에 따라 settings 허용 필드가 다를 수 있음

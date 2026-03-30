#!/bin/bash
# sujin-claude-skills installer
# 사용법: ./install.sh <skill-name> [target-dir]
# 예시:  ./install.sh n8n-error-setup
#        ./install.sh n8n-error-setup /path/to/my-project

set -e

SKILL_NAME="${1:?사용법: ./install.sh <skill-name> [target-dir]}"
TARGET_DIR="${2:-.}"
SKILL_SRC="$(cd "$(dirname "$0")" && pwd)/skills/${SKILL_NAME}"
SKILL_DST="${TARGET_DIR}/.claude/skills/${SKILL_NAME}"

# 스킬 존재 확인
if [ ! -d "$SKILL_SRC" ]; then
    echo "스킬을 찾을 수 없습니다: ${SKILL_NAME}"
    echo ""
    echo "사용 가능한 스킬:"
    ls -1 "$(cd "$(dirname "$0")" && pwd)/skills/"
    exit 1
fi

# 설치
mkdir -p "$SKILL_DST"
cp -r "$SKILL_SRC"/SKILL.md "$SKILL_DST/"
echo "설치 완료: ${SKILL_NAME} → ${SKILL_DST}"

# .env.example 복사 (있으면)
if [ -f "$SKILL_SRC/.env.example" ]; then
    if [ ! -f "${TARGET_DIR}/.env" ]; then
        cp "$SKILL_SRC/.env.example" "${TARGET_DIR}/.env.example"
        echo ".env.example 복사됨 → ${TARGET_DIR}/.env.example"
        echo "  .env 파일을 만들고 값을 채워주세요."
    fi
fi

echo ""
echo "사용법: Claude Code에서 스킬 관련 요청을 하면 자동으로 실행됩니다."

#!/usr/bin/env bash
# ============================================================
#  SAFETY GUARD  —  Claude Code PreToolUse フック（最後の砦）
# ------------------------------------------------------------
#  破壊的な Bash コマンドを実行“前”に検知して停止します。
#  既定は「許可(exit 0)」。カタストロフィックな時だけ exit 2 で
#  ブロックします（誤爆で全部止めないための fail-open 設計）。
#
#  これは“最後の1枚”であって完全ではありません。本当の安全は
#  git + GitHub への push + Time Machine（SAFETY.md 参照）です。
# ============================================================
set -u

input="$(cat 2>/dev/null || true)"

# tool_input.command を素朴に取り出す（取れなければ全体を対象に）
cmd="$(printf '%s' "$input" \
  | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 \
  | sed -E 's/.*"command"[[:space:]]*:[[:space:]]*"//; s/"$//')"
[ -z "${cmd:-}" ] && cmd="$input"

block() {
  echo "🛑 SAFETY GUARD がコマンドを停止しました：$1" >&2
  echo "   → $cmd" >&2
  echo "   本当に必要なら、人間が内容を確認したうえで手動で実行してください。" >&2
  exit 2
}

# 1) rm -rf などによる「ルート / ホーム / ワイルドカード」の一括削除
if printf '%s' "$cmd" | grep -Eq '[[:space:]]-[a-zA-Z]*(rf|fr)[a-zA-Z]*([[:space:]]|$)'; then
  if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])(/|~|\$HOME|/\*|\*|\.)([[:space:]]|$)'; then
    block "危険な一括削除（rm -rf でルート/ホーム/全体を対象）"
  fi
fi

# 2) git の強制 push（リモート履歴の破壊）
printf '%s' "$cmd" | grep -Eq 'git[[:space:]].*push.*(--force([^-a-z]|$)|--force-with-lease|[[:space:]]-f([[:space:]]|$))' \
  && block "git 強制 push（リモートの履歴を上書き破壊する恐れ）"

# 3) ブランチや履歴の破壊
printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+branch[[:space:]].*-D' \
  && block "git branch -D（ブランチの強制削除）"
printf '%s' "$cmd" | grep -Eq 'git[[:space:]].*update-ref[[:space:]]+-d' \
  && block "git update-ref -d（参照の削除）"

# 4) ディスク / デバイスの破壊
printf '%s' "$cmd" | grep -Eq '(^|[^a-zA-Z])(mkfs|fdisk|dd)[[:space:]]' \
  && block "ディスク破壊系コマンド（mkfs/fdisk/dd）"
printf '%s' "$cmd" | grep -Eq '>[[:space:]]*/dev/(sd|nvme|disk|vd|xvd)' \
  && block "デバイスへの直接書き込み"

# 5) 権限昇格を伴う削除
printf '%s' "$cmd" | grep -Eq 'sudo[[:space:]]+rm[[:space:]]' \
  && block "sudo rm（管理者権限での削除）"

exit 0

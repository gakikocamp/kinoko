#!/usr/bin/env bash
# ============================================================
#  setup-guardrails.sh — 安全ガードを有効化する（1回だけ実行）
# ------------------------------------------------------------
#  実行: リポジトリ直下で  bash setup-guardrails.sh
#  やること:
#   1) git フック（pre-push）を有効化 … ツール非依存の履歴破壊防止
#   2) （任意）Claude のガードを全プロジェクトへ横展開
#   3) 残りの手動設定（GitHub保護 / Time Machine）を案内
# ============================================================
set -u
cd "$(dirname "$0")" || exit 1

echo "▶ 1) git フックを有効化します..."
if [ -d .githooks ]; then
  chmod +x .githooks/* 2>/dev/null || true
  git config core.hooksPath .githooks
  echo "  ✅ core.hooksPath = .githooks（pre-push ガードが有効になりました）"
else
  echo "  ⚠️ .githooks が見つかりません。リポジトリ直下で実行してください。"
fi

echo
echo "▶ 2) Claude のガードを全プロジェクトへ広げますか？（任意）"
echo "   すべてのプロジェクトで rm -rf / や強制push を止めたい場合は、以下を実行:"
echo "     mkdir -p \"\$HOME/.claude\""
echo "     cp .claude/guard.sh \"\$HOME/.claude/guard.sh\""
echo "   そして ~/.claude/settings.json の hooks.PreToolUse.command を"
echo "     bash \"\$HOME/.claude/guard.sh\"  に設定（無ければ .claude/settings.json を雛形に作成）。"

echo
echo "▶ 3) ここから先は“あなたの手で1回だけ”お願いします（AI/CLIでは設定不可）:"
echo "   [ ] GitHub → リポジトリ → Settings → Branches"
echo "       → master に対し『Block force pushes』『Restrict deletions』をON"
echo "         （できれば『Require a pull request before merging』も）"
echo "   [ ] Mac のシステム設定 → 一般 → Time Machine で外付けドライブを登録"
echo "   [ ] Claude/エージェントを『全許可(--dangerously-skip-permissions)』で起動しない"
echo
echo "✅ セットアップ完了。詳細は SAFETY.md を参照してください。"

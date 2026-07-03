# AGENTS.md — アネラカフェ福岡サイト

AIエディタ／エージェント向けのプロジェクト要点です。引き継ぎはまず `handoff/04_ANTIGRAVITY.md`（手順＋キックオフ指示）、
次に `handoff/00_HANDOFF.md` を読んでください。

## ⛔ 絶対ルール（すべてのエージェント／人間が厳守）
破壊的操作は原則禁止。以下は**人間の明示的な確認なしに実行しないこと**。詳細と復旧は `SAFETY.md`。
1. `rm -rf` でルート/ホーム/ワイルドカード（`/`・`~`・`$HOME`・`*`・`/*`）を対象にしない。削除は対象を限定し、必要最小限に。
2. `git push --force` / `-f`、`git reset --hard`、`git clean -f`、`git branch -D`、ブランチ削除pushをしない。
3. `mkfs` / `dd` / デバイス直書き / `sudo rm` などディスク破壊系を実行しない。
4. 大きな変更の**前後**で必ず `git add -A && git commit && git push`（＝復元ポイントを残す）。
5. 迷ったら破壊しない。まず `git status` と `git reflog` を見る。全許可モード（`--dangerously-skip-permissions`）で起動しない。
6. **秘密情報（APIキー/トークン/パスワード）と個人情報・名簿はコミットしない**。秘密は `.env`（除外済み）へ、名簿・顧客データはリポジトリ外へ。`.githooks/pre-commit` が自動でブロックする。
> このリポジトリには機械的なガードも入っています（`.claude/guard.sh`＝Claude用、`.githooks/pre-push`＝全ツール共通）。
> 初回に `bash setup-guardrails.sh` を実行して git フックを有効化すること。

## モデル運用（コスト節約：Fableで考え、Sonnetで実装）
- **本体＝Fable（`claude-fable-5`）**：設計・構造・方針決定・レビュー・段取り（オーケストレーション）を担当。`.claude/settings.json` で既定モデルに設定済み。
- **実装の手作業＝Sonnet**：ファイル編集・生成・データ配線・ビルド等の**トークンを多く使う機械的作業**は、`implementer` サブエージェント（`.claude/agents/implementer.md`、model: sonnet）へ**委譲する**。
- 使い分けの目安：**「どう作るか」を決める＝本体(Fable)／「決まったものを作る」＝implementer(Sonnet)**。
- 明確な仕様が固まったら、実装は基本 implementer に投げる。設計変更が要るときだけ本体に戻す。
- モデルを変えたいときは `/model` で切り替え、または `.claude/settings.json` の `model` を編集。

## これは何か
アネラカフェ福岡 **大濠店・原田店** の公式サイト。1リポジトリで2サイトを生成する
**Astro + pnpm モノレポ**。詳細は `README.md`、制作経緯は `handoff/01_PRODUCTION_LOG.md`。

## 構成
- `packages/shared/` … 2サイト共通：レイアウト／コンポーネント／**ページ本体**(`pages/*.astro`)／
  共通コンテンツ(`content/*.md`)／note取得(`lib/note-rss.ts`)／型・組織設定(`lib/site.ts`)
- `sites/ohori/`, `sites/harada/` … 店舗固有データ(`src/data/store.ts`)だけを持つ薄いラッパー。
  `src/pages/*.astro` は `@anela/shared/pages/*` を呼ぶだけ。

## 鉄則
- ページの中身・デザインは **`packages/shared` を1か所直せば両店に反映**。サイト側で個別実装しない。
- 店舗で変わる値は `sites/<store>/src/data/store.ts` のみ。
- お知らせは note RSS をビルド時取得。`ORG.noteAccount`（`packages/shared/lib/site.ts`）が空でも
  ビルドが通るよう、取得失敗時は空配列を返す設計（壊さないこと）。
- 内部リンクは `withBase()`（`packages/shared/lib/url.ts`）を使う。ルート公開では素のパスになる。
- フォームは作らない方針（メール／電話／Instagram リンクで受ける）。
- 里親は一覧を作らず Instagram 誘導。メニューはドリンクバーのためページなし。

## コマンド
```bash
pnpm install
pnpm dev:ohori        # 大濠店をローカル起動
pnpm dev:harada       # 原田店
pnpm build            # 両サイト（出力: sites/<store>/dist）
pnpm --filter ohori build
```

## デプロイ
Cloudflare Pages に**店舗ごと1プロジェクト**。手順は `handoff/02_CLOUDFLARE_DEPLOY.md`。
- 大濠: build `pnpm --filter ohori build` / output `sites/ohori/dist`
- 原田: build `pnpm --filter harada build` / output `sites/harada/dist`
- `PAGES_BASE` は本番では設定しない（サブパス公開時のみ）。

## 公開前の差し替え
`handoff/03_PLACEHOLDERS.md` のチェックリスト参照（店舗情報・note・画像・料金・文面）。

## デザイン
ブランドガイドは `packages/shared/BRAND.md`。色は `packages/shared/styles/global.css` の
`:root` 変数で一元管理（Teal=主色／Gold=差し色／Coral=CTA／Ivory=背景）。
- 書体: 和文見出し＝Shippori Mincho／本文＝Zen Kaku Gothic New／欧文＝Fraunces(italic)。Google Fonts を `BaseLayout` で読込、`--font-*` で管理。
- 共通の作法: 編集的見出し `.s-head`（`.counts` 内で連番）、下層先頭は `<PageHeader>`、スクロール演出は `.reveal*`（`BaseLayout` の IO が `.is-in` 付与）、装飾は `.grain`／`.intro-curtain`／`.marquee`。
- モーションは必ず `prefers-reduced-motion: reduce` を尊重する（既存の指定を壊さない）。
- 設計の全体像は `handoff/04_ANTIGRAVITY.md` の「4. いまの状態」。

## 安全（必読）
破壊的操作の防止とリカバリーは `SAFETY.md` にまとめている。
- `.claude/settings.json`：`rm`/`git push`/`git reset` 等は実行前に確認を求める（許可制）。
- `.claude/guard.sh`：`rm -rf /`・強制push・`dd` 等のカタストロフィックな命令を PreToolUse で即ブロック。
- **禁止**: `--dangerously-skip-permissions`（全許可）での起動。上のガードが無効化される。
- 大きな変更の前後は必ず `git add -A && git commit && git push`（＝復元ポイント）。困ったら `git status`→`git reflog`。

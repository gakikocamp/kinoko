# アネラカフェ福岡サイト — 引き継ぎ（ハンドオフ）

このフォルダは、アネラカフェ福岡（大濠店・原田店）サイトを **別環境（Antigravity などのAIエディタ）＋ Cloudflare Pages** で引き継いで公開・運用するための一式です。

## 中身

| ファイル | 内容 |
|----------|------|
| `00_HANDOFF.md` | このファイル（全体の入口） |
| `04_ANTIGRAVITY.md` | **Antigravity 等のAIエディタで続きを進める人向けの手順書＋キックオフ指示**（引き継ぎはまずこれ） |
| `01_PRODUCTION_LOG.md` | 制作過程・意思決定の記録（なぜこの構成にしたか） |
| `02_CLOUDFLARE_DEPLOY.md` | Cloudflare Pages での公開手順（2店舗ぶん） |
| `03_PLACEHOLDERS.md` | 公開前に差し替える項目チェックリスト |
| `build/ohori-dist.zip` | 大濠店の**ビルド済み完成データ**（Cloudflare 直アップロード用） |
| `build/harada-dist.zip` | 原田店の**ビルド済み完成データ**（同上） |
| `build/ohori-local-preview.zip` | 大濠店の**ローカル閲覧用**。解凍して `index.html` をダブルクリックするだけで表示できる（リンクを相対パス化済み。**公開用には使わない**） |
| `build/harada-local-preview.zip` | 原田店のローカル閲覧用（同上） |

> リポジトリ直下の `README.md`（全体説明）と `packages/shared/BRAND.md`（ブランドガイド）も合わせて参照してください。
> AIエディタ向けの要点は、リポジトリ直下の `AGENTS.md` にまとめています。

## 30秒サマリー
- **技術**: Astro + pnpm モノレポ。`packages/shared`（共通）＋ `sites/ohori`・`sites/harada`（店舗別）。
- **2サイト**を共通部品から生成。中身・デザインは `packages/shared` を1か所直せば両店に反映。
- **デザイン**: 編集（雑誌）デザインで全7ページ実装・刷新済み（明朝×Fraunces の書体、編集的セクション見出し、スクロール演出、グレイン質感など）。設計の要点は `04_ANTIGRAVITY.md` の「4. いまの状態」。
- **お知らせ**: note 共通アカウントの RSS をビルド時取得（`ORG.noteAccount` 未設定でも安全にビルド可）。
- **里親募集**: 一覧は作らず Instagram 誘導。**求人・問い合わせ**: フォームなし（メール/電話/Instagram）。
- **メニュー**: ドリンクバー形式のためページなし。トップに「ご利用案内」。
- **未投入（プレースホルダー）**: 写真・実データ（住所/営業時間/料金等）・アネラカフェの正式ロゴ。→ 残タスクは `04_ANTIGRAVITY.md` の「5. 残タスク」。

## 2通りの公開方法
1. **Git連携（推奨・自動更新）**: Cloudflare Pages にこのリポジトリを接続 → push で自動ビルド・公開。→ `02_CLOUDFLARE_DEPLOY.md`
2. **直アップロード（最速・手動）**: `build/*.zip` を解凍し、Cloudflare Pages の「アップロード」でドラッグ&ドロップ。ビルド不要。

## ローカルで動かす
```bash
pnpm install
pnpm dev:ohori     # 大濠店 → http://localhost:4321
pnpm dev:harada    # 原田店
pnpm build         # 両サイトをビルド（出力: sites/<store>/dist）
```

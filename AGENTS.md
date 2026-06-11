# AGENTS.md — アネラカフェ福岡サイト

AIエディタ／エージェント向けのプロジェクト要点です。まず `handoff/00_HANDOFF.md` を読んでください。

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

# Antigravity 引き継ぎガイド（このプロジェクトの続きをAIエディタで進める人へ）

このファイルは、アネラカフェ福岡サイトを **Antigravity（または Cursor 等のAIエディタ）** で
引き継いで開発・公開するための手順書です。**まずこの1枚を読めば再開できる**ようにしています。

---

## 0. TL;DR（30秒）
- **何**: 福岡のカフェ「アネラカフェ」大濠店・原田店の公式サイト。1リポジトリで2サイト生成。
- **技術**: Astro + pnpm モノレポ。共通部品は `packages/shared/`。
- **状態**: デザインは「編集（雑誌）デザイン」で全7ページ実装＋刷新済み。**中身は写真・実データ・ロゴが未投入（プレースホルダー）**。
- **次にやること**: ①写真 ②実データ（住所・営業時間・料金等）③ロゴ → 詳細は本書の「5. 残タスク」。
- **公開**: Cloudflare Pages（`02_CLOUDFLARE_DEPLOY.md`）。

---

## 1. コードを手元に取得する
```bash
# 例: ANELLA CAFE フォルダの中にクローンする
cd "/Users/<あなた>/.../ANELLA CAFE"
git clone https://github.com/gakikocamp/kinoko.git
cd kinoko

# 作業ブランチ（最新のデザイン刷新が入っている）に切り替え
git checkout claude/anela-cafe-fukuoka-site-2t49iq
```
> 成果物はすべて PR #1 / ブランチ `claude/anela-cafe-fukuoka-site-2t49iq` にあります。
> `master` には未マージなので、必ず上記ブランチに切り替えてください。

---

## 2. Antigravity で開く
1. Antigravity でワークスペースとして上の `kinoko` フォルダを開く。
2. 内蔵エージェントに、次の「3. キックオフ指示」を最初に貼り付ける。

---

## 3. キックオフ指示（エージェントに最初に貼るプロンプト）
```
このリポジトリは福岡のカフェ「アネラカフェ」大濠店・原田店の公式サイトです（Astro + pnpm モノレポ）。
まず以下を順に読んで現状を完全に把握してください：
1. handoff/04_ANTIGRAVITY.md（この引き継ぎ手順）
2. handoff/00_HANDOFF.md → 01_PRODUCTION_LOG.md → 02_CLOUDFLARE_DEPLOY.md → 03_PLACEHOLDERS.md
3. AGENTS.md と packages/shared/BRAND.md（設計・ブランドの鉄則）

把握できたら、(a) 現状サマリー (b) 残タスクの優先順位 (c) 最初に着手する1件の具体案 を提示してください。
デザインや文面の変更は packages/shared を1か所直せば両店に反映される構成です。サイト側で個別実装しないでください。
```

---

## 4. いまの状態（デザイン刷新の到達点）
### デザインシステム
- **書体**: 和文見出し＝明朝(Shippori Mincho)／本文＝Zen Kaku Gothic New／欧文ラベル＝Fraunces(italic)。
  `packages/shared/layouts/BaseLayout.astro` で Google Fonts を読み込み、`global.css` の `--font-*` で管理。
- **色**: `packages/shared/styles/global.css` の `:root` 変数で一元管理（Teal=主色／Gold=差し色／Coral=CTA／Ivory=背景）。
- **共通の作法（CSSクラス）**:
  - 編集的セクション見出し: `.s-head`（`.s-head__kicker`＝英字、`.s-head__title`、`.s-head__lead`）。
    `.counts` の中で使うと自動で 01,02… の連番が付く。
  - 下層ページの先頭: `<PageHeader kicker="Access" title="…" lead="…" />`（`components/PageHeader.astro`）。
  - スクロール演出: `.reveal` / `.reveal-stagger` / `.reveal-line`（`BaseLayout` の IntersectionObserver が `.is-in` を付与）。
  - 装飾: フィルムグレイン `.grain`、初回イントロ `.intro-curtain`（トップのみ）、流れる帯 `.marquee`。
  - すべて `@media (prefers-reduced-motion: reduce)` を尊重（動きを止める）。**ここは壊さないこと。**

### ページ（全7ページ・共通実装）
トップ（`pages/IndexPage.astro`）＋ アクセス／お知らせ／里親募集／就労支援B型／スタッフ募集／お問い合わせ。
各ページ本体は `packages/shared/pages/*.astro`。`sites/<store>/src/pages/*.astro` はそれを呼ぶだけの薄いラッパー。

---

## 5. 残タスク（優先順 = 仕上がりへの効果順）
### ① 写真（最重要・いちばん効く）
現状は全部プレースホルダー。実画像が入ると一気に「作品」になります。
- **置き場所**: `sites/ohori/public/images/` と `sites/harada/public/images/`
- **配線**: `sites/<store>/src/data/store.ts` の `heroImage` と `gallery` にパスを書く。
  ```ts
  heroImage: "/images/hero.jpg",
  gallery: [
    { src: "/images/g1.jpg", alt: "店内の様子" },
    { src: "/images/g2.jpg", alt: "保護犬とお客さま" },
  ],
  ```
- **トーン**: 全カット同系トーン（暖色・彩度低め）に揃えると高級感が出る。推奨 1080px 前後 / JPEG / 数百KB。
- **Instagram の写真を“投稿として”出す場合**: `store.ts` の `instagramPosts` に投稿URL（`https://www.instagram.com/p/XXXX/`）を入れると、
  公式埋め込み（無料・規約OK・自動で最新）でトップに表示される。スクショ不要。
  ※ Instagram の自動スクレイピング/スクショ取得はビルド環境からはできない（要ログイン・規約）。手動配置か公式埋め込みで。

### ② 実データ（プレースホルダーの差し替え）
`handoff/03_PLACEHOLDERS.md` のチェックリスト参照。主に各 `store.ts`：
- `url` / `tagline` / `address` / `access` / `hours` / `closedNote` / `tel` / `email`
- `instagram`（原田は**未設定**）/ `mapEmbedSrc` / `mapLink`
- 共通設定 `packages/shared/lib/site.ts` の `ORG`：`noteAccount`（入れるとお知らせ自動表示）/ `adoptionInstagram` / `drinkBar`（料金）
- 文面 `packages/shared/content/*.md`（adoption / welfare / recruit）

### ③ ロゴ
リポジトリにあるのはキノコキャンプの旧ロゴのみ。**アネラカフェの正式ロゴ**が必要。
入手後、ヘッダー（`components/Header.astro` の `.brand`）とイントロ（`global.css` の `.intro-curtain__mark`）に適用。

---

## 6. ローカルで動かす / ビルド
```bash
pnpm install
pnpm dev:ohori        # 大濠店 → http://localhost:4321
pnpm dev:harada       # 原田店
pnpm build            # 両サイトをビルド（出力: sites/<store>/dist）
pnpm --filter ohori build   # 片方だけ
```
> Node は 20 以上。`pnpm` が無ければ `corepack enable` か `npx pnpm …`。

---

## 7. 公開（Cloudflare Pages）
店舗ごとに1プロジェクト。詳細は `handoff/02_CLOUDFLARE_DEPLOY.md`。
- 大濠: build `pnpm --filter ohori build` / output `sites/ohori/dist`
- 原田: build `pnpm --filter harada build` / output `sites/harada/dist`
- すぐ見せたいだけなら `handoff/build/*-dist.zip` を直アップロードでも可。
  （`*-local-preview.zip` は手元でダブルクリック確認する閲覧専用。公開には使わない）

---

## 8. 触るときの鉄則（壊さないために）
- デザイン・文面は **`packages/shared` を1か所**直す。サイト側で個別実装しない。
- 店舗で変わる値は `sites/<store>/src/data/store.ts` だけ。
- お知らせは note RSS をビルド時取得。**取得失敗時に空配列を返す設計**（`lib/note-rss.ts`）。`noteAccount` 空でもビルドが通る状態を保つ。
- 内部リンクは `withBase()`（`lib/url.ts`）を使う。
- フォームは作らない（メール／電話／Instagram で受ける）。里親は一覧を作らず Instagram 誘導。メニューはドリンクバーのためページなし。
- モーション系は必ず `prefers-reduced-motion` を尊重する。

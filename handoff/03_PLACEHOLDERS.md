# 公開前に差し替える項目チェックリスト

現在は仮の値（プレースホルダー）で動いています。公開前に以下を差し替えてください。
（多くは1ファイルで両店 or 店舗別に直すだけです）

## 店舗ごとの情報 — `sites/ohori/src/data/store.ts` / `sites/harada/src/data/store.ts`
- [ ] `url`（公開URL）／`tagline`（キャッチコピー）
- [ ] `address`（住所）／`access`（最寄り・駐車場）
- [ ] `hours`（曜日別 営業時間）／`closedNote`（定休日）
- [ ] `tel`（電話）／`email`（問い合わせメール）
- [ ] `instagram`（店舗の Instagram）
      - 大濠 = `https://www.instagram.com/anella_cafe_fukuoka_ohori/`（設定済み）
      - 原田 = **未設定**（要差し替え）
- [ ] `mapEmbedSrc`（Googleマップ「地図を埋め込む」の src）／`mapLink`（経路リンク）
- [ ] `heroImage`（トップの主役画像 例 `/images/hero.jpg`）
- [ ] `gallery`（画像グリッド）／`instagramPosts`（Instagram 公式埋め込みする投稿URL）

## 全店共通 — `packages/shared/lib/site.ts`（`ORG`）
- [ ] `noteAccount`（全店共通の note アカウント名。例 `anelacafe`）← 入れると「お知らせ」が自動表示
- [ ] `adoptionInstagram`（里親情報を出している Instagram）
- [ ] `drinkBar`（ドリンクバーの料金・利用案内・注記）

## 文面 — `packages/shared/content/*.md`
- [ ] `adoption.md`（里親募集の説明・流れ・条件）
- [ ] `welfare.md`（B型就労支援：仕事内容・1日の流れ）
- [ ] `recruit.md`（スタッフ募集：職種・応募の流れ）

## 画像 — `sites/<store>/public/images/`
- [ ] ロゴ（現状リポジトリにあるのはキノコキャンプのロゴのみ。**アネラカフェのロゴが必要**）
- [ ] 店舗・店内・わんこ・ご利用案内などの写真
      - Instagram の写真を使う場合は、画像をダウンロードしてここに配置（自動取得は不可）
      - または `instagramPosts` に投稿URLを入れて公式埋め込み（無料）で表示

## 画像の入れ方（例）
```ts
// store.ts
heroImage: "/images/hero.jpg",
gallery: [
  { src: "/images/g1.jpg", alt: "店内の様子" },
  { src: "/images/g2.jpg", alt: "保護犬とお客さま" },
],
instagramPosts: [
  "https://www.instagram.com/p/XXXXXXXXX/",
  "https://www.instagram.com/p/YYYYYYYYY/",
],
```

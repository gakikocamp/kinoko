# Cloudflare Pages 公開手順（大濠・原田の2サイト）

このリポジトリは1つで2サイトを生成します。Cloudflare Pages では
**店舗ごとに1プロジェクト**を作成します（合計2プロジェクト）。

---

## 方法1: Git 連携（推奨・push で自動更新）

### 大濠店プロジェクト
1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. リポジトリ `gakikocamp/kinoko` を選択
3. ビルド設定：
   - **Production branch**: `master`（または運用ブランチ）
   - **Framework preset**: `None`（または Astro）
   - **Build command**: `npx pnpm install && npx pnpm --filter ohori build`
   - **Build output directory**: `sites/ohori/dist`
   - **Root directory**: （空＝リポジトリルート）
   - **Environment variables**:
     - `SITE_URL` = 公開予定のURL（例 `https://ohori.example.com`）※ canonical/OGP用。未設定でもビルドは通る
     - ※ `PAGES_BASE` は **設定しない**（ルート公開のため）
     - `NODE_VERSION` = `20`（必要なら）
4. **Save and Deploy**

### 原田店プロジェクト
上と同様に、もう1つプロジェクトを作成し、以下だけ変更：
- **Build command**: `npx pnpm install && npx pnpm --filter harada build`
- **Build output directory**: `sites/harada/dist`
- `SITE_URL` = 原田店のURL

> pnpm が使えない場合は、Cloudflare の環境変数に `ENABLE_PNPM=1` を入れるか、
> Build command を `corepack enable && pnpm install && pnpm --filter ohori build` にしてください。

---

## 方法2: 直接アップロード（最速・ビルド不要）

ビルド済みの完成データを使います。Git 連携なしで今すぐ公開できます。

1. `handoff/build/ohori-dist.zip` を解凍
2. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 解凍した中身（`index.html` がある階層）をドラッグ&ドロップ → デプロイ
4. 原田店は `handoff/build/harada-dist.zip` で同様に

> 直アップロードは手動更新です。継続運用は方法1（Git連携）を推奨します。

---

## 独自ドメインの割り当て
各 Pages プロジェクト → **Custom domains** → ドメインを追加（DNSはCloudflare管理だと自動）。
割り当て後、`SITE_URL`（または `sites/<store>/astro.config.mjs` の `site`）を本番URLに更新。

## note を即時反映したい場合
お知らせはビルド時に note RSS を取得するため、note 更新後に再ビルドが必要です。
Cloudflare Pages の **Deploy hook**（Webhook URL）を作成し、定期実行（例: 1日数回）すると自動更新できます。

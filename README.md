# 抹茶輸出販売管理システム

MATCHA NINJA / WAGYUNINJA の海外抹茶輸出業務(商談〜見積〜PI〜入金〜加工〜発送)を一元管理する社内Webアプリ。

- 要件定義・設計: [docs/](./docs/README.md)
- 技術スタック: Next.js (App Router) + Supabase + Cloudflare Workers ([@opennextjs/cloudflare](https://opennext.js.org/cloudflare))
- 現在の実装状況: **Phase 0(基盤)** — 認証・DBスキーマ・デプロイパイプラインまで完成

## 開発環境での起動

```bash
npm install
cp .env.example .env.local   # Supabaseの値を記入
npm run dev                  # http://localhost:3000
```

## 初回セットアップ(所有者が行う作業)

### 1. Supabase

1. [supabase.com](https://supabase.com) でプロジェクト作成(リージョン: Tokyo 推奨)
2. マイグレーション適用:
   ```bash
   npx supabase login
   npx supabase link --project-ref <プロジェクトRef>
   npx supabase db push        # supabase/migrations/ 内の全DDL+国マスタシードを適用
   ```
3. Authentication → 設定: サインアップを無効化(招待制のみ)、パスワード最小12文字、漏えいパスワードチェックを有効化
4. Authentication → Users → 「Invite user」で管理者アカウントを作成
5. 本番運用開始時: Proプランに変更し PITR バックアップを有効化(docs/08_security.md §4)

### 2. Cloudflare

1. Cloudflareアカウント作成、(任意)ドメインをCloudflare DNSに設定
2. APIトークン発行: My Profile → API Tokens → 「Edit Cloudflare Workers」テンプレート
3. GitHubリポジトリの Settings → Secrets and variables → Actions に登録:

   | Secret名 | 値 |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | 上記トークン |
   | `CLOUDFLARE_ACCOUNT_ID` | CloudflareダッシュボードのAccount ID |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上(anon public key) |

4. `master` ブランチへのマージで自動デプロイされる(`.github/workflows/deploy.yml`)。手動デプロイは:
   ```bash
   npx wrangler login
   npm run cf:deploy
   ```

### 3. Cloudflare Access(推奨・docs/09_deployment.md §2)

Zero Trust → Access → Applications でWorkerのURLを保護し、社内メールアドレスのみ許可する。これで許可された人以外はログイン画面にも到達できない。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | Next.js ビルド |
| `npm run lint` / `npx tsc --noEmit` | Lint・型チェック |
| `npm run cf:build` | Cloudflare Workers 用ビルド |
| `npm run cf:preview` | Workersランタイムでローカル確認 |
| `npm run cf:deploy` | ビルド+本番デプロイ |

## ディレクトリ構成

```
docs/                  要件定義・設計ドキュメント(01〜09)
src/app/               画面(App Router)
src/components/        共有UIコンポーネント
src/lib/supabase/      Supabaseクライアント(browser / server / session)
src/proxy.ts           認証ガード(未ログインは /login へ)
supabase/migrations/   DBスキーマ+国マスタシード
wrangler.jsonc         Cloudflare Workers 設定
open-next.config.ts    OpenNext(Next.js→Workers変換)設定
.github/workflows/     CI/CD(masterマージで自動デプロイ)
```

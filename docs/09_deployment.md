# 09. デプロイ設計 — Cloudflare

完成後のホスティング先を **Cloudflare** とする。本章はその構成・注意点・手順を定義する。

## 1. 全体構成

```
利用者(社内)
   │  HTTPS
   ▼
Cloudflare Access(Zero Trust)── 社内メールアドレスのみ通過(追加の門番)
   │
   ▼
Cloudflare Workers ── Next.js アプリ本体(@opennextjs/cloudflare でデプロイ)
   │
   ▼
Supabase ── PostgreSQL / Auth(MFA) / Storage(変更なし)
```

- **アプリ**: Next.js を [OpenNext Cloudflare アダプタ](https://opennext.js.org/cloudflare)(`@opennextjs/cloudflare`)で Cloudflare Workers にデプロイする。旧 `next-on-pages`(Cloudflare Pages)は後継が Workers 方式のため、最初から Workers を採用。
- **DB・認証・ファイル**: Supabase のまま変更なし。Cloudflare R2 への置き換えはしない(Supabase Storage が RLS・署名URLと一体で §08 の設計を満たすため)。
- **ドメイン**: Cloudflare DNS で管理(例: `app.matcha-ninja.example`)。TLS・HSTS は Cloudflare 側で強制。

## 2. Cloudflareを活かしたセキュリティ強化(§08への上乗せ)

Cloudflare配下に置くこと自体がセキュリティ設計の一部になる。

| 機能 | 使い方 |
|---|---|
| **Cloudflare Access(Zero Trust)** | アプリの手前に置く「建物の入口」。社内メールドメイン+デバイス条件で許可した人しか**ログイン画面にすら到達できない**。アプリ内のSupabase Auth(MFA)と合わせて二重の門になる。無料枠(50ユーザーまで)で十分 |
| WAF / Bot対策 | マネージドルールを有効化。ログイン・API パスへのレート制限ルールを追加(§05のアプリ内レート制限と多層化) |
| DNS/TLS | フルStrictモード、HSTS、TLS 1.2未満拒否 |
| ログ | Access のアクセスログを監査ログ(§08-6)の補完として保存 |

## 3. 技術的な注意点(実装前に必ず確認)

### 3.1 PDF生成は「ブラウザ側で生成」方式にする(重要)

`@react-pdf/renderer` をWorkers上(サーバー側)で動かすのは、バンドルサイズ制限(圧縮後 3〜10MB)とNode API互換の面でリスクがある。そこで**PDF生成をクライアント(ブラウザ)側で行う設計**にする。`@react-pdf/renderer` はブラウザで完全動作するため、これが最も確実。

発行フロー(§03の設計を維持したまま実行場所だけ変更):

```
1. サーバー: 発行確定 → 採番 + スナップショット(documents.data)確定   ← 真実源はサーバー
2. ブラウザ: スナップショットJSONを受け取り PDF を生成・プレビュー表示
3. ブラウザ: 生成PDFを Supabase Storage にアップロード
4. サーバー: SHA-256ハッシュとStorageパスを documents に記録
```

- 番号・記載内容の真実源はあくまでサーバー側スナップショット。PDFはその「印刷物」なので、クライアント生成でも書類の完全性は保たれる(社内ユーザーのみが使う前提。ハッシュ記録で事後検証も可能)。
- 副次効果: プレビューが一瞬で出る(サーバー往復なし)、Workersのサイズ制限問題が消える。

### 3.2 その他の互換性チェックリスト

- [ ] `wrangler.toml` に `compatibility_flags = ["nodejs_compat"]` を設定
- [ ] Supabase クライアントは `@supabase/ssr` を使用(Workers/Edge互換)
- [ ] Next.js の機能で OpenNext 未対応のものを使っていないか、採用前に [対応表](https://opennext.js.org/cloudflare) を確認(ISR等は本アプリでは不使用の方針)
- [ ] 画像最適化(`next/image`)は Cloudflare Images またはアンオプティマイズ設定で対応(社内ツールなので後者で十分)
- [ ] Workers の CPU 時間制限(無料10ms/有料50ms超は要設定)— 重い処理はPDF同様クライアントかSupabase側へ寄せる

### 3.3 コスト目安

| サービス | プラン | 月額目安 |
|---|---|---|
| Cloudflare Workers | 無料枠(10万リクエスト/日)で開始、必要なら Paid $5 | ¥0〜800 |
| Cloudflare Access | 50ユーザーまで無料 | ¥0 |
| Supabase | Free で開始 → 本番運用は **Pro($25)推奨(PITRバックアップのため・§08-4)** | ¥0〜4,000 |
| ドメイン | Cloudflare Registrar | 実費(年1,500円前後) |

## 4. 環境分離とデプロイパイプライン

| 環境 | Workers | Supabase | 用途 |
|---|---|---|---|
| production | `matcha-app` (本番ドメイン) | 本番プロジェクト | 実業務 |
| preview | PRごとのプレビューURL | 開発プロジェクト | レビュー・検証 |

- GitHub Actions でデプロイ: PR → preview 環境へ自動デプロイ、`master` マージ → 本番へ自動デプロイ。
- シークレット(Supabaseキーなど)は `wrangler secret` / GitHub Secrets のみ。リポジトリに置かない(§08-7)。
- DBマイグレーションは Supabase CLI(`supabase db push`)を CI に組み込み、本番適用は手動承認ステップを挟む。

## 5. リリース手順(完成後)

1. Cloudflare アカウント作成、ドメイン取得・DNS設定
2. Supabase 本番プロジェクト作成 → 全DDL+国マスタシード適用 → Pro プラン+PITR有効化
3. `wrangler` で Workers デプロイ(preview で動作確認 → 本番)
4. Cloudflare Access 設定(社内メールのみ許可)、WAF・レート制限ルール適用
5. §08-8 リリース前セキュリティチェックリストを全項目実施
6. 自社情報・銀行/Wise・署名画像を設定画面から登録 → 実案件1件でPI発行テスト → 運用開始

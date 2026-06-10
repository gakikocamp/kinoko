# アネラカフェ福岡 ホームページ

アネラカフェ福岡 **大濠店・原田店** の公式サイト。
Astro + pnpm モノレポで、2サイトを共通部品から書き出す構成です。

- カフェ紹介（ドリンクバーのご利用案内 / アクセス・営業時間）
- お知らせ（**note の RSS をビルド時に取り込み自動表示**）
- 里親募集（保護犬。一覧は作らず Instagram へ誘導）
- 就労継続支援B型の利用者募集
- スタッフ募集
- お問い合わせ（フォームは作らず、メール / 電話 / Instagram への導線）

デザインの考え方は [`packages/shared/BRAND.md`](packages/shared/BRAND.md)（「Anela＝天使」を起点にしたブランドガイドライン想定版）を参照。

## ディレクトリ構成

```
packages/shared/   # 2サイト共通：レイアウト・コンポーネント・ページ本体・共通コンテンツ・note取得
sites/ohori/       # 大濠店サイト（店舗固有データのみ保持）
sites/harada/      # 原田店サイト（同上）
```

- 各サイトの `src/pages/*.astro` は `@anela/shared/pages/*` を呼ぶだけの薄いラッパー。
- ページの中身・デザインを直すときは **`packages/shared` を1か所直せば両サイトに反映** されます。
- 店舗ごとに変わる情報（住所・営業時間・電話・各SNS等）は `sites/<store>/src/data/store.ts` だけ。

## セットアップ / 開発

```bash
pnpm install

pnpm dev:ohori     # 大濠店をローカル起動
pnpm dev:harada    # 原田店をローカル起動

pnpm build         # 両サイトをビルド
pnpm build:ohori   # 大濠店だけビルド
```

## note（お知らせ）の設定

1. 全店共通の note アカウント名を `packages/shared/lib/site.ts` の `ORG.noteAccount` に設定
   （例: `https://note.com/anelacafe` なら `"anelacafe"`）。
2. ビルド時に `https://note.com/<account>/rss` を取得し、トップと `/news` に最新記事を表示します。
3. 未設定のあいだは安全に空表示になり、ビルドは通ります。

> note を更新しても **再ビルドするまで反映されません**。即時反映したい場合は、
> Cloudflare Pages の Deploy Hook を定期実行（cron）する運用を推奨。

## デプロイ（Cloudflare Pages）

サイトごとに Pages プロジェクトを1つ作成し、このリポジトリに接続します。

| 項目 | 大濠店 | 原田店 |
|------|--------|--------|
| Build command | `pnpm --filter ohori build` | `pnpm --filter harada build` |
| Build output directory | `sites/ohori/dist` | `sites/harada/dist` |
| Root directory | （リポジトリルート） | （リポジトリルート） |

独自ドメインは取得後に各プロジェクトへ割り当て、`sites/<store>/astro.config.mjs` の
`site` と `store.ts` の `url` を本番URLに更新してください。

## 差し替えが必要な素材（プレースホルダー箇所）

- アネラカフェのロゴ（現状リポジトリにあるのはキノコキャンプのロゴのみ）／店舗写真
- ドリンクバーの料金・ご利用方法（`packages/shared/lib/site.ts` の `ORG.drinkBar`）
- 各店の住所・営業時間・電話・問い合わせメール（`sites/<store>/src/data/store.ts`）
- 共通 note アカウント名、各店 Instagram、里親用 Instagram（`packages/shared/lib/site.ts`）
- Googleマップ埋め込み（`store.ts` の `mapEmbedSrc`）
- 里親 / 就労支援 / 求人の文面（`packages/shared/content/*.md`）

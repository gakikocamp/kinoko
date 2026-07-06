# 01. MVP機能一覧・画面一覧

## 1. MVP機能一覧

優先度: **Must** = MVPに必須 / **Should** = MVP内で対応するが後回し可 / **Could** = MVP外(将来)

### F1. 認証・権限

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F1-1 | メール+パスワードによるログイン/ログアウト | Must | Supabase Auth |
| F1-2 | 未ログイン時の全画面アクセス遮断 | Must | middleware で保護 |
| F1-3 | 管理者による新規ユーザー招待 | Should | 当面は管理者1名 |
| F1-4 | ロール別権限(admin / staff / viewer) | Could | DBには role カラムを最初から持たせる(§02) |

### F2. 顧客管理

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F2-1 | 顧客の登録・編集・閲覧・アーカイブ | Must | 物理削除はしない(案件との整合性維持) |
| F2-2 | Customer ID 自動採番 (`CUST-2026-0001`) | Must | §02 採番関数 |
| F2-3 | 登録項目: 会社名/担当者/Email/電話/国/請求先住所/発送先住所/VAT番号/EORI番号/輸入ライセンスメモ/希望支払方法/メモ/作成日/更新日 | Must | |
| F2-4 | 顧客一覧の検索・国フィルタ | Should | |
| F2-5 | 顧客詳細画面に関連案件一覧を表示 | Must | |

### F3. 商品管理

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F3-1 | 商品の登録・編集・閲覧・アーカイブ | Must | |
| F3-2 | 登録項目: 商品名/ブランド名/グレード/収穫年/収穫期/産地/原産国/HSコード/販売単価/原価/MOQ/包装形態/商品説明/社内メモ | Must | |
| F3-3 | LOT/Batch番号の管理(商品1件に複数LOT) | Must | LOTは商品と別テーブル。COAはLOTに紐づく |
| F3-4 | COAファイルのアップロード(LOT単位) | Must | Supabase Storage |
| F3-5 | 原価・社内メモは一覧/詳細の社内画面のみ表示 | Must | PDFには出さない |

### F4. 案件管理

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F4-1 | 案件の登録・編集・閲覧 | Must | |
| F4-2 | Deal ID 自動採番 (`DEAL-2026-0001`) | Must | |
| F4-3 | ステータス管理(11段階): Inquiry → Sample Sent → Quotation Sent → PI Issued → Waiting for Payment → Paid → Repacking → Ready to Ship → Shipped → Completed / Cancelled | Must | 遷移履歴を記録(F4-7) |
| F4-4 | 案件項目: 顧客/商品明細(商品・数量・単価・金額)/加工費/送料/小計/合計/通貨/支払条件/インコタームズ/仕向国/出荷予定日/社内メモ | Must | 明細は複数行対応のテーブル設計とする(MVP画面は1行でも可) |
| F4-5 | 金額の自動計算(明細金額合計+加工費+送料=合計) | Must | |
| F4-6 | ステータス・顧客での一覧フィルタ | Must | |
| F4-7 | ステータス変更履歴の記録(いつ・誰が) | Should | |
| F4-8 | 発送情報(発送方法/追跡番号/発送日)の記録 | Must | CI生成に必要 |
| F4-9 | 入金記録(金額/入金日/方法/入金証憑) | Must | 100%前払い運用の要 |

### F5. 加工費管理

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F5-1 | 顧客向け加工費: 表示名・説明文・金額を案件ごとに登録 | Must | PI/CIに記載される。例: "Custom repacking & label application fee — 100g x 200 silver aluminum pouches. Includes label printing/cutting, label application, 100g weighing and repacking, oxygen absorber insertion, heat sealing, lot control, and final quality check. Amount: 220,000 JPY" |
| F5-2 | 社内原価メモ: 作業項目別の原価見積・メモを案件ごとに登録 | Must | 別テーブル。**PDF生成データフローから物理的に分離** |
| F5-3 | 加工費テンプレート(定型説明文の使い回し) | Should | |

### F6. 書類生成(PDF)

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F6-1 | Proforma Invoice PDF生成 | Must | 記載項目は §03 参照 |
| F6-2 | Commercial Invoice PDF生成 | Must | |
| F6-3 | Packing List PDF生成(カートン明細入力付き) | Must | |
| F6-4 | 書類番号の自動採番 (`PI-2026-0001` / `CI-2026-0001` / `PL-2026-0001`) | Must | |
| F6-5 | 生成前プレビュー → 発行(番号確定・スナップショット保存・PDF保存) | Must | 発行後は編集不可、改訂版を再発行 |
| F6-6 | 発行済み書類の一覧・再ダウンロード | Must | |
| F6-7 | 書類の無効化(Void)と改訂版発行(Rev.1, Rev.2…) | Should | |

### F7. ファイル管理

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F7-1 | 案件ごとのファイルアップロード・一覧・ダウンロード・削除 | Must | Supabase Storage |
| F7-2 | カテゴリ分類: PI PDF / CI PDF / PL PDF / COA / 商品ラベル / 入金証憑 / 発送伝票 / 追跡書類 / QC写真 / その他 | Must | |
| F7-3 | 生成したPDFを自動で該当カテゴリに保存 | Must | |
| F7-4 | Google Drive連携 | Could | まずアプリ内保存。将来Drive自動同期(§04) |

### F8. 設定

| ID | 機能 | 優先度 | 備考 |
|---|---|---|---|
| F8-1 | 自社(Exporter)情報: 社名/住所/電話/Email/代表者名 | Must | 全PDFのヘッダに使用 |
| F8-2 | 銀行送金情報・Wise受取情報の登録 | Must | PIに記載 |
| F8-3 | 署名画像・ロゴ画像のアップロード | Must | PDF署名欄・ヘッダに使用 |
| F8-4 | デフォルト通貨・デフォルト支払条件 | Should | |

---

## 2. 画面一覧

全17画面(MVP必須は #1〜#15)。

| # | 画面名 | パス | 主な内容 |
|---|---|---|---|
| 1 | ログイン | `/login` | メール+パスワード認証 |
| 2 | ダッシュボード | `/` | ステータス別案件数、要対応リスト(入金待ち・出荷準備・出荷予定超過)、最近の案件 |
| 3 | 顧客一覧 | `/customers` | 検索・国フィルタ・新規登録ボタン |
| 4 | 顧客詳細 | `/customers/[id]` | 全登録項目+関連案件一覧 |
| 5 | 顧客登録/編集 | `/customers/new` `/customers/[id]/edit` | フォーム |
| 6 | 商品一覧 | `/products` | 検索・アーカイブ切替 |
| 7 | 商品詳細 | `/products/[id]` | 商品情報+LOT一覧+COAファイル |
| 8 | 商品登録/編集 | `/products/new` `/products/[id]/edit` | フォーム(LOT追加含む) |
| 9 | 案件一覧 | `/deals` | ステータス・顧客フィルタ、テーブル表示(将来カンバン) |
| 10 | 案件詳細 | `/deals/[id]` | タブ構成: **概要**(ステータス・金額サマリ) / **明細・金額** / **加工費**(顧客向け+社内原価) / **書類**(PI/CI/PL発行・履歴) / **ファイル** / **入金・発送** |
| 11 | 案件登録/編集 | `/deals/new` `/deals/[id]/edit` | 顧客・商品選択、数量・単価、金額自動計算 |
| 12 | PI作成 | `/deals/[id]/documents/pi/new` | 案件データから初期値展開 → 編集 → プレビュー → 発行 |
| 13 | CI作成 | `/deals/[id]/documents/ci/new` | 同上+発送方法・追跡番号 |
| 14 | PL作成 | `/deals/[id]/documents/pl/new` | カートン明細(箱数・入数・NW/GW・寸法)入力 → プレビュー → 発行 |
| 15 | 設定 | `/settings` | 自社情報・銀行/Wise情報・署名/ロゴ画像 |
| 16 | ユーザー管理 | `/settings/users` | (Should) 招待・ロール変更 |
| 17 | 加工費テンプレート管理 | `/settings/fee-templates` | (Should) 定型説明文の管理 |

### 画面遷移の基本フロー(業務フローに一致)

```
顧客登録 → 商品登録 → 案件作成(Inquiry)
  → 見積提示(Quotation Sent)
  → PI発行(PI Issued) ─ PI PDF生成
  → 入金待ち(Waiting for Payment)
  → 入金記録(Paid) ─ 入金証憑アップロード
  → 加工(Repacking) ─ 加工費・QC写真管理
  → 出荷準備(Ready to Ship) ─ CI・PL発行
  → 出荷(Shipped) ─ 追跡番号記録・発送伝票アップロード
  → 完了(Completed)
```

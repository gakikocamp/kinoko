# 03. PDFテンプレート構成 (PI / CI / Packing List)

## 共通仕様

| 項目 | 仕様 |
|---|---|
| 用紙 | A4縦、余白 15mm |
| 言語 | 英語のみ(貿易書類のため。日本語フォント埋め込みは不要だが、住所等で日本語を使う場合に備え Noto Sans JP を埋め込み可能にしておく) |
| 生成 | `@react-pdf/renderer` — 帳票ごとにReactコンポーネント(`PiDocument` / `CiDocument` / `PlDocument`)を定義 |
| データ入力 | **`documents.data`(スナップショットJSON)のみを入力とする。** DBの products / deals を直接参照しない。→ 社内原価(`cost_price`, `internal_notes`, `deal_processing_costs`)は型レベルでPDF入力に存在しないため、混入事故が構造的に起きない |
| 番号 | 発行確定時に `next_doc_number()` で採番。改訂時は同番号+ `Rev.1` 表記 |
| フッター | ページ番号 (`Page 1 of 2`)、書類番号 |

### 共通レイアウト骨格

```
┌──────────────────────────────────────────────┐
│ [ロゴ]                    ★ タイトル(右上大書き)  │  ← Header
│                             書類番号 / 日付       │
├──────────────────────────────────────────────┤
│ EXPORTER / SHIPPER   │  BUYER / CONSIGNEE       │  ← Parties(2カラム)
│ 自社情報              │  顧客請求先               │
│                      │  SHIP TO(発送先が異なる時) │
├──────────────────────────────────────────────┤
│ 取引条件メタ情報(Incoterms / Payment terms 等)     │  ← Terms bar
├──────────────────────────────────────────────┤
│ 明細テーブル                                      │  ← Items
├──────────────────────────────────────────────┤
│ 加工費・送料・小計・合計(右寄せ)                     │  ← Totals
├──────────────────────────────────────────────┤
│ 銀行情報 / Notes                                  │  ← Footer blocks
│ 署名欄                                            │
└──────────────────────────────────────────────┘
```

---

## 1. Proforma Invoice (PI)

**役割**: 前払い(100% advance)の請求根拠。バイヤーはこれを基に送金する。記載の正確さが入金スピードに直結する。

| ブロック | 記載項目 | データ源 |
|---|---|---|
| Header | Title: **PROFORMA INVOICE** / PI number / Issue date | 採番・発行日 |
| Exporter | 社名・住所・電話・Email | company_settings |
| Buyer / Consignee | 会社名・担当者・請求先住所・国・VAT番号・EORI番号 | customers |
| Ship to | 発送先住所(請求先と異なる場合のみ表示) | customers.shipping_address |
| Terms bar | Currency / Country of origin / Incoterms / Payment terms | deals |
| Items | No. / Description(商品名・ブランド・グレード・収穫年季・包装) / HS code / Origin / Quantity / Unit price / Amount | deal_items スナップショット |
| Fees | **Custom repacking & label application fee** — タイトル+説明文(例: "100g x 200 silver aluminum pouches. Includes label printing/cutting, label application, 100g weighing and repacking, oxygen absorber insertion, heat sealing, lot control, and final quality check.")+金額 | deals.packaging_fee_* |
| Fees | Shipping fee (+ Incoterms に応じた注記) | deals.shipping_fee |
| Totals | Subtotal / **TOTAL**(通貨明記、例: `USD 12,340.00`) | 集計 |
| Bank | **Bank details / Wise details**(受取口座情報) | company_settings |
| Notes | 有効期限(Validity: 30 days 等)・納期目安・その他条件 | 発行フォームで入力 |
| Signature | "Authorized signature" — 署名画像+代表者名+日付 | company_settings |

---

## 2. Commercial Invoice (CI)

**役割**: 通関書類。輸出入双方の税関が見る。PI・PLとの数値整合が必須。

| ブロック | 記載項目 | データ源 |
|---|---|---|
| Header | Title: **COMMERCIAL INVOICE** / Invoice number / Date | 採番・発行日 |
| Exporter | 社名・住所・電話・Email | company_settings |
| Consignee | 会社名・住所・国・VAT/EORI番号 | customers |
| Ship to | 発送先住所 | customers |
| Shipping bar | **Reason for export: Sale** / Incoterms / Shipping method / Tracking number / Country of origin | deals(固定文言 "Sale") |
| Items | No. / Description / **HS code** / **Country of origin** / Quantity / Unit price / Amount | deal_items スナップショット |
| Fees & Totals | 加工費(顧客向け名目のみ)・送料・**Total amount**(通貨明記) | deals |
| Declaration | "We hereby certify that this invoice is true and correct." 等の宣誓文 | 固定文言 |
| Signature | 署名画像+代表者名+日付 | company_settings |

> 将来: 日EU EPA等の**原産地申告文(Statement on Origin)**をCIに追記できるオプションを追加する(§05参照)。

---

## 3. Packing List (PL)

**役割**: 梱包内容の明細。フォワーダー・税関・バイヤーの検品が参照。金額は記載しない(数量・重量のみ)。

| ブロック | 記載項目 | データ源 |
|---|---|---|
| Header | Title: **PACKING LIST** / Packing List number / Date / 参照Invoice number | 採番・発行日・関連CI |
| Exporter | 社名・住所 | company_settings |
| Consignee | 会社名・発送先住所・国 | customers |
| Items | Carton No. / Product / Packaging(例: 100g aluminum pouch) / Number of cartons / Units per carton / Net weight (kg) / Gross weight (kg) / Dimensions (L×W×H cm) | deal_cartons スナップショット |
| Totals | Total cartons / **Total net weight** / **Total gross weight** / Total volume (m³, 自動計算) | 集計 |
| Notes | 取扱注意(Keep away from moisture / heat 等)・LOT番号 | 発行フォームで入力 |
| Signature | 署名画像+代表者名 | company_settings |

---

## documents.data スナップショットの構造(概略)

```jsonc
{
  "docType": "proforma_invoice",
  "docNumber": "PI-2026-0001",
  "revision": 0,
  "issueDate": "2026-07-10",
  "exporter": { "companyName": "...", "address": "...", "phone": "...", "email": "..." },
  "buyer":    { "companyName": "...", "contactPerson": "...", "billingAddress": "...",
                "country": "...", "vatNumber": "...", "eoriNumber": "..." },
  "shipTo":   { "address": "..." },
  "terms":    { "currency": "USD", "incoterms": "DAP London",
                "paymentTerms": "100% advance payment before production and shipment",
                "countryOfOrigin": "Japan" },
  "items": [
    { "description": "MATCHA NINJA \"Imperial Ceremonial\"\n2026 Spring 1st Flush Yame Matcha\n100g silver aluminum pouch",
      "hsCode": "0902.10", "origin": "Yame, Fukuoka, Japan",
      "quantity": 200, "unit": "pcs", "unitPrice": 38.00, "amount": 7600.00 }
  ],
  "fees": {
    "packagingFee": { "title": "Custom repacking & label application fee",
                      "description": "100g x 200 silver aluminum pouches. Includes ...",
                      "amount": 1480.00 },
    "shippingFee": 350.00
  },
  "totals": { "subtotal": 9080.00, "total": 9430.00 },
  "bank": { "bankDetails": "...", "wiseDetails": "..." },
  "notes": "This proforma invoice is valid for 30 days.",
  "signature": { "name": "...", "imagePath": "company/signature.png" }
  // CI: shipping { reasonForExport: "Sale", method, trackingNumber } を追加
  // PL: cartons[] / totals { cartons, netWeightKg, grossWeightKg } に置換(金額なし)
}
```

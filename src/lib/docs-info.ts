import type { DocType } from "./types";

/** 書類の日本語ファースト表記(docs/06 §2-5: UIは日本語、書類は英語) */
export const DOC_INFO: Record<
  DocType,
  {
    icon: string;
    ja: string; // 日本語の呼び名(前面に出す)
    en: string; // 正式英語名(補助表示)
    desc: string; // 一言でいうと
    when: string; // いつ使うか
  }
> = {
  proforma_invoice: {
    icon: "📄",
    ja: "請求書(PI)",
    en: "Proforma Invoice",
    desc: "先にお金を払ってもらうための請求書。バイヤーはこれを見て送金します",
    when: "見積が決まったら最初に発行",
  },
  commercial_invoice: {
    icon: "🛃",
    ja: "通関インボイス(CI)",
    en: "Commercial Invoice",
    desc: "税関に見せる正式な書類。発送物に同封します",
    when: "入金確認後、出荷の準備ができたら",
  },
  packing_list: {
    icon: "📦",
    ja: "梱包リスト",
    en: "Packing List",
    desc: "箱の数・中身・重さの一覧。金額は載りません",
    when: "箱詰めが終わったら(CIとセットで)",
  },
};

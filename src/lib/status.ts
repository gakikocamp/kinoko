import type { CountryStatus, DealStatus } from "./types";

/** 案件ステータスの表示定義(11段階 → 5ステージ・docs/06 §4.2) */
export const DEAL_STATUSES: {
  value: DealStatus;
  label: string;
  stage: number;
}[] = [
  { value: "inquiry", label: "問い合わせ", stage: 1 },
  { value: "sample_sent", label: "サンプル送付済み", stage: 1 },
  { value: "quotation_sent", label: "見積提示済み", stage: 2 },
  { value: "pi_issued", label: "PI発行済み", stage: 2 },
  { value: "waiting_for_payment", label: "入金待ち", stage: 3 },
  { value: "paid", label: "入金確認済み", stage: 3 },
  { value: "repacking", label: "加工中", stage: 4 },
  { value: "ready_to_ship", label: "出荷準備完了", stage: 4 },
  { value: "shipped", label: "出荷済み", stage: 4 },
  { value: "completed", label: "完了", stage: 5 },
  { value: "cancelled", label: "キャンセル", stage: 0 },
];

export const STAGES = [
  "① 商談",
  "② 見積・PI",
  "③ 入金",
  "④ 加工・出荷",
  "⑤ 完了",
];

export function statusLabel(status: DealStatus): string {
  return DEAL_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusStage(status: DealStatus): number {
  return DEAL_STATUSES.find((s) => s.value === status)?.stage ?? 0;
}

/** 次に進むステータス(順送り・docs/06 §4.2)。null = 終端 */
export function nextStatus(status: DealStatus): DealStatus | null {
  const order = DEAL_STATUSES.filter((s) => s.value !== "cancelled");
  const idx = order.findIndex((s) => s.value === status);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1].value;
}

/** 「次のアクション」ボタンの文言(docs/06 §4.2) */
export function nextActionLabel(status: DealStatus): string | null {
  const map: Partial<Record<DealStatus, string>> = {
    inquiry: "サンプル送付済みにする",
    sample_sent: "見積提示済みにする",
    quotation_sent: "PIを発行する",
    pi_issued: "入金待ちにする",
    waiting_for_payment: "入金を記録して確認済みにする",
    paid: "加工を開始する",
    repacking: "出荷準備完了にする",
    ready_to_ship: "出荷済みにする",
    shipped: "案件を完了する",
  };
  return map[status] ?? null;
}

export const COUNTRY_STATUS_META: Record<
  CountryStatus,
  { icon: string; label: string; className: string }
> = {
  ok: {
    icon: "🟢",
    label: "輸出可",
    className: "bg-green-100 text-green-800",
  },
  conditional: {
    icon: "🟡",
    label: "条件付き可",
    className: "bg-yellow-100 text-yellow-800",
  },
  prohibited: {
    icon: "🔴",
    label: "対応不可",
    className: "bg-red-100 text-red-800",
  },
  unverified: {
    icon: "⚪",
    label: "未確認",
    className: "bg-gray-100 text-gray-600",
  },
};

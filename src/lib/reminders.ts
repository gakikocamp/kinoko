import { repo, type DealWithRefs } from "@/lib/data";
import { money } from "@/lib/format";

export interface Reminder {
  icon: string;
  severity: "urgent" | "warn";
  message: string;
  action: string; // ボタン文言
  href: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr + "T00:00:00").getTime() - Date.now()) / DAY_MS
  );
}

/**
 * リマインダー通知(docs/04 将来機能の前倒し実装)。
 * ホーム画面に「そろそろ動くべき案件」を自動表示する。ルール:
 *  1. 請求書(PI)発行から7日以上入金がない → 送金リマインドを提案
 *  2. 見積送付から7日以上動きがない → フォローアップを提案
 *  3. 出荷予定日が3日以内 or 超過(入金後の案件) → 出荷準備を促す
 */
export async function computeReminders(
  deals: DealWithRefs[]
): Promise<Reminder[]> {
  const reminders: Reminder[] = [];

  for (const d of deals) {
    const name = d.customer?.company_name ?? d.deal_no;

    // 1. 未入金フォロー
    if (d.status === "pi_issued" || d.status === "waiting_for_payment") {
      const docs = await repo.listDocuments(d.id);
      const latestPi = docs.find(
        (x) => x.doc_type === "proforma_invoice" && x.status === "issued"
      );
      const baseDate = latestPi
        ? latestPi.issue_date + "T00:00:00"
        : d.created_at;
      const days = daysSince(baseDate);
      if (days >= 7) {
        reminders.push({
          icon: "💸",
          severity: days >= 14 ? "urgent" : "warn",
          message: `${name} — 請求書(PI)から${days}日、まだ入金がありません(${money(d.total_amount, d.currency)})。送金リマインドのメールを送りましょう`,
          action: "案件を開く",
          href: `/deals/${d.id}`,
        });
      }
    }

    // 2. 見積フォロー
    if (d.status === "quotation_sent") {
      const docs = await repo.listDocuments(d.id);
      const latestQt = docs.find(
        (x) => x.doc_type === "quotation" && x.status === "issued"
      );
      const baseDate = latestQt
        ? latestQt.issue_date + "T00:00:00"
        : d.created_at;
      const days = daysSince(baseDate);
      if (days >= 7) {
        reminders.push({
          icon: "🍵",
          severity: "warn",
          message: `${name} — 見積から${days}日、返事がありません。「いかがでしょうか?」とひと押ししてみましょう`,
          action: "案件を開く",
          href: `/deals/${d.id}`,
        });
      }
    }

    // 3. 出荷予定
    if (
      ["paid", "repacking", "ready_to_ship"].includes(d.status) &&
      d.expected_ship_date
    ) {
      const left = daysUntil(d.expected_ship_date);
      if (left < 0) {
        reminders.push({
          icon: "🚨",
          severity: "urgent",
          message: `${name} — 出荷予定日を${-left}日過ぎています。バイヤーに状況を連絡しましょう`,
          action: "案件を開く",
          href: `/deals/${d.id}`,
        });
      } else if (left <= 3) {
        reminders.push({
          icon: "🚢",
          severity: "warn",
          message: `${name} — 出荷予定日まであと${left}日。通関書類(CI)と梱包リストの準備はできていますか?`,
          action: "案件を開く",
          href: `/deals/${d.id}`,
        });
      }
    }
  }

  // 緊急を先に
  return reminders.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "urgent" ? -1 : 1
  );
}

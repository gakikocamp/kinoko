import { repo } from "@/lib/data";
import { toCsv, csvResponse } from "@/lib/csv";
import { statusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await repo.listDeals();
  const csv = toCsv(
    [
      "案件番号", "顧客", "仕向国", "状態", "通貨",
      "商品金額", "加工費", "送料", "小計", "合計",
      "インコタームズ", "支払条件", "出荷予定日", "追跡番号", "作成日",
    ],
    deals.map((d) => [
      d.deal_no,
      d.customer?.company_name,
      d.country?.name_ja ?? d.destination_country,
      statusLabel(d.status),
      d.currency,
      d.items.reduce((s, i) => s + i.amount, 0),
      d.custom_packaging_fee,
      d.shipping_fee,
      d.subtotal,
      d.total_amount,
      d.incoterms,
      d.payment_terms,
      d.expected_ship_date,
      d.tracking_number,
      d.created_at.slice(0, 10),
    ])
  );
  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `deals_${today}.csv`);
}

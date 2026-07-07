import { repo } from "@/lib/data";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await repo.listDeals();
  const rows: (string | number | null)[][] = [];
  // 案件ごとに入金を集める(件数規模が小さい社内ツールのためシンプルに)
  for (const d of deals) {
    const payments = await repo.listPayments(d.id);
    for (const p of payments) {
      rows.push([
        p.received_date,
        d.deal_no,
        d.customer?.company_name ?? "",
        p.amount,
        p.currency,
        p.method,
        p.notes,
      ]);
    }
  }
  rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));

  const csv = toCsv(
    ["入金日", "案件番号", "顧客", "金額", "通貨", "受取方法", "メモ"],
    rows
  );
  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `payments_${today}.csv`);
}

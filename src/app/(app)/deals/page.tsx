import Link from "next/link";
import { repo } from "@/lib/data";
import { money, dateJa } from "@/lib/format";
import { CountryBadge, DealStatusBadge } from "@/components/badges";
import { DEAL_STATUSES } from "@/lib/status";
import type { DealStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = DEAL_STATUSES.some((s) => s.value === status)
    ? (status as DealStatus)
    : undefined;
  const deals = await repo.listDeals(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-900">📋 案件</h1>
        <Link
          href="/deals/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + 案件を作成する
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/deals"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!filter ? "bg-green-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          すべて
        </Link>
        {DEAL_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/deals?status=${s.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s.value ? "bg-green-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">案件番号</th>
              <th className="px-4 py-2 font-medium">顧客</th>
              <th className="px-4 py-2 font-medium">仕向国</th>
              <th className="px-4 py-2 font-medium">状態</th>
              <th className="px-4 py-2 font-medium">合計金額</th>
              <th className="px-4 py-2 font-medium">出荷予定</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map((d) => (
              <tr key={d.id} className="hover:bg-green-50/50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/deals/${d.id}`}
                    className="font-medium text-green-800 hover:underline"
                  >
                    {d.deal_no}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{d.customer?.company_name}</td>
                <td className="px-4 py-2.5">
                  <CountryBadge country={d.country} />
                </td>
                <td className="px-4 py-2.5">
                  <DealStatusBadge status={d.status} />
                </td>
                <td className="px-4 py-2.5">{money(d.total_amount, d.currency)}</td>
                <td className="px-4 py-2.5">{dateJa(d.expected_ship_date)}</td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  該当する案件がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

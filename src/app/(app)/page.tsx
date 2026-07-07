import Link from "next/link";
import { repo } from "@/lib/data";
import { money, dateJa } from "@/lib/format";
import { DealStatusBadge } from "@/components/badges";
import { nextActionLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [counts, deals] = await Promise.all([
    repo.dashboardCounts(),
    repo.listDeals(),
  ]);

  const needsAction = deals.filter((d) =>
    ["waiting_for_payment", "paid", "ready_to_ship"].includes(d.status)
  );
  const unverifiedInquiries = deals.filter(
    (d) => d.country?.status === "unverified" && d.status === "inquiry"
  );
  const recent = deals.slice(0, 5);

  const stats = [
    { label: "進行中の案件", value: counts.activeDeals, href: "/deals" },
    { label: "入金確認待ち", value: counts.waitingPayment, href: "/deals?status=waiting_for_payment" },
    { label: "加工中", value: counts.inProduction, href: "/deals?status=repacking" },
    { label: "出荷準備完了", value: counts.readyToShip, href: "/deals?status=ready_to_ship" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-900">
          🏠 ホーム(今日やること)
        </h1>
        <Link
          href="/deals/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + 案件を作成する
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-gray-200 bg-white p-4 hover:border-green-400"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      {(needsAction.length > 0 || unverifiedInquiries.length > 0) && (
        <section>
          <h2 className="text-sm font-semibold text-amber-800">
            ⚠️ 対応が必要です
          </h2>
          <div className="mt-2 divide-y divide-amber-100 rounded-xl border border-amber-200 bg-white">
            {needsAction.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {d.deal_no} {d.customer?.company_name}
                    <span className="ml-2 font-normal text-gray-500">
                      {money(d.total_amount, d.currency)}
                    </span>
                  </p>
                  <div className="mt-0.5">
                    <DealStatusBadge status={d.status} />
                  </div>
                </div>
                <Link
                  href={`/deals/${d.id}`}
                  className="shrink-0 rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
                >
                  {nextActionLabel(d.status) ?? "開く"}
                </Link>
              </div>
            ))}
            {unverifiedInquiries.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <p className="text-sm text-gray-900">
                  🌍 未確認の国からの問い合わせ: {d.deal_no}(
                  {d.country?.name_ja})
                </p>
                <Link
                  href={`/countries`}
                  className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  輸出条件を確認する
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700">最近の案件</h2>
        <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">案件番号</th>
                <th className="px-4 py-2 font-medium">顧客</th>
                <th className="px-4 py-2 font-medium">状態</th>
                <th className="px-4 py-2 font-medium">金額</th>
                <th className="px-4 py-2 font-medium">出荷予定</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((d) => (
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
                    <DealStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {money(d.total_amount, d.currency)}
                  </td>
                  <td className="px-4 py-2.5">{dateJa(d.expected_ship_date)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    まだ案件がありません。問い合わせが来たら「案件を作成する」から始めましょう
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

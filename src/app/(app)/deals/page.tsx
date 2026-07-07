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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="fade-up flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-matcha-900">📋 案件</h1>
        <Link href="/deals/new" className="btn-primary">
          ✚ 案件を作成する
        </Link>
      </div>

      <div className="fade-up-1 flex flex-wrap gap-1.5">
        <Link
          href="/deals"
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            !filter
              ? "bg-matcha-700 text-white shadow"
              : "border-2 border-cream-300 bg-white text-matcha-700/70 hover:border-matcha-300"
          }`}
        >
          すべて
        </Link>
        {DEAL_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/deals?status=${s.value}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filter === s.value
                ? "bg-matcha-700 text-white shadow"
                : "border-2 border-cream-300 bg-white text-matcha-700/70 hover:border-matcha-300"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="fade-up-2 space-y-2">
        {deals.map((d) => (
          <Link
            key={d.id}
            href={`/deals/${d.id}`}
            className="card card-hover flex items-center gap-4 px-5 py-4"
          >
            <span className="w-36 shrink-0 text-xs font-bold text-matcha-600">
              {d.deal_no}
            </span>
            <span className="min-w-0 flex-1 truncate font-bold text-matcha-900">
              {d.customer?.company_name}
            </span>
            <CountryBadge country={d.country} />
            <DealStatusBadge status={d.status} />
            <span className="w-32 text-right font-extrabold text-matcha-900">
              {money(d.total_amount, d.currency)}
            </span>
            <span className="w-24 text-right text-xs text-matcha-700/60">
              🚢 {dateJa(d.expected_ship_date)}
            </span>
          </Link>
        ))}
        {deals.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-bold text-matcha-800">
              該当する案件がありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

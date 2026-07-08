import Link from "next/link";
import { repo } from "@/lib/data";
import { money, dateJa } from "@/lib/format";
import { DealStatusBadge } from "@/components/badges";
import { nextActionLabel, statusStage } from "@/lib/status";
import { FirstRunGuide } from "@/components/first-run-guide";
import { computeReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = Number(
    new Date().toLocaleString("ja-JP", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Tokyo",
    })
  );
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "おつかれさまです";
}

const PIPELINE = [
  { stage: 1, icon: "💬", label: "商談" },
  { stage: 2, icon: "📄", label: "見積・PI" },
  { stage: 3, icon: "💰", label: "入金" },
  { stage: 4, icon: "📦", label: "加工・出荷" },
  { stage: 5, icon: "✅", label: "完了" },
];

export default async function HomePage() {
  const deals = await repo.listDeals();
  const active = deals.filter(
    (d) => d.status !== "completed" && d.status !== "cancelled"
  );
  const stageCount = (n: number) =>
    active.filter((d) => statusStage(d.status) === n).length;
  const completedCount = deals.filter((d) => d.status === "completed").length;

  const reminders = await computeReminders(active);

  const needsAction = active.filter((d) =>
    ["waiting_for_payment", "paid", "ready_to_ship"].includes(d.status)
  );
  const unverifiedInquiries = active.filter(
    (d) => d.country?.status === "unverified" && d.status === "inquiry"
  );
  const recent = deals.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* あいさつ */}
      <div className="fade-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-matcha-900">
            <span className="wiggle mr-2">🍵</span>
            {greeting()}!
          </h1>
          <p className="mt-1 text-sm text-matcha-700/70">
            {needsAction.length > 0
              ? `今日やることが ${needsAction.length} 件あります`
              : "急ぎの対応はありません。いいペースです ✨"}
          </p>
        </div>
        <Link href="/deals/new" className="btn-primary">
          ✚ 案件を作成する
        </Link>
      </div>

      <FirstRunGuide />

      {/* ⏰ リマインダー(そろそろ動くべき案件を自動検知) */}
      {reminders.length > 0 && (
        <section className="fade-up">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-matcha-900">
            ⏰ リマインダー
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {reminders.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {reminders.map((r) => (
              <div
                key={r.message}
                className={`card flex items-center justify-between gap-4 border-l-8 px-5 py-3.5 ${
                  r.severity === "urgent"
                    ? "border-l-red-400 bg-red-50/50"
                    : "border-l-amber-300"
                }`}
              >
                <p className="text-sm font-semibold text-matcha-900">
                  {r.icon} {r.message}
                </p>
                <Link href={r.href} className="btn-secondary shrink-0">
                  {r.action} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 業務の流れ(パイプライン) */}
      <section className="fade-up-1 card p-6">
        <h2 className="text-sm font-bold text-matcha-800">
          いまの案件の流れ
          <span className="ml-2 font-normal text-matcha-700/60">
            進行中 {active.length} 件 / 完了 {completedCount} 件
          </span>
        </h2>
        <div className="mt-4 flex items-center gap-2">
          {PIPELINE.map((p, i) => {
            const count = p.stage === 5 ? completedCount : stageCount(p.stage);
            const hot = p.stage !== 5 && count > 0;
            return (
              <div key={p.stage} className="flex flex-1 items-center gap-2">
                <Link
                  href="/deals"
                  className={`card-hover flex flex-1 flex-col items-center rounded-2xl border-2 px-2 py-4 ${
                    hot
                      ? "border-matcha-400 bg-matcha-50"
                      : "border-cream-300 bg-cream-50"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="mt-1 text-xs font-bold text-matcha-800">
                    {p.label}
                  </span>
                  <span
                    className={`mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${
                      hot
                        ? "bg-matcha-600 text-white"
                        : "bg-cream-200 text-matcha-700/50"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
                {i < PIPELINE.length - 1 && (
                  <span className="text-lg text-matcha-300">→</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 今日やること */}
      {(needsAction.length > 0 || unverifiedInquiries.length > 0) && (
        <section className="fade-up-2">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-matcha-900">
            📌 今日やること
          </h2>
          <div className="mt-3 space-y-3">
            {needsAction.map((d) => (
              <div
                key={d.id}
                className="card card-hover flex items-center justify-between gap-4 border-l-8 border-l-gold-400 p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DealStatusBadge status={d.status} />
                    <span className="text-xs text-matcha-700/60">
                      {d.deal_no}
                    </span>
                  </div>
                  <p className="mt-1.5 font-bold text-matcha-900">
                    {d.customer?.company_name}
                    <span className="ml-2 text-sm font-semibold text-matcha-700/70">
                      {money(d.total_amount, d.currency)}
                    </span>
                  </p>
                </div>
                <Link href={`/deals/${d.id}`} className="btn-primary shrink-0">
                  {nextActionLabel(d.status) ?? "開く"} →
                </Link>
              </div>
            ))}
            {unverifiedInquiries.map((d) => (
              <div
                key={d.id}
                className="card card-hover flex items-center justify-between gap-4 border-l-8 border-l-gray-300 p-5"
              >
                <p className="text-sm font-semibold text-matcha-900">
                  🌍 はじめての国からの問い合わせ({d.country?.name_ja})
                  <span className="ml-2 text-xs font-normal text-matcha-700/60">
                    {d.deal_no} — 輸出できるか確認してから進めましょう
                  </span>
                </p>
                <Link href="/countries" className="btn-secondary shrink-0">
                  輸出条件を確認する
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 最近の案件 */}
      <section className="fade-up-3">
        <h2 className="text-base font-extrabold text-matcha-900">
          🕓 最近の案件
        </h2>
        <div className="mt-3 space-y-2">
          {recent.map((d) => (
            <Link
              key={d.id}
              href={`/deals/${d.id}`}
              className="card card-hover flex items-center gap-4 px-5 py-3.5"
            >
              <span className="w-36 shrink-0 text-xs font-bold text-matcha-600">
                {d.deal_no}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold text-matcha-900">
                {d.customer?.company_name}
              </span>
              <DealStatusBadge status={d.status} />
              <span className="w-28 text-right text-sm font-bold text-matcha-800">
                {money(d.total_amount, d.currency)}
              </span>
              <span className="w-24 text-right text-xs text-matcha-700/60">
                {dateJa(d.expected_ship_date)}
              </span>
            </Link>
          ))}
          {recent.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-4xl">🌱</p>
              <p className="mt-3 font-bold text-matcha-800">
                まだ案件がありません
              </p>
              <p className="mt-1 text-sm text-matcha-700/60">
                問い合わせが来たら「案件を作成する」から始めましょう
              </p>
              <Link href="/deals/new" className="btn-primary mt-4">
                ✚ 最初の案件を作成する
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

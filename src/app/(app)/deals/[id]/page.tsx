import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { money, dateJa } from "@/lib/format";
import { CountryBadge, DealStatusBadge, InternalOnlyBadge } from "@/components/badges";
import { STAGES, statusStage, statusLabel } from "@/lib/status";
import { NextActionButton } from "./next-action";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await repo.getDeal(id);
  if (!deal) notFound();
  const documents = await repo.listDocuments(id);

  const stage = statusStage(deal.status);
  const canIssuePi =
    deal.country?.status !== "prohibited" &&
    deal.country?.status !== "unverified";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{deal.deal_no}</p>
          <h1 className="text-2xl font-bold text-green-900">
            {deal.customer?.company_name}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <DealStatusBadge status={deal.status} />
            <CountryBadge country={deal.country} />
          </div>
        </div>
        <p className="text-right">
          <span className="text-xs text-gray-400">合計金額</span>
          <br />
          <span className="text-2xl font-bold text-gray-900">
            {money(deal.total_amount, deal.currency)}
          </span>
        </p>
      </div>

      {/* ステータス・ステッパー(5ステージ・docs/06 §4.2) */}
      {deal.status !== "cancelled" && (
        <ol className="flex items-center gap-1">
          {STAGES.map((label, i) => {
            const n = i + 1;
            const active = n === stage;
            const done = n < stage;
            return (
              <li key={label} className="flex flex-1 items-center gap-1">
                <span
                  className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium ${
                    active
                      ? "bg-green-700 text-white"
                      : done
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="block text-[10px] font-normal opacity-90">
                      {statusLabel(deal.status)}
                    </span>
                  )}
                </span>
                {n < STAGES.length && <span className="text-gray-300">›</span>}
              </li>
            );
          })}
        </ol>
      )}

      <NextActionButton dealId={deal.id} status={deal.status} />

      {/* PI発行の案内 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              📄 書類(Proforma Invoice)
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              発行済みの書類は変更できません。修正したいときは改訂版を発行してください
            </p>
          </div>
          {canIssuePi ? (
            <Link
              href={`/deals/${deal.id}/pi/new`}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              PIを発行する
            </Link>
          ) : (
            <span className="rounded-md bg-gray-100 px-4 py-2 text-xs text-gray-500">
              {deal.country?.status === "unverified"
                ? "⚪ 輸出条件が未確認のためPIを発行できません"
                : "🔴 対応不可の国のためPIを発行できません"}
            </span>
          )}
        </div>
        {documents.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm">
                  <span className="font-medium text-gray-900">{doc.doc_number}</span>
                  <span className="ml-2 text-gray-500">
                    発行日 {dateJa(doc.issue_date)}
                  </span>
                </span>
                <Link
                  href={`/deals/${deal.id}/pi/${doc.id}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  PDFを表示・ダウンロード
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 明細・金額 */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-800">
          明細・金額
        </h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {deal.items.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-pre-line px-5 py-3 text-gray-900">
                  {item.description}
                </td>
                <td className="px-5 py-3 text-right text-gray-600">
                  {item.quantity} {item.unit} × {money(item.unit_price, deal.currency)}
                </td>
                <td className="px-5 py-3 text-right font-medium">
                  {money(item.amount, deal.currency)}
                </td>
              </tr>
            ))}
            {deal.custom_packaging_fee > 0 && (
              <tr>
                <td className="whitespace-pre-line px-5 py-3 text-gray-900">
                  {deal.packaging_fee_title}
                  {deal.packaging_fee_desc && (
                    <span className="block text-xs text-gray-500">
                      {deal.packaging_fee_desc}
                    </span>
                  )}
                </td>
                <td />
                <td className="px-5 py-3 text-right font-medium">
                  {money(deal.custom_packaging_fee, deal.currency)}
                </td>
              </tr>
            )}
            <tr>
              <td className="px-5 py-2 text-gray-500">小計</td>
              <td />
              <td className="px-5 py-2 text-right">{money(deal.subtotal, deal.currency)}</td>
            </tr>
            <tr>
              <td className="px-5 py-2 text-gray-500">送料</td>
              <td />
              <td className="px-5 py-2 text-right">{money(deal.shipping_fee, deal.currency)}</td>
            </tr>
            <tr className="bg-green-50">
              <td className="px-5 py-3 font-semibold text-green-900">合計</td>
              <td />
              <td className="px-5 py-3 text-right font-bold text-green-900">
                {money(deal.total_amount, deal.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 取引条件 */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-800">
          取引条件
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-400">インコタームズ</dt>
            <dd className="mt-0.5 text-gray-900">{deal.incoterms ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">支払条件</dt>
            <dd className="mt-0.5 text-gray-900">{deal.payment_terms ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">出荷予定日</dt>
            <dd className="mt-0.5 text-gray-900">{dateJa(deal.expected_ship_date)}</dd>
          </div>
        </dl>
      </section>

      {/* 仕向国の要件(🟡の国) */}
      {deal.country && deal.country.requirements.length > 0 && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="text-sm font-semibold text-yellow-900">
            🟡 {deal.country.name_ja}向けの輸出要件
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-yellow-900">
            {deal.country.requirements.map((r) => (
              <li key={r.label}>
                {r.required ? "☑︎(必須)" : "☐(任意)"} {r.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 社内メモ */}
      {deal.internal_notes && (
        <section className="rounded-xl border border-gray-300 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-700">
            社内メモ <InternalOnlyBadge />
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
            {deal.internal_notes}
          </p>
        </section>
      )}
    </div>
  );
}

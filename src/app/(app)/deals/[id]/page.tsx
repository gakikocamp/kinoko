import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { money, dateJa } from "@/lib/format";
import { CountryBadge, DealStatusBadge, InternalOnlyBadge } from "@/components/badges";
import { STAGES, statusStage, statusLabel } from "@/lib/status";
import { DOC_INFO } from "@/lib/docs-info";
import { NextActionButton } from "./next-action";
import { PaymentsSection } from "./payments-section";
import { FilesSection } from "./files-section";

export const dynamic = "force-dynamic";

const STAGE_ICONS = ["💬", "📄", "💰", "📦", "✅"];

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await repo.getDeal(id);
  if (!deal) notFound();
  const [documents, payments, files] = await Promise.all([
    repo.listDocuments(id),
    repo.listPayments(id),
    repo.listFiles(id),
  ]);
  const paymentsTotal = payments.reduce((s, p) => s + p.amount, 0);

  const stage = statusStage(deal.status);
  const canIssuePi =
    deal.country?.status !== "prohibited" &&
    deal.country?.status !== "unverified";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="fade-up flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-matcha-600">{deal.deal_no}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold text-matcha-900">
            {deal.customer?.company_name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <DealStatusBadge status={deal.status} />
            <CountryBadge country={deal.country} />
          </div>
        </div>
        <div className="card px-5 py-3 text-right">
          <span className="text-xs text-matcha-700/60">合計金額</span>
          <p className="text-2xl font-extrabold text-matcha-900">
            {money(deal.total_amount, deal.currency)}
          </p>
        </div>
      </div>

      {/* ステータス・ステッパー */}
      {deal.status !== "cancelled" && (
        <div className="fade-up-1 card p-5">
          <ol className="flex items-center">
            {STAGES.map((label, i) => {
              const n = i + 1;
              const active = n === stage;
              const done = n < stage;
              return (
                <li key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-4 text-lg transition-all ${
                        active
                          ? "scale-110 border-matcha-500 bg-matcha-600 shadow-lg"
                          : done
                            ? "border-matcha-200 bg-matcha-100"
                            : "border-cream-200 bg-cream-100 opacity-60"
                      }`}
                    >
                      {done ? "✔️" : STAGE_ICONS[i]}
                    </span>
                    <span
                      className={`mt-1.5 text-xs font-bold ${
                        active ? "text-matcha-800" : "text-matcha-700/50"
                      }`}
                    >
                      {label.replace(/^[①②③④⑤]\s?/, "")}
                    </span>
                    {active && (
                      <span className="rounded-full bg-matcha-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {statusLabel(deal.status)}
                      </span>
                    )}
                  </div>
                  {n < STAGES.length && (
                    <div
                      className={`mx-1 mb-6 h-1.5 flex-1 rounded-full ${
                        done ? "bg-matcha-400" : "bg-cream-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="fade-up-2">
        <NextActionButton
          dealId={deal.id}
          status={deal.status}
          paymentsTotal={paymentsTotal}
          dealTotal={deal.total_amount}
          currency={deal.currency}
        />
      </div>

      {/* 書類(PI / CI / PL)— 進み具合に応じて「いまはこれ」を案内(docs/06) */}
      <section className="fade-up-2 card p-6">
        <h2 className="font-extrabold text-matcha-900">📄 書類をつくる</h2>
        <p className="mt-0.5 text-xs text-matcha-700/60">
          発行した書類はあとから変わりません(安心して送れます)。直したいときは案件を修正してもう一度発行するだけ
        </p>
        {canIssuePi ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { type: "quotation" as const, href: `/deals/${deal.id}/qt/new` },
                { type: "proforma_invoice" as const, href: `/deals/${deal.id}/pi/new` },
                { type: "commercial_invoice" as const, href: `/deals/${deal.id}/ci/new` },
                { type: "packing_list" as const, href: `/deals/${deal.id}/pl/new` },
              ] as const
            ).map(({ type, href }) => {
              const info = DOC_INFO[type];
              const issued = documents.some(
                (d) => d.doc_type === type && d.status === "issued"
              );
              const ciIssued = documents.some(
                (d) => d.doc_type === "commercial_invoice" && d.status === "issued"
              );
              // いまの段階でおすすめの書類を1つだけ光らせる
              // (QT: 商談中 / PI: 見積合意後 / CI: 入金後 / PL: CI発行後)
              const recommended = !issued &&
                (type === "quotation"
                  ? stage <= 1
                  : type === "proforma_invoice"
                    ? stage === 2
                    : type === "commercial_invoice"
                      ? stage >= 3
                      : stage >= 3 && ciIssued);
              return (
                <div
                  key={type}
                  className={`flex flex-col rounded-2xl border-2 p-4 ${
                    recommended
                      ? "border-matcha-400 bg-matcha-50"
                      : "border-cream-200 bg-cream-50"
                  }`}
                >
                  {recommended && (
                    <span className="mb-2 self-start rounded-full bg-matcha-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      ▶ いまはこれ
                    </span>
                  )}
                  {issued && (
                    <span className="mb-2 self-start rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-bold text-matcha-700">
                      ✔ 発行済み
                    </span>
                  )}
                  <p className="font-extrabold text-matcha-900">
                    {info.icon} {info.ja}
                  </p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-matcha-800/70">
                    {info.desc}
                  </p>
                  <p className="mt-2 text-[11px] font-bold text-matcha-700/60">
                    🕐 {info.when}
                  </p>
                  <Link
                    href={href}
                    className={`mt-3 justify-center text-center ${recommended ? "btn-primary" : "btn-secondary"}`}
                  >
                    {issued ? "もう一度発行する" : "発行する"}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-full bg-cream-200 px-4 py-2 text-xs font-bold text-matcha-700/70">
            {deal.country?.status === "unverified"
              ? "⚪ 輸出条件が未確認のため書類を発行できません"
              : "🔴 対応不可の国のため書類を発行できません"}
          </p>
        )}
        {documents.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-cream-200 pt-4">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3"
              >
                <span className="text-sm">
                  <span className="font-extrabold text-matcha-900">
                    {doc.doc_number}
                  </span>
                  <span className="ml-2 text-matcha-700/60">
                    {DOC_INFO[doc.doc_type].ja} — 発行日 {dateJa(doc.issue_date)}
                  </span>
                </span>
                <Link
                  href={`/deals/${deal.id}/docs/${doc.id}`}
                  className="btn-secondary"
                >
                  PDFを見る・ダウンロード
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 明細・金額 */}
      <section className="fade-up-3 card overflow-hidden">
        <h2 className="border-b border-cream-200 px-6 py-4 font-extrabold text-matcha-900">
          🧾 明細・金額
        </h2>
        <div className="divide-y divide-cream-200">
          {deal.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 px-6 py-4">
              <p className="whitespace-pre-line text-sm font-semibold text-matcha-900">
                {item.description}
              </p>
              <div className="shrink-0 text-right">
                <p className="text-xs text-matcha-700/60">
                  {item.quantity} {item.unit} × {money(item.unit_price, deal.currency)}
                </p>
                <p className="font-bold text-matcha-900">
                  {money(item.amount, deal.currency)}
                </p>
              </div>
            </div>
          ))}
          {deal.custom_packaging_fee > 0 && (
            <div className="flex items-start justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-matcha-900">
                  {deal.packaging_fee_title}
                </p>
                {deal.packaging_fee_desc && (
                  <p className="mt-0.5 max-w-md text-xs text-matcha-700/60">
                    {deal.packaging_fee_desc}
                  </p>
                )}
              </div>
              <p className="shrink-0 font-bold text-matcha-900">
                {money(deal.custom_packaging_fee, deal.currency)}
              </p>
            </div>
          )}
          <div className="space-y-1.5 bg-cream-50 px-6 py-4 text-sm">
            <div className="flex justify-between text-matcha-700/70">
              <span>小計</span>
              <span>{money(deal.subtotal, deal.currency)}</span>
            </div>
            <div className="flex justify-between text-matcha-700/70">
              <span>送料</span>
              <span>{money(deal.shipping_fee, deal.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-cream-300 pt-2 text-base font-extrabold text-matcha-900">
              <span>合計</span>
              <span>{money(deal.total_amount, deal.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 入金・ファイル */}
      <div className="fade-up-3">
        <PaymentsSection
          dealId={deal.id}
          payments={payments}
          dealTotal={deal.total_amount}
          currency={deal.currency}
        />
      </div>
      <div className="fade-up-3">
        <FilesSection dealId={deal.id} files={files} />
      </div>

      {/* 取引条件 */}
      <section className="fade-up-3 card p-6">
        <h2 className="font-extrabold text-matcha-900">🤝 取引条件</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-cream-50 p-3">
            <dt className="text-xs text-matcha-700/60">インコタームズ</dt>
            <dd className="mt-0.5 font-bold text-matcha-900">
              {deal.incoterms ?? "-"}
            </dd>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <dt className="text-xs text-matcha-700/60">支払条件</dt>
            <dd className="mt-0.5 font-bold text-matcha-900">
              {deal.payment_terms ?? "-"}
            </dd>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <dt className="text-xs text-matcha-700/60">出荷予定日</dt>
            <dd className="mt-0.5 font-bold text-matcha-900">
              {dateJa(deal.expected_ship_date)}
            </dd>
          </div>
        </dl>
      </section>

      {/* 仕向国の要件 */}
      {deal.country && deal.country.requirements.length > 0 && (
        <section className="fade-up-4 card border-2 border-gold-400/40 bg-gradient-to-br from-white to-cream-50 p-6">
          <h2 className="font-extrabold text-matcha-900">
            🟡 {deal.country.name_ja}向けに必要なこと
          </h2>
          <ul className="mt-3 space-y-2">
            {deal.country.requirements.map((r) => (
              <li
                key={r.label}
                className="flex items-start gap-2 text-sm text-matcha-800"
              >
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.required
                      ? "bg-gold-400/30 text-gold-600"
                      : "bg-cream-200 text-matcha-700/60"
                  }`}
                >
                  {r.required ? "必須" : "任意"}
                </span>
                {r.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 社内メモ */}
      {deal.internal_notes && (
        <section className="fade-up-4 card border-dashed p-6">
          <h2 className="flex items-center gap-2 font-extrabold text-matcha-900">
            ✏️ 社内メモ <InternalOnlyBadge />
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-matcha-800/80">
            {deal.internal_notes}
          </p>
        </section>
      )}
    </div>
  );
}

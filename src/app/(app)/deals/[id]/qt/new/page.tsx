import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { money } from "@/lib/format";
import { QtIssueForm } from "./qt-issue-form";

export const dynamic = "force-dynamic";

export default async function NewQtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await repo.getDeal(id);
  if (!deal || !deal.customer) notFound();
  const settings = await repo.getSettings();

  // 発行前チェックリスト(docs/06 §4.3)
  const warnings: { level: "error" | "warn"; message: string; fixHref?: string }[] = [];
  if (!settings.company_name || !settings.address) {
    warnings.push({
      level: "error",
      message: "自社情報(社名・住所)が未登録です",
      fixHref: "/settings",
    });
  }
  if (!deal.customer.billing_address) {
    warnings.push({
      level: "error",
      message: "顧客の請求先住所が空です",
      fixHref: `/customers/${deal.customer.id}/edit`,
    });
  }
  if (!deal.customer.shipping_address) {
    warnings.push({
      level: "warn",
      message: "顧客の発送先住所が空です(請求先住所が代わりに記載されます)",
      fixHref: `/customers/${deal.customer.id}/edit`,
    });
  }
  const euUk = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","GB"];
  if (
    deal.destination_country &&
    euUk.includes(deal.destination_country) &&
    !deal.customer.eori_number
  ) {
    warnings.push({
      level: "warn",
      message: "EU/UK向けなのに買い手のEORI番号が未登録です。通関が止まる原因になります",
      fixHref: `/customers/${deal.customer.id}/edit`,
    });
  }
  if (!deal.incoterms) {
    warnings.push({ level: "warn", message: "インコタームズが未設定です" });
  }
  if (deal.country?.status === "unverified" || deal.country?.status === "prohibited") {
    warnings.push({
      level: "error",
      message:
        deal.country.status === "unverified"
          ? `${deal.country.name_ja}は輸出条件が未確認のため書類を発行できません`
          : `${deal.country.name_ja}は対応不可のため書類を発行できません`,
      fixHref: "/countries",
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-matcha-700/50">{deal.deal_no}</p>
        <h1 className="text-2xl font-extrabold text-matcha-900">
          📝 見積書(Quotation)を発行する
        </h1>
        <p className="mt-1 text-sm text-matcha-700/60">
          {deal.customer.company_name} / 合計 {money(deal.total_amount, deal.currency)} — まだ請求ではなく「この条件でいかがですか?」の提案書です
        </p>
      </div>

      <QtIssueForm dealId={deal.id} warnings={warnings} />
    </div>
  );
}

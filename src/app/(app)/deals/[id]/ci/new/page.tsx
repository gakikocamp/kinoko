import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { money } from "@/lib/format";
import { CiIssueForm } from "./ci-issue-form";

export const dynamic = "force-dynamic";

export default async function NewCiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await repo.getDeal(id);
  if (!deal || !deal.customer) notFound();

  const warnings: { level: "error" | "warn"; message: string }[] = [];
  if (!["paid", "repacking", "ready_to_ship", "shipped", "completed"].includes(deal.status)) {
    warnings.push({
      level: "warn",
      message:
        "まだ入金確認前です。CIは通関書類なので、通常は入金後・出荷準備の段階で発行します",
    });
  }
  const docs = await repo.listDocuments(id);
  if (!docs.some((d) => d.doc_type === "proforma_invoice")) {
    warnings.push({
      level: "warn",
      message: "PIが未発行です。金額の合意(PI)より先にCIを発行するのは通常と異なります",
    });
  }
  if (deal.country?.status === "unverified" || deal.country?.status === "prohibited") {
    warnings.push({
      level: "error",
      message: `${deal.country.name_ja}へは書類を発行できません(${deal.country.status === "unverified" ? "輸出条件が未確認" : "対応不可"})`,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="fade-up">
        <p className="text-sm text-matcha-700/50">{deal.deal_no}</p>
        <h1 className="text-2xl font-extrabold text-matcha-900">
          🛃 通関インボイス(CI)を発行する
        </h1>
        <p className="mt-1 text-sm text-matcha-700/60">
          {deal.customer.company_name} / 合計 {money(deal.total_amount, deal.currency)}
          — 税関に見せる正式な書類です。発送物に同封します
        </p>
      </div>

      <CiIssueForm
        dealId={deal.id}
        warnings={warnings}
        defaultMethod={deal.shipping_method}
        defaultTracking={deal.tracking_number}
      />
    </div>
  );
}

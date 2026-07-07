import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { PlIssueForm } from "./pl-issue-form";
import type { CartonRowInput } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function NewPlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await repo.getDeal(id);
  if (!deal || !deal.customer) notFound();

  const saved = await repo.listCartons(id);
  const initialRows: CartonRowInput[] = saved.map((c) => ({
    cartonRange: c.carton_range,
    cartonsCount: c.cartons_count,
    unitsPerCarton: c.units_per_carton,
    netWeightKg: c.net_weight_kg,
    grossWeightKg: c.gross_weight_kg,
    lengthCm: c.length_cm,
    widthCm: c.width_cm,
    heightCm: c.height_cm,
  }));

  const dealQuantity = deal.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="fade-up">
        <p className="text-sm text-matcha-700/50">{deal.deal_no}</p>
        <h1 className="text-2xl font-extrabold text-matcha-900">
          Packing List を発行する
        </h1>
        <p className="mt-1 text-sm text-matcha-700/60">
          {deal.customer.company_name} — 箱数・重量・寸法の明細です(金額は記載されません)
        </p>
      </div>

      <PlIssueForm
        dealId={deal.id}
        initialRows={initialRows}
        dealQuantity={dealQuantity}
      />
    </div>
  );
}

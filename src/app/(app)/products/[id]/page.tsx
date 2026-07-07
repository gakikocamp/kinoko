import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { money } from "@/lib/format";
import { InternalOnlyBadge } from "@/components/badges";
import { LotsSection } from "./lots-section";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5">
      <dt className="text-sm text-matcha-700/60">{label}</dt>
      <dd className="col-span-2 whitespace-pre-line text-sm text-gray-900">
        {value ?? "-"}
      </dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await repo.getProduct(id);
  if (!p) notFound();
  const lots = await repo.listLots(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-matcha-700/50">{p.product_no}</p>
          <h1 className="text-2xl font-extrabold text-matcha-900">
            {p.brand_name ? `${p.brand_name} ` : ""}
            {p.name}
          </h1>
        </div>
        <Link
          href={`/products/${id}/edit`}
          className="btn-secondary"
        >
          編集する
        </Link>
      </div>

      <dl className="card divide-y divide-cream-200">
        <Row label="グレード" value={p.grade} />
        <Row label="収穫" value={`${p.harvest_year ?? "-"} ${p.harvest_season ?? ""}`} />
        <Row label="産地" value={p.origin} />
        <Row label="原産国" value={p.country_of_origin} />
        <Row label="HSコード" value={p.hs_code} />
        <Row label="包装形態" value={p.packaging_type} />
        <Row label="MOQ" value={p.moq} />
        <Row label="販売単価" value={money(p.unit_price, p.price_currency)} />
        <Row label="商品説明(PDF用)" value={p.description} />
      </dl>

      <LotsSection productId={id} lots={lots} />

      <dl className="card divide-y divide-cream-200 border-dashed bg-cream-50">
        <Row
          label={<span>原価 <InternalOnlyBadge /></span>}
          value={p.cost_price != null ? money(p.cost_price, "JPY") : "-"}
        />
        <Row label={<span>社内メモ <InternalOnlyBadge /></span>} value={p.internal_notes} />
      </dl>
    </div>
  );
}

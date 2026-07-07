import Link from "next/link";
import { repo } from "@/lib/data";
import { money } from "@/lib/format";
import { InternalOnlyBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await repo.listProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-matcha-900">🍵 商品</h1>
        <Link
          href="/products/new"
          className="btn-primary"
        >
          + 商品を登録する
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-left text-xs font-bold text-matcha-700/60">
            <tr>
              <th className="px-4 py-2 font-medium">商品番号</th>
              <th className="px-4 py-2 font-medium">商品名</th>
              <th className="px-4 py-2 font-medium">グレード</th>
              <th className="px-4 py-2 font-medium">包装</th>
              <th className="px-4 py-2 font-medium">販売単価</th>
              <th className="px-4 py-2 font-medium">
                原価 <InternalOnlyBadge />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-matcha-50/60">
                <td className="px-4 py-2.5 text-gray-500">{p.product_no}</td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/products/${p.id}`}
                    className="font-bold text-matcha-700 hover:underline"
                  >
                    {p.brand_name ? `${p.brand_name} ` : ""}
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{p.grade ?? "-"}</td>
                <td className="px-4 py-2.5">{p.packaging_type ?? "-"}</td>
                <td className="px-4 py-2.5">
                  {money(p.unit_price, p.price_currency)}
                </td>
                <td className="px-4 py-2.5 text-gray-500">
                  {p.cost_price != null ? money(p.cost_price, "JPY") : "-"}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  まだ商品がありません。「商品を登録する」から始めましょう
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

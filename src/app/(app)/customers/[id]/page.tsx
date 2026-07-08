import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { CountryBadge, DealStatusBadge } from "@/components/badges";
import { money, dateJa } from "@/lib/format";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5">
      <dt className="text-sm text-matcha-700/60">{label}</dt>
      <dd className="col-span-2 whitespace-pre-line text-sm text-gray-900">
        {value ?? "-"}
      </dd>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await repo.getCustomer(id);
  if (!customer) notFound();

  const [country, deals] = await Promise.all([
    customer.country ? repo.getCountry(customer.country) : null,
    repo.listDealsByCustomer(id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-matcha-700/50">{customer.customer_no}</p>
          <h1 className="text-2xl font-extrabold text-matcha-900">
            {customer.company_name}
          </h1>
          <div className="mt-1">
            <CountryBadge country={country} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${id}/edit`}
            className="btn-secondary"
          >
            編集する
          </Link>
          <Link
            href={`/deals/new?customer=${id}`}
            className="btn-primary"
          >
            + この顧客の案件を作成
          </Link>
        </div>
      </div>

      <dl className="card divide-y divide-cream-200">
        <Row label="担当者" value={customer.contact_person} />
        <Row label="メール" value={customer.email} />
        <Row label="電話" value={customer.phone} />
        <Row label="請求先住所" value={customer.billing_address} />
        <Row label="発送先住所" value={customer.shipping_address} />
        <Row label="VAT番号" value={customer.vat_number} />
        <Row label="EORI番号" value={customer.eori_number} />
        <Row label="輸入ライセンスメモ" value={customer.import_license_notes} />
        <Row label="希望支払方法" value={customer.preferred_payment_method} />
        <Row label="メモ" value={customer.notes} />
        <Row label="登録日" value={dateJa(customer.created_at)} />
      </dl>

      <section>
        <h2 className="text-sm font-semibold text-gray-700">この顧客の案件</h2>
        <div className="mt-2 card overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-cream-200">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-matcha-50/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-bold text-matcha-700 hover:underline"
                    >
                      {d.deal_no}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <DealStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {money(d.total_amount, d.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    出荷予定 {dateJa(d.expected_ship_date)}
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400">
                    まだ案件がありません
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

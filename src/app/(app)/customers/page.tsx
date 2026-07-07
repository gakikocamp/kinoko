import Link from "next/link";
import { repo } from "@/lib/data";
import { CountryBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, countries] = await Promise.all([
    repo.listCustomers(),
    repo.getCountries(),
  ]);
  const countryOf = (code: string | null) =>
    countries.find((c) => c.code === code) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-900">👤 顧客</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + 顧客を登録する
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">顧客番号</th>
              <th className="px-4 py-2 font-medium">会社名</th>
              <th className="px-4 py-2 font-medium">担当者</th>
              <th className="px-4 py-2 font-medium">国</th>
              <th className="px-4 py-2 font-medium">希望支払方法</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-green-50/50">
                <td className="px-4 py-2.5 text-gray-500">{c.customer_no}</td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/customers/${c.id}`}
                    className="font-medium text-green-800 hover:underline"
                  >
                    {c.company_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{c.contact_person ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <CountryBadge country={countryOf(c.country)} />
                </td>
                <td className="px-4 py-2.5">
                  {c.preferred_payment_method ?? "-"}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  まだ顧客がありません。「顧客を登録する」から始めましょう
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

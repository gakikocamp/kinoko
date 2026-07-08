import { repo } from "@/lib/data";
import { COUNTRY_STATUS_META } from "@/lib/status";
import { dateJa } from "@/lib/format";
import type { CountryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORDER: CountryStatus[] = ["ok", "conditional", "unverified", "prohibited"];

export default async function CountriesPage() {
  const countries = await repo.getCountries();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-matcha-900">🌍 国・輸出ルール</h1>
        <p className="mt-1 text-sm text-matcha-700/60">
          問い合わせが来た国の輸出可否と要件を管理します。ここに無い国・⚪未確認の国は、JETRO・通関業者に確認してから分類してください
        </p>
      </div>

      {ORDER.map((status) => {
        const list = countries.filter((c) => c.status === status);
        if (list.length === 0) return null;
        const meta = COUNTRY_STATUS_META[status];
        return (
          <section key={status}>
            <h2 className="text-sm font-semibold text-gray-700">
              {meta.icon} {meta.label}({list.length}カ国)
            </h2>
            <div className="mt-2 card overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-cream-200">
                  {list.map((c) => {
                    const stale =
                      c.last_reviewed_at &&
                      new Date(c.last_reviewed_at) < oneYearAgo;
                    return (
                      <tr key={c.code} className="hover:bg-matcha-50/60">
                        <td className="w-48 px-4 py-2.5 font-medium">
                          {c.name_ja}
                          <span className="ml-1 text-xs text-matcha-700/50">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {c.summary ?? "-"}
                          {c.requirements.length > 0 && (
                            <span className="ml-2 text-xs text-matcha-700/50">
                              要件 {c.requirements.length}件
                            </span>
                          )}
                        </td>
                        <td className="w-44 px-4 py-2.5 text-xs text-gray-500">
                          最終確認 {dateJa(c.last_reviewed_at)}
                          {stale && (
                            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                              ⚠️ 要再確認
                            </span>
                          )}
                          {!c.last_reviewed_at && (
                            <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-gray-500">
                              未確認
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

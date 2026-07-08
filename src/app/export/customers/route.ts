import { repo } from "@/lib/data";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const [customers, countries] = await Promise.all([
    repo.listCustomers(),
    repo.getCountries(),
  ]);
  const countryName = (code: string | null) =>
    countries.find((c) => c.code === code)?.name_ja ?? code;

  const csv = toCsv(
    [
      "顧客番号", "会社名", "担当者", "メール", "電話", "国",
      "請求先住所", "発送先住所", "VAT番号", "EORI番号",
      "希望支払方法", "メモ", "登録日",
    ],
    customers.map((c) => [
      c.customer_no,
      c.company_name,
      c.contact_person,
      c.email,
      c.phone,
      countryName(c.country),
      c.billing_address,
      c.shipping_address,
      c.vat_number,
      c.eori_number,
      c.preferred_payment_method,
      c.notes,
      c.created_at.slice(0, 10),
    ])
  );
  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `customers_${today}.csv`);
}

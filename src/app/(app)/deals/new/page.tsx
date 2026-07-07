import { repo } from "@/lib/data";
import { DealForm } from "./deal-form";

export const dynamic = "force-dynamic";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const [customers, products, countries, settings] = await Promise.all([
    repo.listCustomers(),
    repo.listProducts(),
    repo.getCountries(),
    repo.getSettings(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-900">案件を作成する</h1>
      <DealForm
        customers={customers}
        products={products}
        countries={countries}
        defaultCustomerId={customer}
        defaultPaymentTerms={
          settings.default_payment_terms ??
          "100% advance payment before production and shipment"
        }
      />
    </div>
  );
}

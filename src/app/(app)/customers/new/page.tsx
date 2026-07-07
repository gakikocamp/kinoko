import { repo } from "@/lib/data";
import { CustomerForm } from "../customer-form";
import { createCustomerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const countries = await repo.getCountries();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-900">顧客を登録する</h1>
      <p className="text-sm text-gray-500">
        顧客番号(CUST-)は保存時に自動で採番されます
      </p>
      <CustomerForm
        action={createCustomerAction}
        countries={countries}
        submitLabel="顧客を登録する"
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { CustomerForm } from "../../customer-form";
import { updateCustomerAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, countries] = await Promise.all([
    repo.getCustomer(id),
    repo.getCountries(),
  ]);
  if (!customer) notFound();

  const action = updateCustomerAction.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-matcha-900">
        {customer.company_name} を編集する
      </h1>
      <CustomerForm
        action={action}
        countries={countries}
        initial={customer}
        submitLabel="変更を保存する"
      />
    </div>
  );
}

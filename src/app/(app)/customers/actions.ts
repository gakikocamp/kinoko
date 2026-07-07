"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { repo, type CustomerInput } from "@/lib/data";

function parse(formData: FormData): CustomerInput {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const companyName = get("company_name");
  if (!companyName) throw new Error("会社名は必須です");
  return {
    company_name: companyName,
    contact_person: get("contact_person"),
    email: get("email"),
    phone: get("phone"),
    country: get("country"),
    billing_address: get("billing_address"),
    shipping_address: get("shipping_address"),
    vat_number: get("vat_number"),
    eori_number: get("eori_number"),
    import_license_notes: get("import_license_notes"),
    preferred_payment_method: get("preferred_payment_method"),
    notes: get("notes"),
  };
}

export async function createCustomerAction(formData: FormData) {
  const id = await repo.createCustomer(parse(formData));
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function updateCustomerAction(id: string, formData: FormData) {
  await repo.updateCustomer(id, parse(formData));
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

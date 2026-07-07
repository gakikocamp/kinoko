"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/data";

export async function updateSettingsAction(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  await repo.updateSettings({
    company_name: get("company_name") ?? "",
    address: get("address") ?? "",
    phone: get("phone"),
    email: get("email"),
    representative_name: get("representative_name"),
    bank_details: get("bank_details"),
    wise_details: get("wise_details"),
    default_currency: get("default_currency") ?? "USD",
    default_payment_terms: get("default_payment_terms"),
  });
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

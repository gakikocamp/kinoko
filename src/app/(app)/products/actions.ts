"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { repo, type ProductInput } from "@/lib/data";

function parse(formData: FormData): ProductInput {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const num = (k: string) => {
    const v = get(k);
    return v == null ? null : Number(v);
  };
  const name = get("name");
  if (!name) throw new Error("商品名は必須です");
  return {
    name,
    brand_name: get("brand_name"),
    grade: get("grade"),
    harvest_year: num("harvest_year"),
    harvest_season: get("harvest_season"),
    origin: get("origin"),
    country_of_origin: get("country_of_origin") ?? "Japan",
    hs_code: get("hs_code"),
    unit_price: num("unit_price"),
    price_currency: get("price_currency") ?? "USD",
    cost_price: num("cost_price"),
    moq: num("moq"),
    packaging_type: get("packaging_type"),
    description: get("description"),
    internal_notes: get("internal_notes"),
  };
}

export async function createProductAction(formData: FormData) {
  const id = await repo.createProduct(parse(formData));
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export async function updateProductAction(id: string, formData: FormData) {
  await repo.updateProduct(id, parse(formData));
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

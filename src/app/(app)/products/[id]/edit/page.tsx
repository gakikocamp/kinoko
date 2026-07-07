import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await repo.getProduct(id);
  if (!product) notFound();

  const action = updateProductAction.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-matcha-900">
        {product.name} を編集する
      </h1>
      <ProductForm action={action} initial={product} submitLabel="変更を保存する" />
    </div>
  );
}

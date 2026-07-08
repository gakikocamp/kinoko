import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-matcha-900">商品を登録する</h1>
      <p className="text-sm text-matcha-700/60">
        商品番号(PROD-)は保存時に自動で採番されます
      </p>
      <ProductForm action={createProductAction} submitLabel="商品を登録する" />
    </div>
  );
}

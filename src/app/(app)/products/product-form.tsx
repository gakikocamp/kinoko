import { InternalOnlyBadge } from "@/components/badges";
import type { Product } from "@/lib/types";

const input =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none";

function Field({
  label,
  children,
  hint,
  requiredMark,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  requiredMark?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {requiredMark && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function ProductForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: Product;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="商品名" requiredMark>
          <input name="name" required defaultValue={initial?.name} className={input} placeholder="例: Imperial Ceremonial" />
        </Field>
        <Field label="ブランド名">
          <input name="brand_name" defaultValue={initial?.brand_name ?? ""} className={input} placeholder="例: MATCHA NINJA" />
        </Field>
        <Field label="グレード">
          <input name="grade" defaultValue={initial?.grade ?? ""} className={input} placeholder="例: Ceremonial" />
        </Field>
        <Field label="包装形態">
          <input name="packaging_type" defaultValue={initial?.packaging_type ?? ""} className={input} placeholder="例: 100g silver aluminum pouch" />
        </Field>
        <Field label="収穫年">
          <input name="harvest_year" type="number" defaultValue={initial?.harvest_year ?? ""} className={input} placeholder="例: 2026" />
        </Field>
        <Field label="収穫期">
          <input name="harvest_season" defaultValue={initial?.harvest_season ?? ""} className={input} placeholder="例: Spring 1st Flush" />
        </Field>
        <Field label="産地">
          <input name="origin" defaultValue={initial?.origin ?? ""} className={input} placeholder="例: Yame, Fukuoka, Japan" />
        </Field>
        <Field label="原産国">
          <input name="country_of_origin" defaultValue={initial?.country_of_origin ?? "Japan"} className={input} />
        </Field>
        <Field label="HSコード" hint="抹茶は0902.10系(3kg以下小売包装)。仕向国で異なる場合は案件側で上書き可">
          <input name="hs_code" defaultValue={initial?.hs_code ?? "0902.10"} className={input} />
        </Field>
        <Field label="MOQ(最小注文数)">
          <input name="moq" type="number" defaultValue={initial?.moq ?? ""} className={input} placeholder="例: 100" />
        </Field>
        <Field label="販売単価">
          <input name="unit_price" type="number" step="0.01" defaultValue={initial?.unit_price ?? ""} className={input} placeholder="例: 38.00" />
        </Field>
        <Field label="通貨">
          <select name="price_currency" defaultValue={initial?.price_currency ?? "USD"} className={input}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
      </div>

      <Field label="商品説明(PDF記載用・英語)" hint="PI/CIのDescription欄にこのまま載ります">
        <textarea name="description" rows={3} defaultValue={initial?.description ?? ""} className={input}
          placeholder={'例:\nMATCHA NINJA "Imperial Ceremonial"\n2026 Spring 1st Flush Yame Matcha\n100g silver aluminum pouch'} />
      </Field>

      <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold text-gray-600">
          <InternalOnlyBadge /> ここから下は社内専用。PDFには一切出ません
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="原価(仕入・製造)">
            <input name="cost_price" type="number" step="0.01" defaultValue={initial?.cost_price ?? ""} className={input} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="社内メモ">
            <textarea name="internal_notes" rows={2} defaultValue={initial?.internal_notes ?? ""} className={input} />
          </Field>
        </div>
      </div>

      <div className="flex gap-3 border-t border-gray-100 pt-5">
        <button
          type="submit"
          className="rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          {submitLabel}
        </button>
        <p className="self-center text-xs text-gray-400">
          間違えてもあとから編集できます
        </p>
      </div>
    </form>
  );
}

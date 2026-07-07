"use client";

import { useActionState, useMemo, useState } from "react";
import { createDealAction, type ActionState } from "../actions";
import { CountrySelect } from "@/components/country-select";
import { money } from "@/lib/format";
import type { Country, Customer, Product } from "@/lib/types";

const input = "input";

function Field({
  label,
  children,
  hint,
  requiredMark,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  requiredMark?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-matcha-800">
        {label}
        {requiredMark && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-matcha-700/50">{hint}</p>}
    </div>
  );
}

export function DealForm({
  customers,
  products,
  countries,
  defaultCustomerId,
  defaultPaymentTerms,
}: {
  customers: Customer[];
  products: Product[];
  countries: Country[];
  defaultCustomerId?: string;
  defaultPaymentTerms: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createDealAction,
    null
  );

  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [packagingFee, setPackagingFee] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [currency, setCurrency] = useState("USD");

  const customer = customers.find((c) => c.id === customerId);
  const product = products.find((p) => p.id === productId);

  // 金額はすべて自動計算(手入力させない・docs/06 §5)
  const amount = useMemo(
    () => Math.round(quantity * unitPrice * 100) / 100,
    [quantity, unitPrice]
  );
  const subtotal = Math.round((amount + packagingFee) * 100) / 100;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setUnitPrice(p.unit_price ?? 0);
      setCurrency(p.price_currency);
      if (p.moq && quantity === 0) setQuantity(p.moq);
    }
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">1. 顧客と商品</h2>
        <Field label="顧客" requiredMark>
          <select
            name="customer_id"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className={input}
          >
            <option value="">選択してください</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_no} {c.company_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="商品" requiredMark hint="選択すると単価・MOQが自動で入ります">
          <select
            name="product_id"
            required
            value={productId}
            onChange={(e) => onSelectProduct(e.target.value)}
            className={input}
          >
            <option value="">選択してください</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_no} {p.brand_name} {p.name}({p.packaging_type}
              </option>
            ))}
          </select>
        </Field>
        {product?.description && (
          <input type="hidden" name="item_description" value={product.description} />
        )}

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="数量" requiredMark>
            <input
              name="quantity" type="number" min={1} required
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={input}
            />
          </Field>
          <Field label="単位">
            <select name="unit" defaultValue="pcs" className={input}>
              <option value="pcs">pcs(個)</option>
              <option value="kg">kg</option>
              <option value="cartons">cartons(箱)</option>
            </select>
          </Field>
          <Field label="単価">
            <input
              name="unit_price" type="number" step="0.01" min={0}
              value={unitPrice || ""}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">2. 加工費・送料</h2>
        <Field label="加工費の名目(PDF記載・英語)">
          <input
            name="packaging_fee_title"
            defaultValue="Custom repacking & label application fee"
            className={input}
          />
        </Field>
        <Field label="加工費の説明(PDF記載・英語)">
          <textarea
            name="packaging_fee_desc" rows={3} className={input}
            placeholder="例: 100g x 200 silver aluminum pouches. Includes label printing/cutting, label application, 100g weighing and repacking, oxygen absorber insertion, heat sealing, lot control, and final quality check."
          />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="加工費(顧客向け金額)">
            <input
              name="custom_packaging_fee" type="number" step="0.01" min={0}
              value={packagingFee || ""}
              onChange={(e) => setPackagingFee(Number(e.target.value))}
              className={input}
            />
          </Field>
          <Field label="送料" hint="EXW/FOBなど買い手負担の条件では0のままにします">
            <input
              name="shipping_fee" type="number" step="0.01" min={0}
              value={shippingFee || ""}
              onChange={(e) => setShippingFee(Number(e.target.value))}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">3. 取引条件</h2>
        <Field label="仕向国" requiredMark hint="🔴対応不可の国は案件を作成できません">
          <CountrySelect
            countries={countries}
            name="destination_country"
            defaultValue={customer?.country}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="通貨">
            <select
              name="currency" value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={input}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="JPY">JPY</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>
          <Field label="インコタームズ">
            <select name="incoterms_rule" defaultValue="" className={input}>
              <option value="">選択してください</option>
              <option value="EXW">EXW(工場渡し)</option>
              <option value="FOB">FOB(本船渡し)</option>
              <option value="CIF">CIF(運賃保険料込み)</option>
              <option value="CPT">CPT(輸送費込み)</option>
              <option value="DAP">DAP(仕向地持込渡し)</option>
              <option value="DDP">DDP(関税込持込渡し)</option>
            </select>
          </Field>
          <Field label="場所" hint='例: Hakata / Hamburg'>
            <input name="incoterms_place" className={input} placeholder="例: Hamburg" />
          </Field>
        </div>
        <Field label="支払条件(PDF記載・英語)">
          <input name="payment_terms" defaultValue={defaultPaymentTerms} className={input} />
        </Field>
        <Field label="出荷予定日">
          <input name="expected_ship_date" type="date" className={input} />
        </Field>
        <Field label="社内メモ(PDFに出ません)">
          <textarea name="internal_notes" rows={2} className={input} />
        </Field>
      </section>

      <section className="card border-2 border-matcha-300 bg-gradient-to-br from-matcha-50 to-cream-50 p-5">
        <h2 className="font-extrabold text-matcha-900">💰 金額(自動計算)</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">商品金額({quantity || 0} × {money(unitPrice, currency)}</dt>
            <dd className="font-medium">{money(amount, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">加工費</dt>
            <dd className="font-medium">{money(packagingFee, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">小計</dt>
            <dd className="font-medium">{money(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">送料</dt>
            <dd className="font-medium">{money(shippingFee, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-matcha-200 pt-1.5 text-base">
            <dt className="font-extrabold text-matcha-900">合計</dt>
            <dd className="font-extrabold text-matcha-900">{money(total, currency)}</dd>
          </div>
        </dl>
      </section>

      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {state.error}
        </p>
      )}

      <div className="flex gap-3 border-t border-gray-100 pt-5">
        <button
          type="submit"
          className="btn-primary"
        >
          案件を作成する
        </button>
        <p className="self-center text-xs text-matcha-700/50">
          案件番号(DEAL-)は自動で採番されます
        </p>
      </div>
    </form>
  );
}

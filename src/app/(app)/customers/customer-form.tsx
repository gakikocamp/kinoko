import { CountrySelect } from "@/components/country-select";
import { HelpTip } from "@/components/help-tip";
import type { Country, Customer } from "@/lib/types";

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
      <label className="block text-sm font-bold text-matcha-800">
        {label}
        {requiredMark && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-matcha-700/50">{hint}</p>}
    </div>
  );
}

const input = "input";

export function CustomerForm({
  action,
  countries,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  countries: Country[];
  initial?: Customer;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="会社名" requiredMark>
          <input name="company_name" required defaultValue={initial?.company_name} className={input} placeholder="例: Green Leaf Trading GmbH" />
        </Field>
        <Field label="担当者名">
          <input name="contact_person" defaultValue={initial?.contact_person ?? ""} className={input} placeholder="例: Anna Schmidt" />
        </Field>
        <Field label="メールアドレス">
          <input name="email" type="email" defaultValue={initial?.email ?? ""} className={input} />
        </Field>
        <Field label="電話番号">
          <input name="phone" defaultValue={initial?.phone ?? ""} className={input} placeholder="例: +49-30-1234567" />
        </Field>
      </div>

      <Field label="国" hint="選択すると輸出可否が表示されます">
        <CountrySelect countries={countries} name="country" defaultValue={initial?.country} />
      </Field>

      <Field label="請求先住所(Billing address)" hint="PDFにこのまま記載されます。英語で入力してください">
        <textarea name="billing_address" rows={2} defaultValue={initial?.billing_address ?? ""} className={input} />
      </Field>
      <Field label="発送先住所(Shipping address)" hint="請求先と同じ場合も入力してください">
        <textarea name="shipping_address" rows={2} defaultValue={initial?.shipping_address ?? ""} className={input} />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={<>VAT番号<HelpTip term="VAT番号">ヨーロッパの消費税(VAT)の事業者番号です。EU/UKのバイヤーに「VAT numberを教えてください」と聞けばもらえます。インボイスに記載します。</HelpTip></>}>
          <input name="vat_number" defaultValue={initial?.vat_number ?? ""} className={input} placeholder="例: DE123456789" />
        </Field>
        <Field label={<>EORI番号<HelpTip term="EORI番号">EU・イギリスの輸入者が持つ通関用の番号です。EU/UK向けの発送では書類に書いていないと税関で止まることがあるので、必ずバイヤーからもらってください。</HelpTip></>} hint="EU/UK向けでは必須。空のまま請求書(PI)を発行しようとすると警告が出ます">
          <input name="eori_number" defaultValue={initial?.eori_number ?? ""} className={input} placeholder="例: DE1234567890123" />
        </Field>
      </div>

      <Field label="輸入ライセンス・規制メモ">
        <textarea name="import_license_notes" rows={2} defaultValue={initial?.import_license_notes ?? ""} className={input} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="希望支払方法">
          <select name="preferred_payment_method" defaultValue={initial?.preferred_payment_method ?? ""} className={input}>
            <option value="">選択してください</option>
            <option value="Wise">Wise</option>
            <option value="Wire transfer (T/T)">銀行送金(T/T)</option>
            <option value="Other">その他</option>
          </select>
        </Field>
      </div>
      <Field label="メモ">
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} className={input} />
      </Field>

      <div className="flex gap-3 border-t border-gray-100 pt-5">
        <button
          type="submit"
          className="btn-primary"
        >
          {submitLabel}
        </button>
        <p className="self-center text-xs text-matcha-700/50">
          間違えてもあとから編集できます
        </p>
      </div>
    </form>
  );
}

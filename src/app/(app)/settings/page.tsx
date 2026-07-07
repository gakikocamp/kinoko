import { repo } from "@/lib/data";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const input = "input";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-matcha-800">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-matcha-700/50">{hint}</p>}
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [settings, { saved }] = await Promise.all([
    repo.getSettings(),
    searchParams,
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-matcha-900">⚙️ 設定</h1>
      {saved && (
        <p className="fade-up card border-2 border-matcha-300 bg-matcha-50 px-4 py-2.5 text-sm font-bold text-matcha-800">
          ✅ 保存しました
        </p>
      )}
      <p className="text-sm text-matcha-700/60">
        ここで登録した内容がすべてのPDF(PI / CI / Packing List)のヘッダ・振込先・署名欄に使われます。**英語で入力してください**
      </p>

      <form action={updateSettingsAction} className="space-y-5">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">自社(Exporter)情報</h2>
          <Field label="会社名(英語)">
            <input name="company_name" defaultValue={settings.company_name} className={input} placeholder="例: MATCHA NINJA Co., Ltd." />
          </Field>
          <Field label="住所(英語)">
            <textarea name="address" rows={2} defaultValue={settings.address} className={input} placeholder="例: 1-2-3 Yame Chuo, Yame City, Fukuoka 834-0031, Japan" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="電話">
              <input name="phone" defaultValue={settings.phone ?? ""} className={input} placeholder="+81-..." />
            </Field>
            <Field label="メール">
              <input name="email" type="email" defaultValue={settings.email ?? ""} className={input} />
            </Field>
          </div>
          <Field label="署名者名(英語)" hint="PDF署名欄に記載されます">
            <input name="representative_name" defaultValue={settings.representative_name ?? ""} className={input} placeholder="例: Taro Yame" />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">受取口座(PIに記載)</h2>
          <Field label="銀行送金情報" hint="銀行名・支店・SWIFT・口座番号・受取人名など">
            <textarea name="bank_details" rows={4} defaultValue={settings.bank_details ?? ""} className={input} />
          </Field>
          <Field label="Wise受取情報">
            <textarea name="wise_details" rows={2} defaultValue={settings.wise_details ?? ""} className={input} />
          </Field>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ 振込先すり替え詐欺(BEC)対策: 口座情報を変更すると全管理者に通知されます(本番環境)。バイヤーには「メールでの口座変更連絡は無効」と必ず伝えてください
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">デフォルト値</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="通貨">
              <select name="default_currency" defaultValue={settings.default_currency} className={input}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
                <option value="GBP">GBP</option>
              </select>
            </Field>
          </div>
          <Field label="支払条件(英語)">
            <input name="default_payment_terms" defaultValue={settings.default_payment_terms ?? ""} className={input} />
          </Field>
        </section>

        <button
          type="submit"
          className="btn-primary"
        >
          保存する
        </button>
      </form>
    </div>
  );
}

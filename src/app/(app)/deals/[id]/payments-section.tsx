"use client";

import { useRef, useState, useTransition } from "react";
import { addPaymentAction } from "../actions";
import { money, dateJa } from "@/lib/format";
import type { Payment } from "@/lib/types";

export function PaymentsSection({
  dealId,
  payments,
  dealTotal,
  currency,
}: {
  dealId: string;
  payments: Payment[];
  dealTotal: number;
  currency: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const received = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, Math.round((dealTotal - received) * 100) / 100);

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await addPaymentAction(dealId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setShowForm(false);
    });
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-matcha-900">💰 入金の記録</h2>
          <p className="mt-0.5 text-xs text-matcha-700/60">
            着金したら必ずここに記録。振込明細の写真は「📎 ファイル」の「入金証憑」へ
          </p>
        </div>
        <div className="text-right text-sm">
          <p
            className={`font-extrabold ${remaining === 0 && received > 0 ? "text-matcha-700" : "text-matcha-900"}`}
          >
            {money(received, currency)} / {money(dealTotal, currency)}
          </p>
          <p className="text-xs text-matcha-700/60">
            {received === 0
              ? "まだ入金がありません"
              : remaining === 0
                ? "✅ 全額入金済み"
                : `のこり ${money(remaining, currency)}`}
          </p>
        </div>
      </div>

      {payments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-2.5 text-sm"
            >
              <span>
                <span className="font-bold text-matcha-900">
                  {money(p.amount, p.currency)}
                </span>
                <span className="ml-2 text-matcha-700/60">
                  {dateJa(p.received_date)}
                  {p.method ? ` ・ ${p.method}` : ""}
                </span>
              </span>
              {p.notes && (
                <span className="text-xs text-matcha-700/50">{p.notes}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary mt-4"
        >
          ✚ 入金を記録する
        </button>
      ) : (
        <form
          ref={formRef}
          action={submit}
          className="mt-4 space-y-3 rounded-2xl border-2 border-cream-300 bg-cream-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs font-bold text-matcha-800">
              入金額
              <input
                name="amount" type="number" step="0.01" min={0.01} required
                defaultValue={remaining || ""}
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-bold text-matcha-800">
              通貨
              <select name="currency" defaultValue={currency} className="input mt-1">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="text-xs font-bold text-matcha-800">
              入金日
              <input
                name="received_date" type="date" required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-bold text-matcha-800">
              受取方法
              <select name="method" className="input mt-1">
                <option value="Wise">Wise</option>
                <option value="Wire transfer (T/T)">銀行送金(T/T)</option>
                <option value="Other">その他</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-bold text-matcha-800">
            メモ(任意)
            <input name="notes" className="input mt-1" placeholder="例: 銀行手数料で15ドル目減り" />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              ❌ {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "記録中…" : "この内容で記録する"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              やめる
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

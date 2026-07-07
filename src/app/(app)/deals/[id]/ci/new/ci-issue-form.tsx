"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueCiAction } from "../../../actions";

const SHIPPING_METHODS = [
  "FedEx International Priority",
  "DHL Express",
  "UPS Worldwide",
  "EMS",
  "Air freight",
  "Sea freight",
];

export function CiIssueForm({
  dealId,
  warnings,
  defaultMethod,
  defaultTracking,
}: {
  dealId: string;
  warnings: { level: "error" | "warn"; message: string }[];
  defaultMethod: string | null;
  defaultTracking: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState(defaultMethod ?? "");
  const [tracking, setTracking] = useState(defaultTracking ?? "");
  const [notes, setNotes] = useState("");

  const hasBlocker = warnings.some((w) => w.level === "error");

  function issue() {
    startTransition(async () => {
      setError(null);
      const result = await issueCiAction(dealId, {
        shippingMethod: method.trim() || null,
        trackingNumber: tracking.trim() || null,
        notes: notes.trim() || null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/deals/${dealId}/docs/${result.docId}?issued=1`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Step 1: チェック */}
      <section className="fade-up-1 card p-6">
        <h2 className="font-extrabold text-matcha-900">Step 1. 発行前チェック</h2>
        {warnings.length === 0 ? (
          <p className="mt-2 text-sm text-green-700">
            ✅ 問題は見つかりませんでした。発行できます
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {warnings.map((w) => (
              <li
                key={w.message}
                className={`rounded-xl px-3 py-2 text-sm ${
                  w.level === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {w.level === "error" ? "❌" : "⚠️"} {w.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Step 2: 発送情報 */}
      <section className="fade-up-2 card p-6">
        <h2 className="font-extrabold text-matcha-900">Step 2. 発送情報</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-sm font-bold text-matcha-800">
              発送方法
            </label>
            <input
              list="shipping-methods"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="input mt-1"
              placeholder="例: FedEx International Priority"
            />
            <datalist id="shipping-methods">
              {SHIPPING_METHODS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-bold text-matcha-800">
              追跡番号
            </label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="input mt-1"
              placeholder="例: 7712 3456 7890"
            />
            <p className="mt-1 text-xs text-matcha-700/50">
              まだ無い場合は空でOK。発行後に案件へ記録して再発行もできます
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-matcha-800">
              追加のNotes(英語・任意)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input mt-1"
            />
          </div>
        </div>
      </section>

      {/* Step 3: 発行 */}
      <section className="fade-up-3 card border-2 border-matcha-300 bg-gradient-to-br from-matcha-50 to-cream-50 p-6">
        <h2 className="font-extrabold text-matcha-900">Step 3. 発行</h2>
        <p className="mt-1 text-xs text-matcha-700/60">
          発行するとCI番号が確定し、記載内容が保存されます。「Reason for export:
          Sale」と宣誓文は自動で記載されます
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            ❌ {error}
          </p>
        )}
        <button
          onClick={issue}
          disabled={pending || hasBlocker}
          className="btn-primary mt-4 !px-7 !py-3 !text-base"
        >
          {pending ? "発行中…" : "CIを発行する(番号を確定)"}
        </button>
      </section>
    </div>
  );
}

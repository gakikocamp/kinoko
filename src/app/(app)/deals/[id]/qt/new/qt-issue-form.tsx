"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueQtAction } from "../../../actions";

const input = "input";

export function QtIssueForm({
  dealId,
  warnings,
}: {
  dealId: string;
  warnings: { level: "error" | "warn"; message: string; fixHref?: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState("");

  const hasBlocker = warnings.some((w) => w.level === "error");

  function issue() {
    startTransition(async () => {
      setError(null);
      const result = await issueQtAction(dealId, {
        notes: notes.trim() || null,
        validityDays,
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
      {/* Step 1: チェックリスト */}
      <section className="card p-6">
        <h2 className="font-extrabold text-matcha-900">
          Step 1. 発行前チェック
        </h2>
        {warnings.length === 0 ? (
          <p className="mt-2 text-sm text-green-700">
            ✅ 問題は見つかりませんでした。発行できます
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {warnings.map((w) => (
              <li
                key={w.message}
                className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  w.level === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                <span>
                  {w.level === "error" ? "❌" : "⚠️"} {w.message}
                </span>
                {w.fixHref && (
                  <Link
                    href={w.fixHref}
                    className="shrink-0 font-medium underline"
                  >
                    直しに行く
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Step 2: 追加情報 */}
      <section className="card p-6">
        <h2 className="font-extrabold text-matcha-900">
          Step 2. この書類の追加情報
        </h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              有効期限(日数)
            </label>
            <input
              type="number"
              min={0}
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className={`${input} max-w-32`}
            />
            <p className="mt-1 text-xs text-gray-400">
              為替変動に備えて必ず期限を付けます(推奨30日)。Notesに英語で自動記載されます
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              追加のNotes(英語・任意)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={input}
              placeholder="例: Estimated production lead time: 3 weeks after payment."
            />
          </div>
        </div>
      </section>

      {/* Step 3: 発行 */}
      <section className="card border-2 border-matcha-300 bg-gradient-to-br from-matcha-50 to-cream-50 p-6">
        <h2 className="font-extrabold text-matcha-900">Step 3. 発行</h2>
        <p className="mt-1 text-xs text-gray-600">
          発行すると見積番号(QT-)が確定し、記載内容が保存されます。発行後は変更できません(修正は改訂版の発行)
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            ❌ {error}
          </p>
        )}
        <button
          onClick={issue}
          disabled={pending || hasBlocker}
          className="btn-primary mt-4 !px-7 !py-3 !text-base"
        >
          {pending ? "発行中…" : "見積書を発行する(番号を確定)"}
        </button>
        {hasBlocker && (
          <p className="mt-2 text-xs text-red-600">
            ❌ の項目をすべて解消すると発行できます
          </p>
        )}
      </section>
    </div>
  );
}
